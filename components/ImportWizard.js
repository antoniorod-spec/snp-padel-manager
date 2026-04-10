"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

const REQUIRED_FIELDS_ENC = [
  { key: "id", label: "ID Enfrentamiento", required: true },
  { key: "date", label: "Fecha", required: true, hint: "DD/MM/YYYY HH:MM:SS" },
  { key: "cat", label: "Categoría", required: true, hint: "MASCULINO/FEMENINO" },
  { key: "lv", label: "Grupo/Nivel", required: true, hint: "1000/500/Future" },
  { key: "div", label: "División", required: false },
  { key: "t1id", label: "ID Equipo 1", required: true },
  { key: "t1", label: "Nombre Equipo 1", required: true },
  { key: "t2id", label: "ID Equipo 2", required: true },
  { key: "t2", label: "Nombre Equipo 2", required: true },
];

const REQUIRED_FIELDS_PL = [
  { key: "team", label: "Equipo (con ID)", required: true, hint: "Ej: 'SANTA PALA (138)'" },
  { key: "name", label: "Nombre", required: true },
  { key: "lastname", label: "Apellidos", required: false },
  { key: "phone", label: "Móvil", required: true },
  { key: "captain", label: "Capitán Jugador", required: false, hint: "Si/No" },
];

export default function ImportWizard({ onImport, onCancel }) {
  const [step, setStep] = useState(1);
  const [encRaw, setEncRaw] = useState(null);
  const [plRaw, setPlRaw] = useState(null);
  const [encMap, setEncMap] = useState({});
  const [plMap, setPlMap] = useState({});
  const [error, setError] = useState("");

  const readFile = async (file) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (json.length < 2) throw new Error("Archivo vacío");
    return { headers: json[0].map(String), rows: json.slice(1) };
  };

  const handleEncFile = async (e) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await readFile(f);
      setEncRaw(data);
      // Auto-detect common SNP column names
      const auto = {};
      data.headers.forEach((h, i) => {
        const hl = h.toLowerCase();
        if (hl.includes("id enf")) auto.id = i;
        else if (hl === "fecha") auto.date = i;
        else if (hl.includes("categor")) auto.cat = i;
        else if (hl === "grupo") auto.lv = i;
        else if (hl.includes("divisi")) auto.div = i;
        else if (hl === "id equipo1") auto.t1id = i;
        else if (hl === "equipo1") auto.t1 = i;
        else if (hl === "id equipo2") auto.t2id = i;
        else if (hl === "equipo2") auto.t2 = i;
      });
      setEncMap(auto);
    } catch (err) {
      setError(`Error leyendo enfrentamientos: ${err.message}`);
    }
  };

  const handlePlFile = async (e) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await readFile(f);
      setPlRaw(data);
      const auto = {};
      data.headers.forEach((h, i) => {
        const hl = h.toLowerCase();
        if (hl.includes("equipo")) auto.team = i;
        else if (hl === "nombre") auto.name = i;
        else if (hl.includes("apellido")) auto.lastname = i;
        else if (hl.includes("movil") || hl.includes("móvil") || hl === "telefono") auto.phone = i;
        else if (hl.includes("capitan jugador") || hl.includes("capitán jugador")) auto.captain = i;
      });
      setPlMap(auto);
    } catch (err) {
      setError(`Error leyendo jugadores: ${err.message}`);
    }
  };

  const processData = () => {
    setError("");
    // Validate required
    const missing = REQUIRED_FIELDS_ENC.filter(f => f.required && encMap[f.key] === undefined);
    if (missing.length) {
      setError(`Faltan columnas requeridas en enfrentamientos: ${missing.map(m => m.label).join(", ")}`);
      return;
    }
    const missingP = REQUIRED_FIELDS_PL.filter(f => f.required && plMap[f.key] === undefined);
    if (missingP.length) {
      setError(`Faltan columnas requeridas en jugadores: ${missingP.map(m => m.label).join(", ")}`);
      return;
    }

    // Build players map by team ID
    const teamsPlayers = {};
    plRaw.rows.forEach(row => {
      const teamStr = String(row[plMap.team] || "");
      const match = teamStr.match(/\((\d+)\)/);
      if (!match) return;
      const tid = parseInt(match[1]);
      if (!teamsPlayers[tid]) teamsPlayers[tid] = [];
      const name = String(row[plMap.name] || "").trim();
      const last = plMap.lastname !== undefined ? String(row[plMap.lastname] || "").trim() : "";
      const fullName = `${name} ${last}`.trim();
      const phone = String(row[plMap.phone] || "").replace(/\.0$/, "");
      const captain = plMap.captain !== undefined ? String(row[plMap.captain] || "").toLowerCase() === "si" : false;
      teamsPlayers[tid].push({ n: fullName, ph: phone, c: captain });
    });

    // Parse encounters
    const encounters = [];
    encRaw.rows.forEach(row => {
      const rawDate = String(row[encMap.date] || "");
      // Expected: "DD/MM/YYYY HH:MM:SS"
      const m = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
      if (!m) return;
      const [, dd, mm, yyyy, hh, mi] = m;
      const dateStr = `${dd.padStart(2,"0")}/${mm.padStart(2,"0")}/${yyyy}`;
      const timeStr = `${hh.padStart(2,"0")}:${mi}`;

      const catRaw = String(row[encMap.cat] || "").toUpperCase();
      const cat = catRaw.includes("FEM") ? "FEM" : "MASC";
      const lv = String(row[encMap.lv] || "").trim();
      const div = encMap.div !== undefined ? String(row[encMap.div] || "").replace("División ", "").trim() : "";
      const t1id = parseInt(row[encMap.t1id]);
      const t2id = parseInt(row[encMap.t2id]);

      encounters.push({
        id: parseInt(row[encMap.id]),
        date: dateStr,
        time: timeStr,
        cat, lv, div,
        t1: String(row[encMap.t1] || "").trim(),
        t2: String(row[encMap.t2] || "").trim(),
        t1id, t2id,
        p1: teamsPlayers[t1id] || [],
        p2: teamsPlayers[t2id] || [],
      });
    });

    if (!encounters.length) {
      setError("No se detectaron enfrentamientos válidos. Revisa las columnas.");
      return;
    }

    onImport({
      name: "Torneo Importado",
      importedAt: new Date().toISOString(),
      encounters,
    });
  };

  const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 },
    modal: { background: "#fff", borderRadius: 14, maxWidth: 560, width: "100%", maxHeight: "92vh", overflow: "auto", padding: 20 },
    title: { fontSize: 18, fontWeight: 900, color: "#0F172A", marginBottom: 4 },
    sub: { fontSize: 12, color: "#64748B", marginBottom: 16 },
    step: { background: "#F1F5F9", padding: 10, borderRadius: 8, marginBottom: 12 },
    stepTitle: { fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 8 },
    fileInput: { width: "100%", padding: 8, border: "2px dashed #CBD5E1", borderRadius: 8, background: "#F8FAFC", cursor: "pointer", fontSize: 12 },
    mapRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "center", marginBottom: 6 },
    label: { fontSize: 11, fontWeight: 700, color: "#334155" },
    select: { padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, background: "#fff" },
    btn: { padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" },
    btnPrimary: { background: "#0F172A", color: "#22D3EE" },
    btnSec: { background: "#E2E8F0", color: "#475569" },
    error: { background: "#FEF2F2", color: "#DC2626", padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 12, border: "1px solid #FECACA" },
    ok: { background: "#F0FDF4", color: "#059669", padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 700, marginTop: 6 },
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div style={S.modal}>
        <div style={S.title}>Importar Torneo desde Excel</div>
        <div style={S.sub}>Sube los dos archivos .xls/.xlsx del sistema SNP y mapea las columnas.</div>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.step}>
          <div style={S.stepTitle}>1. Archivo de Enfrentamientos</div>
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handleEncFile} style={S.fileInput} />
          {encRaw && <div style={S.ok}>\u2713 {encRaw.rows.length} filas detectadas · {encRaw.headers.length} columnas</div>}
        </div>

        <div style={S.step}>
          <div style={S.stepTitle}>2. Archivo de Jugadores</div>
          <input type="file" accept=".xls,.xlsx,.csv" onChange={handlePlFile} style={S.fileInput} />
          {plRaw && <div style={S.ok}>\u2713 {plRaw.rows.length} filas detectadas · {plRaw.headers.length} columnas</div>}
        </div>

        {encRaw && plRaw && (
          <>
            <div style={S.step}>
              <div style={S.stepTitle}>3. Mapeo Columnas · Enfrentamientos</div>
              {REQUIRED_FIELDS_ENC.map(f => (
                <div key={f.key} style={S.mapRow}>
                  <div>
                    <div style={S.label}>{f.label} {f.required && <span style={{color:"#EF4444"}}>*</span>}</div>
                    {f.hint && <div style={{ fontSize: 9, color: "#94A3B8" }}>{f.hint}</div>}
                  </div>
                  <select style={S.select} value={encMap[f.key] ?? ""} onChange={(e) => setEncMap({...encMap, [f.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                    <option value="">— ninguna —</option>
                    {encRaw.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={S.step}>
              <div style={S.stepTitle}>4. Mapeo Columnas · Jugadores</div>
              {REQUIRED_FIELDS_PL.map(f => (
                <div key={f.key} style={S.mapRow}>
                  <div>
                    <div style={S.label}>{f.label} {f.required && <span style={{color:"#EF4444"}}>*</span>}</div>
                    {f.hint && <div style={{ fontSize: 9, color: "#94A3B8" }}>{f.hint}</div>}
                  </div>
                  <select style={S.select} value={plMap[f.key] ?? ""} onChange={(e) => setPlMap({...plMap, [f.key]: e.target.value === "" ? undefined : parseInt(e.target.value)})}>
                    <option value="">— ninguna —</option>
                    {plRaw.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{...S.btn, ...S.btnSec}} onClick={onCancel}>Cancelar</button>
          <button style={{...S.btn, ...S.btnPrimary, opacity: (encRaw && plRaw) ? 1 : 0.5}} disabled={!encRaw || !plRaw} onClick={processData}>
            Importar torneo
          </button>
        </div>
      </div>
    </div>
  );
}
