"use client";
import { useState, useEffect } from "react";
import { useScheduleStore } from "@/lib/store";
import {
  BookingStatus,
  CreateBookingPayload,
  STATUS_ACTIONS,
  STATUS_LABELS,
  STATUS_BG,
  TIME_SLOTS,
  TimeSlot,
} from "@/types";
import { format } from "date-fns";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function BookingModal() {
  const {
    modalOpen, closeModal, editingBooking, draftSlot,
    selectedDate, rooms, staff, upsertBooking, removeBooking,
  } = useScheduleStore();

  const [clientName,    setClientName]    = useState("");
  const [roomId,        setRoomId]        = useState("");
  const [slot,          setSlot]          = useState<TimeSlot>("11AM-12NN");
  const [timeStarted,   setTimeStarted]   = useState("");
  const [timeFinished,  setTimeFinished]  = useState("");
  const [notes,         setNotes]         = useState("");
  const [services,      setServices]      = useState<{ staff_id: string; service_name: string }[]>([]);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [apiError,      setApiError]      = useState("");
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [statusLoading, setStatusLoading] = useState<BookingStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    setErrors({}); setApiError("");

    if (editingBooking) {
      setClientName(editingBooking.client_name);
      setRoomId(editingBooking.room_id);
      setSlot(editingBooking.booked_slot);
      setTimeStarted(editingBooking.time_started ?? "");
      setTimeFinished(editingBooking.time_finished ?? "");
      setNotes(editingBooking.notes ?? "");
      const first = editingBooking.booking_services?.[0];
      setServices([{ staff_id: first?.staff_id ?? "", service_name: first?.service_name ?? "" }]);
    } else {
      setClientName("");
      setRoomId("");
      setSlot((draftSlot?.slot as TimeSlot) ?? "11AM-12NN");
      setTimeStarted(""); setTimeFinished(""); setNotes("");
      setServices([{ staff_id: draftSlot?.staff_id ?? "", service_name: "" }]);
    }
  }, [modalOpen, editingBooking, draftSlot]);

  if (!modalOpen) return null;

  async function handleStatusAction(next: BookingStatus) {
    if (!editingBooking) return;
    setStatusLoading(next);
    setApiError("");

    const res = await fetch(`/api/bookings/${editingBooking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    setStatusLoading(null);

    if (!res.ok) { setApiError(data.error ?? "Status update failed."); return; }
    upsertBooking(data);
    closeModal();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!clientName.trim())                e.clientName = "Client name is required.";
    else if (clientName.trim().length < 2) e.clientName = "Name must be at least 2 characters.";
    else if (clientName.length > 50)       e.clientName = "Max 50 characters.";
    if (!roomId)                           e.roomId     = "Please choose a room.";
    if (notes.length > 100)                e.notes      = "Max 100 characters.";
    const svc = services[0];
    if (!svc?.staff_id)                    e[`staff_0`]   = "Choose a therapist.";
    if (!svc?.service_name.trim())         e[`service_0`] = "Service is required.";
    else if (svc.service_name.length > 50) e[`service_0`] = "Max 50 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true); setApiError("");

    const url    = editingBooking ? `/api/bookings/${editingBooking.id}` : "/api/bookings";
    const method = editingBooking ? "PATCH" : "POST";

    const body = editingBooking
      ? {
          id:             editingBooking.id,
          date:           format(selectedDate, "yyyy-MM-dd"),
          booked_slot:    slot,
          client_name:    clientName.trim(),
          room_id:        roomId,
          notes:          notes || null,
          time_started:   timeStarted || null,
          time_finished:  timeFinished || null,
          services:       services as [{ staff_id: string; service_name: string }],
        }
      : {
          date:        format(selectedDate, "yyyy-MM-dd"),
          booked_slot: slot,
          client_name: clientName.trim(),
          room_id:     roomId,
          status:      "confirmed" as const,
          notes:       notes || undefined,
          services:    services as [{ staff_id: string; service_name: string }],
        };

    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setApiError(data.error ?? "Something went wrong."); return; }
    upsertBooking(data);
    closeModal();
  }

  async function handleDelete() {
    if (!editingBooking) return;
    setDeleting(true);
    await fetch(`/api/bookings/${editingBooking.id}`, { method: "DELETE" });
    removeBooking(editingBooking.id);
    setDeleting(false);
    setConfirmDelete(false);
    closeModal();
  }

  function updateService(field: "staff_id" | "service_name", val: string) {
    setServices([{ ...services[0], [field]: val }]);
    setErrors(e => { const n = { ...e }; delete n[`staff_0`]; delete n[`service_0`]; return n; });
  }

  const statusActions = editingBooking ? STATUS_ACTIONS[editingBooking.status] : [];
  const s             = editingBooking ? STATUS_BG[editingBooking.status] : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--cream-3)]">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl text-[var(--charcoal)] font-semibold">
                {editingBooking ? "Edit Booking" : "New Booking"}
              </h2>
              {editingBooking && s && (
                <span className={cn(
                  "text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border",
                  s.bg, s.text, s.border
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />
                  {STATUS_LABELS[editingBooking.status]}
                </span>
              )}
            </div>
            <button onClick={closeModal} className="p-1.5 hover:bg-[var(--cream-3)] rounded-lg transition">
              <X size={16} className="text-[var(--charcoal-mid)]" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            <Field label="Client Name" required>
              <input
                value={clientName}
                onChange={e => { setClientName(e.target.value); clearErr("clientName"); }}
                className={inp(errors.clientName)}
                placeholder="e.g. Maria Santos"
                maxLength={50}
              />
              <Err msg={errors.clientName} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Time Slot">
                <select value={slot} onChange={e => setSlot(e.target.value as TimeSlot)} className={inp()}>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Room" required>
                <select
                  value={roomId}
                  onChange={e => { setRoomId(e.target.value); clearErr("roomId"); }}
                  className={inp(errors.roomId)}
                >
                  <option value="">Choose a room…</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}{r.capacity > 1 ? ` (${r.capacity} ${r.capacity >= 5 ? "chairs" : "beds"})` : ""}
                    </option>
                  ))}
                </select>
                <Err msg={errors.roomId} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Time Started">
                <input type="time" value={timeStarted} onChange={e => setTimeStarted(e.target.value)} className={inp()} />
              </Field>
              <Field label="Time Finished">
                <input type="time" value={timeFinished} onChange={e => setTimeFinished(e.target.value)} className={inp()} />
              </Field>
            </div>

            <div>
              <span className={labelCls}>
                Therapist &amp; Service <span className="text-red-400">*</span>
              </span>
              <div className="flex gap-2 items-start mt-1.5">
                <div className="w-36 flex-shrink-0">
                  <select
                    value={services[0]?.staff_id ?? ""}
                    onChange={e => updateService("staff_id", e.target.value)}
                    className={inp(errors[`staff_0`])}
                  >
                    <option value="">Choose…</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <Err msg={errors[`staff_0`]} />
                </div>
                <div className="flex-1">
                  <input
                    value={services[0]?.service_name ?? ""}
                    onChange={e => updateService("service_name", e.target.value)}
                    placeholder="e.g. FACIAL / MASSAGE"
                    maxLength={50}
                    className={inp(errors[`service_0`])}
                  />
                  <Err msg={errors[`service_0`]} />
                </div>
              </div>
            </div>

            <Field label="Notes" hint="optional">
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={e => { setNotes(e.target.value); clearErr("notes"); }}
                  rows={2} maxLength={100}
                  className={cn(inp(errors.notes), "resize-none")}
                  placeholder="Any additional notes…"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-[var(--charcoal-mid)] font-medium pointer-events-none">
                  {notes.length}/100
                </span>
              </div>
              <Err msg={errors.notes} />
            </Field>

            {/* Status action buttons — above audit trail */}
            {editingBooking && statusActions.length > 0 && (
              <div className="pt-1">
                <span className={labelCls}>Update Status</span>
                <div className="flex gap-2 mt-1.5">
                  {statusActions.map((action) => (
                    <button
                      key={action.next}
                      disabled={statusLoading !== null}
                      onClick={() => handleStatusAction(action.next)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-semibold border tracking-wide uppercase transition",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        action.variant === "primary" && "bg-[var(--gold)] border-[var(--gold)] text-white hover:bg-[var(--gold-dark)]",
                        action.variant === "danger"  && "border-red-300 text-red-500 bg-white hover:bg-red-50",
                        action.variant === "ghost"   && "border-[var(--cream-3)] text-[var(--charcoal-mid)] bg-white hover:bg-[var(--cream-3)]",
                      )}
                    >
                      {statusLoading === action.next ? "Updating…" : action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audit trail */}
            {editingBooking?.updated_at && (
              <p className="text-[10px] text-[var(--charcoal-mid)] font-medium">
                Last updated {new Date(editingBooking.updated_at).toLocaleString("en-PH")}
              </p>
            )}

            {apiError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-xl border border-red-200 font-medium">
                <AlertTriangle size={13} className="flex-shrink-0" />
                {apiError}
              </div>
            )}
          </div>

          {/* Footer — X closes, no separate Cancel button */}
          <div className="px-6 pb-5 pt-3 border-t border-[var(--cream-3)] flex items-center justify-between gap-3">
            {editingBooking ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50 font-semibold"
              >
                <Trash2 size={13} />{deleting ? "Deleting…" : "Delete"}
              </button>
            ) : <div />}

            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto px-5 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase font-semibold transition disabled:opacity-60"
            >
              {saving ? "Saving…" : editingBooking ? "Update" : "Create"}
            </button>
          </div>

        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Delete Booking"
        message={`Delete the booking for ${editingBooking?.client_name ?? "this client"}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );

  function clearErr(key: string) {
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="normal-case tracking-normal font-normal text-[var(--charcoal-mid)] ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-500 text-[10px] mt-1 font-medium">{msg}</p>;
}

const labelCls = "block text-[10px] tracking-widest uppercase text-[var(--charcoal-mid)] mb-1.5 font-semibold";
function inp(err?: string) {
  return cn(
    "w-full px-3 py-2.5 rounded-xl bg-[var(--cream-3)] border border-transparent",
    "focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)] font-medium",
    err && "border-red-400 bg-red-50"
  );
}