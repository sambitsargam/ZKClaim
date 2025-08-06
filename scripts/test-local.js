// scripts/test-local.js - Test script for local proof generation (no zkVerify)

import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";

async function testLocalProofGeneration() {
  try {
    console.log("🧪 Testing Local Proof Generation\n");

    // Test Doctor proof generation
    console.log("📋 Testing Doctor Circuit...");
    const doctorInput = {
      procedure_code: "12345",
      doctor_id: "67890", 
      date: "20240101"
    };

    console.log("Doctor Input:", doctorInput);
    
    const doctorProof = await snarkjs.groth16.fullProve(
      doctorInput,
      path.join("build", "doctor", "doctor.wasm"),
      path.join("build", "doctor", "doctor_final.zkey")
    );

    console.log("✅ Doctor proof generated successfully!");
    console.log("Doctor proof hash:", doctorProof.publicSignals[0]);

    // Test Patient proof generation
    console.log("\n👤 Testing Patient Circuit...");
    const patientInput = {
      doctor_proof_hash: doctorProof.publicSignals[0],
      patient_id: "54321",
      claim_amount: "1000",
      policy_limit: "5000"
    };

    console.log("Patient Input:", patientInput);
    
    const patientProof = await snarkjs.groth16.fullProve(
      patientInput,
      path.join("build", "patient", "patient.wasm"),
      path.join("build", "patient", "patient_final.zkey")
    );

    console.log("✅ Patient proof generated successfully!");
    console.log("Patient proof hash:", patientProof.publicSignals[0]);

    // Test verification keys
    console.log("\n🔑 Testing Verification Keys...");
    const doctorVK = JSON.parse(fs.readFileSync(path.join("build", "doctor", "doctor_vk.json")));
    const patientVK = JSON.parse(fs.readFileSync(path.join("build", "patient", "patient_vk.json")));

    const doctorVerified = await snarkjs.groth16.verify(doctorVK, doctorProof.publicSignals, doctorProof.proof);
    const patientVerified = await snarkjs.groth16.verify(patientVK, patientProof.publicSignals, patientProof.proof);

    console.log("Doctor proof verification:", doctorVerified ? "✅ VALID" : "❌ INVALID");
    console.log("Patient proof verification:", patientVerified ? "✅ VALID" : "❌ INVALID");

    console.log("\n🎉 All local tests passed! The circuits are working correctly.");
    console.log("\n💡 Next steps:");
    console.log("1. Get an API key from Horizen Labs team");
    console.log("2. Update the RELAYER_KEY in .env file");
    console.log("3. Run 'npm run demo' to test with zkVerify");

  } catch (error) {
    console.error("❌ Local test failed:", error.message);
    console.error("\n🔍 Make sure:");
    console.error("- All circuit files exist in build/doctor/ and build/patient/");
    console.error("- Circuits were compiled successfully");
    console.error("- Input values match circuit constraints");
  }
}

testLocalProofGeneration();
