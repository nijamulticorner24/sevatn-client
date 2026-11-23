import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatChips(amount: number | string, includeLabel = false): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val || 0);
  return includeLabel ? `🪙 ${formatted} Chips` : `🪙 ${formatted}`;
}

export function formatINR(amount: number | string): string {
  return formatChips(amount, false);
}

export const formatCurrency = formatINR;

export function formatNumber(val: number | string): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('en-IN').format(n || 0);
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string | Date): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
