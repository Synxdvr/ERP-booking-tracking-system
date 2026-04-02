"use client";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  danger = false, onConfirm, onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
              <AlertTriangle size={16} className={danger ? "text-red-600" : "text-amber-600"} />
            </div>
            <h3 className="font-serif text-lg text-[var(--charcoal)] font-semibold">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-[var(--cream-3)] rounded-lg transition ml-2 flex-shrink-0">
            <X size={15} className="text-[var(--charcoal-mid)]" />
          </button>
        </div>

        {/* Body */}
        <p className="px-6 pb-5 text-sm text-[var(--charcoal-mid)] font-normal leading-relaxed">
          {message}
        </p>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[var(--cream-3)] text-xs text-[var(--charcoal-mid)] hover:bg-[var(--cream-3)] font-medium transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-white text-xs font-semibold tracking-wide transition ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[var(--gold)] hover:bg-[var(--gold-dark)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
