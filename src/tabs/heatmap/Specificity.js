import React from 'react'
import PropTypes from 'prop-types'
import Checkbox from './Checkbox.js'
import {QueryObjectsPropTypes} from './PropTypes.js'

const Specificity = ({isVisible, isDifferential, specific, onChangeSpecific}) => (
  <Checkbox
    isVisible={isVisible}
    value={specific}
    isDifferential={isDifferential}
    onChangeValue={onChangeSpecific}/>
)

Specificity.propTypes = {
  specific: QueryObjectsPropTypes.specific,
  isDifferential: PropTypes.bool.isRequired,
  onChangeSpecific : PropTypes.func.isRequired,
  isVisible: PropTypes.string.isRequired
}

export default Specificity
