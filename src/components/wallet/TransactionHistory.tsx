import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { TelebirrLogo, CBELogo } from './PaymentLogos.tsx';

import { apiClient } from '../../services/apiClient.ts';

interface TransactionHistoryProps {
  initialTab?: 'deposits' | 'withdrawals';
  onBack?: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  initialTab = 'deposits',
  onBack
}) => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>(initialTab);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = React.useCallback(async () => {
    try {
      const data = await apiClient.wallet.getTransactions();
      if (data && Array.isArray(data.transactions)) {
        setLiveTransactions(data.transactions);
      }
    } catch (err) {
      console.warn('Could not fetch player transactions:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const deposits = liveTransactions.filter(tx => tx.type === 'deposit');
  const withdrawals = liveTransactions.filter(tx => tx.type === 'withdrawal');
  const activeList = activeTab === 'deposits' ? deposits : withdrawals;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 ${t('common.copied')}: ${label}`);
  };

  return (
    <div className="fresh-tx-history-container">
      {/* 1. Top Navigation Bar */}
      <div className="tx-history-top-navbar">
        {onBack && (
          <button type="button" className="btn-tx-back" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>{t('history.backToWallet')}</span>
          </button>
        )}
        <h2 className="tx-page-title">
          {activeTab === 'deposits' ? t('history.depositsTab') : t('history.withdrawalsTab')}
        </h2>
      </div>

      {/* 2. Modern 2-Tab Switcher Bar */}
      <div className="tx-segmented-tabs-bar">
        <button
          type="button"
          className={`tx-segment-tab ${activeTab === 'deposits' ? 'active green' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          <i className="fa-solid fa-arrow-down"></i>
          <span>{t('history.depositsTab')}</span>
          <span className="tx-count-pill">{deposits.length}</span>
        </button>

        <button
          type="button"
          className={`tx-segment-tab ${activeTab === 'withdrawals' ? 'active red' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <i className="fa-solid fa-arrow-up"></i>
          <span>{t('history.withdrawalsTab')}</span>
          <span className="tx-count-pill">{withdrawals.length}</span>
        </button>
      </div>

      {/* 3. Transaction Cards List */}
      <div className="tx-history-cards-list">
        {activeList.length === 0 ? (
          <div className="tx-history-empty-card">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <h3 className="empty-title">
              {activeTab === 'deposits' ? t('history.emptyDeposits') : t('history.emptyWithdrawals')}
            </h3>
            <p className="empty-subtext">
              {lang === 'am' ? 'የእርስዎ የግብይት እና የክፍያ ታሪክ እዚህ በእውነተኛ ጊዜ ይታያል።' : 'Your transactions and live settlement status will appear here in real time.'}
            </p>
          </div>
        ) : (
          activeList.map(tx => {
            const isDeposit = tx.type === 'deposit';
            const isPending = tx.status === 'pending';
            const isApproved = tx.status === 'approved';
            const isRejected = tx.status === 'rejected';

            return (
              <div key={tx.id} className={`fresh-tx-card status-${tx.status || 'pending'}`}>
                {/* Header Row: Provider Logo & Live Status Pill */}
                <div className="tx-card-header-row">
                  <div className="tx-provider-group">
                    <div className="tx-provider-logo-box">
                      {tx.method === 'Telebirr' ? <TelebirrLogo size={24} /> : <CBELogo size={24} />}
                    </div>
                    <div className="tx-provider-meta">
                      <strong className="tx-provider-name">{tx.method}</strong>
                      <span className="tx-type-lbl">
                        {isDeposit ? t('common.deposit') : t('common.withdraw')}
                      </span>
                    </div>
                  </div>

                  <div className="tx-status-badge-wrap">
                    {isPending && (
                      <span className="status-pill pending">
                        <span className="pulse-dot"></span>
                        <span>{lang === 'am' ? 'በመገምገም ላይ' : 'In Review'}</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="status-pill approved">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{isDeposit ? (lang === 'am' ? 'ተረጋግጧል' : 'Verified') : (lang === 'am' ? 'ተከፍሏል' : 'Settled')}</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="status-pill rejected">
                        <i className="fa-solid fa-circle-xmark"></i>
                        <span>{lang === 'am' ? 'ተቀባይነት አላገኘም' : 'Rejected'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Time Row */}
                <div className="tx-card-body-row">
                  <div className="tx-time-ref-col">
                    <div className="tx-ref-row">
                      <span className="tx-ref-txt">{tx.referenceNumber}</span>
                      <button
                        type="button"
                        className="btn-copy-ref-mini"
                        onClick={() => handleCopy(tx.referenceNumber, 'TX Reference')}
                        title="Copy Reference"
                      >
                        <i className="fa-regular fa-copy"></i>
                      </button>
                    </div>
                    <div className="tx-timestamp">
                      <i className="fa-regular fa-clock"></i>
                      <span>{tx.createdAt || (lang === 'am' ? 'ዛሬ፣ 11:33' : 'Today, 11:33 PM')}</span>
                    </div>
                  </div>

                  <div className={`tx-amount-huge ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                    {isDeposit ? '+' : '-'}{(Number(tx.amount) || 0).toFixed(2)} ETB
                  </div>
                </div>

                {/* Attached Screenshot (if any) */}
                {tx.receiptImage && (
                  <div className="tx-receipt-thumbnail-row">
                    <span className="receipt-tag-label">
                      <i className="fa-solid fa-image"></i> {lang === 'am' ? 'የክፍያ ደረሰኝ ምስል' : 'Payment Screenshot'}
                    </span>
                    <img
                      src={tx.receiptImage}
                      alt="Receipt Thumbnail"
                      className="tx-receipt-thumb"
                      onClick={() => setZoomImage(tx.receiptImage || null)}
                      title="Click to view screenshot"
                    />
                  </div>
                )}

                {/* Cashier Note */}
                {tx.adminNote && (
                  <div className={`tx-cashier-note-box ${isRejected ? 'note-rejected' : 'note-approved'}`}>
                    <i className={`fa-solid ${isRejected ? 'fa-circle-exclamation' : 'fa-circle-info'} note-icon`}></i>
                    <div className="note-text-group">
                      <strong className="note-title">
                        {isRejected ? (lang === 'am' ? 'የውድቅ የተደረገበት ምክንያት፡' : 'Cashier Rejection Reason:') : (lang === 'am' ? 'የካሳ ማስታወሻ፡' : 'Cashier Note:')}
                      </strong>
                      <p className="note-message">{tx.adminNote}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Full-Screen Receipt Lightbox Modal */}
      {zoomImage && (
        <div className="custom-modal-backdrop" onClick={() => setZoomImage(null)}>
          <div className="receipt-lightbox-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-fresh">
              <h4>{lang === 'am' ? 'የተያያዘ የክፍያ ምስል' : 'Attached Screenshot'}</h4>
              <button
                type="button"
                className="btn-close-modal-round"
                onClick={() => setZoomImage(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="lightbox-img-wrap">
              <img src={zoomImage} alt="Full Receipt" className="lightbox-full-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
