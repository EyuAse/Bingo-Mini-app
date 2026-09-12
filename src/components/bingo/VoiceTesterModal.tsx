import React, { useState } from 'react';
import { soundEngine } from '../../services/soundEngine.ts';
import { useBingo } from '../../context/BingoContext.tsx';

interface VoiceTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BallScriptItem {
  num: number;
  col: string;
  amharic: string;
  english: string;
}

const COLUMN_B_BALLS: BallScriptItem[] = [
  { num: 1, col: 'B', amharic: 'ቢ... አንድ!', english: 'B... One!' },
  { num: 2, col: 'B', amharic: 'ቢ... ሁለት!', english: 'B... Two!' },
  { num: 3, col: 'B', amharic: 'ቢ... ሶስት!', english: 'B... Three!' },
  { num: 4, col: 'B', amharic: 'ቢ... አራት!', english: 'B... Four!' },
  { num: 5, col: 'B', amharic: 'ቢ... አምስት!', english: 'B... Five!' },
  { num: 6, col: 'B', amharic: 'ቢ... ስድስት!', english: 'B... Six!' },
  { num: 7, col: 'B', amharic: 'ቢ... ሰባት!', english: 'B... Seven!' },
  { num: 8, col: 'B', amharic: 'ቢ... ስምንት!', english: 'B... Eight!' },
  { num: 9, col: 'B', amharic: 'ቢ... ዘጠኝ!', english: 'B... Nine!' },
  { num: 10, col: 'B', amharic: 'ቢ... አስር!', english: 'B... Ten!' },
  { num: 11, col: 'B', amharic: 'ቢ... አስራ አንድ!', english: 'B... Eleven!' },
  { num: 12, col: 'B', amharic: 'ቢ... አስራ ሁለት!', english: 'B... Twelve!' },
  { num: 13, col: 'B', amharic: 'ቢ... አስራ ሶስት!', english: 'B... Thirteen!' },
  { num: 14, col: 'B', amharic: 'ቢ... አስራ አራት!', english: 'B... Fourteen!' },
  { num: 15, col: 'B', amharic: 'ቢ... አስራ አምስት!', english: 'B... Fifteen!' }
];

const COLUMN_I_BALLS: BallScriptItem[] = [
  { num: 16, col: 'I', amharic: 'አይ... አስራ ስድስት!', english: 'I... Sixteen!' },
  { num: 17, col: 'I', amharic: 'አይ... አስራ ሰባት!', english: 'I... Seventeen!' },
  { num: 18, col: 'I', amharic: 'አይ... አስራ ስምንት!', english: 'I... Eighteen!' },
  { num: 19, col: 'I', amharic: 'አይ... አስራ ዘጠኝ!', english: 'I... Nineteen!' },
  { num: 20, col: 'I', amharic: 'አይ... ሃያ!', english: 'I... Twenty!' },
  { num: 21, col: 'I', amharic: 'አይ... ሃያ አንድ!', english: 'I... Twenty-One!' },
  { num: 22, col: 'I', amharic: 'አይ... ሃያ ሁለት!', english: 'I... Twenty-Two!' },
  { num: 23, col: 'I', amharic: 'አይ... ሃያ ሶስት!', english: 'I... Twenty-Three!' },
  { num: 24, col: 'I', amharic: 'አይ... ሃያ አራት!', english: 'I... Twenty-Four!' },
  { num: 25, col: 'I', amharic: 'አይ... ሃያ አምስት!', english: 'I... Twenty-Five!' },
  { num: 26, col: 'I', amharic: 'አይ... ሃያ ስድስት!', english: 'I... Twenty-Six!' },
  { num: 27, col: 'I', amharic: 'አይ... ሃያ ሰባት!', english: 'I... Twenty-Seven!' },
  { num: 28, col: 'I', amharic: 'አይ... ሃያ ስምንት!', english: 'I... Twenty-Eight!' },
  { num: 29, col: 'I', amharic: 'አይ... ሃያ ዘጠኝ!', english: 'I... Twenty-Nine!' },
  { num: 30, col: 'I', amharic: 'አይ... ሰላሳ!', english: 'I... Thirty!' }
];

const COLUMN_N_BALLS: BallScriptItem[] = [
  { num: 31, col: 'N', amharic: 'ኤን... ሰላሳ አንድ!', english: 'N... Thirty-One!' },
  { num: 32, col: 'N', amharic: 'ኤን... ሰላሳ ሁለት!', english: 'N... Thirty-Two!' },
  { num: 33, col: 'N', amharic: 'ኤን... ሰላሳ ሶስት!', english: 'N... Thirty-Three!' },
  { num: 34, col: 'N', amharic: 'ኤን... ሰላሳ አራት!', english: 'N... Thirty-Four!' },
  { num: 35, col: 'N', amharic: 'ኤን... ሰላሳ አምስት!', english: 'N... Thirty-Five!' },
  { num: 36, col: 'N', amharic: 'ኤን... ሰላሳ ስድስት!', english: 'N... Thirty-Six!' },
  { num: 37, col: 'N', amharic: 'ኤን... ሰላሳ ሰባት!', english: 'N... Thirty-Seven!' },
  { num: 38, col: 'N', amharic: 'ኤን... ሰላሳ ስምንት!', english: 'N... Thirty-Eight!' },
  { num: 39, col: 'N', amharic: 'ኤን... ሰላሳ ዘጠኝ!', english: 'N... Thirty-Nine!' },
  { num: 40, col: 'N', amharic: 'ኤን... አርባ!', english: 'N... Forty!' },
  { num: 41, col: 'N', amharic: 'ኤን... አርባ አንድ!', english: 'N... Forty-One!' },
  { num: 42, col: 'N', amharic: 'ኤን... አርባ ሁለት!', english: 'N... Forty-Two!' },
  { num: 43, col: 'N', amharic: 'ኤን... አርባ ሶስት!', english: 'N... Forty-Three!' },
  { num: 44, col: 'N', amharic: 'ኤን... አርባ አራት!', english: 'N... Forty-Four!' },
  { num: 45, col: 'N', amharic: 'ኤን... አርባ አምስት!', english: 'N... Forty-Five!' }
];

const COLUMN_G_BALLS: BallScriptItem[] = [
  { num: 46, col: 'G', amharic: 'ጂ... አርባ ስድስት!', english: 'G... Forty-Six!' },
  { num: 47, col: 'G', amharic: 'ጂ... አርባ ሰባት!', english: 'G... Forty-Seven!' },
  { num: 48, col: 'G', amharic: 'ጂ... አርባ ስምንት!', english: 'G... Forty-Eight!' },
  { num: 49, col: 'G', amharic: 'ጂ... አርባ ዘጠኝ!', english: 'G... Forty-Nine!' },
  { num: 50, col: 'G', amharic: 'ጂ... ሃምሳ!', english: 'G... Fifty!' },
  { num: 51, col: 'G', amharic: 'ጂ... ሃምሳ አንድ!', english: 'G... Fifty-One!' },
  { num: 52, col: 'G', amharic: 'ጂ... ሃምሳ ሁለት!', english: 'G... Fifty-Two!' },
  { num: 53, col: 'G', amharic: 'ጂ... ሃምሳ ሶስት!', english: 'G... Fifty-Three!' },
  { num: 54, col: 'G', amharic: 'ጂ... ሃምሳ አራት!', english: 'G... Fifty-Four!' },
  { num: 55, col: 'G', amharic: 'ጂ... ሃምሳ አምስት!', english: 'G... Fifty-Five!' },
  { num: 56, col: 'G', amharic: 'ጂ... ሃምሳ ስድስት!', english: 'G... Fifty-Six!' },
  { num: 57, col: 'G', amharic: 'ጂ... ሃምሳ ሰባት!', english: 'G... Fifty-Seven!' },
  { num: 58, col: 'G', amharic: 'ጂ... ሃምሳ ስምንት!', english: 'G... Fifty-Eight!' },
  { num: 59, col: 'G', amharic: 'ጂ... ሃምሳ ዘጠኝ!', english: 'G... Fifty-Nine!' },
  { num: 60, col: 'G', amharic: 'ጂ... ስልሳ!', english: 'G... Sixty!' }
];

const COLUMN_O_BALLS: BallScriptItem[] = [
  { num: 61, col: 'O', amharic: 'ኦ... ስልሳ አንድ!', english: 'O... Sixty-One!' },
  { num: 62, col: 'O', amharic: 'ኦ... ስልሳ ሁለት!', english: 'O... Sixty-Two!' },
  { num: 63, col: 'O', amharic: 'ኦ... ስልሳ ሶስት!', english: 'O... Sixty-Three!' },
  { num: 64, col: 'O', amharic: 'ኦ... ስልሳ አራት!', english: 'O... Sixty-Four!' },
  { num: 65, col: 'O', amharic: 'ኦ... ስልሳ አምስት!', english: 'O... Sixty-Five!' },
  { num: 66, col: 'O', amharic: 'ኦ... ስልሳ ስድስት!', english: 'O... Sixty-Six!' },
  { num: 67, col: 'O', amharic: 'ኦ... ስልሳ ሰባት!', english: 'O... Sixty-Seven!' },
  { num: 68, col: 'O', amharic: 'ኦ... ስልሳ ስምንት!', english: 'O... Sixty-Eight!' },
  { num: 69, col: 'O', amharic: 'ኦ... ስልሳ ዘጠኝ!', english: 'O... Sixty-Nine!' },
  { num: 70, col: 'O', amharic: 'ኦ... ሰባ!', english: 'O... Seventy!' },
  { num: 71, col: 'O', amharic: 'ኦ... ሰባ አንድ!', english: 'O... Seventy-One!' },
  { num: 72, col: 'O', amharic: 'ኦ... ሰባ ሁለት!', english: 'O... Seventy-Two!' },
  { num: 73, col: 'O', amharic: 'ኦ... ሰባ ሶስት!', english: 'O... Seventy-Three!' },
  { num: 74, col: 'O', amharic: 'ኦ... ሰባ አራት!', english: 'O... Seventy-Four!' },
  { num: 75, col: 'O', amharic: 'ኦ... ሰባ አምስት!', english: 'O... Seventy-Five!' }
];

type BingoColumn = 'B' | 'I' | 'N' | 'G' | 'O';

const COLUMN_CONFIG: Record<BingoColumn, {
  range: string;
  color: string;
  borderActive: string;
  bgActive: string;
  textActive: string;
  sphereGrad: string;
  items: BallScriptItem[];
}> = {
  B: {
    range: '1–15',
    color: '#3b82f6',
    borderActive: '2px solid #3b82f6',
    bgActive: 'rgba(59, 130, 246, 0.2)',
    textActive: '#93c5fd',
    sphereGrad: 'radial-gradient(circle at 35% 35%, #60a5fa, #1e40af)',
    items: COLUMN_B_BALLS
  },
  I: {
    range: '16–30',
    color: '#f43f5e',
    borderActive: '2px solid #f43f5e',
    bgActive: 'rgba(244, 63, 94, 0.2)',
    textActive: '#fda4af',
    sphereGrad: 'radial-gradient(circle at 35% 35%, #fb7185, #be123c)',
    items: COLUMN_I_BALLS
  },
  N: {
    range: '31–45',
    color: '#f59e0b',
    borderActive: '2px solid #f59e0b',
    bgActive: 'rgba(245, 158, 11, 0.2)',
    textActive: '#fcd34d',
    sphereGrad: 'radial-gradient(circle at 35% 35%, #fbbf24, #b45309)',
    items: COLUMN_N_BALLS
  },
  G: {
    range: '46–60',
    color: '#10b981',
    borderActive: '2px solid #10b981',
    bgActive: 'rgba(16, 185, 129, 0.2)',
    textActive: '#6ee7b7',
    sphereGrad: 'radial-gradient(circle at 35% 35%, #34d399, #047857)',
    items: COLUMN_G_BALLS
  },
  O: {
    range: '61–75',
    color: '#a855f7',
    borderActive: '2px solid #a855f7',
    bgActive: 'rgba(168, 85, 247, 0.2)',
    textActive: '#d8b4fe',
    sphereGrad: 'radial-gradient(circle at 35% 35%, #c084fc, #7e22ce)',
    items: COLUMN_O_BALLS
  }
};

export const VoiceTesterModal: React.FC<VoiceTesterModalProps> = ({ isOpen, onClose }) => {
  const { isMuted, toggleMute } = useBingo();
  const [activePlayingNum, setActivePlayingNum] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BingoColumn>('O');

  if (!isOpen) return null;

  const currentConfig = COLUMN_CONFIG[activeTab];
  const currentBalls = currentConfig.items;

  const handleTestBall = async (b: BallScriptItem) => {
    if (isMuted) {
      toggleMute();
    }
    soundEngine.unlockAudio();
    soundEngine.resumeAudioContext();
    setActivePlayingNum(b.num);

    try {
      await soundEngine.speakBall(b.col, b.num);
    } finally {
      setTimeout(() => {
        setActivePlayingNum(null);
      }, 1800);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #111827, #0f172a)',
          border: `1px solid ${currentConfig.color}40`,
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px ${currentConfig.color}25`,
          padding: '24px',
          color: '#ffffff'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎙️</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: currentConfig.textActive }}>
                Column {activeTab} Voice Studio ({currentConfig.range})
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Tap any ball to audition your authentic human voice clip
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 5-Column Tab Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px' }}>
          {(['B', 'I', 'N', 'G', 'O'] as BingoColumn[]).map(col => {
            const conf = COLUMN_CONFIG[col];
            const isTabActive = activeTab === col;
            return (
              <button
                key={col}
                type="button"
                onClick={() => setActiveTab(col)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: isTabActive ? conf.borderActive : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isTabActive ? conf.bgActive : 'rgba(255, 255, 255, 0.04)',
                  color: isTabActive ? conf.textActive : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{col}</span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>{conf.range}</span>
              </button>
            );
          })}
        </div>

        {/* Status Pill & Audio State */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `${currentConfig.color}15`,
            border: `1px solid ${currentConfig.color}40`,
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentConfig.color }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: currentConfig.textActive }}>
              15 of 15 Ready (Column {activeTab}: Balls {currentConfig.range})
            </span>
          </div>

          {isMuted && (
            <button
              onClick={toggleMute}
              style={{
                background: '#eab308',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔊 Unmute Audio
            </button>
          )}
        </div>

        {/* 15-Ball Interactive Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          {currentBalls.map((b) => {
            const isPlaying = activePlayingNum === b.num;

            return (
              <button
                key={b.num}
                type="button"
                onClick={() => handleTestBall(b)}
                style={{
                  background: isPlaying
                    ? `linear-gradient(135deg, ${currentConfig.color}, #0f172a)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isPlaying
                    ? `1px solid ${currentConfig.color}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isPlaying ? `0 0 15px ${currentConfig.color}60` : 'none',
                  transform: isPlaying ? 'scale(0.97)' : 'scale(1)'
                }}
              >
                {/* Ball Sphere */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: currentConfig.sphereGrad,
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '13px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    marginBottom: '6px'
                  }}
                >
                  <span style={{ fontSize: '8px', opacity: 0.8, lineHeight: 1 }}>{b.col}</span>
                  <span style={{ lineHeight: 1 }}>{b.num}</span>
                </div>

                {/* Amharic & English Labels */}
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', textAlign: 'center' }}>
                  {b.amharic}
                </span>
                <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                  {b.english}
                </span>

                {/* Play Status */}
                <span
                  style={{
                    marginTop: '6px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: isPlaying ? '#93c5fd' : currentConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-volume-high fa-beat' : 'fa-play'}`}></i>
                  {isPlaying ? 'PLAYING' : 'TAP TO PLAY'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            ✓ Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
};
