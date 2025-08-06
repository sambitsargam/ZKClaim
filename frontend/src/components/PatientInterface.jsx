import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { User, FileText, Shield, Clock, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { getContractAddress, ABI } from '../config/contracts';
import ConnectButton from './ConnectButton';
import './PatientInterface.css';

const PatientInterface = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState('submit');
  const [myClaims, setMyClaims] = useState([]);
  const [claimData, setClaimData] = useState({
    doctor_proof_hash: '',
    patient_id: '',
    policy_limit: '',
    claim_amount: ''
  });
  const [consent, setConsent] = useState({
    doctorAddress: '',
    permissions: {
      viewRecords: false,
      submitClaims: false,
      shareWithInsurance: false
    }
  });
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
    if (isConnected) {
      fetchPatientClaims();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isSuccess) {
      fetchPatientClaims();
    }
  }, [isSuccess]);

  const fetchPatientClaims = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/patient-claims/${address}`);
      const claims = await response.json();
      setMyClaims(claims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  };

  const generatePatientProof = async (claimInputs) => {
    setProofGeneration({ loading: true, step: 'Generating patient verification proof...', proof: null });
    
    try {
      const response = await fetch('http://localhost:3001/api/patient-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_proof_hash: claimInputs.doctor_proof_hash,
          patient_id: parseInt(claimInputs.patient_id),
          policy_limit: parseInt(claimInputs.policy_limit),
          claim_amount: parseInt(claimInputs.claim_amount),
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

  const handleClaimInputChange = (field, value) => {
    setClaimData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitNewClaim = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const proof = await generatePatientProof(claimData);
      
      const contractAddress = getContractAddress(chainId);
      
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'submitPatientClaim',
        args: [
          claimData.doctor_proof_hash,
          claimData.patient_id,
          claimData.policy_limit,
          claimData.claim_amount,
          proof.proofHash, // Use the proof hash from zkVerify
          proof.txHash     // Include the transaction hash as well
        ],
      });
      
    } catch (error) {
      console.error('Failed to submit claim:', error);
      alert('Failed to submit claim: ' + error.message);
    }
  };

  const approveClaim = async (claimId) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const claim = myClaims.find(c => c.id === claimId);
      const proof = await generatePatientProof(claim);
      
      const contractAddress = getContractAddress(chainId);
      
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'approvePatientClaim',
        args: [
          claimId,
          proof.proofHash, // Use the proof hash from zkVerify
          proof.txHash     // Include the transaction hash as well
        ],
      });
      
    } catch (error) {
      console.error('Failed to approve claim:', error);
      alert('Failed to approve claim: ' + error.message);
    }
  };

  const grantConsent = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const contractAddress = getContractAddress(chainId);
      
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'grantDoctorConsent',
        args: [
          consent.doctorAddress,
          consent.permissions.viewRecords,
          consent.permissions.submitClaims,
          consent.permissions.shareWithInsurance
        ],
      });
      
    } catch (error) {
      console.error('Failed to grant consent:', error);
      alert('Failed to grant consent: ' + error.message);
    }
  };

  const handleConsentChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConsent(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setConsent(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'approved';
      case 'pending': return 'pending';
      case 'under_review': return 'under-review';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  const tabs = [
    { id: 'submit', label: 'Submit Claim', icon: FileText },
    { id: 'claims', label: 'My Claims', icon: Clock },
    { id: 'consent', label: 'Doctor Access', icon: Shield },
    { id: 'records', label: 'Medical Records', icon: Eye }
  ];

  return (
    <div className="patient-interface">
      <div className="patient-header">
        <div className="patient-title">
          <div className="patient-icon">
            <User size={32} />
          </div>
          <div>
            <h1>Patient Portal</h1>
            <p>Manage your medical claims and privacy settings</p>
          </div>
        </div>
        <ConnectButton />
      </div>

      <div className="patient-tabs">
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

      <div className="patient-content">
        {activeTab === 'submit' && (
          <div className="submit-claim-section">
            <div className="section-header">
              <FileText size={24} />
              <div>
                <h2>Submit Insurance Claim</h2>
                <p>Create a new insurance claim with zero-knowledge proof verification</p>
              </div>
            </div>

            <div className="claim-form">
              <div className="form-group">
                <label>Doctor Proof Hash</label>
                <input
                  type="text"
                  placeholder="Hash from doctor's ZK proof"
                  value={claimData.doctor_proof_hash}
                  onChange={(e) => handleClaimInputChange('doctor_proof_hash', e.target.value)}
                />
                <small>This hash is provided by your doctor after they generate their proof</small>
              </div>

              <div className="form-group">
                <label>Patient ID</label>
                <input
                  type="number"
                  placeholder="Your patient identification number"
                  value={claimData.patient_id}
                  onChange={(e) => handleClaimInputChange('patient_id', e.target.value)}
                />
                <small>Enter your unique patient identifier</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Policy Limit (USD)</label>
                  <input
                    type="number"
                    placeholder="Your insurance policy limit"
                    value={claimData.policy_limit}
                    onChange={(e) => handleClaimInputChange('policy_limit', e.target.value)}
                  />
                  <small>Maximum amount your policy covers</small>
                </div>

                <div className="form-group">
                  <label>Claim Amount (USD)</label>
                  <input
                    type="number"
                    placeholder="Amount you're claiming"
                    value={claimData.claim_amount}
                    onChange={(e) => handleClaimInputChange('claim_amount', e.target.value)}
                  />
                  <small>Must not exceed policy limit</small>
                </div>
              </div>

              {proofGeneration.loading && (
                <div className="proof-status">
                  <div className="loading-spinner"></div>
                  <span>{proofGeneration.step}</span>
                </div>
              )}

              <button 
                className="submit-btn"
                onClick={submitNewClaim}
                disabled={!isConnected || isPending || isConfirming || proofGeneration.loading}
              >
                <FileText size={18} />
                {isPending || isConfirming ? 'Submitting...' : 'Submit Insurance Claim'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="claims-section">
            <div className="section-header">
              <FileText size={24} />
              <div>
                <h2>My Medical Claims</h2>
                <p>Review and approve claims submitted by your healthcare providers</p>
              </div>
            </div>

            <div className="claims-list">
              {myClaims.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No claims found</h3>
                  <p>Claims submitted by your doctors will appear here</p>
                </div>
              ) : (
                myClaims.map((claim, index) => (
                  <div key={index} className="claim-card">
                    <div className="claim-header">
                      <div className="claim-id">#{claim.id}</div>
                      <div className={`claim-status ${getStatusColor(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <div className="claim-details">
                      <div className="claim-info">
                        <strong>Doctor:</strong> {claim.doctorAddress?.slice(0, 6)}...{claim.doctorAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Diagnosis:</strong> {claim.diagnosis}
                      </div>
                      <div className="claim-info">
                        <strong>Amount:</strong> ${claim.amount}
                      </div>
                      <div className="claim-info">
                        <strong>Date:</strong> {new Date(claim.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    {claim.status === 'pending' && (
                      <div className="claim-actions">
                        {proofGeneration.loading ? (
                          <div className="proof-status">
                            <div className="loading-spinner"></div>
                            <span>{proofGeneration.step}</span>
                          </div>
                        ) : (
                          <>
                            <button 
                              className="approve-btn"
                              onClick={() => approveClaim(claim.id)}
                              disabled={isPending || isConfirming}
                            >
                              <CheckCircle size={16} />
                              {isPending || isConfirming ? 'Approving...' : 'Approve Claim'}
                            </button>
                            <button className="reject-btn">
                              <AlertCircle size={16} />
                              Request Changes
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {claim.status === 'approved' && (
                      <div className="claim-approved">
                        <CheckCircle size={16} />
                        <span>You approved this claim</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'consent' && (
          <div className="consent-section">
            <div className="section-header">
              <Shield size={24} />
              <div>
                <h2>Doctor Access Management</h2>
                <p>Control what information doctors can access and actions they can perform</p>
              </div>
            </div>

            <div className="consent-form">
              <div className="form-group">
                <label>Doctor Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={consent.doctorAddress}
                  onChange={(e) => handleConsentChange('doctorAddress', e.target.value)}
                />
              </div>

              <div className="permissions-section">
                <h3>Permissions</h3>
                <p>Select what this doctor is allowed to do with your medical information</p>
                
                <div className="permission-list">
                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={consent.permissions.viewRecords}
                      onChange={(e) => handleConsentChange('permissions.viewRecords', e.target.checked)}
                    />
                    <div className="permission-content">
                      <div className="permission-title">View Medical Records</div>
                      <div className="permission-desc">Allow doctor to view your medical history</div>
                    </div>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={consent.permissions.submitClaims}
                      onChange={(e) => handleConsentChange('permissions.submitClaims', e.target.checked)}
                    />
                    <div className="permission-content">
                      <div className="permission-title">Submit Claims</div>
                      <div className="permission-desc">Allow doctor to submit insurance claims on your behalf</div>
                    </div>
                  </label>

                  <label className="permission-item">
                    <input
                      type="checkbox"
                      checked={consent.permissions.shareWithInsurance}
                      onChange={(e) => handleConsentChange('permissions.shareWithInsurance', e.target.checked)}
                    />
                    <div className="permission-content">
                      <div className="permission-title">Share with Insurance</div>
                      <div className="permission-desc">Allow sharing relevant information with insurance companies</div>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                className="consent-btn"
                onClick={grantConsent}
                disabled={!isConnected || isPending || isConfirming || !consent.doctorAddress}
              >
                <Shield size={18} />
                {isPending || isConfirming ? 'Granting Access...' : 'Grant Doctor Access'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="records-section">
            <div className="section-header">
              <Eye size={24} />
              <div>
                <h2>Medical Records</h2>
                <p>View and manage your encrypted medical records</p>
              </div>
            </div>

            <div className="records-list">
              <div className="empty-state">
                <Eye size={48} />
                <h3>Medical records coming soon</h3>
                <p>Your encrypted medical records will be accessible here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientInterface;
