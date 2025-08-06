// Test component to check if ZK verification steps are working
import React, { useState } from 'react';

const ZKVerificationTest = () => {
  const [zkVerificationSteps, setZkVerificationSteps] = useState({});

  const testClaim = {
    id: 'test-claim-123'
  };

  const simulateVerification = () => {
    console.log('🔧 Starting simulation...');
    
    // Set up verification steps exactly like in the main component
    setZkVerificationSteps(prev => ({
      ...prev,
      [testClaim.id]: {
        fileCheck: { status: 'loading', message: 'Checking proof files...', icon: '📁' },
        zkVerifySubmission: { status: 'pending', message: 'Submit to zkVerify...', icon: '🔐' },
        cryptographicVerification: { status: 'pending', message: 'Verify cryptographic proofs...', icon: '🔍' },
        smartContractUpdate: { status: 'pending', message: 'Update smart contract...', icon: '📝' }
      }
    }));
    
    console.log('✅ ZK steps initialized');
  };

  return (
    <div style={{ padding: '20px', border: '2px solid red' }}>
      <h2>ZK Verification Steps Test</h2>
      <button onClick={simulateVerification}>Test ZK Steps</button>
      
      <div>
        <h3>Current State:</h3>
        <pre>{JSON.stringify(zkVerificationSteps, null, 2)}</pre>
      </div>

      {zkVerificationSteps[testClaim.id] && (
        <div style={{ background: 'lightblue', padding: '10px', marginTop: '10px' }}>
          <h4>ZK Steps Rendering:</h4>
          
          <div>
            <strong>File Check:</strong> {zkVerificationSteps[testClaim.id].fileCheck.status} - {zkVerificationSteps[testClaim.id].fileCheck.message}
            {zkVerificationSteps[testClaim.id].fileCheck.status === 'loading' && (
              <div style={{ display: 'inline-block', marginLeft: '10px', width: '16px', height: '16px', border: '2px solid blue', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
              </div>
            )}
          </div>
          
          <div>
            <strong>ZK Submission:</strong> {zkVerificationSteps[testClaim.id].zkVerifySubmission.status} - {zkVerificationSteps[testClaim.id].zkVerifySubmission.message}
          </div>
          
          <div>
            <strong>Crypto Verification:</strong> {zkVerificationSteps[testClaim.id].cryptographicVerification.status} - {zkVerificationSteps[testClaim.id].cryptographicVerification.message}
          </div>
          
          <div>
            <strong>Contract Update:</strong> {zkVerificationSteps[testClaim.id].smartContractUpdate.status} - {zkVerificationSteps[testClaim.id].smartContractUpdate.message}
          </div>
        </div>
      )}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ZKVerificationTest;
