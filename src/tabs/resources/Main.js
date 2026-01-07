import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-refetch'
import Icon from './Icon.js'
import {uniq} from 'lodash'
import URI from 'urijs'
import Disclaimers from '@ebi-gene-expression-group/expression-atlas-disclaimers'
import {Button} from 'react-bootstrap/lib'
import {ArchiveResources} from "./ArchiveResources"
import {DisplayIf} from "./DisplayIf"

const ResourcesSection = ({values, pathToResources, atlasUrl}) => {
  const subsections = uniq(values.map((value)=> (
    value.group
  )))

  return (
    <ul style={{listStyle: `none`, marginLeft: `0rem`}}>
      {
        subsections.filter(el=>el).length < 2
          ? values.map((value, ix) => (
            <li key={ix}>
              <a href={URI(value.url, atlasUrl)}>
                <p>
                  <Icon type={value.type} {...{pathToResources}}  />
                  {value.description}
                </p>
              </a>
            </li>
          ))
          : subsections.map((subsectionName, ix) => (
            <li key={ix}>
              <ul style={{listStyle: `none`, marginLeft: `0rem`}} >
                <i>{subsectionName}</i>
                {
                  values.filter((value) => (
                    subsectionName === value.group
                  ))
                    .map((value, jx) => (
                      <li key={jx} className="margin-left-large">
                        <a href={URI(value.url, atlasUrl)}>
                          <div>
                            <p>
                              <Icon type={value.type} {...{pathToResources}}/> {value.description}
                            </p>
                          </div>
                        </a>
                      </li>
                    ))
                }
              </ul>
            </li>
          ))
      }
    </ul>
  )
}

class DisclaimerWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {
      needsAck : Boolean(this.props.disclaimer && Disclaimers[this.props.disclaimer])
    }
  }

  render() {
    const Disclaimer = Disclaimers[this.props.disclaimer]
    return (
      <div>
        { this.state.needsAck ? (
          <>
            <Disclaimer/>
            <Button onClick={ () => this.setState({ needsAck: false }) }>
              Continue to download
            </Button>
          </>
        ) : (
          this.props.children
        )}
      </div>
    )
  }
}

DisclaimerWrapper.propTypes = {
  disclaimer: PropTypes.string,
  children: PropTypes.element.isRequired
}

class ResourcesTab extends Component {
  render() {
    const {resourcesFetch, atlasUrl, pathToResources, disclaimer, experimentAccession, url} = this.props
    if (resourcesFetch.pending) {
      return (
        <div className={`row column expanded margin-top-large`}>
          <img src={URI(`resources/images/loading.gif`, atlasUrl)} alt={'Loading...'} />
        </div>
      )
    } else if (resourcesFetch.rejected) {
      return (
        <div className={`row column expanded margin-top-large`}>
          <p>Error: {resourcesFetch.reason}</p>
        </div>
      )
    } else if (resourcesFetch.fulfilled) {
      const resources = resourcesFetch.value;
      const archiveResources = resources.filter(value => value.isExternalResource );
      const metadataResources = resources.filter(value => !value.isExternalResource );

      const tabName = url.split('/').pop();
      const downloadTabName = `DATA`

      return (
        resourcesFetch.value.length >= 1 &&
        <DisclaimerWrapper disclaimer={disclaimer}>
          <div className={`small-12 columns margin-bottom-xlarge`}>
            <h3 key={`title`}>Curated Analysis Files</h3>
            <p>Processed expression data, experimental design, and R-ready results:</p>
            <ResourcesSection
              values={metadataResources}
              {...{pathToResources, atlasUrl}} />
          </div>
          <DisplayIf condition={tabName === downloadTabName}>
            <div className={`small-12 columns margin-bottom-xlarge`}>
              <h3 key={`title`}>Full Experiment Archive (FTP)</h3>
              <span>Access intermediate analysis files and bulk outputs on our <a
                href={`https://ftp.ebi.ac.uk/pub/databases/microarray/data/atlas/experiments/${experimentAccession}`}>{`FTP site`}</a>.
              </span>
            </div>
            <ArchiveResources archiveResources={archiveResources} {...{pathToResources}} />
          </DisplayIf>
        </DisclaimerWrapper>
      )
    }
  }
}

export default connect(props => ({
  resourcesFetch: URI(props.url, props.atlasUrl).toString()
}))(ResourcesTab)
