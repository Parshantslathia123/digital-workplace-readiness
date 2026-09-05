import React from 'react';

const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      {children}
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

export default Modal;
