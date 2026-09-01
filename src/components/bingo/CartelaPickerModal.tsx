import React, { useState } from 'react';
import { useBingo } from '../../context/BingoContext.tsx';

export const CartelaPickerModal: React.FC = () => {
  const {
    isCartelaPickerOpen,
    closeCartelaPicker,
    selectedCartelaIds,
    chooseCartelaId,
    totalPlayableCards
  } = useBingo();

  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isCartelaPickerOpen) return null;

  // Filter 1 to 400 Cartelas
  const allCartelaNumbers = Array.from({ length: 400 }, (_, i) => i + 1);
  const filtered = allCartelaNumbers.filter(num => {
    if (!searchTerm) return true;
    return String(num).includes(searchTerm) || `LB-${String(num).padStart(4, '0')}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleRandomize = () => {
    const r1 = Math.floor(1 + Math.random() * 120);
    const r2 = Math.floor(121 + Math.random() * 140);
    const r3 = Math.floor(261 + Math.random() * 135);
    chooseCartelaId(0, r1);
    chooseCartelaId(1, r2);
    chooseCartelaId(2, r3);
  };

  return (
    <div className="cartela-picker-overlay" onClick={closeCartelaPicker}>
      <div className="cartela-picker-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cartela-picker-header">
          <div>
            <h3 className="cartela-picker-title">
              <i className="fa-solid fa-ticket gold" style={{ marginRight: 6 }}></i>
              Choose From 400 Cartelas
            </h3>
            <p className="cartela-picker-sub">Pick your favorite lucky Cartela numbers</p>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={closeCartelaPicker}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Card Slot Selector Tabs (Card 1, Card 2, Card 3 Bonus) */}
        <div className="picker-slot-tabs-row">
          <button
            type="button"
            className={`btn-slot-tab ${activeSlot === 0 ? 'active' : ''}`}
            onClick={() => setActiveSlot(0)}
          >
            <span>Card 1</span>
            <strong className="slot-id-badge">#{selectedCartelaIds[0]}</strong>
          </button>

          {totalPlayableCards >= 2 && (
            <button
              type="button"
              className={`btn-slot-tab ${activeSlot === 1 ? 'active' : ''}`}
              onClick={() => setActiveSlot(1)}
            >
              <span>Card 2</span>
              <strong className="slot-id-badge">#{selectedCartelaIds[1]}</strong>
            </button>
          )}

          {totalPlayableCards >= 3 && (
            <button
              type="button"
              className={`btn-slot-tab bonus ${activeSlot === 2 ? 'active' : ''}`}
              onClick={() => setActiveSlot(2)}
            >
              <span>Card 3 🎁</span>
              <strong className="slot-id-badge gold">#{selectedCartelaIds[2]}</strong>
            </button>
          )}
        </div>

        {/* Search & Quick Pick Bar */}
        <div className="picker-search-bar-row">
          <div className="picker-search-input-wrap">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="number"
              min="1"
              max="400"
              placeholder="Search # 1 - 400..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="picker-search-input"
            />
          </div>
          <button
            type="button"
            className="btn-picker-randomize"
            onClick={handleRandomize}
            title="Randomize all cards"
          >
            <i className="fa-solid fa-shuffle"></i>
            <span>Random</span>
          </button>
        </div>

        {/* 400 Grid */}
        <div className="picker-400-grid-container">
          {filtered.map(num => {
            const isSelectedThisSlot = selectedCartelaIds[activeSlot] === num;
            const isSelectedOtherSlot = selectedCartelaIds.includes(num) && !isSelectedThisSlot;

            return (
              <button
                key={num}
                type="button"
                className={`picker-num-cell ${isSelectedThisSlot ? 'active-slot' : ''} ${isSelectedOtherSlot ? 'other-slot' : ''}`}
                onClick={() => {
                  chooseCartelaId(activeSlot, num);
                  if (activeSlot < totalPlayableCards - 1) {
                    setActiveSlot(activeSlot + 1);
                  }
                }}
              >
                <span className="picker-num-val">#{num}</span>
                <span className="picker-serial-tiny">LB-{String(num).padStart(4, '0')}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Confirm */}
        <div className="picker-footer-bar">
          <div className="picker-summary-txt">
            Playing: <strong>#{selectedCartelaIds[0]}</strong>
            {totalPlayableCards >= 2 && <>, <strong>#{selectedCartelaIds[1]}</strong></>}
            {totalPlayableCards >= 3 && <>, <strong className="gold">#{selectedCartelaIds[2]} (BONUS)</strong></>}
          </div>
          <button
            type="button"
            className="btn-picker-confirm-gold"
            onClick={closeCartelaPicker}
          >
            <i className="fa-solid fa-check"></i>
            <span>Confirm Cartelas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
