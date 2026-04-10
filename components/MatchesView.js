"use client";
import { useState } from "react";
import { STATUS, LV_COLORS, minsUntil, fmtCountdown, matchWinner, encScore } from "@/lib/utils";

const COURTS = Array.from({ length: 16 }, (_, i) => i + 1);

function PhBtn({ ph, nm }) {
  const cl = String(ph).replace(/\D/g, "");
  const wa = cl.length > 10 ? cl : `52${cl}`;
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 3 }}>
      <span style={{ fontSize: 11, color: "#475569", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nm}</span>
      <a href={`tel:+${wa}`} style={{ background: "#1E293B", color: "#fff", borderRadius: 5, padding: "2px 7px", fontSize: 10, textDecoration: "none" }}>Tel</a>
      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" style={{ background: "#25D366", color: "#fff", borderRadius: 5, padding: "2px 7px", fontSize: 10, textDecoration: "none" }}>WA</a>
    </div>
  );
}

function MatchRow({ idx, match, t1, t2, allUsed, onCourt, onSet, encId }) {
  const w = matchWinner(match.s);
  const done = w > 0;
  const taken = c => allUsed.has(c) && match.ct !== c;

  return (
    <div style={{
      background: done ? "#F0FDF4" : "#F8FAFC", borderRadius: 10, padding: 10,
      border: `1px solid ${done ? "#BBF7D0" : "#E2E8F0"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ background: "#0F172A", color: "#22D3EE", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace" }}>P{idx + 1}</span>
          {match.ct && <span style={{ background: "#0F172A", color: "#F59E0B", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace" }}>C{match.ct}</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "monospace", color: "#0F172A" }}>{match.s[0]} - {match.s[1]}</div>
        {done && <span style={{ fontSize: 10, fontWeight: 800, color: "#059669" }}>✅ {w === 1 ? t1 : t2}</span>}
      </div>

      {!match.ct && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>ASIGNAR CANCHA:</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {COURTS.map(c => (
              <button key={c} onClick={() => !taken(c) && onCourt(encId, idx, c)} disabled={taken(c)} style={{
                width: 30, height: 30, borderRadius: 5, border: "1px solid #CBD5E1",
                background: taken(c) ? "#F1F5F9" : "#fff",
                color: taken(c) ? "#CBD5E1" : "#334155",
                fontWeight: 800, fontSize: 12, cursor: taken(c) ? "not-allowed" : "pointer",
                fontFamily: "monospace", opacity: taken(c) ? 0.3 : 1,
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {match.ct && !done && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>¿QUIÉN GANÓ EL SET?</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onSet(encId, idx, 0)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8, border: "2px solid #3B82F6",
              background: "#EFF6FF", cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1D4ED8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t1}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Set {match.s[0] + match.s[1] + 1}</div>
            </button>
            <button onClick={() => onSet(encId, idx, 1)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8, border: "2px solid #EF4444",
              background: "#FEF2F2", cursor: "pointer", textAlign: "center",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t2}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Set {match.s[0] + match.s[1] + 1}</div>
            </button>
          </div>
          {(match.s[0] > 0 || match.s[1] > 0) && (
            <button onClick={() => onSet(encId, idx, -1)} style={{
              marginTop: 6, width: "100%", padding: 4, borderRadius: 5, border: "1px solid #E2E8F0",
              background: "#fff", color: "#94A3B8", fontSize: 10, fontWeight: 600, cursor: "pointer",
            }}>Deshacer último set</button>
          )}
        </div>
      )}

      {match.ct && done && (
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#064E3B" }}>Terminado: {match.s[0]}-{match.s[1]}</span>
          <div>
            <button onClick={() => onSet(encId, idx, -1)} style={{
              marginTop: 4, padding: "3px 10px", borderRadius: 5, border: "1px solid #E2E8F0",
              background: "#fff", color: "#94A3B8", fontSize: 10, fontWeight: 600, cursor: "pointer",
            }}>Deshacer</button>
            <button onClick={() => onCourt(encId, idx, null)} style={{
              marginTop: 4, marginLeft: 4, padding: "3px 10px", borderRadius: 5, border: "1px solid #E2E8F0",
              background: "#fff", color: "#94A3B8", fontSize: 10, fontWeight: 600, cursor: "pointer",
            }}>Liberar cancha</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ e, es, onSt, onCourt, onSet, allUsed }) {
  const [exp, setExp] = useState(false);
  const mins = minsUntil(e.time, e.date);
  const alert = mins > 0 && mins <= 20 && es.st === "pending";
  const over = mins <= 0 && es.st === "pending";
  const sc = STATUS[es.st];
  const lc = LV_COLORS[e.lv] || "#6B7280";
  const [ew1, ew2] = encScore(es.m);
  const hasScore = es.m.some(m => m.s[0] > 0 || m.s[1] > 0);
  const encDone = ew1 >= 2 || ew2 >= 2;

  return (
    <div style={{
      background: "#fff", borderRadius: 12, overflow: "hidden",
      border: alert ? "2px solid #F59E0B" : over ? "2px solid #EF4444" : "1px solid #E2E8F0",
      boxShadow: alert ? "0 0 14px rgba(245,158,11,0.3)" : over ? "0 0 14px rgba(239,68,68,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div onClick={() => setExp(!exp)} style={{ padding: "10px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ textAlign: "center", minWidth: 42 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>{e.time}</div>
          {es.st === "pending" && <div style={{ fontSize: 9, fontWeight: 700, color: over ? "#EF4444" : alert ? "#F59E0B" : "#94A3B8", fontFamily: "monospace" }}>{over ? "PASADO" : fmtCountdown(mins)}</div>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.t1}</span>
            {hasScore && <span style={{ fontSize: 16, fontWeight: 900, color: ew1 >= 2 ? "#059669" : "#0F172A", fontFamily: "monospace" }}>{ew1}</span>}
          </div>
          <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>VS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.t2}</span>
            {hasScore && <span style={{ fontSize: 16, fontWeight: 900, color: ew2 >= 2 ? "#059669" : "#0F172A", fontFamily: "monospace" }}>{ew2}</span>}
          </div>
          {hasScore && (
            <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
              {es.m.map((mt, i) => {
                const w = matchWinner(mt.s);
                return (
                  <span key={i} style={{ fontSize: 9, fontFamily: "monospace", color: w > 0 ? "#059669" : "#64748B" }}>
                    P{i + 1}:{mt.s[0]}-{mt.s[1]}{mt.ct ? ` C${mt.ct}` : ""}{w > 0 ? " ✅" : ""}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <span style={{ background: lc, color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 4px", borderRadius: 3 }}>{e.lv}</span>
            <span style={{ background: e.cat === "FEM" ? "#EC4899" : "#3B82F6", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 4px", borderRadius: 3 }}>{e.cat === "FEM" ? "F" : "M"}</span>
          </div>
          {encDone && <span style={{ fontSize: 9, fontWeight: 900, color: "#F59E0B" }}>🏆</span>}
          <span style={{ background: sc.bg, color: sc.c, fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>{sc.i} {sc.l}</span>
        </div>
      </div>

      {exp && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {es.m.map((mt, i) => (
            <MatchRow key={i} idx={i} match={mt} t1={e.t1} t2={e.t2}
              allUsed={allUsed} onCourt={onCourt} onSet={onSet} encId={e.id} />
          ))}

          {encDone && (
            <div style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid #BBF7D0" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#064E3B", marginBottom: 2 }}>RESULTADO FINAL</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A" }}>
                {e.t1} <span style={{ color: ew1 > ew2 ? "#059669" : "#94A3B8" }}>{ew1}</span> — <span style={{ color: ew2 > ew1 ? "#059669" : "#94A3B8" }}>{ew2}</span> {e.t2}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#F59E0B", marginTop: 4 }}>🏆 {ew1 >= 2 ? e.t1 : e.t2} GANA</div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Estado</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {Object.entries(STATUS).map(([k, cfg]) => (
                <button key={k} onClick={() => onSt(e.id, k)} style={{ padding: "5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", border: es.st === k ? `2px solid ${cfg.c}` : "1px solid #E2E8F0", background: es.st === k ? cfg.bg : "#fff", color: cfg.c }}>{cfg.i} {cfg.l}</button>
              ))}
            </div>
          </div>

          {(e.p1.length > 0 || e.p2.length > 0) && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Capitanes</div>
              <div style={{ background: "#F8FAFC", borderRadius: 7, padding: 7 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginBottom: 2 }}>{e.t1}</div>
                {e.p1.map((p, i) => <PhBtn key={i} ph={p.ph} nm={`${p.c ? "👑 " : ""}${p.n}`} />)}
                <div style={{ height: 5 }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", marginBottom: 2 }}>{e.t2}</div>
                {e.p2.map((p, i) => <PhBtn key={i} ph={p.ph} nm={`${p.c ? "👑 " : ""}${p.n}`} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchesView({ encounters, state, onSt, onCourt, onSet, allUsed, filter, setFilter, lvF, setLvF }) {
  const filtered = encounters.filter(e => {
    if (filter !== "all" && state[e.id]?.st !== filter) return false;
    if (lvF !== "all" && e.lv !== lvF) return false;
    return true;
  });
  const slots = [...new Set(filtered.map(e => e.time))].sort();

  return (
    <div style={{ padding: "8px 8px 80px" }}>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
        {Object.entries(STATUS).map(([k, cfg]) => {
          const count = encounters.filter(e => state[e.id]?.st === k).length;
          return (
            <div key={k} onClick={() => setFilter(filter === k ? "all" : k)} style={{
              background: filter === k ? cfg.c : "#1E293B", color: filter === k ? "#fff" : cfg.c,
              border: `1px solid ${cfg.c}`, padding: "3px 8px", borderRadius: 14,
              fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: count === 0 ? 0.4 : 1,
            }}>{cfg.i} {count}</div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
        {["all", "1000", "500", "Future"].map(lv => (
          <button key={lv} onClick={() => setLvF(lvF === lv ? "all" : lv)} style={{
            padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 800, border: "none", cursor: "pointer",
            background: lvF === lv ? (lv === "all" ? "#22D3EE" : LV_COLORS[lv]) : "#334155",
            color: lvF === lv ? "#fff" : "#94A3B8",
          }}>{lv === "all" ? "TODOS" : lv}</button>
        ))}
      </div>

      {slots.map(slot => {
        const sm = filtered.filter(e => e.time === slot);
        if (!sm.length) return null;
        const mins = minsUntil(slot, sm[0].date);
        const isN = mins > 0 && mins <= 30;
        return (
          <div key={slot} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, background: "#0F172A", padding: "4px 0", borderRadius: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: isN ? "#F59E0B" : "#F8FAFC", fontFamily: "monospace", paddingLeft: 6 }}>{slot}</div>
              <div style={{ flex: 1, height: 1, background: "#334155" }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: isN ? "#F59E0B" : "#64748B", paddingRight: 6 }}>{sm.length} enf · {sm.length * 3} canc · {mins > 0 ? fmtCountdown(mins) : "CURSO"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {sm.map(e => <Card key={e.id} e={e} es={state[e.id] || { st: "pending", m: [{ct:null,s:[0,0]},{ct:null,s:[0,0]},{ct:null,s:[0,0]}] }}
                onSt={onSt} onCourt={onCourt} onSet={onSet} allUsed={allUsed} />)}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏟️</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No hay enfrentamientos</div>
        </div>
      )}
    </div>
  );
}
