import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, ArrowRight, FileText, User, Stethoscope } from 'lucide-react';
import './ZKClaimApp.css';

const ZKClaimApp = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [doctorInput, setDoctorInput] = useState({
    procedure_code: '',
    doctor_id: '',
    date: ''
  });
  const [patientInput, setPatientInput] = useState({
    patient_id: '',
    claim_amount: '',
    policy_limit: '',
    doctor_proof_hash: ''
  });
  const [doctorResult, setDoctorResult] = useState(null);
  const [patientResult, setPatientResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill demo data
  const fillDemoData = () => {
    setDoctorInput({
      procedure_code: '12345',
      doctor_id: '67890',
      date: '20240101'
    });
    setPatientInput({
      patient_id: '54321',
      claim_amount: '1000',
      policy_limit: '5000',
      doctor_proof_hash: ''
    });
  };

  const generateDoctorProof = async () => {
    if (!doctorInput.procedure_code || !doctorInput.doctor_id || !doctorInput.date) {
      setError('Please fill in all doctor fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Generating doctor proof with input:', doctorInput);
      
      // Simulate API call to backend
      const response = await fetch('http://localhost:3001/api/doctor-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorInput)
      });

      if (!response.ok) {
        throw new Error('Failed to generate doctor proof');
      }

      const result = await response.json();
      setDoctorResult(result);
      setPatientInput(prev => ({
        ...prev,
        doctor_proof_hash: result.proofHash
      }));
      setActiveStep(2);
    } catch (err) {
      console.error('Doctor proof generation error:', err);
      setError(`Doctor proof failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePatientProof = async () => {
    if (!patientInput.patient_id || !patientInput.claim_amount || !patientInput.policy_limit || !patientInput.doctor_proof_hash) {
      setError('Please fill in all patient fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Generating patient proof with input:', patientInput);
      
      // Simulate API call to backend
      const response = await fetch('http://localhost:3001/api/patient-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientInput)
      });

      if (!response.ok) {
        throw new Error('Failed to generate patient proof');
      }

      const result = await response.json();
      setPatientResult(result);
      setActiveStep(3);
    } catch (err) {
      console.error('Patient proof generation error:', err);
      setError(`Patient proof failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = () => {
    setActiveStep(1);
    setDoctorInput({ procedure_code: '', doctor_id: '', date: '' });
    setPatientInput({ patient_id: '', claim_amount: '', policy_limit: '', doctor_proof_hash: '' });
    setDoctorResult(null);
    setPatientResult(null);
    setError('');
  };

  return (
    <div className="zkclaim-app">
      <div className="app-header">
        <h2>🏥 ZKClaim Interactive Demo</h2>
        <p>Experience privacy-preserving healthcare claims with zero-knowledge proofs</p>
        <div className="demo-actions">
          <button onClick={fillDemoData} className="demo-fill-btn">
            Fill Demo Data
          </button>
          <button onClick={resetDemo} className="demo-reset-btn">
            Reset Demo
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="steps-indicator">
        <div className={`step-indicator ${activeStep >= 1 ? 'active' : ''} ${doctorResult ? 'completed' : ''}`}>
          <Stethoscope size={20} />
          <span>Doctor Proof</span>
        </div>
        <div className="step-arrow">
          <ArrowRight size={16} />
        </div>
        <div className={`step-indicator ${activeStep >= 2 ? 'active' : ''} ${patientResult ? 'completed' : ''}`}>
          <User size={20} />
          <span>Patient Claim</span>
        </div>
        <div className="step-arrow">
          <ArrowRight size={16} />
        </div>
        <div className={`step-indicator ${activeStep >= 3 ? 'active' : ''}`}>
          <Shield size={20} />
          <span>Verification</span>
        </div>
      </div>

      <div className="demo-content">
        {/* Doctor Proof Section */}
        <div className={`proof-section ${activeStep === 1 ? 'active' : ''} ${doctorResult ? 'completed' : ''}`}>
          <div className="section-header">
            <Stethoscope className="section-icon" />
            <h3>Step 1: Doctor Proof Generation</h3>
            {doctorResult && <CheckCircle className="success-icon" />}
          </div>
          
          <div className="input-grid">
            <div className="input-group">
              <label>Procedure Code</label>
              <input
                type="text"
                value={doctorInput.procedure_code}
                onChange={(e) => setDoctorInput({...doctorInput, procedure_code: e.target.value})}
                placeholder="e.g. 12345"
                disabled={doctorResult}
              />
            </div>
            <div className="input-group">
              <label>Doctor ID</label>
              <input
                type="text"
                value={doctorInput.doctor_id}
                onChange={(e) => setDoctorInput({...doctorInput, doctor_id: e.target.value})}
                placeholder="e.g. 67890"
                disabled={doctorResult}
              />
            </div>
            <div className="input-group">
              <label>Date (YYYYMMDD)</label>
              <input
                type="text"
                value={doctorInput.date}
                onChange={(e) => setDoctorInput({...doctorInput, date: e.target.value})}
                placeholder="e.g. 20240101"
                disabled={doctorResult}
              />
            </div>
          </div>

          {!doctorResult && (
            <button 
              onClick={generateDoctorProof} 
              disabled={loading}
              className="proof-button doctor-button"
            >
              {loading ? (
                <>
                  <Clock className="spin" size={18} />
                  Generating Proof...
                </>
              ) : (
                <>
                  Generate Doctor Proof
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}

          {doctorResult && (
            <div className="result-card">
              <h4>✅ Doctor Proof Generated Successfully!</h4>
              <div className="result-details">
                <p><strong>Proof Hash:</strong> {doctorResult.proofHash}</p>
                <p><strong>Transaction:</strong> 
                  <a href={`https://zkverify-testnet.subscan.io/extrinsic/${doctorResult.txHash}`} 
                     target="_blank" rel="noopener noreferrer">
                    View on zkVerify
                  </a>
                </p>
                <p><strong>Status:</strong> {doctorResult.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Patient Proof Section */}
        <div className={`proof-section ${activeStep === 2 ? 'active' : ''} ${patientResult ? 'completed' : ''}`}>
          <div className="section-header">
            <User className="section-icon" />
            <h3>Step 2: Patient Claim Submission</h3>
            {patientResult && <CheckCircle className="success-icon" />}
          </div>

          <div className="input-grid">
            <div className="input-group">
              <label>Patient ID</label>
              <input
                type="text"
                value={patientInput.patient_id}
                onChange={(e) => setPatientInput({...patientInput, patient_id: e.target.value})}
                placeholder="e.g. 54321"
                disabled={!doctorResult || patientResult}
              />
            </div>
            <div className="input-group">
              <label>Claim Amount</label>
              <input
                type="text"
                value={patientInput.claim_amount}
                onChange={(e) => setPatientInput({...patientInput, claim_amount: e.target.value})}
                placeholder="e.g. 1000"
                disabled={!doctorResult || patientResult}
              />
            </div>
            <div className="input-group">
              <label>Policy Limit</label>
              <input
                type="text"
                value={patientInput.policy_limit}
                onChange={(e) => setPatientInput({...patientInput, policy_limit: e.target.value})}
                placeholder="e.g. 5000"
                disabled={!doctorResult || patientResult}
              />
            </div>
            <div className="input-group full-width">
              <label>Doctor Proof Hash (Auto-filled)</label>
              <input
                type="text"
                value={patientInput.doctor_proof_hash}
                readOnly
                className="readonly-input"
              />
            </div>
          </div>

          {doctorResult && !patientResult && (
            <button 
              onClick={generatePatientProof} 
              disabled={loading}
              className="proof-button patient-button"
            >
              {loading ? (
                <>
                  <Clock className="spin" size={18} />
                  Generating Claim...
                </>
              ) : (
                <>
                  Submit Patient Claim
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}

          {patientResult && (
            <div className="result-card">
              <h4>✅ Patient Claim Submitted Successfully!</h4>
              <div className="result-details">
                <p><strong>Proof Hash:</strong> {patientResult.proofHash}</p>
                <p><strong>Transaction:</strong> 
                  <a href={`https://zkverify-testnet.subscan.io/extrinsic/${patientResult.txHash}`} 
                     target="_blank" rel="noopener noreferrer">
                    View on zkVerify
                  </a>
                </p>
                <p><strong>Status:</strong> {patientResult.status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Final Results Section */}
        {patientResult && (
          <div className="final-results">
            <div className="section-header">
              <Shield className="section-icon" />
              <h3>🎉 ZKClaim Process Complete!</h3>
            </div>
            
            <div className="final-summary">
              <div className="summary-card">
                <h4>Privacy Preserved</h4>
                <p>All sensitive medical data remains private while proving claim validity</p>
              </div>
              <div className="summary-card">
                <h4>Cryptographically Secure</h4>
                <p>Zero-knowledge proofs ensure mathematical certainty without data exposure</p>
              </div>
              <div className="summary-card">
                <h4>Blockchain Verified</h4>
                <p>Proofs are permanently recorded and verifiable on zkVerify blockchain</p>
              </div>
            </div>

            <div className="aggregation-info">
              {(doctorResult?.aggregationDetails || patientResult?.aggregationDetails) && (
                <div className="aggregation-card">
                  <h4>📊 Aggregation Information</h4>
                  <p>Your proofs have been aggregated for efficient cross-chain verification</p>
                  {doctorResult?.aggregationId && (
                    <p><strong>Doctor Aggregation ID:</strong> {doctorResult.aggregationId}</p>
                  )}
                  {patientResult?.aggregationId && (
                    <p><strong>Patient Aggregation ID:</strong> {patientResult.aggregationId}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZKClaimApp;
