'use client';

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Radio,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { api } from '@/lib/api';

export interface NotificationPermissionGuardProps {
  children: React.ReactNode;
  exemptRoles?: string[];
  allowSuperAdminBypass?: boolean;
}

export function NotificationPermissionGuard({
  children,
  exemptRoles = ['WORKER'],
  allowSuperAdminBypass = false,
}: NotificationPermissionGuardProps) {
  const {
    permissionState,
    requestPermission,
    recheckPermission,
  } = useNotificationPermission();

  const [activeTab, setActiveTab] = useState<'chrome' | 'edge'>('chrome');
  const [checkingManual, setCheckingManual] = useState<boolean>(false);

  // Determine user role for exemptions
  const currentUser = api.getUser();
  const userRole = currentUser?.role;

  // Role-based exemption:
  // 1. WORKER execution never depends on browser Notification API
  // 2. Custom exempt roles
  // 3. Optional SUPER_ADMIN bypass if explicitly enabled for admin maintenance routes
  if (userRole && exemptRoles.includes(userRole)) {
    return <>{children}</>;
  }

  if (allowSuperAdminBypass && userRole === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // 1. Initial State: Checking permission
  if (permissionState === 'CHECKING') {
    return (
      <div
        className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-[#C98219] mb-3" />
        <p className="text-[13.5px] font-semibold text-[#172033]">
          Verifying notification dispatch readiness...
        </p>
        <p className="text-[11.5px] text-[#667085] mt-0.5">
          Connecting to browser notification subsystem
        </p>
      </div>
    );
  }

  // 2. Granted State: Render protected application content
  if (permissionState === 'GRANTED') {
    return <>{children}</>;
  }

  // 3. Unsupported Environment State
  if (permissionState === 'UNSUPPORTED') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4 sm:p-6 bg-[#F8FAFC]">
        <div
          className="w-full max-w-lg rounded-[14px] border border-[#FDA29B] bg-white p-6 sm:p-8 shadow-card text-center space-y-5"
          role="alert"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] ring-8 ring-[#FEF3F2]/60">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block rounded-full bg-[#FEF3F2] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#B42318] border border-[#FECDCA]">
              Environment Incompatible
            </span>
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              Browser Notifications Not Supported
            </h2>
            <p className="text-[12.5px] text-[#667085] max-w-md mx-auto leading-relaxed">
              Your current browser does not support the Web Notification API required for SevaTN operational access and live booking dispatch.
            </p>
          </div>

          <div className="rounded-[10px] bg-[#FAFBFD] border border-[#E6EAF0] p-4 text-left text-[12px] text-[#475467] space-y-2">
            <p className="font-semibold text-[#172033]">
              To access the SevaTN platform, please switch to a supported browser:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#667085]">
              <li>Google Chrome (Version 80+)</li>
              <li>Microsoft Edge (Chromium, Version 80+)</li>
              <li>Mozilla Firefox (Version 75+)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 4. Denied State: Mandatory blocking error interface
  if (permissionState === 'DENIED') {
    const handleCheckAgain = () => {
      setCheckingManual(true);
      recheckPermission();
      setTimeout(() => setCheckingManual(false), 500);
    };

    return (
      <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6 bg-[#FAFBFD]">
        <div
          className="w-full max-w-xl rounded-[16px] border-2 border-[#FDA29B] bg-white p-6 sm:p-8 shadow-card space-y-6 animate-in fade-in zoom-in-95 duration-200"
          role="alert"
          aria-labelledby="denied-heading"
        >
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2] text-[#D92D20] ring-8 ring-[#FEF3F2]/60">
              <BellOff className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3F2] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#B42318] border border-[#FECDCA]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Access Blocked • Permission Denied</span>
              </div>
              <h2 id="denied-heading" className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
                Notifications Are Blocked
              </h2>
              <p className="text-[12.5px] text-[#667085] max-w-md mx-auto leading-relaxed">
                Browser notifications are currently blocked for this site. You must manually allow notifications in your browser settings to access the SevaTN platform.
              </p>
            </div>
          </div>

          {/* Browser-Specific Instructions Card */}
          <div className="rounded-[12px] border border-[#E6EAF0] bg-[#FAFBFD] p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E6EAF0]">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#344054]">
                How to Enable Notifications
              </span>
              <div className="flex items-center gap-1 rounded-[6px] bg-[#F2F4F7] p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('chrome')}
                  className={`rounded-[5px] px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'chrome'
                      ? 'bg-white text-[#172033] shadow-2xs'
                      : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  Google Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('edge')}
                  className={`rounded-[5px] px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === 'edge'
                      ? 'bg-white text-[#172033] shadow-2xs'
                      : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  Microsoft Edge
                </button>
              </div>
            </div>

            {activeTab === 'chrome' ? (
              <ol className="space-y-2 text-[12px] text-[#475467] list-decimal pl-4.5 leading-relaxed">
                <li>
                  Click the <strong className="text-[#172033]">tune / site settings icon</strong> (sliders or lock) located directly to the left of the address bar URL.
                </li>
                <li>
                  Locate <strong className="text-[#172033]">Notifications</strong> in the dropdown menu.
                </li>
                <li>
                  Switch the dropdown value from <em>&quot;Block&quot;</em> to <strong className="text-[#15803D] font-bold">&quot;Allow&quot;</strong>.
                </li>
                <li>
                  Return to this tab and click <strong className="text-[#C98219]">&quot;Check Again&quot;</strong> below.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 text-[12px] text-[#475467] list-decimal pl-4.5 leading-relaxed">
                <li>
                  Click the <strong className="text-[#172033]">padlock icon</strong> on the left side of the address bar.
                </li>
                <li>
                  Click <strong className="text-[#172033]">Permissions for this site</strong>.
                </li>
                <li>
                  Find <strong className="text-[#172033]">Notifications</strong> and change it to <strong className="text-[#15803D] font-bold">&quot;Allow&quot;</strong>.
                </li>
                <li>
                  Return to this tab and click <strong className="text-[#C98219]">&quot;Check Again&quot;</strong> below.
                </li>
              </ol>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCheckAgain}
              disabled={checkingManual}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#C98219] hover:bg-[#B57414] px-6 py-2.5 text-[12.5px] font-bold text-white transition-all shadow-subtle hover:shadow cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${checkingManual ? 'animate-spin' : ''}`} />
              <span>{checkingManual ? 'Checking...' : 'Check Again'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#D0D5DD] bg-white px-5 py-2.5 text-[12.5px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            >
              Refresh Page
            </button>
          </div>

          <p className="text-center text-[11px] text-[#98A2B3]">
            Access will automatically unlock as soon as permission is granted in your browser.
          </p>
        </div>
      </div>
    );
  }

  // 5. Default / Requesting State: Mandatory permission request screen
  const isRequesting = permissionState === 'REQUESTING';

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 sm:p-6 bg-[#FAFBFD]">
      <div
        className="w-full max-w-xl rounded-[16px] border border-[#F9DE9B] bg-white p-6 sm:p-9 shadow-card space-y-6 animate-in fade-in zoom-in-95 duration-200"
        role="region"
        aria-labelledby="perm-heading"
      >
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF7E6] text-[#C98219] ring-8 ring-[#FEF7E6]/70">
            <BellRing className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF7E6] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#8F5A0D] border border-[#F9DE9B]">
              <Radio className="h-3 w-3 text-[#C98219] animate-pulse" />
              <span>Mandatory Operational Requirement</span>
            </span>
            <h2 id="perm-heading" className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
              Browser Notifications Required
            </h2>
            <p className="text-[12.5px] text-[#667085] max-w-md mx-auto leading-relaxed">
              SevaTN requires browser notifications to be enabled to access the platform. Important booking updates, service alerts and operational notifications are delivered through browser notifications.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 gap-2.5 p-4 rounded-[12px] bg-[#FAFBFD] border border-[#E6EAF0] text-[12px]">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-[#EAF7EE] text-[#198754] shrink-0 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-[#172033]">Instant Pass Confirmations</span>
              <p className="text-[11px] text-[#667085] leading-normal">
                Receive authoritative notifications the moment Sabarimala Darshan passes are confirmed by workers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-[#FEF7E6] text-[#C98219] shrink-0 mt-0.5">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-[#172033]">Slot Availability & Sniping Alerts</span>
              <p className="text-[11px] text-[#667085] leading-normal">
                Real-time alerts whenever newly cancelled quotas open for monitored dates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-[#EEF4FF] text-[#3538CD] shrink-0 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="font-bold text-[#172033]">Critical Service Safeguards</span>
              <p className="text-[11px] text-[#667085] leading-normal">
                Immediate dispatch of operator challenges, session verifications, and financial ledger status.
              </p>
            </div>
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={requestPermission}
            disabled={isRequesting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[9px] bg-[#C98219] hover:bg-[#B57414] px-7 py-3 text-[13.5px] font-bold text-white transition-all shadow-subtle hover:shadow cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for browser permission...</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-[#98A2B3] max-w-sm mx-auto leading-relaxed">
            Clicking &quot;Enable Notifications&quot; will display a browser prompt. Please click <strong className="text-[#344054]">&quot;Allow&quot;</strong> to continue to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

