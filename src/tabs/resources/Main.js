import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-refetch'
import Icon from './Icon.js'
import {uniq} from 'lodash'
import URI from 'urijs'
import Disclaimers from '@ebi-gene-expression-group/expression-atlas-disclaimers'
import {Button} from 'react-bootstrap/lib'

const ResourcesSection = ({values, pathToResources, atlasUrl}) => {
  const subsections = uniq(values.map((value)=> (
    value.group
  )))

  return (
    <div className="row column expanded margin-top-large">
      <ul style={{listStyle: `none`}}>
        {
          subsections.filter(el=>el).length < 2
            ? values.map((value, ix, self) => (
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
                <ul style={{listStyle: `none`}} className="margin-left-none margin-bottom-medium">
                  <i>{
                    subsectionName}
                  </i>
                  {
                    values.filter((value) => (
                      subsectionName === value.group
                    ))
                      .map((value, jx, self) => (
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
    </div>
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
    const {resourcesFetch, atlasUrl, pathToResources, disclaimer} = this.props

    if (resourcesFetch.pending) {
      return (
        <div className={`row column expanded margin-top-large`}>
          <img src={URI(`resources/images/loading.gif`, atlasUrl)} />
        </div>
      )
    } else if (resourcesFetch.rejected) {
      return (
        <div className={`row column expanded margin-top-large`}>
          <p>Error: {resourcesFetch.reason}</p>
        </div>
      )
    } else if (resourcesFetch.fulfilled) {
      return (
        <DisclaimerWrapper disclaimer={disclaimer}>
          <ResourcesSection
            values={resourcesFetch.value}
            {...{ pathToResources, atlasUrl }} />
        </DisclaimerWrapper>
      )
    }
  }
}

export default connect(props => ({
  resourcesFetch: URI(props.url, props.atlasUrl).toString()
}))(ResourcesTab)
