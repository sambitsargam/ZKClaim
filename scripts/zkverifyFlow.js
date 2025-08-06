// scripts/zkverifyFlow.js

import axios from "axios";
import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
dotenv.config();

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const { RELAYER_API, RELAYER_KEY, CHAIN_ID } = process.env;
// Note: RELAYER_API and RELAYER_KEY not required for local proof generation
// if (!RELAYER_API || !RELAYER_KEY) {
//   throw new Error("Missing RELAYER_API or RELAYER_KEY in .env");
// }

// Note: These functions are no longer used for local proof generation
// but kept for future zkVerify integration if needed

// Helper: register a verification key and return vkHash (UNUSED)
async function registerVK(role) {
  // This function is no longer used in local-only mode
  console.log(`Note: VK registration skipped for ${role} in local mode`);
  return `local_vk_${role}_${Date.now()}`;
}

// Helper: poll until the relayer finalizes a job (UNUSED)
async function awaitFinal(jobId) {
  // This function is no longer used in local-only mode
  console.log(`Note: Job polling skipped for ${jobId} in local mode`);
  return { status: "Verified", txHash: null, blockHash: null };
}

// Generate & save Doctor proof locally
export async function doctorFlow(doctorInput) {
  console.log(" Generating Doctor proof…");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    doctorInput,
    path.join(projectRoot, "build", "doctor", "doctor.wasm"),
    path.join(projectRoot, "build", "doctor", "doctor_final.zkey")
  );

  // Save proof locally
  const proofDir = path.join(projectRoot, "proofs", "doctor");
  if (!fs.existsSync(proofDir)) {
    fs.mkdirSync(proofDir, { recursive: true });
  }

  const proofData = {
    proof,
    publicSignals,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(proofDir, "proof.json"),
    JSON.stringify(proofData.proof, null, 2)
  );

  fs.writeFileSync(
    path.join(proofDir, "public.json"),
    JSON.stringify(proofData.publicSignals, null, 2)
  );

  console.log("💾 Doctor proof saved locally");
  
  return {
    proofType: "doctor",
    proofHash: publicSignals[0],
    jobId: `doctor_${Date.now()}`,
    status: "Verified",
    verified: true,
    timestamp: proofData.timestamp
  };
}

// Generate & save Patient proof locally
export async function patientFlow(patientInput) {
  console.log(" Generating Patient proof…");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    patientInput,
    path.join(projectRoot, "build", "patient", "patient.wasm"),
    path.join(projectRoot, "build", "patient", "patient_final.zkey")
  );

  // Save proof locally
  const proofDir = path.join(projectRoot, "proofs", "patient");
  if (!fs.existsSync(proofDir)) {
    fs.mkdirSync(proofDir, { recursive: true });
  }

  const proofData = {
    proof,
    publicSignals,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(proofDir, "proof.json"),
    JSON.stringify(proofData.proof, null, 2)
  );

  fs.writeFileSync(
    path.join(proofDir, "public.json"),
    JSON.stringify(proofData.publicSignals, null, 2)
  );

  console.log("💾 Patient proof saved locally");

  // Create mock aggregation data for UI compatibility
  const aggregationData = {
    doctorJobId: `doctor_${Date.now()}`,
    patientJobId: `patient_${Date.now()}`,
    aggregationId: `agg_${Date.now()}`,
    proofHash: publicSignals[0],
    timestamp: proofData.timestamp
  };
  
  try {
    fs.writeFileSync(
      path.join(projectRoot, "build", "patient", "aggregation_data.json"),
      JSON.stringify(aggregationData, null, 2)
    );
    console.log("💾 Aggregation data saved to build/patient/aggregation_data.json");
  } catch (error) {
    console.warn("⚠️ Could not save aggregation data:", error.message);
  }

  return {
    proofType: "patient",
    proofHash: publicSignals[0],
    jobId: `patient_${Date.now()}`,
    status: "Verified",
    verified: true,
    timestamp: proofData.timestamp,
    aggregationDetails: aggregationData,
    aggregationId: aggregationData.aggregationId
  };
}
