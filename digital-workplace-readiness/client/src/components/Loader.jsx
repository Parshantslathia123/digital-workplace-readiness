import React from 'react';

export const Loader = () => (
  <div className="loader-wrapper">
    <div className="spinner"></div>
  </div>
);

export const EmptyState = ({ message = 'No data found' }) => (
  <div className="empty-state">{message}</div>
);

export const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return <div className="error-banner">{message}</div>;
};

export const SuccessBanner = ({ message }) => {
  if (!message) return null;
  return <div className="success-banner">{message}</div>;
};
