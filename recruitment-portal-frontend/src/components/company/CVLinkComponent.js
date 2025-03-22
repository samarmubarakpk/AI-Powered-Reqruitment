// src/components/company/CVLinkComponent.js
import React from 'react';
import SasCVButton from './SasCVButton';

function CVLinkComponent({ candidateId, buttonStyle = false }) {
  // If no candidateId, return nothing or a message
  if (!candidateId) {
    return <span className="text-gray-400">No CV available</span>;
  }
  
  // Use our SAS URL button
  return (
    <SasCVButton
      candidateId={candidateId}
      buttonStyle={buttonStyle}
    />
  );
}

export default CVLinkComponent;