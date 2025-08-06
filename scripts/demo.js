// scripts/demo.js - Demo script to test zkverifyFlow

import { doctorFlow, patientFlow } from './zkverifyFlow.js';

async function runDemo() {
  try {
    console.log("🏥 Starting ZKClaim Demo\n");

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
ZKClaim Demo Script

Usage: npm run demo

Environment Variables Required:
  RELAYER_API - zkVerify relayer API URL
  RELAYER_KEY - Your API key from Horizen Labs

Example .env file:
  RELAYER_API=https://relayer-api.horizenlabs.io/api/v1
  RELAYER_KEY=your_api_key_here

Note: You need to obtain an API key from the Horizen Labs team
or contact them on Discord: https://discord.gg/zkverify
  `);
  process.exit(0);
}

runDemo();
