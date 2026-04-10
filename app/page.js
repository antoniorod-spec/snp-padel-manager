"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ImportWizard from "@/components/ImportWizard";
import MatchesView from "@/components/MatchesView";
import CourtsBoard from "@/components/CourtsBoard";
import { initEncounterState, getUniqueDates, formatDateLabel, todayDateStr } from "@/lib/utils";

export default function Page() {
  const [tournament, setTournament] = useState(null);
  const [state, setState] = useState({});
  const [view, setView] = useState("matches"); // "matches" or "board"
  const [selectedDate, setSelectedDate] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncTime, setSyncTime] = useState(null);
  const [filter, setFilter] = useState("all");
  const [lvF, setLvF] = useState("all");
  const saveTimer = useRef(null);
  const [, tick] = useState(0);

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        if (data.tournament) {
          setTournament(data.tournament);
          // Auto-select today if exists, otherwise first date
          const dates = getUniqueDates(data.tournament.encounters || []);
          const today = todayDateStr();
          setSelectedDate(dates.includes(today) ? today : dates[0] || null);
        }
        if (data.state) setState(data.state);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  // Poll for remote updates every 6 seconds
  useEffect(() => {
    const iv = setInterval(async () => {
      tick(t => t + 1);
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        if (data.state) {
          setState(data.state);
          setSyncTime(new Date());
        }
      } catch (e) {}
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  const saveState = useCallback((newState) => {
    setState(newState);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: newState }),
        });
        setSyncTime(new Date());
      } catch (e) { console.error(e); }
    }, 400);
  }, []);

  const handleImport = async (newTournament) => {
    // Initialize state for all encounters
    const newState = {};
    newTournament.encounters.forEach(e => {
      newState[e.id] = initEncounterState();
    });
    setTournament(newTournament);
    setState(newState);
    const dates = getUniqueDates(newTournament.encounters);
    const today = todayDateStr();
    setSelectedDate(dates.includes(today) ? today : dates[0]);
    setShowImport(false);
    // Save to server
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament: newTournament, state: newState }),
      });
      setSyncTime(new Date());
    } catch (e) { console.error(e); }
  };

  const onSt = (id, st) => saveState({ ...state, [id]: { ...(state[id] || initEncounterState()), st } });
  const onCourt = (eid, mi, ct) => {
    const cur = state[eid] || initEncounterState();
    saveState({ ...state, [eid]: { ...cur, m: cur.m.map((m, i) => i === mi ? { ...m, ct } : m) } });
  };
  const onSet = (eid, mi, team) => {
    const cur = state[eid] || initEncounterState();
    const s = cur.m[mi].s;
    let ns;
    if (team === -99) {
      ns = [0, 0];
    } else if (team === -1) {
      if (s[0] > 0 && s[0] >= s[1]) ns = [s[0] - 1, s[1]];
      else if (s[1] > 0) ns = [s[0], s[1] - 1];
      else ns = [...s];
    } else {
      if (s[0] >= 2 || s[1] >= 2) return;
      ns = team === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1];
    }
    saveState({ ...state, [eid]: { ...cur, m: cur.m.map((m, i) => i === mi ? { ...m, s: ns } : m) } });
  };

  const encountersByDate = useMemo(() => {
    if (!tournament || !selectedDate) return [];
    return tournament.encounters.filter(e => e.date === selectedDate);
  }, [tournament, selectedDate]);

  const blockedCourts = useMemo(() => state._blocked || {}, [state]);

  const onBlockCourt = (courtNum, reason) => {
    const blocked = { ...(state._blocked || {}), [courtNum]: reason || "Bloqueada" };
    saveState({ ...state, _blocked: blocked });
  };
  const onUnblockCourt = (courtNum) => {
    const blocked = { ...(state._blocked || {}) };
    delete blocked[courtNum];
    saveState({ ...state, _blocked: blocked });
  };

  const allUsed = useMemo(() => {
    const s = new Set();
    encountersByDate.forEach(e => {
      const es = state[e.id];
      if (!es || es.st === "finished") return;
      es.m.forEach(m => { if (m.ct) s.add(m.ct); });
    });
    Object.keys(state._blocked || {}).forEach(c => s.add(Number(c)));
    return s;
  }, [state, encountersByDate]);

  const dates = useMemo(() => tournament ? getUniqueDates(tournament.encounters) : [], [tournament]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#22D3EE", fontSize: 16, fontWeight: 700 }}>Cargando...</div>
      </div>
    );
  }

  // No tournament loaded
  if (!tournament) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0F172A,#1E293B)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
          <h1 style={{ color: "#F8FAFC", fontSize: 22, margin: 0, marginBottom: 8, fontWeight: 900 }}>SNP Padel Manager</h1>
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 24 }}>
            Sube los dos archivos Excel del torneo (enfrentamientos y jugadores) para comenzar.
          </p>
          <button onClick={() => setShowImport(true)} style={{
            background: "#22D3EE", color: "#0F172A", border: "none",
            padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 900,
            cursor: "pointer",
          }}>
            📂 Importar Torneo
          </button>
        </div>
        {showImport && <ImportWizard onImport={handleImport} onCancel={() => setShowImport(false)} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0F172A,#1E293B)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0F172A", padding: "10px 10px 8px", borderBottom: "1px solid #334155", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#F8FAFC" }}>SNP MANAGER 🏆</h1>
            <div style={{ fontSize: 9, color: "#94A3B8" }}>
              {encountersByDate.length} enf · {encountersByDate.length * 3} partidos
              {syncTime && <> · Sync {syncTime.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</>}
            </div>
          </div>
          <button onClick={() => setShowImport(true)} style={{
            background: "#1E293B", color: "#22D3EE", border: "1px solid #22D3EE",
            padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: "pointer",
          }}>📂 Importar</button>
        </div>

        {/* Date selector */}
        {dates.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginBottom: 6, overflowX: "auto", paddingBottom: 2 }}>
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)} style={{
                background: selectedDate === d ? "#22D3EE" : "#1E293B",
                color: selectedDate === d ? "#0F172A" : "#94A3B8",
                border: "none", padding: "4px 10px", borderRadius: 5,
                fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
              }}>{formatDateLabel(d)}</button>
            ))}
          </div>
        )}

        {/* View switcher */}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setView("matches")} style={{
            flex: 1, background: view === "matches" ? "#22D3EE" : "#1E293B",
            color: view === "matches" ? "#0F172A" : "#94A3B8",
            border: "none", padding: "6px", borderRadius: 6,
            fontSize: 11, fontWeight: 900, cursor: "pointer",
          }}>📋 PARTIDOS</button>
          <button onClick={() => setView("board")} style={{
            flex: 1, background: view === "board" ? "#22D3EE" : "#1E293B",
            color: view === "board" ? "#0F172A" : "#94A3B8",
            border: "none", padding: "6px", borderRadius: 6,
            fontSize: 11, fontWeight: 900, cursor: "pointer",
          }}>🏟️ TABLERO</button>
        </div>
      </div>

      {/* Views */}
      {view === "matches" ? (
        <MatchesView
          encounters={encountersByDate}
          state={state}
          onSt={onSt}
          onCourt={onCourt}
          onSet={onSet}
          allUsed={allUsed}
          filter={filter}
          setFilter={setFilter}
          lvF={lvF}
          setLvF={setLvF}
        />
      ) : (
        <CourtsBoard
          encounters={encountersByDate}
          state={state}
          onCourt={onCourt}
          onSet={onSet}
          blockedCourts={blockedCourts}
          onBlockCourt={onBlockCourt}
          onUnblockCourt={onUnblockCourt}
        />
      )}

      {showImport && <ImportWizard onImport={handleImport} onCancel={() => setShowImport(false)} />}
    </div>
  );
}
