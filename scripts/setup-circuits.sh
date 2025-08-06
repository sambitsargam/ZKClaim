#!/bin/bash

echo "Setting up ZKClaim circuits..."

# Check if circom and snarkjs are installed
if ! command -v circom &> /dev/null; then
    echo "circom is not installed! Please install it first:"
    echo "npm install -g circom"
    exit 1
fi

if ! command -v snarkjs &> /dev/null; then
    echo "snarkjs is not installed! Please install it first:"
    echo "npm install -g snarkjs"
    exit 1
fi

# Create powers of tau (if not exists)
if [ ! -f "build/powers_of_tau.ptau" ]; then
    echo "Generating powers of tau..."
    snarkjs powersoftau new bn128 12 build/pot12_0000.ptau -v
    snarkjs powersoftau contribute build/pot12_0000.ptau build/pot12_0001.ptau --name="First contribution" -v -e="random text"
    snarkjs powersoftau prepare phase2 build/pot12_0001.ptau build/powers_of_tau.ptau -v
    rm build/pot12_0000.ptau build/pot12_0001.ptau
fi

# Compile Doctor Circuit
echo "Compiling doctor circuit..."
circom circuits/doctor.circom --r1cs --wasm --sym -o build/doctor

# Compile Patient Circuit  
echo "Compiling patient circuit..."
circom circuits/patient.circom --r1cs --wasm --sym -o build/patient

# Setup Doctor Circuit
echo "Setting up doctor circuit..."
cd build/doctor
snarkjs groth16 setup doctor.r1cs ../powers_of_tau.ptau doctor_0000.zkey
snarkjs zkey contribute doctor_0000.zkey doctor_0001.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey doctor_0001.zkey doctor_vk.json
mv doctor_0001.zkey doctor_final.zkey
rm doctor_0000.zkey
cd ../..

# Setup Patient Circuit
echo "Setting up patient circuit..."
cd build/patient
snarkjs groth16 setup patient.r1cs ../powers_of_tau.ptau patient_0000.zkey
snarkjs zkey contribute patient_0000.zkey patient_0001.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey patient_0001.zkey patient_vk.json
mv patient_0001.zkey patient_final.zkey
rm patient_0000.zkey
cd ../..

echo "Circuit setup complete!"
echo "Generated files:"
echo "- build/doctor/doctor_final.zkey"
echo "- build/doctor/doctor_vk.json"
echo "- build/patient/patient_final.zkey"
echo "- build/patient/patient_vk.json"
