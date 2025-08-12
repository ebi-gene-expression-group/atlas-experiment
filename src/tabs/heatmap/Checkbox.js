import React from 'react'
import PropTypes from 'prop-types'

class Checkbox extends React.Component {
    toggleCheckbox = () => {
      this.props.onChangeValue(!this.props.value)
    }

    render() {
      return (
        <div className="margin-top-large" style={{"visibility": this.props.isVisible}}>
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
  onChangeValue: PropTypes.func.isRequired,
  isVisible: PropTypes.string.isRequired
}

export default Checkbox
