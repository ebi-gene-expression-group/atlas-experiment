import React from 'react'
import PropTypes from 'prop-types'
import URI from 'urijs'
import ResourcePropTypes from './ResourcePropTypes.js'

const RESOURCE_ICONS = [
  [`icon-pdf`, require(`./assets/pdf.png`)],
  [`icon-geo`, require(`./assets/geo.png`)],
  [`icon-ena`, require(`./assets/ena.png`)],
  [`icon-ega`, require(`./assets/ega.png`)],
  [`icon-gsea-reactome`, require(`./assets/gsea-reactome.png`)],
  [`icon-gsea-interpro`, require(`./assets/gsea-interpro.png`)],
  [`icon-gsea-go`, require(`./assets/gsea-go.png`)],
  [`icon-ma`, require(`./assets/ma-plot.png`)],
  [`icon-ae`, require(`./assets/ae-logo.png`)],
  [`icon-pride`, require(`./assets/pride-new-logo.png`)],
  [`icon-experiment-design`, require(`./assets/experiment-design.png`)],
  [`icon-Rdata`, require(`./assets/r-object.png`)],
  [`icon-analytics`, require(`./assets/download-analytics.png`)],
  [`icon-clustered-heatmap`, require(`./assets/download-clustered-heatmap.png`)],
  [`icon-foldchange`, require(`./assets/download-fc.png`)],
  [`icon-normalized-expressions`, require(`./assets/download-normalized-expressions.png`)],
  [`icon-raw-counts`, require(`./assets/download-raw-counts.png`)],
  [`icon-tsv`, require(`./assets/download-tsv.png`)]
]

const htmlEntity = (type) => {
  const maybeEntity = [
    [`link`, `🔗`]
  ].find(e => type.includes(e[0]))

  return (
    maybeEntity &&  <span>{maybeEntity[1]}</span>
  )
}

const icon = (type, pathToResources) => {
  const maybeImg = RESOURCE_ICONS.find(e => (type === e[0]))

  return (
    maybeImg && <img style={{marginRight: `0.5rem`, height: `32px`}} src={URI(maybeImg[1], pathToResources)} />
  )
}

const Icon = ({type, pathToResources}) => {
  return (
    htmlEntity(type)
    || icon(type, pathToResources)
    || <span style={{marginLeft: `0.5rem`,marginRight: `0.5rem`}}> &middot; </span>
  )
}

Icon.propTypes = {
  type: ResourcePropTypes.type,
  pathToResources: PropTypes.string.isRequired
}

export default Icon
