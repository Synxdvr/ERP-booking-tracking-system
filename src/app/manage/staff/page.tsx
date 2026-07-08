"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Staff } from "@/types";
import { Plus, Pencil, X, Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "@/components/ui/Toaster";
import { useScheduleStore } from "@/lib/store";

const PRESET_COLORS = [
  "#BE6B7A","#7A9E85","#6B8EB8","#B8866B",
  "#9B7AB8","#B8A76B","#7AB8A7","#B86B8E",
  "#8EB86B","#D4AF37","#6B9EB8","#B87A6B",
];

// ─── Custom hook: list + cold-load ───────────────────────────────────────────

function useStaffList() {
  const staff        = useScheduleStore((s) => s.staff);
  const setStaffList = useScheduleStore((s) => s.setStaff);
  const [loading, setLoading] = useState(staff.length === 0);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff");
    if (res.ok) {
      setStaffList(await res.json());
    } else {
      toast("Failed to load staff.", "error");
    }
    setLoading(false);
  }, [setStaffList]);

  // Only fetch on first mount when the store is empty
  useEffect(() => {
    if (staff.length === 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { staff, setStaffList, loading };
}

// ─── Custom hook: edit a staff member ────────────────────────────────────────

function useStaffEdit() {
  const upsertStaff = useScheduleStore((s) => s.upsertStaff);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [editName,  setEditName]  = useState("");
  const [editColor, setEditColor] = useState("#D4AF37");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const startEdit = useCallback((member: Staff) => {
    setEditId(member.id);
    setEditName(member.name);
    setEditColor(member.color_hex);
    setError("");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditId(null);
    setError("");
  }, []);

  const saveEdit = useCallback(async (id: string) => {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color_hex: editColor }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    toast("Staff member updated.", "success");
    upsertStaff(data);
    setEditId(null);
  }, [editName, editColor, upsertStaff]);

  return {
    editId, editName, editColor, saving, error,
    setEditName, setEditColor,
    startEdit, cancelEdit, saveEdit,
  };
}

// ─── Custom hook: add a staff member ─────────────────────────────────────────

function useStaffAdd(staffCount: number) {
  const upsertStaff = useScheduleStore((s) => s.upsertStaff);
  const [adding,   setAdding]   = useState(false);
  const [newName,  setNewName]  = useState("");
  const [newColor, setNewColor] = useState("#7A9E85");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const openAdd   = useCallback(() => { setAdding(true);  setError(""); }, []);
  const cancelAdd = useCallback(() => { setAdding(false); setError(""); }, []);

  const addStaff = useCallback(async () => {
    if (!newName.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim().toUpperCase(),
        color_hex: newColor,
        sort_order: staffCount + 1,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to add. Name may already exist."); return; }
    toast("Staff member added.", "success");
    upsertStaff(data);
    setAdding(false);
    setNewName("");
    setNewColor("#7A9E85");
  }, [newName, newColor, staffCount, upsertStaff]);

  return {
    adding, newName, newColor, saving, error,
    setNewName, setNewColor,
    openAdd, cancelAdd, addStaff,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const removeStaff  = useScheduleStore((s) => s.removeStaff);

  const { staff, setStaffList, loading } = useStaffList();
  const edit = useStaffEdit();
  const add  = useStaffAdd(staff.length);

  const [reordering,    setReordering]    = useState(false);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [confirmMember, setConfirmMember] = useState<Staff | null>(null);

  const dragIndex = useRef<number | null>(null);

  const error = edit.editId ? edit.error : add.error;

  // ── Drag handlers ──────────────────────────────────────────────
  function onDragStart(i: number) {
    dragIndex.current = i;
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const reordered = [...staff];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(i, 0, moved);
    dragIndex.current = i;
    setStaffList(reordered);
  }

  async function onDragEnd() {
    dragIndex.current = null;
    setReordering(true);
    const res = await fetch("/api/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: staff.map(s => s.id) }),
    });
    setReordering(false);
    if (!res.ok) {
      toast("Failed to save new order.", "error");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirmMember) return;
    const target = confirmMember;
    setDeletingId(target.id);
    setConfirmMember(null);
    const res = await fetch(`/api/staff/${target.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      toast(`"${target.name}" deactivated.`, "success");
      removeStaff(target.id);
    } else {
      toast("Failed to deactivate staff member.", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[var(--charcoal)]">Staff</h1>
          <p className="text-sm text-[var(--charcoal-mid)] mt-0.5">
            Manage therapists · drag <GripVertical size={12} className="inline" /> to reorder columns
          </p>
        </div>
        <button
          onClick={add.openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white text-xs tracking-widest uppercase font-semibold transition"
        >
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl border border-red-100">{error}</p>
      )}

      {reordering && (
        <p className="text-xs text-[var(--charcoal-mid)] mb-3 font-medium animate-pulse">Saving order…</p>
      )}

      {/* Add form */}
      {add.adding && (
        <div className="mb-4 bg-white border border-[var(--gold)] rounded-2xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <input
              value={add.newName}
              onChange={e => add.setNewName(e.target.value)}
              placeholder="Staff name (e.g. MITCH)"
              autoFocus
              maxLength={50}
              className={inputCls + " flex-1"}
              onKeyDown={e => e.key === "Enter" && add.addStaff()}
            />
            <button
              onClick={add.addStaff}
              disabled={add.saving}
              className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50"
            >
              <Check size={14} />
            </button>
            <button
              onClick={add.cancelAdd}
              className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
            >
              <X size={14} className="text-[var(--charcoal-mid)]" />
            </button>
          </div>
          <ColorPicker value={add.newColor} onChange={add.setNewColor} />
        </div>
      )}

      {/* Staff list — draggable */}
      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-[var(--charcoal-mid)] py-8 text-center">Loading…</p>
        )}

        {!loading && staff.length === 0 && !add.adding && (
          <div className="text-center py-12 text-[var(--charcoal-mid)]">
            <div className="w-8 h-8 rounded-full bg-[var(--cream-3)] mx-auto mb-3 flex items-center justify-center">
              <GripVertical size={16} className="opacity-30" />
            </div>
            <p className="text-sm font-medium">No active staff yet.</p>
            <p className="text-xs mt-1">Click &quot;Add Staff&quot; to get started.</p>
          </div>
        )}

        {!loading && staff.map((member, i) => (
          <div
            key={member.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            className={cn(
              "bg-white border border-[var(--cream-3)] rounded-2xl px-4 py-4 flex items-center gap-3 transition-shadow",
              deletingId === member.id && "opacity-50 pointer-events-none"
            )}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-[var(--charcoal-mid)] hover:text-[var(--gold)] transition flex-shrink-0">
              <GripVertical size={16} />
            </div>

            {/* Order badge */}
            <span className="w-5 text-center text-[10px] font-bold text-[var(--charcoal-mid)] flex-shrink-0">
              {i + 1}
            </span>

            {/* Color avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: member.color_hex }}
            >
              {member.name[0]}
            </div>

            {edit.editId === member.id ? (
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    value={edit.editName}
                    onChange={e => edit.setEditName(e.target.value)}
                    autoFocus
                    maxLength={50}
                    className={inputCls + " flex-1"}
                    onKeyDown={e => e.key === "Enter" && edit.saveEdit(member.id)}
                  />
                  <button
                    onClick={() => edit.saveEdit(member.id)}
                    disabled={edit.saving}
                    className="p-2 rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white transition disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={edit.cancelEdit}
                    className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
                  >
                    <X size={14} className="text-[var(--charcoal-mid)]" />
                  </button>
                </div>
                <ColorPicker value={edit.editColor} onChange={edit.setEditColor} />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[var(--charcoal)]">{member.name}</p>
                  <p className="text-[10px] text-[var(--charcoal-mid)] font-medium">{member.color_hex}</p>
                </div>
                <button
                  onClick={() => edit.startEdit(member)}
                  className="p-2 rounded-lg hover:bg-[var(--cream-3)] transition"
                >
                  <Pencil size={13} className="text-[var(--charcoal-mid)]" />
                </button>
                <button
                  onClick={() => setConfirmMember(member)}
                  disabled={deletingId === member.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                >
                  <X size={13} className="text-red-400" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && staff.length > 1 && (
        <p className="text-xs text-[var(--charcoal-mid)] text-center mt-4 font-medium">
          Drag rows to reorder · order is reflected in the schedule grid
        </p>
      )}

      <ConfirmModal
        open={confirmMember !== null}
        title="Deactivate Staff Member"
        message={`Deactivate "${confirmMember?.name}"? They won't appear in new bookings.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmMember(null)}
      />
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] tracking-widest uppercase text-[var(--charcoal-mid)] font-semibold">Color</span>
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          type="button"
          className={cn(
            "w-6 h-6 rounded-full border-2 transition hover:scale-110",
            value === c ? "border-[var(--charcoal)] scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
        title="Custom color"
      />
    </div>
  );
}

const inputCls = "px-3 py-2 rounded-xl bg-[var(--cream-3)] border border-transparent focus:border-[var(--gold)] focus:bg-white outline-none transition text-sm text-[var(--charcoal)] font-medium";
