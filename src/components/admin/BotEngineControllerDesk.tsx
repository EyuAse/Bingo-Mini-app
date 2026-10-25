import React, { useState, useEffect } from 'react';
import { useAdmin, AdminBotEngineConfig } from '../../context/AdminContext.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const BotEngineControllerDesk: React.FC = () => {
  const { botConfig, updateBotConfig, refreshBotConfig, botTelemetry } = useAdmin();
  const { showToast } = useApp();

  // Local editing draft state
  const [mode, setMode] = useState<'dynamic' | 'fixed' | 'disabled'>(botConfig?.mode || 'dynamic');
  const [fixedCount, setFixedCount] = useState<number>(botConfig?.fixedCount ?? 20);
  const [minBots, setMinBots] = useState<number>(botConfig?.minBots ?? 2);
  const [maxBots, setMaxBots] = useState<number>(botConfig?.maxBots ?? 50);
  const [livingClock, setLivingClock] = useState<boolean>(botConfig?.livingClock ?? true);
  const [staggeredJoin, setStaggeredJoin] = useState<boolean>(botConfig?.staggeredJoin ?? true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync draft state when server updates arrive
  useEffect(() => {
    if (botConfig) {
      setMode(botConfig.mode);
      setFixedCount(botConfig.fixedCount);
      setMinBots(botConfig.minBots);
      setMaxBots(botConfig.maxBots);
      setLivingClock(botConfig.livingClock);
      setStaggeredJoin(botConfig.staggeredJoin);
    }
  }, [botConfig]);

  // Derived effective bot count for preview calculations
  const effectiveBotPreview = mode === 'disabled'
    ? 0
    : mode === 'fixed'
    ? fixedCount
    : Math.round((minBots + maxBots) / 2);

  // Real-time mathematical preview calculations (1 human + B bots)
  const totalCardsPreview = 1 + effectiveBotPreview;
  const realWinRatePercent = totalCardsPreview > 0 ? ((1 / totalCardsPreview) * 100).toFixed(1) : '100.0';
  const grossPotPreview = totalCardsPreview * 10;
  const netDerashPreview = Math.floor(grossPotPreview * 0.8);
  const houseRakePreview = grossPotPreview - netDerashPreview;
  const antiChurnThreshold = Math.min(60, Math.max(6, Math.ceil(totalCardsPreview * 1.25)));

  // Preset Handlers
  const applyPreset = (presetMode: 'disabled' | 'fixed' | 'dynamic', minB: number, maxB: number, fixedB: number) => {
    setMode(presetMode);
    setMinBots(minB);
    setMaxBots(maxB);
    setFixedCount(fixedB);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<AdminBotEngineConfig> = {
        mode,
        fixedCount,
        minBots,
        maxBots,
        livingClock,
        staggeredJoin
      };
      const ok = await updateBotConfig(payload);
      if (ok) {
        showToast('✅ Bot Engine settings updated and broadcasted to Room 10!');
      } else {
        showToast('❌ Failed to update Bot Engine settings');
      }
    } catch {
      showToast('❌ Network error updating Bot Engine');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bot-engine-desk" style={{ padding: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Strict Isolation Notice Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 95, 70, 0.22))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ fontSize: '1.8rem', color: '#10b981' }}>🛡️</div>
        <div>
          <strong style={{ color: '#10b981', fontSize: '0.95rem', display: 'block', marginBottom: '0.2rem' }}>
            Multi-Room Isolation Architecture Guaranteed
          </strong>
          <span style={{ color: '#d1fae5', fontSize: '0.85rem', lineHeight: '1.4' }}>
            These standby bot configurations apply <strong>strictly to Room 10 (10 ETB Arena)</strong>. Rooms 20, 50, and 100 ETB remain
            <strong> 100% human-only peer-to-peer</strong> with strictly 0 bots and untouched tiered commission logic.
          </span>
        </div>
      </div>

      {/* ── Top Overview: Live Telemetry Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Room 10 Bots
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {botTelemetry?.activeBotCount ?? effectiveBotPreview}
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '0.35rem' }}>/ 50 Max</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            ● Dynamic Ethiopian Roster Active
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Round & Phase
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
            #{botTelemetry?.roundNumber ?? 1}
            <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: 600, marginLeft: '0.5rem', textTransform: 'uppercase' }}>
              ({botTelemetry?.phase ?? 'lobby'})
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Living Clock: {livingClock ? '⚡ Continuous Running' : '⏸️ Pauses on Empty'}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estimated Net Derash
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {netDerashPreview.toLocaleString()} ETB
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Platform Fee: {houseRakePreview.toLocaleString()} ETB (+20%)
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Real Player Win Probability
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ec4899', marginTop: '0.25rem' }}>
            ~{realWinRatePercent}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            1 ticket vs {effectiveBotPreview} bot tickets
          </div>
        </div>
      </div>

      {/* ── Mode Selection Cards ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-shapes" style={{ color: '#38bdf8' }}></i>
          Bot Pool Mode Selection
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Select how the standby bot pool behaves for Room 10 rounds:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Mode 1: Dynamic */}
          <div
            onClick={() => setMode('dynamic')}
            style={{
              cursor: 'pointer',
              border: mode === 'dynamic' ? '2px solid #38bdf8' : '1px solid #334155',
              background: mode === 'dynamic' ? 'rgba(56, 189, 248, 0.08)' : '#0f172a',
              borderRadius: '10px',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>⚡ Dynamic Range (Recommended)</strong>
              <input type="radio" checked={mode === 'dynamic'} onChange={() => setMode('dynamic')} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
              Generates a natural bell-curve varying between <strong>{minBots}</strong> and <strong>{maxBots}</strong> bots each round, perfectly mimicking a real fluctuating crowd.
            </p>
          </div>

          {/* Mode 2: Fixed */}
          <div
            onClick={() => setMode('fixed')}
            style={{
              cursor: 'pointer',
              border: mode === 'fixed' ? '2px solid #f59e0b' : '1px solid #334155',
              background: mode === 'fixed' ? 'rgba(245, 158, 11, 0.08)' : '#0f172a',
              borderRadius: '10px',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>🔒 Fixed Count</strong>
              <input type="radio" checked={mode === 'fixed'} onChange={() => setMode('fixed')} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
              Locks Room 10 strictly to exactly <strong>{fixedCount}</strong> bots every single round.
            </p>
          </div>

          {/* Mode 3: Disabled */}
          <div
            onClick={() => setMode('disabled')}
            style={{
              cursor: 'pointer',
              border: mode === 'disabled' ? '2px solid #ef4444' : '1px solid #334155',
              background: mode === 'disabled' ? 'rgba(239, 68, 68, 0.08)' : '#0f172a',
              borderRadius: '10px',
              padding: '1.25rem',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#ef4444', fontSize: '1rem' }}>🚫 Disabled / Real Only</strong>
              <input type="radio" checked={mode === 'disabled'} onChange={() => setMode('disabled')} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
              Completely disables bots in Room 10 (0 bots). Requires ≥ 2 real human players to start a round.
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Preset Buttons ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600 }}>
          ⚡ 1-Click Bot Presets:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => applyPreset('disabled', 0, 0, 0)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: mode === 'disabled' ? '#ef4444' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            🚫 Disabled (0 Bots)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dynamic', 2, 5, 4)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: minBots === 2 && maxBots === 5 && mode === 'dynamic' ? '#38bdf8' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            🌱 Light (2–5 Bots)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dynamic', 8, 20, 15)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: minBots === 8 && maxBots === 20 && mode === 'dynamic' ? '#38bdf8' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            ⚖️ Medium (8–20 Bots)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('dynamic', 15, 35, 25)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: minBots === 15 && maxBots === 35 && mode === 'dynamic' ? '#38bdf8' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            🔥 Active (15–35 Bots)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('fixed', 50, 50, 50)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              background: fixedCount === 50 && mode === 'fixed' ? '#f59e0b' : '#334155',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            👑 Full Arena (50 Bots)
          </button>
        </div>
      </div>

      {/* ── Slider Controls Section ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-sliders" style={{ color: '#10b981' }}></i>
          Bot Pool Range & Quantity Adjuster (0 to 50)
        </h3>

        {mode === 'fixed' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Fixed Bot Count (0–50):</span>
              <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>{fixedCount} Bots</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={fixedCount}
              onChange={(e) => setFixedCount(parseInt(e.target.value, 10))}
              style={{ width: '100%', height: '8px', accentColor: '#f59e0b', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <span>0 (Disabled)</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40</span>
              <span>50 (Maximum)</span>
            </div>
          </div>
        ) : mode === 'dynamic' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Minimum Standby Bots:</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{minBots} Bots</strong>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={minBots}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setMinBots(val);
                  if (val > maxBots) setMaxBots(val);
                }}
                style={{ width: '100%', height: '8px', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Maximum Standby Bots:</span>
                <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{maxBots} Bots</strong>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={maxBots}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setMaxBots(val);
                  if (val < minBots) setMinBots(val);
                }}
                style={{ width: '100%', height: '8px', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>
            ⚠️ Standby bots are currently <strong>DISABLED</strong>. Room 10 operates purely peer-to-peer.
          </div>
        )}
      </div>

      {/* ── Continuous Living Clock & Joining Behavior ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-clock-rotate-left" style={{ color: '#f59e0b' }}></i>
          Living Casino & Autonomous Clock
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <input
              type="checkbox"
              checked={livingClock}
              onChange={(e) => setLivingClock(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
            />
            <div>
              <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'block' }}>
                Continuous Living Clock (Eliminates Bot Giveaway)
              </strong>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.3', display: 'block' }}>
                Lobby runs on continuous 45s cycle even with 0 users online. Eliminates the tell where bots wait indefinitely for a human. Pure bot rounds use 0 DB queries!
              </span>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <input
              type="checkbox"
              checked={staggeredJoin}
              onChange={(e) => setStaggeredJoin(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
            />
            <div>
              <strong style={{ color: '#f8fafc', fontSize: '0.95rem', display: 'block' }}>
                Staggered Natural Bot Arrivals
              </strong>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.3', display: 'block' }}>
                Bots trickle into the lobby 1-by-1 or 2-by-2 with live toast notifications instead of appearing in a single instant burst.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* ── Mathematical Economics Preview Card ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-calculator" style={{ color: '#a855f7' }}></i>
          Real-Time Mathematical & Economics Engine
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Real-time probability, house margin, and churn-protection metrics for this configuration:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Player Base Odds:</span>
            <div style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 700 }}>1 in {totalCardsPreview}</div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>P = 1 / ({1} + {effectiveBotPreview})</span>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>House Net Commission:</span>
            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 700 }}>Strictly +20%</div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Zero jackpot loss guarantee</span>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Anti-Churn Loss Threshold:</span>
            <div style={{ color: '#fbbf24', fontSize: '1.25rem', fontWeight: 700 }}>{antiChurnThreshold} Losses</div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Scales with active table size</span>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>PostgreSQL Queries / Pure Bot:</span>
            <div style={{ color: '#a855f7', fontSize: '1.25rem', fontWeight: 700 }}>0 Queries / 0 Rows</div>
            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>100% In-memory execution</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          type="button"
          onClick={() => refreshBotConfig()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            background: '#334155',
            color: '#f8fafc',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '0.5rem' }}></i>
          Reload from Server
        </button>

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={isSaving}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: 'none',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          {isSaving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.5rem' }}></i>
              Save & Apply Instantly
            </>
          )}
        </button>
      </div>
    </div>
  );
};
