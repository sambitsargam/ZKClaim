import { useState, useEffect } from "react";
import { ethers } from "ethers";
import HealthClaimVerifierABI from "./abis/HealthClaimVerifier.json";

const VERIFIER = "0x7EF74176B51b13e8753C1Ca5055da870a5EC63f2";

function App() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [doctorInput, setDoctorInput] = useState(null);
  const [patientInput, setPatientInput] = useState(null);
  const [aggData, setAggData] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      p.send("eth_requestAccounts", []).then(() => {
        const signer = p.getSigner();
        setContract(new ethers.Contract(VERIFIER, HealthClaimVerifierABI, signer));
      });
    } else {
      alert("Please install MetaMask");
    }
  }, []);

  const genDoctor = () => {
    const input = {
      procedure_code: 1001,
      doctor_id: Date.now() % 1e9,
      date: Number(new Date().toISOString().slice(0,10).replace(/-/g,""))
    };
    setDoctorInput(input);
    alert("Doctor input generated");
  };

  const doSubmit = async () => {
    if (!doctorInput) { alert("Generate doctor input first"); return; }
    const patInp = {
      patient_id: Math.floor(Math.random()*1e9),
      policy_limit: 500000,
      claim_amount: 450000
    };
    setPatientInput(patInp);
    const res = await fetch("http://localhost:3000/api/submit-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorInput, patientInput: patInp })
    });
    const data = await res.json();
    setAggData(data);
    alert("Proofs submitted and finalized");
  };

  const approve = async () => {
    if (!aggData) { alert("Submit proofs first"); return; }
    const tx = await contract.approve(aggData.root, aggData.path, aggData.index, aggData.leaf);
    await tx.wait();
    alert("Claim approved: " + tx.hash);
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={genDoctor}>1. Generate Doctor Input</button>
      <button onClick={doSubmit}>2. Submit Proofs to zkVerify</button>
      <button onClick={approve}>3. Approve on-chain</button>
    </div>
  );
}

export default App;
