import React from 'react'
import PropTypes from 'prop-types'

class Checkbox extends React.Component {
    toggleCheckbox = () => {
      this.props.onChangeValue(!this.props.value)
    }

    render() {
      return (
        <div className="margin-top-large">
          <input
            type="checkbox"
            checked={this.props.value}
            name={`menu-item-${this.props.value}`}
            id={`menu-item-${this.props.value}`}
            onChange={this.toggleCheckbox}
          />
          <label>Most specific</label>
        </div>
      )
    }
}

Checkbox.propTypes = {
  value: PropTypes.bool.isRequired,
  onChangeValue: PropTypes.func.isRequired
}

export default Checkbox
