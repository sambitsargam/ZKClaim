import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { doctorFlow, patientFlow } from '../scripts/zkverifyFlow.js';
import dotenv from 'dotenv';

dotenv.config();

const { RELAYER_API, RELAYER_KEY, CHAIN_ID } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ZKClaim API is running' });
});

// Doctor proof generation endpoint
app.post('/api/doctor-proof', async (req, res) => {
  try {
    console.log('Received doctor proof request:', req.body);
    
    const { procedure_code, doctor_id, date } = req.body;
    
    if (!procedure_code || !doctor_id || !date) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['procedure_code', 'doctor_id', 'date']
      });
    }

    // Call the doctorFlow function from zkverifyFlow.js
    const doctorInput = {
      procedure_code,
      doctor_id,
      date
    };

    console.log('Generating doctor proof...');
    const result = await doctorFlow(doctorInput);
    
    console.log('Doctor proof generated successfully:', result);
    res.json({
      success: true,
      proof: result
    });

  } catch (error) {
    console.error('Doctor proof generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate doctor proof',
      details: error.message
    });
  }
});

// Patient proof generation endpoint
app.post('/api/patient-proof', async (req, res) => {
  try {
    console.log('Received patient proof request:', req.body);
    
    const { patient_id, claim_amount, policy_limit, doctor_proof_hash } = req.body;
    
    if (!patient_id || !claim_amount || !policy_limit || !doctor_proof_hash) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['patient_id', 'claim_amount', 'policy_limit', 'doctor_proof_hash']
      });
    }

    // Call the patientFlow function from zkverifyFlow.js
    const patientInput = {
      doctor_proof_hash,
      patient_id,
      claim_amount,
      policy_limit
    };

    console.log('Generating patient proof...');
    const result = await patientFlow(patientInput);
    
    console.log('Patient proof generated successfully:', result);
    res.json({
      success: true,
      proof: result
    });

  } catch (error) {
    console.error('Patient proof generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate patient proof',
      details: error.message
    });
  }
});

// Demo endpoint that runs the full flow
app.post('/api/demo', async (req, res) => {
  try {
    console.log('Running full ZKClaim demo...');
    
    // Default demo data
    const doctorInput = {
      procedure_code: "12345",
      doctor_id: "67890",
      date: "20240101"
    };

    console.log('Step 1: Generating doctor proof...');
    const doctorResult = await doctorFlow(doctorInput);
    console.log('Doctor proof result:', doctorResult);

    const patientInput = {
      doctor_proof_hash: doctorResult.proofHash,
      patient_id: "54321",
      claim_amount: "1000",
      policy_limit: "5000"
    };

    console.log('Step 2: Generating patient proof...');
    const patientResult = await patientFlow(patientInput);
    console.log('Patient proof result:', patientResult);

    res.json({
      doctor: doctorResult,
      patient: patientResult,
      success: true,
      message: 'ZKClaim demo completed successfully!'
    });

  } catch (error) {
    console.error('Demo execution error:', error);
    res.status(500).json({
      error: 'Demo execution failed',
      details: error.message
    });
  }
});

// Verify proof using saved proof files
app.post('/api/verify-saved-proof', async (req, res) => {
  try {
    const { proofType, proofData, publicSignals } = req.body;
    
    console.log(`🔍 Verifying ${proofType} proof using saved data...`);
    
    if (!proofData || !publicSignals || !proofType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['proofType', 'proofData', 'publicSignals']
      });
    }

    // Get the VK hash for this proof type
    const vkHashPath = path.join(process.cwd(), '..', 'build', proofType, `${proofType}_vk_hash.json`);
    
    if (!fs.existsSync(vkHashPath)) {
      return res.status(404).json({
        error: `VK hash file not found for ${proofType}`,
        path: vkHashPath
      });
    }

    const vkHashData = JSON.parse(fs.readFileSync(vkHashPath));
    const vkHash = vkHashData.vkHash;
    
    console.log(`Using VK hash: ${vkHash}`);

    // Submit proof to zkVerify for verification
    const params = {
      proofType: "groth16",
      vkRegistered: true,
      proofOptions: {
        library: "snarkjs",
        curve: "bn128"
      },
      proofData: {
        proof: proofData,
        publicSignals: publicSignals,
        vk: vkHash
      }
    };

    // Add chainId for aggregation if provided
    if (CHAIN_ID && parseInt(CHAIN_ID)) {
      params.chainId = parseInt(CHAIN_ID);
      console.log(`🔗 Aggregation enabled for chain ID: ${CHAIN_ID}`);
    }

    console.log('Submitting proof for verification...');
    const submitRes = await axios.post(
      `${RELAYER_API}/submit-proof/${RELAYER_KEY}`,
      params
    );

    console.log("Proof submitted:", submitRes.data);
    
    if (submitRes.data.optimisticVerify !== "success") {
      return res.status(400).json({
        success: false,
        error: "Proof verification failed",
        details: submitRes.data
      });
    }

    const jobId = submitRes.data.jobId;
    
    // Poll for final status
    console.log(`Polling job status for job ID: ${jobId}`);
    const isAggregationEnabled = CHAIN_ID && parseInt(CHAIN_ID);
    const targetStatus = isAggregationEnabled ? "Aggregated" : "Finalized";
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      try {
        const statusRes = await axios.get(
          `${RELAYER_API}/job-status/${RELAYER_KEY}/${jobId}`
        );
        
        const { status } = statusRes.data;
        console.log(`Job ${jobId} status: ${status}`);
        
        if (status === targetStatus) {
          console.log(`✅ Proof ${targetStatus.toLowerCase()} successfully`);
          return res.json({
            success: true,
            verified: true,
            proofType,
            jobId,
            status: status,
            txHash: statusRes.data.txHash,
            blockHash: statusRes.data.blockHash,
            aggregationId: statusRes.data.aggregationId,
            message: `${proofType} proof verified successfully`
          });
        }
        
        if (status === "Failed") {
          return res.status(400).json({
            success: false,
            verified: false,
            error: `Proof verification failed`,
            details: statusRes.data
          });
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, isAggregationEnabled ? 20000 : 5000));
        attempts++;
        
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log("Service Unavailable, retrying...");
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }
    
    // Timeout
    return res.status(408).json({
      success: false,
      verified: false,
      error: 'Verification timeout',
      jobId
    });
    
  } catch (error) {
    console.error('❌ Proof verification error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      error: 'Proof verification failed',
      details: error.message
    });
  }
});

// Verify proofs from files in proofs directory
app.post('/api/verify-proofs-from-files', async (req, res) => {
  try {
    console.log('🔍 Verifying proofs from saved files...');
    
    const proofsDir = path.join(process.cwd(), '..', 'proofs');
    console.log('📁 Looking for proofs in:', proofsDir);
    const results = [];
    
    // Check doctor proof
    const doctorDir = path.join(proofsDir, 'doctor');
    const doctorProofFile = path.join(doctorDir, 'proof.json');
    const doctorPublicFile = path.join(doctorDir, 'public.json');
    
    console.log('🔍 Checking doctor files:');
    console.log('  - Proof file:', doctorProofFile, 'exists:', fs.existsSync(doctorProofFile));
    console.log('  - Public file:', doctorPublicFile, 'exists:', fs.existsSync(doctorPublicFile));
    
    if (fs.existsSync(doctorProofFile) && fs.existsSync(doctorPublicFile)) {
      console.log('📁 Found doctor proof files');
      
      const doctorProofData = JSON.parse(fs.readFileSync(doctorProofFile));
      const doctorPublicSignals = JSON.parse(fs.readFileSync(doctorPublicFile));
      
      console.log('🏥 Verifying doctor proof...');
      const doctorVerifyResponse = await axios.post('http://localhost:3001/api/verify-saved-proof', {
        proofType: 'doctor',
        proofData: doctorProofData,
        publicSignals: doctorPublicSignals
      });
      
      results.push({
        proofType: 'doctor',
        verified: doctorVerifyResponse.data.verified,
        jobId: doctorVerifyResponse.data.jobId,
        status: doctorVerifyResponse.data.status,
        proofHash: doctorPublicSignals[0] // First public signal is the proof hash
      });
    } else {
      results.push({
        proofType: 'doctor',
        verified: false,
        error: 'Doctor proof files not found'
      });
    }
    
    // Check patient proof
    const patientDir = path.join(proofsDir, 'patient');
    const patientProofFile = path.join(patientDir, 'proof.json');
    const patientPublicFile = path.join(patientDir, 'public.json');
    
    if (fs.existsSync(patientProofFile) && fs.existsSync(patientPublicFile)) {
      console.log('📁 Found patient proof files');
      
      const patientProofData = JSON.parse(fs.readFileSync(patientProofFile));
      const patientPublicSignals = JSON.parse(fs.readFileSync(patientPublicFile));
      
      console.log('👤 Verifying patient proof...');
      const patientVerifyResponse = await axios.post('http://localhost:3001/api/verify-saved-proof', {
        proofType: 'patient',
        proofData: patientProofData,
        publicSignals: patientPublicSignals
      });
      
      results.push({
        proofType: 'patient',
        verified: patientVerifyResponse.data.verified,
        jobId: patientVerifyResponse.data.jobId,
        status: patientVerifyResponse.data.status,
        proofHash: patientPublicSignals[0] // First public signal is the proof hash
      });
    } else {
      results.push({
        proofType: 'patient',
        verified: false,
        error: 'Patient proof files not found'
      });
    }
    
    const verifiedCount = results.filter(r => r.verified).length;
    
    res.json({
      success: true,
      message: `Verified ${verifiedCount}/${results.length} proofs from files`,
      results,
      allVerified: verifiedCount === results.length
    });
    
  } catch (error) {
    console.error('❌ File verification error:', error);
    res.status(500).json({
      success: false,
      error: 'File verification failed',
      details: error.message
    });
  }
});

// Endpoint to read aggregation data for transaction links
app.get('/api/read-aggregation-data', (req, res) => {
  try {
    const aggregationDataPath = path.join(process.cwd(), '..', 'build', 'patient', 'aggregation_data.json');
    
    if (!fs.existsSync(aggregationDataPath)) {
      return res.status(404).json({
        error: 'Aggregation data not found',
        path: aggregationDataPath
      });
    }
    
    const aggregationData = JSON.parse(fs.readFileSync(aggregationDataPath));
    res.json(aggregationData);
    
  } catch (error) {
    console.error('❌ Error reading aggregation data:', error);
    res.status(500).json({
      error: 'Failed to read aggregation data',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZKClaim API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Doctor proof: POST http://localhost:${PORT}/api/doctor-proof`);
  console.log(`👤 Patient proof: POST http://localhost:${PORT}/api/patient-proof`);
  console.log(`🔍 Verify saved proof: POST http://localhost:${PORT}/api/verify-saved-proof`);
  console.log(`📁 Verify from files: POST http://localhost:${PORT}/api/verify-proofs-from-files`);
  console.log(`📊 Read aggregation data: GET http://localhost:${PORT}/api/read-aggregation-data`);
  console.log(`🎯 Full demo: POST http://localhost:${PORT}/api/demo`);
});

export default app;
