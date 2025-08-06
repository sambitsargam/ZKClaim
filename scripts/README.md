# zkVerify Integration for ZKClaim

This directory contains scripts for integrating ZKClaim with the zkVerify blockchain using the Relayer service.

## Files

- `zkverifyFlow.js` - Main integration script with doctor and patient proof flows
- `demo.js` - Demo script showing how to use the zkverifyFlow functions

## Setup

1. **Get API Key**: Contact the Horizen Labs team or open a ticket on [Discord](https://discord.gg/zkverify) to get your API key.

2. **Configure Environment**: Update the `.env` file in the project root:
   ```
   RELAYER_API=https://relayer-api.horizenlabs.io/api/v1
   RELAYER_KEY=your_actual_api_key_here
   ```

3. **Install Dependencies**: All required dependencies are already in package.json:
   - axios
   - snarkjs
   - dotenv

## Usage

### Running the Demo
```bash
npm run demo
```

### Using in Your Code
```javascript
import { doctorFlow, patientFlow } from './scripts/zkverifyFlow.js';

// Doctor workflow
const doctorResult = await doctorFlow({
  procedure_code: "12345",
  doctor_id: "67890", 
  date: "20240101"
});

// Patient workflow (requires doctor proof hash)
const patientResult = await patientFlow({
  doctor_proof_hash: doctorResult.proofHash,
  patient_id: "54321",
  claim_amount: "1000",
  policy_limit: "5000"
});
```

## How It Works

1. **VK Registration**: Verification keys are registered once with zkVerify and cached locally
2. **Proof Generation**: Uses snarkjs to generate Groth16 proofs from circuits
3. **Proof Submission**: Submits proofs to zkVerify via the Relayer API
4. **Status Polling**: Monitors proof verification status until finalized
5. **Result Return**: Returns transaction hashes and proof data

## Key Features

- ✅ Proper VK registration with caching
- ✅ Optimistic verification checking
- ✅ Robust error handling and retry logic
- ✅ Status polling with detailed logging
- ✅ Transaction hash tracking for blockchain explorer links

## API Reference

### doctorFlow(doctorInput)
Generates and verifies a doctor proof.

**Parameters:**
- `doctorInput.procedure_code` - Medical procedure code
- `doctorInput.doctor_id` - Doctor's unique ID  
- `doctorInput.date` - Date in YYYYMMDD format

**Returns:**
- `proofHash` - Hash of the generated proof
- `txHash` - Transaction hash on zkVerify
- `blockHash` - Block hash containing the transaction

### patientFlow(patientInput)
Generates and verifies a patient proof.

**Parameters:**
- `patientInput.doctor_proof_hash` - Hash from doctor proof
- `patientInput.patient_id` - Patient's unique ID
- `patientInput.claim_amount` - Claim amount (must be ≤ policy_limit)
- `patientInput.policy_limit` - Insurance policy limit

**Returns:**
- `proofHash` - Hash of the generated proof
- `txHash` - Transaction hash on zkVerify
- `blockHash` - Block hash containing the transaction
- `jobId` - Relayer job ID
- `status` - Final verification status

## Troubleshooting

1. **Missing API Key**: Make sure RELAYER_KEY is set in .env
2. **VK Registration Fails**: Check that circuit files exist in build/ directories
3. **Proof Generation Fails**: Verify input format matches circuit constraints
4. **Verification Fails**: Check proof artifacts and ensure inputs are valid

## Links

- [zkVerify Documentation](https://docs.zkverify.io/)
- [Relayer API Docs](https://relayer-api.horizenlabs.io/docs)
- [Discord Support](https://discord.gg/zkverify)
- [Testnet Explorer](https://zkverify-testnet.subscan.io/)
