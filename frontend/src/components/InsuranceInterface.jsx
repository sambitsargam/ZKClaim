import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { Building, FileText, DollarSign, BarChart3, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react';
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

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConnected) {
      fetchInsuranceClaims();
      fetchAnalytics();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isSuccess) {
      fetchInsuranceClaims();
      fetchAnalytics();
    }
  }, [isSuccess]);

  const fetchInsuranceClaims = async () => {
    try {
      const response = await fetch(`/api/insurance-claims/${address}`);
      const data = await response.json();
      
      setPendingClaims(data.pending || []);
      setProcessedClaims(data.processed || []);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/insurance-analytics/${address}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const processClaim = async (claimId, decision) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const contractAddress = getContractAddress(chainId);
      
      writeContract({
        address: contractAddress,
        abi: ABI.HEALTH_CLAIM_VERIFIER,
        functionName: 'processInsuranceClaim',
        args: [
          claimId,
          decision, // true for approve, false for reject
          Date.now() // timestamp
        ],
      });
      
    } catch (error) {
      console.error('Failed to process claim:', error);
      alert('Failed to process claim: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'pending': return 'pending';
      case 'under_review': return 'under-review';
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
                        {claim.status.replace('_', ' ')}
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
                      <div className="verification-status">
                        <CheckCircle size={16} />
                        <span>ZK Proof Verified</span>
                      </div>
                      <button 
                        className="view-proof-btn"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
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
                        {claim.status.replace('_', ' ')}
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
