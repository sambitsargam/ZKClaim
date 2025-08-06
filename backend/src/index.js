import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { doctorFlow, patientFlow } from '../../scripts/zkverifyFlow.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/submit-claims', async (req, res) => {
  try {
    const { doctorInput, patientInput } = req.body;
    const { proofHash } = await doctorFlow(doctorInput);
    const patientArgs = { ...patientInput, doctor_proof_hash: proofHash };
    const agg = await patientFlow(patientArgs);
    res.json(agg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
