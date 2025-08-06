// contracts/HealthClaimVerifier.sol
pragma solidity ^0.8.17;
import "./ISettlement.sol";

contract HealthClaimVerifier {
  IZkVerifySettlement public settlement;
  constructor(address _settlement) {
    settlement = IZkVerifySettlement(_settlement);
  }

  function approve(
    bytes32 root,
    bytes32[] calldata path,
    uint256 index,
    bytes calldata leaf
  ) external view returns (bool) {
    return settlement.verifyProofAggregation(root, path, index, leaf);
  }
}
