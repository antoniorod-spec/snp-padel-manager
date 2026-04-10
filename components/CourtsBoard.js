"use client";
import { useState } from "react";
import { LV_COLORS, matchWinner, encScore, minsUntil, fmtCountdown } from "@/lib/utils";

const COURTS = Array.from({ length: 16 }, (_, i) => i + 1);

export default function CourtsBoard({ encounters, state, onCourt, onSet, blockedCourts = {}, onBlockCourt, onUnblockCourt }) {
  // Build court -> match info map
  const courtMap = {};
  encounters.forEach(e => {
    const es = state[e.id];
    if (!es || es.st === "finished") return;
    es.m.forEach((mt, idx) => {
      if (mt.ct) {
        courtMap[mt.ct] = { enc: e, es, matchIdx: idx, match: mt };
      }
    });
  });

  // Queue: encounters that are confirmed/onCourt but have matches without court
  const waiting = [];
  encounters.forEach(e => {
    const es = state[e.id];
    if (!es || es.st === "finished") return;
    es.m.forEach((mt, idx) => {
      if (!mt.ct && matchWinner(mt.s) === 0) {
        waiting.push({ enc: e, matchIdx: idx, priority: minsUntil(e.time, e.date) });
      }
    });
  });
  waiting.sort((a, b) => a.priority - b.priority);

  const blockedCount = Object.keys(blockedCourts).length;
  const usedCount = Object.keys(courtMap).length;
  const freeCount = 16 - usedCount - blockedCount;

  // Available courts as Set for the assigner
  const allUsed = new Set(Object.keys(courtMap).map(Number));

  const handleAssignCourt = (encId, matchIdx, courtNum) => {
    onCourt(encId, matchIdx, courtNum);
  };

  return (
    <div style={{ padding: "8px 8px 80px" }}>
      {/* Summary banner */}
      <div style={{
        background: "linear-gradient(135deg,#064E3B,#065F46)",
        borderRadius: 12, padding: 14, marginBottom: 12,
        display: "flex", justifyContent: "space-around", alignItems: "center",
        border: "1px solid #10B981",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#22D3EE", fontFamily: "monospace", lineHeight: 1 }}>{freeCount}</div>
          <div style={{ fontSize: 10, color: "#6EE7B7", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>Canchas libres</div>
        </div>
        <div style={{ width: 1, height: 40, background: "#10B981", opacity: 0.5 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#FCA5A5", fontFamily: "monospace", lineHeight: 1 }}>{usedCount + blockedCount}</div>
          <div style={{ fontSize: 10, color: "#FCA5A5", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>Ocupadas</div>
        </div>
        <div style={{ width: 1, height: 40, background: "#10B981", opacity: 0.5 }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#FDE68A", fontFamily: "monospace", lineHeight: 1 }}>{waiting.length}</div>
          <div style={{ fontSize: 10, color: "#FDE68A", fontWeight: 700, textTransform: "uppercase", marginTop: 3 }}>En espera</div>
        </div>
      </div>

      {/* 16 courts grid - 4 cols x 4 rows */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
        {COURTS.map(c => {
          const info = courtMap[c];
          const blocked = blockedCourts[c];

          if (blocked) {
            return (
              <CourtBlockedCard key={c} courtNum={c} reason={blocked} onUnblock={onUnblockCourt} />
            );
          }

          if (!info) {
            return (
              <CourtFreeCard key={c} courtNum={c} waiting={waiting} onAssign={handleAssignCourt} onBlock={onBlockCourt} />
            );
          }

          const { enc, es, matchIdx, match } = info;
          const w = matchWinner(match.s);
          const hasScore = match.s[0] > 0 || match.s[1] > 0;
          const lc = LV_COLORS[enc.lv] || "#6B7280";

          return (
            <div key={c} style={{
              background: w > 0 ? "linear-gradient(135deg,#F0FDF4,#DCFCE7)" : "#fff",
              borderRadius: 10, padding: 10,
              border: `2px solid ${w > 0 ? "#10B981" : hasScore ? "#F59E0B" : "#EF4444"}`,
              minWidth: 0, minHeight: 140, display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{
                    background: "#0F172A", color: "#22D3EE",
                    fontSize: 18, fontWeight: 900, padding: "3px 10px",
                    borderRadius: 6, fontFamily: "monospace",
                  }}>C{c}</span>
                  <button onClick={() => onCourt(enc.id, matchIdx, null)} style={{
                    background: "none", color: "#94A3B8", border: "1px solid #CBD5E1",
                    borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer",
                    padding: "2px 5px", lineHeight: 1,
                  }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <span style={{ background: lc, color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 4px", borderRadius: 3 }}>{enc.lv}</span>
                  <span style={{ background: enc.cat === "FEM" ? "#EC4899" : "#3B82F6", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 4px", borderRadius: 3 }}>{enc.cat === "FEM" ? "F" : "M"}</span>
                </div>
              </div>

              <div style={{ fontSize: 9, color: "#64748B", marginBottom: 4, fontWeight: 600 }}>
                {enc.time} · Partido {matchIdx + 1}
              </div>

              {/* Teams */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: w === 1 ? "#059669" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{enc.t1}</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: match.s[0] > match.s[1] ? "#22D3EE" : "#0F172A", fontFamily: "monospace" }}>{match.s[0]}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: w === 2 ? "#059669" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{enc.t2}</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: match.s[1] > match.s[0] ? "#22D3EE" : "#0F172A", fontFamily: "monospace" }}>{match.s[1]}</span>
                </div>
              </div>

              {/* Actions */}
              {w > 0 ? (
                <div>
                  <div style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: "#059669", marginBottom: 4 }}>
                    ✅ {w === 1 ? enc.t1 : enc.t2}
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button onClick={() => onCourt(enc.id, matchIdx, null)} style={{
                      flex: 1, padding: 5, borderRadius: 5, border: "1px solid #10B981",
                      background: "#D1FAE5", color: "#059669", fontSize: 10, fontWeight: 800, cursor: "pointer",
                    }}>🏁 LIBERAR</button>
                    <button onClick={() => onSet(enc.id, matchIdx, -99)} style={{
                      padding: 5, borderRadius: 5, border: "1px solid #EF4444",
                      background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 800, cursor: "pointer",
                    }}>↺</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 3, minWidth: 0 }}>
                  <button onClick={() => onSet(enc.id, matchIdx, 0)} style={{
                    flex: 1, minWidth: 0, padding: 5, borderRadius: 4, border: "1px solid #3B82F6",
                    background: "#EFF6FF", color: "#1D4ED8", fontSize: 10, fontWeight: 800, cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>+ {enc.t1.slice(0, 8)}</button>
                  <button onClick={() => onSet(enc.id, matchIdx, 1)} style={{
                    flex: 1, minWidth: 0, padding: 5, borderRadius: 4, border: "1px solid #EF4444",
                    background: "#FEF2F2", color: "#DC2626", fontSize: 10, fontWeight: 800, cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>+ {enc.t2.slice(0, 8)}</button>
                  {hasScore && <button onClick={() => onSet(enc.id, matchIdx, -99)} style={{
                    padding: 5, borderRadius: 4, border: "1px solid #F59E0B",
                    background: "#FEF3C7", color: "#D97706", fontSize: 10, fontWeight: 800, cursor: "pointer",
                  }}>↺</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Waiting queue */}
      {waiting.length > 0 && (
        <div>
          <div style={{
            fontSize: 12, fontWeight: 800, color: "#F59E0B",
            marginBottom: 6, textTransform: "uppercase", letterSpacing: 1,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ⏳ En espera de cancha ({waiting.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {waiting.slice(0, 15).map((w, i) => {
              const mins = minsUntil(w.enc.time, w.enc.date);
              const urgent = mins <= 20;
              return (
                <div key={`${w.enc.id}-${w.matchIdx}`} style={{
                  background: urgent ? "#FEF3C7" : "#1E293B",
                  borderRadius: 8, padding: 8,
                  display: "flex", alignItems: "center", gap: 8,
                  border: urgent ? "1px solid #F59E0B" : "1px solid #334155",
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 900, color: urgent ? "#F59E0B" : "#22D3EE",
                    fontFamily: "monospace", minWidth: 42, textAlign: "center",
                  }}>{w.enc.time}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: urgent ? "#0F172A" : "#F8FAFC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.enc.t1} vs {w.enc.t2}
                    </div>
                    <div style={{ fontSize: 9, color: urgent ? "#D97706" : "#64748B" }}>
                      P{w.matchIdx + 1} · {w.enc.lv} · {mins > 0 ? fmtCountdown(mins) : "PASADO"}
                    </div>
                  </div>
                  {/* Quick assign: pick first free court */}
                  <QuickAssignButton courtMap={courtMap} blockedCourts={blockedCourts} encId={w.enc.id} matchIdx={w.matchIdx} onAssign={handleAssignCourt} />
                </div>
              );
            })}
            {waiting.length > 15 && (
              <div style={{ fontSize: 10, color: "#64748B", textAlign: "center", padding: 4 }}>
                ... y {waiting.length - 15} más
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const BLOCK_REASONS = ["Mal estado", "Mesa de control", "Reservada", "Mantenimiento"];

function CourtFreeCard({ courtNum, waiting, onAssign, onBlock }) {
  const [showBlock, setShowBlock] = useState(false);
  return (
    <div style={{
      background: "linear-gradient(135deg,#064E3B,#065F46)",
      borderRadius: 10, padding: 10,
      border: "2px dashed #10B981",
      minWidth: 0, minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div style={{
        fontSize: 28, fontWeight: 900, color: "#22D3EE",
        fontFamily: "monospace", lineHeight: 1, marginBottom: 3,
      }}>C{courtNum}</div>
      <div style={{ fontSize: 9, color: "#6EE7B7", fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>LIBRE</div>
      {waiting.length > 0 && !showBlock && (
        <button onClick={() => onAssign(waiting[0].enc.id, waiting[0].matchIdx, courtNum)} style={{
          background: "#F59E0B", color: "#0F172A", border: "none",
          padding: "5px 10px", borderRadius: 5, fontSize: 10, fontWeight: 800,
          cursor: "pointer", textAlign: "center", lineHeight: 1.2, marginBottom: 4,
        }}>
          ► Asignar {waiting[0].enc.time}<br />
          <span style={{ fontSize: 8, fontWeight: 600, opacity: 0.8 }}>P{waiting[0].matchIdx + 1} · {waiting[0].enc.lv}</span>
        </button>
      )}
      {!showBlock ? (
        <button onClick={() => setShowBlock(true)} style={{
          background: "transparent", color: "#94A3B8", border: "1px solid #475569",
          padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
          cursor: "pointer",
        }}>🚫 Marcar ocupada</button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          <div style={{ fontSize: 9, color: "#FDE68A", fontWeight: 700, textAlign: "center" }}>MOTIVO:</div>
          {BLOCK_REASONS.map(r => (
            <button key={r} onClick={() => { onBlock(courtNum, r); setShowBlock(false); }} style={{
              background: "#EF4444", color: "#fff", border: "none",
              padding: "4px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
              cursor: "pointer",
            }}>{r}</button>
          ))}
          <button onClick={() => setShowBlock(false)} style={{
            background: "transparent", color: "#94A3B8", border: "1px solid #475569",
            padding: "3px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600,
            cursor: "pointer",
          }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function CourtBlockedCard({ courtNum, reason, onUnblock }) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#7F1D1D,#991B1B)",
      borderRadius: 10, padding: 10,
      border: "2px solid #EF4444",
      minWidth: 0, minHeight: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div style={{
        fontSize: 28, fontWeight: 900, color: "#FCA5A5",
        fontFamily: "monospace", lineHeight: 1, marginBottom: 3,
      }}>C{courtNum}</div>
      <div style={{ fontSize: 9, color: "#FCA5A5", fontWeight: 800, textTransform: "uppercase", marginBottom: 3 }}>🚫 NO DISPONIBLE</div>
      <div style={{
        fontSize: 9, color: "#FECACA", fontWeight: 600,
        background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4, marginBottom: 6,
      }}>{reason}</div>
      <button onClick={() => onUnblock(courtNum)} style={{
        background: "#10B981", color: "#fff", border: "none",
        padding: "4px 8px", borderRadius: 5, fontSize: 9, fontWeight: 800,
        cursor: "pointer",
      }}>✓ Habilitar</button>
    </div>
  );
}

function QuickAssignButton({ courtMap, blockedCourts = {}, encId, matchIdx, onAssign }) {
  const freeCourts = COURTS.filter(c => !courtMap[c] && !blockedCourts[c]);
  if (freeCourts.length === 0) {
    return <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 700 }}>Sin libres</span>;
  }
  return (
    <select
      onChange={(e) => {
        const v = parseInt(e.target.value);
        if (v) onAssign(encId, matchIdx, v);
      }}
      defaultValue=""
      style={{
        background: "#10B981", color: "#fff", border: "none",
        borderRadius: 5, padding: "4px 6px", fontSize: 11, fontWeight: 800,
        cursor: "pointer",
      }}
    >
      <option value="">► Asignar</option>
      {freeCourts.map(c => <option key={c} value={c}>C{c}</option>)}
    </select>
  );
}
