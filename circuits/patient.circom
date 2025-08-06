pragma circom 2.1.9;

include "poseidon.circom";
include "comparators.circom";

template PatientClaim() {
  // PUBLIC input from Doctor's proof
  signal input doctor_proof_hash;    

  // PRIVATE inputs
  signal input patient_id;           // numeric or hash of patient DID
  signal input policy_limit;         // e.g. in cents
  signal input claim_amount;         // e.g. in cents

  // PUBLIC output
  signal output valid_claim_hash;

  // Enforce claim_amount <= policy_limit
  component leq = LessEqThan(32);  // 32 bits should be enough for claim amounts
  leq.in[0] <== claim_amount;
  leq.in[1] <== policy_limit;
  
  // Poseidon hash of doctor_proof_hash, patient_id, claim_amount, policy_limit
  component hasher = Poseidon(4);
  hasher.inputs[0] <== doctor_proof_hash;
  hasher.inputs[1] <== patient_id;
  hasher.inputs[2] <== claim_amount;
  hasher.inputs[3] <== policy_limit;

  // Multiply by leq.out (1 if valid, 0 otherwise) so invalid claims hash to zero
  valid_claim_hash <== hasher.out * leq.out;
}

component main = PatientClaim();
