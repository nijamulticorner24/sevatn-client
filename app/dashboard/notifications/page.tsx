'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wallet,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { EmptyState } from '../../../components/EmptyState';

interface NotificationItem {
  id: string;
  type: 'SUCCESS' | 'WATCHING' | 'WALLET' | 'WARNING' | 'REFUND';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'SUCCESS',
    title: 'Booking #TA-10290 Confirmed',
    description: 'Devotee e-Pass confirmed for Pamba route (Dec 30). Official reference SAB-2026-TN-9812.',
    time: '12 minutes ago',
    read: false,
    link: '/dashboard/bookings',
  },
  {
    id: 'n2',
    type: 'WATCHING',
    title: 'Watching Slots for Booking #TA-10291',
    description: 'Worker PC-002 is actively checking availability every 5 minutes in compliant interval.',
    time: '45 minutes ago',
    read: false,
    link: '/dashboard/bookings',
  },
  {
    id: 'n3',
    type: 'WALLET',
    title: 'Wallet Top-up Successful',
    description: '₹1,000.00 credited via UPI Payment. New available balance ₹4,250.00.',
    time: '2 hours ago',
    read: true,
    link: '/dashboard/wallet',
  },
  {
    id: 'n4',
    type: 'REFUND',
    title: 'Hold Released for Booking #TA-10288',
    description: '₹100.00 booking hold released back to your available balance as slot was unavailable.',
    time: 'Yesterday at 4:30 PM',
    read: true,
    link: '/dashboard/wallet',
  },
  {
    id: 'n5',
    type: 'WARNING',
    title: 'Low Balance Reminder',
    description: 'Your available balance is currently below ₹500. Top up to ensure uninterrupted queue reservation.',
    time: '2 days ago',
    read: true,
    link: '/dashboard/wallet',
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'BOOKINGS' | 'WALLET'>('ALL');

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'BOOKINGS') return n.type === 'SUCCESS' || n.type === 'WATCHING';
    if (filter === 'WALLET') return n.type === 'WALLET' || n.type === 'REFUND' || n.type === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'WATCHING':
        return <Clock className="h-4 w-4 text-brand-600" />;
      case 'WALLET':
        return <Wallet className="h-4 w-4 text-brand-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'REFUND':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-text-primary">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-secondary-500 mt-0.5">
            Live operational status updates for your booking requests and financial events
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-btn border border-border-default bg-white px-3 py-1.5 text-xs font-semibold text-secondary-600 hover:bg-neutral-50 self-start sm:self-auto"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        {(['ALL', 'UNREAD', 'BOOKINGS', 'WALLET'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors ${
              filter === tab
                ? 'bg-brand-50 text-brand-900 border border-brand-200'
                : 'text-secondary-600 hover:text-text-primary hover:bg-neutral-100'
            }`}
          >
            {tab === 'ALL' ? 'All Alerts' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="rounded-card border border-border-default bg-white p-12">
          <EmptyState
            title="No notifications"
            description="You are caught up with all activity alerts and status updates."
          />
        </div>
      ) : (
        <div className="rounded-card border border-border-default bg-white shadow-subtle divide-y divide-border-subtle overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                !item.read ? 'bg-brand-50/20 hover:bg-brand-50/40' : 'hover:bg-neutral-50/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-btn bg-neutral-100 border border-border-subtle shrink-0">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-bold ${!item.read ? 'text-text-primary' : 'text-secondary-700'}`}>
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="text-xs text-secondary-600 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                  <span className="text-[11px] text-secondary-400 mt-1 block">
                    {item.time}
                  </span>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead(item.id);
                  }}
                  className="text-secondary-400 hover:text-text-primary text-[11px] font-semibold shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
