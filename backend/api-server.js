import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { doctorFlow, patientFlow } from '../scripts/zkverifyFlow.js';

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
  console.log(`🎯 Full demo: POST http://localhost:${PORT}/api/demo`);
});

export default app;
