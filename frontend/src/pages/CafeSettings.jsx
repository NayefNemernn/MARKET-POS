import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ArrowLeft, Save, Settings } from "lucide-react";
import FloorMap     from "../components/cafe/FloorMap";
import * as cafeApi from "../api/cafe.api";
import toast        from "react-hot-toast";

const SHAPES = ["square", "round", "rectangle"];
const COLORS  = ["", "#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#c8793a"];
const EMPTY   = { number: "", shape: "square", seats: 4, color: "" };

export default function CafeSettings({ setPage }) {
  const [tables,    setTables]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editTarget,setEditTarget]= useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTables(await cafeApi.getTables()); }
    catch { toast.error("Failed to load tables"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    const next = tables.length > 0 ? Math.max(...tables.map(t=>t.number)) + 1 : 1;
    setEditTarget(null); setForm({ ...EMPTY, number: next }); setModal(true);
  };
  const openEdit = (t) => { setEditTarget(t); setForm({ number: t.number, shape: t.shape, seats: t.seats, color: t.color||"" }); setModal(true); };

  const handleSave = async () => {
    if (!form.number) return toast.error("Table number required");
    setSaving(true);
    try {
      const payload = { ...form, number: parseInt(form.number), seats: parseInt(form.seats)||4 };
      if (editTarget) {
        const u = await cafeApi.updateTable(editTarget._id, payload);
        setTables(prev => prev.map(t => t._id===u._id ? u : t));
        toast.success("Updated");
      } else {
        const c = await cafeApi.createTable(payload);
        setTables(prev => [...prev, c]);
        toast.success("Table added");
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (table) => {
    if (!window.confirm(`Delete Table ${table.number}?`)) return;
    setDeleting(table._id);
    try { await cafeApi.deleteTable(table._id); setTables(prev => prev.filter(t=>t._id!==table._id)); toast.success("Deleted"); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeleting(null); }
  };

  const handleMove = async (id, x, y) => {
    try { const u = await cafeApi.updateTable(id, { x, y }); setTables(prev => prev.map(t=>t._id===id?{...t,...u}:t)); }
    catch { toast.error("Failed to save position"); }
  };

  return (
    <div style={{ minHeight: "100%", background: "linear-gradient(160deg,#fdf8f0 0%,#f5ece0 100%)", paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#2c1810 0%,#4a2518 100%)", padding: "22px 28px 18px", boxShadow: "0 4px 20px rgba(44,24,16,0.2)", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setPage("cafe")} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={16}/>
            </button>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(200,121,58,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={20} color="#c8793a"/>
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Table Layout</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0, marginTop: 2 }}>Drag tables to position them on the floor</p>
            </div>
          </div>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 11, background: "#c8793a", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={15}/> Add Table
          </button>
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Floor map (drag mode) */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80, color: "#b45309" }}>Loading…</div>
        ) : (
          <FloorMap tables={tables} editMode={true} onTableClick={openEdit} onTableMove={handleMove} mapWidth={900} mapHeight={520}/>
        )}

        {/* Table cards */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#78716c", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>All Tables ({tables.length})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {tables.map(t => (
              <div key={t._id} style={{ background: "#fff", border: "1.5px solid #e8d5b5", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, boxShadow: "0 2px 8px rgba(44,24,16,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {t.color && <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.color, flexShrink: 0 }}/>}
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: "#2c1810", margin: 0 }}>Table {t.number}</p>
                    <p style={{ fontSize: 11, color: "#a16207", margin: 0 }}>{t.shape} · {t.seats}p</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(t)} style={{ padding: "5px 8px", borderRadius: 8, background: "#fdf8f0", border: "1px solid #e8d5b5", color: "#b45309", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(t)} disabled={deleting===t._id} style={{ width: 28, height: 28, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deleting===t._id?0.4:1 }}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
            {tables.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#a16207" }}>
                <p style={{ fontWeight: 600 }}>No tables yet</p>
                <button onClick={openAdd} style={{ marginTop: 8, color: "#b45309", fontSize: 13, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Add your first table</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(44,24,16,0.2)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#2c1810,#4a2518)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{editTarget ? `Edit Table ${editTarget.number}` : "Add New Table"}</span>
              <button onClick={() => setModal(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Table Number *</label>
                <input type="number" min="1" value={form.number} onChange={e=>setForm(p=>({...p,number:e.target.value}))} autoFocus style={inputStyle}/>
              </div>

              <div>
                <label style={labelStyle}>Shape</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {SHAPES.map(s => (
                    <button key={s} onClick={() => setForm(p=>({...p,shape:s}))}
                      style={{ flex: 1, padding: "9px 6px", borderRadius: 10, border: `2px solid ${form.shape===s?"#c8793a":"#e8d5b5"}`, background: form.shape===s?"#fff7ed":"#fdf8f0", color: form.shape===s?"#b45309":"#78716c", fontWeight: 700, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>
                      {s === "round" ? "⭕" : s === "rectangle" ? "▬" : "⬛"} {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Seats</label>
                <input type="number" min="1" max="20" value={form.seats} onChange={e=>setForm(p=>({...p,seats:e.target.value}))} style={inputStyle}/>
              </div>

              <div>
                <label style={labelStyle}>Color Tag (optional)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p=>({...p,color:c}))}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: c||"#e8d5b5", border: `2.5px solid ${form.color===c?"#2c1810":"transparent"}`, cursor: "pointer", boxSizing: "border-box" }}/>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, padding: 11, borderRadius: 12, background: "#f5f5f4", border: "1.5px solid #e7e5e4", color: "#78716c", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 11, borderRadius: 12, background: "linear-gradient(135deg,#c8793a,#b45309)", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving?0.6:1 }}>
                  <Save size={14}/> {saving ? "Saving…" : editTarget ? "Update Table" : "Add Table"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: "#78716c", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 };
const inputStyle  = { width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e8d5b5", background: "#fdf8f0", fontSize: 14, color: "#2c1810", outline: "none", boxSizing: "border-box" };
