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

export const VoiceTesterModal: React.FC<VoiceTesterModalProps> = ({ isOpen, onClose }) => {
  const { isMuted, toggleMute } = useBingo();
  const [activePlayingNum, setActivePlayingNum] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleTestBall = async (b: BallScriptItem) => {
    // If muted, automatically unmute so sound can be heard
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
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(59, 130, 246, 0.15)',
          padding: '24px',
          color: '#ffffff'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🎙️</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
                Column B Voice Studio (1–15)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Tap any ball to audition your real recorded voice clip
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

        {/* Status Pill & Audio State */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
              15 of 15 Balls Ready (100% Column B Complete)
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
          {COLUMN_B_BALLS.map((b) => {
            const isPlaying = activePlayingNum === b.num;

            return (
              <button
                key={b.num}
                type="button"
                onClick={() => handleTestBall(b)}
                style={{
                  background: isPlaying
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isPlaying
                    ? '1px solid #60a5fa'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isPlaying ? '0 0 15px rgba(37, 99, 235, 0.5)' : 'none',
                  transform: isPlaying ? 'scale(0.97)' : 'scale(1)'
                }}
              >
                {/* Ball Sphere */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #60a5fa, #1e40af)',
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
                    color: isPlaying ? '#93c5fd' : '#10b981',
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
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            ✓ Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
};
