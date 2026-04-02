"use client";
import { useEffect, useState } from "react";
import { Room } from "@/types";
import { Plus, Pencil, X, Check, BedDouble, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCap, setEditCap]   = useState(1);
  const [adding, setAdding]     = useState(false);
  const [newName, setNewName]   = useState("");
  const [newCap, setNewCap]     = useState(1);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/rooms");
    setRooms(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startEdit(room: Room) {
    setEditId(room.id); setEditName(room.name); setEditCap(room.capacity); setError("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), capacity: editCap }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save."); return; }
    setEditId(null); load();
  }

  async function deleteRoom(id: string, name: string) {
    if (!confirm(`Deactivate room "${name}"? It won't appear in new bookings.`)) return;
    await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    load();
  }

  async function addRoom() {
    if (!newName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), capacity: newCap }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to add room."); return; }
    setAdding(false); setNewName(""); setNewCap(1); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[var(--charcoal)]">Rooms</h1>
          <p className="text-sm text-[var(--charcoal-mid)] mt-0.5">Manage treatment rooms and their capacity</p>
        </div>
        <button onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase transition">
          <Plus size={14} /> Add Room
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Add form */}
      {adding && (
        <div className="mb-4 bg-white border border-[var(--gold)] rounded-2xl p-4 flex items-center gap-3 animate-slide-up">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Room name…" autoFocus
            className={inputCls + " flex-1"} />
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-xs text-[var(--charcoal-mid)] whitespace-nowrap">Beds / Chairs</label>
            <input type="number" min={1} max={20} value={newCap} onChange={e => setNewCap(+e.target.value)}
              className={inputCls + " w-16 text-center"} />
          </div>
          <button onClick={addRoom} disabled={saving}
            className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50">
            <Check size={14} />
          </button>
          <button onClick={() => setAdding(false)} className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
            <X size={14} className="text-[var(--charcoal-mid)]" />
          </button>
        </div>
      )}

      {/* Rooms list */}
      <div className="space-y-2">
        {loading && <p className="text-sm text-[var(--charcoal-mid)] py-8 text-center">Loading…</p>}
        {!loading && rooms.map((room) => (
          <div key={room.id}
            className="bg-white border border-[var(--cream-3)] rounded-2xl px-5 py-4 flex items-center gap-4">
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-[var(--cream-3)] flex items-center justify-center flex-shrink-0">
              {room.capacity >= 5
                ? <Armchair size={15} className="text-[var(--gold)]" />
                : <BedDouble size={15} className="text-[var(--gold)]" />}
            </div>

            {editId === room.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  autoFocus className={inputCls + " flex-1"} />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <label className="text-xs text-[var(--charcoal-mid)] whitespace-nowrap">Beds / Chairs</label>
                  <input type="number" min={1} max={20} value={editCap}
                    onChange={e => setEditCap(+e.target.value)}
                    className={inputCls + " w-16 text-center"} />
                </div>
                <button onClick={() => saveEdit(room.id)} disabled={saving}
                  className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditId(null)}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
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
                <button onClick={() => startEdit(room)}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
                  <Pencil size={13} className="text-[var(--charcoal-mid)]" />
                </button>
                <button onClick={() => deleteRoom(room.id, room.name)}
                  className="p-2 rounded-lg hover:bg-red-50 transition">
                  <X size={13} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "px-3 py-2 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)]";
