"use client";
import { useState, useEffect } from "react";
import { useScheduleStore } from "@/lib/store";
import { BookingStatus, CreateBookingPayload, TIME_SLOTS, TimeSlot } from "@/types";
import { format } from "date-fns";
import { X, Trash2, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: BookingStatus[] = ["tentative", "confirmed", "ongoing", "done", "cancelled"];

export default function BookingModal() {
  const { modalOpen, closeModal, editingBooking, draftSlot, selectedDate, rooms, staff, upsertBooking, removeBooking } =
    useScheduleStore();

  const [clientName,   setClientName]   = useState("");
  const [roomId,       setRoomId]       = useState("");
  const [slot,         setSlot]         = useState<TimeSlot>("11AM-12NN");
  const [status,       setStatus]       = useState<BookingStatus>("confirmed");
  const [timeStarted,  setTimeStarted]  = useState("");
  const [timeFinished, setTimeFinished] = useState("");
  const [notes,        setNotes]        = useState("");
  const [services,     setServices]     = useState<{ staff_id: string; service_name: string }[]>([]);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [apiError,     setApiError]     = useState("");
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    if (editingBooking) {
      setClientName(editingBooking.client_name);
      setRoomId(editingBooking.room_id);
      setSlot(editingBooking.booked_slot);
      setStatus(editingBooking.status);
      setTimeStarted(editingBooking.time_started ?? "");
      setTimeFinished(editingBooking.time_finished ?? "");
      setNotes(editingBooking.notes ?? "");
      setServices((editingBooking.booking_services ?? []).map(s => ({ staff_id: s.staff_id, service_name: s.service_name })));
    } else {
      setClientName(""); setRoomId(draftSlot?.room_id ?? rooms[0]?.id ?? "");
      setSlot((draftSlot?.slot as TimeSlot) ?? "11AM-12NN");
      setStatus("confirmed"); setTimeStarted(""); setTimeFinished(""); setNotes("");
      setServices([{ staff_id: staff[0]?.id ?? "", service_name: "" }]);
    }
    setErrors({}); setApiError("");
  }, [modalOpen, editingBooking, draftSlot]);

  if (!modalOpen) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!clientName.trim())              e.clientName = "Client name is required.";
    else if (clientName.trim().length <= 1) e.clientName = "Name is invalid";
    else if (clientName.length > 50)    e.clientName = "Too much character";
    if (!roomId)                          e.roomId     = "Please select a room.";
    if (notes.length > 100)               e.notes      = "Notes must be 100 characters or fewer.";
    if (services.length === 0)            e.services   = "At least one therapist assignment is required.";
    services.forEach((svc, i) => {
      if (!svc.staff_id)                  e[`staff_${i}`]   = "Select a therapist.";
      if (!svc.service_name.trim())       e[`service_${i}`] = "Enter a service.";
      else if (svc.service_name.length > 50) e[`service_${i}`] = "Max 50 characters.";
    });
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
    if (!confirm(`Delete booking for ${editingBooking.client_name}?`)) return;
    setDeleting(true);
    await fetch(`/api/bookings/${editingBooking.id}`, { method: "DELETE" });
    removeBooking(editingBooking.id);
    setDeleting(false);
    closeModal();
  }

  function addService()  { setServices(s => [...s, { staff_id: staff[0]?.id ?? "", service_name: "" }]); }
  function removeService(i: number) { setServices(s => s.filter((_, idx) => idx !== i)); }
  function updateService(i: number, field: "staff_id" | "service_name", val: string) {
    setServices(s => s.map((svc, idx) => idx === i ? { ...svc, [field]: val } : svc));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--cream-3)]">
          <h2 className="font-serif text-xl text-[var(--charcoal)]">
            {editingBooking ? "Edit Booking" : "New Booking"}
          </h2>
          <button onClick={closeModal} className="p-1.5 hover:bg-[var(--cream-3)] rounded-lg transition">
            <X size={16} className="text-[var(--charcoal-mid)]" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Client name */}
          <div>
            <label className={labelCls}>Client Name <span className="text-red-400">*</span></label>
            <input
              value={clientName}
              onChange={e => { setClientName(e.target.value); setErrors(v => ({ ...v, clientName: "" })); }}
              className={cn(inputCls, errors.clientName && "border-red-400 bg-red-50")}
              placeholder="e.g. Maria Santos"
              maxLength={50}
            />
            {errors.clientName && <p className="text-red-500 text-[10px] mt-1">{errors.clientName}</p>}
          </div>

          {/* Slot + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Time Slot</label>
              <select value={slot} onChange={e => setSlot(e.target.value as TimeSlot)} className={inputCls}>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Room <span className="text-red-400">*</span></label>
              <select
                value={roomId}
                onChange={e => { setRoomId(e.target.value); setErrors(v => ({ ...v, roomId: "" })); }}
                className={cn(inputCls, errors.roomId && "border-red-400 bg-red-50")}
              >
                <option value="">Select room…</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.capacity > 1 ? `(${r.capacity} ${r.capacity === 5 ? "chairs" : "beds"})` : ""}
                  </option>
                ))}
              </select>
              {errors.roomId && <p className="text-red-500 text-[10px] mt-1">{errors.roomId}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs capitalize border transition",
                    status === s
                      ? "bg-[var(--gold)] border-[var(--gold)] text-white"
                      : "border-[var(--cream-3)] text-[var(--charcoal-mid)] hover:border-[var(--gold)]"
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actual times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Time Started (optional)</label>
              <input type="time" value={timeStarted} onChange={e => setTimeStarted(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time Finished (optional)</label>
              <input type="time" value={timeFinished} onChange={e => setTimeFinished(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Therapist assignments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>
                Therapist Assignments <span className="text-red-400">*</span>
              </label>
              <button onClick={addService}
                className="flex items-center gap-1 text-xs text-[var(--gold)] hover:text-[var(--gold-dark)] transition font-medium">
                <Plus size={12} /> Add
              </button>
            </div>

            {errors.services && <p className="text-red-500 text-[10px] mb-2">{errors.services}</p>}

            <div className="space-y-2">
              {services.map((svc, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-32">
                    <select
                      value={svc.staff_id}
                      onChange={e => updateService(i, "staff_id", e.target.value)}
                      className={cn(inputCls, errors[`staff_${i}`] && "border-red-400 bg-red-50")}
                    >
                      <option value="">Staff…</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {errors[`staff_${i}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`staff_${i}`]}</p>}
                  </div>
                  <div className="flex-1">
                    <input
                      value={svc.service_name}
                      onChange={e => updateService(i, "service_name", e.target.value)}
                      placeholder="e.g. FACIAL/WARTS"
                      maxLength={50}
                      className={cn(inputCls, errors[`service_${i}`] && "border-red-400 bg-red-50")}
                    />
                    {errors[`service_${i}`] && <p className="text-red-500 text-[10px] mt-0.5">{errors[`service_${i}`]}</p>}
                  </div>
                  <button onClick={() => removeService(i)} className="p-2 hover:bg-red-50 rounded-lg transition mt-0.5">
                    <X size={12} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes <span className="text-[var(--charcoal-mid)] normal-case tracking-normal font-normal">(optional, max 100)</span></label>
            <textarea value={notes} onChange={e => { setNotes(e.target.value); setErrors(v => ({ ...v, notes: "" })); }}
              rows={2} maxLength={100} className={cn(inputCls, "resize-none", errors.notes && "border-red-400 bg-red-50")}
              placeholder="Any additional notes…" />
            <div className="flex justify-between mt-0.5">
              {errors.notes
                ? <p className="text-red-500 text-[10px]">{errors.notes}</p>
                : <span />}
              <p className="text-[10px] text-[var(--charcoal-mid)]">{notes.length}/100</p>
            </div>
          </div>

          {/* Audit trail */}
          {editingBooking?.updated_at && (
            <p className="text-[10px] text-[var(--charcoal-mid)]">
              Last updated {new Date(editingBooking.updated_at).toLocaleString("en-PH")}
            </p>
          )}

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200">
              <AlertTriangle size={12} className="flex-shrink-0" />
              {apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-[var(--cream-3)] flex items-center justify-between gap-3">
          {editingBooking ? (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition disabled:opacity-50">
              <Trash2 size={13} />{deleting ? "Deleting…" : "Delete"}
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={closeModal}
              className="px-4 py-2 rounded-xl border border-[var(--cream-3)] text-xs text-[var(--charcoal-mid)] hover:bg-[var(--cream-3)] transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase transition disabled:opacity-60">
              {saving ? "Saving…" : editingBooking ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelCls = "block text-[10px] tracking-widest uppercase text-[var(--charcoal-mid)] mb-1.5 font-medium";
const inputCls  = "w-full px-3 py-2.5 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)]";
