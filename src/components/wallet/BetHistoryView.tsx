import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { apiClient } from '../../services/apiClient.ts';

interface BetHistoryViewProps {
  onBack: () => void;
}

interface TicketData {
  id: string;
  cartelaId: number;
  cardMatrix: Array<{
    col: number;
    row: number;
    val: number | string;
    index: number;
    isFree: boolean;
    colLetter?: string;
  }>;
  betAmount: number;
  isWinner: boolean;
  status: string;
}

interface RoundHistoryItem {
  roundId: string;
  roomId: string;
  roomName: string;
  roundNumber: number;
  phase: string;
  totalPot: number;
  winnerPayout: number;
  winnerNames: string[];
  winnerCartelas: number[];
  winnerUserIds: string[];
  drawnNumbers: number[];
  endedAt: string | null;
  betTime: string;
  totalStake: number;
  isWinner: boolean;
  userWonAmount: number;
  netPnl: number;
  tickets: TicketData[];
}

interface HistorySummary {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalStaked: number;
  totalWon: number;
  netProfit: number;
}

export const BetHistoryView: React.FC<BetHistoryViewProps> = ({ onBack }) => {
  const { t, lang } = useLanguage();
  const { switchPage } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<HistorySummary>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalStaked: 0,
    totalWon: 0,
    netProfit: 0,
  });
  const [rounds, setRounds] = useState<RoundHistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.wallet.getGameHistory();
      if (data && data.success) {
        setSummary(data.summary);
        setRounds(data.rounds || []);
      }
    } catch (err) {
      console.warn('Could not fetch bet history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredRounds = rounds.filter(r => {
    if (filter === 'wins') return r.isWinner;
    if (filter === 'losses') return !r.isWinner;
    return true;
  });

  const toggleExpand = (roundId: string, firstTicketId?: string) => {
    if (expandedRoundId === roundId) {
      setExpandedRoundId(null);
      setSelectedTicketId(null);
    } else {
      setExpandedRoundId(roundId);
      if (firstTicketId) {
        setSelectedTicketId(firstTicketId);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'am' ? 'am-ET' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fresh-tx-history-container bet-history-container">
      {/* 1. Top Navigation Bar */}
      <div className="tx-history-top-navbar">
        <button type="button" className="btn-tx-back" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          <span>{t('history.backToWallet')}</span>
        </button>
        <h2 className="tx-page-title">{t('wallet.betHistory')}</h2>
        <button 
          type="button" 
          className="btn-refresh-history" 
          onClick={fetchHistory}
          disabled={isLoading}
          title="Refresh"
        >
          <i className={`fa-solid fa-rotate-right ${isLoading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {/* 2. Hero Performance Summary Card */}
      <div className="bet-history-hero-card">
        <div className="hero-winrate-section">
          <div className="winrate-circle-badge">
            <span className="winrate-percent-num">{summary.winRate}%</span>
            <span className="winrate-percent-lbl">{t('history.winRate')}</span>
          </div>
          <div className="hero-main-stats">
            <div className="hero-profit-badge" style={{ color: summary.netProfit >= 0 ? '#10b981' : '#f43f5e' }}>
              <i className={summary.netProfit >= 0 ? 'fa-solid fa-chart-line' : 'fa-solid fa-chart-line-down'}></i>
              <span>{summary.netProfit >= 0 ? '+' : ''}{summary.netProfit.toFixed(2)} ETB</span>
              <small className="profit-subtext">{t('history.netProfit')}</small>
            </div>
            <div className="hero-games-record">
              <span>{summary.totalGames} {t('history.gamesPlayed')}</span>
              <span className="record-divider">•</span>
              <span className="record-wins">{summary.totalWins}W</span>
              <span className="record-divider">/</span>
              <span className="record-losses">{summary.totalLosses}L</span>
            </div>
          </div>
        </div>

        <div className="hero-secondary-stats-row">
          <div className="secondary-stat-pill">
            <span className="sec-stat-label">{t('history.totalStaked')}</span>
            <strong className="sec-stat-val">{summary.totalStaked.toFixed(2)} ETB</strong>
          </div>
          <div className="secondary-stat-pill">
            <span className="sec-stat-label">{t('history.totalWon')}</span>
            <strong className="sec-stat-val text-emerald">+{summary.totalWon.toFixed(2)} ETB</strong>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills Bar */}
      <div className="bet-history-filters-bar">
        <button
          type="button"
          className={`bet-filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>{t('history.all')}</span>
          <span className="filter-count-badge">{rounds.length}</span>
        </button>
        <button
          type="button"
          className={`bet-filter-pill ${filter === 'wins' ? 'active wins' : ''}`}
          onClick={() => setFilter('wins')}
        >
          <span>{t('history.wins')}</span>
          <span className="filter-count-badge">{summary.totalWins}</span>
        </button>
        <button
          type="button"
          className={`bet-filter-pill ${filter === 'losses' ? 'active losses' : ''}`}
          onClick={() => setFilter('losses')}
        >
          <span>{t('history.losses')}</span>
          <span className="filter-count-badge">{summary.totalLosses}</span>
        </button>
      </div>

      {/* 4. Rounds History List */}
      <div className="bet-history-rounds-list">
        {isLoading && rounds.length === 0 ? (
          <div className="tx-history-empty-card">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <p className="empty-subtext">Loading your game records...</p>
          </div>
        ) : filteredRounds.length === 0 ? (
          <div className="tx-history-empty-card">
            <div className="empty-icon-circle gold">
              <i className="fa-solid fa-dice"></i>
            </div>
            <h3 className="empty-title">{t('history.noHistory')}</h3>
            <p className="empty-subtext">
              {lang === 'am'
                ? 'በክፍሎቻችን የቀጥታ 75-ኳስ ቢንጎ በመጫወት እዚህ ያሸነፉትን እና የተጣራ ትርፍዎን ይከታተሉ!'
                : 'Play live 75-ball express bingo in any room to audit your games, cartelas, and profit!'}
            </p>
            <button
              type="button"
              className="btn-play-empty-cta"
              onClick={() => switchPage('games')}
            >
              <i className="fa-solid fa-play"></i>
              <span>{lang === 'am' ? 'ቢንጎ አሁን ተጫወት' : 'Play Live Bingo Now'}</span>
            </button>
          </div>
        ) : (
          filteredRounds.map(round => {
            const isExpanded = expandedRoundId === round.roundId;
            const userTickets = round.tickets || [];
            const selectedTicket = userTickets.find(t => t.id === selectedTicketId) || userTickets[0];

            return (
              <div 
                key={round.roundId} 
                className={`bet-round-card ${round.isWinner ? 'won' : 'lost'} ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Round Header */}
                <div className="round-card-top-row">
                  <div className="round-room-badge-group">
                    <span className="round-room-tag">
                      <i className="fa-solid fa-gamepad"></i> {round.roomName}
                    </span>
                    <span className="round-number-tag">
                      {t('history.round')} #{round.roundNumber}
                    </span>
                  </div>

                  <div className={`round-outcome-pill ${round.isWinner ? 'won' : 'lost'}`}>
                    {round.isWinner ? (
                      <>
                        <i className="fa-solid fa-trophy"></i>
                        <span>{t('history.won')} +{round.userWonAmount.toFixed(2)} ETB</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-xmark"></i>
                        <span>{t('history.lost')} -{round.totalStake.toFixed(2)} ETB</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Round Meta Row */}
                <div className="round-meta-row">
                  <div className="round-meta-item">
                    <i className="fa-regular fa-clock"></i>
                    <span>{formatDate(round.betTime)}</span>
                  </div>
                  <div className="round-meta-item">
                    <i className="fa-solid fa-sack-dollar"></i>
                    <span>{t('history.pot')}: <strong>{round.totalPot.toFixed(2)} ETB</strong></span>
                  </div>
                  {round.winnerNames && round.winnerNames.length > 0 && (
                    <div className="round-meta-item winner-item">
                      <i className="fa-solid fa-crown text-gold"></i>
                      <span>{t('history.winner')}: {round.winnerNames.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Cartelas Selection Pills Row */}
                <div className="round-cartelas-row">
                  <span className="cartelas-label">{t('history.cartelas')}:</span>
                  <div className="cartelas-pills-wrap">
                    {userTickets.map(ticket => {
                      const isWinningCartela = ticket.isWinner || round.winnerCartelas.includes(ticket.cartelaId);
                      const isSelected = selectedTicket?.id === ticket.id;

                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          className={`cartela-pill ${isWinningCartela ? 'winner' : ''} ${isSelected && isExpanded ? 'selected' : ''}`}
                          onClick={() => {
                            if (!isExpanded) {
                              setExpandedRoundId(round.roundId);
                            }
                            setSelectedTicketId(ticket.id);
                          }}
                        >
                          {isWinningCartela && <i className="fa-solid fa-crown text-gold"></i>}
                          <span>#{ticket.cartelaId}</span>
                          <small className="cartela-bet-stake">({ticket.betAmount} ETB)</small>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn-toggle-inspector"
                    onClick={() => toggleExpand(round.roundId, userTickets[0]?.id)}
                  >
                    <span>{isExpanded ? t('history.hideCartela') : t('history.viewCartela')}</span>
                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>
                </div>

                {/* Expandable 5x5 Cartela Inspector */}
                {isExpanded && selectedTicket && (
                  <div className="round-cartela-inspector-panel">
                    <div className="inspector-header">
                      <div className="inspector-title">
                        <i className="fa-solid fa-table-cells"></i>
                        <span>Cartela #{selectedTicket.cartelaId}</span>
                        {selectedTicket.isWinner && (
                          <span className="winning-badge">🏆 {lang === 'am' ? 'አሸናፊ ካርቴላ' : 'Winning Card'}</span>
                        )}
                      </div>
                      <span className="inspector-stake">{selectedTicket.betAmount} ETB Stake</span>
                    </div>

                    {/* 5x5 Mini Matrix Grid */}
                    <div className="inspector-grid-5x5">
                      <div className="grid-col-header col-b">B</div>
                      <div className="grid-col-header col-i">I</div>
                      <div className="grid-col-header col-n">N</div>
                      <div className="grid-col-header col-g">G</div>
                      <div className="grid-col-header col-o">O</div>

                      {Array.isArray(selectedTicket.cardMatrix) && selectedTicket.cardMatrix.map((cell, idx) => {
                        const isFree = cell.isFree || cell.val === 'FREE';
                        const val = cell.val;
                        const numVal = typeof val === 'number' ? val : parseInt(val as string, 10);
                        const isDrawn = !isNaN(numVal) && round.drawnNumbers.includes(numVal);
                        const isHighlight = isFree || (selectedTicket.isWinner && isDrawn);

                        return (
                          <div 
                            key={idx} 
                            className={`inspector-cell ${isFree ? 'cell-free' : ''} ${isDrawn ? 'cell-drawn' : ''} ${isHighlight ? 'cell-highlight' : ''}`}
                          >
                            {isFree ? (
                              <i className="fa-solid fa-star text-gold"></i>
                            ) : (
                              <span>{cell.val}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
