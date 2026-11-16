'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';

function LiveCountdown({ expiresAt }: { expiresAt: string | Date }) {
  const [timeLeft, setTimeLeft] = useState({ mins: 0, secs: 0, isExpired: false });

  useEffect(() => {
    const update = () => {
      const exp = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, exp - now);
      if (diff <= 0) {
        setTimeLeft({ mins: 0, secs: 0, isExpired: true });
      } else {
        const totalSecs = Math.floor(diff / 1000);
        setTimeLeft({
          mins: Math.floor(totalSecs / 60),
          secs: totalSecs % 60,
          isExpired: false,
        });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <span className="rounded bg-[#FDECEC] px-2 py-0.5 text-[10.5px] font-bold text-[#C2413B] border border-[#F5C6CB] inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Expired
      </span>
    );
  }

  return (
    <span className="rounded bg-[#EFF8FF] px-2.5 py-0.5 text-[10.5px] font-mono font-bold text-[#175CD3] border border-[#B2DDFF] inline-flex items-center gap-1.5 animate-pulse">
      <Clock className="h-3 w-3 text-[#175CD3]" />
      {timeLeft.mins}m {timeLeft.secs}s remaining
    </span>
  );
}

export default function DistributorInvitationsPage() {
  const toast = useToast();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await api.getDistributorCentreInvitations();
      setInvitations(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setSuccessMsg(null);
    try {
      const res = await api.createDistributorCentreInvitation({ expiresInMinutes: 30 });
      setSuccessMsg('Fresh 30-minute Centre onboarding link generated!');
      toast.success('New 30-minute Centre onboarding link created.');
      loadInvitations();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invitation link');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (invitationId: string) => {
    try {
      await api.regenerateDistributorCentreInvitation(invitationId);
      toast.success('Onboarding link regenerated.');
      loadInvitations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate link');
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Invitation link copied to clipboard.');
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F9DE9B] bg-[#FEF7E6] px-3 py-1 text-xs text-[#8F5A0D] font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#C98219]" />
            <span>Centre Onboarding Links (Single-Use • 30-Min Expiry)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
            Centre Invitations ({invitations.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Centres register exclusively via your secure 30-minute invitation links. Direct self-registration is strictly blocked.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#C98219] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#A86B14] transition-all shadow-subtle shrink-0 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span>{generating ? 'Generating...' : 'Generate New 30-Min Link'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-[8px] border border-[#C3E6CB] bg-[#EAF7EE] p-3 text-xs font-semibold text-[#198754] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#198754]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Invitations Table */}
      <div className="rounded-[10px] border border-[#E6EAF0] bg-white shadow-subtle overflow-hidden">
        {invitations.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#667085]">
            <Sparkles className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
            <p className="font-semibold text-[#172033]">No Invitations Generated Yet</p>
            <p className="mt-1">Click &quot;Generate New 30-Min Link&quot; above to invite a local computer centre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#667085] uppercase tracking-wider font-semibold border-b border-[#E6EAF0]">
                <tr>
                  <th className="py-3 px-4">Link Details & URL</th>
                  <th className="py-3 px-4">Expiry Timer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Redeemed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAF0]">
                {invitations.map((inv) => {
                  const isUsed = inv.status === 'USED';
                  const isExpired = inv.isExpired && !isUsed;
                  const isActive = inv.status === 'ACTIVE' && !isExpired;

                  return (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-[11px] font-bold text-[#172033] flex items-center gap-2">
                          <span className="truncate max-w-xs">{inv.onboardingUrl}</span>
                        </div>
                        <div className="text-[10px] text-[#667085] font-sans mt-0.5">
                          Created {formatDate(inv.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isUsed ? (
                          <span className="rounded bg-[#EAF7EE] px-2 py-0.5 text-[10px] font-bold text-[#198754] border border-[#C3E6CB]">
                            Completed
                          </span>
                        ) : (
                          <LiveCountdown expiresAt={inv.expiresAt} />
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isUsed ? (
                          <span className="font-bold text-[#198754]">USED</span>
                        ) : isExpired ? (
                          <span className="font-bold text-[#C2413B]">EXPIRED</span>
                        ) : (
                          <span className="font-bold text-[#175CD3]">ACTIVE</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#475467]">
                        {inv.usedByUser ? (
                          <div>
                            <div className="font-semibold text-[#172033]">{inv.usedByUser.name}</div>
                            <div className="text-[10.5px] font-mono text-[#667085]">{inv.usedByUser.mobile}</div>
                          </div>
                        ) : (
                          <span className="text-[#98A2B3]">Unused</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <>
                              <button
                                onClick={() => handleCopy(inv.onboardingUrl, inv.id)}
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[#E6EAF0] px-2.5 py-1 text-[11px] font-semibold text-[#172033] hover:bg-[#F8FAFC]"
                              >
                                {copiedId === inv.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-[#198754]" />
                                    <span className="text-[#198754]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-[#667085]" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                  `You have been invited to join the SevaTN network. Complete registration within 30 minutes: ${inv.onboardingUrl}`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-[6px] bg-[#25D366]/10 border border-[#25D366]/30 px-2.5 py-1 text-[11px] font-bold text-[#128C7E] hover:bg-[#25D366]/20"
                              >
                                <Share2 className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          )}

                          {isExpired && (
                            <button
                              onClick={() => handleRegenerate(inv.id)}
                              className="inline-flex items-center gap-1 rounded-[6px] bg-[#C98219] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#A86B14]"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Regenerate (30-Min)</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

