'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';
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
  Trash2,
  KeyRound,
  Eye,
  Search,
  Activity,
  FileText,
  Copy,
  Check,
  Cpu,
  HardDrive,
  X,
  Radio,
  RotateCcw,
  Layers,
  Sliders,
  Box,
  Laptop,
  Cloud,
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';

interface FleetSummary {
  totalWorkers?: number;
  total?: number;
  onlineWorkers?: number;
  online?: number;
  offlineWorkers?: number;
  offline?: number;
  availableWorkers?: number;
  busyWorkers?: number;
  localPcWorkers?: number;
  cloudVmWorkers?: number;
  dockerWorkers?: number;
  totalCapacity?: number;
  totalActiveJobs?: number;
  enabledWorkers?: number;
  enabled?: number;
  disabledWorkers?: number;
  disabled?: number;
  monitorOnlyWorkers?: number;
  monitorOnly?: number;
  executingWorkers?: number;
  executing?: number;
  awaitingHumanWorkers?: number;
  awaitingHuman?: number;
  unhealthyWorkers?: number;
  unhealthy?: number;
  queuedJobs: number;
  staleLeases: number;
}

export default function WorkerFleetPage() {
  const [activeTab, setActiveTab] = useState<'workers' | 'logs' | 'allocations' | 'diagnostics'>('workers');
  const [workers, setWorkers] = useState<any[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Job Allocations state
  const [allocations, setAllocations] = useState<any[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [allocationsTotal, setAllocationsTotal] = useState(0);
  const [allocationStatusFilter, setAllocationStatusFilter] = useState('ALL');
  const [selectedAllocationLog, setSelectedAllocationLog] = useState<any | null>(null);

  // Capacity Configuration Modal
  const [capacityModal, setCapacityModal] = useState<{
    open: boolean;
    worker: any | null;
    maxConcurrentJobs: number;
    deploymentType: string;
    capabilities: string[];
    loading: boolean;
  }>({
    open: false,
    worker: null,
    maxConcurrentJobs: 1,
    deploymentType: 'LOCAL_PC',
    capabilities: ['ACCOUNT_VERIFICATION', 'BOOKING_EXECUTION'],
    loading: false,
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals & Drawers
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [addWorkerTab, setAddWorkerTab] = useState<'pair' | 'generate'>('pair');
  const [newWorkerCode, setNewWorkerCode] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerVersion, setNewWorkerVersion] = useState('1.0.0');
  const [createdWorkerResult, setCreatedWorkerResult] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Terminal pairing form fields
  const [approvePairingCode, setApprovePairingCode] = useState('');
  const [pairWorkerName, setPairWorkerName] = useState('');
  const [pairMachineCode, setPairMachineCode] = useState('');
  const [pairLocation, setPairLocation] = useState('');
  const [pairDescription, setPairDescription] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);

  // Consequential Action Modal (Disable, Pause, Revoke, Retire, Delete)
  const [actionModal, setActionModal] = useState<{
    type: 'DISABLE' | 'PAUSE' | 'REVOKE' | 'RETIRE' | 'DRAIN' | 'DELETE' | null;
    worker: any | null;
    reason: string;
    loading: boolean;
  }>({
    type: null,
    worker: null,
    reason: '',
    loading: false,
  });

  // Worker Logs Drawer
  const [selectedWorkerForLogs, setSelectedWorkerForLogs] = useState<any | null>(null);
  const [workerLogs, setWorkerLogs] = useState<any[]>([]);
  const [workerLogsLoading, setWorkerLogsLoading] = useState(false);
  const [logSeverityFilter, setLogSeverityFilter] = useState('ALL');
  const [logEventTypeFilter, setLogEventTypeFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  // Global Fleet Logs
  const [fleetLogs, setFleetLogs] = useState<any[]>([]);
  const [fleetLogsLoading, setFleetLogsLoading] = useState(false);
  const [fleetLogPage, setFleetLogPage] = useState(1);
  const [fleetLogTotal, setFleetLogTotal] = useState(0);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Workers & Summary & Diagnostics
  const loadFleetData = async () => {
    try {
      const [workersData, summaryData, diagData] = await Promise.all([
        api.getWorkers(),
        api.getFleetSummary(),
        api.getQueueAndWorkerDiagnostics().catch(() => null),
      ]);
      setWorkers(workersData || []);
      setSummary(summaryData || null);
      if (diagData) setDiagnostics(diagData);
      setLoading(false);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Failed to load fleet data:', err);
      setLoading(false);
      if (err.message?.includes('User not found') || err.message?.includes('token invalid') || err.message?.includes('401')) {
        setErrorMsg('Administrative session expired or database was reseeded. Please log in again to refresh your session.');
      } else {
        setErrorMsg(err.message || 'Failed to load fleet telemetry');
      }
    }
  };

  // Load Worker Logs
  const loadWorkerLogs = async (workerId: string, page = 1) => {
    setWorkerLogsLoading(true);
    try {
      const res = await api.getWorkerActivityLogs(workerId, {
        page,
        limit: 20,
        severity: logSeverityFilter,
        eventType: logEventTypeFilter,
        search: logSearchQuery,
      });
      setWorkerLogs(res.logs || []);
      setLogTotal(res.total || 0);
      setLogPage(page);
    } catch (err) {
      console.error('Failed to load worker logs:', err);
    } finally {
      setWorkerLogsLoading(false);
    }
  };

  // Load Fleet Stream Logs
  const loadFleetLogs = async (page = 1) => {
    setFleetLogsLoading(true);
    try {
      const res = await api.getFleetActivityLogs({
        page,
        limit: 25,
        severity: logSeverityFilter,
        eventType: logEventTypeFilter,
        search: logSearchQuery,
      });
      setFleetLogs(res.logs || []);
      setFleetLogTotal(res.total || 0);
      setFleetLogPage(page);
    } catch (err) {
      console.error('Failed to load fleet logs:', err);
    } finally {
      setFleetLogsLoading(false);
    }
  };

  // Load Allocation History
  const loadAllocations = async (status = allocationStatusFilter) => {
    setAllocationsLoading(true);
    try {
      const res = await api.getJobAllocations({
        status: status !== 'ALL' ? status : undefined,
        limit: 50,
      });
      setAllocations(res?.logs || []);
      setAllocationsTotal(res?.total || 0);
    } catch (err) {
      console.error('Failed to load allocation logs:', err);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capacityModal.worker) return;
    setCapacityModal((prev) => ({ ...prev, loading: true }));
    setErrorMsg(null);
    try {
      await api.updateWorkerCapacity(capacityModal.worker.id, {
        maxConcurrentJobs: capacityModal.maxConcurrentJobs,
        deploymentType: capacityModal.deploymentType,
        capabilities: capacityModal.capabilities,
      });
      setSuccessMsg(`Capacity updated for ${capacityModal.worker.machineCode}: Max Concurrency = ${capacityModal.maxConcurrentJobs}, Type = ${capacityModal.deploymentType}`);
      setCapacityModal((prev) => ({ ...prev, open: false, loading: false }));
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update worker capacity');
      setCapacityModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleTriggerSweep = async () => {
    try {
      const res = await api.triggerAllocationSweep();
      setSuccessMsg(`Smart allocation sweep completed. ${res?.allocatedCount ?? 0} jobs assigned.`);
      loadFleetData();
      if (activeTab === 'allocations') loadAllocations();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Allocation sweep failed');
    }
  };

  const handleTriggerRecovery = async () => {
    try {
      const res = await api.triggerStaleLeaseRecovery();
      setSuccessMsg(`Stale lease recovery completed. Recovered: ${res?.recoveredCount ?? 0}, Requires Human Review: ${res?.humanReviewCount ?? 0}`);
      loadFleetData();
      if (activeTab === 'allocations') loadAllocations();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lease recovery failed');
    }
  };

  useEffect(() => {
    loadFleetData();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadFleetData();
      if (selectedWorkerForLogs) {
        loadWorkerLogs(selectedWorkerForLogs.id, logPage);
      }
      if (activeTab === 'logs') {
        loadFleetLogs(fleetLogPage);
      }
      if (activeTab === 'allocations') {
        loadAllocations();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedWorkerForLogs?.id, logPage, logSeverityFilter, logEventTypeFilter, activeTab, fleetLogPage, allocationStatusFilter]);

  // When opening logs drawer
  const handleOpenLogsDrawer = (worker: any) => {
    setSelectedWorkerForLogs(worker);
    setLogPage(1);
    loadWorkerLogs(worker.id, 1);
  };

  // Switch tabs
  useEffect(() => {
    if (activeTab === 'logs') {
      loadFleetLogs(1);
    } else if (activeTab === 'allocations') {
      loadAllocations();
    }
  }, [activeTab, logSeverityFilter, logEventTypeFilter, allocationStatusFilter]);

  // Admin Create Worker (Generate pairing code)
  const handleAdminCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.adminCreateWorker({
        machineCode: newWorkerCode.trim().toUpperCase(),
        machineName: newWorkerName.trim(),
        version: newWorkerVersion.trim(),
      });
      setCreatedWorkerResult(res);
      setSuccessMsg(`Worker registration initiated for ${res.machine.machineCode}. Pairing code generated.`);
      loadFleetData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate worker registration.');
    } finally {
      setPairingLoading(false);
    }
  };

  // Approve Worker-initiated pairing code and assign display name
  const handleApprovePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairingLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.pairWorker({
        pairingCode: approvePairingCode.trim().toUpperCase(),
        machineCode: pairMachineCode.trim().toUpperCase() || undefined,
        machineName: pairWorkerName.trim() || undefined,
        location: pairLocation.trim() || undefined,
        description: pairDescription.trim() || undefined,
      });
      const name = res.machine?.machineName || pairWorkerName || res.machine?.machineCode;
      setSuccessMsg(`Worker '${name}' registered and paired successfully! Awaiting authenticated connection...`);
      setApprovePairingCode('');
      setPairWorkerName('');
      setPairMachineCode('');
      setPairLocation('');
      setPairDescription('');
      setAddWorkerModalOpen(false);
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to pair machine. Check pairing code validity.');
    } finally {
      setPairingLoading(false);
    }
  };

  // Quick Action Handlers
  const handleEnableWorker = async (workerId: string, machineCode: string) => {
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.enableWorker(workerId);
      setSuccessMsg(res.message || `Worker ${machineCode} enabled for job execution.`);
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to enable worker ${machineCode}.`);
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
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to resume worker ${machineCode}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSetMonitorOnly = async (workerId: string, machineCode: string) => {
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.setMonitorOnly(workerId);
      setSuccessMsg(res.message || `Worker ${machineCode} placed in monitor-only mode.`);
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to set monitor-only mode.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDrainWorker = async (workerId: string, machineCode: string) => {
    setActionLoadingId(workerId);
    setErrorMsg(null);
    try {
      const res = await api.drainWorker(workerId);
      setSuccessMsg(res.message || `Graceful drain initiated for ${machineCode}.`);
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to initiate drain.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Consequential Action Modal Submit (Disable, Pause, Revoke, Retire)
  const handleExecuteConsequentialAction = async () => {
    if (!actionModal.type || !actionModal.worker) return;
    const workerId = actionModal.worker.id;
    const machineCode = actionModal.worker.machineCode;
    const reason = actionModal.reason.trim();

    setActionModal((prev) => ({ ...prev, loading: true }));
    setErrorMsg(null);

    try {
      let res: any;
      if (actionModal.type === 'DISABLE') {
        res = await api.disableWorker(workerId, reason);
      } else if (actionModal.type === 'PAUSE') {
        res = await api.pauseWorker(workerId, reason);
      } else if (actionModal.type === 'REVOKE') {
        res = await api.revokeWorker(workerId, reason);
      } else if (actionModal.type === 'RETIRE') {
        res = await api.retireWorker(workerId, reason);
      } else if (actionModal.type === 'DELETE') {
        res = await api.deleteWorker(workerId, reason);
      }

      setSuccessMsg(res?.message || `Action ${actionModal.type} executed on worker ${machineCode}.`);
      setActionModal({ type: null, worker: null, reason: '', loading: false });
      loadFleetData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to execute action on ${machineCode}.`);
      setActionModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Never';
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = w.machineCode?.toLowerCase().includes(q);
        const nameMatch = w.machineName?.toLowerCase().includes(q);
        const jobMatch = w.currentJobId?.toLowerCase().includes(q);
        const bookingMatch = w.currentBookingId?.toLowerCase().includes(q);
        const actMatch = w.currentActivity?.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !jobMatch && !bookingMatch && !actMatch) {
          return false;
        }
      }

      if (adminStatusFilter !== 'ALL' && w.adminStatus !== adminStatusFilter) {
        return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ONLINE' && w.isDisconnected) return false;
        if (statusFilter === 'OFFLINE' && !w.isDisconnected) return false;
        if (statusFilter === 'RUNNING' && w.desiredState !== 'RUNNING') return false;
        if (statusFilter === 'STOPPED' && w.desiredState !== 'STOPPED') return false;
        if (statusFilter === 'PAUSED' && w.desiredState !== 'PAUSED') return false;
        if (statusFilter === 'MONITOR_ONLY' && w.desiredState !== 'MONITOR_ONLY') return false;
      }

      if (activityFilter !== 'ALL' && w.currentActivity !== activityFilter) {
        return false;
      }

      return true;
    });
  }, [workers, searchQuery, adminStatusFilter, statusFilter, activityFilter]);

  // Activity Badge Formatter
  const renderActivityBadge = (worker: any) => {
    const act = worker.currentActivity || 'IDLE';
    const isStalled = worker.progressStalled;

    let badgeClass = 'bg-neutral-100 text-secondary-700 border-neutral-200';
    let dotClass = 'bg-neutral-400';
    let label = act.replace(/_/g, ' ');

    if (act === 'IDLE') {
      badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotClass = 'bg-emerald-500';
      label = 'Idle • Ready for work';
    } else if (act === 'DISCOVERING_AVAILABILITY') {
      badgeClass = 'bg-sky-50 text-sky-800 border-sky-200';
      dotClass = 'bg-sky-500 animate-pulse';
      label = 'Scanning Availability';
    } else if (act === 'PROCESSING_JOB') {
      badgeClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      dotClass = 'bg-indigo-600 animate-ping';
      label = 'Executing Booking Job';
    } else if (act === 'NAVIGATING_PORTAL') {
      badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
      dotClass = 'bg-purple-500 animate-pulse';
      label = 'Navigating Portal';
    } else if (act === 'WAITING_HUMAN_INTERVENTION') {
      badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
      dotClass = 'bg-amber-600 animate-bounce';
      label = 'Needs Human Intervention';
    } else if (act === 'VERIFYING_RESULT') {
      badgeClass = 'bg-cyan-50 text-cyan-800 border-cyan-200';
      dotClass = 'bg-cyan-500 animate-pulse';
      label = 'Verifying Booking';
    } else if (act === 'DRAINING') {
      badgeClass = 'bg-orange-50 text-orange-800 border-orange-200';
      dotClass = 'bg-orange-500';
      label = 'Draining (Finishing Job)';
    } else if (act === 'OFFLINE') {
      badgeClass = 'bg-neutral-100 text-neutral-600 border-neutral-300';
      dotClass = 'bg-neutral-400';
      label = 'Offline';
    }

    return (
      <div className="flex flex-col gap-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeClass}`}>
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          <span>{label}</span>
          {worker.activityElapsedSec > 0 && (
            <span className="text-[10px] font-mono opacity-80">({formatDuration(worker.activityElapsedSec)})</span>
          )}
        </span>

        {isStalled && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            Execution Stalled (&gt; 5m no progress)
          </span>
        )}

        {worker.activityDetails && (
          <span className="text-[11px] text-secondary-600 italic truncate max-w-xs" title={worker.activityDetails}>
            &ldquo;{worker.activityDetails}&rdquo;
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12 w-full px-2 sm:px-4">
      {/* 1. Page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-text-primary">Worker PC Fleet Telemetry &amp; Controls</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-secondary-500 mt-1">
            Real-time machine telemetry, cryptographic pairing, administrative lifecycle enforcement &amp; activity timeline logs
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-neutral-50 border-neutral-200 text-secondary-600'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-pulse text-emerald-600' : 'text-neutral-400'}`} />
            <span>{autoRefresh ? 'Live Sync (5s)' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={loadFleetData}
            className="flex h-9 w-9 items-center justify-center rounded-btn border border-border-default bg-white text-secondary-600 hover:bg-neutral-50 hover:text-text-primary transition-colors shadow-subtle"
            title="Refresh Fleet Data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Smart Allocator Controls */}
          <button
            onClick={handleTriggerSweep}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-subtle"
            title="Evaluate and automatically assign queued jobs to best available workers"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Allocate Queue</span>
          </button>

          <button
            onClick={handleTriggerRecovery}
            className="flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shadow-subtle"
            title="Safely recover expired reservations and leases"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Recover Leases</span>
          </button>

          {/* Prominent Add/Pair Worker Button */}
          <button
            onClick={() => {
              setCreatedWorkerResult(null);
              setAddWorkerModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-btn bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-subtle border border-amber-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Add / Pair Worker Machine</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-panel border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-panel border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-900 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Fleet Overview Metrics (10 Counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        <div className="rounded-card border border-border-default bg-white p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wider">Total</span>
          <p className="font-mono text-xl font-bold text-text-primary mt-1">{summary?.total ?? workers.length}</p>
          <span className="text-[10px] text-secondary-400">Registered</span>
        </div>

        <div className="rounded-card border border-emerald-200 bg-emerald-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
          <p className="font-mono text-xl font-bold text-emerald-700 mt-1">{summary?.online ?? 0}</p>
          <span className="text-[10px] text-emerald-600/80">&lt;45s Heartbeat</span>
        </div>

        <div className="rounded-card border border-neutral-200 bg-neutral-50/50 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wider">Offline</span>
          <p className="font-mono text-xl font-bold text-secondary-600 mt-1">{summary?.offline ?? 0}</p>
          <span className="text-[10px] text-secondary-400">No heartbeat</span>
        </div>

        <div className="rounded-card border border-blue-200 bg-blue-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Enabled</span>
          <p className="font-mono text-xl font-bold text-blue-800 mt-1">{summary?.enabled ?? 0}</p>
          <span className="text-[10px] text-blue-600/80">Authorized</span>
        </div>

        <div className="rounded-card border border-rose-200 bg-rose-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Disabled</span>
          <p className="font-mono text-xl font-bold text-rose-800 mt-1">{summary?.disabled ?? 0}</p>
          <span className="text-[10px] text-rose-600/80">Admin stopped</span>
        </div>

        <div className="rounded-card border border-purple-200 bg-purple-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Monitor Only</span>
          <p className="font-mono text-xl font-bold text-purple-800 mt-1">{summary?.monitorOnly ?? 0}</p>
          <span className="text-[10px] text-purple-600/80">Discovery only</span>
        </div>

        <div className="rounded-card border border-indigo-200 bg-indigo-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Executing</span>
          <p className="font-mono text-xl font-bold text-indigo-800 mt-1">{summary?.executing ?? 0}</p>
          <span className="text-[10px] text-indigo-600/80">In-flight jobs</span>
        </div>

        <div className="rounded-card border border-amber-200 bg-amber-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Awaiting Human</span>
          <p className="font-mono text-xl font-bold text-amber-800 mt-1">{summary?.awaitingHuman ?? 0}</p>
          <span className="text-[10px] text-amber-600/80">OTP / CAPTCHA</span>
        </div>

        <div className="rounded-card border border-rose-200 bg-rose-50/20 p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Unhealthy</span>
          <p className="font-mono text-xl font-bold text-rose-700 mt-1">{summary?.unhealthy ?? 0}</p>
          <span className="text-[10px] text-rose-600/80">Stalled / Errors</span>
        </div>

        <div className="rounded-card border border-border-default bg-white p-3 shadow-subtle">
          <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-wider">Queued / Stale</span>
          <p className="font-mono text-xl font-bold text-text-primary mt-1">
            {summary?.queuedJobs ?? 0}
            <span className="text-xs text-rose-600 font-normal ml-1">({summary?.staleLeases ?? 0} stale)</span>
          </p>
          <span className="text-[10px] text-secondary-400">Queue health</span>
        </div>
      </div>

      {/* 3. Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border-subtle pt-2">
        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'workers'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-secondary-600 hover:text-text-primary'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Worker Machines ({filteredWorkers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'allocations'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-secondary-600 hover:text-text-primary'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Job Allocation Decisions</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-mono px-1.5 py-0.5 rounded-full font-bold">
            Smart Allocator
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-secondary-600 hover:text-text-primary'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Fleet Activity Log Stream</span>
          <span className="text-[10px] bg-neutral-100 text-secondary-700 font-mono px-1.5 py-0.5 rounded-full">
            Realtime
          </span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'diagnostics'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-secondary-600 hover:text-text-primary'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Execution &amp; Queue Diagnostics</span>
          {diagnostics?.queue?.pendingEligibleCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.5 rounded-full font-bold">
              {diagnostics.queue.pendingEligibleCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* Actionable Queue & Worker Diagnostics Strip */}
      {diagnostics && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wide uppercase text-slate-200">
                Actionable Execution &amp; Queue Diagnostics
              </span>
              <span className="text-[10.5px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono">
                Smart Allocator: Active (30s background sweep)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Telemetry Timestamp: <strong className="text-white font-mono">{new Date(diagnostics.timestamp).toLocaleTimeString()}</strong></span>
              <button
                onClick={loadFleetData}
                className="text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-semibold underline text-[11px]"
              >
                <RefreshCw className="h-3 w-3" /> Refresh Diagnostics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Pending Eligible Bookings */}
            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Pending Eligible Bookings
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-bold font-mono ${diagnostics.queue.pendingEligibleCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {diagnostics.queue.pendingEligibleCount}
                  </span>
                  <span className="text-[11px] text-slate-400">awaiting execution</span>
                </div>
              </div>
              {diagnostics.queue.oldestPendingJob ? (
                <div className="mt-2 text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-700/40 text-amber-200">
                  Oldest: <strong>{diagnostics.queue.oldestPendingJob.ageSec}s</strong> (#{diagnostics.queue.oldestPendingJob.bookingCode || diagnostics.queue.oldestPendingJob.id.slice(0, 8)})
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-emerald-400 font-medium">✓ No backlogged bookings</div>
              )}
            </div>

            {/* 2. Effective Concurrency & Fleet Capacity */}
            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Effective Fleet Capacity
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {diagnostics.fleetCapacity.freeExecutionSlots} / {diagnostics.fleetCapacity.totalExecutionSlots}
                  </span>
                  <span className="text-[11px] text-slate-400">slots available</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-700/40 text-slate-300">
                Eligible Workers: <strong className="text-emerald-300">{diagnostics.fleetCapacity.onlineEligibleWorkers}</strong> of {diagnostics.fleetCapacity.totalWorkers}
              </div>
            </div>

            {/* 3. Stale Leases & Human Review */}
            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Queue Health &amp; Leases
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-bold font-mono ${diagnostics.queue.staleLeasesCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {diagnostics.queue.staleLeasesCount}
                  </span>
                  <span className="text-[11px] text-slate-400">stale leases</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-700/40 text-slate-300">
                Awaiting Human: <strong className="text-amber-300">{diagnostics.queue.requiresHumanCount}</strong> (CAPTCHA/OTP)
              </div>
            </div>

            {/* 4. Allocator Decisions & Outcomes */}
            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Last Allocator Decision
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    diagnostics.allocator.lastAllocationStatus === 'ALLOCATED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : diagnostics.allocator.lastAllocationStatus === 'NO_WORKER_AVAILABLE'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}>
                    {diagnostics.allocator.lastAllocationStatus || 'READY'}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-700/40 text-slate-300 truncate" title={diagnostics.allocator.lastAllocationDecision}>
                {diagnostics.allocator.lastAllocationDecision || 'Auto-sweeping queue every 30s'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workers' ? (
        <div className="space-y-4">
          {/* Filter and Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-card border border-border-default shadow-subtle">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="h-4 w-4 text-secondary-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search machine code, name, job ID, or activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-default bg-neutral-50 focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Admin Status Filter */}
              <select
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">Admin Status: All</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
                <option value="REVOKED">Revoked</option>
                <option value="RETIRED">Retired</option>
              </select>

              {/* State Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">State: All</option>
                <option value="ONLINE">Online Only</option>
                <option value="OFFLINE">Offline Only</option>
                <option value="RUNNING">Running</option>
                <option value="PAUSED">Paused</option>
                <option value="MONITOR_ONLY">Monitor Only</option>
                <option value="STOPPED">Stopped</option>
              </select>

              {/* Activity Filter */}
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">Activity: All</option>
                <option value="IDLE">Idle</option>
                <option value="PROCESSING_JOB">Processing Job</option>
                <option value="DISCOVERING_AVAILABILITY">Discovering Availability</option>
                <option value="NAVIGATING_PORTAL">Navigating Portal</option>
                <option value="WAITING_HUMAN_INTERVENTION">Awaiting Human</option>
                <option value="VERIFYING_RESULT">Verifying Result</option>
                <option value="DRAINING">Draining</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-btn border border-border-default overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1.5 text-xs font-semibold ${
                    viewMode === 'cards' ? 'bg-neutral-100 text-text-primary' : 'bg-white text-secondary-500'
                  }`}
                  title="Card View"
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 text-xs font-semibold ${
                    viewMode === 'table' ? 'bg-neutral-100 text-text-primary' : 'bg-white text-secondary-500'
                  }`}
                  title="Table View"
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Workers Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-card border border-border-default bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-2" />
              <p className="text-xs text-secondary-500">Synchronizing fleet telemetry...</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="rounded-card border border-border-default bg-white p-12">
              <EmptyState
                title="No worker machines found"
                description={
                  searchQuery || statusFilter !== 'ALL' || adminStatusFilter !== 'ALL'
                    ? 'No machines match the selected filter criteria. Try resetting filters.'
                    : 'Authorize new worker terminals by initiating pairing with their unique machine code.'
                }
                action={{
                  label: 'Add / Pair Worker Machine',
                  onClick: () => {
                    setCreatedWorkerResult(null);
                    setAddWorkerModalOpen(true);
                  },
                }}
              />
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View: 3 cards per row in column mode */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {filteredWorkers.map((w) => {
                const isUnpaired = w.pairingStatus === 'UNPAIRED' || w.desiredState === 'UNPAIRED';
                const isRunning = w.desiredState === 'RUNNING';
                const isStopping = w.desiredState === 'STOPPING';
                const isPaused = w.desiredState === 'PAUSED';
                const isMonitorOnly = w.desiredState === 'MONITOR_ONLY';
                const isStopped = w.desiredState === 'STOPPED' || (!isRunning && !isStopping && !isUnpaired && !isPaused && !isMonitorOnly);
                const isDisconnected = w.isDisconnected;
                const isAdminDisabled = w.adminStatus === 'DISABLED';
                const isRevoked = w.adminStatus === 'REVOKED';
                const isRetired = w.adminStatus === 'RETIRED';

                const cpu = w.cpuUsage || 0;
                const ram = w.memoryUsage || 0;
                const isLoading = actionLoadingId === w.id;

                return (
                  <div
                    key={w.id}
                    className={`rounded-2xl border transition-all duration-200 ${
                      isRevoked || isRetired
                        ? 'border-neutral-300 bg-neutral-50/70 shadow-xs'
                        : isDisconnected
                        ? 'border-amber-300 bg-amber-50/15 shadow-xs'
                        : isRunning
                        ? 'border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
                        : 'border-border-default shadow-sm hover:shadow-md'
                    } bg-white p-5 space-y-4 flex flex-col justify-between`}
                  >
                    <div className="space-y-4">
                      {/* 1. Card Header */}
                      <div className="flex items-start justify-between gap-2.5 pb-3.5 border-b border-border-subtle">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border shrink-0 ${
                              isRunning
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs'
                                : isStopping || isPaused
                                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-2xs'
                                : isDisconnected
                                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                                : 'bg-neutral-100 border-neutral-200 text-secondary-600'
                            }`}
                          >
                            {w.deploymentType === 'CLOUD_VM' ? (
                              <Cloud className="h-5 w-5 text-sky-600" />
                            ) : w.deploymentType === 'DOCKER' ? (
                              <Box className="h-5 w-5 text-teal-600" />
                            ) : (
                              <Laptop className="h-5 w-5 text-amber-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <h3 className="text-base font-mono font-extrabold text-text-primary tracking-tight">
                                {w.machineCode}
                              </h3>
                              {/* Deployment Type Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                  w.deploymentType === 'CLOUD_VM'
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : w.deploymentType === 'DOCKER'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                <span>{w.deploymentType || 'LOCAL_PC'}</span>
                              </span>

                              {/* Admin Status Pill */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  w.adminStatus === 'ENABLED'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : w.adminStatus === 'DISABLED'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : w.adminStatus === 'REVOKED'
                                    ? 'bg-red-100 text-red-900 border-red-300 font-mono'
                                    : w.adminStatus === 'RETIRED'
                                    ? 'bg-neutral-200 text-neutral-800 border-neutral-300 font-mono'
                                    : 'bg-neutral-100 text-secondary-700 border-neutral-200'
                                }`}
                              >
                                {w.adminStatus || 'ENABLED'}
                              </span>

                              {isUnpaired && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                  UNPAIRED
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-secondary-500 mt-0.5 truncate flex items-center gap-1.5">
                              <span className="font-medium text-text-secondary truncate">{w.machineName}</span>
                              {w.ipAddress && (
                                <span className="text-[10.5px] text-secondary-400 font-mono shrink-0">• {w.ipAddress}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Top Right Quick Header Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              setCapacityModal({
                                open: true,
                                worker: w,
                                maxConcurrentJobs: w.maxConcurrentJobs ?? 1,
                                deploymentType: w.deploymentType || 'LOCAL_PC',
                                capabilities:
                                  w.capabilities && w.capabilities.length > 0
                                    ? w.capabilities
                                    : ['ACCOUNT_VERIFICATION', 'BOOKING_EXECUTION'],
                                loading: false,
                              })
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-btn border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition-colors shadow-2xs"
                            title="Configure Capacity & Deployment"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>{w.maxConcurrentJobs ?? 1} Max</span>
                          </button>

                          <button
                            onClick={() => handleOpenLogsDrawer(w)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 text-[11px] font-semibold transition-colors shadow-2xs"
                            title="View Worker Activity Logs"
                          >
                            <FileText className="h-3 w-3 text-brand-600" />
                            <span>Logs</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. States & Current Activity */}
                      <div className="space-y-2.5">
                        {/* Desired & Authoritative State Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-neutral-50/80 p-2.5 rounded-lg border border-border-subtle">
                            <span className="text-[9.5px] font-bold text-secondary-400 uppercase tracking-wider block mb-1">
                              Desired State
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded ${
                                isRunning
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isStopping
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : isPaused
                                  ? 'bg-amber-100/90 text-amber-800'
                                  : isMonitorOnly
                                  ? 'bg-purple-100 text-purple-800'
                                  : isStopped
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-neutral-200 text-secondary-700'
                              }`}
                            >
                              {isRunning && <Play className="h-2.5 w-2.5 fill-current" />}
                              {isStopping && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                              {isPaused && <Pause className="h-2.5 w-2.5" />}
                              {isStopped && <Square className="h-2.5 w-2.5 fill-current" />}
                              {w.desiredState || 'STOPPED'}
                            </span>
                          </div>

                          <div className="bg-neutral-50/80 p-2.5 rounded-lg border border-border-subtle">
                            <span className="text-[9.5px] font-bold text-secondary-400 uppercase tracking-wider block mb-1">
                              Authoritative
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded truncate max-w-full ${
                                w.authoritativeState === 'ONLINE_BUSY' || w.actualRuntimeState === 'BUSY'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : w.authoritativeState === 'ONLINE_IDLE' || w.actualRuntimeState === 'IDLE'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : w.authoritativeState === 'PAUSED'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : w.authoritativeState === 'DRAINING'
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : 'bg-neutral-200 text-neutral-800'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  w.authoritativeState === 'ONLINE_IDLE'
                                    ? 'bg-emerald-600'
                                    : w.authoritativeState === 'ONLINE_BUSY'
                                    ? 'bg-amber-600 animate-pulse'
                                    : 'bg-neutral-500'
                                }`}
                              />
                              <span className="truncate">{w.authoritativeState || w.actualRuntimeState || (isDisconnected ? 'OFFLINE' : 'ONLINE_IDLE')}</span>
                            </span>
                          </div>
                        </div>

                        {/* Current Activity Box */}
                        <div className="bg-neutral-50/80 p-2.5 rounded-lg border border-border-subtle space-y-1.5">
                          <span className="text-[9.5px] font-bold text-secondary-400 uppercase tracking-wider block">
                            Current Activity
                          </span>
                          {renderActivityBadge(w)}
                        </div>

                        {w.exclusionReason && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10.5px] text-amber-900 leading-tight">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong>Excluded:</strong> {w.exclusionReason}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Capacity & Telemetry */}
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/80 space-y-2.5">
                        {/* Concurrency Meter */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-secondary-600 flex items-center gap-1.5 text-[11px]">
                              <Layers className="h-3.5 w-3.5 text-indigo-600" /> Active Concurrency:
                            </span>
                            <span className="font-mono font-bold text-text-primary text-[11.5px]">
                              {w.currentActiveJobs ?? 0} / {w.maxConcurrentJobs ?? 1} Max
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-200/70 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                (w.currentActiveJobs ?? 0) >= (w.maxConcurrentJobs ?? 1)
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, (((w.currentActiveJobs ?? 0) / (w.maxConcurrentJobs ?? 1)) * 100)))}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* CPU & RAM Telemetry - 2 Column Side-by-Side */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border-subtle">
                          <div>
                            <div className="flex justify-between text-[10.5px] text-secondary-600 mb-1">
                              <span className="flex items-center gap-1 truncate">
                                <Cpu className="h-3 w-3 text-secondary-400" /> CPU
                              </span>
                              <span className="font-mono font-bold text-text-primary">{cpu}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-neutral-200/70 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  cpu > 80 ? 'bg-rose-500' : cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, cpu))}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[10.5px] text-secondary-600 mb-1">
                              <span className="flex items-center gap-1 truncate">
                                <HardDrive className="h-3 w-3 text-secondary-400" /> RAM
                              </span>
                              <span className="font-mono font-bold text-text-primary">{ram}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-neutral-200/70 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, ram))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {w.currentJobId && (
                          <div className="p-2 rounded-lg border border-blue-200 bg-blue-50/70 text-xs text-blue-900 font-mono space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] uppercase font-bold text-blue-700">In-Flight:</span>
                              <span className="text-[10.5px] font-bold">{w.currentJobId.slice(0, 14)}...</span>
                            </div>
                            {w.currentBookingId && (
                              <div className="flex items-center justify-between text-[10.5px] text-blue-800">
                                <span>Booking:</span>
                                <span className="font-bold">{w.currentBookingId}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 4. Node Vitals / Health */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-50/80 border border-border-subtle text-center text-xs">
                        <div>
                          <span className="text-[10px] text-secondary-400 font-medium block">Heartbeat</span>
                          <span className="font-semibold text-text-primary text-[11px] inline-flex items-center gap-1 mt-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isDisconnected ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                            {getTimeAgo(w.lastHeartbeat)}
                          </span>
                        </div>
                        <div className="border-x border-border-subtle px-1">
                          <span className="text-[10px] text-secondary-400 font-medium block">Agent</span>
                          <span className="font-mono text-secondary-700 font-semibold text-[11px] mt-0.5 block truncate">
                            {w.version || 'v1.0.0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-secondary-400 font-medium block">Jobs Done</span>
                          <span className="font-mono text-secondary-700 font-bold text-[11px] mt-0.5 block">
                            {w.jobsCompleted ?? 0}
                          </span>
                        </div>
                      </div>

                      {isDisconnected && !isRetired && !isRevoked && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg border border-amber-200 bg-amber-50/90 text-[10.5px] text-amber-900 leading-tight">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>Worker disconnected. Last heartbeat {getTimeAgo(w.lastHeartbeat)}.</span>
                        </div>
                      )}
                    </div>

                    {/* 5. Action Controls Footer */}
                    <div className="border-t border-border-subtle pt-3.5 space-y-2.5">
                      {isRevoked || isRetired ? (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                          <span className="text-xs font-semibold text-secondary-600">
                            Machine {w.adminStatus}.
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={isLoading}
                              onClick={() => handleEnableWorker(w.id, w.machineCode)}
                              className="flex items-center gap-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-subtle disabled:opacity-50"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              <span>Re-Enable</span>
                            </button>
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'DELETE',
                                  worker: w,
                                  reason: '',
                                  loading: false,
                                })
                              }
                              className="flex items-center gap-1 rounded-btn bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 text-xs font-bold transition-colors shadow-subtle"
                              title="Permanently delete worker"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ) : isUnpaired ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setApprovePairingCode(w.pairingCode || '');
                              setPairMachineCode(w.machineCode || '');
                              setPairWorkerName(w.machineName || '');
                              setAddWorkerTab('pair');
                              setAddWorkerModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 rounded-btn bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition-all shadow-subtle border border-amber-600/30"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span>Approve / Pair Worker</span>
                          </button>
                          <button
                            onClick={() =>
                              setActionModal({
                                type: 'DELETE',
                                worker: w,
                                reason: '',
                                loading: false,
                              })
                            }
                            className="p-2 rounded-btn bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold"
                            title="Delete unpaired machine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Primary Execution Control Bar */}
                          <div>
                            {isAdminDisabled ? (
                              <button
                                disabled={isLoading}
                                onClick={() => handleEnableWorker(w.id, w.machineCode)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                )}
                                <span>Enable Worker</span>
                              </button>
                            ) : isRunning ? (
                              <button
                                disabled={isLoading}
                                onClick={() =>
                                  setActionModal({
                                    type: 'DISABLE',
                                    worker: w,
                                    reason: '',
                                    loading: false,
                                  })
                                }
                                className="w-full flex items-center justify-center gap-1.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 fill-current" />
                                )}
                                <span>Stop Execution</span>
                              </button>
                            ) : isStopping ? (
                              <button
                                disabled
                                className="w-full flex items-center justify-center gap-1.5 rounded-btn bg-amber-500 text-white px-4 py-2 text-xs font-bold cursor-not-allowed opacity-80"
                              >
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Draining (Waiting for Job)...</span>
                              </button>
                            ) : isPaused ? (
                              <button
                                disabled={isLoading}
                                onClick={() => handleResumeWorker(w.id, w.machineCode)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Resume Jobs</span>
                              </button>
                            ) : (
                              <button
                                disabled={isLoading}
                                onClick={() => handleResumeWorker(w.id, w.machineCode)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-colors shadow-subtle disabled:opacity-50"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Start Execution</span>
                              </button>
                            )}
                          </div>

                          {/* Secondary Lifecycle Actions */}
                          <div className="flex items-center gap-1.5">
                            {!isAdminDisabled && isRunning && (
                              <button
                                disabled={isLoading}
                                onClick={() =>
                                  setActionModal({
                                    type: 'PAUSE',
                                    worker: w,
                                    reason: '',
                                    loading: false,
                                  })
                                }
                                className="flex-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 py-1.5 text-xs font-semibold shadow-2xs text-center"
                                title="Pause New Job Assignments"
                              >
                                Pause
                              </button>
                            )}

                            {!isAdminDisabled && !isMonitorOnly && (
                              <button
                                disabled={isLoading}
                                onClick={() => handleSetMonitorOnly(w.id, w.machineCode)}
                                className="flex-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 py-1.5 text-xs font-semibold shadow-2xs text-center"
                                title="Set to Monitor Only Mode"
                              >
                                Monitor
                              </button>
                            )}

                            {isRunning && (
                              <button
                                disabled={isLoading}
                                onClick={() => handleDrainWorker(w.id, w.machineCode)}
                                className="flex-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 py-1.5 text-xs font-semibold shadow-2xs text-center"
                                title="Graceful Drain"
                              >
                                Drain
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenLogsDrawer(w)}
                              className="flex-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-800 py-1.5 text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1"
                            >
                              <FileText className="h-3 w-3 text-brand-600" />
                              <span>Logs</span>
                            </button>
                          </div>

                          {/* Consequential Revoke, Retire & Delete Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] gap-2">
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'REVOKE',
                                  worker: w,
                                  reason: '',
                                  loading: false,
                                })
                              }
                              className="text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1 hover:underline"
                              title="Revoke authentication token"
                            >
                              <KeyRound className="h-3 w-3" />
                              Revoke
                            </button>

                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'RETIRE',
                                  worker: w,
                                  reason: '',
                                  loading: false,
                                })
                              }
                              className="text-secondary-500 hover:text-secondary-800 font-semibold flex items-center gap-1 hover:underline"
                              title="Retire from fleet while keeping records"
                            >
                              Retire
                            </button>

                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'DELETE',
                                  worker: w,
                                  reason: '',
                                  loading: false,
                                })
                              }
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors"
                              title="Permanently remove worker and credentials"
                            >
                              <Trash2 className="h-3 w-3 text-rose-600" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-card border border-border-default bg-white overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-border-default text-[11px] font-bold text-secondary-600 uppercase">
                    <tr>
                      <th className="px-4 py-3">Machine</th>
                      <th className="px-4 py-3">Admin Status</th>
                      <th className="px-4 py-3">Desired State</th>
                      <th className="px-4 py-3">Runtime State</th>
                      <th className="px-4 py-3">Current Activity</th>
                      <th className="px-4 py-3">Heartbeat</th>
                      <th className="px-4 py-3">Load (CPU / RAM)</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredWorkers.map((w) => {
                      const isUnpaired = w.pairingStatus === 'UNPAIRED' || w.desiredState === 'UNPAIRED';
                      const isDisconnected = w.isDisconnected;
                      const isRevoked = w.adminStatus === 'REVOKED';
                      const isRetired = w.adminStatus === 'RETIRED';

                      return (
                        <tr key={w.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-text-primary">{w.machineCode}</span>
                              {isUnpaired && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  UNPAIRED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-secondary-500">{w.machineName}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                w.adminStatus === 'ENABLED'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : w.adminStatus === 'DISABLED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : w.adminStatus === 'REVOKED'
                                  ? 'bg-red-100 text-red-900 border-red-300'
                                  : 'bg-neutral-200 text-neutral-800 border-neutral-300'
                              }`}
                            >
                              {w.adminStatus || 'ENABLED'}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold text-text-primary">
                            <span className="font-mono">{w.desiredState || 'STOPPED'}</span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded ${
                                w.actualRuntimeState === 'OFFLINE'
                                  ? 'bg-neutral-100 text-neutral-700'
                                  : w.actualRuntimeState === 'BUSY'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {w.actualRuntimeState || (isDisconnected ? 'OFFLINE' : 'IDLE')}
                            </span>
                          </td>

                          <td className="px-4 py-3">{renderActivityBadge(w)}</td>

                          <td className="px-4 py-3 text-secondary-600">
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="h-3 w-3 text-secondary-400" />
                              {getTimeAgo(w.lastHeartbeat)}
                            </div>
                            {isDisconnected && (
                              <span className="text-[10px] text-amber-700 font-semibold block">Disconnected</span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-mono text-secondary-700">
                            <span>{w.cpuUsage || 0}% CPU</span> / <span>{w.memoryUsage || 0}% RAM</span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Dedicated View Logs Button */}
                              <button
                                onClick={() => handleOpenLogsDrawer(w)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-800 text-xs font-semibold"
                                title="View Worker Activity Logs"
                              >
                                <FileText className="h-3.5 w-3.5 text-brand-600" />
                                <span>Logs</span>
                              </button>

                              {isRevoked || isRetired ? (
                                <button
                                  onClick={() => handleEnableWorker(w.id, w.machineCode)}
                                  className="px-2.5 py-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                >
                                  Re-Enable
                                </button>
                              ) : isUnpaired ? (
                                <button
                                  onClick={() => {
                                    setApprovePairingCode(w.pairingCode || '');
                                    setPairMachineCode(w.machineCode || '');
                                    setPairWorkerName(w.machineName || '');
                                    setAddWorkerTab('pair');
                                    setAddWorkerModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-btn bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold shadow-subtle transition-all"
                                >
                                  Pair Worker
                                </button>
                              ) : (
                                <>
                                  {w.adminStatus === 'DISABLED' ? (
                                    <button
                                      onClick={() => handleEnableWorker(w.id, w.machineCode)}
                                      className="px-2.5 py-1.5 rounded-btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                    >
                                      Enable
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setActionModal({
                                          type: 'DISABLE',
                                          worker: w,
                                          reason: '',
                                          loading: false,
                                        })
                                      }
                                      className="px-2.5 py-1.5 rounded-btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                                    >
                                      Disable
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                onClick={() =>
                                  setActionModal({
                                    type: 'DELETE',
                                    worker: w,
                                    reason: '',
                                    loading: false,
                                  })
                                }
                                className="p-1.5 rounded-btn bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-colors"
                                title="Permanently Delete Worker"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'allocations' ? (
        /* Tab: Smart Job Allocation Decisions & Queue Telemetry */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-card border border-border-default shadow-subtle">
            <div className="flex items-center gap-2 text-xs">
              <select
                value={allocationStatusFilter}
                onChange={(e) => {
                  setAllocationStatusFilter(e.target.value);
                  loadAllocations(e.target.value);
                }}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">All Allocation Statuses</option>
                <option value="ALLOCATED">ALLOCATED (Assigned)</option>
                <option value="REJECTED">REJECTED (Pre-condition)</option>
                <option value="NO_CANDIDATES">NO_CANDIDATES (Capacity Full)</option>
                <option value="RECOVERED">RECOVERED (Stale Lease Requeued)</option>
              </select>

              <button
                onClick={() => loadAllocations(allocationStatusFilter)}
                className="flex items-center gap-1 rounded-btn border border-border-default bg-white px-3 py-1.5 text-secondary-700 hover:bg-neutral-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh History</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerSweep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-subtle"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Run Immediate Allocation Sweep</span>
              </button>
              <button
                onClick={handleTriggerRecovery}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Recover Expired Leases</span>
              </button>
            </div>
          </div>

          {allocationsLoading ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-card border border-border-default bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-2" />
              <p className="text-xs text-secondary-500">Retrieving smart allocation decisions...</p>
            </div>
          ) : allocations.length === 0 ? (
            <div className="rounded-card border border-border-default bg-white p-12 text-center">
              <p className="text-sm font-semibold text-text-primary">No job allocation records found</p>
              <p className="text-xs text-secondary-500 mt-1">
                Whenever jobs enter the queue or workers become available, central allocation decisions are logged here.
              </p>
            </div>
          ) : (
            <div className="rounded-card border border-border-default bg-white overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/80 border-b border-border-default text-[10px] uppercase font-bold text-secondary-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Job ID</th>
                      <th className="px-4 py-3">Selected Worker</th>
                      <th className="px-4 py-3">Candidates</th>
                      <th className="px-4 py-3">Decision Reason</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {allocations.map((item) => {
                      const isAlloc = item.status === 'ALLOCATED';
                      const isRecovered = item.status === 'RECOVERED';
                      const isNoCand = item.status === 'NO_CANDIDATES';

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="px-4 py-3 text-secondary-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                                isAlloc
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isRecovered
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : isNoCand
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isAlloc ? 'bg-emerald-600' : isRecovered ? 'bg-purple-600' : 'bg-amber-600'
                                }`}
                              />
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-text-primary text-[11px]">
                            #{item.jobId.slice(0, 10)}...
                          </td>
                          <td className="px-4 py-3">
                            {item.worker ? (
                              <div className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                                <span>{item.worker.machineCode}</span>
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-neutral-100 text-secondary-600">
                                  {item.worker.deploymentType || 'LOCAL_PC'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-secondary-400 font-mono text-[11px]">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-secondary-600">
                            {item.candidateCount ?? 0}
                          </td>
                          <td className="px-4 py-3 text-secondary-700 max-w-md truncate" title={item.decisionReason}>
                            {item.decisionReason}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedAllocationLog(item)}
                              className="px-2.5 py-1 rounded-btn border border-border-default bg-neutral-50 hover:bg-neutral-100 text-secondary-700 text-xs font-semibold"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'diagnostics' ? (
        /* Tab: Comprehensive Queue & Worker Execution Diagnostics */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-card border border-border-default shadow-subtle">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Worker Execution &amp; Queue Diagnostic Audit</h3>
              <p className="text-[11px] text-secondary-500">Live authoritative inspection of queue eligibility, worker capacity, leases, and exclusion causes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerSweep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Sweep Queue</span>
              </button>
              <button
                onClick={handleTriggerRecovery}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Recover Stale Leases</span>
              </button>
              <button
                onClick={loadFleetData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border-default bg-white text-secondary-700 hover:bg-neutral-50"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Worker Eligibility Table */}
          <div className="rounded-card border border-border-default bg-white overflow-hidden shadow-subtle">
            <div className="p-3 bg-neutral-50/80 border-b border-border-default flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wide">Worker Concurrency &amp; Claim Eligibility Breakdown</span>
              <span className="text-[11px] text-secondary-500 font-mono">
                {diagnostics?.workers?.length || 0} Registered Workers Audited
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-neutral-50/60 border-b border-border-default text-[10.5px] uppercase font-bold text-secondary-500 tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Worker</th>
                    <th className="px-3.5 py-2.5">Mode / Admin</th>
                    <th className="px-3.5 py-2.5">Heartbeat</th>
                    <th className="px-3.5 py-2.5">Capacity (Active/Max)</th>
                    <th className="px-3.5 py-2.5">Eligibility</th>
                    <th className="px-3.5 py-2.5">Exclusion / Diagnostic Reason</th>
                    <th className="px-3.5 py-2.5">Last Activity / Poll Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(diagnostics?.workers || []).map((w: any) => {
                    const isEligible = w.isEligible;
                    return (
                      <tr key={w.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-3.5 py-3">
                          <div className="font-mono font-bold text-text-primary text-[11.5px]">{w.machineCode}</div>
                          <div className="text-[10px] text-secondary-500">{w.machineName} ({w.deploymentType})</div>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            w.desiredState === 'RUNNING' ? 'bg-emerald-100 text-emerald-800' :
                            w.desiredState === 'MONITOR_ONLY' ? 'bg-purple-100 text-purple-800' :
                            w.desiredState === 'PAUSED' ? 'bg-amber-100 text-amber-800' :
                            'bg-neutral-100 text-secondary-700'
                          }`}>
                            {w.desiredState}
                          </span>
                          <span className="text-[9.5px] text-secondary-400 block mt-0.5">{w.adminStatus}</span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px]">
                          {w.heartbeatAgeSec !== null ? (
                            <span className={w.heartbeatAgeSec <= 45 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-bold'}>
                              {w.heartbeatAgeSec}s ago {w.heartbeatAgeSec > 45 ? '(Stale)' : '(Healthy)'}
                            </span>
                          ) : (
                            <span className="text-secondary-400">Never</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-mono font-bold text-[11px] text-text-primary">
                            {w.currentActiveJobs} / {w.maxConcurrentJobs}
                            <span className="text-[10px] font-normal text-secondary-500 ml-1">
                              ({w.effectiveCapacityRemaining} free)
                            </span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-neutral-200 mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${w.currentActiveJobs >= w.maxConcurrentJobs ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, (w.currentActiveJobs / w.maxConcurrentJobs) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isEligible
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isEligible ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                            {isEligible ? 'ELIGIBLE' : 'EXCLUDED'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 max-w-xs">
                          {w.exclusionReason ? (
                            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
                              {w.exclusionReason}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              ✓ Ready for incoming job allocations
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 max-w-sm">
                          {w.lastActivityLog ? (
                            <div>
                              <span className="text-[10px] text-secondary-400 font-mono block">
                                {new Date(w.lastActivityLog.timestamp).toLocaleTimeString()} [{w.lastActivityLog.eventType}]
                              </span>
                              <span className="text-[11px] text-secondary-700 truncate block" title={w.lastActivityLog.message}>
                                {w.lastActivityLog.message}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-secondary-400 italic">No activity recorded yet</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Cross-Worker Fleet Activity Log Stream */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-card border border-border-default shadow-subtle">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="h-4 w-4 text-secondary-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by message, job ID, or machine..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-input border border-border-default bg-neutral-50 focus:bg-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">Severity: All</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={logEventTypeFilter}
                onChange={(e) => setLogEventTypeFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-btn border border-border-default bg-white text-secondary-700 text-xs focus:outline-none"
              >
                <option value="ALL">Event Type: All</option>
                <option value="JOB_CLAIMED">JOB_CLAIMED</option>
                <option value="STEP_STARTED">STEP_STARTED</option>
                <option value="STEP_COMPLETED">STEP_COMPLETED</option>
                <option value="HUMAN_INTERVENTION_REQUESTED">HUMAN_INTERVENTION</option>
                <option value="JOB_SUCCEEDED">JOB_SUCCEEDED</option>
                <option value="JOB_FAILED">JOB_FAILED</option>
                <option value="WORKER_ENABLED">WORKER_ENABLED</option>
                <option value="WORKER_DISABLED">WORKER_DISABLED</option>
                <option value="WORKER_REVOKED">WORKER_REVOKED</option>
                <option value="WORKER_RETIRED">WORKER_RETIRED</option>
              </select>

              <button
                onClick={() => loadFleetLogs(fleetLogPage)}
                className="flex items-center gap-1 rounded-btn border border-border-default bg-white px-3 py-1.5 text-secondary-700 hover:bg-neutral-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          {fleetLogsLoading ? (
            <div className="flex flex-col items-center justify-center p-16 rounded-card border border-border-default bg-white">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-2" />
              <p className="text-xs text-secondary-500">Loading fleet activity stream...</p>
            </div>
          ) : fleetLogs.length === 0 ? (
            <div className="rounded-card border border-border-default bg-white p-12 text-center">
              <p className="text-sm font-semibold text-text-primary">No activity log entries found</p>
              <p className="text-xs text-secondary-500 mt-1">Events recorded by workers will stream here in real-time.</p>
            </div>
          ) : (
            <div className="rounded-card border border-border-default bg-white divide-y divide-border-subtle overflow-hidden shadow-subtle">
              {fleetLogs.map((log) => {
                const isError = log.severity === 'ERROR' || log.severity === 'CRITICAL';
                const isWarn = log.severity === 'WARN';

                return (
                  <div key={log.id} className="p-3.5 hover:bg-neutral-50/60 transition-colors text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            isError
                              ? 'bg-rose-100 text-rose-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-secondary-700'
                          }`}
                        >
                          {log.severity}
                        </span>

                        <span className="font-mono font-bold text-text-primary">
                          {log.worker?.machineCode || log.workerId}
                        </span>

                        <span className="text-[11px] font-bold text-secondary-600 bg-neutral-100 px-2 py-0.5 rounded">
                          {log.eventType}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-secondary-500">
                        {new Date(log.timestamp).toLocaleTimeString()} ({getTimeAgo(log.timestamp)})
                      </span>
                    </div>

                    <p className="text-text-primary font-mono text-[11px] leading-relaxed pl-1">{log.message}</p>

                    {(log.jobId || log.bookingId || log.durationMs) && (
                      <div className="flex items-center gap-3 text-[10px] font-mono text-secondary-500 pt-1 pl-1">
                        {log.jobId && <span>Job: #{log.jobId.slice(0, 10)}</span>}
                        {log.bookingId && <span>Booking: {log.bookingId}</span>}
                        {log.durationMs !== undefined && <span>Duration: {log.durationMs}ms</span>}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 border-t border-border-subtle text-xs">
                <span className="text-secondary-600">Total Entries: {fleetLogTotal}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={fleetLogPage <= 1}
                    onClick={() => loadFleetLogs(fleetLogPage - 1)}
                    className="px-2.5 py-1 rounded-btn border border-border-default bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-mono font-semibold">Page {fleetLogPage}</span>
                  <button
                    disabled={fleetLogs.length < 25}
                    onClick={() => loadFleetLogs(fleetLogPage + 1)}
                    className="px-2.5 py-1 rounded-btn border border-border-default bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Add / Pair Worker Modal */}
      {addWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-panel bg-white p-6 border border-border-default shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-bold text-text-primary">Add &amp; Pair Worker Machine</h3>
              </div>
              <button
                onClick={() => setAddWorkerModalOpen(false)}
                className="text-secondary-400 hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs: Pair Terminal Worker (Default) vs Pre-generate */}
            <div className="flex border-b border-border-subtle mb-4 text-xs font-semibold">
              <button
                onClick={() => setAddWorkerTab('pair')}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
                  addWorkerTab === 'pair'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-secondary-500 hover:text-text-primary'
                }`}
              >
                1. Pair Worker Terminal (Recommended)
              </button>
              <button
                onClick={() => setAddWorkerTab('generate')}
                className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
                  addWorkerTab === 'generate'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-secondary-500 hover:text-text-primary'
                }`}
              >
                2. Pre-provision Machine Code
              </button>
            </div>

            {addWorkerTab === 'pair' ? (
              /* 1. Terminal Pairing Registration Form */
              <form onSubmit={handleApprovePairing} className="space-y-3.5">
                <div className="rounded-card border border-brand-100 bg-brand-50/50 p-3 text-[11px] text-brand-900 leading-relaxed">
                  <strong>Terminal Workflow:</strong> Start worker in terminal (<code>npm run start:dev</code>), answer <code>yes</code> to the confirmation prompt to generate the Pairing Key, then complete registration below:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Worker Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai Velachery Node"
                      value={pairWorkerName}
                      onChange={(e) => setPairWorkerName(e.target.value)}
                      className="w-full rounded-input border border-border-default bg-white px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Machine Identifier / Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PC-001 or PC-NIJA"
                      value={pairMachineCode}
                      onChange={(e) => setPairMachineCode(e.target.value)}
                      className="w-full rounded-input border border-border-default bg-white px-3 py-2 font-mono text-xs uppercase text-text-primary focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Terminal Pairing Key / Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TA-4829 or PAIR-1234"
                    value={approvePairingCode}
                    onChange={(e) => setApprovePairingCode(e.target.value)}
                    className="w-full rounded-input border border-border-default bg-white px-3 py-2 font-mono text-base font-bold tracking-widest text-center text-text-primary focus:border-brand-500 focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-secondary-500 mt-0.5 block">
                    Displayed in the worker console after confirming the startup question. Valid for 15 minutes.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Operational Location <span className="text-secondary-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai Central Booking Center"
                      value={pairLocation}
                      onChange={(e) => setPairLocation(e.target.value)}
                      className="w-full rounded-input border border-border-default bg-white px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      Notes / Description <span className="text-secondary-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. High-speed Sabarimala queue worker"
                      value={pairDescription}
                      onChange={(e) => setPairDescription(e.target.value)}
                      className="w-full rounded-input border border-border-default bg-white px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setAddWorkerModalOpen(false)}
                    className="rounded-btn border border-border-default px-4 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pairingLoading || !approvePairingCode.trim() || !pairMachineCode.trim() || !pairWorkerName.trim()}
                    className="flex items-center gap-2 rounded-btn bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all disabled:opacity-50"
                  >
                    {pairingLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Validating &amp; Registering...</span>
                      </>
                    ) : (
                      <span>Register &amp; Approve Worker</span>
                    )}
                  </button>
                </div>
              </form>
            ) : createdWorkerResult ? (
              /* Created Result with Setup Instructions */
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Machine Registered Successfully</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      15-min Expiry
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Machine Code: <strong>{createdWorkerResult.machine.machineCode}</strong> (
                    {createdWorkerResult.machine.machineName})
                  </p>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-900 mb-1">
                      Cryptographic Pairing Code
                    </span>
                    <div className="flex items-center justify-between bg-white border border-emerald-300 rounded p-2.5">
                      <span className="font-mono text-xl font-bold tracking-widest text-emerald-900">
                        {createdWorkerResult.pairingCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(createdWorkerResult.pairingCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="space-y-2">
                  <span className="font-bold text-text-primary block">Worker Setup Instructions:</span>
                  <p className="text-secondary-600 text-[11px]">
                    On the worker terminal or Railway container, run the following setup command or configure your environment file:
                  </p>
                  <div className="bg-neutral-900 text-neutral-100 p-3 rounded font-mono text-[11px] overflow-x-auto space-y-1">
                    <div className="text-secondary-400"># Pair and start worker automatically</div>
                    <div className="text-emerald-400 select-all">
                      {createdWorkerResult.setupInstructions?.command ||
                        `npm run worker:pair -- --code ${createdWorkerResult.pairingCode}`}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedWorkerResult(null);
                      setAddWorkerModalOpen(false);
                    }}
                    className="rounded-btn bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Pre-provision Registration Form */
              <form onSubmit={handleAdminCreateWorker} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    Machine Code (Identifier)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WORKER-TAMILNADU-01"
                    value={newWorkerCode}
                    onChange={(e) => setNewWorkerCode(e.target.value)}
                    className="w-full rounded-input border border-border-default bg-white px-3 py-2 font-mono text-xs uppercase text-text-primary focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Machine Name / Center</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai Velachery Node"
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    className="w-full rounded-input border border-border-default bg-white px-3 py-2 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Software Version</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.0.0"
                    value={newWorkerVersion}
                    onChange={(e) => setNewWorkerVersion(e.target.value)}
                    className="w-full rounded-input border border-border-default bg-white px-3 py-2 text-xs font-mono text-text-primary focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setAddWorkerModalOpen(false)}
                    className="rounded-btn border border-border-default px-4 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pairingLoading || !newWorkerCode.trim() || !newWorkerName.trim()}
                    className="rounded-btn bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all disabled:opacity-50"
                  >
                    {pairingLoading ? 'Registering...' : 'Generate Pairing Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Consequential Action Modal (Disable, Pause, Revoke, Retire) */}
      {actionModal.type && actionModal.worker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-panel bg-white p-6 border border-border-default shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                {actionModal.type === 'DELETE' ? (
                  <Trash2 className="h-5 w-5 text-rose-600" />
                ) : (
                  <ShieldAlert
                    className={`h-5 w-5 ${
                      actionModal.type === 'REVOKE' || actionModal.type === 'RETIRE'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  />
                )}
                <h3 className="text-sm font-bold text-text-primary">
                  {actionModal.type === 'DELETE'
                    ? `Confirm Permanent Deletion: ${actionModal.worker.machineCode}`
                    : `Confirm ${actionModal.type}: ${actionModal.worker.machineCode}`}
                </h3>
              </div>
              <button
                onClick={() => setActionModal({ type: null, worker: null, reason: '', loading: false })}
                className="text-secondary-400 hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-secondary-600 leading-relaxed">
              Are you sure you want to execute <strong className="font-bold">{actionModal.type}</strong> on worker{' '}
              <strong className="font-mono text-text-primary">{actionModal.worker.machineCode}</strong>?
            </p>

            {/* Impact Explanation */}
            <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/80 space-y-2 text-xs text-secondary-600">
              {actionModal.type === 'DISABLE' && (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Immediate Assignment Block:</strong> Prevents worker from claiming any new jobs.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Safe Drain:</strong> If an active job is executing, it is allowed to finish cleanly before stopping.
                    </span>
                  </div>
                </>
              )}

              {actionModal.type === 'PAUSE' && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Temporary Pause:</strong> Halts new job claims while keeping the worker authenticated and connected.
                  </span>
                </div>
              )}

              {actionModal.type === 'REVOKE' && (
                <>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Permanent Credential Revocation:</strong> Invalidates machine authentication token. The worker cannot reconnect.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Job &amp; Lock Recovery:</strong> In-flight jobs are recovered/requeued and account locks are safely released.
                    </span>
                  </div>
                </>
              )}

              {actionModal.type === 'RETIRE' && (
                <>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Retire from Fleet:</strong> Marks machine as retired. Referential integrity is strictly preserved: past booking records, audit trails, and financials remain intact.
                    </span>
                  </div>
                </>
              )}

              {actionModal.type === 'DELETE' && (
                <>
                  <div className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Permanent Removal:</strong> Completely purges this worker, its credentials, and machine telemetry from the database.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Complete Access Revocation:</strong> Terminal token is immediately destroyed. The worker cannot authenticate or reconnect.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero Job Loss:</strong> In-flight jobs are recovered back to QUEUED status and any Sabarimala account locks are safely released.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Reason input */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Administrative Reason / Justification
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Node decommissioned / hardware replaced / duplicate worker removal..."
                value={actionModal.reason}
                onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full rounded-input border border-border-default bg-white p-2.5 text-xs text-text-primary focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setActionModal({ type: null, worker: null, reason: '', loading: false })}
                className="rounded-btn border border-border-default px-4 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionModal.loading}
                onClick={handleExecuteConsequentialAction}
                className={`rounded-btn px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                  actionModal.type === 'DELETE'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : actionModal.type === 'REVOKE' || actionModal.type === 'RETIRE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionModal.loading
                  ? 'Executing...'
                  : actionModal.type === 'DELETE'
                  ? 'Permanently Delete Worker'
                  : `Confirm ${actionModal.type}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Worker Activity Timeline & Logs Drawer */}
      {selectedWorkerForLogs && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px] animate-fadeIn">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-border-default">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border-subtle bg-neutral-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Activity Timeline: {selectedWorkerForLogs.machineCode}
                  </h3>
                </div>
                <p className="text-xs text-secondary-500 mt-0.5">
                  {selectedWorkerForLogs.machineName} &bull; Admin Status:{' '}
                  <span className="font-semibold">{selectedWorkerForLogs.adminStatus}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedWorkerForLogs(null)}
                className="text-secondary-400 hover:text-text-primary p-1 rounded hover:bg-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar inside drawer */}
            <div className="p-3 border-b border-border-subtle bg-white flex items-center justify-between gap-2 text-xs">
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="py-1 px-2 rounded-btn border border-border-default text-xs"
              >
                <option value="ALL">Severity: All</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>

              <select
                value={logEventTypeFilter}
                onChange={(e) => setLogEventTypeFilter(e.target.value)}
                className="py-1 px-2 rounded-btn border border-border-default text-xs"
              >
                <option value="ALL">Event: All</option>
                <option value="JOB_CLAIMED">JOB_CLAIMED</option>
                <option value="STEP_STARTED">STEP_STARTED</option>
                <option value="STEP_COMPLETED">STEP_COMPLETED</option>
                <option value="JOB_SUCCEEDED">JOB_SUCCEEDED</option>
                <option value="JOB_FAILED">JOB_FAILED</option>
              </select>

              <button
                onClick={() => loadWorkerLogs(selectedWorkerForLogs.id, logPage)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-btn border border-border-default bg-neutral-50 text-secondary-700 hover:bg-neutral-100"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {workerLogsLoading ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500 mb-2" />
                  <p className="text-xs text-secondary-500">Loading activity timeline...</p>
                </div>
              ) : workerLogs.length === 0 ? (
                <div className="text-center p-8 text-secondary-500 text-xs">
                  No activity events recorded yet for this worker.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                  {workerLogs.map((log) => {
                    const isErr = log.severity === 'ERROR' || log.severity === 'CRITICAL';
                    const isWarn = log.severity === 'WARN';

                    return (
                      <div key={log.id} className="relative text-xs space-y-1">
                        {/* Dot */}
                        <div
                          className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                            isErr ? 'bg-rose-600' : isWarn ? 'bg-amber-500' : 'bg-brand-500'
                          }`}
                        />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isErr
                                  ? 'bg-rose-100 text-rose-800'
                                  : isWarn
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-neutral-100 text-secondary-700'
                              }`}
                            >
                              {log.severity}
                            </span>
                            <span className="font-mono font-bold text-text-primary text-[11px]">{log.eventType}</span>
                          </div>
                          <span className="text-[10px] text-secondary-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-text-primary font-mono text-[11px] bg-neutral-50 p-2 rounded border border-neutral-100 leading-relaxed">
                          {log.message}
                        </p>

                        {(log.jobId || log.bookingId) && (
                          <div className="flex items-center gap-2 text-[10px] font-mono text-secondary-500">
                            {log.jobId && <span>Job: #{log.jobId.slice(0, 8)}</span>}
                            {log.bookingId && <span>Booking: {log.bookingId}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer Pagination */}
            <div className="p-3 border-t border-border-subtle bg-neutral-50 flex items-center justify-between text-xs">
              <span className="text-secondary-500 text-[11px]">Total Events: {logTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={logPage <= 1}
                  onClick={() => {
                    const next = logPage - 1;
                    loadWorkerLogs(selectedWorkerForLogs.id, next);
                  }}
                  className="px-2.5 py-1 rounded-btn border border-border-default bg-white disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-mono text-[11px] font-semibold">Page {logPage}</span>
                <button
                  disabled={workerLogs.length < 20}
                  onClick={() => {
                    const next = logPage + 1;
                    loadWorkerLogs(selectedWorkerForLogs.id, next);
                  }}
                  className="px-2.5 py-1 rounded-btn border border-border-default bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Worker Capacity & Concurrency Settings Modal */}
      {capacityModal.open && capacityModal.worker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-panel bg-white p-6 shadow-2xl space-y-4 border border-border-default">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-text-primary">
                  Worker Capacity &amp; Deployment: {capacityModal.worker.machineCode}
                </h3>
              </div>
              <button
                onClick={() => setCapacityModal((prev) => ({ ...prev, open: false }))}
                className="text-secondary-400 hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCapacity} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Deployment Architecture
                </label>
                <select
                  value={capacityModal.deploymentType}
                  onChange={(e) => setCapacityModal((prev) => ({ ...prev, deploymentType: e.target.value }))}
                  className="w-full rounded-input border border-border-default bg-neutral-50 p-2 text-xs text-text-primary focus:bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="LOCAL_PC">Local Windows / Linux PC</option>
                  <option value="CLOUD_VM">Cloud Virtual Machine (AWS/GCP/Azure)</option>
                  <option value="DOCKER">Docker Container Node</option>
                </select>
                <p className="text-[11px] text-secondary-500 mt-1">
                  Smart Allocator allocates work across local PCs, cloud VMs and Docker nodes uniformly.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Max Concurrent Jobs (Concurrency Capacity)
                  </label>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {capacityModal.maxConcurrentJobs} Max Jobs
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={capacityModal.maxConcurrentJobs}
                  onChange={(e) => setCapacityModal((prev) => ({ ...prev, maxConcurrentJobs: parseInt(e.target.value, 10) }))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-secondary-400 font-mono mt-0.5">
                  <span>1 (Single Lease)</span>
                  <span>5 (Parallel)</span>
                  <span>10 (High Capacity)</span>
                </div>
                <p className="text-[11px] text-secondary-500 mt-1">
                  Server-side enforced. When worker reaches this capacity, the allocator routes jobs elsewhere.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Supported Capabilities
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'ACCOUNT_VERIFICATION', label: 'Official Portal Credential Verification' },
                    { id: 'BOOKING_EXECUTION', label: 'Automated Sabarimala Darshan Pass Fast Booking' },
                    { id: 'AVAILABILITY_DISCOVERY', label: 'Continuous Slot Monitoring & Discovery' },
                  ].map((cap) => {
                    const isChecked = capacityModal.capabilities.includes(cap.id);
                    return (
                      <label key={cap.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCapacityModal((prev) => ({
                                ...prev,
                                capabilities: [...prev.capabilities, cap.id],
                              }));
                            } else {
                              setCapacityModal((prev) => ({
                                ...prev,
                                capabilities: prev.capabilities.filter((c) => c !== cap.id),
                              }));
                            }
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-secondary-700">{cap.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setCapacityModal((prev) => ({ ...prev, open: false }))}
                  className="rounded-btn border border-border-default px-3.5 py-2 text-xs font-semibold text-secondary-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={capacityModal.loading}
                  className="rounded-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-subtle"
                >
                  {capacityModal.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  <span>Save Capacity Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Allocation Evaluation Details Drawer */}
      {selectedAllocationLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[1px] animate-fadeIn">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden border-l border-border-default">
            <div className="p-4 border-b border-border-subtle bg-neutral-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-text-primary">
                    Allocation Decision Details
                  </h3>
                </div>
                <p className="text-xs text-secondary-500 mt-0.5 font-mono">
                  Job ID: {selectedAllocationLog.jobId}
                </p>
              </div>
              <button
                onClick={() => setSelectedAllocationLog(null)}
                className="text-secondary-400 hover:text-text-primary p-1 rounded hover:bg-neutral-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-border-default bg-neutral-50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Decision Status:</span>
                  <span className="font-bold font-mono">{selectedAllocationLog.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Selected Worker:</span>
                  <span className="font-bold font-mono">
                    {selectedAllocationLog.worker?.machineCode || selectedAllocationLog.workerId || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Candidate Workers Evaluated:</span>
                  <span className="font-mono font-bold">{selectedAllocationLog.candidateCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Timestamp:</span>
                  <span className="font-mono">{new Date(selectedAllocationLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-text-primary block mb-1">Decision Reason</span>
                <p className="p-3 rounded border border-neutral-200 bg-white font-mono text-secondary-700 leading-relaxed">
                  {selectedAllocationLog.decisionReason}
                </p>
              </div>

              {selectedAllocationLog.evaluatedWorkers && (
                <div>
                  <span className="font-bold text-text-primary block mb-1">Evaluated Candidate Scores</span>
                  <div className="space-y-2">
                    {Array.isArray(selectedAllocationLog.evaluatedWorkers) ? (
                      selectedAllocationLog.evaluatedWorkers.map((cand: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded border border-border-subtle bg-neutral-50 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>{cand.machineCode || cand.workerId}</span>
                            <span className={cand.isAvailable ? 'text-emerald-700' : 'text-rose-700'}>
                              {cand.effectiveState}
                            </span>
                          </div>
                          {cand.exclusionReason && (
                            <p className="text-rose-600 text-[10px]">Exclusion: {cand.exclusionReason}</p>
                          )}
                          <div className="flex justify-between text-[10px] text-secondary-500">
                            <span>Jobs: {cand.currentActiveJobs}/{cand.maxConcurrentJobs}</span>
                            <span>CPU: {cand.cpuUsage}%</span>
                            <span>Score: {cand.score ?? 'N/A'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <pre className="p-3 bg-neutral-900 text-neutral-100 rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(selectedAllocationLog.evaluatedWorkers, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border-subtle bg-neutral-50 text-right">
              <button
                onClick={() => setSelectedAllocationLog(null)}
                className="px-4 py-2 rounded-btn border border-border-default bg-white text-xs font-semibold text-secondary-700 hover:bg-neutral-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
