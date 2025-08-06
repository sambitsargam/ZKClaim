import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, LogOut } from 'lucide-react';
import './ConnectButton.css';

const ConnectButton = ({ className = '' }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  if (isConnected) {
    return (
      <div className={`connect-button connected ${className}`}>
        <span className="address">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()} className="disconnect-btn">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => open()} 
      className={`connect-button ${className}`}
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
};

export default ConnectButton;
