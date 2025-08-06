import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { User, FileText, Shield, Clock, CheckCircle, AlertCircle, Eye, Download, RefreshCw } from 'lucide-react';
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
  const [autoFetchStatus, setAutoFetchStatus] = useState({
    loading: false,
    success: false,
    error: null
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
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Auto-fetch the doctor proof hash specifically for this patient
  const { data: patientSpecificProofHash, refetch: refetchPatientProofHash } = useReadContract({
    address: getContractAddress(chainId),
    abi: ABI.HEALTH_CLAIM_VERIFIER,
    functionName: 'getDoctorProofHashForPatient',
    args: [address],
    enabled: isConnected && chainId && address,
  });

  // Also keep the general latest doctor proof as fallback
  const { data: latestDoctorProofHash, refetch: refetchDoctorProofHash } = useReadContract({
    address: getContractAddress(chainId),
    abi: ABI.HEALTH_CLAIM_VERIFIER,
    functionName: 'getLatestDoctorProofHash',
    args: [],
    enabled: isConnected && chainId,
  });

  // Fetch patient's own claims from contract
  const { data: allClaims, refetch: refetchClaims } = useReadContract({
    address: getContractAddress(chainId),
    abi: ABI.HEALTH_CLAIM_VERIFIER,
    functionName: 'getAllPendingClaims',
    args: [],
    enabled: isConnected && chainId,
  });

  // Debug: Get total doctors to check if any doctor has submitted
  const { data: totalDoctors } = useReadContract({
    address: getContractAddress(chainId),
    abi: ABI.HEALTH_CLAIM_VERIFIER,
    functionName: 'getTotalDoctors',
    args: [],
    enabled: isConnected && chainId,
  });

  useEffect(() => {
    if (isConnected && allClaims) {
      // Filter claims to show only the current patient's claims
      const patientClaims = allClaims.filter(claim => 
        claim.patientAddress.toLowerCase() === address.toLowerCase()
      );
      setMyClaims(patientClaims);
    }
  }, [isConnected, address, allClaims]);

  useEffect(() => {
    if (isSuccess) {
      refetchClaims();
      
      // Show success message and reset form
      setSubmissionSuccess(true);
      setClaimData({
        doctor_proof_hash: '',
        patient_id: '',
        policy_limit: '',
        claim_amount: ''
      });
      setProofGeneration({
        loading: false,
        step: '',
        proof: null
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmissionSuccess(false), 5000);
    }
  }, [isSuccess]);

  // Auto-populate doctor proof hash when available (prioritize patient-specific)
  useEffect(() => {
    const proofHash = patientSpecificProofHash || latestDoctorProofHash;
    
    if (proofHash && 
        proofHash !== '0x' && 
        proofHash !== '' && 
        proofHash.length > 0) {
      setClaimData(prev => ({
        ...prev,
        doctor_proof_hash: proofHash
      }));
      setAutoFetchStatus({
        loading: false,
        success: true,
        error: null
      });
    }
  }, [patientSpecificProofHash, latestDoctorProofHash]);

  const fetchLatestDoctorProofHash = async () => {
    if (!isConnected) return;
    
    setAutoFetchStatus({ loading: true, success: false, error: null });
    
    try {
      // First try to get patient-specific proof hash
      const patientResult = await refetchPatientProofHash();
      let proofHash = patientResult.data;
      let isPatientSpecific = true;
      
      // If no patient-specific proof, try general latest proof
      if (!proofHash || proofHash === '0x' || proofHash === '' || proofHash.length === 0) {
        const generalResult = await refetchDoctorProofHash();
        proofHash = generalResult.data;
        isPatientSpecific = false;
      }
      
      if (proofHash && 
          proofHash !== '0x' && 
          proofHash !== '' && 
          proofHash.length > 0) {
        setClaimData(prev => ({
          ...prev,
          doctor_proof_hash: proofHash
        }));
        setAutoFetchStatus({
          loading: false,
          success: true,
          error: null
        });
      } else {
        setAutoFetchStatus({
          loading: false,
          success: false,
          error: `No doctor proof found${isPatientSpecific ? ' for your address' : ''}. Total doctors in system: ${totalDoctors || 0}. Please ensure a doctor has submitted a proof${isPatientSpecific ? ' for you' : ''} first.`
        });
      }
    } catch (error) {
      console.error('Failed to fetch doctor proof hash:', error);
      setAutoFetchStatus({
        loading: false,
        success: false,
        error: `Failed to fetch doctor proof hash: ${error.message}`
      });
    }
  };

  // No longer needed - claims are fetched directly from contract
  // const fetchPatientClaims = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:3001/api/patient-claims/${address}`);
  //     const claims = await response.json();
  //     setMyClaims(claims);
  //   } catch (error) {
  //     console.error('Failed to fetch claims:', error);
  //   }
  // };

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

    if (!claimData.doctor_proof_hash) {
      alert('Please fetch the doctor proof hash first');
      return;
    }

    if (!consent.doctorAddress) {
      alert('Please set up doctor access consent first to specify the doctor address');
      return;
    }

    try {
      const proof = await generatePatientProof(claimData);
      
      const contractAddress = getContractAddress(chainId);
      
      // Submit with actual doctor address from consent form
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'submitPatientClaim',
        args: [
          consent.doctorAddress, // Use doctor address from consent form
          claimData.doctor_proof_hash,
          proof.proofHash, // patient proof hash
          parseInt(claimData.claim_amount)
        ],
      });
      
      // Clear form after successful submission
      setClaimData({
        doctor_proof_hash: '',
        patient_id: '',
        policy_limit: '',
        claim_amount: ''
      });
      setProofGeneration({ loading: false, step: '', proof: null });
      
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

  // Convert enum status to string
  const getStatusText = (status) => {
    switch (Number(status)) {
      case 0: return 'Pending';
      case 1: return 'Verified';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      case 4: return 'Paid';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (Number(status)) {
      case 0: return 'pending';      // Pending
      case 1: return 'verified';     // Verified
      case 2: return 'approved';     // Approved
      case 3: return 'rejected';     // Rejected
      case 4: return 'paid';         // Paid
      default: return 'pending';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
              {submissionSuccess && (
                <div className="success-message">
                  <CheckCircle size={24} />
                  <div>
                    <h3>✅ Claim Submitted Successfully!</h3>
                    <p>Your insurance claim has been submitted to the blockchain and is now available for insurance review.</p>
                  </div>
                </div>
              )}

              <div className="usage-guide">
                <h3>📋 Quick Start Guide</h3>
                <ol>
                  <li><strong>Set Doctor Access:</strong> Go to "Doctor Access" tab and add your doctor's wallet address</li>
                  <li><strong>Doctor Generates Proof:</strong> Your doctor needs to generate a proof first (using Doctor Portal)</li>
                  <li><strong>Fetch Proof Hash:</strong> Click "Auto-Fetch" to get the latest doctor proof</li>
                  <li><strong>Submit Claim:</strong> Fill in your details and submit the claim</li>
                </ol>
              </div>
              
              <div className="form-group">
                <label>Doctor Proof Hash</label>
                <div className="auto-fetch-container">
                  <input
                    type="text"
                    placeholder="Hash from doctor's ZK proof"
                    value={claimData.doctor_proof_hash}
                    onChange={(e) => handleClaimInputChange('doctor_proof_hash', e.target.value)}
                  />
                  <button
                    type="button"
                    className="auto-fetch-btn"
                    onClick={fetchLatestDoctorProofHash}
                    disabled={autoFetchStatus.loading || !isConnected}
                  >
                    <RefreshCw size={16} className={autoFetchStatus.loading ? 'spin' : ''} />
                    Auto-Fetch
                  </button>
                </div>
                {autoFetchStatus.success && (
                  <small className="success-message">✓ Latest doctor proof hash automatically fetched</small>
                )}
                {autoFetchStatus.error && (
                  <small className="error-message">{autoFetchStatus.error}</small>
                )}
                {!autoFetchStatus.success && !autoFetchStatus.error && (
                  <small>Click "Auto-Fetch" to automatically get the latest doctor proof hash</small>
                )}
                {!consent.doctorAddress && (
                  <small className="warning-message">⚠️ Please set up doctor access in the "Doctor Access" tab first to specify the doctor's address</small>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <small className="debug-info">
                    Debug: Chain {chainId}, Doctors: {totalDoctors || 0}<br/>
                    Patient-specific: {patientSpecificProofHash || 'none'}<br/>
                    Latest general: {latestDoctorProofHash || 'none'}<br/>
                    Doctor Address: {consent.doctorAddress || 'not set'}
                  </small>
                )}
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
                      <div className="claim-id">#{index + 1}</div>
                      <div className={`claim-status ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </div>
                    </div>
                    
                    <div className="claim-details">
                      {/* <div className="claim-info">
                        <strong>Doctor:</strong> {claim.doctorAddress?.slice(0, 6)}...{claim.doctorAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Patient:</strong> {claim.patientAddress?.slice(0, 6)}...{claim.patientAddress?.slice(-4)}
                      </div> */}
                      <div className="claim-info">
                        <strong>Amount:</strong> {formatCurrency(Number(claim.claimAmount))}
                      </div>
                      <div className="claim-info">
                        <strong>Doctor Proof:</strong> {claim.doctorProofHash?.slice(0, 10)}...
                      </div>
                      <div className="claim-info">
                        <strong>Patient Proof:</strong> {claim.patientProofHash?.slice(0, 10)}...
                      </div>
                    </div>

                    {Number(claim.status) === 0 && ( // 0 = pending
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
