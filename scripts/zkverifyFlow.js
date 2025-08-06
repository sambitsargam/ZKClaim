// scripts/zkverifyFlow.js

import axios from "axios";
import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const { RELAYER_API, RELAYER_KEY, CHAIN_ID } = process.env;
if (!RELAYER_API || !RELAYER_KEY) {
  throw new Error("Missing RELAYER_API or RELAYER_KEY in .env");
}

// Helper: register a verification key and return vkHash
async function registerVK(role) {
  const vkPath = path.join("build", role, `${role}_vk.json`);
  const vkHashPath = path.join("build", role, `${role}_vk_hash.json`);
  
  // Check if VK hash already exists
  if (fs.existsSync(vkHashPath)) {
    const vkHashData = JSON.parse(fs.readFileSync(vkHashPath));
    console.log(`Using existing VK hash for ${role}: ${vkHashData.vkHash}`);
    return vkHashData.vkHash;
  }

  const vkJson = JSON.parse(fs.readFileSync(vkPath));
  
  const params = {
    proofType: "groth16",
    proofOptions: {
      library: "snarkjs",
      curve: "bn128"
    },
    vk: vkJson
  };

  try {
    const res = await axios.post(
      `${RELAYER_API}/register-vk/${RELAYER_KEY}`,
      params
    );
    
    // Save the VK hash for future use
    const vkHash = res.data.vkHash || res.data.meta?.vkHash;
    fs.writeFileSync(vkHashPath, JSON.stringify({ vkHash }));
    console.log(`Registered VK for ${role}: ${vkHash}`);
    return vkHash;
  } catch (error) {
    console.error(`Error registering VK for ${role}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper: poll until the relayer finalizes a job
async function awaitFinal(jobId) {
  console.log(`Polling job status for job ID: ${jobId}`);
  const isAggregationEnabled = CHAIN_ID && parseInt(CHAIN_ID);
  const targetStatus = isAggregationEnabled ? "Aggregated" : "Finalized";
  
  console.log(`${isAggregationEnabled ? '🔗 Aggregation enabled' : '⚡ Direct verification'} - Waiting for status: ${targetStatus}`);
  
  while (true) {
    try {
      const res = await axios.get(
        `${RELAYER_API}/job-status/${RELAYER_KEY}/${jobId}`
      );
      const { status } = res.data;
      console.log(`Job ${jobId} status: ${status}`);
      
      if (status === targetStatus) {
        console.log(`Job ${targetStatus.toLowerCase()} successfully`);
        if (isAggregationEnabled && status === "Aggregated") {
          console.log("📊 Aggregation details:", res.data.aggregationDetails);
          console.log("🔗 Aggregation ID:", res.data.aggregationId);
        }
        return res.data;
      }
      if (status === "Failed") {
        throw new Error(`Job ${jobId} failed: ${JSON.stringify(res.data)}`);
      }
      
      // Wait longer for aggregation process
      const waitTime = isAggregationEnabled ? 20000 : 5000;
      await new Promise(r => setTimeout(r, waitTime));
    } catch (error) {
      if (error.response && error.response.status === 503) {
        console.log("Service Unavailable, retrying...");
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw error;
      }
    }
  }
}

// Generate & submit Doctor proof
export async function doctorFlow(doctorInput) {
  console.log("🔑 Registering Doctor VK…");
  const vkHash = await registerVK("doctor");

  console.log("📜 Generating Doctor proof…");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    doctorInput,
    path.join("build", "doctor", "doctor.wasm"),
    path.join("build", "doctor", "doctor_final.zkey")
  );

  console.log("🚀 Submitting Doctor proof to zkVerify…");
  const params = {
    proofType: "groth16",
    vkRegistered: true,
    proofOptions: {
      library: "snarkjs",
      curve: "bn128"
    },
    proofData: {
      proof,
      publicSignals,
      vk: vkHash
    }
  };

  // Add chainId for aggregation if provided
  if (CHAIN_ID && parseInt(CHAIN_ID)) {
    params.chainId = parseInt(CHAIN_ID);
    console.log(`🔗 Aggregation enabled for chain ID: ${CHAIN_ID}`);
  }

  const submitRes = await axios.post(
    `${RELAYER_API}/submit-proof/${RELAYER_KEY}`,
    params
  );

  console.log("Proof submitted:", submitRes.data);
  
  if (submitRes.data.optimisticVerify !== "success") {
    throw new Error("Proof verification failed, check proof artifacts");
  }

  const jobId = submitRes.data.jobId;
  const final = await awaitFinal(jobId);
  
  // Return appropriate data based on aggregation status
  const result = { 
    proofHash: publicSignals[0],
    txHash: final.txHash,
    blockHash: final.blockHash,
    jobId: jobId,
    status: final.status
  };

  // Add aggregation data if available
  if (final.aggregationDetails) {
    result.aggregationDetails = final.aggregationDetails;
    result.aggregationId = final.aggregationId;
  }

  return result;
}

// Generate & submit Patient proof (requires doctorProofHash)
export async function patientFlow(patientInput) {
  console.log("🔑 Registering Patient VK…");
  const vkHash = await registerVK("patient");

  console.log("📜 Generating Patient proof…");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    patientInput,
    path.join("build", "patient", "patient.wasm"),
    path.join("build", "patient", "patient_final.zkey")
  );

  console.log("🚀 Submitting Patient proof to zkVerify…");
  const params = {
    proofType: "groth16",
    vkRegistered: true,
    proofOptions: {
      library: "snarkjs",
      curve: "bn128"
    },
    proofData: {
      proof,
      publicSignals,
      vk: vkHash
    }
  };

  // Add chainId for aggregation if provided
  if (CHAIN_ID && parseInt(CHAIN_ID)) {
    params.chainId = parseInt(CHAIN_ID);
    console.log(`🔗 Aggregation enabled for chain ID: ${CHAIN_ID}`);
  }

  const submitRes = await axios.post(
    `${RELAYER_API}/submit-proof/${RELAYER_KEY}`,
    params
  );

  console.log("Proof submitted:", submitRes.data);
  
  if (submitRes.data.optimisticVerify !== "success") {
    throw new Error("Proof verification failed, check proof artifacts");
  }

  const jobId = submitRes.data.jobId;
  const final = await awaitFinal(jobId);
  
  // Return verification details
  const result = {
    proofHash: publicSignals[0],
    txHash: final.txHash,
    blockHash: final.blockHash,
    jobId: jobId,
    status: final.status
  };

  // Add aggregation data if available
  if (final.aggregationDetails) {
    result.aggregationDetails = final.aggregationDetails;
    result.aggregationId = final.aggregationId;
    
    // Save aggregation data to file for future reference
    const aggregationData = {
      ...final.aggregationDetails,
      aggregationId: final.aggregationId,
      proofHash: publicSignals[0],
      timestamp: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(
        path.join("build", "patient", "aggregation_data.json"),
        JSON.stringify(aggregationData, null, 2)
      );
      console.log("💾 Aggregation data saved to build/patient/aggregation_data.json");
    } catch (error) {
      console.warn("⚠️ Could not save aggregation data:", error.message);
    }
  }

  return result;
}
