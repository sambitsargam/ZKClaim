# ZKClaim - Zero-Knowledge Healthcare Claims System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/solidity-%23363636.svg?style=flat&logo=solidity&logoColor=white)](https://soliditylang.org/)

## 🛡️ Overview

ZKClaim is a revolutionary healthcare claims management system that leverages **zero-knowledge proofs** to ensure complete privacy and security while maintaining transparency and trust in the insurance claims process. Built on blockchain technology and integrated with **zkVerify**, our system allows patients, doctors, and insurance companies to interact seamlessly without exposing sensitive medical data.

### 🎯 Key Features

- **🔐 Zero-Knowledge Privacy**: Medical data never leaves the patient's control - only proofs are shared
- **🌐 Blockchain Transparency**: All transactions are verifiable on-chain without revealing private information  
- **🏥 Multi-Role Support**: Separate interfaces for patients, doctors, and insurance companies
- **⚡ zkVerify Integration**: Professional-grade proof verification through zkVerify testnet
- **🔒 End-to-End Security**: From proof generation to claim settlement
- **📊 Real-Time Analytics**: Comprehensive dashboards for all stakeholders
- **💳 Automated Settlements**: Smart contract-based claim processing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Patient     │    │     Doctor      │    │    Insurance    │
│   Interface     │    │   Interface     │    │   Interface     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │     Frontend (React)       │
                    │  - Web3 Integration       │
                    │  - Wagmi & Viem          │
                    └─────────────┬──────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │    Backend API Server      │
                    │  - Express.js             │
                    │  - ZK Proof Generation    │
                    │  - zkVerify Integration   │
                    └─────────────┬──────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   Smart Contracts │  │   ZK Circuits     │  │    zkVerify       │
│ - Claim Verifier  │  │ - Doctor Circuit  │  │  - Proof Aggreg.  │
│ - Settlement      │  │ - Patient Circuit │  │  - Verification   │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sambitsargam/ZKClaim.git
   cd ZKClaim
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

4. **Start the development environment**
   ```bash
   # Start backend server
   cd backend && npm start &
   
   # Start frontend development server
   cd frontend && npm start
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

## 🔍 How It Works

### 1. **Patient Journey**
- Patients create zero-knowledge proofs of their medical conditions
- Personal health information remains completely private
- Only mathematical proofs are generated and shared

### 2. **Doctor Verification** 
- Doctors verify patient conditions using secure ZK protocols
- Medical diagnosis is confirmed without exposing sensitive data
- Cryptographic signatures ensure authenticity

### 3. **Insurance Processing**
- Claims are automatically verified using ZK proofs
- zkVerify network provides professional-grade proof verification
- Smart contracts automate claim approval and payment

### 4. **Privacy Guarantees**
- **Zero Data Exposure**: No personal medical information is ever transmitted
- **Selective Disclosure**: Only necessary claim details are revealed
- **Cryptographic Security**: Military-grade encryption protects all data
- **Decentralized Verification**: No central authority can access private data

## 🛡️ Privacy & Security

### Zero-Knowledge Architecture

Our system implements **zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to ensure:

- ✅ **Completeness**: Valid claims are always accepted
- ✅ **Soundness**: Invalid claims are always rejected  
- ✅ **Zero-Knowledge**: No private information is revealed during verification

### Data Protection Layers

1. **Client-Side Encryption**: All sensitive data is encrypted before leaving the user's device
2. **ZK Proof Generation**: Mathematical proofs replace raw data transmission
3. **Blockchain Immutability**: Tamper-proof record keeping without privacy compromise
4. **Smart Contract Automation**: Deterministic processing without human intervention

## ⚡ zkVerify Integration

ZKClaim leverages **zkVerify**, a specialized blockchain for zero-knowledge proof verification:

### Benefits of zkVerify
- **Professional Grade**: Enterprise-level proof verification infrastructure
- **Cost Effective**: Optimized for ZK proof processing with lower fees
- **High Throughput**: Capable of processing thousands of proofs per second
- **Aggregation Support**: Batches multiple proofs for efficiency
- **Explorer Integration**: Transparent verification tracking

### Verification Process
1. ZK proofs are submitted to zkVerify network
2. Cryptographic verification occurs on specialized nodes
3. Verification results are aggregated and finalized
4. Proof hashes are anchored to mainnet for security

## 🏥 Use Cases

### Healthcare Insurance
- **Claim Processing**: Automated verification without privacy loss
- **Fraud Prevention**: Cryptographic proof of legitimate claims
- **Regulatory Compliance**: HIPAA-compliant data handling

### Medical Records
- **Patient Consent**: Granular control over data sharing
- **Doctor Verification**: Secure confirmation of medical conditions
- **Audit Trails**: Immutable record of all interactions

### Research & Analytics
- **Population Health**: Anonymous statistical analysis
- **Drug Efficacy**: Privacy-preserving clinical trial data
- **Public Health**: Aggregate insights without individual exposure

## 📊 System Components

### Smart Contracts
- **HealthClaimVerifier.sol**: Core claim processing logic
- **ISettlement.sol**: Payment and settlement interface
- Gas-optimized and thoroughly tested

### ZK Circuits  
- **doctor.circom**: Proves doctor's verification of patient condition
- **patient.circom**: Proves patient's eligibility and claim validity
- Built using Circom and optimized for efficiency

### Frontend Interfaces
- **Patient Portal**: Claim submission and status tracking
- **Doctor Interface**: Patient verification and proof generation  
- **Insurance Dashboard**: Claim review and automated processing

### Backend Services
- **Proof Generation**: Witness calculation and ZK proof creation
- **zkVerify Integration**: Professional proof verification
- **API Services**: RESTful endpoints for all system interactions

## 🔧 Development

### Running Tests
```bash
# Smart contract tests
npm run test:contracts

# ZK circuit tests  
npm run test:circuits

# Full system integration tests
npm run test:integration
```

### Building ZK Circuits
```bash
# Generate trusted setup
npm run setup:circuits

# Compile circuits
npm run build:circuits

# Generate verification keys
npm run generate:keys
```

### Deployment
```bash
# Deploy smart contracts
npm run deploy:contracts

# Deploy to production
npm run deploy:production
```

## 🌐 Supported Networks

- **Horizen Testnet (Base Sepolia)** (Testnet)

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Architecture Guide](docs/architecture.md)** - Detailed system design
- **[Privacy Documentation](docs/privacy.md)** - Zero-knowledge implementation
- **[zkVerify Integration](docs/zkverify.md)** - Proof verification process
- **[API Reference](docs/api.md)** - Backend API documentation
- **[Smart Contracts](docs/contracts.md)** - Contract specifications
- **[Developer Guide](docs/development.md)** - Contributing guidelines

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **zkVerify Team** - Professional ZK proof verification infrastructure
- **Circom Community** - Zero-knowledge circuit development tools
- **Ethereum Foundation** - Blockchain infrastructure and standards
- **Web3 Community** - Open-source tools and libraries

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/sambitsargam/ZKClaim/issues)
- **Documentation**: [Comprehensive guides and tutorials](docs/)
- **Community**: [Join our discussions](https://github.com/sambitsargam/ZKClaim/discussions)

---

**Built with ❤️ for a more private and secure healthcare future**

*ZKClaim is advancing healthcare privacy through cutting-edge zero-knowledge technology while maintaining the transparency and trust needed for modern insurance systems.*
