import React from 'react';
import Icon from "./Icon"

export const ArchiveResources = ({ archiveResources, pathToResources }) => {

  if (archiveResources.length === 0) return null;

  return (
    <>
      <div className={`small-12 columns margin-bottom-xlarge`}>
        <h3 key={`title`}>Source Data</h3>
        <p>Original raw data and metadata available at:</p>
        <ul style={{listStyle: `none`, marginLeft: `0rem`}}>
          {archiveResources.map((value, ix) => (
            <li key={ix} className="margin-left-large">
              <a href={value.url}>
                <div>
                  <p>
                    <Icon type={value.type} {...{pathToResources}}/> {value.description}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}