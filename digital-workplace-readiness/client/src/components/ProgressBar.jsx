import React from 'react';

const colorFor = (value) => {
  if (value >= 80) return '#16a34a';
  if (value >= 60) return '#0ea5e9';
  if (value >= 40) return '#d97706';
  return '#dc2626';
};

const ProgressBar = ({ value = 0, color }) => (
  <div className="progress-track">
    <div
      className="progress-fill"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || colorFor(value) }}
    ></div>
  </div>
);

export default ProgressBar;
