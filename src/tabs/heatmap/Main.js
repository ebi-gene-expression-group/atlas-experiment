import React from 'react'
import PropTypes from 'prop-types'

import Sidebar from './QuerySelectingSidebar.js'
import {toQuery as queryFromQueryObjects, fromConfigAndQuery as queryObjectsFromConfigAndQuery,
  toBaselineRequestPreferences, toDifferentialRequestPreferences} from './CreateQueryObjects.js'
import {InitialColumnGroupPropTypes, QueryPropTypes} from './PropTypes.js'
import {withRouter} from 'react-router-dom'
import ExpressionAtlasHeatmap from '@ebi-gene-expression-group/expression-atlas-heatmap-highcharts'
import URI from 'urijs'
import queryStringUtils from 'qs'


const Main = (props) => {
  const queryObjects = queryObjectsFromConfigAndQuery(props, props.query)

  return (
    <div className={`row expanded column margin-top-large`}>
      <div className={`small-3 medium-2 columns padding-left-none`} style={{overflowX: `hidden`}} >
        <Sidebar
          isDifferential={props.isDifferential}
          geneSuggesterUri={URI(`json/suggestions`, props.atlasUrl).addSearch(props.species ? {species: props.species} : {})}
          genesDistributedByCutoffUrl={
            props.isDifferential ? `` :
              URI(props.genesDistributedByCutoffUrl, props.atlasUrl).addSearch(props.isRnaSeq ? {unit: queryObjects.unit} : {}).toString()}
          loadingGifUrl={URI(`resources/images/loading.gif`, props.atlasUrl).toString()}
          columnGroups={props.groups}
          defaultQuery={Object.keys(props.query).length === 0}
          availableDataUnits={props.availableDataUnits}
          queryObjects={queryObjects}
          onChangeQueryObjects={ (newQueryObjects) => {
              //if user select a specific gene, then disable most-specific
            newQueryObjects.specific = newQueryObjects.geneQuery.length >= 1 ? false : newQueryObjects.specific

            props.history.push(Object.assign({},
              props.location,
              {search: queryStringUtils.stringify(queryFromQueryObjects(props, newQueryObjects))}
            ))
          }
          }
        />
      </div>
      <div className={`small-9 medium-10 columns padding-right-none`}>
        <ExpressionAtlasHeatmap
          atlasUrl={props.atlasUrl}
          isWidget={false}
          isMultiExperiment={false}
          isDifferential={props.isDifferential}
          experiment={props.experimentAccession}
          query={Object.assign(
            props.accessKey ? {accessKey: props.accessKey} : {},
            (props.isDifferential
              ? toDifferentialRequestPreferences
              : toBaselineRequestPreferences)(queryObjects)
          )}
        />
      </div>
    </div>
  )
}

Main.propTypes = {
  experimentAccession: PropTypes.string.isRequired,
  accessKey: PropTypes.string,
  isDifferential: PropTypes.bool.isRequired,
  isProteomics: PropTypes.bool.isRequired,
  isRnaSeq: PropTypes.bool.isRequired,
  atlasUrl: PropTypes.string.isRequired,
  species: PropTypes.string.isRequired,
  groups: PropTypes.arrayOf(PropTypes.shape(InitialColumnGroupPropTypes)).isRequired,
  genesDistributedByCutoffUrl:PropTypes.string.isRequired,
  availableDataUnits:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  query: PropTypes.shape(QueryPropTypes).isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
}

export default withRouter(Main)
