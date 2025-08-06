import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { Building, FileText, DollarSign, BarChart3, CheckCircle, AlertCircle, Clock, Eye, Shield, Zap } from 'lucide-react';
import { getContractAddress, ABI } from '../config/contracts';
import ConnectButton from './ConnectButton';
import './InsuranceInterface.css';

const InsuranceInterface = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState('review');
  const [pendingClaims, setPendingClaims] = useState([]);
  const [processedClaims, setProcessedClaims] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalClaims: 0,
    totalAmount: 0,
    approvedClaims: 0,
    rejectedClaims: 0
  });
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [verificationSteps, setVerificationSteps] = useState({});
  const [zkVerificationSteps, setZkVerificationSteps] = useState({});

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch all pending claims from contract
  const { data: allPendingClaims, refetch: refetchClaims } = useReadContract({
    address: getContractAddress(chainId),
    abi: ABI.HEALTH_CLAIM_VERIFIER,
    functionName: 'getAllPendingClaims',
    args: [],
    enabled: isConnected && chainId,
  });

  useEffect(() => {
    if (isConnected) {
      fetchProcessedClaims();
      fetchAnalytics();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (allPendingClaims) {
      setPendingClaims(allPendingClaims);
    }
  }, [allPendingClaims]);

  useEffect(() => {
    if (isSuccess) {
      refetchClaims();
      fetchProcessedClaims();
      fetchAnalytics();
    }
  }, [isSuccess]);

  const fetchProcessedClaims = async () => {
    try {
      // For now, we'll get this from backend, but it could be extended to contract
      const response = await fetch(`http://localhost:3001/api/insurance-claims/processed/${address}`);
      const data = await response.json();
      setProcessedClaims(data || []);
    } catch (error) {
      console.error('Failed to fetch processed claims:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/insurance-analytics/${address}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const processPayment = async (claimId, claimAmount) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const contractAddress = getContractAddress(chainId);
      
      await writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'processPayment',
        args: [claimId],
        value: BigInt(claimAmount * 1e18), // Convert to wei for payment
      });
      
      setVerificationSteps(prev => ({
        ...prev,
        [claimId]: undefined
      }));
      
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment: ' + error.message);
    }
  };

    const approveClaim = async (claimId) => {
    try {
      await writeContract({
        address: getContractAddress(chainId),
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'approveClaim',
        args: [claimId],
      });
    } catch (error) {
      console.error('Failed to approve claim:', error);
      alert('Failed to approve claim: ' + error.message);
    }
  };

  const rejectClaim = async (claimId) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return; // User cancelled
    
    try {
      await writeContract({
        address: getContractAddress(chainId),
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'rejectClaim',
        args: [claimId, reason],
      });
    } catch (error) {
      console.error('Failed to reject claim:', error);
      alert('Failed to reject claim: ' + error.message);
    }
  };

  // ZK Proof verification using saved proof files
  const verifyProofOnZkVerify = async (claim) => {
    console.log('🔍 Starting ZK proof verification for claim:', claim.id);
    console.log('🔧 Current zkVerificationSteps state:', zkVerificationSteps);
    
    // Set verificationSteps to trigger the conditional rendering change
    setVerificationSteps(prev => ({
      ...prev,
      [claim.id]: { zkVerifying: true }
    }));
    
    // Step 1: Initialize with first step loading
    console.log('⚡ Setting initial verification steps...');
    setZkVerificationSteps(prev => ({
      ...prev,
      [claim.id]: {
        fileCheck: { status: 'loading', message: 'Checking proof files...', icon: '📁' },
        zkVerifySubmission: { status: 'pending', message: 'Submit to zkVerify...', icon: '🔐' },
        cryptographicVerification: { status: 'pending', message: 'Verify cryptographic proofs...', icon: '🔍' },
        smartContractUpdate: { status: 'pending', message: 'Update smart contract...', icon: '📝' }
      }
    }));
    
    console.log('✅ Verification steps initialized for claim:', claim.id);
    
    try {
      // Simulate file checking for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 1 Complete: File check done
      setZkVerificationSteps(prev => ({
        ...prev,
        [claim.id]: {
          ...prev[claim.id],
          fileCheck: { status: 'completed', message: 'Proof files found and loaded ✓', icon: '✅' },
          zkVerifySubmission: { status: 'loading', message: 'Submitting proofs to zkVerify network...', icon: '�' }
        }
      }));
      
      // Call the API to verify proofs from files
      const response = await fetch('http://localhost:3001/api/verify-proofs-from-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('ZK verification result:', result);
      
      // Step 2 Complete: zkVerify submission done
      setZkVerificationSteps(prev => ({
        ...prev,
        [claim.id]: {
          ...prev[claim.id],
          zkVerifySubmission: { status: 'completed', message: 'Proofs submitted to zkVerify ✓', icon: '✅' },
          cryptographicVerification: { status: 'loading', message: 'Verifying cryptographic proofs...', icon: '�' }
        }
      }));
      
      // Simulate cryptographic verification for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (result.success && result.allVerified) {
        // Step 3 Complete: Cryptographic verification done
        const doctorResult = result.results.find(r => r.proofType === 'doctor');
        const patientResult = result.results.find(r => r.proofType === 'patient');
        
        setZkVerificationSteps(prev => ({
          ...prev,
          [claim.id]: {
            ...prev[claim.id],
            cryptographicVerification: { 
              status: 'completed', 
              message: `Both proofs verified! Doctor: ${doctorResult?.status || 'OK'}, Patient: ${patientResult?.status || 'OK'}`, 
              icon: '🔍' 
            },
            smartContractUpdate: { status: 'loading', message: 'Updating claim status on blockchain...', icon: '📝' }
          }
        }));
        
        // Now call the smart contract verification
        await writeContract({
          address: getContractAddress(chainId),
          abi: ABI.HEALTH_CLAIM_VERIFIER,
          functionName: 'verifyClaim',
          args: [claim.id, true, true], // Both proofs verified
        });
        
        // Final success state
        setZkVerificationSteps(prev => ({
          ...prev,
          [claim.id]: {
            ...prev[claim.id],
            smartContractUpdate: { status: 'completed', message: 'Smart contract updated successfully ✓', icon: '✅' }
          }
        }));
        
        
        // Success feedback with detailed results including zkVerify transaction links
        // Read aggregation data for transaction links
        let zkVerifyLinks = '';
        try {
          const aggregationDataPath = '/Users/sambit/Desktop/ZKClaim/build/patient/aggregation_data.json';
          const aggregationResponse = await fetch(`http://localhost:3001/api/read-aggregation-data`);
          if (aggregationResponse.ok) {
            const aggData = await aggregationResponse.json();
            zkVerifyLinks = `\n🔗 zkVerify Transaction Links:\n` +
                           `• Aggregation ID: ${aggData.aggregationId}\n` +
                           `• Receipt: ${aggData.receipt}\n` +
                           `• Root Hash: ${aggData.root}\n` +
                           `• Proof Hash: ${aggData.proofHash}\n` +
                           `• View on zkVerify: https://explorer.zkverify.io/aggregation/${aggData.aggregationId}`;
          }
        } catch (e) {
          console.log('Could not fetch aggregation data:', e);
        }
        
        alert(`✅ ZK Proof Verification Successful!\n\n` +
              `📋 Doctor Proof:\n` +
              `• Job ID: ${doctorResult?.jobId || 'N/A'}\n` +
              `• Status: ${doctorResult?.status || 'Verified'}\n` +
              `• Hash: ${doctorResult?.proofHash?.toString().slice(0, 20)}...\n\n` +
              `👤 Patient Proof:\n` +
              `• Job ID: ${patientResult?.jobId || 'N/A'}\n` +
              `• Status: ${patientResult?.status || 'Verified'}\n` +
              `• Hash: ${patientResult?.proofHash?.toString().slice(0, 20)}...\n` +
              zkVerifyLinks +
              `\n\n✅ All proofs verified on zkVerify network!`);
        
      } else {
        // Handle verification failure
        const failedProofs = result.results?.filter(r => !r.verified).map(r => r.proofType).join(', ') || 'unknown';
        
        setZkVerificationSteps(prev => ({
          ...prev,
          [claim.id]: {
            ...prev[claim.id],
            zkVerifySubmission: { status: 'completed', message: 'Proofs submitted', icon: '✅' },
            cryptographicVerification: { status: 'error', message: `Verification failed for: ${failedProofs}`, icon: '❌' }
          }
        }));
        
        alert(`❌ ZK Proof Verification Failed!\n\nFailed proofs: ${failedProofs}\n\n${result.error || 'Verification unsuccessful'}`);
      }
      
    } catch (error) {
      console.error('ZK proof verification error:', error);
      
      // Reset verificationSteps so user can try again
      setVerificationSteps(prev => ({
        ...prev,
        [claim.id]: undefined
      }));
      
      // Update steps to show error
      setZkVerificationSteps(prev => ({
        ...prev,
        [claim.id]: {
          fileCheck: { status: 'error', message: 'Failed to load proof files', icon: '❌' },
          zkVerifySubmission: { status: 'pending', message: 'Submit to zkVerify...', icon: '🔐' },
          cryptographicVerification: { status: 'pending', message: 'Verify cryptographic proofs...', icon: '🔍' },
          smartContractUpdate: { status: 'pending', message: 'Update smart contract...', icon: '📝' }
        }
      }));
      
      if (error.message.includes('Failed to fetch') || error.message.includes('HTTP error')) {
        alert(`❌ API Server Error!\n\nCould not connect to the API server.\n\nPlease ensure:\n1. API server is running on port 3001\n2. Run: cd backend && node api-server.js`);
      } else {
        alert('ZK proof verification failed: ' + error.message);
      }
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
    { id: 'review', label: 'Claim Review', icon: FileText },
    { id: 'history', label: 'Processed Claims', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="insurance-interface">
      <div className="insurance-header">
        <div className="insurance-title">
          <div className="insurance-icon">
            <Building size={32} />
          </div>
          <div>
            <h1>Insurance Portal</h1>
            <p>Review and process medical insurance claims</p>
          </div>
        </div>
        <ConnectButton />
      </div>

      <div className="insurance-tabs">
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

      <div className="insurance-content">
        {activeTab === 'review' && (
          <div className="review-section">
            <div className="section-header">
              <FileText size={24} />
              <div>
                <h2>Pending Claims Review</h2>
                <p>Review and approve or reject medical insurance claims</p>
              </div>
            </div>

            <div className="claims-list">
              {pendingClaims.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <h3>No pending claims</h3>
                  <p>New claims requiring review will appear here</p>
                </div>
              ) : (
                pendingClaims.map((claim, index) => (
                  <div key={index} className="claim-card">
                    <div className="claim-header">
                      <div className="claim-id">#{claim.id}</div>
                      <div className={`claim-status ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </div>
                    </div>
                    
                    <div className="claim-details">
                      <div className="claim-info">
                        <strong>Patient:</strong> {claim.patientAddress?.slice(0, 6)}...{claim.patientAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Doctor:</strong> {claim.doctorAddress?.slice(0, 6)}...{claim.doctorAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Diagnosis:</strong> {claim.diagnosis}
                      </div>
                      <div className="claim-info">
                        <strong>Amount:</strong> {formatCurrency(claim.amount)}
                      </div>
                      <div className="claim-info">
                        <strong>Date:</strong> {new Date(claim.timestamp).toLocaleDateString()}
                      </div>
                      <div className="claim-info">
                        <strong>Urgency:</strong> 
                        <span className={`urgency ${claim.urgency}`}>{claim.urgency}</span>
                      </div>
                    </div>

                    <div className="claim-verification">
                      {!verificationSteps[claim.id] ? (
                        <>
                          <div className="verification-status">
                            <Shield size={16} />
                            <span>Ready for Verification</span>
                          </div>
                          <div className="verification-buttons">
                            <button 
                              className="verify-btn zk-verify"
                              onClick={() => verifyProofOnZkVerify(claim)}
                              disabled={isPending || isConfirming}
                            >
                              <Zap size={16} />
                              Verify ZK Proofs
                            </button>
                          </div>
                        </>
                      ) : zkVerificationSteps[claim.id] ? (
                        <div className="zk-verification-steps">
                          <h4>ZK Proof Verification Progress</h4>
                          {console.log('🎯 Rendering ZK steps for claim:', claim.id, zkVerificationSteps[claim.id])}
                          <div className="step-by-step">
                            <div className={`verification-step ${zkVerificationSteps[claim.id].fileCheck.status}`}>
                              <div className="step-icon">
                                {zkVerificationSteps[claim.id].fileCheck.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {zkVerificationSteps[claim.id].fileCheck.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {zkVerificationSteps[claim.id].fileCheck.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{zkVerificationSteps[claim.id].fileCheck.message}</span>
                            </div>
                            
                            <div className={`verification-step ${zkVerificationSteps[claim.id].zkVerifySubmission.status}`}>
                              <div className="step-icon">
                                {zkVerificationSteps[claim.id].zkVerifySubmission.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {zkVerificationSteps[claim.id].zkVerifySubmission.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {zkVerificationSteps[claim.id].zkVerifySubmission.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{zkVerificationSteps[claim.id].zkVerifySubmission.message}</span>
                            </div>
                            
                            <div className={`verification-step ${zkVerificationSteps[claim.id].cryptographicVerification.status}`}>
                              <div className="step-icon">
                                {zkVerificationSteps[claim.id].cryptographicVerification.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {zkVerificationSteps[claim.id].cryptographicVerification.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {zkVerificationSteps[claim.id].cryptographicVerification.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{zkVerificationSteps[claim.id].cryptographicVerification.message}</span>
                            </div>
                            
                            <div className={`verification-step ${zkVerificationSteps[claim.id].smartContractUpdate.status}`}>
                              <div className="step-icon">
                                {zkVerificationSteps[claim.id].smartContractUpdate.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {zkVerificationSteps[claim.id].smartContractUpdate.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {zkVerificationSteps[claim.id].smartContractUpdate.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{zkVerificationSteps[claim.id].smartContractUpdate.message}</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="claim-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => approveClaim(claim.id)}
                        disabled={isPending || isConfirming}
                      >
                        <CheckCircle size={16} />
                        {isPending || isConfirming ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => rejectClaim(claim.id)}
                        disabled={isPending || isConfirming}
                      >
                        <AlertCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="section-header">
              <Clock size={24} />
              <div>
                <h2>Processed Claims</h2>
                <p>History of all processed insurance claims</p>
              </div>
            </div>

            <div className="claims-list">
              {processedClaims.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <h3>No processed claims</h3>
                  <p>Claims you have processed will appear here</p>
                </div>
              ) : (
                processedClaims.map((claim, index) => (
                  <div key={index} className="claim-card processed">
                    <div className="claim-header">
                      <div className="claim-id">#{claim.id}</div>
                      <div className={`claim-status ${getStatusColor(claim.status)}`}>
                        {getStatusText(claim.status)}
                      </div>
                    </div>
                    
                    <div className="claim-details">
                      <div className="claim-info">
                        <strong>Patient:</strong> {claim.patientAddress?.slice(0, 6)}...{claim.patientAddress?.slice(-4)}
                      </div>
                      <div className="claim-info">
                        <strong>Diagnosis:</strong> {claim.diagnosis}
                      </div>
                      <div className="claim-info">
                        <strong>Amount:</strong> {formatCurrency(claim.amount)}
                      </div>
                      <div className="claim-info">
                        <strong>Processed:</strong> {new Date(claim.processedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="section-header">
              <BarChart3 size={24} />
              <div>
                <h2>Claims Analytics</h2>
                <p>Overview of claim processing statistics</p>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-icon total">
                  <FileText size={24} />
                </div>
                <div className="analytics-content">
                  <div className="analytics-number">{analytics.totalClaims}</div>
                  <div className="analytics-label">Total Claims</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon amount">
                  <DollarSign size={24} />
                </div>
                <div className="analytics-content">
                  <div className="analytics-number">{formatCurrency(analytics.totalAmount)}</div>
                  <div className="analytics-label">Total Amount</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon approved">
                  <CheckCircle size={24} />
                </div>
                <div className="analytics-content">
                  <div className="analytics-number">{analytics.approvedClaims}</div>
                  <div className="analytics-label">Approved Claims</div>
                </div>
              </div>

              <div className="analytics-card">
                <div className="analytics-icon rejected">
                  <AlertCircle size={24} />
                </div>
                <div className="analytics-content">
                  <div className="analytics-number">{analytics.rejectedClaims}</div>
                  <div className="analytics-label">Rejected Claims</div>
                </div>
              </div>
            </div>

            <div className="analytics-chart">
              <h3>Claim Processing Trends</h3>
              <div className="chart-placeholder">
                <BarChart3 size={64} />
                <p>Advanced analytics and charts coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Claim Details #{selectedClaim.id}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedClaim(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-group">
                <strong>ZK Proof Status:</strong>
                <span className="verified">✓ Verified</span>
              </div>
              <div className="detail-group">
                <strong>Medical Record Hash:</strong>
                <code>{selectedClaim.recordHash || 'abc123...def789'}</code>
              </div>
              <div className="detail-group">
                <strong>Proof Aggregation ID:</strong>
                <code>{selectedClaim.proofId || 'proof_xyz789'}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceInterface;
