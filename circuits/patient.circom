pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template Patient() {
    // Private inputs
    signal private input doctor_proof_hash;
    signal private input patient_id;
    signal private input claim_amount;
    signal private input policy_limit;
    
    // Public output
    signal output valid_claim_hash;
    
    // Constraint: claim_amount must be <= policy_limit
    component leq = LessEqThan(64); // 64-bit comparison
    leq.in[0] <== claim_amount;
    leq.in[1] <== policy_limit;
    leq.out === 1; // Enforce that claim_amount <= policy_limit
    
    // Create Poseidon hash component for 4 inputs
    component poseidon = Poseidon(4);
    
    // Connect inputs to Poseidon hasher
    poseidon.inputs[0] <== doctor_proof_hash;
    poseidon.inputs[1] <== patient_id;
    poseidon.inputs[2] <== claim_amount;
    poseidon.inputs[3] <== policy_limit;
    
    // Output the hash
    valid_claim_hash <== poseidon.out;
}

component main = Patient();
