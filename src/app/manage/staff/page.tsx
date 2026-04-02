"use client";
import { useEffect, useState } from "react";
import { Staff } from "@/types";
import { Plus, Pencil, X, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#BE6B7A","#7A9E85","#6B8EB8","#B8866B",
  "#9B7AB8","#B8A76B","#7AB8A7","#B86B8E","#8EB86B",
  "#D4AF37","#6B9EB8","#B87A6B",
];

export default function StaffPage() {
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#D4AF37");
  const [adding, setAdding]     = useState(false);
  const [newName, setNewName]   = useState("");
  const [newColor, setNewColor] = useState("#7A9E85");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/staff");
    setStaff(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color_hex: editColor }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to save."); return; }
    setEditId(null); load();
  }

  async function deleteStaff(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"? They won't appear in new bookings.`)) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    load();
  }

  async function addStaff() {
    if (!newName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim().toUpperCase(), color_hex: newColor }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to add. Name may already exist."); return; }
    setAdding(false); setNewName(""); setNewColor("#7A9E85"); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[var(--charcoal)]">Staff</h1>
          <p className="text-sm text-[var(--charcoal-mid)] mt-0.5">Manage therapists and their display colors</p>
        </div>
        <button onClick={() => { setAdding(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase transition">
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

      {/* Add form */}
      {adding && (
        <div className="mb-4 bg-white border border-[var(--gold)] rounded-2xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Staff name (e.g. MITCH)" autoFocus
              className={inputCls + " flex-1"} />
            <button onClick={addStaff} disabled={saving}
              className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50">
              <Check size={14} />
            </button>
            <button onClick={() => setAdding(false)} className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
              <X size={14} className="text-[var(--charcoal-mid)]" />
            </button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
        </div>
      )}

      {/* Staff list */}
      <div className="space-y-2">
        {loading && <p className="text-sm text-[var(--charcoal-mid)] py-8 text-center">Loading…</p>}
        {!loading && staff.map((member) => (
          <div key={member.id}
            className="bg-white border border-[var(--cream-3)] rounded-2xl px-5 py-4 flex items-center gap-4">
            {/* Color avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ backgroundColor: member.color_hex }}>
              {member.name[0]}
            </div>

            {editId === member.id ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    autoFocus className={inputCls + " flex-1"} />
                  <button onClick={() => saveEdit(member.id)} disabled={saving}
                    className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
                    <X size={14} className="text-[var(--charcoal-mid)]" />
                  </button>
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-medium text-sm text-[var(--charcoal)]">{member.name}</p>
                  <p className="text-xs text-[var(--charcoal-mid)]">{member.color_hex}</p>
                </div>
                <button onClick={() => { setEditId(member.id); setEditName(member.name); setEditColor(member.color_hex); }}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition">
                  <Pencil size={13} className="text-[var(--charcoal-mid)]" />
                </button>
                <button onClick={() => deleteStaff(member.id, member.name)}
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

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] tracking-widest uppercase text-[var(--charcoal-mid)]">Color</span>
      {PRESET_COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)}
          className={cn("w-6 h-6 rounded-full border-2 transition",
            value === c ? "border-[var(--charcoal)] scale-110" : "border-transparent hover:scale-105")}
          style={{ backgroundColor: c }} />
      ))}
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" title="Custom color" />
    </div>
  );
}

const inputCls = "px-3 py-2 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)]";
