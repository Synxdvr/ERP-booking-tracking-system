"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Simple module-level event bus — no extra context/provider needed
type Listener = (toast: Toast) => void;
const listeners: Listener[] = [];

export function toast(message: string, type: ToastType = "success") {
  const id = Math.random().toString(36).slice(2);
  const t: Toast = { id, message, type };
  listeners.forEach(fn => fn(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 3500);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium max-w-xs pointer-events-auto",
            "animate-slide-up",
            t.type === "success"
              ? "bg-white border-green-200 text-green-800"
              : "bg-white border-red-200 text-red-700"
          )}
        >
          {t.type === "success"
            ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
            : <XCircle    size={15} className="text-red-500 flex-shrink-0" />
          }
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="p-0.5 rounded hover:bg-black/5 transition flex-shrink-0"
          >
            <X size={12} className="opacity-50" />
          </button>
        </div>
      ))}
    </div>
  );
}
