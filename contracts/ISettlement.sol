// contracts/ISettlement.sol
pragma solidity ^0.8.17;

interface IZkVerifySettlement {
  function verifyProofAggregation(
    bytes32 root,
    bytes32[] calldata path,
    uint256 index,
    bytes calldata leaf
  ) external view returns (bool);
}
