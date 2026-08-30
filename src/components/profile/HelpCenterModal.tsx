import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'deposit' | 'withdraw' | 'bingo' | 'affiliate' | 'security';
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [activeFaqId, setActiveFaqId] = useState<string | null>('faq-1');

  if (!isOpen) return null;

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'deposit',
      question: 'How do I deposit funds via Telebirr or CBE?',
      answer:
        'Tap "+ Deposit" in the top bar or Wallet page. Choose Telebirr or CBE Bank, copy our official cashier account number, transfer the exact amount from your banking app, and paste the SMS confirmation reference ID. Deposits are verified and credited within ~30 seconds.'
    },
    {
      id: 'faq-2',
      category: 'withdraw',
      question: 'How long do withdrawals take to settle?',
      answer:
        'Withdrawals are processed 24/7 by our automated settlement desk. Telebirr cashouts typically arrive in 1–3 minutes, while CBE Bank transfers arrive within 5–15 minutes. There are zero withdrawal fees.'
    },
    {
      id: 'faq-3',
      category: 'bingo',
      question: 'How does 75-Ball Fast Express Bingo work?',
      answer:
        'Each round draws numbers from 1 to 75. Your 5x5 Cartela has 24 numbers and 1 center FREE star. Complete any horizontal, vertical, or diagonal 5-in-a-row line or four corners, then hit the pulsing BINGO button to claim the round prize pool!'
    },
    {
      id: 'faq-4',
      category: 'affiliate',
      question: 'How does the 10% Referral Affiliate Bonus work?',
      answer:
        'Share your exclusive referral link or code with friends. Whenever a friend registers and makes their first deposit, you receive an instant 10% cash bonus directly into your bonus balance, with zero wager requirements!'
    },
    {
      id: 'faq-5',
      category: 'security',
      question: 'Are my wallet balance and transactions safe?',
      answer:
        'Yes. Lomii Bingo is licensed and regulated by the National Lottery Administration of Ethiopia (NLA). All games utilize certified cryptographic Random Number Generation (RNG), and funds are secured in segregated Ethiopian escrow accounts.'
    }
  ];

  const handleOpenTelegramSupport = () => {
    window.open('https://t.me/LomiBingoBot', '_blank');
  };

  const handleOpenCommunity = () => {
    window.open('https://t.me/LomiBingoBot', '_blank');
  };

  const toggleFaq = (id: string) => {
    setActiveFaqId(prev => (prev === id ? null : id));
  };

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="fresh-payment-modal-card help-center-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-title-group">
            <div className="modal-title-icon green">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div className="modal-title-texts">
              <h3 className="modal-heading">Help Center</h3>
              <span className="modal-subheading">24/7 Customer Support & Guides</span>
            </div>
          </div>

          <button type="button" className="btn-modal-close" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="help-center-scroll-body">
          {/* Top 24/7 Live Support Banner */}
          <div className="support-hero-banner">
            <div className="support-hero-icon-wrap">
              <i className="fa-brands fa-telegram telegram-big-icon"></i>
            </div>
            <div className="support-hero-text-col">
              <strong className="support-hero-title">Live Agent Support</strong>
              <span className="support-hero-sub">Average response time: <strong>&lt; 1 minute</strong></span>
            </div>
            <button
              type="button"
              className="btn-chat-live-telegram"
              onClick={handleOpenTelegramSupport}
            >
              <span>Chat Now</span>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          {/* Quick Contact Hotlines Strip */}
          <div className="contact-channels-grid">
            <div
              className="channel-contact-card"
              onClick={() => {
                navigator.clipboard.writeText('+251911000000');
                showToast('📋 Copied Hotline: +251 911 000000');
              }}
            >
              <i className="fa-solid fa-phone-volume channel-icon gold"></i>
              <div className="channel-txt-col">
                <span className="channel-lbl">Phone Hotline</span>
                <strong className="channel-val">+251 911 00 00 00</strong>
              </div>
            </div>

            <div
              className="channel-contact-card"
              onClick={() => {
                navigator.clipboard.writeText('support@lomibingo.com');
                showToast('📋 Copied Email: support@lomibingo.com');
              }}
            >
              <i className="fa-regular fa-envelope channel-icon blue"></i>
              <div className="channel-txt-col">
                <span className="channel-lbl">Email Helpdesk</span>
                <strong className="channel-val">support@lomibingo.com</strong>
              </div>
            </div>
          </div>

          {/* Official Community Banner */}
          <div className="community-channel-card" onClick={handleOpenCommunity}>
            <div className="community-left-col">
              <i className="fa-solid fa-users community-icon"></i>
              <div>
                <strong className="community-title">Official Telegram Community</strong>
                <span className="community-sub">100,000+ players • Daily promo codes & tournaments</span>
              </div>
            </div>
            <i className="fa-solid fa-arrow-up-right-from-square community-ext-icon"></i>
          </div>

          {/* Frequently Asked Questions */}
          <div className="faqs-section-wrap">
            <span className="faqs-heading-title">
              <i className="fa-solid fa-circle-question gold"></i> FREQUENTLY ASKED QUESTIONS
            </span>

            <div className="faqs-accordion-list">
              {faqs.map(faq => {
                const isOpen = activeFaqId === faq.id;
                return (
                  <div key={faq.id} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <span className="faq-q-text">{faq.question}</span>
                      <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} faq-chevron`}></i>
                    </button>

                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button type="button" className="btn-submit-payment-gold" onClick={onClose}>
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
