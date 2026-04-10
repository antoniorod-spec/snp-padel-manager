export const STATUS = {
  pending:   { l: "Pendiente",   c: "#F59E0B", bg: "#FEF3C7", i: "\u23F3" },
  called:    { l: "Llamados",    c: "#3B82F6", bg: "#DBEAFE", i: "\uD83D\uDCDE" },
  confirmed: { l: "Confirmados", c: "#8B5CF6", bg: "#EDE9FE", i: "\u2705" },
  onCourt:   { l: "En Cancha",   c: "#10B981", bg: "#D1FAE5", i: "\uD83C\uDFDF\uFE0F" },
  finished:  { l: "Finalizado",  c: "#6B7280", bg: "#F3F4F6", i: "\uD83C\uDFC1" },
};

export const LV_COLORS = { "1000": "#DC2626", "500": "#2563EB", "Future": "#059669" };

export function minsUntil(timeStr, dateStr) {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  let target;
  if (dateStr) {
    const [dd, mm, yyyy] = dateStr.split("/").map(Number);
    target = new Date(yyyy, mm - 1, dd, h, m, 0, 0);
  } else {
    target = new Date(now);
    target.setHours(h, m, 0, 0);
  }
  return Math.floor((target - now) / 60000);
}

export function fmtCountdown(mins) {
  if (mins <= 0) return "AHORA";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

export function matchWinner(sets) {
  return sets[0] >= 2 ? 1 : sets[1] >= 2 ? 2 : 0;
}

export function encScore(matches) {
  let w1 = 0, w2 = 0;
  matches.forEach(m => {
    const w = matchWinner(m.s);
    if (w === 1) w1++; else if (w === 2) w2++;
  });
  return [w1, w2];
}

export function initEncounterState() {
  return {
    st: "pending",
    m: [
      { ct: null, s: [0, 0] },
      { ct: null, s: [0, 0] },
      { ct: null, s: [0, 0] },
    ],
  };
}

export function getUniqueDates(encounters) {
  const dates = [...new Set(encounters.map(e => e.date))];
  return dates.sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
  });
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [d, m, y] = dateStr.split("/").map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${days[dt.getDay()]} ${d} ${months[m - 1]}`;
}

export function todayDateStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
