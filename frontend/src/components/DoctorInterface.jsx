import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Stethoscope, FileText, Shield, User, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { getContractAddress, ABI } from '../config/contracts';
import ConnectButton from './ConnectButton';
import './DoctorInterface.css';

const DoctorInterface = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState('submit');
  const [patientData, setPatientData] = useState({
    patientAddress: '',
    procedure_code: '',
    doctor_id: '',
    date: new Date().toISOString().slice(0,10).replace(/-/g, ''), // Today's date in YYYYMMDD format
    treatmentCost: '',
    medicalRecord: '',
    urgencyLevel: 'normal'
  });
  const [claimSubmissions, setClaimSubmissions] = useState([]);
  const [proofGeneration, setProofGeneration] = useState({
    loading: false,
    step: '',
    proof: null
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      // Refresh claims after successful transaction
      fetchDoctorClaims();
    }
  }, [isSuccess]);

  const fetchDoctorClaims = async () => {
    try {
      // This would fetch from your backend API
      const response = await fetch(`http://localhost:3001/api/doctor-claims/${address}`);
      const claims = await response.json();
      setClaimSubmissions(claims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  };

  const generateDoctorProof = async () => {
    setProofGeneration({ loading: true, step: 'Generating ZK proof...', proof: null });
    
    try {
      const response = await fetch('http://localhost:3001/api/doctor-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure_code: parseInt(patientData.procedure_code),
          doctor_id: parseInt(patientData.doctor_id),
          date: parseInt(patientData.date),
          patientAddress: patientData.patientAddress,
          treatmentCost: parseInt(patientData.treatmentCost),
          timestamp: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setProofGeneration({ 
          loading: false, 
          step: 'Proof generated successfully!', 
          proof: result.proof 
        });
        return result.proof;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setProofGeneration({ 
        loading: false, 
        step: 'Failed to generate proof', 
        proof: null 
      });
      throw error;
    }
  };

  const submitClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const proof = await generateDoctorProof();
      
      // Get contract address for current chain
      const contractAddress = getContractAddress(chainId);
      
      // Submit to smart contract
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'submitDoctorClaim',
        args: [
          patientData.patientAddress,
          patientData.procedure_code,
          patientData.treatmentCost,
          proof.proofHash, // Use the proof hash from zkVerify
          proof.txHash     // Include the transaction hash as well
        ],
      });
      
    } catch (error) {
      console.error('Failed to submit claim:', error);
      alert('Failed to submit claim: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'submit', label: 'Submit Claim', icon: FileText },
    { id: 'history', label: 'Claim History', icon: Clock },
    { id: 'patients', label: 'My Patients', icon: User }
  ];

  return (
    <div className="doctor-interface">
      <div className="doctor-header">
        <div className="doctor-title">
          <div className="doctor-icon">
            <Stethoscope size={32} />
          </div>
          <div>
            <h1>Doctor Portal</h1>
            <p>Manage patient claims and medical records securely</p>
          </div>
        </div>
        <ConnectButton />
      </div>

      <div className="doctor-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="doctor-content">
        {activeTab === 'submit' && (
          <div className="submit-claim-section">
            <div className="section-header">
              <Shield size={24} />
              <div>
                <h2>Submit New Medical Claim</h2>
                <p>Create a privacy-preserving claim using zero-knowledge proofs</p>
              </div>
            </div>

            <div className="claim-form">
              <div className="form-group">
                <label>Patient Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={patientData.patientAddress}
                  onChange={(e) => handleInputChange('patientAddress', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Procedure Code</label>
                <select
                  value={patientData.procedure_code}
                  onChange={(e) => handleInputChange('procedure_code', e.target.value)}
                >
                  <option value="">Select procedure code...</option>
                  <option value="99213">99213 - Office/Outpatient Visit (Established Patient)</option>
                  <option value="99214">99214 - Office/Outpatient Visit (Detailed)</option>
                  <option value="10120">10120 - Incision and drainage of skin abscess</option>
                  <option value="20610">20610 - Arthrocentesis, aspiration</option>
                  <option value="71020">71020 - Chest X-ray</option>
                  <option value="80053">80053 - Comprehensive metabolic panel</option>
                  <option value="93000">93000 - Electrocardiogram (ECG)</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Doctor ID</label>
                  <input
                    type="number"
                    placeholder="Enter your medical license number"
                    value={patientData.doctor_id}
                    onChange={(e) => handleInputChange('doctor_id', e.target.value)}
                  />
                  <small>Your unique medical license or NPI number</small>
                </div>

                <div className="form-group">
                  <label>Date (YYYYMMDD)</label>
                  <input
                    type="date"
                    value={patientData.date ? 
                      // Convert YYYYMMDD to YYYY-MM-DD for display
                      patientData.date.length === 8 ? 
                        `${patientData.date.slice(0,4)}-${patientData.date.slice(4,6)}-${patientData.date.slice(6,8)}` 
                        : patientData.date
                      : ''
                    }
                    onChange={(e) => {
                      // Convert YYYY-MM-DD to YYYYMMDD for storage
                      const dateStr = e.target.value.replace(/-/g, '');
                      handleInputChange('date', dateStr);
                    }}
                  />
                  <small>Date of the medical procedure</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Treatment Cost (USD)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={patientData.treatmentCost}
                    onChange={(e) => handleInputChange('treatmentCost', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Urgency Level</label>
                  <select
                    value={patientData.urgencyLevel}
                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Medical Record Summary</label>
                <textarea
                  placeholder="Enter relevant medical information..."
                  rows="4"
                  value={patientData.medicalRecord}
                  onChange={(e) => handleInputChange('medicalRecord', e.target.value)}
                />
              </div>

              {proofGeneration.loading && (
                <div className="proof-status">
                  <div className="loading-spinner"></div>
                  <span>{proofGeneration.step}</span>
                </div>
              )}

              <button 
                className="submit-btn"
                onClick={submitClaim}
                disabled={!isConnected || isPending || isConfirming || proofGeneration.loading}
              >
                <FileText size={18} />
                {isPending || isConfirming ? 'Submitting...' : 'Submit Medical Claim'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <Clock size={24} />
              <div>
                <h2>Claim History</h2>
                <p>Track the status of your submitted claims</p>
              </div>
            </div>

            <div className="claims-list">
              {claimSubmissions.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No claims submitted yet</h3>
                  <p>Your submitted claims will appear here</p>
                </div>
              ) : (
                claimSubmissions.map((claim, index) => (
                  <div key={index} className="claim-card">
                    <div className="claim-header">
                      <div className="claim-id">#{claim.id}</div>
                      <div className={`claim-status ${claim.status}`}>
                        {claim.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="claim-details">
                      <div className="claim-info">
                        <strong>Patient:</strong> {claim.patientAddress?.slice(0, 6)}...{claim.patientAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Procedure Code:</strong> {claim.procedure_code}
                      </div>
                      <div className="claim-info">
                        <strong>Amount:</strong> ${claim.amount}
                      </div>
                      <div className="claim-info">
                        <strong>Date:</strong> {new Date(claim.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="patients-section">
            <div className="section-header">
              <User size={24} />
              <div>
                <h2>Patient Management</h2>
                <p>Manage your patients and their records</p>
              </div>
            </div>

            <div className="patients-list">
              <div className="empty-state">
                <User size={48} />
                <h3>Patient management coming soon</h3>
                <p>This feature will allow you to manage patient records securely</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorInterface;
