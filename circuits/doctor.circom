pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template Doctor() {
    // Private inputs
    signal private input procedure_code;
    signal private input doctor_id;
    signal private input date;
    
    // Public output
    signal output proof_hash;
    
    // Create Poseidon hash component for 3 inputs
    component poseidon = Poseidon(3);
    
    // Connect inputs to Poseidon hasher
    poseidon.inputs[0] <== procedure_code;
    poseidon.inputs[1] <== doctor_id;
    poseidon.inputs[2] <== date;
    
    // Output the hash
    proof_hash <== poseidon.out;
}

component main = Doctor();
