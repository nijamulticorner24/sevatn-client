'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
  ArrowRight,
  Send,
  Bot,
  Bell,
  Megaphone,
  Radio,
} from 'lucide-react';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';

export default function SystemConfigPage() {
  const [config, setConfig] = useState<any>({
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
    offlineUpiId: 'pay.sevatn@okaxis',
    offlineAccountName: 'SevaTN Services & Network',
    offlineQrImageUrl: '',
    offlineBankName: 'HDFC Bank',
    offlineAccountNumber: '50200012345678',
    offlineIfscCode: 'HDFC0001234',
    offlinePaymentInstructions:
      'Scan the official QR code or transfer to the UPI ID. Enter your 12-digit UTR / Reference ID for verification.',

    // Telegram Bot Real-Time Notifier
    telegramBotEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',

    // Site Header Top Marquee Announcement Bar
    headerMarqueeEnabled: false,
    headerMarqueeText: '',
    headerMarqueeSpeed: 30,
    headerMarqueeBgColor: 'DEFAULT',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleTestTelegram = async () => {
    if (!config.telegramBotToken?.trim() || !config.telegramChatId?.trim()) {
      setTelegramTestResult({
        type: 'error',
        message: 'Please enter both Telegram Bot Token and Chat ID before sending a test notification.',
      });
      return;
    }

    setTestingTelegram(true);
    setTelegramTestResult(null);

    try {
      const res = await api.testTelegramNotification({
        botToken: config.telegramBotToken.trim(),
        chatId: config.telegramChatId.trim(),
      });
      setTelegramTestResult({
        type: 'success',
        message: res.message || 'Test notification delivered successfully! Check your Telegram app.',
      });
    } catch (err: any) {
      setTelegramTestResult({
        type: 'error',
        message: err.message || 'Failed to send test notification to Telegram. Check token & chat ID.',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

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
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6EAF0]">
        <div>
          <div className="flex items-center gap-2 text-[#C98219] text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="h-4 w-4" />
            <span>Platform Administration</span>
          </div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            System &amp; Engine Configuration
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Configure payment methods, site header marquee announcement, Telegram notification bot, and engine timeouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 h-9 px-4 rounded-[7px] bg-[#C98219] hover:bg-[#B37316] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* ============================================================ */}
          {/* 1. OFFLINE PAYMENT (QR CODE & UPI)                           */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-5">
            <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#E6EAF0] gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] shrink-0 border border-[#F9DE9B]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <span>Offline UPI &amp; Direct QR Payment Method</span>
                    <span className="text-[10px] bg-[#FEF7E6] text-[#8F5A0D] font-bold px-2 py-0.5 rounded-full border border-[#F9DE9B]">
                      Primary &bull; 0% Gateway Fees
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    Allow customers and centres to scan your official UPI QR code and submit payment proof for manual verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {config.offlinePaymentEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span>
                    Disabled
                  </span>
                )}

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
            </div>

            {config.offlinePaymentEnabled && (
              <div className="space-y-5 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Official UPI ID / VPA *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={config.offlineUpiId || ''}
                        onChange={(e) => setConfig({ ...config, offlineUpiId: e.target.value })}
                        placeholder="e.g. ticketassist@okaxis or payments@hdfcbank"
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#C98219] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Account / Beneficiary Business Name *
                    </label>
                    <input
                      type="text"
                      value={config.offlineAccountName || ''}
                      onChange={(e) => setConfig({ ...config, offlineAccountName: e.target.value })}
                      placeholder="e.g. TicketAssist Services & Network"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Upload QR Code */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Official Payment QR Code Image
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="h-28 w-28 rounded-[8px] border-2 border-dashed border-[#D0D5DD] bg-[#F8FAFC] flex items-center justify-center overflow-hidden shrink-0">
                      {config.offlineQrImageUrl ? (
                        <img
                          src={config.offlineQrImageUrl}
                          alt="Official QR"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-center p-2">
                          <QrCode className="h-8 w-8 text-[#98A2B3] mx-auto mb-1" />
                          <span className="text-[10px] text-[#667085]">No QR Uploaded</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleQrUpload}
                          accept="image/*"
                          className="hidden"
                          id="qr-upload-input"
                        />
                        <label
                          htmlFor="qr-upload-input"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#D0D5DD] bg-white text-xs font-semibold text-[#344054] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
                        >
                          <Upload className="h-3.5 w-3.5 text-[#667085]" />
                          <span>Upload Custom QR</span>
                        </label>

                        {config.offlineQrImageUrl && (
                          <button
                            type="button"
                            onClick={removeQrImage}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#FDA29B] bg-[#FEF3F2] text-xs font-semibold text-[#B42318] hover:bg-[#FEE4E2] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#667085]">
                        Upload your official PhonePe, GPay, Paytm or Bank QR code (PNG, JPG, max 2MB).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Payment Instructions for Centre / Customer
                  </label>
                  <textarea
                    rows={2}
                    value={config.offlinePaymentInstructions || ''}
                    onChange={(e) => setConfig({ ...config, offlinePaymentInstructions: e.target.value })}
                    placeholder="Instructions displayed on activation checkout..."
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white p-2.5 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 2. ONLINE PAYMENT GATEWAY                                    */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-5">
            <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#E6EAF0] gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#EEF4FF] text-[#3538CD] shrink-0 border border-[#C7D7FE]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <span>Online Payment Gateway (Auto-Verification)</span>
                    <span className="text-[10px] bg-[#EEF4FF] text-[#3538CD] font-bold px-2 py-0.5 rounded-full border border-[#C7D7FE]">
                      Instant Activation
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    Enable automated card, netbanking &amp; UPI checkout with instant auto-approval.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {config.onlinePaymentEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span>
                    Disabled
                  </span>
                )}

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.onlinePaymentEnabled}
                    onChange={(e) => setConfig({ ...config, onlinePaymentEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3538CD]"></div>
                </label>
              </div>
            </div>

            {config.onlinePaymentEnabled && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Gateway Provider
                    </label>
                    <select
                      value={config.onlineGatewayProvider || 'RAZORPAY'}
                      onChange={(e) => setConfig({ ...config, onlineGatewayProvider: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none"
                    >
                      <option value="RAZORPAY">Razorpay</option>
                      <option value="CASHFREE">Cashfree</option>
                      <option value="PHONEPE">PhonePe PG</option>
                      <option value="STRIPE">Stripe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Gateway Key ID / App ID
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
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Gateway Secret Key
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

          {/* ============================================================ */}
          {/* 3. TELEGRAM BOT REAL-TIME PAYMENT NOTIFIER                   */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
            <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#E6EAF0] gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#E0F2FE] text-[#0284C7] shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <span>Telegram Payment Notifier Bot</span>
                    <span className="text-[10px] bg-[#E0F2FE] text-[#0369A1] font-bold px-2 py-0.5 rounded-full border border-[#BAE6FD]">
                      Instant Alerts
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    Receive instant real-time notifications with receipt proofs on Telegram whenever a customer or centre completes an onboarding fee or wallet top-up.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {config.telegramBotEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span>
                    Disabled
                  </span>
                )}

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.telegramBotEnabled}
                    onChange={(e) => setConfig({ ...config, telegramBotEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0284C7]"></div>
                </label>
              </div>
            </div>

            {config.telegramBotEnabled && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Telegram Bot API Token *
                    </label>
                    <div className="relative">
                      <input
                        type={showBotToken ? 'text' : 'password'}
                        value={config.telegramBotToken || ''}
                        onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                        placeholder="e.g. 7123456789:AAHAbcdefghijk..."
                        className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 pr-9 text-xs font-mono text-[#172033] focus:border-[#0284C7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#172033]"
                      >
                        {showBotToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Telegram Chat ID *
                    </label>
                    <input
                      type="text"
                      value={config.telegramChatId || ''}
                      onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                      placeholder="e.g. 123456789 or -1001234567890"
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-mono text-[#172033] focus:border-[#0284C7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[7px] border border-[#0284C7]/40 bg-[#E0F2FE]/50 text-xs font-bold text-[#0369A1] hover:bg-[#E0F2FE] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 text-[#0284C7]" />
                    <span>{testingTelegram ? 'Testing Connection...' : 'Send Test Notification'}</span>
                  </button>

                  {telegramTestResult && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold ${
                        telegramTestResult.type === 'success'
                          ? 'bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]'
                          : 'bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B]'
                      }`}
                    >
                      {telegramTestResult.type === 'success' ? (
                        <Check className="h-3.5 w-3.5 text-[#12B76A]" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-[#F04438]" />
                      )}
                      <span>{telegramTestResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* 4. SITE HEADER MARQUEE ANNOUNCEMENT TICKER                   */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-5">
            <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#E6EAF0] gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#FEF7E6] text-[#C98219] shrink-0 border border-[#F9DE9B]">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <span>Site Header Marquee Announcement</span>
                    <span className="text-[10px] bg-[#FEF7E6] text-[#8F5A0D] font-bold px-2 py-0.5 rounded-full border border-[#F9DE9B]">
                      Top Marquee
                    </span>
                  </h3>
                  <p className="text-[11.5px] text-[#667085]">
                    Display a live scrolling announcement ticker at the very top of the site header across public landing pages and authenticated portals.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {config.headerMarqueeEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F04438]"></span>
                    Disabled
                  </span>
                )}

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(config.headerMarqueeEnabled)}
                    onChange={(e) => setConfig({ ...config, headerMarqueeEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98219]"></div>
                </label>
              </div>
            </div>

            {config.headerMarqueeEnabled && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Marquee Message Text Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Marquee Announcement Text *
                  </label>
                  <textarea
                    rows={2}
                    value={config.headerMarqueeText || ''}
                    onChange={(e) => setConfig({ ...config, headerMarqueeText: e.target.value })}
                    placeholder="e.g. 📢 Sabarimala Tatkal Darshan Booking Quotas Are LIVE • High-Speed Operator Automation Active • Official Helpline: 1800-425-3929"
                    className="w-full rounded-[7px] border border-[#D0D5DD] bg-white p-3 text-xs text-[#172033] focus:border-[#C98219] focus:outline-none leading-relaxed"
                  />
                  <p className="text-[11px] text-[#667085] mt-1">
                    Enter the operational notice, emergency announcement, or guidance message to scroll across the header.
                  </p>
                </div>

                {/* Theme & Scroll Speed */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Banner Color Theme
                    </label>
                    <select
                      value={config.headerMarqueeBgColor || 'DEFAULT'}
                      onChange={(e) => setConfig({ ...config, headerMarqueeBgColor: e.target.value })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none cursor-pointer"
                    >
                      <option value="DEFAULT">Deep Navy Slate (Professional Standard)</option>
                      <option value="GOLD">SevaTN Gold (Brand Official)</option>
                      <option value="ALERT">Crimson Red (Urgent Notice / Warning)</option>
                      <option value="EMERALD">Emerald Green (Operational Update / Success)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Scroll Speed
                    </label>
                    <select
                      value={config.headerMarqueeSpeed || 30}
                      onChange={(e) => setConfig({ ...config, headerMarqueeSpeed: parseInt(e.target.value, 10) })}
                      className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none cursor-pointer"
                    >
                      <option value={18}>Fast (18 seconds per cycle)</option>
                      <option value={30}>Normal (30 seconds per cycle)</option>
                      <option value={45}>Slow &amp; Easy Reading (45 seconds per cycle)</option>
                    </select>
                  </div>
                </div>

                {/* Live Real-Time Preview Container */}
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-2">
                    Live Preview (How it appears on site header top)
                  </span>
                  <div className="rounded-[8px] overflow-hidden border border-[#D0D5DD] shadow-sm">
                    <div
                      className={`flex items-center h-8 sm:h-9 px-3 text-xs font-medium overflow-hidden ${
                        config.headerMarqueeBgColor === 'GOLD'
                          ? 'bg-[#8F5A0D] text-white'
                          : config.headerMarqueeBgColor === 'ALERT'
                          ? 'bg-[#991B1B] text-white'
                          : config.headerMarqueeBgColor === 'EMERALD'
                          ? 'bg-[#065F46] text-white'
                          : 'bg-[#0F172A] text-slate-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/25 text-amber-300 mr-3 shrink-0">
                        <Megaphone className="h-3 w-3" />
                        <span>Notice</span>
                      </span>
                      <div className="overflow-hidden whitespace-nowrap flex-1">
                        <span className="inline-block animate-pulse">
                          {config.headerMarqueeText || 'Enter announcement message above to preview live marquee ticker...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* NOTICE: FINANCIAL ARCHITECTURE MOVED TO /admin/pricing       */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#B2DDFF] bg-[#EFF8FF] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#D1E9FF] text-[#175CD3] shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#172033]">
                  Platform Financial Fee &amp; License Architecture Moved
                </h4>
                <p className="text-xs text-[#475467] mt-0.5">
                  Platform Service Fees, Centre Onboarding Fees, Franchise License Fees, and Three-Level Ticket Markups are now centrally managed in <strong>Pricing &amp; Markups Hub</strong>.
                </p>
              </div>
            </div>
            <Link
              href="/admin/pricing"
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#175CD3] hover:bg-[#154fc1] text-white px-4 py-2 text-xs font-bold shadow-subtle shrink-0 transition-colors self-start sm:self-auto"
            >
              <span>Manage Pricing &amp; Fees</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* ============================================================ */}
          {/* 5. OPERATIONAL POLICY & COMPLIANCE GUARDRAILS                */}
          {/* ============================================================ */}
          <div className="rounded-[10px] border border-[#E6EAF0] bg-white p-6 shadow-subtle space-y-4">
            <h2 className="text-xs font-bold text-[#172033] uppercase tracking-wider pb-3 border-b border-[#E6EAF0] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#198754]" />
              <span>Compliance &amp; Anti-Spam Guardrails</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Slot Checking Interval (Seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3600"
                  value={config.checkingIntervalSeconds || 300}
                  onChange={(e) => setConfig({ ...config, checkingIntervalSeconds: parseInt(e.target.value, 10) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Worker Lease Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={config.leaseTimeoutSeconds || 120}
                  onChange={(e) => setConfig({ ...config, leaseTimeoutSeconds: parseInt(e.target.value, 10) })}
                  className="w-full rounded-[7px] border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#172033] focus:border-[#C98219] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-[10px] border border-[#E6EAF0] bg-white p-4 shadow-elevated">
            <div className="text-xs text-[#667085]">
              {saved ? (
                <span className="flex items-center gap-1.5 text-[#198754] font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Configuration saved successfully and updated live across the network.</span>
                </span>
              ) : (
                <span>Unsaved changes will take effect immediately upon saving.</span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-5 rounded-[7px] bg-[#C98219] hover:bg-[#B37316] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
