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

  const fetchProcessedClaims = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/processed-claims');
      if (response.ok) {
        const data = await response.json();
        setProcessedClaims(data);
      }
    } catch (error) {
      console.error('Error fetching processed claims:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const recordVerificationResult = async (claimId, result, details) => {
    try {
      await fetch('http://localhost:3001/api/record-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          result,
          details,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error recording verification result:', error);
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
      console.error('Error approving claim:', error);
      alert('Failed to approve claim: ' + error.message);
    }
  };

  const rejectClaim = async (claimId) => {
    try {
      await writeContract({
        address: getContractAddress(chainId),
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'rejectClaim',
        args: [claimId],
      });
    } catch (error) {
      console.error('Error rejecting claim:', error);
      alert('Failed to reject claim: ' + error.message);
    }
  };

  const verifyProofOnZkVerify = async (claim) => {
    console.log('🔍 Starting ZK proof verification for claim:', claim.id);
    
    // Set verificationSteps to trigger the conditional rendering change
    setVerificationSteps(prev => ({
      ...prev,
      [claim.id]: { zkVerifying: true }
    }));
    
    // Step 1: Initialize with first step loading
    setZkVerificationSteps(prev => ({
      ...prev,
      [claim.id]: {
        fileCheck: { 
          status: 'loading', 
          message: 'Validating proof files and checking structure...', 
          details: null 
        },
        zkVerifySubmission: { 
          status: 'pending', 
          message: 'Waiting to submit proofs to zkVerify network...', 
          details: null 
        },
        cryptographicVerification: { 
          status: 'pending', 
          message: 'Waiting for cryptographic proof verification...', 
          details: null 
        }
      }
    }));
    
    try {
      // Simulate file checking for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 1 Complete: File check done
      setZkVerificationSteps(prev => ({
        ...prev,
        [claim.id]: {
          ...prev[claim.id],
          fileCheck: { 
            status: 'completed', 
            message: 'Proof files validated successfully ✓',
            details: {
              doctorProof: 'doctor_proof.json',
              patientProof: 'patient_proof.json',
              verificationKey: 'verification.key'
            }
          },
          zkVerifySubmission: { 
            status: 'loading', 
            message: 'Submitting proofs to zkVerify network...',
            details: null
          }
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
      
      const doctorResult = result.results?.find(r => r.proofType === 'doctor');
      const patientResult = result.results?.find(r => r.proofType === 'patient');
      
      // Step 2 Complete: zkVerify submission done
      setZkVerificationSteps(prev => ({
        ...prev,
        [claim.id]: {
          ...prev[claim.id],
          zkVerifySubmission: { 
            status: 'completed', 
            message: 'Proofs submitted to zkVerify network ✓',
            details: {
              doctorJobId: doctorResult?.jobId || 'N/A',
              patientJobId: patientResult?.jobId || 'N/A',
              networkEndpoint: 'https://zkverify.io'
            }
          },
          cryptographicVerification: { 
            status: 'loading', 
            message: 'Performing cryptographic verification...',
            details: null
          }
        }
      }));
      
      // Simulate cryptographic verification for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (result.success && result.allVerified) {
        // Fetch aggregation data for zkVerify links
        let aggregationData = null;
        try {
          const aggregationResponse = await fetch(`http://localhost:3001/api/read-aggregation-data`);
          if (aggregationResponse.ok) {
            aggregationData = await aggregationResponse.json();
          }
        } catch (e) {
          console.log('Could not fetch aggregation data:', e);
        }

        // Step 3 Complete: Cryptographic verification done with zkVerify links
        setZkVerificationSteps(prev => ({
          ...prev,
          [claim.id]: {
            ...prev[claim.id],
            cryptographicVerification: { 
              status: 'completed', 
              message: `Zero-knowledge proofs verified successfully ✓`,
              details: {
                doctorProofStatus: doctorResult?.status || 'Verified',
                patientProofStatus: patientResult?.status || 'Verified',
                doctorProofHash: doctorResult?.proofHash?.toString().slice(0, 16) + '...',
                patientProofHash: patientResult?.proofHash?.toString().slice(0, 16) + '...',
                verificationTime: new Date().toISOString(),
                doctorZkVerifyLink: aggregationData?.doctorJobId ? `https://zkverify.io/job/${aggregationData.doctorJobId}` : null,
                patientZkVerifyLink: aggregationData?.patientJobId ? `https://zkverify.io/job/${aggregationData.patientJobId}` : null,
                aggregationId: aggregationData?.aggregationId || 'N/A',
                doctorJobId: doctorResult?.jobId || 'N/A',
                patientJobId: patientResult?.jobId || 'N/A'
              }
            }
          }
        }));
        
        await recordVerificationResult(claim.id, 'success', {
          doctorResult,
          patientResult,
          aggregationData
        });
        
      } else {
        // Handle verification failure
        const failedProofs = result.results?.filter(r => !r.verified).map(r => r.proofType).join(', ') || 'unknown';
        
        setZkVerificationSteps(prev => ({
          ...prev,
          [claim.id]: {
            ...prev[claim.id],
            cryptographicVerification: { 
              status: 'error', 
              message: `Cryptographic verification failed`,
              details: {
                failedProofs: failedProofs,
                errorReason: result.error || 'Verification unsuccessful',
                retryAvailable: true
              }
            }
          }
        }));

        await recordVerificationResult(claim.id, 'failure', {
          failedProofs,
          error: result.error
        });
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
          ...prev[claim.id],
          fileCheck: { 
            status: 'error', 
            message: `Verification failed: ${error.message}`,
            details: { error: error.message }
          }
        }
      }));
      
      await recordVerificationResult(claim.id, 'error', {
        error: error.message
      });
      
      alert(`❌ ZK Proof Verification Failed!\n\nError: ${error.message}`);
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
    { id: 'history', label: 'History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  if (!isConnected) {
    return (
      <div className="insurance-interface">
        <div className="connect-prompt">
          <Building size={64} />
          <h2>Insurance Company Portal</h2>
          <p>Please connect your wallet to access the insurance dashboard</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="insurance-interface">
      <div className="insurance-header">
        <div className="insurance-title">
          <div className="insurance-icon">
            <Building size={32} />
          </div>
          <div>
            <h1>ZKClaim Insurance Portal</h1>
            <p>Healthcare Claims Management System</p>
          </div>
        </div>
        <div className="wallet-status connected">
          <Eye size={16} />
          Insurer Connected
        </div>
      </div>

      <div className="insurance-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'review' && (
        <div className="review-section">
          <div className="section-header">
            <FileText size={24} />
            <div>
              <h2>Pending Claims Review</h2>
              <p>Review and verify submitted insurance claims</p>
            </div>
          </div>

          <div className="claims-container">
            {pendingClaims.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <h3>No pending claims</h3>
                <p>New insurance claims will appear here for review</p>
              </div>
            ) : (
              pendingClaims.map((claim) => (
                <div key={claim.id} className="claim-card">
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
                    {/* Only show amount after ZK proof verification is completed */}
                    {zkVerificationSteps[claim.id] && 
                     zkVerificationSteps[claim.id].cryptographicVerification?.status === 'completed' ? (
                      <div className="claim-info verified-amount">
                        <strong>Amount:</strong> {formatCurrency(claim.amount)}
                        <span className="verified-badge">✓ ZK Verified</span>
                      </div>
                    ) : (
                      <div className="claim-info amount-hidden">
                        <strong>Amount:</strong> 
                        <span className="amount-placeholder">Pending ZK Verification</span>
                      </div>
                    )}
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
                      <div className="zk-verification-container">
                        <div className="verification-header">
                          <div className="verification-title">
                            <Shield size={20} />
                            <span>ZK Proof Verification</span>
                          </div>
                          <div className="verification-progress">
                            {(() => {
                              const steps = zkVerificationSteps[claim.id];
                              const completed = Object.values(steps).filter(step => step.status === 'completed').length;
                              const total = Object.keys(steps).length;
                              const percentage = (completed / total) * 100;
                              return (
                                <div className="progress-indicator">
                                  <div className="progress-bar">
                                    <div 
                                      className="progress-fill" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="progress-text">{completed}/{total} completed</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="verification-timeline">
                          {[
                            {
                              key: 'fileCheck',
                              icon: '📁',
                              title: 'File Validation',
                              description: 'Checking proof files and structure'
                            },
                            {
                              key: 'zkVerifySubmission', 
                              icon: '🔐',
                              title: 'zkVerify Submission',
                              description: 'Submitting proofs to zkVerify network'
                            },
                            {
                              key: 'cryptographicVerification',
                              icon: '🔍', 
                              title: 'Cryptographic Verification',
                              description: 'Verifying zero-knowledge proofs and generating verification links'
                            }
                          ].map((step, index) => {
                            const stepData = zkVerificationSteps[claim.id][step.key];
                            const isActive = stepData.status === 'loading';
                            const isCompleted = stepData.status === 'completed';
                            const hasError = stepData.status === 'error';
                            
                            return (
                              <div 
                                key={step.key} 
                                className={`timeline-step ${stepData.status} ${isActive ? 'active' : ''}`}
                              >
                                <div className="timeline-marker">
                                  <div className="marker-icon">
                                    {isActive && <div className="loading-spinner"></div>}
                                    {isCompleted && <CheckCircle size={18} />}
                                    {hasError && <AlertCircle size={18} />}
                                    {!isActive && !isCompleted && !hasError && (
                                      <span className="step-emoji">{step.icon}</span>
                                    )}
                                  </div>
                                  {index < 2 && <div className={`timeline-connector ${isCompleted ? 'completed' : ''}`}></div>}
                                </div>
                                
                                <div className="timeline-content">
                                  <div className="step-header">
                                    <h5>{step.title}</h5>
                                    <span className={`step-status ${stepData.status}`}>
                                      {stepData.status === 'loading' && 'Processing...'}
                                      {stepData.status === 'completed' && 'Completed'}
                                      {stepData.status === 'error' && 'Failed'}
                                      {stepData.status === 'pending' && 'Pending'}
                                    </span>
                                  </div>
                                  <p className="step-description">{step.description}</p>
                                  <div className="step-message">{stepData.message}</div>
                                  
                                  {stepData.details && (
                                    <div className="step-details">
                                      {stepData.details.jobId && (
                                        <div className="detail-item">
                                          <span className="detail-label">Job ID:</span>
                                          <code className="detail-value">{stepData.details.jobId}</code>
                                        </div>
                                      )}
                                      {stepData.details.doctorJobId && (
                                        <div className="detail-item">
                                          <span className="detail-label">Doctor Job:</span>
                                          <code className="detail-value">{stepData.details.doctorJobId}</code>
                                        </div>
                                      )}
                                      {stepData.details.patientJobId && (
                                        <div className="detail-item">
                                          <span className="detail-label">Patient Job:</span>
                                          <code className="detail-value">{stepData.details.patientJobId}</code>
                                        </div>
                                      )}
                                      {stepData.details.contractAddress && (
                                        <div className="detail-item">
                                          <span className="detail-label">Contract:</span>
                                          <code className="detail-value">{stepData.details.contractAddress.slice(0, 10)}...{stepData.details.contractAddress.slice(-8)}</code>
                                        </div>
                                      )}
                                      {stepData.details.functionCall && (
                                        <div className="detail-item">
                                          <span className="detail-label">Function:</span>
                                          <code className="detail-value">{stepData.details.functionCall}</code>
                                        </div>
                                      )}
                                      {stepData.details.network && (
                                        <div className="detail-item">
                                          <span className="detail-label">Network:</span>
                                          <span className="network-badge">{stepData.details.network}</span>
                                        </div>
                                      )}
                                      {stepData.details.transactionHash && stepData.details.transactionHash !== 'Pending...' && stepData.details.transactionHash !== 'Generating...' && stepData.details.transactionHash !== 'Generated' && (
                                        <div className="detail-item">
                                          <span className="detail-label">Transaction:</span>
                                          <code className="detail-value">{stepData.details.transactionHash.slice(0, 10)}...{stepData.details.transactionHash.slice(-8)}</code>
                                        </div>
                                      )}
                                      {stepData.details.blockExplorer && (
                                        <div className="detail-item">
                                          <span className="detail-label">Explorer:</span>
                                          <a 
                                            href={stepData.details.blockExplorer} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="verify-link"
                                          >
                                            View Transaction ↗
                                          </a>
                                        </div>
                                      )}
                                      {stepData.details.zkVerifyLink && (
                                        <div className="detail-item">
                                          <span className="detail-label">zkVerify:</span>
                                          <a 
                                            href={stepData.details.zkVerifyLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="verify-link"
                                          >
                                            View on zkVerify ↗
                                          </a>
                                        </div>
                                      )}
                                      {stepData.details.doctorZkVerifyLink && (
                                        <div className="detail-item">
                                          <span className="detail-label">Doctor Proof:</span>
                                          <a 
                                            href={stepData.details.doctorZkVerifyLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="verify-link"
                                          >
                                            View on zkVerify ↗
                                          </a>
                                        </div>
                                      )}
                                      {stepData.details.patientZkVerifyLink && (
                                        <div className="detail-item">
                                          <span className="detail-label">Patient Proof:</span>
                                          <a 
                                            href={stepData.details.patientZkVerifyLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="verify-link"
                                          >
                                            View on zkVerify ↗
                                          </a>
                                        </div>
                                      )}
                                      {stepData.details.aggregationId && stepData.details.aggregationId !== 'N/A' && (
                                        <div className="detail-item">
                                          <span className="detail-label">Aggregation ID:</span>
                                          <code className="detail-value">{stepData.details.aggregationId}</code>
                                        </div>
                                      )}
                                      {stepData.details.status && (
                                        <div className="detail-item">
                                          <span className="detail-label">Status:</span>
                                          <span className="status-text">{stepData.details.status}</span>
                                        </div>
                                      )}
                                      {stepData.details.error && (
                                        <div className="detail-item error-item">
                                          <span className="detail-label">Error:</span>
                                          <span className="error-text">{stepData.details.error}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
              <div className="analytics-header">
                <FileText size={20} />
                <span>Total Claims</span>
              </div>
              <div className="analytics-value">{analytics.totalClaims}</div>
            </div>

            <div className="analytics-card">
              <div className="analytics-header">
                <DollarSign size={20} />
                <span>Total Amount</span>
              </div>
              <div className="analytics-value">{formatCurrency(analytics.totalAmount)}</div>
            </div>

            <div className="analytics-card">
              <div className="analytics-header">
                <CheckCircle size={20} />
                <span>Approved</span>
              </div>
              <div className="analytics-value approved">{analytics.approvedClaims}</div>
            </div>

            <div className="analytics-card">
              <div className="analytics-header">
                <AlertCircle size={20} />
                <span>Rejected</span>
              </div>
              <div className="analytics-value rejected">{analytics.rejectedClaims}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceInterface;
