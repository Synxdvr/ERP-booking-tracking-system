"use client";
import { useEffect, useState } from "react";
import { Room } from "@/types";
import { Plus, Pencil, X, Check, BedDouble, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "@/components/ui/Toaster";

export default function RoomsPage() {
  const [rooms,      setRooms]      = useState<Room[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editName,   setEditName]   = useState("");
  const [editCap,    setEditCap]    = useState(1);
  const [adding,     setAdding]     = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newCap,     setNewCap]     = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmRoom, setConfirmRoom] = useState<Room | null>(null);
  const [error,      setError]      = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/rooms");
    if (res.ok) {
      setRooms(await res.json());
    } else {
      toast("Failed to load rooms.", "error");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(room: Room) {
    setEditId(room.id);
    setEditName(room.name);
    setEditCap(room.capacity);
    setError("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), capacity: editCap }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }
    toast("Room updated.", "success");
    setEditId(null);
    load();
  }

  async function confirmDelete(room: Room) {
    setConfirmRoom(room);
  }

  async function handleDelete() {
    if (!confirmRoom) return;
    setDeletingId(confirmRoom.id);
    setConfirmRoom(null);
    const res = await fetch(`/api/rooms/${confirmRoom.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      toast(`Room "${confirmRoom.name}" deactivated.`, "success");
      load();
    } else {
      toast("Failed to deactivate room.", "error");
    }
  }

  async function addRoom() {
    if (!newName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), capacity: newCap }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to add room.");
      return;
    }
    toast("Room added.", "success");
    setAdding(false);
    setNewName("");
    setNewCap(1);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[var(--charcoal)]">Rooms</h1>
          <p className="text-sm text-[var(--charcoal-mid)] mt-0.5">Manage treatment rooms and their capacity</p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase transition"
        >
          <Plus size={14} /> Add Room
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-4 bg-white border border-[var(--gold)] rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRoom()}
            placeholder="Room name…"
            autoFocus
            maxLength={50}
            className={inputCls + " flex-1"}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-xs text-[var(--charcoal-mid)] whitespace-nowrap">Beds / Chairs</label>
            <input
              type="number"
              min={1}
              max={20}
              value={newCap}
              onChange={e => setNewCap(+e.target.value)}
              className={inputCls + " w-16 text-center"}
            />
          </div>
          <button
            onClick={addRoom}
            disabled={saving}
            className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => { setAdding(false); setError(""); }}
            className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
          >
            <X size={14} className="text-[var(--charcoal-mid)]" />
          </button>
        </div>
      )}

      {/* Rooms list */}
      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-[var(--charcoal-mid)] py-8 text-center">Loading…</p>
        )}
        {!loading && rooms.length === 0 && !adding && (
          <div className="text-center py-12 text-[var(--charcoal-mid)]">
            <BedDouble size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No active rooms yet.</p>
            <p className="text-xs mt-1">Click &quot;Add Room&quot; to create one.</p>
          </div>
        )}
        {!loading && rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              "bg-white border border-[var(--cream-3)] rounded-2xl px-5 py-4 flex items-center gap-4 transition",
              deletingId === room.id && "opacity-50 pointer-events-none"
            )}
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-[var(--cream-3)] flex items-center justify-center flex-shrink-0">
              {room.capacity >= 5
                ? <Armchair size={15} className="text-[var(--gold)]" />
                : <BedDouble size={15} className="text-[var(--gold)]" />}
            </div>

            {editId === room.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveEdit(room.id)}
                  autoFocus
                  maxLength={50}
                  className={inputCls + " flex-1"}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="text-xs text-[var(--charcoal-mid)] whitespace-nowrap">Beds / Chairs</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editCap}
                    onChange={e => setEditCap(+e.target.value)}
                    className={inputCls + " w-16 text-center"}
                  />
                </div>
                <button
                  onClick={() => saveEdit(room.id)}
                  disabled={saving}
                  className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setEditId(null); setError(""); }}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
                >
                  <X size={14} className="text-[var(--charcoal-mid)]" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[var(--charcoal)]">{room.name}</p>
                  <p className="text-xs text-[var(--charcoal-mid)]">
                    {room.capacity} {room.capacity >= 5 ? "chair" : "bed"}{room.capacity !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(room)}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
                >
                  <Pencil size={13} className="text-[var(--charcoal-mid)]" />
                </button>
                <button
                  onClick={() => confirmDelete(room)}
                  disabled={deletingId === room.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  <X size={13} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmRoom !== null}
        title="Deactivate Room"
        message={`Deactivate room "${confirmRoom?.name}"? It won't appear in new bookings.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmRoom(null)}
      />
    </div>
  );
}

const inputCls = "px-3 py-2 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)]";
