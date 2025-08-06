// scripts/zkverifyFlow.js

import axios from "axios";
import snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const { RELAYER_API, RELAYER_KEY } = process.env;
if (!RELAYER_API || !RELAYER_KEY) {
  throw new Error("Missing RELAYER_API or RELAYER_KEY in .env");
}

// Helper: register a verification key and return vkHash
async function registerVK(role) {
  const vkJson = JSON.parse(fs.readFileSync(
    path.join("build", role, `${role}_vk.json`)
  ));
  const res = await axios.post(
    `${RELAYER_API}/register-vk/${RELAYER_KEY}`,
    { proofType: "groth16", vk: vkJson }
  );
  return res.data.meta.vkHash;
}

// Helper: poll until the relayer finalizes a job
async function awaitFinal(jobId) {
  while (true) {
    const res = await axios.get(
      `${RELAYER_API}/job-status/${RELAYER_KEY}/${jobId}`
    );
    const { status } = res.data;
    console.log(`Job ${jobId} status: ${status}`);
    if (status === "Finalized") return res.data;
    if (status === "Failed") throw new Error(`Job ${jobId} failed`);
    await new Promise(r => setTimeout(r, 3000));
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
  const submitRes = await axios.post(
    `${RELAYER_API}/submit-proof/${RELAYER_KEY}`,
    {
      proofType: "groth16",
      vkRegistered: true,
      vk: vkHash,
      proof,
      publicSignals
    }
  );
  const jobId = submitRes.data.jobId;

  const final = await awaitFinal(jobId);
  // publicSignals[0] is our proof_hash
  return { proofHash: publicSignals[0] };
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
  const submitRes = await axios.post(
    `${RELAYER_API}/submit-proof/${RELAYER_KEY}`,
    {
      proofType: "groth16",
      vkRegistered: true,
      vk: vkHash,
      proof,
      publicSignals
    }
  );
  const jobId = submitRes.data.jobId;

  const final = await awaitFinal(jobId);
  // final contains aggregation data:
  // final.root, final.path, final.index, final.leafDigest
  return {
    root: final.root,
    path: final.path,
    index: final.index,
    leaf: final.leafDigest
  };
}
