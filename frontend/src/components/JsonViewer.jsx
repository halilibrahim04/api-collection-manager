import React, { useState } from 'react';
import './JsonViewer.css';

const JsonViewer = ({ data, name = null, isLast = true, initialExpanded = true, level = 0 }) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  // Helper to determine type
  const getType = (val) => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'object') return 'object';
    return typeof val;
  };

  const type = getType(data);
  const isComplex = type === 'object' || type === 'array';
  const isEmpty = isComplex && Object.keys(data).length === 0;

  const toggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const renderValue = () => {
    if (type === 'string') return <span className="jv-string">"{data}"</span>;
    if (type === 'number') return <span className="jv-number">{data}</span>;
    if (type === 'boolean') return <span className="jv-boolean">{data ? 'true' : 'false'}</span>;
    if (type === 'null') return <span className="jv-null">null</span>;
    return <span>{String(data)}</span>;
  };

  if (!isComplex) {
    return (
      <div className="jv-line" style={{ paddingLeft: `${level * 20}px` }}>
        {name && <span className="jv-key">"{name}": </span>}
        {renderValue()}
        {!isLast && <span className="jv-punctuation">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const bracketOpen = type === 'array' ? '[' : '{';
  const bracketClose = type === 'array' ? ']' : '}';

  if (isEmpty) {
    return (
      <div className="jv-line" style={{ paddingLeft: `${level * 20}px` }}>
        {name && <span className="jv-key">"{name}": </span>}
        <span className="jv-punctuation">{bracketOpen}{bracketClose}</span>
        {!isLast && <span className="jv-punctuation">,</span>}
      </div>
    );
  }

  return (
    <div className="jv-node">
      <div 
        className="jv-line jv-toggleable" 
        style={{ paddingLeft: `${level * 20}px` }} 
        onClick={toggle}
      >
        <span className={`jv-arrow ${expanded ? 'jv-arrow-down' : 'jv-arrow-right'}`}>▼</span>
        {name && <span className="jv-key">"{name}": </span>}
        <span className="jv-punctuation">{bracketOpen}</span>
        {!expanded && (
          <span className="jv-collapsed-text">
            {type === 'array' ? ` ${keys.length} items ` : ` ... `}
          </span>
        )}
        {!expanded && <span className="jv-punctuation">{bracketClose}</span>}
        {!expanded && !isLast && <span className="jv-punctuation">,</span>}
      </div>

      {expanded && (
        <div className="jv-children">
          {keys.map((key, index) => (
            <JsonViewer
              key={key}
              name={type === 'array' ? null : key}
              data={data[key]}
              isLast={index === keys.length - 1}
              initialExpanded={initialExpanded}
              level={level + 1}
            />
          ))}
          <div className="jv-line" style={{ paddingLeft: `${level * 20}px` }}>
            <span className="jv-punctuation">{bracketClose}</span>
            {!isLast && <span className="jv-punctuation">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
