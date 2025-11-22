
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { StorageService } from '../services/storageService';

// Mock dependencies
jest.mock('../services/storageService', () => ({
  StorageService: {
    getUser: jest.fn(),
    saveUser: jest.fn(),
    logout: jest.fn(),
    getAssets: jest.fn(),
    saveAssets: jest.fn(),
    addTransaction: jest.fn(),
    getTransactions: jest.fn(),
    removeAsset: jest.fn(),
    addAsset: jest.fn(),
    switchWallet: jest.fn(),
    addWallet: jest.fn(),
  }
}));

// Mock child components
jest.mock('../component/AIChat', () => () => <div data-testid="aichat">AIChat</div>);
jest.mock('../component/Dashboard', () => ({ onSend }: any) => (
  <div>
    Dashboard
    <button onClick={onSend}>Send</button>
  </div>
));
jest.mock('../component/SendModal', () => ({ isOpen, onSend, assets }: any) => {
  if (!isOpen) return null;
  return (
    <div>
      SendModal
      <button onClick={() => onSend(assets[0].id, 10, '0x123')}>Confirm Send 10</button>
      <button onClick={() => onSend(assets[0].id, 1000, '0x123')}>Confirm Send 1000</button>
    </div>
  );
});
jest.mock('../component/PortfolioAnalytics', () => () => <div>PortfolioAnalytics</div>);
jest.mock('../component/LearningHub', () => () => <div>LearningHub</div>);
jest.mock('../component/AuthScreen', () => () => <div>AuthScreen</div>);
jest.mock('../component/AddAssetModal', () => () => <div>AddAssetModal</div>);
jest.mock('../component/ReceiveModal', () => () => <div>ReceiveModal</div>);
jest.mock('../component/WalletManagerModal', () => () => <div>WalletManagerModal</div>);
jest.mock('../component/WalletConnectModal', () => () => <div>WalletConnectModal</div>);
jest.mock('../component/SwapView', () => () => <div>SwapView</div>);
jest.mock('../component/DAppsView', () => () => <div>DAppsView</div>);
jest.mock('../component/SettingsView', () => () => <div>SettingsView</div>);
jest.mock('../component/EarnView', () => () => <div>EarnView</div>);

// Mock window.alert
window.alert = jest.fn();

describe('App Component', () => {
  const mockUser = {
    id: 'user1',
    activeWalletId: 'wallet1',
    language: 'en',
    wallets: [{ id: 'wallet1', name: 'Wallet 1' }]
  };

  const mockAssets = [
    {
      id: 'asset1',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: 100,
      price: 2000,
      networkId: 'eth-mainnet'
    }
  ];

  beforeEach(() => {
    (StorageService.getUser as jest.Mock).mockReturnValue(mockUser);
    (StorageService.getAssets as jest.Mock).mockReturnValue(mockAssets);
    (StorageService.getTransactions as jest.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('does NOT allow sending an amount greater than balance', async () => {
    render(<App />);

    // Open Send Modal
    fireEvent.click(screen.getByText('Send'));

    // Try to send 1000, which is more than balance (100)
    fireEvent.click(screen.getByText('Confirm Send 1000'));

    // Expect assets NOT to be updated
    expect(StorageService.saveAssets).not.toHaveBeenCalled();

    // Expect alert to be called
    expect(window.alert).toHaveBeenCalledWith('Solde insuffisant');
  });

  test('allows sending an amount less than or equal to balance', async () => {
     render(<App />);

    // Open Send Modal
    fireEvent.click(screen.getByText('Send'));

    // Try to send 10, which is less than balance (100)
    fireEvent.click(screen.getByText('Confirm Send 10'));

    // Expect assets to be updated with new balance
    const expectedAssets = [{
      ...mockAssets[0],
      balance: 90 // 100 - 10
    }];

    expect(StorageService.saveAssets).toHaveBeenCalledWith(expectedAssets);
  });
});
