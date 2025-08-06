// scripts/demo.js - Demo script to test zkverifyFlow

import { doctorFlow, patientFlow } from './zkverifyFlow.js';

async function runDemo() {
  try {
    const isAggregationEnabled = process.env.CHAIN_ID && parseInt(process.env.CHAIN_ID);
    
    console.log("🏥 Starting ZKClaim Demo\n");
    if (isAggregationEnabled) {
      console.log(`🔗 Aggregation Mode: Enabled (Chain ID: ${process.env.CHAIN_ID})`);
      console.log("📊 Proofs will be aggregated and published to connected chain\n");
    } else {
      console.log("⚡ Direct Mode: Proofs will be verified directly on zkVerify\n");
    }

    // Doctor inputs
    const doctorInput = {
      procedure_code: "12345",
      doctor_id: "67890", 
      date: "20240101"
    };

    console.log("Doctor Input:", doctorInput);
    const doctorResult = await doctorFlow(doctorInput);
    console.log("✅ Doctor proof verified!");
    console.log("Doctor Result:", doctorResult);
    console.log();

    // Patient inputs (using doctor proof hash)
    const patientInput = {
      doctor_proof_hash: doctorResult.proofHash,
      patient_id: "54321",
      claim_amount: "1000",
      policy_limit: "5000"
    };

    console.log("Patient Input:", patientInput);
    const patientResult = await patientFlow(patientInput);
    console.log("✅ Patient proof verified!");
    console.log("Patient Result:", patientResult);
    
    console.log("\n🎉 ZKClaim Demo completed successfully!");
    console.log(`🔗 Doctor tx: https://zkverify-testnet.subscan.io/extrinsic/${doctorResult.txHash}`);
    console.log(`🔗 Patient tx: https://zkverify-testnet.subscan.io/extrinsic/${patientResult.txHash}`);
    
    if (isAggregationEnabled) {
      console.log("\n📊 Aggregation Information:");
      if (doctorResult.aggregationId) {
        console.log(`🔗 Doctor Aggregation ID: ${doctorResult.aggregationId}`);
      }
      if (patientResult.aggregationId) {
        console.log(`🔗 Patient Aggregation ID: ${patientResult.aggregationId}`);
        console.log("💾 Aggregation data saved to build/patient/aggregation_data.json");
      }
      
      const chainName = process.env.CHAIN_ID === "11155111" ? "Sepolia" : 
                       process.env.CHAIN_ID === "84532" ? "Base Sepolia" : 
                       `Chain ${process.env.CHAIN_ID}`;
      console.log(`🌐 Proofs will be published to ${chainName} testnet`);
    }

  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    if (error.response?.data) {
      console.error("API Error:", error.response.data);
    }
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
ZKClaim Demo Script with Aggregation Support

Usage: npm run demo

Environment Variables Required:
  RELAYER_API - zkVerify relayer API URL
  RELAYER_KEY - Your API key from Horizen Labs
  CHAIN_ID    - Optional: Chain ID for aggregation (11155111=Sepolia, 84532=Base Sepolia)

Example .env file:
  RELAYER_API=https://relayer-api.horizenlabs.io/api/v1
  RELAYER_KEY=your_api_key_here
  CHAIN_ID=11155111  # Optional: Enable aggregation to Sepolia

Aggregation vs Direct Mode:
  - With CHAIN_ID: Proofs are aggregated and published to connected chains (Sepolia, Base Sepolia)
  - Without CHAIN_ID: Proofs are verified directly on zkVerify (faster, no aggregation)

Supported Chain IDs:
  11155111 - Ethereum Sepolia Testnet
  84532    - Base Sepolia Testnet

Note: You need to obtain an API key from the Horizen Labs team
or contact them on Discord: https://discord.gg/zkverify
  `);
  process.exit(0);
}

runDemo();
