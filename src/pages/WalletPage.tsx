import React, { useState } from 'react';
import { ProfileHeader } from '../components/wallet/ProfileHeader.tsx';
import { BalanceCard } from '../components/wallet/BalanceCard.tsx';
import { DailyTimer } from '../components/wallet/DailyTimer.tsx';
import { TransactionHistory } from '../components/wallet/TransactionHistory.tsx';
import { WalletMenu } from '../components/wallet/WalletMenu.tsx';

export const WalletPage: React.FC = () => {
  const [activeHistoryTab, setActiveHistoryTab] = useState<'deposits' | 'withdrawals' | null>(null);

  return (
    <div className="page active" id="page-wallet" style={{ paddingBottom: '30px' }}>
      <ProfileHeader />

      {activeHistoryTab !== null ? (
        /* Dedicated Transaction History View (Opened on Click) */
        <TransactionHistory
          initialTab={activeHistoryTab}
          onBack={() => setActiveHistoryTab(null)}
        />
      ) : (
        /* Clean Main Wallet Overview */
        <>
          <BalanceCard />
          <DailyTimer />
          <WalletMenu onOpenHistory={tab => setActiveHistoryTab(tab)} />
        </>
      )}
    </div>
  );
};
