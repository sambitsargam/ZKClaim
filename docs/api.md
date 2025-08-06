# API Reference

## Overview

The ZKClaim API provides RESTful endpoints for interacting with the zero-knowledge healthcare claims system. All API endpoints are secured and support both traditional authentication and Web3 wallet signatures.

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.zkclaim.io/v1
```

## Authentication

### 1. Web3 Wallet Authentication

```javascript
// Sign authentication message with wallet
const message = `Sign this message to authenticate with ZKClaim: ${timestamp}`;
const signature = await wallet.signMessage(message);

// Include in request headers
headers: {
  'Authorization': `Bearer ${signature}`,
  'X-Wallet-Address': walletAddress,
  'X-Timestamp': timestamp
}
```

### 2. JWT Token Authentication

```javascript
// Login to receive JWT token
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '0x...',
    signature: 'signature',
    message: 'message'
  })
});

const { token } = await response.json();

// Use token in subsequent requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Endpoints

### Claims Management

#### `POST /api/claims/submit`

Submit a new healthcare claim with zero-knowledge proofs.

**Request:**
```json
{
  "patientAddress": "0x1234567890123456789012345678901234567890",
  "doctorProofHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "patientProof": {
    "proof": {
      "pi_a": ["...", "..."],
      "pi_b": [["...", "..."], ["...", "..."]],
      "pi_c": ["...", "..."]
    },
    "publicSignals": ["...", "...", "..."]
  },
  "claimAmount": "1000",
  "metadata": {
    "urgency": "normal",
    "category": "medical_treatment"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": 12345,
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00Z",
    "transactionHash": "0x...",
    "estimatedProcessingTime": "2-4 hours"
  }
}
```

#### `GET /api/claims/:claimId`

Retrieve details of a specific claim.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "patientAddress": "0x1234567890123456789012345678901234567890",
    "status": "verified",
    "claimAmount": "1000",
    "submittedAt": "2024-01-15T10:30:00Z",
    "verifiedAt": "2024-01-15T12:45:00Z",
    "zkVerification": {
      "doctorProofStatus": "verified",
      "patientProofStatus": "verified",
      "zkVerifyLinks": {
        "doctor": "https://zkverify-testnet.subscan.io/tx/0x...",
        "patient": "https://zkverify-testnet.subscan.io/tx/0x..."
      }
    }
  }
}
```

#### `GET /api/claims/patient/:address`

Get all claims for a specific patient address.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "status": "approved",
      "claimAmount": "1000",
      "submittedAt": "2024-01-15T10:30:00Z",
      "processedAt": "2024-01-15T14:20:00Z"
    },
    {
      "id": 12346,
      "status": "pending",
      "claimAmount": "750",
      "submittedAt": "2024-01-16T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

#### `GET /api/claims/pending`

Get all pending claims (insurance company access).

**Headers:**
```
Authorization: Bearer <insurance_token>
X-Role: insurance
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12347,
      "patientAddress": "0x...",
      "claimAmount": "1500",
      "submittedAt": "2024-01-16T11:30:00Z",
      "doctorVerified": true,
      "zkProofStatus": "pending"
    }
  ]
}
```

### Doctor Verification

#### `POST /api/doctor/verify-patient`

Submit doctor verification for a patient.

**Request:**
```json
{
  "patientAddress": "0x1234567890123456789012345678901234567890",
  "diagnosis": {
    "code": "encrypted_diagnosis_hash",
    "severity": 2,
    "treatmentRequired": true
  },
  "doctorProof": {
    "proof": {
      "pi_a": ["...", "..."],
      "pi_b": [["...", "..."], ["...", "..."]],
      "pi_c": ["...", "..."]
    },
    "publicSignals": ["...", "...", "..."]
  },
  "attestation": {
    "timestamp": 1705320600,
    "validUntil": 1705407000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "doc_verify_123",
    "proofHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "status": "submitted",
    "zkVerifyJobId": "a9256704-72cd-11f0-ace6-52e9cfc5c9c6"
  }
}
```

#### `GET /api/doctor/verifications`

Get all verifications submitted by the authenticated doctor.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "verificationId": "doc_verify_123",
      "patientAddress": "0x...",
      "status": "verified",
      "submittedAt": "2024-01-16T10:00:00Z",
      "verifiedAt": "2024-01-16T10:02:30Z",
      "zkVerifyLink": "https://zkverify-testnet.subscan.io/tx/0x..."
    }
  ]
}
```

### Zero-Knowledge Proof Operations

#### `POST /api/proofs/generate-witness`

Generate witness for a zero-knowledge circuit.

**Request:**
```json
{
  "circuitType": "patient",
  "inputs": {
    "patientId": "hashed_patient_id",
    "claimAmount": 1000,
    "policyLimit": 5000,
    "doctorProof": "0x..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "witnessId": "witness_abc123",
    "witness": ["...", "...", "..."],
    "publicSignals": ["...", "...", "..."],
    "generatedAt": "2024-01-16T12:00:00Z"
  }
}
```

#### `POST /api/proofs/generate`

Generate a zero-knowledge proof from witness.

**Request:**
```json
{
  "circuitType": "patient",
  "witness": ["...", "...", "..."],
  "provingKey": "optional_custom_proving_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": ["...", "..."],
      "pi_b": [["...", "..."], ["...", "..."]],
      "pi_c": ["...", "..."]
    },
    "publicSignals": ["...", "...", "..."],
    "proofHash": "0x...",
    "generatedAt": "2024-01-16T12:01:30Z"
  }
}
```

#### `POST /api/proofs/verify`

Verify a zero-knowledge proof locally.

**Request:**
```json
{
  "circuitType": "doctor",
  "proof": {
    "pi_a": ["...", "..."],
    "pi_b": [["...", "..."], ["...", "..."]],
    "pi_c": ["...", "..."]
  },
  "publicSignals": ["...", "...", "..."],
  "verificationKey": "optional_custom_vk"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "verifiedAt": "2024-01-16T12:05:00Z",
    "verificationMethod": "local"
  }
}
```

### zkVerify Integration

#### `POST /api/zkverify/submit-proof`

Submit proof to zkVerify network for professional verification.

**Request:**
```json
{
  "proof": {
    "pi_a": ["...", "..."],
    "pi_b": [["...", "..."], ["...", "..."]],
    "pi_c": ["...", "..."]
  },
  "publicSignals": ["...", "...", "..."],
  "circuitType": "doctor",
  "metadata": {
    "claimId": 12345,
    "proofType": "doctor_verification"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "a9256704-72cd-11f0-ace6-52e9cfc5c9c6",
    "status": "submitted",
    "submittedAt": "2024-01-16T12:10:00Z",
    "estimatedCompletionTime": "30-90 seconds"
  }
}
```

#### `GET /api/zkverify/status/:jobId`

Check the status of a zkVerify verification job.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "a9256704-72cd-11f0-ace6-52e9cfc5c9c6",
    "status": "verified",
    "verificationResult": {
      "isValid": true,
      "proofHash": "0x...",
      "transactionHash": "0x26f5bca2ccce81131eb30a5772fdc707c046c98ca88f34a2f042bb869d93bc25",
      "blockNumber": 12345678,
      "aggregationId": 62,
      "zkVerifyLink": "https://zkverify-testnet.subscan.io/tx/0x26f5..."
    },
    "completedAt": "2024-01-16T12:11:30Z"
  }
}
```

#### `POST /api/zkverify/batch-submit`

Submit multiple proofs for batch verification.

**Request:**
```json
{
  "proofs": [
    {
      "proof": { /* doctor proof */ },
      "publicSignals": ["...", "...", "..."],
      "circuitType": "doctor",
      "metadata": { "claimId": 12345 }
    },
    {
      "proof": { /* patient proof */ },
      "publicSignals": ["...", "...", "..."],
      "circuitType": "patient",
      "metadata": { "claimId": 12345 }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "jobIds": [
      "a9256704-72cd-11f0-ace6-52e9cfc5c9c6",
      "0ccb1d96-72ce-11f0-ace6-52e9cfc5c9c6"
    ],
    "submittedAt": "2024-01-16T12:15:00Z"
  }
}
```

### Insurance Operations

#### `POST /api/insurance/approve-claim`

Approve a verified claim for payment.

**Headers:**
```
Authorization: Bearer <insurance_token>
X-Role: insurance
```

**Request:**
```json
{
  "claimId": 12345,
  "approvalAmount": 1000,
  "approvalNotes": "All verifications passed, proceeding with payment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": 12345,
    "status": "approved",
    "approvedAmount": 1000,
    "approvedAt": "2024-01-16T14:30:00Z",
    "paymentScheduled": "2024-01-17T10:00:00Z",
    "transactionHash": "0x..."
  }
}
```

#### `POST /api/insurance/reject-claim`

Reject a claim with reason.

**Request:**
```json
{
  "claimId": 12345,
  "rejectionReason": "Insufficient medical evidence",
  "rejectionCategory": "documentation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimId": 12345,
    "status": "rejected",
    "rejectedAt": "2024-01-16T14:35:00Z",
    "reason": "Insufficient medical evidence"
  }
}
```

#### `GET /api/insurance/analytics`

Get analytics dashboard data for insurance company.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClaims": 150,
    "pendingClaims": 12,
    "approvedClaims": 128,
    "rejectedClaims": 10,
    "totalAmount": 125000,
    "averageProcessingTime": "3.2 hours",
    "zkVerificationSuccessRate": 99.3,
    "monthlyTrends": [
      {
        "month": "2024-01",
        "claims": 45,
        "amount": 42000,
        "approvalRate": 92.5
      }
    ]
  }
}
```

### Utility Endpoints

#### `GET /api/health`

Check API health and system status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-16T15:00:00Z",
  "services": {
    "database": "healthy",
    "zkVerify": "healthy",
    "blockchain": "healthy",
    "proofGeneration": "healthy"
  },
  "version": "1.0.0"
}
```

#### `GET /api/circuits/info`

Get information about available ZK circuits.

**Response:**
```json
{
  "success": true,
  "data": {
    "circuits": [
      {
        "name": "doctor",
        "version": "1.0.0",
        "constraintCount": 15420,
        "publicInputs": 3,
        "privateInputs": 6,
        "lastUpdated": "2024-01-10T08:00:00Z"
      },
      {
        "name": "patient",
        "version": "1.0.0",
        "constraintCount": 12850,
        "publicInputs": 4,
        "privateInputs": 5,
        "lastUpdated": "2024-01-10T08:00:00Z"
      }
    ]
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "PROOF_VERIFICATION_FAILED",
    "message": "Zero-knowledge proof verification failed",
    "details": {
      "circuitType": "patient",
      "failureReason": "Invalid public signals"
    },
    "timestamp": "2024-01-16T12:30:00Z"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_SIGNATURE` | Wallet signature verification failed | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `CLAIM_NOT_FOUND` | Requested claim does not exist | 404 |
| `PROOF_GENERATION_FAILED` | ZK proof generation error | 400 |
| `ZKVERIFY_TIMEOUT` | zkVerify verification timeout | 408 |
| `CIRCUIT_ERROR` | ZK circuit execution error | 500 |
| `BLOCKCHAIN_ERROR` | Smart contract interaction failed | 502 |

## Rate Limiting

All API endpoints are subject to rate limiting to ensure fair usage:

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|---------|
| Authentication | 10 requests | 1 minute |
| Proof Generation | 5 requests | 1 minute |
| Claim Submission | 3 requests | 1 minute |
| General API | 100 requests | 1 minute |
| zkVerify Operations | 20 requests | 1 minute |

## SDK Usage Examples

### JavaScript/Node.js

```javascript
import { ZKClaimAPI } from '@zkclaim/sdk';

const api = new ZKClaimAPI({
  baseURL: 'https://api.zkclaim.io/v1',
  walletProvider: window.ethereum
});

// Authenticate
await api.authenticate();

// Submit claim
const claim = await api.claims.submit({
  patientAddress: '0x...',
  doctorProofHash: '0x...',
  patientProof: proof,
  claimAmount: '1000'
});

// Monitor verification
const result = await api.zkVerify.waitForVerification(claim.zkVerifyJobId);
```

### Python

```python
from zkclaim import ZKClaimAPI

api = ZKClaimAPI(
    base_url='https://api.zkclaim.io/v1',
    wallet_private_key='your_private_key'
)

# Submit claim
claim = api.claims.submit({
    'patientAddress': '0x...',
    'doctorProofHash': '0x...',
    'patientProof': proof,
    'claimAmount': '1000'
})

# Check status
status = api.claims.get(claim['claimId'])
```

This API reference provides comprehensive coverage of all ZKClaim endpoints with detailed examples and error handling information.
