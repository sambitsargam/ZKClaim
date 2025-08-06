const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config/.env') });

const ZKVerifyFlow = require('../../scripts/zkverifyFlow');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main claims submission endpoint
app.post('/api/submit-claims', async (req, res) => {
    try {
        console.log('Received claims submission request');
        
        // Validate environment variables
        if (!process.env.RELAYER_API || !process.env.RELAYER_KEY) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Missing RELAYER_API or RELAYER_KEY configuration'
            });
        }
        
        // Extract input objects from request body
        const { doctorInput, patientInput } = req.body;
        
        // Validate inputs
        if (!doctorInput || !patientInput) {
            return res.status(400).json({
                error: 'Missing inputs',
                message: 'Both doctorInput and patientInput are required'
            });
        }
        
        // Validate doctor input structure
        if (!doctorInput.procedure_code || !doctorInput.doctor_id || !doctorInput.date) {
            return res.status(400).json({
                error: 'Invalid doctor input',
                message: 'doctorInput must contain procedure_code, doctor_id, and date'
            });
        }
        
        // Validate patient input structure
        if (!patientInput.patient_id || !patientInput.policy_limit || !patientInput.claim_amount) {
            return res.status(400).json({
                error: 'Invalid patient input',
                message: 'patientInput must contain patient_id, policy_limit, and claim_amount'
            });
        }
        
        // Validate claim amount vs policy limit
        if (parseInt(patientInput.claim_amount) > parseInt(patientInput.policy_limit)) {
            return res.status(400).json({
                error: 'Invalid claim',
                message: 'Claim amount cannot exceed policy limit'
            });
        }
        
        console.log('Processing with inputs:', { doctorInput, patientInput });
        
        // Create and execute ZKVerify flow with runtime inputs
        const zkFlow = new ZKVerifyFlow();
        const result = await zkFlow.execute(doctorInput, patientInput);
        
        // Return the structured result
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Claims submission failed:', error);
        
        // Determine appropriate HTTP status code
        let statusCode = 500;
        let errorMessage = 'Failed to process claims';
        
        if (error.message.includes('Missing RELAYER_API') || 
            error.message.includes('Missing RELAYER_KEY')) {
            statusCode = 500;
            errorMessage = 'Server configuration error';
        } else if (error.response?.status) {
            // HTTP error from external API
            statusCode = error.response.status >= 500 ? 502 : 400;
            errorMessage = 'External service error';
        } else if (error.message.includes('timeout')) {
            statusCode = 504;
            errorMessage = 'Request timeout';
        } else if (error.message.includes('ENOENT')) {
            statusCode = 500;
            errorMessage = 'Required files not found - please compile circuits first';
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Handle 404s
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Start server
const server = app.listen(port, () => {
    console.log(`ZKClaim backend server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Claims API: http://localhost:${port}/api/submit-claims`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;
