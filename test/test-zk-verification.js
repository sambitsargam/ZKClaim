// Test script to verify saved proofs using the new API endpoints
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testProofVerification() {
  console.log('🧪 Testing ZK Proof Verification from Saved Files\n');
  
  try {
    console.log('🔍 Testing verification of saved proof files...');
    
    const response = await axios.post(`${API_BASE}/verify-proofs-from-files`);
    
    console.log('✅ Verification Response:', response.data);
    console.log('\n📊 Results:');
    
    response.data.results.forEach(result => {
      console.log(`\n${result.proofType.toUpperCase()} PROOF:`);
      console.log(`   Verified: ${result.verified ? '✅ YES' : '❌ NO'}`);
      console.log(`   Status: ${result.status || 'N/A'}`);
      console.log(`   Job ID: ${result.jobId || 'N/A'}`);
      console.log(`   Proof Hash: ${result.proofHash || 'N/A'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n🎯 SUMMARY: ${response.data.message}`);
    console.log(`All verified: ${response.data.allVerified ? '✅ YES' : '❌ NO'}`);
    
    if (response.data.allVerified) {
      console.log('\n✨ SUCCESS: Both proofs verified successfully!');
      console.log('The insurance company can now approve or reject the claims.');
    } else {
      console.log('\n⚠️ Some proofs failed verification.');
      console.log('Check the proof files and VK hashes.');
    }
    
  } catch (error) {
    console.error('❌ Verification test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Possible issues:');
      console.log('- Proof files not found in proofs/doctor/ or proofs/patient/');
      console.log('- VK hash files missing in build/doctor/ or build/patient/');
      console.log('- API server not running on port 3001');
    }
  }
}

async function testIndividualProofVerification() {
  console.log('\n🔬 Testing individual proof verification...\n');
  
  // Test with sample proof data (this would be real proof data in practice)
  const sampleProofData = {
    pi_a: ["0", "1"], 
    pi_b: [["1", "0"], ["0", "1"]],
    pi_c: ["0", "1"],
    protocol: "groth16",
    curve: "bn128"
  };
  
  const samplePublicSignals = ["123456789"]; // Sample proof hash
  
  try {
    console.log('🧮 Testing doctor proof verification...');
    
    const response = await axios.post(`${API_BASE}/verify-saved-proof`, {
      proofType: 'doctor',
      proofData: sampleProofData,
      publicSignals: samplePublicSignals
    });
    
    console.log('Doctor verification result:', response.data);
    
  } catch (error) {
    console.error('Doctor proof verification failed:', error.response?.data || error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting ZK Proof Verification Tests\n');
  
  // Test 1: Verify proofs from saved files
  await testProofVerification();
  
  // Test 2: Individual proof verification (commented out for now)
  // await testIndividualProofVerification();
  
  console.log('\n✅ Tests completed!');
}

// Run tests
runTests().catch(console.error);
