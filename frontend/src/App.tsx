import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Types
interface ProofData {
  root: string;
  path: string[];
  index: number;
  leaf: string;
}

interface EthereumWindow extends Window {
  ethereum?: any;
}

declare const window: EthereumWindow;

const BACKEND_URL = 'http://localhost:3001';

// HealthClaimVerifier ABI (simplified for this demo)
const HEALTH_CLAIM_VERIFIER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_settlement", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "root", "type": "bytes32"},
      {"internalType": "bytes32[]", "name": "path", "type": "bytes32[]"},
      {"internalType": "uint256", "name": "index", "type": "uint256"},
      {"internalType": "bytes", "name": "leaf", "type": "bytes"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "root", "type": "bytes32"},
      {"internalType": "bytes32[]", "name": "path", "type": "bytes32[]"},
      {"internalType": "uint256", "name": "index", "type": "uint256"},
      {"internalType": "bytes", "name": "leaf", "type": "bytes"}
    ],
    "name": "approveAndEmit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSettlementContract",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "root", "type": "bytes32"},
      {"indexed": true, "internalType": "uint256", "name": "index", "type": "uint256"},
      {"indexed": true, "internalType": "bytes32", "name": "leafHash", "type": "bytes32"},
      {"indexed": false, "internalType": "address", "name": "approver", "type": "address"}
    ],
    "name": "ClaimApproved",
    "type": "event"
  }
];

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0x1111111111111111111111111111111111111111"; // Placeholder

function App() {
  // State management
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setError('');
      
      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      // Create provider and signer (ethers v6 syntax)
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const userAccount = accounts[0];

      // Check if we're on Horizen Testnet
      const network = await web3Provider.getNetwork();
      if (network.chainId !== BigInt(845320009)) {
        throw new Error('Please switch to Horizen Testnet (Chain ID: 845320009)');
      }

      // Create contract instance
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        HEALTH_CLAIM_VERIFIER_ABI,
        web3Signer
      );

      // Update state
      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(contractInstance);
      setAccount(userAccount);

      console.log('Wallet connected:', userAccount);
      console.log('Network:', network.name, 'Chain ID:', network.chainId.toString());
      setSuccess('Wallet connected successfully to Horizen Testnet!');
      
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  // Generate runtime inputs and submit proofs
  const submitProofs = async () => {
    try {
      setLoading({ ...loading, submit: true });
      setError('');
      setSuccess('');

      console.log('Generating runtime inputs and submitting proofs...');
      
      // Generate inputs at runtime as specified
      const doctorInput = {
        procedure_code: 1001,
        doctor_id: Date.now(),
        date: Number(new Date().toISOString().slice(0,10).replace(/-/g,''))
      };
      
      const patientInput = {
        doctor_proof_hash: "0", // Will be updated by backend
        patient_id: Math.floor(Math.random()*1e9),
        policy_limit: 500000,
        claim_amount: 450000
      };
      
      console.log('Generated inputs:', { doctorInput, patientInput });
      
      const response = await fetch(`${BACKEND_URL}/api/submit-claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorInput, patientInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to submit proofs');
      }

      const result = await response.json();
      console.log('Proof submission result:', result);

      // Store proof data for approval
      setProofData(result.data);
      setSuccess('Proofs generated and submitted successfully! You can now approve the claim.');
      
    } catch (err: any) {
      console.error('Proof submission failed:', err);
      setError(err.message || 'Failed to submit proofs');
    } finally {
      setLoading({ ...loading, submit: false });
    }
  };

  // Approve claim on blockchain
  const approveClaim = async () => {
    try {
      if (!contract || !signer || !proofData) {
        throw new Error('Missing required data for claim approval');
      }

      setLoading({ ...loading, approve: true });
      setError('');
      setSuccess('');
      setTxHash('');

      console.log('Approving claim on Horizen Testnet...');
      console.log('Proof data:', proofData);

      // Convert proof data to appropriate format (ethers v6 syntax)
      const root = proofData.root;
      const path = proofData.path.map(p => p); // Already in hex format
      const index = proofData.index;
      const leaf = proofData.leaf; // Already in hex format

      console.log('Formatted parameters:', { root, path, index, leaf });

      // Call the approve function
      const tx = await contract.approveAndEmit(root, path, index, leaf);
      console.log('Transaction submitted:', tx.hash);
      setTxHash(tx.hash);

      setSuccess(`Transaction submitted: ${tx.hash}. Waiting for confirmation...`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Check for events
      const claimApprovedEvent = receipt.logs?.find(
        (log: any) => log.eventName === 'ClaimApproved'
      );

      if (claimApprovedEvent) {
        setSuccess(`✅ Claim approved successfully! Transaction: ${receipt.hash}`);
      } else {
        setSuccess(`Transaction confirmed: ${receipt.hash}`);
      }
      
    } catch (err: any) {
      console.error('Claim approval failed:', err);
      
      // Parse error message
      let errorMessage = 'Failed to approve claim';
      if (err.message?.includes('InvalidProof')) {
        errorMessage = 'Invalid proof - verification failed';
      } else if (err.message?.includes('EmptyPath')) {
        errorMessage = 'Invalid proof path';
      } else if (err.message?.includes('EmptyLeaf')) {
        errorMessage = 'Invalid leaf data';
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected by user';
      }
      
      setError(errorMessage);
    } finally {
      setLoading({ ...loading, approve: false });
    }
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount('');
          setProvider(null);
          setSigner(null);
          setContract(null);
          setProofData(null);
        } else {
          // Account changed
          connectWallet();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏥 ZKClaim - Privacy-Preserving Health Insurance</h1>
        <p>Powered by zkVerify.io on Horizen Testnet</p>
        
        {/* Network Info */}
        <div className="network-info">
          <strong>Horizen Testnet (Base Sepolia)</strong><br/>
          Chain ID: 845320009<br/>
          <a href="https://horizen-explorer-testnet.appchain.base.org/" target="_blank" rel="noopener noreferrer">
            Block Explorer
          </a>
        </div>
        
        {/* Wallet Connection */}
        <div className="wallet-section">
          {!account ? (
            <button 
              onClick={connectWallet}
              className="btn btn-primary"
              disabled={loading.connect}
            >
              {loading.connect ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          ) : (
            <div className="connected-wallet">
              <p>✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-error">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="alert alert-success">
            <strong>✅ Success:</strong> {success}
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <div className="tx-hash">
            <strong>Transaction:</strong>{' '}
            <a 
              href={`https://horizen-explorer-testnet.appchain.base.org/tx/${txHash}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        )}

        {/* Main Actions */}
        {account && (
          <div className="actions-section">
            <div className="action-card">
              <h3>🔐 Step 1: Generate & Submit Proofs</h3>
              <p>Generate inputs at runtime and submit zero-knowledge proofs to zkVerify</p>
              <div className="input-preview">
                <strong>Runtime Inputs:</strong><br/>
                Doctor: procedure_code, doctor_id, date<br/>
                Patient: patient_id, policy_limit, claim_amount
              </div>
              <button
                onClick={submitProofs}
                className="btn btn-secondary"
                disabled={loading.submit}
              >
                {loading.submit ? 'Generating & Submitting...' : 'Generate & Submit Proofs'}
              </button>
            </div>

            <div className="action-card">
              <h3>✅ Step 2: Approve Claim</h3>
              <p>Verify proofs on-chain and approve the insurance claim</p>
              <button
                onClick={approveClaim}
                className="btn btn-success"
                disabled={loading.approve || !proofData}
              >
                {loading.approve ? 'Approving...' : 'Approve Claim'}
              </button>
              {!proofData && (
                <p className="hint">Submit proofs first to enable approval</p>
              )}
            </div>
          </div>
        )}

        {/* Proof Data Display */}
        {proofData && (
          <div className="proof-data">
            <h3>📊 zkVerify Proof Data</h3>
            <div className="data-display">
              <div className="data-row">
                <strong>Merkle Root:</strong> {proofData.root}
              </div>
              <div className="data-row">
                <strong>Leaf Index:</strong> {proofData.index}
              </div>
              <div className="data-row">
                <strong>Valid Claim Hash:</strong> {proofData.leaf}
              </div>
              <div className="data-row">
                <strong>Merkle Path Length:</strong> {proofData.path.length}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h3>📖 How it works:</h3>
          <ol>
            <li><strong>Generate & Submit:</strong> Creates doctor and patient proofs with runtime inputs</li>
            <li><strong>zkVerify Processing:</strong> Aggregates proofs and publishes Merkle root to Horizen</li>
            <li><strong>On-chain Approval:</strong> Verifies inclusion proof and approves claim</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
