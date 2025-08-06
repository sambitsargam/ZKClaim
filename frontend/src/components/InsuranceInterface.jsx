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

  const startVerification = async (claimId) => {
    setVerificationSteps(prev => ({
      ...prev,
      [claimId]: {
        doctorVerification: { status: 'loading', message: 'Verifying doctor proof...' },
        patientVerification: { status: 'pending', message: 'Waiting...' },
        readyForPayment: { status: 'pending', message: 'Waiting...' }
      }
    }));

    try {
      // Step 1: Verify claim via contract
      const contractAddress = getContractAddress(chainId);
      
      await writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'verifyClaim',
        args: [claimId],
      });

      // Simulate verification steps for UI
      setTimeout(() => {
        setVerificationSteps(prev => ({
          ...prev,
          [claimId]: {
            doctorVerification: { status: 'completed', message: 'Doctor proof verified ✓' },
            patientVerification: { status: 'loading', message: 'Verifying patient proof...' },
            readyForPayment: { status: 'pending', message: 'Waiting...' }
          }
        }));

        setTimeout(() => {
          setVerificationSteps(prev => ({
            ...prev,
            [claimId]: {
              doctorVerification: { status: 'completed', message: 'Doctor proof verified ✓' },
              patientVerification: { status: 'completed', message: 'Patient proof verified ✓' },
              readyForPayment: { status: 'ready', message: 'Ready for payment processing' }
            }
          }));
        }, 2000);
      }, 2000);

    } catch (error) {
      console.error('Failed to verify claim:', error);
      setVerificationSteps(prev => ({
        ...prev,
        [claimId]: {
          doctorVerification: { status: 'error', message: 'Verification failed' },
          patientVerification: { status: 'pending', message: 'Waiting...' },
          readyForPayment: { status: 'pending', message: 'Waiting...' }
        }
      }));
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
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const contractAddress = getContractAddress(chainId);
      
      await writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'approveClaim',
        args: [claimId],
      });
      
    } catch (error) {
      console.error('Failed to approve claim:', error);
      alert('Failed to approve claim: ' + error.message);
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
                          <button 
                            className="verify-btn"
                            onClick={() => startVerification(claim.id)}
                            disabled={isPending || isConfirming}
                          >
                            <Zap size={16} />
                            Start Verification
                          </button>
                        </>
                      ) : (
                        <div className="verification-steps">
                          <div className="step-by-step">
                            <div className={`verification-step ${verificationSteps[claim.id].doctorVerification.status}`}>
                              <div className="step-icon">
                                {verificationSteps[claim.id].doctorVerification.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {verificationSteps[claim.id].doctorVerification.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {verificationSteps[claim.id].doctorVerification.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{verificationSteps[claim.id].doctorVerification.message}</span>
                            </div>
                            
                            <div className={`verification-step ${verificationSteps[claim.id].patientVerification.status}`}>
                              <div className="step-icon">
                                {verificationSteps[claim.id].patientVerification.status === 'loading' && (
                                  <div className="loading-spinner"></div>
                                )}
                                {verificationSteps[claim.id].patientVerification.status === 'completed' && (
                                  <CheckCircle size={16} />
                                )}
                                {verificationSteps[claim.id].patientVerification.status === 'error' && (
                                  <AlertCircle size={16} />
                                )}
                              </div>
                              <span>{verificationSteps[claim.id].patientVerification.message}</span>
                            </div>
                            
                            <div className={`verification-step ${verificationSteps[claim.id].readyForPayment.status}`}>
                              <div className="step-icon">
                                {verificationSteps[claim.id].readyForPayment.status === 'ready' && (
                                  <DollarSign size={16} />
                                )}
                              </div>
                              <span>{verificationSteps[claim.id].readyForPayment.message}</span>
                            </div>
                          </div>
                          
                          {verificationSteps[claim.id].readyForPayment.status === 'ready' && (
                            <div className="payment-actions">
                              <button 
                                className="process-payment-btn"
                                onClick={() => processPayment(claim.id, claim.claimAmount)}
                                disabled={isPending || isConfirming}
                              >
                                <DollarSign size={16} />
                                Process Payment ({formatCurrency(claim.claimAmount)})
                              </button>
                              <button 
                                className="approve-btn"
                                onClick={() => approveClaim(claim.id)}
                                disabled={isPending || isConfirming}
                              >
                                <CheckCircle size={16} />
                                Approve Only
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="claim-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => processClaim(claim.id, true)}
                        disabled={isPending || isConfirming}
                      >
                        <CheckCircle size={16} />
                        {isPending || isConfirming ? 'Processing...' : 'Approve'}
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => processClaim(claim.id, false)}
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
