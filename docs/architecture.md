# ZKClaim Architecture Guide

## System Overview

ZKClaim implements a **three-tier architecture** designed for maximum security, privacy, and scalability in healthcare claims processing.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend Layer                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Patient Portal │  Doctor Portal  │    Insurance Portal         │
│                 │                 │                             │
│ • Claim Submit  │ • Patient Verify│ • Claim Review             │
│ • Status Track  │ • Proof Generate│ • ZK Verification          │
│ • Privacy Ctrl  │ • Consent Mgmt  │ • Automated Processing     │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────────┘
          │                 │                 │
          │        Web3 Integration Layer     │
          │     ┌─────────────────────────────┐│
          │     │ • Wagmi & Viem             ││
          └─────│ • MetaMask Integration     ││
                │ • Transaction Management   ││
                └─────────────┬───────────────┘│
                              │                │
┌─────────────────────────────▼────────────────▼───────────────────┐
│                       Backend Layer                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   API Services  │ Proof Generator │   zkVerify Integration      │
│                 │                 │                             │
│ • REST APIs     │ • Witness Calc  │ • Proof Submission         │
│ • Auth System   │ • Circuit Exec  │ • Verification Tracking    │
│ • Data Mgmt     │ • Key Mgmt      │ • Aggregation Handling     │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────────┐
│                    Infrastructure Layer                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ Smart Contracts │   ZK Circuits   │        zkVerify             │
│                 │                 │                             │
│ • Claim Logic   │ • Doctor Proof  │ • Professional Verification│
│ • Settlement    │ • Patient Proof │ • Proof Aggregation        │
│ • Access Ctrl   │ • Verification  │ • Mainnet Anchoring        │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

#### Patient Portal
- **Claim Submission**: Zero-knowledge proof generation for medical claims
- **Privacy Controls**: Granular consent management for data sharing
- **Status Tracking**: Real-time updates on claim processing status
- **Medical Records**: Secure access to personal health data

#### Doctor Portal  
- **Patient Verification**: Cryptographic confirmation of patient conditions
- **Proof Generation**: Creation of doctor attestation proofs
- **Consent Management**: Handling patient privacy permissions
- **Medical Workflows**: Integration with existing healthcare systems

#### Insurance Portal
- **Claim Review**: Automated processing with human oversight
- **ZK Verification**: Integration with zkVerify for proof validation
- **Analytics Dashboard**: Comprehensive claim processing metrics
- **Settlement Processing**: Automated payment execution

### 2. Backend Layer

#### API Services
```
/api/
├── auth/                 # Authentication & authorization
├── claims/               # Claim management endpoints  
├── proofs/               # Zero-knowledge proof handling
├── verification/         # zkVerify integration
├── analytics/            # Data analytics and reporting
└── webhooks/             # External system integrations
```

#### Proof Generator
- **Witness Calculation**: Computation of circuit inputs
- **Circuit Execution**: Running ZK circuits for proof generation
- **Key Management**: Secure handling of cryptographic keys
- **Optimization**: Efficient proof generation algorithms

#### zkVerify Integration
- **Proof Submission**: Batching and submitting proofs to zkVerify
- **Status Monitoring**: Tracking verification progress
- **Result Processing**: Handling verification outcomes
- **Aggregation Support**: Managing proof batches for efficiency

### 3. Infrastructure Layer

#### Smart Contracts

**HealthClaimVerifier.sol**
```solidity
contract HealthClaimVerifier {
    // Core claim processing logic
    function submitClaim(bytes32 proofHash, uint256 amount) external;
    function verifyClaim(uint256 claimId) external;
    function approveClaim(uint256 claimId) external;
    function processPayout(uint256 claimId) external;
}
```

**Key Functions:**
- Claim state management (Pending → Verified → Approved → Paid)
- Zero-knowledge proof verification
- Automated settlement processing  
- Access control and permissions

#### ZK Circuits

**Doctor Circuit (`doctor.circom`)**
```
template DoctorVerification() {
    signal input patientId;
    signal input diagnosis;
    signal input doctorSignature;
    signal input timestamp;
    
    signal output proofHash;
    signal output isValid;
    
    // Verification logic
    component hasher = Poseidon(4);
    hasher.inputs[0] <== patientId;
    hasher.inputs[1] <== diagnosis;  
    hasher.inputs[2] <== doctorSignature;
    hasher.inputs[3] <== timestamp;
    
    proofHash <== hasher.out;
    isValid <== 1;
}
```

**Patient Circuit (`patient.circom`)**
```
template PatientClaim() {
    signal input patientId;
    signal input claimAmount;
    signal input policyLimit;
    signal input doctorProof;
    
    signal output eligibilityProof;
    signal output isEligible;
    
    // Eligibility verification
    component lessThan = LessThan(64);
    lessThan.in[0] <== claimAmount;
    lessThan.in[1] <== policyLimit;
    
    isEligible <== lessThan.out;
    
    // Generate eligibility proof
    component hasher = Poseidon(4);
    hasher.inputs[0] <== patientId;
    hasher.inputs[1] <== claimAmount;
    hasher.inputs[2] <== policyLimit;
    hasher.inputs[3] <== doctorProof;
    
    eligibilityProof <== hasher.out;
}
```

## Data Flow Architecture

### 1. Claim Submission Flow

```
Patient → Generate ZK Proof → Submit to Backend → Store on Blockchain
   ↓              ↓                    ↓               ↓
Medical Data → Mathematical Proof → API Processing → Smart Contract
   ↓              ↓                    ↓               ↓
Private Info → Public Proof Hash → Database Record → Immutable State
```

### 2. Verification Flow

```
Insurance → Request Verification → zkVerify Submission → Proof Validation
    ↓              ↓                      ↓                  ↓
Claim Review → Backend API → zkVerify Network → Verification Result  
    ↓              ↓                      ↓                  ↓
Manual Check → Automated Process → Cryptographic Proof → Claim Approval
```

### 3. Settlement Flow

```
Approved Claim → Smart Contract → Payment Processing → Fund Transfer
      ↓              ↓                    ↓               ↓
Final Review → Automatic Execution → Blockchain Tx → Patient Payout
      ↓              ↓                    ↓               ↓
Human Oversight → Deterministic Logic → Immutable Record → Complete
```

## Security Architecture

### 1. Zero-Knowledge Security

**Proof Properties:**
- **Completeness**: Valid proofs are always accepted
- **Soundness**: Invalid proofs are always rejected
- **Zero-Knowledge**: No private information leaked during verification

**Implementation:**
- zk-SNARKs for succinct proofs
- Trusted setup with ceremony
- Circuit optimization for efficiency

### 2. Blockchain Security

**Smart Contract Security:**
- Formal verification of critical functions
- Multi-signature controls for admin functions  
- Upgradeability with timelock delays
- Emergency pause mechanisms

**Transaction Security:**
- Gas optimization to prevent DoS
- Reentrancy protection
- Integer overflow prevention
- Access control modifiers

### 3. API Security

**Authentication & Authorization:**
- JWT tokens with expiration
- Role-based access control (RBAC)
- API rate limiting
- Request validation and sanitization

**Data Protection:**
- HTTPS/TLS encryption in transit
- AES-256 encryption at rest
- Key rotation policies
- Secure key storage (HSM/KMS)

## Scalability Design

### 1. Horizontal Scaling

**Frontend:**
- CDN distribution for global access
- Load balancing across multiple regions
- Progressive web app (PWA) for offline capability
- Optimistic UI updates for better UX

**Backend:**
- Microservices architecture
- Container orchestration (Kubernetes)
- Auto-scaling based on demand
- Database sharding and replication

### 2. Blockchain Scaling

**Layer 2 Integration:**
- Polygon for reduced gas costs
- Optimistic rollups for throughput
- State channels for frequent interactions
- Cross-chain bridges for interoperability

**zkVerify Optimization:**
- Proof batching and aggregation
- Parallel verification processing
- Result caching for efficiency
- Network-level optimizations

## Performance Metrics

### Target Performance

| Metric | Target | Current |
|--------|---------|---------|
| Proof Generation | < 30 seconds | ~25 seconds |
| Claim Verification | < 2 minutes | ~90 seconds |
| Transaction Confirmation | < 30 seconds | ~15 seconds |
| System Uptime | 99.9% | 99.8% |
| API Response Time | < 500ms | ~300ms |

### Monitoring & Observability

**Application Metrics:**
- Request/response times
- Error rates and types
- User activity patterns
- System resource usage

**Blockchain Metrics:**
- Transaction success rates
- Gas usage optimization
- Block confirmation times
- Contract interaction patterns

**zkVerify Metrics:**
- Proof submission success
- Verification completion times
- Aggregation efficiency
- Network performance

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
├─────────────────────────────────────────────────────────────┤
│                     Frontend Cluster                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Web Server 1  │   Web Server 2  │      Web Server 3       │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│                    API Gateway                              │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Auth Service   │  Proof Service  │    Analytics Service    │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│                      Database Cluster                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Primary DB    │   Replica DB    │      Cache Layer        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

This architecture ensures high availability, scalability, and security for the ZKClaim system while maintaining the privacy guarantees that are core to our mission.
