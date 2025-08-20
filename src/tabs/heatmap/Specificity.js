import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from './Checkbox.js'
import {QueryObjectsPropTypes} from './PropTypes.js'

const Specificity = ({isVisible, specific, onChangeSpecific}) => (
  <Checkbox
    isVisible={isVisible}
    value={specific}
    onChangeValue={onChangeSpecific}/>
)

Specificity.propTypes = {
  specific: QueryObjectsPropTypes.specific,
  onChangeSpecific : PropTypes.func.isRequired,
  isVisible: PropTypes.string.isRequired
}

export default Specificity
