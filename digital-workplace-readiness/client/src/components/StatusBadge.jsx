import React from 'react';

const map = {
  Completed: 'badge-success',
  Present: 'badge-success',
  Active: 'badge-success',
  Excellent: 'badge-success',
  Good: 'badge-info',
  'In Progress': 'badge-info',
  Hybrid: 'badge-info',
  Basic: 'badge-warning',
  Pending: 'badge-warning',
  'Half Day': 'badge-warning',
  'On Leave': 'badge-warning',
  Medium: 'badge-warning',
  High: 'badge-warning',
  Urgent: 'badge-danger',
  Absent: 'badge-danger',
  Inactive: 'badge-danger',
  'Needs Improvement': 'badge-danger',
  Leave: 'badge-gray',
  Low: 'badge-gray',
  Remote: 'badge-gray',
  Office: 'badge-gray'
};

const StatusBadge = ({ label }) => (
  <span className={`badge ${map[label] || 'badge-gray'}`}>{label}</span>
);

export default StatusBadge;
