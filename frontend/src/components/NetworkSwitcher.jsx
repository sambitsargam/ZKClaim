import React from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, Wifi, ExternalLink } from 'lucide-react';
import { SUPPORTED_CHAIN_IDS, CHAIN_NAMES } from '../config/contracts';
import './NetworkSwitcher.css';

const NetworkSwitcher = () => {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  
  const isSupported = SUPPORTED_CHAIN_IDS.includes(chainId);
  
  if (isSupported) {
    return (
      <div className="network-status supported">
        <Wifi size={16} />
        <span>{CHAIN_NAMES[chainId] || `Chain ${chainId}`}</span>
      </div>
    );
  }
  
  const handleSwitchNetwork = async (targetChainId) => {
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Handle error (e.g., user rejected or network not added to MetaMask)
    }
  };
  
  return (
    <div className="network-switcher-container">
      <div className="network-switcher">
        <div className="network-warning">
          <AlertTriangle size={24} />
          <div>
            <h3>Unsupported Network</h3>
            <p>
              You're currently connected to {chainId === 1 ? 'Ethereum Mainnet' : `Chain ${chainId}`}.
              ZKClaim requires one of the supported test networks.
            </p>
          </div>
        </div>
        
        <div className="network-options">
          <h4>Switch to a supported network:</h4>
          <div className="network-buttons">
            {SUPPORTED_CHAIN_IDS.map(supportedChainId => (
              <button
                key={supportedChainId}
                className="network-button"
                onClick={() => handleSwitchNetwork(supportedChainId)}
                disabled={isPending}
              >
                <div className="network-info">
                  <span className="network-name">
                    {CHAIN_NAMES[supportedChainId]}
                  </span>
                  <span className="network-id">
                    Chain ID: {supportedChainId}
                  </span>
                </div>
                <ExternalLink size={16} />
              </button>
            ))}
          </div>
          
          <div className="network-help">
            <h5>Need help adding these networks?</h5>
            <p>
              If the network switch fails, you may need to manually add the network to your wallet.
              Check the documentation for network configuration details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkSwitcher;
