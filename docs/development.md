# Developer Guide

## Getting Started

Welcome to the ZKClaim development team! This guide will help you understand the codebase, set up your development environment, and contribute effectively to the project.

## Project Structure

```
ZKClaim/
├── README.md                 # Project overview and setup
├── package.json             # Root package configuration
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── LICENSE                 # MIT License
│
├── backend/                # Express.js API server
│   ├── api-server.js       # Main server file
│   ├── package.json        # Backend dependencies
│   └── routes/            # API route handlers
│       ├── auth.js        # Authentication endpoints
│       ├── claims.js      # Claim management
│       ├── proofs.js      # ZK proof operations
│       └── zkverify.js    # zkVerify integration
│
├── frontend/              # React.js web application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── PatientInterface.jsx
│   │   │   ├── DoctorInterface.jsx
│   │   │   ├── InsuranceInterface.jsx
│   │   │   └── ...
│   │   ├── config/        # Configuration files
│   │   ├── services/      # API service layers
│   │   └── App.jsx        # Main application
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
│
├── contracts/            # Smart contracts
│   ├── HealthClaimVerifier.sol
│   ├── ISettlement.sol
│   └── ...
│
├── circuits/             # Zero-knowledge circuits
│   ├── doctor.circom     # Doctor verification circuit
│   ├── patient.circom    # Patient eligibility circuit
│   └── ...
│
├── scripts/              # Utility and deployment scripts
│   ├── deploy.js         # Contract deployment
│   ├── demo.js          # Demo data generation
│   └── zkverifyFlow.js   # zkVerify integration scripts
│
├── build/               # Compiled circuit artifacts
│   ├── doctor/          # Doctor circuit build files
│   └── patient/         # Patient circuit build files
│
├── test/                # Test files
│   ├── contracts/       # Smart contract tests
│   ├── circuits/        # Circuit tests
│   └── integration/     # End-to-end tests
│
├── docs/                # Comprehensive documentation
│   ├── architecture.md
│   ├── privacy.md
│   ├── zkverify.md
│   ├── api.md
│   ├── contracts.md
│   └── deployment.md
│
└── config/              # Configuration files
    ├── hardhat.config.js
    ├── jest.config.js
    └── ...
```

## Development Environment Setup

### 1. Prerequisites

Ensure you have the following installed:

```bash
# Check versions
node --version    # Should be 18+
npm --version     # Should be 8+
git --version     # Any recent version
```

**Additional Tools:**
```bash
# Install development tools
npm install -g hardhat
npm install -g @nomiclabs/hardhat-toolbox
npm install -g circom
npm install -g snarkjs

# Install system dependencies (Ubuntu/macOS)
# Ubuntu:
sudo apt-get install build-essential libgmp-dev libsodium-dev nasm

# macOS:
brew install gmp libsodium nasm
```

### 2. Repository Setup

```bash
# Clone and setup
git clone https://github.com/sambitsargam/ZKClaim.git
cd ZKClaim

# Install all dependencies
npm run install:all

# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Build ZK circuits
npm run build:circuits

# Start local blockchain
npm run chain

# Deploy contracts (in new terminal)
npm run deploy:local

# Start development servers
npm run dev
```

### 3. IDE Configuration

**VS Code Extensions:**
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "nomicfoundation.hardhat-solidity",
    "JuanBlanco.solidity",
    "ms-vscode.vscode-json"
  ]
}
```

**VS Code Settings:**
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.circom": "rust"
  }
}
```

## Architecture Overview

### Frontend Architecture

```javascript
// React component hierarchy
App
├── RoleSelector          // Choose user type (patient/doctor/insurance)
├── PatientInterface      // Patient-specific functionality
│   ├── ClaimSubmission  // Submit new claims
│   ├── ClaimHistory     // View claim status
│   ├── ConsentManager   // Manage doctor permissions
│   └── MedicalRecords   // View medical data
├── DoctorInterface       // Doctor-specific functionality
│   ├── PatientVerification  // Verify patient conditions
│   ├── ProofGeneration     // Create ZK proofs
│   └── VerificationHistory // View past verifications
└── InsuranceInterface    // Insurance company functionality
    ├── ClaimReview      // Review submitted claims
    ├── ZKVerification   // Verify zero-knowledge proofs
    ├── PaymentProcessing // Process claim payments
    └── Analytics        // View claim statistics
```

### Backend Architecture

```javascript
// Express.js route structure
/api
├── /auth                 // Authentication
│   ├── POST /login      // Web3 wallet login
│   ├── POST /refresh    // Token refresh
│   └── GET /profile     // User profile
├── /claims              // Claim management
│   ├── POST /submit     // Submit new claim
│   ├── GET /:id         // Get claim details
│   ├── GET /patient/:address  // Patient's claims
│   └── GET /pending     // Pending claims (insurance)
├── /proofs              // ZK proof operations
│   ├── POST /generate   // Generate proof
│   ├── POST /verify     // Verify proof locally
│   └── GET /circuits    // Circuit information
├── /zkverify            // zkVerify integration
│   ├── POST /submit     // Submit to zkVerify
│   ├── GET /status/:id  // Check verification status
│   └── POST /batch      // Batch submission
└── /utils               // Utility endpoints
    ├── GET /health      // System health check
    └── GET /networks    // Supported networks
```

### Smart Contract Architecture

```solidity
// Contract interaction flow
HealthClaimVerifier
├── submitClaim()         // Patient submits claim
├── submitDoctorVerification()  // Doctor provides verification
├── verifyClaim()         // System verifies ZK proofs
├── approveClaim()        // Insurance approves claim
├── rejectClaim()         // Insurance rejects claim
└── processPayment()      // Execute payment

// Events emitted
ClaimSubmitted(claimId, patient, amount)
DoctorVerificationSubmitted(doctor, proofHash, patient)
ClaimVerified(claimId, verified, timestamp)
ClaimApproved(claimId, insurer, amount)
PaymentProcessed(claimId, patient, amount)
```

## Development Workflow

### 1. Feature Development Process

```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Make changes and test locally
npm run dev
npm run test

# 3. Run linting and formatting
npm run lint
npm run format

# 4. Commit changes
git add .
git commit -m "feat: add new feature description"

# 5. Push and create PR
git push origin feature/new-feature-name
# Create PR on GitHub
```

### 2. Testing Strategy

**Unit Tests:**
```bash
# Frontend tests (Jest + React Testing Library)
cd frontend
npm run test

# Backend tests (Jest + Supertest)
cd backend
npm run test

# Smart contract tests (Hardhat + Chai)
npx hardhat test

# Circuit tests (Circom + Mocha)
npm run test:circuits
```

**Integration Tests:**
```bash
# End-to-end testing with full system
npm run test:e2e

# Specific integration scenarios
npm run test:claim-flow
npm run test:zkverify-integration
```

**Example Test:**
```javascript
// test/integration/claim-submission.test.js
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Full Claim Submission Flow', function () {
    let contract, doctor, patient, insurer;
    
    beforeEach(async function () {
        [doctor, patient, insurer] = await ethers.getSigners();
        
        // Deploy contract and setup roles
        const HealthClaimVerifier = await ethers.getContractFactory('HealthClaimVerifier');
        contract = await HealthClaimVerifier.deploy(settlementAddress);
        
        await contract.registerDoctor(doctor.address);
        await contract.registerInsurance(insurer.address);
    });
    
    it('should process complete claim lifecycle', async function () {
        // 1. Doctor submits verification
        const doctorProof = await generateDoctorProof();
        await contract.connect(doctor).submitDoctorVerification(
            doctorProof.hash,
            patient.address,
            consentHash
        );
        
        // 2. Patient submits claim
        const patientProof = await generatePatientProof();
        await contract.connect(patient).submitClaim(
            doctorProof.hash,
            patientProof.hash,
            ethers.utils.parseEther('1.0'),
            ''
        );
        
        // 3. System verifies ZK proofs
        await contract.verifyClaim(1, true);
        
        // 4. Insurance approves claim
        await contract.connect(insurer).approveClaim(1);
        
        // 5. Verify final state
        const claim = await contract.getClaim(1);
        expect(claim.status).to.equal(4); // Paid
    });
});
```

### 3. Code Style Guide

**JavaScript/TypeScript:**
```javascript
// Use descriptive variable names
const zkVerificationResult = await verifyProofOnZkVerify(claim);

// Use async/await instead of promises
try {
    const result = await apiCall();
    return result;
} catch (error) {
    console.error('API call failed:', error);
    throw error;
}

// Use object destructuring
const { claimId, patientAddress, amount } = claimData;

// Use template literals
const message = `Processing claim ${claimId} for ${formatCurrency(amount)}`;
```

**React Components:**
```jsx
// Use functional components with hooks
const PatientInterface = () => {
    const [claims, setClaims] = useState([]);
    const { address, isConnected } = useAccount();
    
    useEffect(() => {
        if (isConnected) {
            fetchPatientClaims();
        }
    }, [isConnected, address]);
    
    const handleClaimSubmission = async (claimData) => {
        try {
            await submitClaim(claimData);
            await fetchPatientClaims(); // Refresh
        } catch (error) {
            console.error('Claim submission failed:', error);
        }
    };
    
    return (
        <div className="patient-interface">
            {/* Component content */}
        </div>
    );
};
```

**Solidity:**
```solidity
// Use explicit function visibility
function submitClaim(
    bytes32 doctorProofHash,
    bytes32 patientProofHash,
    uint256 claimAmount
) external whenNotPaused nonReentrant {
    require(claimAmount > 0, "Amount must be positive");
    // Function implementation
}

// Use custom errors for gas efficiency
error InvalidClaimAmount();
error ClaimNotFound(uint256 claimId);

// Use events for important state changes
event ClaimSubmitted(
    uint256 indexed claimId,
    address indexed patient,
    uint256 amount
);
```

## Contributing Guidelines

### 1. Pull Request Process

1. **Fork the repository** and create your feature branch
2. **Write comprehensive tests** for your changes
3. **Update documentation** if needed
4. **Ensure all tests pass** locally
5. **Submit PR** with clear description

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### 2. Issue Reporting

**Bug Report Template:**
```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Screenshots
If applicable

## Environment
- OS: 
- Browser:
- Node version:
- Git commit hash:
```

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the requested feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this be implemented?

## Additional Context
Any other relevant information
```

### 3. Code Review Checklist

**For Reviewers:**

- [ ] **Functionality**: Does the code do what it's supposed to do?
- [ ] **Security**: Are there any security vulnerabilities?
- [ ] **Performance**: Are there any performance issues?
- [ ] **Testing**: Are there adequate tests?
- [ ] **Documentation**: Is the code well-documented?
- [ ] **Style**: Does the code follow our style guidelines?
- [ ] **Architecture**: Does the code fit well with our architecture?

## Development Tools

### 1. Debugging

**Frontend Debugging:**
```javascript
// Use React Developer Tools
// Enable debug mode
localStorage.setItem('debug', 'zkclaim:*');

// Debug API calls
const api = {
    async submitClaim(claimData) {
        console.log('🔍 Submitting claim:', claimData);
        try {
            const response = await fetch('/api/claims/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(claimData)
            });
            console.log('✅ Claim submitted successfully');
            return response.json();
        } catch (error) {
            console.error('❌ Claim submission failed:', error);
            throw error;
        }
    }
};
```

**Backend Debugging:**
```javascript
// Use debug module
const debug = require('debug')('zkclaim:api');

app.post('/api/claims/submit', async (req, res) => {
    debug('Received claim submission:', req.body);
    
    try {
        const result = await processClaimSubmission(req.body);
        debug('Claim processed successfully:', result.claimId);
        res.json({ success: true, data: result });
    } catch (error) {
        debug('Claim processing failed:', error.message);
        res.status(400).json({ success: false, error: error.message });
    }
});
```

**Smart Contract Debugging:**
```solidity
import "hardhat/console.sol";

contract HealthClaimVerifier {
    function submitClaim(bytes32 doctorProofHash, uint256 claimAmount) external {
        console.log("Submitting claim with amount:", claimAmount);
        console.log("Doctor proof hash:", uint256(doctorProofHash));
        
        // Contract logic...
    }
}
```

### 2. Performance Monitoring

```javascript
// Frontend performance monitoring
const performanceMonitor = {
    startTimer(operation) {
        const start = performance.now();
        return () => {
            const end = performance.now();
            console.log(`${operation} took ${end - start}ms`);
        };
    }
};

// Usage
const endTimer = performanceMonitor.startTimer('ZK Proof Generation');
await generateZKProof(inputs);
endTimer();

// Backend performance monitoring
const performanceMiddleware = (req, res, next) => {
    const start = process.hrtime();
    
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const duration = seconds * 1000 + nanoseconds / 1e6;
        console.log(`${req.method} ${req.path} - ${duration}ms`);
    });
    
    next();
};
```

### 3. Local Development Scripts

```bash
# Development helper scripts

# Quick setup for new contributors
npm run setup:dev

# Reset local environment
npm run reset

# Generate test data
npm run generate:test-data

# Analyze bundle size
npm run analyze

# Check for security vulnerabilities
npm run audit:fix

# Generate documentation
npm run docs:generate
```

This comprehensive developer guide ensures smooth onboarding and effective collaboration for all ZKClaim contributors.
