import React from 'react'
import Autocomplete from 'react-autocomplete'

import URI from 'urijs'

import './gene-autocomplete.css'

const TRANSITIONS = {
  standBy: 1,
  underEdit: 2,
  fetchingSuggestion: 3
}

const AutocompleteBox = React.createClass({
  propTypes: {
    geneSuggesterUri : React.PropTypes.instanceOf(URI),
    onGeneChosen: React.PropTypes.func.isRequired,
    valuesToSkipInSuggestions: React.PropTypes.arrayOf(React.PropTypes.string.isRequired).isRequired
  },
  getInitialState () {
    return {
      value: ``,
      currentTransition: TRANSITIONS.standBy,
      currentSuggestions: []
    }
  },

  _requestSuggestions (value) {
    if(this.state.currentTransition === TRANSITIONS.fetchingSuggestion){
      let httpRequest = new XMLHttpRequest();
      httpRequest.onload = (e) => {
        const xhr = e.target;
        let results;
        if (xhr.responseType === `json`) {
          results = xhr.response;
        } else {
          results = JSON.parse(xhr.responseText);
        }
        this.setState(
          { currentSuggestions:
              results
              .map((result)=> (
                  result.value + ( result.category ? " (" + result.category + ")" : "")
              ))
              .filter((item)=> (
                  !this.props.valuesToSkipInSuggestions.includes(item)
              ))
              .filter((item,ix,self)=>(
                self.indexOf(item) === ix
              ))
          ,
            currentTransition: TRANSITIONS.underEdit})
      };
      httpRequest.open(`GET`, this.props.geneSuggesterUri.search({query: value}), true);
      httpRequest.responseType = `json`;
      httpRequest.send();
    }
  },
  _renderItem (item, isHighlighted) {
    // Background colour should match .button.primary colour in theme-atlas.css
    return (
      <div
        className="menu-element"
        style={isHighlighted ? {"background": "#3497c5", "color": "white"} : {}}
        key={item}
        id={item}
      >
      <span>
        {item}
      </span>
      </div>
    )
  },

  _isTooShortToShowHints (value) {
    return !value || value.length <3
  },

  render () {
    return (
      <div className={"gene-autocomplete "+(
          this.state.currentTransition === TRANSITIONS.underEdit
          || this.state.currentTransition === TRANSITIONS.fetchingSuggestion
          ? "underEdit"
          : this.state.currentTransition === TRANSITIONS.standBy
            ? "standBy"
            : "")}>
        <Autocomplete
          open={this.state.currentTransition === TRANSITIONS.underEdit
                || this.state.currentTransition === TRANSITIONS.fetchingSuggestion}
          onMenuVisibilityChange={()=>{}}
          inputProps={{name: "Enter gene", id: "gene-autocomplete", type:"text"}}
          value={this.state.value}
          items={this.state.currentSuggestions}
          getItemValue={(item) => item}
          wrapperStyle={{display:"block"}}
          onSelect={value => {
            this.setState({
                value: '',
                currentSuggestions: [],
                currentTransition: TRANSITIONS.standBy
              },
              () => {this.props.onGeneChosen(value)})
          }}
          onChange={(event, value) => {
            if(this._isTooShortToShowHints(value)){
              this.setState({value: value, currentTransition: TRANSITIONS.underEdit})
            } else {
              this.setState({value: value, currentTransition: TRANSITIONS.fetchingSuggestion}, () => {
                this._requestSuggestions(value)
              })
            }
          }}
          renderMenu={(items, value, style) => {
            return (
             <div className="menu" style={{ }}>
               {this._isTooShortToShowHints(value)
                ? false
                : this.state.currentTransition === TRANSITIONS.fetchingSuggestion
                  ? (
                    <div style={{padding: 6, float: "bottom"}}>
                      Loading...
                    </div>
                  )
                  : <div>
                      {items}
                    </div>
                }
             </div>
           )
         }}
          renderItem={this._renderItem}
        />
      </div>
    )
  }
})

module.exports = AutocompleteBox;
