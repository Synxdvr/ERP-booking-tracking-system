"use client";
import { useState, useEffect } from "react";
import { useScheduleStore } from "@/lib/store";
import { BookingStatus, CreateBookingPayload, TIME_SLOTS, TimeSlot } from "@/types";
import { format } from "date-fns";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STATUSES: BookingStatus[] = ["tentative", "confirmed", "ongoing", "done", "cancelled"];

export default function BookingModal() {
  const {
    modalOpen, closeModal, editingBooking, draftSlot,
    selectedDate, rooms, staff, upsertBooking, removeBooking,
  } = useScheduleStore();

  const [clientName,    setClientName]    = useState("");
  const [roomId,        setRoomId]        = useState("");         // "" = no room chosen
  const [slot,          setSlot]          = useState<TimeSlot>("11AM-12NN");
  const [status,        setStatus]        = useState<BookingStatus>("confirmed");
  const [timeStarted,   setTimeStarted]   = useState("");
  const [timeFinished,  setTimeFinished]  = useState("");
  const [notes,         setNotes]         = useState("");
  // Each row: one therapist (required) + one service text (required)
  const [services,      setServices]      = useState<{ staff_id: string; service_name: string }[]>([]);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [apiError,      setApiError]      = useState("");
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    setErrors({}); setApiError("");

    if (editingBooking) {
      setClientName(editingBooking.client_name);
      setRoomId(editingBooking.room_id);
      setSlot(editingBooking.booked_slot);
      setStatus(editingBooking.status);
      setTimeStarted(editingBooking.time_started ?? "");
      setTimeFinished(editingBooking.time_finished ?? "");
      setNotes(editingBooking.notes ?? "");
      setServices((editingBooking.booking_services ?? []).map(s => ({
        staff_id: s.staff_id,
        service_name: s.service_name,
      })));
    } else {
      // New booking defaults
      setClientName("");
      setRoomId("");                                        // always start empty
      setSlot((draftSlot?.slot as TimeSlot) ?? "11AM-12NN");
      setStatus("confirmed");
      setTimeStarted(""); setTimeFinished(""); setNotes("");
      // If opened from a therapist column → pre-fill that therapist, else empty row
      setServices([{
        staff_id: draftSlot?.staff_id ?? "",              // "" = "Choose therapist"
        service_name: "",
      }]);
    }
  }, [modalOpen, editingBooking, draftSlot]);

  if (!modalOpen) return null;

  function validate() {
    const e: Record<string, string> = {};

    if (!clientName.trim())                e.clientName = "Client name is required.";
    else if (clientName.trim().length < 2) e.clientName = "Name must be at least 2 characters.";
    else if (clientName.length > 50)      e.clientName = "Max 50 characters.";

    if (!roomId)                            e.roomId = "Please choose a room.";
    if (notes.length > 100)                 e.notes  = "Max 100 characters.";

    if (services.length === 0) {
      e.services = "Service is required.";
    } else {
      services.forEach((svc, i) => {
        if (!svc.staff_id)                      e[`staff_${i}`]   = "Choose a therapist.";
        if (!svc.service_name.trim())           e[`service_${i}`] = "Service is required.";
        else if (svc.service_name.length > 50) e[`service_${i}`] = "Max 50 characters.";
      });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true); setApiError("");

    const payload: CreateBookingPayload = {
      date: format(selectedDate, "yyyy-MM-dd"),
      booked_slot: slot,
      client_name: clientName.trim(),
      room_id: roomId,
      status,
      notes: notes || undefined,
      services,
    };

    const url    = editingBooking ? `/api/bookings/${editingBooking.id}` : "/api/bookings";
    const method = editingBooking ? "PATCH" : "POST";
    const body   = editingBooking
      ? { ...payload, id: editingBooking.id, time_started: timeStarted || null, time_finished: timeFinished || null }
      : payload;

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

  // ── Service rows ─────────────────────────────────────────────────────────────
  function addService() {
    setServices(s => [...s, { staff_id: "", service_name: "" }]);
  }
  function removeService(i: number) {
    setServices(s => s.filter((_, idx) => idx !== i));
  }
  function updateService(i: number, field: "staff_id" | "service_name", val: string) {
    setServices(s => s.map((svc, idx) => idx === i ? { ...svc, [field]: val } : svc));
    // Clear per-row errors on change
    setErrors(e => { const n = { ...e }; delete n[`staff_${i}`]; delete n[`service_${i}`]; return n; });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--cream-3)]">
            <h2 className="font-serif text-xl text-[var(--charcoal)] font-semibold">
              {editingBooking ? "Edit Booking" : "New Booking"}
            </h2>
            <button onClick={closeModal} className="p-1.5 hover:bg-[var(--cream-3)] rounded-lg transition">
              <X size={16} className="text-[var(--charcoal-mid)]" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Client name */}
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

            {/* Time slot + Room — side by side */}
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

            {/* Status chips */}
            <Field label="Status">
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs capitalize border transition font-medium",
                      status === s
                        ? "bg-[var(--gold)] border-[var(--gold)] text-white"
                        : "border-[var(--cream-3)] text-[var(--charcoal-mid)] hover:border-[var(--gold)]"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            {/* Actual times */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Time Started" hint="optional">
                <input type="time" value={timeStarted} onChange={e => setTimeStarted(e.target.value)} className={inp()} />
              </Field>
              <Field label="Time Finished" hint="optional">
                <input type="time" value={timeFinished} onChange={e => setTimeFinished(e.target.value)} className={inp()} />
              </Field>
            </div>

            {/* Therapist + service rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={labelCls}>
                  Therapist &amp; Service <span className="text-red-400">*</span>
                </span>
                <button
                  onClick={addService}
                  className="text-xs text-[var(--gold)] hover:text-[var(--gold-dark)] font-semibold transition"
                >
                  + Add row
                </button>
              </div>

              {errors.services && <Err msg={errors.services} />}

              <div className="space-y-2">
                {services.map((svc, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    {/* Therapist picker */}
                    <div className="w-36 flex-shrink-0">
                      <select
                        value={svc.staff_id}
                        onChange={e => updateService(i, "staff_id", e.target.value)}
                        className={inp(errors[`staff_${i}`])}
                      >
                        <option value="">Choose…</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Err msg={errors[`staff_${i}`]} />
                    </div>

                    {/* Service text */}
                    <div className="flex-1">
                      <input
                        value={svc.service_name}
                        onChange={e => updateService(i, "service_name", e.target.value)}
                        placeholder="e.g. FACIAL / MASSAGE"
                        maxLength={50}
                        className={inp(errors[`service_${i}`])}
                      />
                      <Err msg={errors[`service_${i}`]} />
                    </div>

                    {/* Remove row — only show if more than 1 row */}
                    {services.length > 1 && (
                      <button onClick={() => removeService(i)} className="p-2 hover:bg-red-50 rounded-lg transition mt-0.5 flex-shrink-0">
                        <X size={12} className="text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
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

            {/* Audit trail */}
            {editingBooking?.updated_at && (
              <p className="text-[10px] text-[var(--charcoal-mid)] font-medium">
                Last updated {new Date(editingBooking.updated_at).toLocaleString("en-PH")}
              </p>
            )}

            {/* API / conflict error */}
            {apiError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-xl border border-red-200 font-medium">
                <AlertTriangle size={13} className="flex-shrink-0" />
                {apiError}
              </div>
            )}
          </div>

          {/* Footer */}
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

            <div className="flex gap-2">
              <button onClick={closeModal}
                className="px-4 py-2 rounded-xl border border-[var(--cream-3)] text-xs text-[var(--charcoal-mid)] hover:bg-[var(--cream-3)] font-semibold transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase font-semibold transition disabled:opacity-60">
                {saving ? "Saving…" : editingBooking ? "Update" : "Create"}
              </button>
            </div>
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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function clearErr(key: string) { setErrors(e => { const n = { ...e }; delete n[key]; return n; }); }
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
