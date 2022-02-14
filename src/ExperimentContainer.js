import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter, Route, Switch, Redirect, NavLink, withRouter } from 'react-router-dom'

import queryStringUtils from 'qs'
import URI from 'urijs'

import Heatmap from './tabs/heatmap/Main.js'
import ExperimentDesign from './tabs/experiment-design/Main.js'
import Resources from './tabs/resources/Main.js'
import StaticTable from './tabs/StaticTable.js'
import QCReport from './tabs/qc-report/Main.js'

const TabPropType = PropTypes.shape({
  type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  props: PropTypes.object.isRequired
})

//coupled to ExperimentController.java
const componentsPerTab = {
  'multipart' : ``,
  'heatmap' : Heatmap,
  'experiment-design' : ExperimentDesign,
  'resources' : Resources,
  'static-table' : StaticTable,
  'qc-report' : QCReport
}

const createPageSection = ({type, props}) => {

  const Tab = componentsPerTab[type]
  return (
    <Tab {...props} />
  )
}

const createPage = ({type, commonProps, tabProps}) => (
  type === `multipart`
    ? (
      <div className="row expanded column margin-top-large">
        {tabProps.sections.map(({type, name, props}) => (
          <div key={name} className="row column expanded">
            <h4>
              {name}
            </h4>
            {
              createPageSection({type, props: Object.assign({}, commonProps, props)})
            }
          </div>
        ))}
      </div>
    )
    : createPageSection({type, props: Object.assign({}, commonProps, tabProps)})
)

const queryFromRouteDetails = ({location:{search}}) => queryStringUtils.parse(search.replace(/^\?/, ``))

const makeTab = ({type,commonProps, tabProps}) => (
  (routeDetails) => createPage({type, commonProps: Object.assign({}, commonProps, {query: queryFromRouteDetails(routeDetails)}), tabProps})
)

const makeTopRibbon = (tabNames) => (
  withRouter(
    ({location}) =>
      <ul className="tabs">
        {tabNames.map(tabName => (
          <li title={tabName} key={tabName} className="tabs-title">
            <NavLink
              to={{pathname:`/${tabName}`, search: location.search, hash: location.hash}}
              activeStyle={{color: `#0a0a0a`, background: `#e6e6e6`}}>
              {tabName}
            </NavLink>
          </li>
        ))}
      </ul>
  )
)

class RedirectToTabWithLocation extends React.Component {
  render () {
    return (
      <Redirect to={{
        pathname: `/${this.props.tabName}`,
        search: this.props.location.search,
        hash: this.props.location.hash}} />
    )
  }
}
const RedirectToTab = withRouter(RedirectToTabWithLocation)


const ExperimentContainerRouter = ({
  atlasUrl,
  pathToResources,
  experimentAccession,
  experimentType,
  accessKey,
  species,
  disclaimer,
  tabs
}) => {
  const commonProps = Object.assign(
    {
      atlasUrl,
      pathToResources,
      experimentAccession,
      experimentType,
      accessKey,
      species,
      disclaimer
    },
    {
      isDifferential: experimentType.toLowerCase().includes(`differential`),
      isProteomics: experimentType.toLowerCase().includes(`proteomics`),
      isRnaSeq: experimentType.toLowerCase().replace(`_`, ``).includes(`rnaseq`)
    }
  )

  return (
    <BrowserRouter basename={URI(`experiments/${experimentAccession}`, atlasUrl).toString()}>
      <div>
        <Route path={`/`} component={makeTopRibbon(tabs.map((tab)=>tab.name))} />
        <Switch>
          {
            tabs
              .map((tab)=>
                <Route
                  key={tab.name}
                  path={`/${tab.name}`}
                  component={makeTab({type:tab.type, commonProps: commonProps, tabProps: tab.props})}
                />
              )
          }
          <RedirectToTab tabName={tabs[0].name} />
        </Switch>
      </div>
    </BrowserRouter>
  )
}

ExperimentContainerRouter.propTypes = {
  atlasUrl: PropTypes.string.isRequired,
  pathToResources: PropTypes.string.isRequired,
  experimentAccession: PropTypes.string.isRequired,
  experimentType: PropTypes.string.isRequired,
  accessKey: PropTypes.string,
  species: PropTypes.string.isRequired,
  tabs: PropTypes.arrayOf(TabPropType).isRequired,
  disclaimer: PropTypes.string.isRequired
}

export default ExperimentContainerRouter
