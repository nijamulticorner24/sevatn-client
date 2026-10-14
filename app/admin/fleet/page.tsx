'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';
import { StateBadge } from '../../../components/StateBadge';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Server,
  Play,
  Square,
  Pause,
  AlertCircle,
  Clock,
  ShieldAlert,
  Info,
  Loader2,
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';

export default function WorkerFleetPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stop Confirmation Modal State
  const [stopModalWorker, setStopModalWorker] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
    setErrorMsg(null);
    try {
      const res = await api.pairWorker(pairingCode.trim().toUpperCase());
      setSuccessMsg(`Machine ${res.machine.machineCode} (${res.machine.machineName}) paired successfully! Execution is initially STOPPED until authorized.`);
      setPairingCode('');
      setPairingModalOpen(false);
      loadWorkers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to pair machine. Check pairing code.');
    } finally {
      setPairingLoading(false);
    }
  };

  const handleStartWorker = async (workerId: string, machineCode: string) => {
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.startWorker(workerId);
      setSuccessMsg(res.message || `Worker ${machineCode} authorized to execute permitted work.`);
      loadWorkers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to start worker ${machineCode}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmStopWorker = async () => {
    if (!stopModalWorker) return;
    const workerId = stopModalWorker.id;
    const machineCode = stopModalWorker.machineCode;
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.stopWorker(workerId);
      setSuccessMsg(res.message || `Worker ${machineCode} execution stopped.`);
      setStopModalWorker(null);
      loadWorkers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to stop worker ${machineCode}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResumeWorker = async (workerId: string, machineCode: string) => {
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.resumeWorker(workerId);
      setSuccessMsg(res.message || `Worker ${machineCode} execution resumed.`);
      loadWorkers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to resume worker ${machineCode}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  };

  const totalPaired = workers.filter((w) => w.pairingStatus === 'PAIRED').length;
  const runningCount = workers.filter((w) => w.desiredState === 'RUNNING').length;
  const stoppedCount = workers.filter((w) => w.desiredState === 'STOPPED' || w.desiredState === 'STOPPING').length;
  const disconnectedCount = workers.filter((w) => w.isDisconnected).length;

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
            Super Admin push/stop/resume controls, pairing approvals, heartbeat health, and execution safeguards
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
        <div className="flex items-center gap-2.5 rounded-panel border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-panel border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-900 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Fleet Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Total Paired</span>
          <p className="font-mono text-2xl font-bold text-text-primary mt-1">{totalPaired}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Approved terminals</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Execution Running</span>
          <p className="font-mono text-2xl font-bold text-emerald-700 mt-1">{runningCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Authorized for job claims</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Execution Stopped</span>
          <p className="font-mono text-2xl font-bold text-rose-700 mt-1">{stoppedCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Paused by Super Admin</p>
        </div>
        <div className="rounded-card border border-border-default bg-white p-4 shadow-subtle">
          <span className="text-[11px] font-bold text-secondary-500 uppercase tracking-wider">Disconnected</span>
          <p className="font-mono text-2xl font-bold text-amber-700 mt-1">{disconnectedCount}</p>
          <p className="text-[11px] text-secondary-500 mt-0.5">Heartbeat &gt; 45s ago</p>
        </div>
      </div>

      {/* Fleet Grid */}
      {workers.length === 0 ? (
        <div className="rounded-card border border-border-default bg-white p-12">
          <EmptyState
            title="No worker machines registered"
            description="Authorize worker terminals by providing their 6-character pairing code."
            action={{
              label: 'Pair Worker Machine',
              onClick: () => setPairingModalOpen(true),
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((w) => {
            const isUnpaired = w.pairingStatus === 'UNPAIRED';
            const isRunning = w.desiredState === 'RUNNING';
            const isStopping = w.desiredState === 'STOPPING';
            const isStopped = w.desiredState === 'STOPPED' || (!isRunning && !isStopping && !isUnpaired);
            const isDisconnected = w.isDisconnected;
            const cpu = w.cpuUsage || 0;
            const ram = w.memoryUsage || 0;
            const isLoading = actionLoadingId === w.id;

            return (
              <div
                key={w.id}
                className={`rounded-card border ${
                  isDisconnected
                    ? 'border-amber-300 bg-amber-50/10'
                    : isRunning
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-border-default'
                } bg-white p-5 shadow-subtle space-y-4 transition-colors`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-mono font-bold text-text-primary">{w.machineCode}</h3>
                      {/* Pairing Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isUnpaired
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-neutral-100 text-secondary-700 border-neutral-200'
                        }`}
                      >
                        {isUnpaired ? 'UNPAIRED' : 'PAIRED'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-500 mt-0.5">{w.machineName}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-btn bg-neutral-100 text-secondary-600">
                    <Server className="h-4 w-4" />
                  </div>
                </div>

                {/* State Indicator Blocks */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-neutral-50/80 border border-neutral-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider block">Admin Control</span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[11px] mt-0.5 px-2 py-0.5 rounded ${
                        isRunning
                          ? 'bg-emerald-100/80 text-emerald-800'
                          : isStopping
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isStopped
                          ? 'bg-rose-100/80 text-rose-800'
                          : 'bg-neutral-200 text-secondary-700'
                      }`}
                    >
                      {isRunning && <Play className="h-2.5 w-2.5 fill-current" />}
                      {isStopping && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                      {isStopped && <Square className="h-2.5 w-2.5 fill-current" />}
                      {w.desiredState || 'STOPPED'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider block">Worker Telemetry</span>
                    <div className="mt-0.5">
                      <StateBadge status={w.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Disconnected Notice */}
                {isDisconnected && (
                  <div className="flex items-start gap-2 p-2.5 rounded border border-amber-200 bg-amber-50/80 text-[11px] text-amber-900 leading-snug">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Worker Disconnected:</strong> Heartbeat is {getTimeAgo(w.lastHeartbeat)}. Server will enforce control, but worker process has not acknowledged.
                    </span>
                  </div>
                )}

                {/* In-Flight Job Badge */}
                {w.currentJobId && (
                  <div className="flex items-center gap-1.5 p-2 rounded border border-blue-200 bg-blue-50/80 text-[11px] text-blue-900 font-mono">
                    <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                    <span>In-Flight Job: #{w.currentJobId.slice(0, 12)}...</span>
                  </div>
                )}

                {/* Telemetry Meters */}
                <div className="space-y-2 border-t border-border-subtle pt-3">
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
                        style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}
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
                        style={{ width: `${Math.min(100, Math.max(0, ram))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-secondary-400 uppercase font-semibold">Last Heartbeat</span>
                    <p className="font-semibold text-text-primary mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-secondary-400" />
                      {getTimeAgo(w.lastHeartbeat)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-secondary-400 uppercase font-semibold">Operator Share</span>
                    <p className="font-mono font-bold text-emerald-700 mt-0.5">{formatCurrency(w.operatorShareBalance || 0)}</p>
                  </div>
                </div>

                {/* Administrative Execution Controls */}
                <div className="border-t border-border-subtle pt-3">
                  {isUnpaired ? (
                    <button
                      onClick={() => {
                        setPairingCode(w.pairingCode || '');
                        setPairingModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-btn bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors shadow-subtle"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Approve / Pair Worker</span>
                    </button>
                  ) : isRunning ? (
                    <button
                      disabled={isLoading}
                      onClick={() => setStopModalWorker(w)}
                      className="w-full flex items-center justify-center gap-2 rounded-btn bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-xs font-semibold transition-colors shadow-subtle disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Square className="h-3.5 w-3.5 fill-current" />
                      )}
                      <span>Stop Worker Execution</span>
                    </button>
                  ) : isStopping ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-btn bg-amber-500 text-white px-3 py-2 text-xs font-semibold cursor-not-allowed opacity-80"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Stopping (Waiting for In-Flight Job)...</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={isLoading}
                        onClick={() => handleStartWorker(w.id, w.machineCode)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold transition-colors shadow-subtle disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                        <span>Push / Start Worker</span>
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => handleResumeWorker(w.id, w.machineCode)}
                        className="rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Resume Execution"
                      >
                        Resume
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infrastructure vs Execution Informational Card */}
      <div className="rounded-card border border-neutral-200 bg-neutral-50/80 p-4 text-xs text-secondary-600 leading-relaxed flex items-start gap-3">
        <Info className="h-5 w-5 text-secondary-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary block font-semibold mb-0.5">
            Application-Level Execution Control vs Container Lifecycle
          </strong>
          Super Admin Push, Stop, and Resume actions operate at the worker application engine level. Stopping immediately disables new job claims and calendar discovery on the central server while allowing any in-flight booking to conclude safely. The Railway container remains active for telemetry, heartbeat reporting, and instant administrative resumption without cold-boot delays.
        </div>
      </div>

      {/* Stop Confirmation Dialog */}
      {stopModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-panel bg-white p-6 border border-border-default shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-bold text-text-primary">
                  Confirm Stop Worker: {stopModalWorker.machineCode}
                </h3>
              </div>
              <button
                onClick={() => setStopModalWorker(null)}
                className="text-secondary-400 hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary-600 mb-4 leading-relaxed">
              Are you sure you want to stop worker <strong className="font-mono text-text-primary">{stopModalWorker.machineCode}</strong> ({stopModalWorker.machineName})?
            </p>

            <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/80 mb-5 space-y-2 text-xs text-secondary-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Immediate Server Block:</strong> New job claims and calendar discovery will halt immediately.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Safe In-Flight Conclusion:</strong> Any booking currently executing will safely finish its transaction before the worker becomes idle.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Financial Integrity:</strong> Wallet holds, account locks, and financial ledger records remain protected.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setStopModalWorker(null)}
                className="rounded-btn border border-border-default px-4 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === stopModalWorker.id}
                onClick={handleConfirmStopWorker}
                className="rounded-btn bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                {actionLoadingId === stopModalWorker.id ? 'Stopping...' : 'Confirm Stop Worker'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pairing Modal */}
      {pairingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
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
              When launching the TicketAssist Worker on a local terminal or Railway demo container, it displays a pairing code (e.g. <strong className="font-mono text-text-primary">TA-4829</strong>). Enter the pairing code below to approve the machine:
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
                  {pairingLoading ? 'Approving...' : 'Approve Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
