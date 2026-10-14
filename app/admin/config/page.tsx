'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../../lib/api';
import {
  Settings,
  Save,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  QrCode,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  DollarSign,
  HelpCircle,
  Sparkles,
  Smartphone,
  Globe,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function SystemConfigPage() {
  const [config, setConfig] = useState<any>({
    serviceFee: 100,
    registrationFee: 249,
    franchiseFee: 599,
    partnerMinWithdrawal: 100,
    accountValidityDays: 365,
    checkingIntervalSeconds: 300,
    leaseTimeoutSeconds: 120,
    humanAssistedModeOnly: false,

    // Payment Config
    onlinePaymentEnabled: true,
    onlineGatewayProvider: 'RAZORPAY',
    onlineGatewayKeyId: '',
    onlineGatewayKeySecret: '',

    offlinePaymentEnabled: true,
    offlineUpiId: 'pay.ticketassist@okaxis',
    offlineAccountName: 'TicketAssist Services & Network',
    offlineQrImageUrl: '',
    offlineBankName: 'HDFC Bank',
    offlineAccountNumber: '50200012345678',
    offlineIfscCode: 'HDFC0001234',
    offlinePaymentInstructions:
      'Scan the official QR code or transfer to the UPI ID. Enter your 12-digit UTR / Reference ID for verification.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSystemConfig()
      .then((data) => {
        if (data) setConfig((prev: any) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSystemConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev: any) => ({
        ...prev,
        offlineQrImageUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeQrImage = () => {
    setConfig((prev: any) => ({
      ...prev,
      offlineQrImageUrl: '',
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="h-4 w-4" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#172033]">
            System, Payments & Compliance Configuration
          </h1>
          <p className="text-xs text-[#667085] mt-1">
            Manage online gateway providers, upload offline UPI payment QR codes, configure platform fees, and set compliance intervals.
          </p>
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSave}
          className="rounded-[7px] bg-[#C98219] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#B57414] shadow-subtle flex items-center gap-2 self-start sm:self-auto transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {saved && (
        <div className="rounded-[8px] border border-[#A6F4C5] bg-[#EAF7EE] p-3.5 flex items-center gap-2.5 text-xs font-bold text-[#106A3B] shadow-subtle animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#198754] shrink-0" />
          <span>System configuration updated successfully! Changes are active immediately across all user portals.</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle">
          <LoadingSkeleton rows={6} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ============================================================ */}
          {/* 1. PAYMENT METHODS CONFIGURATION (ONLINE & OFFLINE QR)      */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6EAF0]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#C98219]" />
                <div>
                  <h2 className="text-base font-bold text-[#172033]">
                    Payment Methods Architecture (Online Gateway & Offline QR Code)
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Configure how users and centres make payments for wallet top-up, registration fees, and partner onboarding.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-Section A: OFFLINE PAYMENT / MANUAL UPI & QR CODE */}
            <div className="rounded-[9px] border border-[#F9DE9B] bg-[#FEF7E6]/40 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F9DE9B] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] text-[#8F5A0D]">
                    <QrCode className="h-4 w-4 text-[#C98219]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      Offline Payment Method — Custom UPI QR Code & Bank Transfer
                    </h3>
                    <p className="text-[11.5px] text-[#8F5A0D]">
                      Enables users to pay by scanning your uploaded QR code and submitting transaction UTR reference.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.offlinePaymentEnabled}
                    onChange={(e) => setConfig({ ...config, offlinePaymentEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98219]"></div>
                </label>
              </div>

              {config.offlinePaymentEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* QR Code Upload & Live Preview */}
                  <div className="space-y-3 flex flex-col items-center justify-center border-2 border-dashed border-[#F9DE9B] rounded-[8px] bg-white p-4 text-center">
                    <label className="block text-xs font-bold text-[#172033]">
                      Official Payment QR Code
                    </label>

                    {config.offlineQrImageUrl ? (
                      <div className="relative group">
                        <img
                          src={config.offlineQrImageUrl}
                          alt="Uploaded Payment QR Code"
                          className="h-40 w-40 object-contain rounded-[6px] border border-[#E6EAF0] p-1 bg-white shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={removeQrImage}
                          className="absolute top-1 right-1 rounded-full bg-[#C2413B] p-1.5 text-white hover:bg-[#9E2A2B] shadow transition-colors"
                          title="Remove QR Code"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-32 w-32 rounded-[6px] bg-[#F8FAFC] border border-[#E6EAF0] flex flex-col items-center justify-center text-[#98A2B3] p-2">
                        <QrCode className="h-10 w-10 mb-1 text-[#C98219]" />
                        <span className="text-[10px] text-[#667085]">No QR Uploaded</span>
                      </div>
                    )}

                    <div className="space-y-1.5 w-full">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                        id="qr-upload-input"
                      />
                      <label
                        htmlFor="qr-upload-input"
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-[#FEF7E6] border border-[#F9DE9B] px-3 py-1.5 text-xs font-bold text-[#8F5A0D] hover:bg-[#FAF3E7] cursor-pointer transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#C98219]" />
                        <span>{config.offlineQrImageUrl ? 'Change QR Image' : 'Upload QR Code'}</span>
                      </label>
                      <p className="text-[10px] text-[#667085]">Supports PNG, JPG, WebP (Max 2MB)</p>
                    </div>
                  </div>

                  {/* UPI Details & Instructions */}
                  <div className="md:col-span-2 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">
                          Official UPI ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={config.offlineUpiId}
                          onChange={(e) => setConfig({ ...config, offlineUpiId: e.target.value })}
                          placeholder="pay.ticketassist@okaxis"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">
                          Account / Beneficiary Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={config.offlineAccountName}
                          onChange={(e) => setConfig({ ...config, offlineAccountName: e.target.value })}
                          placeholder="TicketAssist Services & Network"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={config.offlineBankName || ''}
                          onChange={(e) => setConfig({ ...config, offlineBankName: e.target.value })}
                          placeholder="HDFC Bank"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={config.offlineAccountNumber || ''}
                          onChange={(e) => setConfig({ ...config, offlineAccountNumber: e.target.value })}
                          placeholder="50200012345678"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={config.offlineIfscCode || ''}
                          onChange={(e) => setConfig({ ...config, offlineIfscCode: e.target.value })}
                          placeholder="HDFC0001234"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Payer Payment Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={config.offlinePaymentInstructions || ''}
                        onChange={(e) => setConfig({ ...config, offlinePaymentInstructions: e.target.value })}
                        placeholder="Scan the QR code or transfer to UPI ID, and enter your 12-digit UTR number."
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Section B: ONLINE PAYMENT GATEWAY */}
            <div className="rounded-[9px] border border-[#E6EAF0] bg-[#F8FAFC] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6EAF0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-white border border-[#E6EAF0] text-[#172033]">
                    <Globe className="h-4 w-4 text-[#175CD3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">
                      Online Payment Gateway (Instant Automated Checkout)
                    </h3>
                    <p className="text-[11.5px] text-[#667085]">
                      Integrate Razorpay, Cashfree, PhonePe, or Stripe for instant automated card, netbanking, and UPI intent.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.onlinePaymentEnabled}
                    onChange={(e) => setConfig({ ...config, onlinePaymentEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#175CD3]"></div>
                </label>
              </div>

              {config.onlinePaymentEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Gateway Provider
                      </label>
                      <select
                        value={config.onlineGatewayProvider}
                        onChange={(e) => setConfig({ ...config, onlineGatewayProvider: e.target.value })}
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                      >
                        <option value="RAZORPAY">Razorpay</option>
                        <option value="CASHFREE">Cashfree Payments</option>
                        <option value="PHONEPE">PhonePe PG</option>
                        <option value="STRIPE">Stripe Payments</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Key ID / Merchant ID
                      </label>
                      <input
                        type="text"
                        value={config.onlineGatewayKeyId || ''}
                        onChange={(e) => setConfig({ ...config, onlineGatewayKeyId: e.target.value })}
                        placeholder="rzp_live_..."
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] mb-1">
                        Key Secret / API Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          value={config.onlineGatewayKeySecret || ''}
                          onChange={(e) => setConfig({ ...config, onlineGatewayKeySecret: e.target.value })}
                          placeholder="••••••••••••••••"
                          className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 pr-9 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033]"
                        >
                          {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. FINANCIAL ARCHITECTURE & FRANCHISE PRICING               */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-3 border-b border-[#E6EAF0] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#C98219]" />
              <span>Platform Financial Fee & License Architecture</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Service Fee per Booking (₹)
                </label>
                <input
                  type="number"
                  value={config.serviceFee}
                  onChange={(e) => setConfig({ ...config, serviceFee: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">Standard fee debited from centre wallet on confirmed pass</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Centre Onboarding Fee (₹)
                </label>
                <input
                  type="number"
                  value={config.registrationFee}
                  onChange={(e) => setConfig({ ...config, registrationFee: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">One-time registration fee for eSevai / CSC centres (Default: ₹249)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Partner Franchise License Fee (₹)
                </label>
                <input
                  type="number"
                  value={config.franchiseFee || 599}
                  onChange={(e) => setConfig({ ...config, franchiseFee: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">One-time regional franchise partner onboarding fee (Default: ₹599)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center justify-between">
                  <span>Partner Min Withdrawal (₹)</span>
                  <span className="text-[10px] font-bold text-[#C98219] bg-[#FEF7E6] px-1.5 py-0.5 rounded border border-[#F9DE9B]">Payout Limit</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.partnerMinWithdrawal ?? 100}
                  onChange={(e) => setConfig({ ...config, partnerMinWithdrawal: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">Minimum wallet balance partner can request to withdraw (Default: ₹100)</p>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. OPERATIONAL POLICY & COMPLIANCE GUARDRAILS                */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-3 border-b border-[#E6EAF0] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#198754]" />
              <span>Compliance & Anti-Spam Guardrails</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Slot Checking Interval (Seconds)
                </label>
                <input
                  type="number"
                  min={60}
                  value={config.checkingIntervalSeconds}
                  onChange={(e) => setConfig({ ...config, checkingIntervalSeconds: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">Compliant policy enforces minimum 300s (5 minutes)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Centre Account Validity (Days)
                </label>
                <input
                  type="number"
                  value={config.accountValidityDays}
                  onChange={(e) => setConfig({ ...config, accountValidityDays: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3.5 py-2 text-xs font-mono font-bold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
                <p className="text-[11px] text-[#667085] mt-1">Active platform operating license window</p>
              </div>
            </div>

            <div className="rounded-[8px] bg-[#F7F9FC] p-4 border border-[#E6EAF0] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172033]">Enforce Human-Assisted Mode Only</p>
                <p className="text-[11.5px] text-[#667085] mt-0.5">
                  Routes all booking requests directly to manual operator challenge workflow.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.humanAssistedModeOnly}
                onChange={(e) => setConfig({ ...config, humanAssistedModeOnly: e.target.checked })}
                className="h-4.5 w-4.5 rounded border-[#D0D5DD] text-[#C98219] focus:ring-[#C98219] cursor-pointer accent-[#C98219]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-6 py-2.5 text-xs font-bold text-white transition-all shadow-subtle hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Parameters...' : 'Save All Parameters'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
