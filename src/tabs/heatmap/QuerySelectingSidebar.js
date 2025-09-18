import React from 'react'
import PropTypes from 'prop-types'

import {Modal, Button, Glyphicon} from 'react-bootstrap/lib'
import {intersection, union, isEqual, flow, xor} from 'lodash'
import pluralize from 'pluralize'
import URI from 'urijs'

import Genes from './genes/Main.js'
import {Main as HeatmapColumnsChoice, Summary as HeatmapColumnsSummary} from './column-filters/Main.js'
import Cutoff from './Cutoff.js'
import CutoffDistribution from './CutoffDistribution.js'
import Regulation from './Regulation.js'
import Unit from './Unit.js'
import Specificity from './Specificity.js'

import {ColumnGroupPropTypes, QueryObjectsPropTypes} from './PropTypes.js'
import './bootstrap-toggle.min.css'

const prettyName = (name) => (
  name
    .replace(/_/g, ` `)
    .toLowerCase()
    .replace(/\w\S*/, (txt) => (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()))
)


const OpenerButton = ({onClickButton}) =>
  <Button bsSize={`large`} onClick={onClickButton}
    style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>
    <Glyphicon glyph={`equalizer`} />
    <span style={{verticalAlign: `middle`}}> Select</span>
  </Button>

OpenerButton.propTypes = {
  onClickButton : PropTypes.func.isRequired
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
  show: PropTypes.bool.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onClickApply: PropTypes.func
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

class SidebarAndModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      showModal: ``,
      geneQuery: this.props.queryObjects.geneQuery,
      selectedColumnIds: this.props.queryObjects.selectedColumnIds,
      initialFilters: true
    }
  }

  render() {
    const showRegulation = [`UP`, `DOWN`, `UP_DOWN`].includes(this.props.queryObjects.regulation)
    const availableColumnIds = determineAvailableColumns(this.props.columnGroups)
    const maybeColumnsName =
      this.props.isDifferential
        ? `Comparisons`
        : determineColumnNameFromFirstGroup(availableColumnIds, this.props.columnGroups[0])

    const heatmapColumns = {
      columnGroups: this.props.columnGroups,
      selectedColumnIds: this.state.selectedColumnIds,
      availableColumnIds,
      columnsName: maybeColumnsName || `Sample groups`
    }

    const onChangeProperty = (name, newValue) => {
      const newQueryObjects = Object.assign({}, this.props.queryObjects)
      newQueryObjects[name] = newValue
      return this.props.onChangeQueryObjects(newQueryObjects)
    }
    const toggleModal = (which) => this.setState({showModal: which || ``})

    return (
      <div>
        <Header text={`Genes`}/>
        <Genes geneSuggesterUri={this.props.geneSuggesterUri}
          geneQuery={this.state.geneQuery}
          onChangeGeneQuery={(geneQuery) => { this.setState({geneQuery}) }}/>

        <div className={`row column margin-top-large`}>
          <Button onClick={onChangeProperty.bind(null, `geneQuery`, this.state.geneQuery)}
            style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`, marginRight: `1rem`}}>
          Apply
          </Button>
          <Button onClick={() => this.setState({geneQuery: []})} style={{textTransform: `unset`, letterSpacing: `unset`, height: `unset`}}>
          Clear
          </Button>
        </div>

        <Specificity
          isVisible={this.props.queryObjects.geneQuery.length > 0 ? `hidden` : `visible`}
          specific={this.props.queryObjects.specific}
          isDifferential={this.props.isDifferential}
          onChangeSpecific={onChangeProperty.bind(null, `specific`)}/>
        {showRegulation &&
          <Regulation
            regulation={this.props.queryObjects.regulation}
            onChangeRegulation={onChangeProperty.bind(null, `regulation`)}/>
        }
        <Cutoff
          cutoff={this.props.queryObjects.cutoff}
          onChangeCutoff={onChangeProperty.bind(null, `cutoff`)}
        />
        {this.props.genesDistributedByCutoffUrl
          && (
            <div>
              <a href={`#`} onClick={toggleModal.bind(null, `cutoff`)} style={{marginBottom: `0.5rem`, fontSize: `85%`}}>
                <Glyphicon glyph="stats"/>
                <span style={{marginLeft:`0.25rem`}}>See distribution</span>
              </a>
              <ModalWrapper
                title={`Cutoff - distribution of genes`}
                show={this.state.showModal === `cutoff`}
                onCloseModal={() => { this.setState({ showModal: `` }) }}>

                <CutoffDistribution
                  cutoff={this.props.queryObjects.cutoff}
                  unit={this.props.queryObjects.unit}
                  onChangeCutoff={flow([onChangeProperty.bind(null, `cutoff`), toggleModal.bind(null, ``)])}
                  genesDistributedByCutoffUrl={this.props.genesDistributedByCutoffUrl}
                />
              </ModalWrapper>
            </div>
          )
        }
        {
          !!this.props.availableDataUnits.length && (
            <div>
              <br/>
              <Header text={`Data units`}/>
              <Unit
                unit={this.props.queryObjects.unit}
                available={this.props.availableDataUnits}
                onChangeUnit={onChangeProperty.bind(null, `unit`)} />
            </div>
          )
        }
        <br/>
        <Header text={maybeColumnsName || `Experimental variables`}/>
        <div className={`row column margin-bottom-medium`}>
          <OpenerButton onClickButton={toggleModal.bind(null, `columns`)} />
        </div>
        <HeatmapColumnsSummary {...heatmapColumns} />
        <ModalWrapper
          title={maybeColumnsName || `Experimental variables`}
          show={this.state.showModal === `columns`}
          onCloseModal={() => { this.setState({ showModal: ``, selectedColumnIds: this.props.queryObjects.selectedColumnIds }) }}
          onClickApply={flow([
            toggleModal.bind(null, ``),
            this.setState.bind(this, {initialFilters: this.state.initialFilters && xor(this.state.selectedColumnIds, this.props.queryObjects.selectedColumnIds).length === 0}),
            onChangeProperty.bind(null, `selectedColumnIds`, this.state.selectedColumnIds)
          ])} >

          <HeatmapColumnsChoice {...heatmapColumns}
            isDifferential={this.props.isDifferential}
            onNewSelectedColumnIds={(selectedColumnIds) => {
              this.setState({selectedColumnIds})
            }}/>
        </ModalWrapper>

        {this.props.defaultQuery && this.state.initialFilters &&
          <div className={`margin-top-medium`}>
            <p className={`margin-bottom-small`}>Initially showing:</p>
            <ul className={`small`}>
              {this.props.columnGroups.filter(group => group.groupings.length > 1)
                .map(group => <li key={group.name}>{prettyName(group.name)}: {group.selected}</li>)}
            </ul>
          </div>
        }
      </div>
    )
  }
}

SidebarAndModal.propTypes = {
  isDifferential: PropTypes.bool.isRequired,
  geneSuggesterUri: PropTypes.instanceOf(URI),
  defaultQuery: PropTypes.bool.isRequired,
  genesDistributedByCutoffUrl: PropTypes.string.isRequired,
  loadingGifUrl: PropTypes.string.isRequired,
  columnGroups: PropTypes.arrayOf(PropTypes.shape(ColumnGroupPropTypes)).isRequired,
  availableDataUnits:PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  queryObjects: PropTypes.shape(QueryObjectsPropTypes).isRequired,
  onChangeQueryObjects: PropTypes.func.isRequired
}

export default SidebarAndModal
