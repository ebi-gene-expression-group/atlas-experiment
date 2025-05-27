import {isEqual, intersection, isEmpty, sortBy, uniq} from 'lodash'

/*
1) filterFactors -> selectedColumnIds
The filter selection is read in from the filter factors stored in the URL as follows:
- filter factors empty or none - use default filters
- some values - select these filters, and default other filters to "all"
The set of selected ids S is then an intersection of selected values in each filter.

2) selectedColumnIds -> filterFactors
The filter factors are written to the URL , for a set of selected ids S', as follows:
- for each type, the filter factor values are initially the filter factor values that intersect with S'
- try extend each type to all if it doesnt change the selected set S', for simpler URLs
_____
We'd wish that:
1.2 ~= identity on sets of selected ids
2.1 ~= identity on URL strings
and it's not quite true but it's actually not too bad.

Let X be any set of selected ids. Then 1.2(X) contains X.

Observe that when the filter selection is F1...Fn, F1...Fi are experimental factors for the experiment.
So for any id x there are f1 in F1 ... fi in Fi such that intersection of f1...fi is x by what the factors are.
So for any X there is a filter choice C such that 1(C) = X and 2(X)~=C , so 1.2(X) = X.

Let S be a set reachable from starting from nothing/all/initial position and then toggling filters.
I also think 2.1.2(S) = 2(S) i.e. for all urls that come up naturally the back-and-forth doesn't change them.
I might be wrong.
_____

The initial filters and the filters later are different - we don't use "selected" since
we select the set, but it is convenient for curators to provide initial selections
like they are used to.
*/

const idsSelectedInInitialFilter = ({name, groupings, selected}) => (
  [].concat.apply([],
    [`all`, `ALL`].indexOf(selected) > -1
      ? groupings
        .map((g) => g[1])
      : groupings
        .filter((g) => selected.indexOf(g[0]) > -1 )
        .map((g) => g[1])
  )
)

const fakeAnInitialFilter = ({name, groupings} , filterFactors) => (
  {name, groupings, selected: filterFactors[name] || `all`}
)

const selectedIdsFromFilterFactors = (filters, filterFactors) => (
  intersection.apply([],
    filters.map((_filter) => (
      idsSelectedInInitialFilter(fakeAnInitialFilter(_filter, filterFactors))
    ))
  )
)

const selectedColumnIdsFromInitialGroups = (initialFilters) => (
  intersection.apply([],initialFilters.map(idsSelectedInInitialFilter))
)

const allColumnIdsFromInitialGroups = (initialFilters) => (
  intersection.apply([],initialFilters.map(idsSelectedInInitialFilter))
)


const copyWithOnePropertyDifferent = (objectToCopy, newPropertyName, newPropertyValue) => {
  const result = Object.assign({}, objectToCopy)
  result[newPropertyName] = newPropertyValue
  return result
}


const makeFilterFactorsGivenSelectedIds = (filters, selectedIds) => {
  const filterFactors = {}

  filters
    .forEach(({name, groupings, values}) => {
      filterFactors[name] =
      groupings
        .filter((g) => (
          intersection(selectedIds, g[1]).length
        ))
        .map((g) => g[0])
    })
  /*
    If a factor value is behaving the same as "all", make it all.
    Sort to try eliminate largest subsets first.
  */
  sortBy(Object.entries(filterFactors),
    p => -p[1].length + ` ` + p[0]
  )
    .map(p => p[0])
    .forEach((factorType) => {
      if(isEqual(
        new Set(selectedIds),
        new Set(selectedIdsFromFilterFactors(
          filters,
          copyWithOnePropertyDifferent(filterFactors, factorType, `all`)
        ))
      )) {
        filterFactors[factorType] = `all`
      }
    })

  const sparserFilterFactors = {}
  Object.keys(filterFactors)
    .forEach((factorType) => {
      if([`all`, `ALL`].indexOf(filterFactors[factorType]) == -1){
        sparserFilterFactors[factorType] = filterFactors[factorType]
      }
    })

  return sparserFilterFactors
}

const decode = (encodedV, defaultV, validateV) => {
  const fallback = typeof defaultV === `function` ? defaultV : () => defaultV
  const precondition = typeof validateV === `function` ? validateV : (v) => !!v
  const s = encodedV ? decodeURIComponent(encodedV) : ``

  if (precondition(s)) {
    try {
      return JSON.parse(s)
    } catch (err) {
      return fallback(s)
    }
  } else {
    return fallback(s)
  }
}


const encode = (v) => (
  encodeURIComponent(JSON.stringify(v))
)


const toQuery = ({groups}, queryObjects) => Object.assign({
  specific: encode(queryObjects.specific),
  geneQuery: encode(queryObjects.geneQuery),
  filterFactors: encode(
    makeFilterFactorsGivenSelectedIds(groups,queryObjects.selectedColumnIds)
  ),
  cutoff: encode(queryObjects.cutoff)
}, [`UP`,`DOWN`,`UP_DOWN`].indexOf(queryObjects.regulation)>-1
  ? {regulation: encode(queryObjects.regulation)}
  : {},
queryObjects.unit
  ? {unit: encode(queryObjects.unit)}
  : {}
)

const defaultRegulation = ({isDifferential}) => (
  isDifferential
    ? `UP_DOWN`
    : `OFF`
)

const defaultCutoff = ({isDifferential, isProteomics, isRnaSeq}) => (
  isDifferential
    ? {
      foldChange: isProteomics ? 0.5 : 1.0,
      pValue: 0.05
    }
    : {
      value: isRnaSeq? 0.5 : 1e-6
    }
)

const defaultUnit = ({isDifferential, isRnaSeq, availableDataUnits}) => (
  (isRnaSeq && !isDifferential && availableDataUnits.length)
    ? availableDataUnits[0]
    : ``
)

const makeIntoGeneQueryFormat = (v) => {
  const strippedV = v.replace(/\W/g, ``)
  return (
    strippedV
      ? [{value:strippedV}]
      : []
  )
}

const makeIntoArray = (v) => {
  const strippedV = v.replace(/\W/g, ``)
  return (
    strippedV
      ? [strippedV]
      : []
  )
}

const _validateOrElse = (condition, defaultValue, value) => (
  condition(value) ? value : defaultValue
)
const looksLikeEncodedArray = (v) => v.match(/\[.*\]/)

const fromConfigAndQuery = (config, query) => ({
  specific: decode(query.specific , false),
  geneQuery: decode(query.geneQuery , makeIntoGeneQueryFormat , looksLikeEncodedArray),
  selectedColumnIds:
    uniq(
      _validateOrElse(
        (ids) => Array.isArray(ids) && ids.length && uniq(ids).length === intersection(ids, allColumnIdsFromInitialGroups(config.groups)).length,
        isEmpty(query.filterFactors)
          ? selectedColumnIdsFromInitialGroups(config.groups)
          : selectedIdsFromFilterFactors(config.groups,decode(query.filterFactors)),
        decode(
          query.selectedColumnIds,
          makeIntoArray,
          looksLikeEncodedArray,
        )
      )
    ),
  cutoff: decode(query.cutoff, defaultCutoff(config)),
  regulation: decode(query.regulation, defaultRegulation(config)),
  unit: decode(query.unit, defaultUnit(config))
})


// should be in sync with backend - see ExperimentPageRequestPreferencesPropertyNamesTest.java
// see QueryPropTypes from PropTypes.js
const heatmapCallbackParametersFromQueryObjects = ({
  specific,
  geneQuery,
  selectedColumnIds,
  cutoff,
  regulation,
  unit
}, isDifferential) => Object.assign(
  {
    specific,
    geneQuery:JSON.stringify(geneQuery),
    selectedColumnIds: selectedColumnIds.join(`,`)
  },
  isDifferential && regulation!==`OFF`
    ? {regulation}
    : {},
  isDifferential
    ? {}
    : {unit},
  isDifferential
    ? {
      cutoff: cutoff.pValue,
      foldChangeCutoff: cutoff.foldChange
    }
    : {
      cutoff: cutoff.value
    }
)

const toBaselineRequestPreferences = (queryObjects) => heatmapCallbackParametersFromQueryObjects(queryObjects, false)
const toDifferentialRequestPreferences = (queryObjects) => heatmapCallbackParametersFromQueryObjects(queryObjects, true)

export {
  toQuery,
  fromConfigAndQuery,
  toBaselineRequestPreferences,
  toDifferentialRequestPreferences
}
