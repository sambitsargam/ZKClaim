import React, { useState, useEffect } from 'react';
import { Shield, Zap, Eye, CheckCircle, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import { WagmiProvider, useChainId } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/web3';
import ZKClaimApp from './components/ZKClaimApp';
import RoleSelector from './components/RoleSelector';
import DoctorInterface from './components/DoctorInterface';
import PatientInterface from './components/PatientInterface';
import InsuranceInterface from './components/InsuranceInterface';
import NetworkSwitcher from './components/NetworkSwitcher';
import { SUPPORTED_CHAIN_IDS } from './config/contracts';
import './App.css';

const queryClient = new QueryClient();

// Component to check network and render appropriate content
function NetworkAwareContent({ children }) {
  const chainId = useChainId();
  const isNetworkSupported = SUPPORTED_CHAIN_IDS.includes(chainId);

  if (!isNetworkSupported) {
    return <NetworkSwitcher />;
  }

  return children;
}

function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'demo', 'roles', 'interface'

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLaunchApp = () => {
    setCurrentView('roles');
  };

  const handleViewDemo = () => {
    setShowApp(true);
    setCurrentView('demo');
    // Smooth scroll to the app section
    setTimeout(() => {
      document.getElementById('zkclaim-app')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCurrentView('interface');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setShowApp(false);
    setSelectedRole(null);
  };

  const handleBackToRoles = () => {
    setCurrentView('roles');
    setSelectedRole(null);
  };

  // Render role-specific interfaces
  if (currentView === 'interface' && selectedRole) {
    const RoleComponent = {
      doctor: DoctorInterface,
      patient: PatientInterface,
      insurance: InsuranceInterface
    }[selectedRole];

    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <div className="app">
            <nav className="nav">
              <div className="nav-container">
                <div className="nav-logo" onClick={handleBackToLanding}>
                  <Shield className="logo-icon" />
                  <span className="logo-text">ZKClaim</span>
                </div>
                <div className="nav-links">
                  <button className="nav-button secondary" onClick={handleBackToRoles}>
                    ← Back to Roles
                  </button>
                  <button className="nav-button" onClick={handleBackToLanding}>
                    Home
                  </button>
                </div>
              </div>
            </nav>
            <NetworkAwareContent>
              <RoleComponent />
            </NetworkAwareContent>
          </div>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  // Render role selector
  if (currentView === 'roles') {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <div className="app">
            <nav className="nav">
              <div className="nav-container">
                <div className="nav-logo" onClick={handleBackToLanding}>
                  <Shield className="logo-icon" />
                  <span className="logo-text">ZKClaim</span>
                </div>
                <div className="nav-links">
                  <button className="nav-button secondary" onClick={handleBackToLanding}>
                    ← Back to Home
                  </button>
                  <button className="nav-button" onClick={handleViewDemo}>
                    View Demo
                  </button>
                </div>
              </div>
            </nav>
            <NetworkAwareContent>
              <RoleSelector onRoleSelect={handleRoleSelect} />
            </NetworkAwareContent>
          </div>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  // Render main landing page
  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo" onClick={handleBackToLanding} style={{ cursor: 'pointer' }}>
            <Shield className="logo-icon" />
            <span className="logo-text">ZKClaim</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <button className="nav-link" onClick={handleViewDemo} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Demo</button>
            <button className="nav-button" onClick={handleLaunchApp}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`hero ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Secure Healthcare Claims with 
              <span className="highlight"> Zero-Knowledge Proofs</span>
            </h1>
            <p className="hero-description">
              ZKClaim revolutionizes healthcare insurance by enabling privacy-preserving claim verification. 
              Doctors and patients can prove medical procedures without revealing sensitive data.
            </p>
            <div className="hero-buttons">
              <button className="primary-button" onClick={handleLaunchApp}>
                Launch App
                <ArrowRight className="button-icon" />
              </button>
              <button className="secondary-button" onClick={handleViewDemo}>
                View Demo
                <Zap className="button-icon" />
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="card-header">
                <div className="card-icon">
                  <Shield size={24} />
                </div>
                <span>Zero-Knowledge Proof</span>
              </div>
              <div className="card-content">
                <div className="proof-item">
                  <CheckCircle size={16} className="check-icon" />
                  <span>Medical Procedure Verified</span>
                </div>
                <div className="proof-item">
                  <CheckCircle size={16} className="check-icon" />
                  <span>Patient Privacy Protected</span>
                </div>
                <div className="proof-item">
                  <CheckCircle size={16} className="check-icon" />
                  <span>Insurance Claim Validated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive App Section */}
      {showApp && (
        <section id="zkclaim-app" className="app-section">
          <div className="container">
            <WagmiProvider config={config}>
              <QueryClientProvider client={queryClient}>
                <ZKClaimApp />
              </QueryClientProvider>
            </WagmiProvider>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose ZKClaim?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Privacy First</h3>
              <p>Prove medical procedures without revealing sensitive patient data using advanced zero-knowledge cryptography.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Zap />
              </div>
              <h3>Instant Verification</h3>
              <p>Generate and verify proofs in seconds with our optimized circom circuits and zkVerify integration.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Eye />
              </div>
              <h3>Transparent Process</h3>
              <p>All verifications are recorded on-chain while maintaining complete privacy of medical information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How ZKClaim Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Doctor Creates Proof</h3>
                <p>Doctor generates a zero-knowledge proof of the medical procedure using procedure code, doctor ID, and date.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Patient Submits Claim</h3>
                <p>Patient creates their own proof linking to the doctor's proof with claim amount and policy details.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>zkVerify Validation</h3>
                <p>Both proofs are verified and aggregated on zkVerify blockchain, ensuring validity without revealing data.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Cross-Chain Settlement</h3>
                <p>Aggregated proofs are published to external chains for insurance claim processing and settlement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="demo">
        <div className="container">
          <div className="demo-content">
            <h2 className="section-title">Ready to Experience ZKClaim?</h2>
            <p className="demo-description">
              Try our interactive demo to see how zero-knowledge proofs work in healthcare claims processing.
            </p>
            <div className="demo-stats">
              <div className="stat">
                <div className="stat-number">100%</div>
                <div className="stat-label">Privacy Preserved</div>
              </div>
              <div className="stat">
                <div className="stat-number">&lt;5s</div>
                <div className="stat-label">Proof Generation</div>
              </div>
              <div className="stat">
                <div className="stat-number">∞</div>
                <div className="stat-label">Verifications</div>
              </div>
            </div>
            <button className="demo-button" onClick={handleLaunchApp}>
              Launch Interactive Demo
              <ArrowRight className="button-icon" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Shield className="footer-logo" />
              <span className="footer-title">ZKClaim</span>
              <p className="footer-description">
                Privacy-preserving healthcare claims with zero-knowledge proofs
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#demo">Demo</a>
                <a href="#docs">Documentation</a>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#team">Team</a>
                <a href="#careers">Careers</a>
              </div>
              <div className="footer-section">
                <h4>Connect</h4>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <Github size={20} />
                  </a>
                  <a href="#" className="social-link">
                    <Twitter size={20} />
                  </a>
                  <a href="#" className="social-link">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 ZKClaim. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
