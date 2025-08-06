import React from 'react';
import { Stethoscope, User, Building, Users, Shield } from 'lucide-react';
import './RoleSelector.css';

const RoleSelector = ({ onRoleSelect }) => {
  const roles = [
    {
      id: 'doctor',
      title: 'Healthcare Provider',
      subtitle: 'Doctor / Medical Professional',
      description: 'Generate cryptographic proofs for medical procedures while maintaining patient privacy',
      icon: Stethoscope,
      color: 'doctor',
      features: [
        'Generate procedure proofs',
        'Verify patient eligibility',
        'Submit claims securely',
        'Track claim status'
      ]
    },
    {
      id: 'patient',
      title: 'Patient',
      subtitle: 'Healthcare Consumer',
      description: 'Submit insurance claims with zero-knowledge proofs protecting your medical privacy',
      icon: User,
      color: 'patient',
      features: [
        'Submit private claims',
        'Link to doctor proofs',
        'Track claim progress',
        'Manage policy details'
      ]
    },
    {
      id: 'insurance',
      title: 'Insurance Company',
      subtitle: 'Claims Administrator',
      description: 'Verify and process claims with cryptographic certainty while respecting patient privacy',
      icon: Building,
      color: 'insurance',
      features: [
        'Verify claim validity',
        'Process payments',
        'Audit trail access',
        'Fraud detection'
      ]
    }
  ];

  return (
    <div className="role-selector">
      <div className="role-header">
        <Shield className="role-header-icon" />
        <h2>Choose Your Role</h2>
        <p>Select your role to access the appropriate ZKClaim interface</p>
      </div>

      <div className="roles-grid">
        {roles.map((role) => {
          const IconComponent = role.icon;
          return (
            <div 
              key={role.id}
              className={`role-card ${role.color}`}
              onClick={() => onRoleSelect(role.id)}
            >
              <div className="role-icon">
                <IconComponent size={48} />
              </div>
              
              <div className="role-content">
                <h3>{role.title}</h3>
                <h4>{role.subtitle}</h4>
                <p>{role.description}</p>
                
                <ul className="role-features">
                  {role.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="role-action">
                <span>Enter as {role.title}</span>
                <div className="role-arrow">→</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="role-footer">
        <p>All roles use the same secure zero-knowledge proof system to ensure privacy and verification</p>
      </div>
    </div>
  );
};

export default RoleSelector;
