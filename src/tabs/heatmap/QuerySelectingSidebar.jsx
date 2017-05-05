import React from 'react'
import {Modal, Button, Glyphicon} from 'react-bootstrap/lib'
import {intersection, union, isEqual, flow, xor} from 'lodash'
import pluralize from 'pluralize'
import URI from 'urijs'

import Genes from './genes/Main.jsx'
import {Main as HeatmapColumnsChoice, Summary as HeatmapColumnsSummary} from './column-filters/Main.jsx'
import Cutoff from './Cutoff.jsx'
import CutoffDistribution from './CutoffDistribution.jsx'
import Regulation from './Regulation.jsx'
import Specificity from './Specificity.jsx'

import {ColumnGroupPropTypes, QueryObjectsPropTypes} from './PropTypes.js'
import './bootstrap-toggle.min.css'

const prettyName = (name) => (
  name
    .replace(/_/g, ` `)
    .toLowerCase()
    .replace(/\w\S*/, (txt) => (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()))
)

const OpenerButton = ({
  onClickButton
}) => (
  <Button bsSize="large" onClick={onClickButton}
          style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>
    <Glyphicon glyph="equalizer" />
    <span style={{verticalAlign: `middle`}}> Select</span>
  </Button>
)

OpenerButton.propTypes = {
  onClickButton : React.PropTypes.func.isRequired
}

const ModalWrapper = ({title, show, onCloseModal, onClickApply, children}) =>
  <Modal show={show} onHide={onCloseModal} bsSize="large">
    <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>

    <Modal.Body>{children}</Modal.Body>

    <Modal.Footer>
      { onClickApply && <Button bsStyle="primary"
                                onClick={onClickApply}
                                style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>Apply
                        </Button>
      }
      <Button onClick={onCloseModal}
              style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>Close
      </Button>
    </Modal.Footer>
  </Modal>

ModalWrapper.propTypes = {
  show: React.PropTypes.bool.isRequired,
  onCloseModal: React.PropTypes.func.isRequired,
  onClickApply: React.PropTypes.func
}


const determineAvailableColumns = (columnGroups) => (
  intersection.apply([],
    columnGroups.map((group) => (
      union.apply([],
        group.groupings
        .map((g)=> g[1])
      )
    ))
  )
)

const determineColumnNameFromFirstGroup = (availableColumnIds, group) => {
  const groupingValues = group.groupings.map((g)=> g[1])
  if (isEqual(
    new Set(availableColumnIds),
    new Set([].concat.apply([], groupingValues))
  ) && groupingValues.every((ids)=> ids.length === 1)){
    return pluralize(prettyName(group.name))
  } else {
    return ``
  }
}

const Header = ({text}) => (
    <h4>
      {text}
    </h4>
)

const SidebarAndModal = React.createClass({
  propTypes : {
    isDifferential: React.PropTypes.bool.isRequired,
    geneSuggesterUri: React.PropTypes.instanceOf(URI),
    genesDistributedByCutoffUrl: React.PropTypes.string.isRequired,
    loadingGifUrl: React.PropTypes.string.isRequired,
    columnGroups: React.PropTypes.arrayOf(React.PropTypes.shape(ColumnGroupPropTypes)).isRequired,
    queryObjects: React.PropTypes.shape(QueryObjectsPropTypes).isRequired,
    onChangeQueryObjects: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      showModal: ``,
      geneQuery: this.props.queryObjects.geneQuery,
      selectedColumnIds: this.props.queryObjects.selectedColumnIds,
      initialFilters: true
    }
  },

  render(){
    const showRegulation = [`UP`, `DOWN`, `UP_DOWN`].includes(this.props.queryObjects.regulation);
    const availableColumnIds = determineAvailableColumns(this.props.columnGroups);
    const columnsName =
      this.props.isDifferential
      ? `Comparisons`
      : determineColumnNameFromFirstGroup(availableColumnIds, this.props.columnGroups[0]) || `Sample properties`

    const onChangeProperty = (name, newValue) => {
      const newQueryObjects = Object.assign({}, this.props.queryObjects)
      newQueryObjects[name] = newValue
      return this.props.onChangeQueryObjects(newQueryObjects)
    }
    const toggleModal = (which) => this.setState({showModal: which || ''})
    const resetState = () => this.setState(this.getInitialState())
    return (
      <div>
        <Header text="Genes"/>
        <Genes
          geneSuggesterUri={this.props.geneSuggesterUri}
          geneQuery={this.state.geneQuery}
          onChangeGeneQuery={(geneQuery) => {
            this.setState({geneQuery})
          }}/>
        <Button onClick={onChangeProperty.bind(null, "geneQuery", this.state.geneQuery)}
                style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>
          <span style={{verticalAlign: `middle`}}> Apply </span>
        </Button>
        <Button onClick={resetState}
                style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>
          <span style={{verticalAlign: `middle`}}> Reset </span>
        </Button>

        <Specificity
          specific={this.props.queryObjects.specific}
          onChangeSpecific={onChangeProperty.bind(null, "specific")}/>
        {showRegulation &&
          <Regulation
          regulation={this.props.queryObjects.regulation}
          onChangeRegulation={onChangeProperty.bind(null, "regulation")}/>
        }
        <Cutoff
          cutoff={this.props.queryObjects.cutoff}
          onChangeCutoff={onChangeProperty.bind(null, "cutoff")}
        />
        {this.props.genesDistributedByCutoffUrl
          && (
          <div>
            <a href="#" onClick={toggleModal.bind(null,"cutoff")} style={{marginBottom: `0.5rem`, fontSize: `85%`}}>
              <Glyphicon glyph="stats"/>
              <span style={{marginLeft:"0.25rem"}}>See distribution</span>
            </a>
            <ModalWrapper
              title={`Cutoff - distribution of genes`}
              show={this.state.showModal === `cutoff`}
              onCloseModal={resetState}>

              <CutoffDistribution cutoff={this.props.queryObjects.cutoff}
                                  onChangeCutoff={flow([onChangeProperty.bind(null, "cutoff"), toggleModal.bind(null, "")])}
                                  genesDistributedByCutoffUrl={this.props.genesDistributedByCutoffUrl}
              />
            </ModalWrapper>
          </div>
          )
        }
        <br/>
        <Header text={columnsName}/>
        <OpenerButton onClickButton={toggleModal.bind(null, "columns")} />
        <HeatmapColumnsSummary
          columnGroups={this.props.columnGroups}
          selectedColumnIds={this.state.selectedColumnIds}
          {...{availableColumnIds,columnsName}}
          />

        <ModalWrapper
          title={columnsName}
          show={this.state.showModal === `columns`}
          onCloseModal={resetState}
          onClickApply={flow([
            toggleModal.bind(null, ""),
            this.setState.bind(this, {initialFilters: this.state.initialFilters && xor(this.state.selectedColumnIds, this.props.queryObjects.selectedColumnIds).length === 0}),
            onChangeProperty.bind(null, "selectedColumnIds", this.state.selectedColumnIds)
          ])} >

          <HeatmapColumnsChoice
            columnGroups={this.props.columnGroups}
            selectedColumnIds={this.state.selectedColumnIds}
            {...{availableColumnIds,columnsName}}
            onNewSelectedColumnIds={(selectedColumnIds) => {
              this.setState({selectedColumnIds})
            }}/>
        </ModalWrapper>
          {this.state.initialFilters &&
            <div className="margin-top-xlarge">
              <h5>Initially showing:</h5>
              <ul>
                {this.props.columnGroups.filter(group => group.primary)
                  .map(primaryGroup => <li>{prettyName(primaryGroup.name)}: {primaryGroup.selected}</li>)}
              </ul>
            </div>
          }
    </div>
    )
  }
})

export default SidebarAndModal
