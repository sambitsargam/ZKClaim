pragma circom 2.1.9;

include "poseidon.circom";

template DoctorClaim() {
    signal input procedure_code;
    signal input doctor_id;
    signal input date;

    signal output proof_hash;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== procedure_code;
    hasher.inputs[1] <== doctor_id;
    hasher.inputs[2] <== date;
    proof_hash <== hasher.out;
}

component main = DoctorClaim();
