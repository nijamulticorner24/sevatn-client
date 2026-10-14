import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/40 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-modal border border-[#E6EAF0]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${
                isDestructive ? 'bg-[#FDECEC] text-[#C2413B]' : 'bg-[#FEF7E6] text-[#C98219]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#172033]">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#98A2B3] hover:text-[#172033] transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-[13.5px] text-[#667085] leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-[7px] border border-[#D0D5DD] bg-white px-4 py-2 text-[13px] font-medium text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-[7px] px-4 py-2 text-[13px] font-semibold text-white transition-colors shadow-subtle disabled:opacity-50 ${
              isDestructive
                ? 'bg-[#C2413B] hover:bg-[#A9322D]'
                : 'bg-[#C98219] hover:bg-[#B57414]'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
