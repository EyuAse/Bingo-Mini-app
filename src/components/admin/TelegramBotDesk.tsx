import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { getApiBase, LIVE_BACKEND_ORIGIN } from '../../config/env.ts';

interface BotStatus {
  isConnected: boolean;
  bot: {
    id: number;
    first_name: string;
    username: string;
  } | null;
  config: {
    hasToken: boolean;
    tokenPreview: string;
    webAppUrl: string;
    channelId: string;
    autoPostMegaWins: boolean;
    megaWinThreshold: number;
  };
  metrics: {
    totalTelegramUsers: number;
    activeBotSubscribers: number;
    totalBroadcasts: number;
  };
}

interface BroadcastItem {
  id: number;
  title: string;
  message_text: string;
  photo_url?: string;
  button_text?: string;
  button_url?: string;
  target_type: string;
  target_id?: string;
  pin_message: boolean;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

export const TelegramBotDesk: React.FC = () => {
  const { showToast } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);

  // Config Form State
  const [botToken, setBotToken] = useState<string>('');
  const [webAppUrl, setWebAppUrl] = useState<string>('');
  const [channelId, setChannelId] = useState<string>('');
  const [autoPostWins, setAutoPostWins] = useState<boolean>(true);
  const [winThreshold, setWinThreshold] = useState<number>(300);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [isSettingMenu, setIsSettingMenu] = useState<boolean>(false);

  // Ad / Campaign Composer State
  const [targetType, setTargetType] = useState<'channel' | 'all_users' | 'test'>('channel');
  const [targetChatId, setTargetChatId] = useState<string>('');
  const [adTitle, setAdTitle] = useState<string>('Weekend 10,000 ETB Mega Pot Tournament! 🍋🏆');
  const [adText, setAdText] = useState<string>(
    '🎉 <b>ታላቅ የሳምንቱ መጨረሻ የቢንጎ ውድድር!</b>\n\n' +
    '💰 አጠቃላይ የሽልማት ፈንድ: <b>10,000 ETB!</b>\n' +
    '⚡ ፈጣን ክፍያዎች በቴሌብር እና በሲቢኢ ብር\n' +
    '🎁 አዲስ ለተመዘገቡ ተጫዋቾች <b>10 ETB ነፃ ቦነስ</b> ተዘጋጅቷል!\n\n' +
    'ካርቴላዎን አሁኑኑ ይቁረጡ እና ያሸንፉ! 👇'
  );
  const [adPhoto, setAdPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80'
  );
  const [adButtonText, setAdButtonText] = useState<string>('🎮 Play Bingo Now & Get 10 ETB');
  const [adButtonUrl, setAdButtonUrl] = useState<string>('');
  const [pinMessage, setPinMessage] = useState<boolean>(true);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Resilient API Fetch Helper with live backend fallback
  const apiFetch = async (endpoint: string, init?: RequestInit): Promise<Response> => {
    try {
      const res = await fetch(`${getApiBase()}${endpoint}`, init);
      if (res.ok || res.status !== 404) {
        return res;
      }
    } catch (e) {}

    return fetch(`${LIVE_BACKEND_ORIGIN}/api${endpoint}`, init);
  };

  // Load Status and Broadcast History
  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, historyRes] = await Promise.all([
        apiFetch('/admin/telegram/status'),
        apiFetch('/admin/telegram/broadcasts')
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        if (sData.success) {
          setStatus(sData);
          setWebAppUrl(sData.config?.webAppUrl || window.location.origin);
          setChannelId(sData.config?.channelId || '');
          setAutoPostWins(sData.config?.autoPostMegaWins ?? true);
          setWinThreshold(sData.config?.megaWinThreshold || 300);
          if (!targetChatId && sData.config?.channelId) {
            setTargetChatId(sData.config.channelId);
          }
        }
      }

      if (historyRes.ok) {
        const hData = await historyRes.json();
        if (hData.success && Array.isArray(hData.broadcasts)) {
          setBroadcasts(hData.broadcasts);
        }
      }
    } catch (e) {
      console.error('Failed to load telegram status:', e);
      showToast('⚠️ Failed to load Telegram Bot metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await apiFetch('/admin/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken || undefined,
          webAppUrl: webAppUrl.trim(),
          channelId: channelId.trim(),
          autoPostMegaWins: autoPostWins,
          megaWinThreshold: Number(winThreshold)
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('✅ Telegram Bot configuration saved!');
        setBotToken('');
        loadData();
      } else {
        showToast(`❌ ${data.error || 'Failed to save configuration'}`);
      }
    } catch (err: any) {
      showToast('❌ Network error saving configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Configure Mini App Menu Button in Bot
  const handleSetMenuButton = async () => {
    if (!webAppUrl) {
      showToast('⚠️ Web App URL is required');
      return;
    }
    setIsSettingMenu(true);
    try {
      const res = await apiFetch('/admin/telegram/set-menu-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: webAppUrl.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 Persistent "Play Bingo" Menu Button linked to bot!');
      } else {
        showToast(`❌ ${data.error || 'Failed to update menu button'}`);
      }
    } catch {
      showToast('❌ Error updating Telegram menu button');
    } finally {
      setIsSettingMenu(false);
    }
  };

  // Dispatch Broadcast Campaign
  const handleDispatchBroadcast = async () => {
    setShowConfirmModal(false);
    setIsBroadcasting(true);
    setBroadcastFeedback(null);

    try {
      const res = await apiFetch('/admin/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adTitle,
          messageText: adText,
          photoUrl: adPhoto.trim() || undefined,
          buttonText: adButtonText.trim() || undefined,
          buttonUrl: adButtonUrl.trim() || webAppUrl.trim() || undefined,
          targetType,
          targetId: targetType === 'channel' ? (targetChatId || channelId) : (targetType === 'test' ? targetChatId : undefined),
          pinMessage: pinMessage && targetType === 'channel'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`🚀 ${data.message}`);
        setBroadcastFeedback({ type: 'success', message: data.message });
        loadData();
      } else {
        const errorMsg = data.error || data.message || 'Broadcast failed';
        showToast(`❌ ${errorMsg}`);
        setBroadcastFeedback({ type: 'error', message: errorMsg });
      }
    } catch (e: any) {
      const netErr = 'Broadcast network request failed. Please verify connection.';
      showToast(`❌ ${netErr}`);
      setBroadcastFeedback({ type: 'error', message: netErr });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="telegram-bot-desk-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* 1. Header Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Bot Connection Status */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Bot Status</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: loading ? '#fef3c7' : (status?.isConnected ? '#dcfce7' : '#fee2e2'),
              color: loading ? '#b45309' : (status?.isConnected ? '#166534' : '#991b1b')
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: loading ? '#f59e0b' : (status?.isConnected ? '#22c55e' : '#ef4444')
              }}></span>
              {loading ? 'CHECKING BOT...' : (status?.isConnected ? 'ONLINE & LINKED' : 'NOT CONNECTED')}
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {status?.bot?.first_name || (loading ? 'Loading Bot...' : 'Betika / Lomi Bingo Bot')}
          </div>
          <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
            {status?.bot?.username ? `@${status.bot.username}` : (loading ? 'Connecting to Telegram...' : 'Configure bot token below')}
          </div>
        </div>

        {/* Card 2: Registered Telegram Players */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Telegram Players</span>
            <i className="fa-solid fa-users" style={{ color: '#3b82f6', fontSize: '18px' }}></i>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            {status?.metrics?.totalTelegramUsers || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
            {status?.metrics?.activeBotSubscribers || 0} active bot subscribers
          </div>
        </div>

        {/* Card 3: Total Broadcast Campaigns */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Campaigns Sent</span>
            <i className="fa-solid fa-bullhorn" style={{ color: '#eab308', fontSize: '18px' }}></i>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            {status?.metrics?.totalBroadcasts || broadcasts.length}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            Channel posts & direct promotions
          </div>
        </div>

        {/* Card 4: Quick Menu Button Action */}
        <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: '16px', padding: '20px', color: '#ffffff', boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9, marginBottom: '6px' }}>Telegram Mini App Menu Button</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Persistent "🎮 Play Bingo" Button</div>
          </div>
          <button
            type="button"
            onClick={handleSetMenuButton}
            disabled={isSettingMenu || !status?.config?.hasToken}
            style={{
              background: '#ffffff',
              color: '#0369a1',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSettingMenu || !status?.config?.hasToken ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <i className={`fa-solid ${isSettingMenu ? 'fa-circle-notch fa-spin' : 'fa-link'}`}></i>
            {isSettingMenu ? 'Updating Menu...' : 'Attach / Update Bot Menu Button'}
          </button>
        </div>
      </div>

      {/* 2. Main Grid: Composer + Live Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        {/* Left Column: Ad / Campaign Composer Form */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-paper-plane" style={{ color: '#0284c7' }}></i>
                Compose Ad & Broadcast Campaign
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Create rich advertisements with banner images and direct "Play Now" Mini App buttons.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Target Audience Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                🎯 Target Audience Destination
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTargetType('channel')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: targetType === 'channel' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: targetType === 'channel' ? '#f0f9ff' : '#ffffff',
                    color: targetType === 'channel' ? '#0369a1' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-bullhorn"></i> Official Channel
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('all_users')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: targetType === 'all_users' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: targetType === 'all_users' ? '#f0f9ff' : '#ffffff',
                    color: targetType === 'all_users' ? '#0369a1' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-users"></i> All Players (Direct)
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('test')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: targetType === 'test' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: targetType === 'test' ? '#f0f9ff' : '#ffffff',
                    color: targetType === 'test' ? '#0369a1' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-flask"></i> Personal Test
                </button>
              </div>
            </div>

            {/* Target ID / Channel Username */}
            {targetType === 'channel' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Channel Username or Chat ID (e.g. @lomibingo or -100xxxxxxx)
                </label>
                <input
                  type="text"
                  value={targetChatId}
                  onChange={(e) => setTargetChatId(e.target.value)}
                  placeholder="@your_channel_name"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  marginTop: '8px',
                  padding: '12px 14px',
                  background: '#f0f9ff',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#0369a1',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-info"></i> How to post announcements to your Telegram Channel:
                  </div>
                  <div>1. Open your Channel in Telegram (e.g. your announcement channel).</div>
                  <div>2. Tap Channel Title &rarr; <b>Administrators &rarr; Add Administrator</b>.</div>
                  <div>3. Search for <b>@{status?.bot?.username || 'LomiBingobot'}</b> and add it with <b>"Post Messages"</b> turned <b>ON</b>.</div>
                  <div>4. Enter your channel @username (e.g. <code>@lomibingo</code>) above and click <b>Publish</b>!</div>
                </div>
              </div>
            )}

            {targetType === 'all_users' && (
              <div style={{
                padding: '14px',
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#166534',
                lineHeight: '1.6'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-users"></i> Direct 1-on-1 Broadcast to Registered Players
                </div>
                <div>
                  This sends the promotional card directly into the private Telegram chat of all <b>{status?.metrics?.totalTelegramUsers || 0} registered players</b> with Mini App CTA buttons.
                </div>
              </div>
            )}

            {targetType === 'test' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Your Personal Telegram Chat ID (Numeric ID from @userinfobot)
                </label>
                <input
                  type="text"
                  value={targetChatId}
                  onChange={(e) => setTargetChatId(e.target.value)}
                  placeholder="e.g. 123456789"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{
                  marginTop: '8px',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  💡 <b>Instant Test:</b> Message <b>@userinfobot</b> on Telegram to see your numeric ID, paste it here, and verify the message layout before public posting!
                </div>
              </div>
            )}

            {/* Campaign Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Campaign Internal Title
              </label>
              <input
                type="text"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Weekend Mega Tournament 10,000 ETB"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Promo Banner Image URL */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Promo Banner Image URL (Optional)
              </label>
              <input
                type="text"
                value={adPhoto}
                onChange={(e) => setAdPhoto(e.target.value)}
                placeholder="https://... (Direct image URL for flyer/banner)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Message Body (HTML supported) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Ad Message / Caption (Supports HTML: &lt;b&gt;, &lt;i&gt;, emojis)
              </label>
              <textarea
                rows={6}
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="Write your advertisement in Amharic & English..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Call-to-Action Button Label */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Interactive Button Text
                </label>
                <input
                  type="text"
                  value={adButtonText}
                  onChange={(e) => setAdButtonText(e.target.value)}
                  placeholder="🎮 Play Bingo Now & Get 10 ETB"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Button URL (Defaults to Mini App)
                </label>
                <input
                  type="text"
                  value={adButtonUrl}
                  onChange={(e) => setAdButtonUrl(e.target.value)}
                  placeholder={webAppUrl || 'https://...'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Pin Message Toggle */}
            {targetType === 'channel' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={pinMessage}
                  onChange={(e) => setPinMessage(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  📌 Pin post in Telegram channel after publishing
                </span>
              </label>
            )}

            {/* Broadcast Feedback Alert Banner */}
            {broadcastFeedback && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: broadcastFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${broadcastFeedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: broadcastFeedback.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '13px',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <i className={`fa-solid ${broadcastFeedback.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} style={{ marginTop: '2px', fontSize: '16px' }}></i>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      {broadcastFeedback.type === 'success' ? 'Campaign Published Successfully!' : 'Campaign Broadcast Issue'}
                    </div>
                    <div>{broadcastFeedback.message}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastFeedback(null)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7, padding: '2px' }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {/* Dispatch Action Button */}
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isBroadcasting || !status?.config?.hasToken}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: isBroadcasting || !status?.config?.hasToken ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                }}
              >
                <i className={`fa-solid ${isBroadcasting ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`}></i>
                {isBroadcasting ? 'Sending Broadcast...' : (targetType === 'test' ? 'Send Test Message' : 'Publish / Broadcast Ad Now')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telegram Phone Simulator */}
        <div>
          <div style={{ background: '#0f172a', borderRadius: '24px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '4px solid #1e293b' }}>
            
            {/* Phone Top Notch / Speaker */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{ width: '80px', height: '4px', background: '#334155', borderRadius: '4px' }}></div>
            </div>

            {/* Telegram Header Bar */}
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #facc15, #eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🍋
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {status?.bot?.first_name || 'Lomi Bingo'}
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '4px' }}>bot</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                  {targetType === 'channel' ? (targetChatId || '@lomibingo') : 'Live Preview'}
                </div>
              </div>
            </div>

            {/* Simulated Chat Bubble */}
            <div style={{ background: '#1e293b', borderRadius: '16px', padding: '12px', maxWidth: '380px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              
              {/* Optional Banner Image */}
              {adPhoto && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', background: '#0f172a', maxHeight: '200px' }}>
                  <img
                    src={adPhoto}
                    alt="Promo Banner Preview"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Message Text with HTML Simulation */}
              <div 
                style={{ color: '#f8fafc', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', marginBottom: '12px', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: adText }}
              />

              {/* Timestamp & Read Indicator */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b', marginBottom: '8px' }}>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <i className="fa-solid fa-check-double" style={{ color: '#38bdf8' }}></i>
              </div>

              {/* Inline Web App Action Button */}
              {adButtonText && (
                <div style={{
                  background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  cursor: 'pointer'
                }}>
                  <i className="fa-solid fa-gamepad"></i>
                  <span>{adButtonText}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '11px' }}>
              📱 Live Telegram Client Appearance
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bot Settings & Channel Automation Card */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-gear" style={{ color: '#eab308' }}></i>
          Telegram Bot & Channel Automation Configuration
        </h3>

        <form onSubmit={handleSaveConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Telegram Bot Token (from @BotFather)
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={status?.config?.hasToken ? `Configured (${status.config.tokenPreview})` : 'Enter Bot Token from @BotFather'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Hosted Web App URL (TMA Entrypoint)
            </label>
            <input
              type="text"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Official Telegram Channel Username / ID
            </label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="@lomibingo"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Auto-Post Big Winners to Channel
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '42px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={autoPostWins}
                  onChange={(e) => setAutoPostWins(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                Enable Auto-Announcement
              </label>
              <input
                type="number"
                value={winThreshold}
                onChange={(e) => setWinThreshold(Number(e.target.value))}
                placeholder="Min ETB"
                style={{
                  width: '90px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>ETB+</span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={isSavingConfig}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSavingConfig ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className={`fa-solid ${isSavingConfig ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'}`}></i>
              {isSavingConfig ? 'Saving...' : 'Save Bot Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Broadcast History & Delivery Analytics Table */}
      <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#64748b' }}></i>
            Campaign History & Analytics ({broadcasts.length})
          </h3>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>

        {broadcasts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
            <i className="fa-solid fa-paper-plane" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}></i>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No campaigns broadcasted yet.</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Use the composer above to publish announcements to your channel or players.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Date</th>
                  <th style={{ padding: '10px 14px' }}>Campaign Title</th>
                  <th style={{ padding: '10px 14px' }}>Target</th>
                  <th style={{ padding: '10px 14px' }}>Recipients</th>
                  <th style={{ padding: '10px 14px' }}>Delivered</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      {b.title}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: b.target_type === 'channel' ? '#e0f2fe' : '#fef3c7',
                        color: b.target_type === 'channel' ? '#0369a1' : '#b45309'
                      }}>
                        {b.target_type === 'channel' ? `Channel (${b.target_id || 'Default'})` : 'All Players'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.total_recipients}</td>
                    <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 700 }}>
                      {b.sent_count} / {b.total_recipients}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: b.status === 'completed' ? '#dcfce7' : (b.status === 'sending' ? '#fef9c3' : '#fee2e2'),
                        color: b.status === 'completed' ? '#166534' : (b.status === 'sending' ? '#854d0e' : '#991b1b')
                      }}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Confirm Broadcast Dispatch
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to publish <strong>"{adTitle}"</strong> to{' '}
              <span style={{ color: '#0284c7', fontWeight: 700 }}>
                {targetType === 'channel' ? `Telegram Channel ${targetChatId || channelId}` : (targetType === 'all_users' ? 'All Registered Players' : 'Your Personal Chat')}
              </span>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchBroadcast}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Yes, Send Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
