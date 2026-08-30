import React from 'react';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';
import { BalanceCard } from '../components/wallet/BalanceCard.tsx';
import { DailyTimer } from '../components/wallet/DailyTimer.tsx';
import { WalletMenu } from '../components/wallet/WalletMenu.tsx';

export const WalletPage: React.FC = () => {
  return (
    <div className="page active" id="page-wallet">
      <ProfileHeader />
      <BalanceCard />
      <DailyTimer />
      <WalletMenu />
    </div>
  );
};
