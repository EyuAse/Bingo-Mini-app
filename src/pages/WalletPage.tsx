import React from 'react';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';
import { BalanceCard } from '../components/wallet/BalanceCard.tsx';
import { DailyTimer } from '../components/wallet/DailyTimer.tsx';
import { TransactionHistory } from '../components/wallet/TransactionHistory.tsx';
import { WalletMenu } from '../components/wallet/WalletMenu.tsx';

export const WalletPage: React.FC = () => {
  return (
    <div className="page active" id="page-wallet" style={{ paddingBottom: '30px' }}>
      <ProfileHeader />
      <BalanceCard />
      <DailyTimer />
      <TransactionHistory />
      <WalletMenu />
    </div>
  );
};
