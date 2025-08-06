// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.17;

contract HealthClaimVerifier {
  struct DoctorClaim {
    address doctorAddress;
    address patientAddress;
    string proofHash;
    bool isActive;
  }

  struct PatientClaim {
    address patientAddress;
    address doctorAddress;
    string doctorProofHash;
    string patientProofHash;
    uint256 claimAmount;
    ClaimStatus status;
  }

  enum ClaimStatus { Pending, Verified, Approved, Rejected, Paid }

  mapping(address => DoctorClaim[]) public doctorClaims;
  mapping(address => PatientClaim[]) public patientClaims;
  mapping(string => bool) public verifiedProofs;
  
  uint256 public totalClaims;
  PatientClaim[] public allClaims;
  address[] public doctorAddresses; // Track all doctors who have submitted claims

  event DoctorClaimSubmitted(address indexed doctor, string proofHash);
  event PatientClaimSubmitted(address indexed patient, address indexed doctor, string patientProofHash, uint256 claimAmount);
  event ClaimVerified(uint256 indexed claimId, bool doctorVerified, bool patientVerified);
  event ClaimApproved(uint256 indexed claimId, uint256 amount);
  event PaymentProcessed(uint256 indexed claimId, address indexed patient, uint256 amount);

  function submitDoctorClaim(string memory proofHash, address patientAddress) external {
    // Add doctor to the list if not already present
    bool doctorExists = false;
    for (uint256 i = 0; i < doctorAddresses.length; i++) {
      if (doctorAddresses[i] == msg.sender) {
        doctorExists = true;
        break;
      }
    }
    if (!doctorExists) {
      doctorAddresses.push(msg.sender);
    }

    doctorClaims[msg.sender].push(DoctorClaim({
      doctorAddress: msg.sender,
      patientAddress: patientAddress,
      proofHash: proofHash,
      isActive: true
    }));

    emit DoctorClaimSubmitted(msg.sender, proofHash);
  }

  function submitPatientClaim(
    address doctorAddress,
    string memory doctorProofHash,
    string memory patientProofHash,
    uint256 claimAmount
  ) external {
    PatientClaim memory newClaim = PatientClaim({
      patientAddress: msg.sender,
      doctorAddress: doctorAddress,
      doctorProofHash: doctorProofHash,
      patientProofHash: patientProofHash,
      claimAmount: claimAmount,
      status: ClaimStatus.Pending
    });

    patientClaims[msg.sender].push(newClaim);
    allClaims.push(newClaim);
    totalClaims++;

    emit PatientClaimSubmitted(msg.sender, doctorAddress, patientProofHash, claimAmount);
  }

  function verifyClaim(uint256 claimId, bool doctorVerified, bool patientVerified) external {
    require(claimId < totalClaims, "Invalid claim ID");
    
    if (doctorVerified && patientVerified) {
      allClaims[claimId].status = ClaimStatus.Verified;
      verifiedProofs[allClaims[claimId].doctorProofHash] = true;
      verifiedProofs[allClaims[claimId].patientProofHash] = true;
    }

    emit ClaimVerified(claimId, doctorVerified, patientVerified);
  }

  function approveClaim(uint256 claimId) external {
    require(claimId < totalClaims, "Invalid claim ID");
    require(allClaims[claimId].status == ClaimStatus.Verified, "Claim not verified");
    
    allClaims[claimId].status = ClaimStatus.Approved;
    emit ClaimApproved(claimId, allClaims[claimId].claimAmount);
  }

  function processPayment(uint256 claimId) external payable {
    require(claimId < totalClaims, "Invalid claim ID");
    require(allClaims[claimId].status == ClaimStatus.Approved, "Claim not approved");
    require(msg.value >= allClaims[claimId].claimAmount, "Insufficient payment");

    allClaims[claimId].status = ClaimStatus.Paid;
    
    // Transfer payment to patient
    payable(allClaims[claimId].patientAddress).transfer(allClaims[claimId].claimAmount);
    
    // Refund excess payment
    if (msg.value > allClaims[claimId].claimAmount) {
      payable(msg.sender).transfer(msg.value - allClaims[claimId].claimAmount);
    }

    emit PaymentProcessed(claimId, allClaims[claimId].patientAddress, allClaims[claimId].claimAmount);
  }

  function getDoctorClaims(address doctor) external view returns (DoctorClaim[] memory) {
    return doctorClaims[doctor];
  }

  function getPatientClaims(address patient) external view returns (PatientClaim[] memory) {
    return patientClaims[patient];
  }

  function getAllPendingClaims() external view returns (PatientClaim[] memory) {
    uint256 pendingCount = 0;
    for (uint256 i = 0; i < totalClaims; i++) {
      if (allClaims[i].status == ClaimStatus.Pending || allClaims[i].status == ClaimStatus.Verified) {
        pendingCount++;
      }
    }

    PatientClaim[] memory pendingClaims = new PatientClaim[](pendingCount);
    uint256 currentIndex = 0;
    
    for (uint256 i = 0; i < totalClaims; i++) {
      if (allClaims[i].status == ClaimStatus.Pending || allClaims[i].status == ClaimStatus.Verified) {
        pendingClaims[currentIndex] = allClaims[i];
        currentIndex++;
      }
    }

    return pendingClaims;
  }

  function getLatestDoctorProofHash() external view returns (string memory) {
    // Find the latest active doctor claim from all doctors
    string memory latestProofHash = "";
    
    // Iterate through all doctors who have submitted claims
    for (uint256 i = 0; i < doctorAddresses.length; i++) {
      address doctorAddr = doctorAddresses[i];
      DoctorClaim[] memory claims = doctorClaims[doctorAddr];
      
      // Find the latest active claim for this doctor
      for (int256 j = int256(claims.length) - 1; j >= 0; j--) {
        if (claims[uint256(j)].isActive) {
          latestProofHash = claims[uint256(j)].proofHash;
          return latestProofHash; // Return the first active claim found (most recent)
        }
      }
    }
    
    return latestProofHash;
  }

  // NEW: Get doctor proof hash specifically for a patient
  function getDoctorProofHashForPatient(address patientAddress) external view returns (string memory) {
    string memory patientProofHash = "";
    
    // Iterate through all doctors who have submitted claims
    for (uint256 i = 0; i < doctorAddresses.length; i++) {
      address doctorAddr = doctorAddresses[i];
      DoctorClaim[] memory claims = doctorClaims[doctorAddr];
      
      // Find the latest active claim for this specific patient
      for (int256 j = int256(claims.length) - 1; j >= 0; j--) {
        if (claims[uint256(j)].isActive && claims[uint256(j)].patientAddress == patientAddress) {
          patientProofHash = claims[uint256(j)].proofHash;
          return patientProofHash; // Return the latest claim for this patient
        }
      }
    }
    
    return patientProofHash;
  }

  function getTotalDoctors() external view returns (uint256) {
    return doctorAddresses.length;
  }

  function getAllDoctorAddresses() external view returns (address[] memory) {
    return doctorAddresses;
  }
}
