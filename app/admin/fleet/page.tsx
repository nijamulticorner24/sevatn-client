'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatCurrency, formatDate, formatTime } from '../../../lib/utils';
import { StateBadge } from '../../../components/StateBadge';
import {
  Cpu,
  Plus,
  Activity,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Radio,
  RefreshCw,
  Server,
} from 'lucide-react';
import { MetricBlock } from '../../../components/MetricBlock';
import { EmptyState } from '../../../components/EmptyState';

export default function WorkerFleetPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadWorkers = () => {
    api.getWorkers()
      .then((data) => {
        setWorkers(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprovePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingLoading(true);
    try {
      const res = await api.pairWorker(pairingCode.trim().toUpperCase());
      setSuccessMsg(`Machine ${res.machine.machineCode} (${res.machine.machineName}) paired successfully!`);
      setPairingCode('');
      setPairingModalOpen(false);
      loadWorkers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to pair machine. Check pairing code.');
    } finally {
      setPairingLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  };

  const onlineCount = workers.filter((w) => w.status === 'ONLINE' || w.status === 'BUSY').length;
  const busyCount = workers.filter((w) => w.status === 'BUSY').length;
  const idleCount = workers.filter((w) => w.status === 'ONLINE').length;
  const offlineCount = workers.filter((w) => w.status === 'OFFLINE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Worker PC Fleet Telemetry</h1>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">
            Outbound TLS machine tokens, heartbeat health, job leases, and multi-PC scale
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPairingModalOpen(true)}
            className="flex items-center gap-2 rounded-btn bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors shadow-subtle"
          >
            <Plus className="h-4 w-4" />
            <span>Pair New Machine</span>
          </button>
          <button
            onClick={loadWorkers}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border-default bg-white text-secondary-600 hover:bg-neutral-50 hover:text-text-primary transition-colors shadow-subtle"
            title="Refresh Fleet"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-panel border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Fleet Online</span>
          <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">{onlineCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Heartbeat active</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Busy (Leased)</span>
          <p className="font-mono text-2xl font-bold text-amber-700 mt-1">{busyCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Checking availability</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Idle (Ready)</span>
          <p className="font-mono text-2xl font-bold text-info-700 mt-1">{idleCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Ready for new queue jobs</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Offline</span>
          <p className="font-mono text-2xl font-bold text-secondary-500 mt-1">{offlineCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">No recent heartbeat</p>
        </div>
      </div>

      {/* Fleet Grid */}
      {workers.length === 0 ? (
        <div className="rounded-card border border-border-default bg-white p-12">
          <EmptyState
            title="No worker machines paired"
            description="Authorize local worker terminals by providing their 6-character pairing code."
            action={{
              label: 'Pair Worker Machine',
              onClick: () => setPairingModalOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((w) => {
            const isOnline = w.status === 'ONLINE' || w.status === 'BUSY';
            const cpu = w.cpuUsage || 18;
            const ram = w.memoryUsage || 42;

            return (
              <div
                key={w.id}
                className="rounded-card border border-border-default bg-white p-5 shadow-subtle space-y-4 hover:border-brand-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-mono font-bold text-text-primary">{w.machineCode}</h3>
                      <StateBadge status={w.status} size="sm" />
                    </div>
                    <p className="text-xs text-secondary-500 mt-0.5">{w.machineName}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-neutral-100 text-secondary-600">
                    <Server className="h-4 w-4" />
                  </div>
                </div>

                {/* Telemetry Meters */}
                <div className="space-y-2.5 border-t border-border-subtle pt-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-secondary-600 mb-1">
                      <span>CPU Load</span>
                      <span className="font-mono font-bold text-text-primary">{cpu}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cpu > 80 ? 'bg-error-500' : cpu > 50 ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-secondary-600 mb-1">
                      <span>RAM Utilization</span>
                      <span className="font-mono font-bold text-text-primary">{ram}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-info-500"
                        style={{ width: `${ram}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 text-xs">
                  <div>
                    <span className="text-[10.5px] text-secondary-400 uppercase font-semibold">Heartbeat</span>
                    <p className="font-semibold text-text-primary mt-0.5">{getTimeAgo(w.lastHeartbeat)}</p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-secondary-400 uppercase font-semibold">Operator Share</span>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">{formatCurrency(w.operatorShareBalance || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-secondary-400 uppercase font-semibold">Jobs Completed</span>
                    <p className="font-semibold text-text-primary mt-0.5">{w.jobsCompleted || 0} passes</p>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-secondary-400 uppercase font-semibold">Agent Client</span>
                    <p className="font-mono text-secondary-600 mt-0.5">v{w.version || '1.0.0'} (Win)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pairing Modal */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-panel bg-white p-6 border border-border-default shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-bold text-text-primary">
                  Pair Worker Machine
                </h3>
              </div>
              <button
                onClick={() => setPairingModalOpen(false)}
                className="text-secondary-400 hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary-600 mb-4 leading-relaxed">
              When launching the TicketAssist Worker client on a local PC terminal, it displays a 6-character pairing code (e.g. <strong className="font-mono text-text-primary">TA-4829</strong>). Enter the pairing code below to authorize the terminal:
            </p>

            <form onSubmit={handleApprovePairing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Worker Pairing Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TA-4829"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  className="w-full rounded-input border border-border-default bg-white px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-text-primary focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setPairingModalOpen(false)}
                  className="rounded-btn border border-border-default px-4 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pairingLoading || !pairingCode.trim()}
                  className="rounded-btn bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {pairingLoading ? 'Authorizing...' : 'Authorize Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
