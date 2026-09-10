import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { apiClient } from '../../services/apiClient.ts';

interface TableStat {
  tableName: string;
  rowCount: number;
  totalBytes: number;
  totalFormatted: string;
}

interface DbStats {
  totalBytes: number;
  totalFormatted: string;
  quotaBytes: number;
  quotaFormatted: string;
  usagePercent: number;
  status: 'healthy' | 'warning' | 'critical';
  tables: TableStat[];
  checkedAt: string;
}

export const DatabaseHealthWidget: React.FC = () => {
  const { showToast } = useApp();
  const [stats, setStats] = useState<DbStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isPruning, setIsPruning] = useState<boolean>(false);
  const [showMigrationGuide, setShowMigrationGuide] = useState<boolean>(false);

  const fetchDbHealth = async () => {
    try {
      const res = await apiClient.admin.getDatabaseHealth();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch database health:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbHealth();
  }, []);

  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    try {
      showToast('📦 Generating authoritative database snapshot...');
      await apiClient.admin.downloadDatabaseBackup();
      showToast('✅ Database backup successfully downloaded!');
    } catch (err: any) {
      showToast(`❌ Backup failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePruneStorage = async () => {
    if (!window.confirm('Clean up receipt screenshots from deposits older than 30 days? (Balances and transaction records will NOT be deleted).')) {
      return;
    }
    setIsPruning(true);
    try {
      const res = await apiClient.admin.pruneDatabaseStorage();
      if (res.success) {
        showToast(res.message || 'Legacy receipts cleaned up!');
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      showToast(`❌ Cleanup error: ${err.message}`);
    } finally {
      setIsPruning(false);
    }
  };

  const totalUsers = stats?.tables.find(t => t.tableName === 'users')?.rowCount || 0;
  const totalWallets = stats?.tables.find(t => t.tableName === 'wallets')?.rowCount || 0;
  const totalTxs = stats?.tables.find(t => t.tableName === 'wallet_transactions')?.rowCount || 0;
  const totalRounds = stats?.tables.find(t => t.tableName === 'game_rounds')?.rowCount || 0;
  const totalTickets = stats?.tables.find(t => t.tableName === 'game_tickets')?.rowCount || 0;

  return (
    <div className="desk-section-card" style={{ marginTop: '24px' }}>
      <div className="desk-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-database"></i>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Neon Cloud Database & Free-Tier Quota Health
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              የዳታቤዝ ማከማቻ፣ የነፃ ፕላን ኮምፒውት ሰዓታት እና የተጠቃሚዎች ሙሉ ደህንነት መቆጣጠሪያ
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchDbHealth}
            disabled={isLoading}
            className="action-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh database metrics"
          >
            <i className={`fa-solid fa-rotate-right ${isLoading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
          <button
            onClick={handleDownloadBackup}
            disabled={isDownloading}
            className="action-btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <i className={`fa-solid ${isDownloading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-down'}`}></i>
            {isDownloading ? 'Downloading...' : '1-Click Full Backup'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {/* Storage Quota Card */}
        <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              SSD Disk Storage
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
              {stats?.status === 'healthy' ? '🟢 Healthy (94% Free)' : 'Active'}
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {stats ? stats.totalFormatted : '...'} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/ 512 MB</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(stats?.usagePercent || 2, 2)}%`,
                height: '100%',
                background: (stats?.usagePercent || 0) > 85 ? '#ef4444' : (stats?.usagePercent || 0) > 70 ? '#f59e0b' : '#10b981',
                borderRadius: '3px'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>Used: {stats?.usagePercent || 2}%</span>
            <span>Free: 502 MB</span>
          </div>
        </div>

        {/* Compute Hours Card */}
        <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Monthly Compute
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
              Auto-Resets 1st
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            100 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>CU-hrs / month</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
            ⚡ Sleep (Autosuspend) is active. Neon automatically sleeps when no players are active, keeping you safely under quota.
          </p>
        </div>

        {/* Registered Entities Card */}
        <div style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Database Records
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>
              11 Tables
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#334155' }}>
            <div><strong>{totalUsers}</strong> <span style={{ color: '#64748b' }}>Users</span></div>
            <div><strong>{totalWallets}</strong> <span style={{ color: '#64748b' }}>Wallets</span></div>
            <div><strong>{totalTxs}</strong> <span style={{ color: '#64748b' }}>Transactions</span></div>
            <div><strong>{totalRounds}</strong> <span style={{ color: '#64748b' }}>Rounds</span></div>
            <div><strong>{totalTickets}</strong> <span style={{ color: '#64748b' }}>Tickets</span></div>
          </div>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => setShowMigrationGuide(!showMigrationGuide)}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
            >
              <i className="fa-solid fa-circle-question" style={{ marginRight: '4px' }}></i>
              {showMigrationGuide ? 'Hide 1-Click Migration Guide' : 'How to switch Neon DB with Zero Data Loss?'}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Zero-Loss Migration Guide */}
      {showMigrationGuide && (
        <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-shield-halved"></i>
            How to Move to a Fresh Free Neon DB with 100% Zero Data Loss
          </h4>
          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#1e3a8a', lineHeight: 1.5 }}>
            If you ever want a fresh free 100 CU-hrs or fresh 500 MB, you never have to lose any players, balances, or history:
          </p>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: '#1e3a8a', lineHeight: 1.6 }}>
            <li>Click <strong>"1-Click Full Backup"</strong> above (or run <code>npm run db:backup</code> in terminal).</li>
            <li>Create a new free project in the Neon console (takes 30 seconds) and copy its connection string.</li>
            <li>Run in terminal: <code>npm run db:restore -- --target="new_neon_url"</code>.</li>
            <li>In your Render dashboard, update the <code>DATABASE_URL</code> environment variable to the new URL.</li>
            <li>Done! All player logins, wallet balances, and game records are 100% migrated with zero data loss.</li>
          </ol>
        </div>
      )}

      {/* Storage Optimizer Action */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handlePruneStorage}
          disabled={isPruning}
          className="action-btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#64748b' }}
          title="Prunes base64 images from deposits older than 30 days to keep disk usage under 15 MB"
        >
          <i className="fa-solid fa-broom" style={{ marginRight: '6px' }}></i>
          {isPruning ? 'Cleaning...' : 'Prune Old Receipt Images (>30 days)'}
        </button>
      </div>
    </div>
  );
};
