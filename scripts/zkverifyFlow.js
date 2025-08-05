const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');
const axios = require('axios');
require('dotenv').config({ path: './config/.env' });

class ZKVerifyFlow {
    constructor() {
        this.relayerApi = process.env.RELAYER_API;
        this.relayerKey = process.env.RELAYER_KEY;
        
        if (!this.relayerApi || !this.relayerKey) {
            throw new Error('Missing RELAYER_API or RELAYER_KEY in environment variables');
        }
    }

    // Helper function to create VK hash
    createVKHash(vk) {
        const vkStr = JSON.stringify(vk);
        return require('crypto').createHash('sha256').update(vkStr).digest('hex');
    }

    // Register verification key
    async registerVK(vk, circuitName) {
        try {
            console.log(`Registering VK for ${circuitName}...`);
            const vkHash = this.createVKHash(vk);
            
            const response = await axios.post(
                `${this.relayerApi}/register-vk/${this.relayerKey}`,
                {
                    vk: vk,
                    vkHash: vkHash,
                    circuitName: circuitName
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log(`VK registration response for ${circuitName}:`, response.data);
            return { vkHash, response: response.data };
        } catch (error) {
            console.error(`Failed to register VK for ${circuitName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Submit proof to zkVerify
    async submitProof(proof, publicSignals, vk, vkHash, circuitName) {
        try {
            console.log(`Submitting proof for ${circuitName}...`);
            
            const response = await axios.post(
                `${this.relayerApi}/submit-proof/${this.relayerKey}`,
                {
                    proofType: "groth16",
                    vkRegistered: true,
                    vk: vkHash,
                    proof: proof,
                    publicSignals: publicSignals
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log(`Proof submission response for ${circuitName}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`Failed to submit proof for ${circuitName}:`, error.response?.data || error.message);
            throw error;
        }
    }

    // Poll job status until finalized
    async pollJobStatus(jobId, circuitName, maxAttempts = 60) {
        console.log(`Polling job status for ${circuitName} (Job ID: ${jobId})...`);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await axios.get(
                    `${this.relayerApi}/job-status/${this.relayerKey}/${jobId}`,
                    { timeout: 10000 }
                );
                
                const status = response.data.status;
                console.log(`Attempt ${attempt}: Job ${jobId} status: ${status}`);
                
                if (status === "Finalized") {
                    console.log(`Job ${jobId} finalized!`, response.data);
                    return response.data;
                } else if (status === "Failed") {
                    throw new Error(`Job ${jobId} failed: ${JSON.stringify(response.data)}`);
                }
                
                // Wait 5 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 5000));
                
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw new Error(`Job polling timeout after ${maxAttempts} attempts: ${error.message}`);
                }
                console.log(`Poll attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        throw new Error(`Job ${jobId} did not finalize within ${maxAttempts * 5} seconds`);
    }

    // Generate proof using snarkjs
    async generateProof(inputData, wasmPath, zkeyPath) {
        try {
            console.log('Generating proof with snarkjs...');
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                inputData,
                wasmPath,
                zkeyPath
            );
            
            console.log('Proof generated successfully');
            return { proof, publicSignals };
        } catch (error) {
            console.error('Failed to generate proof:', error);
            throw error;
        }
    }

    // Main flow execution
    async execute() {
        try {
            // Load verification keys
            const doctorVK = JSON.parse(fs.readFileSync('./build/doctor/doctor_vk.json', 'utf8'));
            const patientVK = JSON.parse(fs.readFileSync('./build/patient/patient_vk.json', 'utf8'));
            
            // Load test data
            const doctorInput = JSON.parse(fs.readFileSync('./data/doctor_input.json', 'utf8'));
            const patientInput = JSON.parse(fs.readFileSync('./data/patient_input.json', 'utf8'));
            
            // Register verification keys
            const doctorVKResult = await this.registerVK(doctorVK, 'doctor');
            const patientVKResult = await this.registerVK(patientVK, 'patient');
            
            // Generate doctor proof
            const doctorProofData = await this.generateProof(
                doctorInput,
                './build/doctor/doctor_js/doctor.wasm',
                './build/doctor/doctor.zkey'
            );
            
            // Update patient input with doctor proof hash (from public signals)
            patientInput.doctor_proof_hash = doctorProofData.publicSignals[0];
            
            // Generate patient proof
            const patientProofData = await this.generateProof(
                patientInput,
                './build/patient/patient_js/patient.wasm',
                './build/patient/patient.zkey'
            );
            
            // Submit doctor proof
            const doctorSubmission = await this.submitProof(
                doctorProofData.proof,
                doctorProofData.publicSignals,
                doctorVK,
                doctorVKResult.vkHash,
                'doctor'
            );
            
            // Submit patient proof
            const patientSubmission = await this.submitProof(
                patientProofData.proof,
                patientProofData.publicSignals,
                patientVK,
                patientVKResult.vkHash,
                'patient'
            );
            
            // Poll for doctor job completion
            const doctorResult = await this.pollJobStatus(doctorSubmission.jobId, 'doctor');
            
            // Poll for patient job completion
            const patientResult = await this.pollJobStatus(patientSubmission.jobId, 'patient');
            
            // Extract final results (using patient result as the final claim validation)
            const finalResult = {
                root: patientResult.merkleRoot || patientResult.root,
                path: patientResult.merklePath || patientResult.path || [],
                index: patientResult.leafIndex || patientResult.index,
                leaf: patientProofData.publicSignals[0] // valid_claim_hash
            };
            
            console.log('ZKVerify flow completed successfully!');
            console.log('Final result:', JSON.stringify(finalResult, null, 2));
            
            return finalResult;
            
        } catch (error) {
            console.error('ZKVerify flow failed:', error);
            throw error;
        }
    }
}

// Export for use as module
module.exports = ZKVerifyFlow;

// Run directly if called as script
if (require.main === module) {
    const flow = new ZKVerifyFlow();
    flow.execute()
        .then(result => {
            console.log(JSON.stringify(result));
            process.exit(0);
        })
        .catch(error => {
            console.error('Flow execution failed:', error);
            process.exit(1);
        });
}
