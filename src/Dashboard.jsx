import { useState, useEffect, useMemo } from "react";
import { loadAllData, saveField, loadPhotos, uploadPhoto, deletePhoto } from "./firebase.js";

// ---------- Costanti ----------
const HEIGHT_CM = 181;
const SCHEDE = ["A", "B", "C", "A2", "B2", "Camminata"];
const SCHEDA_LABEL = {
  A: "Trazioni · Lat machine · Spalle",
  B: "Panca · Rematore · Face pull",
  C: "Trazioni · Lat stretta · Dips",
  A2: "Mesociclo 2 · Giorno 1 · AMRAP",
  B2: "Mesociclo 2 · Giorno 2 · Circuit",
  Camminata: "Camminata veloce",
};
const SCHEDA_COLOR = {
  A: "#c97b4a",
  B: "#5b8a72",
  C: "#7a6fb0",
  A2: "#4a8ab0",
  B2: "#b04a6f",
  Camminata: "#4aab94",
};

const SCHEDA_EXERCISES = {
  A: [
    { name: "Riscaldamento (cyclette/vogatore)", load: "—", sets: "10 min" },
    { name: "Trazioni assistite", load: "25 kg assistenza", sets: "4 × 5" },
    { name: "Lat machine presa larga", load: "53 kg", sets: "3 × 12" },
    { name: "Lento avanti manubri", load: "10 kg", sets: "3 × 12" },
    { name: "Alzate laterali", load: "4 kg", sets: "3 × 15" },
    { name: "Curl manubri", load: "12 kg", sets: "3 × 12" },
    { name: "Pushdown al cavo", load: "25 kg", sets: "3 × 12" },
    { name: "Squat corpo libero", load: "—", sets: "3 × 15" },
    { name: "Polpacci su scalino", load: "corpo libero", sets: "3 × 12" },
    { name: "Plank", load: "—", sets: "3 × 30 sec" },
  ],
  B: [
    { name: "Riscaldamento (cyclette/vogatore)", load: "—", sets: "10 min" },
    { name: "Panca piana manubri", load: "14 kg", sets: "3 × 12" },
    { name: "Rematore al cavo basso", load: "45 kg", sets: "3 × 12" },
    { name: "Alzate frontali manubri", load: "6 kg", sets: "3 × 12" },
    { name: "Face pull al cavo", load: "15-20 kg", sets: "3 × 15" },
    { name: "Leg press", load: "10 kg", sets: "3 × 15" },
    { name: "Plank", load: "—", sets: "3 × 30 sec" },
  ],
  C: [
    { name: "Riscaldamento (cyclette/vogatore)", load: "—", sets: "10 min" },
    { name: "Trazioni assistite", load: "25 kg assistenza", sets: "4 × 5" },
    { name: "Lat machine presa stretta", load: "45 kg", sets: "3 × 12" },
    { name: "Lento avanti manubri", load: "10 kg", sets: "3 × 10" },
    { name: "Curl bilanciere EZ", load: "15 kg", sets: "3 × 10" },
    { name: "Dips alle parallele assistite", load: "35 kg assistenza", sets: "3 × max" },
    { name: "Affondi con manubri", load: "10 kg", sets: "3 × 10 per gamba" },
    { name: "Plank", load: "—", sets: "3 × 30 sec" },
  ],
  A2: [
    { name: "Riscaldamento (esercizi vari sul posto)", load: "—", sets: "10 min" },
    { name: "Esercizi propriocettivi", load: "—", sets: "—" },
    { name: "Piegamenti braccia (toccare terra con il petto)", load: "corpo libero", sets: "4 × 2  →  5 × 4" },
    { name: "Dip con le sedie", load: "corpo libero", sets: "4 × 8  →  5 × 10" },
    { name: "AMRAP — Tempo totale", load: "—", sets: "15 min  →  25 min" },
    { name: "AMRAP — Squat (scalzo)", load: "corpo libero", sets: "15 rep  →  30 rep" },
    { name: "AMRAP — Ponte a terra", load: "corpo libero", sets: "20 rep  →  35 rep" },
    { name: "AMRAP — Sit up", load: "corpo libero", sets: "15 rep  →  30 rep" },
    { name: "AMRAP — Piegamenti braccia", load: "corpo libero", sets: "10 rep  →  18 rep" },
    { name: "AMRAP — Affondi (scalzo)", load: "corpo libero", sets: "16 rep  →  30 rep" },
  ],
  B2: [
    { name: "Riscaldamento (esercizi vari sul posto)", load: "—", sets: "10 min" },
    { name: "Esercizi propriocettivi", load: "—", sets: "—" },
    { name: "Trazioni", load: "assistenza da definire", sets: "da definire post-test" },
    { name: "Circuit — Plank", load: "—", sets: "30 sec  ×  3→5 giri" },
    { name: "Circuit — Side plank", load: "—", sets: "30 sec  ×  3→5 giri" },
    { name: "Circuit — Piegamenti stretti", load: "corpo libero", sets: "30 sec  ×  3→5 giri" },
    { name: "Circuit — Affondi laterali", load: "corpo libero", sets: "30 sec  ×  3→5 giri" },
    { name: "Circuit — Sprawl", load: "corpo libero", sets: "30 sec  ×  3→5 giri" },
  ],
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateIt(iso) {
  const [y, m, d] = iso.split("-");
  const mesi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return `${d} ${mesi[parseInt(m, 10) - 1]} ${y}`;
}

function bmi(weightKg) {
  const h = HEIGHT_CM / 100;
  return weightKg / (h * h);
}

// ---------- Storage helpers (Firebase Firestore) ----------
async function loadAll() {
  return await loadAllData();
}

async function saveKey(key, value) {
  return await saveField(key, value);
}

// ---------- Helpers per il grafico assi ----------
function shortDateIt(iso) {
  const [y, m, d] = iso.split("-");
  const mesi = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  return `${parseInt(d, 10)} ${mesi[parseInt(m, 10) - 1]}`;
}

function niceStep(range, targetTicks = 4) {
  if (range === 0) return 1;
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  return step * mag;
}

// ---------- Grafico con assi: peso (Y) e data (X) ----------
function AxisChart({ data, color = "#c97b4a", unit = "kg", height = 220 }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#9a9286", fontSize: 12, textAlign: "center", padding: "0 20px" }}>
        Aggiungi almeno 2 valori con date diverse per vedere il grafico
      </div>
    );
  }

  const width = 600;
  const padLeft = 46;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 30;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin;
  // margine del 12% sopra/sotto per non schiacciare la linea sui bordi
  const margin = span === 0 ? Math.max(rawMin * 0.05, 1) : span * 0.18;
  const min = rawMin - margin;
  const max = rawMax + margin;
  const range = max - min || 1;

  const step = niceStep(max - min, 4);
  const firstTick = Math.ceil(min / step) * step;
  const yTicks = [];
  for (let v = firstTick; v <= max; v += step) yTicks.push(v);

  const points = data.map((d, i) => {
    const x = padLeft + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = padTop + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });

  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaPath = `${path} L${points[points.length - 1].x},${padTop + innerH} L${points[0].x},${padTop + innerH} Z`;

  // Etichette asse X: mostra max ~5 date per non sovrapporle
  const maxLabels = 5;
  const labelStride = Math.max(1, Math.ceil(points.length / maxLabels));
  const xLabels = points.filter((_, i) => i % labelStride === 0 || i === points.length - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
      {/* griglia orizzontale + etichette Y */}
      {yTicks.map((v, i) => {
        const y = padTop + innerH - ((v - min) / range) * innerH;
        return (
          <g key={i}>
            <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#ece5d6" strokeWidth="1" />
            <text x={padLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#9a9286" fontFamily="Inter, sans-serif">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* asse Y unità */}
      <text x={padLeft - 8} y={padTop - 4} textAnchor="end" fontSize="10" fill="#bcb3a2" fontFamily="Inter, sans-serif">
        {unit}
      </text>

      {/* area + linea */}
      <path d={areaPath} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* punti */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3} fill={color} stroke="#fff" strokeWidth={i === points.length - 1 ? 1.5 : 0} />
      ))}

      {/* etichetta valore sull'ultimo punto */}
      <text
        x={points[points.length - 1].x}
        y={points[points.length - 1].y - 12}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={color}
        fontFamily="Inter, sans-serif"
      >
        {points[points.length - 1].value}
      </text>

      {/* asse X etichette date */}
      {xLabels.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={height - 8}
          textAnchor="middle"
          fontSize="10.5"
          fill="#9a9286"
          fontFamily="Inter, sans-serif"
        >
          {shortDateIt(p.date)}
        </text>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState("overview");
  const [expandedScheda, setExpandedScheda] = useState("A");

  // form states
  const [newWeightDate, setNewWeightDate] = useState(todayISO());
  const [newWeightVal, setNewWeightVal] = useState("");
  const [newWorkoutDate, setNewWorkoutDate] = useState(todayISO());
  const [newWorkoutScheda, setNewWorkoutScheda] = useState("A");
  const [newWorkoutNote, setNewWorkoutNote] = useState("");
  const [newWalkTime, setNewWalkTime] = useState("");
  const [newWalkKm, setNewWalkKm] = useState("");
  const [showMeasureForm, setShowMeasureForm] = useState(false);
  const [mDate, setMDate] = useState(todayISO());
  const [mArm, setMArm] = useState("");
  const [mChest, setMChest] = useState("");
  const [mWaist, setMWaist] = useState("");
  const [mLeg, setMLeg] = useState("");
  const [pDate, setPDate] = useState(todayISO());
  const [pFile, setPFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const [saveStatus, setSaveStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      const data = await loadAll();
      setWeights(data.weights.sort((a, b) => a.date.localeCompare(b.date)));
      setWorkouts(data.workouts.sort((a, b) => a.date.localeCompare(b.date)));
      setMeasurements(data.measurements.sort((a, b) => a.date.localeCompare(b.date)));
      const photosData = await loadPhotos();
      setPhotos(photosData.sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    })();
  }, []);

  function flashSaved() {
    setSaveStatus("Salvato");
    setTimeout(() => setSaveStatus(""), 1800);
  }

  async function addWeight() {
    const val = parseFloat(newWeightVal.replace(",", "."));
    if (!newWeightDate || isNaN(val) || val <= 0) {
      setErrorMsg("Inserisci una data e un peso valido.");
      return;
    }
    setErrorMsg("");
    const filtered = weights.filter((w) => w.date !== newWeightDate);
    const updated = [...filtered, { date: newWeightDate, value: val }].sort((a, b) => a.date.localeCompare(b.date));
    setWeights(updated);
    setNewWeightVal("");
    const ok = await saveKey("weights", updated);
    if (ok) flashSaved();
    else setErrorMsg("Errore nel salvataggio del peso.");
  }

  async function addWorkout() {
    if (!newWorkoutDate || !newWorkoutScheda) {
      setErrorMsg("Seleziona data e scheda.");
      return;
    }
    setErrorMsg("");
    let note = newWorkoutNote.trim();
    if (newWorkoutScheda === "Camminata") {
      const parts = [];
      if (newWalkTime) parts.push(`${newWalkTime} min`);
      if (newWalkKm) parts.push(`${newWalkKm} km`);
      note = parts.join(" · ") + (note ? ` · ${note}` : "");
      setNewWalkTime("");
      setNewWalkKm("");
    }
    const entry = { date: newWorkoutDate, scheda: newWorkoutScheda, note };
    const updated = [...workouts, entry].sort((a, b) => a.date.localeCompare(b.date));
    setWorkouts(updated);
    setNewWorkoutNote("");
    const ok = await saveKey("workouts", updated);
    if (ok) flashSaved();
    else setErrorMsg("Errore nel salvataggio dell'allenamento.");
  }

  async function deleteWorkout(idx) {
    const updated = workouts.filter((_, i) => i !== idx);
    setWorkouts(updated);
    await saveKey("workouts", updated);
  }

  async function deleteWeight(idx) {
    const updated = weights.filter((_, i) => i !== idx);
    setWeights(updated);
    await saveKey("weights", updated);
  }

  async function addMeasurement() {
    const arm = parseFloat(mArm.replace(",", "."));
    const chest = parseFloat(mChest.replace(",", "."));
    const waist = parseFloat(mWaist.replace(",", "."));
    const leg = parseFloat(mLeg.replace(",", "."));
    if (!mDate || ![arm, chest, waist, leg].some((v) => !isNaN(v))) {
      setErrorMsg("Inserisci almeno una misura valida.");
      return;
    }
    setErrorMsg("");
    const filtered = measurements.filter((m) => m.date !== mDate);
    const entry = {
      date: mDate,
      arm: isNaN(arm) ? null : arm,
      chest: isNaN(chest) ? null : chest,
      waist: isNaN(waist) ? null : waist,
      leg: isNaN(leg) ? null : leg,
    };
    const updated = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    setMeasurements(updated);
    setMArm(""); setMChest(""); setMWaist(""); setMLeg("");
    setShowMeasureForm(false);
    const ok = await saveKey("measurements", updated);
    if (ok) flashSaved();
    else setErrorMsg("Errore nel salvataggio delle misure.");
  }

  async function deleteMeasurement(idx) {
    const updated = measurements.filter((_, i) => i !== idx);
    setMeasurements(updated);
    await saveKey("measurements", updated);
  }

  async function handleUploadPhoto() {
    if (!pFile || !pDate) {
      setErrorMsg("Seleziona una data e un'immagine.");
      return;
    }
    if (!pFile.type.startsWith("image/")) {
      setErrorMsg("Il file selezionato non è un'immagine.");
      return;
    }
    setErrorMsg("");
    setUploadingPhoto(true);
    const result = await uploadPhoto(pFile, pDate);
    setUploadingPhoto(false);
    if (result) {
      const updated = [...photos, result].sort((a, b) => a.date.localeCompare(b.date));
      setPhotos(updated);
      setPFile(null);
      flashSaved();
    } else {
      setErrorMsg("Errore durante il caricamento della foto. Riprova.");
    }
  }

  async function handleDeletePhoto(photo) {
    const ok = await deletePhoto(photo.id, photo.storagePath);
    if (ok) {
      setPhotos(photos.filter((p) => p.id !== photo.id));
      if (lightboxPhoto && lightboxPhoto.id === photo.id) setLightboxPhoto(null);
    } else {
      setErrorMsg("Errore durante l'eliminazione della foto.");
    }
  }

  const latestWeight = weights.length ? weights[weights.length - 1] : null;
  const firstWeight = weights.length ? weights[0] : null;
  const weightDelta = latestWeight && firstWeight ? latestWeight.value - firstWeight.value : null;
  const currentBmi = latestWeight ? bmi(latestWeight.value) : null;

  const workoutsThisWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // lunedì
    start.setHours(0, 0, 0, 0);
    return workouts.filter((w) => new Date(w.date) >= start).length;
  }, [workouts]);

  const totalWorkouts = workouts.length;
  const latestMeasurement = measurements.length ? measurements[measurements.length - 1] : null;
  const firstMeasurement = measurements.length ? measurements[0] : null;

  const weightSpark = weights.slice(-12).map((w) => ({ value: w.value, date: w.date }));

  if (loading) {
    return (
      <div style={{ ...styles.app, alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "#9a9286", fontSize: 14 }}>Caricamento dati…</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .dash-btn { transition: all 0.15s ease; cursor: pointer; }
        .dash-btn:hover { transform: translateY(-1px); }
        .dash-btn:active { transform: translateY(0); }
        .tab-btn { transition: all 0.15s ease; cursor: pointer; }
        .row-hover:hover { background: #f4f0e8 !important; }
        .del-btn { opacity: 0; transition: opacity 0.15s ease; }
        .row-hover:hover .del-btn { opacity: 1; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #c97b4a; outline-offset: 1px; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #d8d0c0; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Diario allenamento</div>
          <h1 style={styles.title}>La tua progressione</h1>
        </div>
        <div style={styles.saveIndicator}>
          {saveStatus && <span style={styles.saveBadge}>✓ {saveStatus}</span>}
        </div>
      </div>

      {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

      {/* Tabs */}
      <div style={styles.tabBar}>
        {[
          { id: "overview", label: "Panoramica" },
          { id: "schede", label: "Schede" },
          { id: "peso", label: "Peso" },
          { id: "allenamenti", label: "Allenamenti" },
          { id: "misure", label: "Misure corpo" },
          { id: "foto", label: "Foto" },
        ].map((t) => (
          <button
            key={t.id}
            className="tab-btn"
            onClick={() => setTab(t.id)}
            style={{
              ...styles.tabBtn,
              ...(tab === t.id ? styles.tabBtnActive : {}),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div style={styles.section}>
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Peso attuale</div>
              <div style={styles.statValue}>
                {latestWeight ? `${latestWeight.value} kg` : "—"}
              </div>
              {weightDelta !== null && (
                <div style={{ ...styles.statSub, color: weightDelta <= 0 ? "#5b8a72" : "#b5563f" }}>
                  {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(1)} kg dall'inizio
                </div>
              )}
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>BMI</div>
              <div style={styles.statValue}>{currentBmi ? currentBmi.toFixed(1) : "—"}</div>
              <div style={styles.statSub}>altezza {HEIGHT_CM} cm</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Allenamenti questa settimana</div>
              <div style={styles.statValue}>{workoutsThisWeek}<span style={{ fontSize: 16, color: "#9a9286" }}> / 3</span></div>
              <div style={styles.statSub}>{totalWorkouts} totali registrati</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <span style={styles.cardTitle}>Andamento peso</span>
              <span style={styles.cardSub}>ultimi {weightSpark.length} rilevamenti</span>
            </div>
            <AxisChart data={weightSpark} color="#c97b4a" unit="kg" height={200} />
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Ultimi allenamenti</div>
            {workouts.length === 0 ? (
              <div style={styles.emptyState}>Nessun allenamento registrato ancora. Aggiungine uno dalla scheda "Allenamenti".</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {workouts.slice(-5).reverse().map((w, i) => (
                  <div key={i} style={styles.workoutRow}>
                    <span style={{ ...styles.schedaDot, background: SCHEDA_COLOR[w.scheda] }} />
                    <span style={styles.workoutDate}>{formatDateIt(w.date)}</span>
                    <span style={styles.workoutScheda}>Scheda {w.scheda}</span>
                    {w.note && <span style={styles.workoutNote}>{w.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCHEDE */}
      {tab === "schede" && (
        <div style={styles.section}>
          {SCHEDE.map((s) => {
            const isOpen = expandedScheda === s;
            return (
              <div key={s} style={styles.card}>
                <button
                  className="dash-btn"
                  onClick={() => setExpandedScheda(isOpen ? null : s)}
                  style={styles.schedaHeaderBtn}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ ...styles.schedaDot, background: SCHEDA_COLOR[s], width: 11, height: 11 }} />
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: "#2b2520" }}>
                      Scheda {s}
                    </span>
                    <span style={styles.cardSub}>{SCHEDA_LABEL[s]}</span>
                  </span>
                  <span style={{ fontSize: 16, color: "#9a9286", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
                    ⌄
                  </span>
                </button>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #ece5d6" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Esercizio</th>
                          <th style={styles.th}>Carico</th>
                          <th style={styles.th}>Serie</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SCHEDA_EXERCISES[s].map((ex, i) => (
                          <tr key={i} className="row-hover">
                            <td style={styles.td}>{ex.name}</td>
                            <td style={{ ...styles.td, fontWeight: 600 }}>{ex.load}</td>
                            <td style={styles.td}>{ex.sets}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="dash-btn"
                      onClick={() => {
                        setNewWorkoutScheda(s);
                        setTab("allenamenti");
                      }}
                      style={{ ...styles.secondaryBtn, marginTop: 12 }}
                    >
                      Registra questo allenamento
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ ...styles.emptyState, textAlign: "center", marginTop: 4 }}>
            I carichi mostrati sono gli ultimi che hai registrato in chat con Claude. Aggiornali qui sopra man mano che progredisci.
          </div>
        </div>
      )}

      {/* PESO */}
      {tab === "peso" && (
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Aggiungi peso</div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Data</label>
                <input type="date" value={newWeightDate} onChange={(e) => setNewWeightDate(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Peso (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="es. 89.2"
                  value={newWeightVal}
                  onChange={(e) => setNewWeightVal(e.target.value)}
                  style={styles.input}
                />
              </div>
              <button className="dash-btn" onClick={addWeight} style={styles.primaryBtn}>Salva</button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <span style={styles.cardTitle}>Grafico</span>
            </div>
            <AxisChart data={weights.map((w) => ({ value: w.value, date: w.date }))} color="#c97b4a" unit="kg" height={240} />
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Storico</div>
            {weights.length === 0 ? (
              <div style={styles.emptyState}>Nessun peso registrato ancora.</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {weights.slice().reverse().map((w, i) => {
                  const realIdx = weights.length - 1 - i;
                  return (
                    <div key={realIdx} className="row-hover" style={styles.listRow}>
                      <span style={styles.listDate}>{formatDateIt(w.date)}</span>
                      <span style={styles.listValue}>{w.value} kg</span>
                      <button className="del-btn" onClick={() => deleteWeight(realIdx)} style={styles.delBtn} title="Elimina">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALLENAMENTI */}
      {tab === "allenamenti" && (
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Registra allenamento</div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Data</label>
                <input type="date" value={newWorkoutDate} onChange={(e) => setNewWorkoutDate(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Scheda</label>
                <select value={newWorkoutScheda} onChange={(e) => setNewWorkoutScheda(e.target.value)} style={styles.input}>
                  {SCHEDE.map((s) => (
                    <option key={s} value={s}>Scheda {s} — {SCHEDA_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            </div>
            {newWorkoutScheda === "Camminata" && (
              <div style={{ ...styles.formRow, marginTop: 10 }}>
                <div style={styles.formField}>
                  <label style={styles.label}>Tempo (min)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="es. 45"
                    value={newWalkTime}
                    onChange={(e) => setNewWalkTime(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formField}>
                  <label style={styles.label}>Distanza (km)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="es. 3.5"
                    value={newWalkKm}
                    onChange={(e) => setNewWalkKm(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <label style={styles.label}>Nota (opzionale)</label>
              <input
                type="text"
                placeholder="es. trazioni a 25kg, mi sono sentito forte"
                value={newWorkoutNote}
                onChange={(e) => setNewWorkoutNote(e.target.value)}
                style={{ ...styles.input, width: "100%" }}
              />
            </div>
            <button className="dash-btn" onClick={addWorkout} style={{ ...styles.primaryBtn, marginTop: 12 }}>Salva allenamento</button>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Storico allenamenti</div>
            {workouts.length === 0 ? (
              <div style={styles.emptyState}>Nessun allenamento registrato ancora.</div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {workouts.slice().reverse().map((w, i) => {
                  const realIdx = workouts.length - 1 - i;
                  return (
                    <div key={realIdx} className="row-hover" style={styles.listRow}>
                      <span style={{ ...styles.schedaDot, background: SCHEDA_COLOR[w.scheda] }} />
                      <span style={styles.listDate}>{formatDateIt(w.date)}</span>
                      <span style={{ ...styles.listValue, minWidth: 80 }}>Scheda {w.scheda}</span>
                      <span style={styles.workoutNoteList}>{w.note}</span>
                      <button className="del-btn" onClick={() => deleteWorkout(realIdx)} style={styles.delBtn} title="Elimina">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MISURE */}
      {tab === "misure" && (
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.cardHeaderRow}>
              <span style={styles.cardTitle}>Misure corporee</span>
              <button className="dash-btn" onClick={() => setShowMeasureForm((s) => !s)} style={styles.secondaryBtn}>
                {showMeasureForm ? "Annulla" : "+ Nuova misurazione"}
              </button>
            </div>

            {showMeasureForm && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e8e1d3" }}>
                <div style={styles.formField}>
                  <label style={styles.label}>Data</label>
                  <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} style={styles.input} />
                </div>
                <div style={{ ...styles.formRow, marginTop: 10, flexWrap: "wrap" }}>
                  <div style={styles.formField}>
                    <label style={styles.label}>Braccia (cm)</label>
                    <input type="text" inputMode="decimal" placeholder="es. 34" value={mArm} onChange={(e) => setMArm(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Petto (cm)</label>
                    <input type="text" inputMode="decimal" placeholder="es. 102" value={mChest} onChange={(e) => setMChest(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Vita (cm)</label>
                    <input type="text" inputMode="decimal" placeholder="es. 95" value={mWaist} onChange={(e) => setMWaist(e.target.value)} style={styles.input} />
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Gambe (cm)</label>
                    <input type="text" inputMode="decimal" placeholder="es. 56" value={mLeg} onChange={(e) => setMLeg(e.target.value)} style={styles.input} />
                  </div>
                </div>
                <button className="dash-btn" onClick={addMeasurement} style={{ ...styles.primaryBtn, marginTop: 12 }}>Salva misure</button>
              </div>
            )}
          </div>

          {latestMeasurement && (
            <div style={styles.statGrid}>
              {[
                { key: "arm", label: "Braccia" },
                { key: "chest", label: "Petto" },
                { key: "waist", label: "Vita" },
                { key: "leg", label: "Gambe" },
              ].map((m) => {
                const current = latestMeasurement[m.key];
                const initial = firstMeasurement ? firstMeasurement[m.key] : null;
                const delta = current != null && initial != null ? current - initial : null;
                return (
                  <div key={m.key} style={styles.statCard}>
                    <div style={styles.statLabel}>{m.label}</div>
                    <div style={styles.statValue}>{current != null ? `${current} cm` : "—"}</div>
                    {delta !== null && delta !== 0 && (
                      <div style={{ ...styles.statSub, color: delta < 0 ? "#5b8a72" : "#b5563f" }}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)} cm
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={styles.card}>
            <div style={styles.cardTitle}>Storico misurazioni</div>
            {measurements.length === 0 ? (
              <div style={styles.emptyState}>Nessuna misurazione registrata ancora. Aggiungine una sopra — consigliato farlo una volta al mese.</div>
            ) : (
              <div style={{ marginTop: 8, overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Data</th>
                      <th style={styles.th}>Braccia</th>
                      <th style={styles.th}>Petto</th>
                      <th style={styles.th}>Vita</th>
                      <th style={styles.th}>Gambe</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.slice().reverse().map((m, i) => {
                      const realIdx = measurements.length - 1 - i;
                      return (
                        <tr key={realIdx} className="row-hover">
                          <td style={styles.td}>{formatDateIt(m.date)}</td>
                          <td style={styles.td}>{m.arm != null ? `${m.arm} cm` : "—"}</td>
                          <td style={styles.td}>{m.chest != null ? `${m.chest} cm` : "—"}</td>
                          <td style={styles.td}>{m.waist != null ? `${m.waist} cm` : "—"}</td>
                          <td style={styles.td}>{m.leg != null ? `${m.leg} cm` : "—"}</td>
                          <td style={styles.td}>
                            <button className="del-btn" onClick={() => deleteMeasurement(realIdx)} style={styles.delBtn} title="Elimina">✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOTO */}
      {tab === "foto" && (
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Aggiungi foto progressi</div>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>Data</label>
                <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} style={styles.input} />
              </div>
              <div style={{ ...styles.formField, flex: "2 1 200px" }}>
                <label style={styles.label}>Immagine</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  style={styles.input}
                />
              </div>
              <button
                className="dash-btn"
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                style={{ ...styles.primaryBtn, opacity: uploadingPhoto ? 0.6 : 1 }}
              >
                {uploadingPhoto ? "Caricamento…" : "Carica foto"}
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Cronologia foto</div>
            {photos.length === 0 ? (
              <div style={styles.emptyState}>Nessuna foto ancora. Carica la prima foto sopra per iniziare a tracciare i progressi visivamente — consigliato farlo una volta al mese, con stessa posa e luce.</div>
            ) : (
              <div style={styles.photoGrid}>
                {photos.slice().reverse().map((p) => (
                  <div key={p.id} className="row-hover" style={styles.photoCard}>
                    <img
                      src={p.url}
                      alt={`Foto progressi ${formatDateIt(p.date)}`}
                      style={styles.photoThumb}
                      onClick={() => setLightboxPhoto(p)}
                    />
                    <div style={styles.photoCardFooter}>
                      <span style={styles.photoDate}>{formatDateIt(p.date)}</span>
                      <button className="del-btn" onClick={() => handleDeletePhoto(p)} style={styles.delBtn} title="Elimina">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX FOTO */}
      {lightboxPhoto && (
        <div style={styles.lightboxOverlay} onClick={() => setLightboxPhoto(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxPhoto.url} alt={`Foto ${formatDateIt(lightboxPhoto.date)}`} style={styles.lightboxImg} />
            <div style={styles.lightboxFooter}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{formatDateIt(lightboxPhoto.date)}</span>
              <button onClick={() => setLightboxPhoto(null)} style={styles.lightboxClose}>✕ Chiudi</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.footer}>I tuoi dati sono salvati solo per te e restano disponibili la prossima volta che apri questa dashboard.</div>
    </div>
  );
}

// ---------- Stili ----------
const styles = {
  app: {
    fontFamily: "'Inter', sans-serif",
    background: "#faf7f1",
    color: "#2b2520",
    minHeight: "100%",
    padding: "24px 20px 32px",
    maxWidth: 720,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#c97b4a",
    marginBottom: 4,
  },
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 28,
    fontWeight: 600,
    margin: 0,
    color: "#2b2520",
  },
  saveIndicator: { minHeight: 24 },
  saveBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#5b8a72",
    background: "#e8f0ea",
    padding: "4px 10px",
    borderRadius: 20,
  },
  errorBanner: {
    background: "#fbe9e3",
    color: "#b5563f",
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #f0c9ba",
  },
  tabBar: {
    display: "flex",
    gap: 4,
    background: "#f0ebe0",
    padding: 4,
    borderRadius: 12,
    overflowX: "auto",
  },
  tabBtn: {
    flex: "1 0 auto",
    padding: "9px 14px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    border: "none",
    borderRadius: 9,
    background: "transparent",
    color: "#7a7164",
    whiteSpace: "nowrap",
  },
  tabBtnActive: {
    background: "#fff",
    color: "#2b2520",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  section: { display: "flex", flexDirection: "column", gap: 14 },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #ece5d6",
    borderRadius: 14,
    padding: "16px 16px",
  },
  statLabel: { fontSize: 12, color: "#9a9286", fontWeight: 500, marginBottom: 6 },
  statValue: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: "#2b2520" },
  statSub: { fontSize: 12, marginTop: 4, fontWeight: 500, color: "#9a9286" },
  card: {
    background: "#fff",
    border: "1px solid #ece5d6",
    borderRadius: 14,
    padding: "18px 18px",
  },
  cardHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  schedaHeaderBtn: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "none",
    border: "none",
    padding: 0,
    fontFamily: "'Inter', sans-serif",
    textAlign: "left",
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#2b2520" },
  cardSub: { fontSize: 11, color: "#9a9286" },
  emptyState: { fontSize: 13, color: "#9a9286", marginTop: 8, lineHeight: 1.5 },
  formRow: { display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" },
  formField: { display: "flex", flexDirection: "column", gap: 5, flex: "1 1 120px" },
  label: { fontSize: 11, fontWeight: 600, color: "#7a7164", textTransform: "uppercase", letterSpacing: "0.03em" },
  input: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    padding: "9px 11px",
    borderRadius: 9,
    border: "1px solid #ddd4c2",
    background: "#fdfcf9",
    color: "#2b2520",
  },
  primaryBtn: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: "10px 18px",
    borderRadius: 9,
    border: "none",
    background: "#c97b4a",
    color: "#fff",
  },
  secondaryBtn: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    padding: "7px 12px",
    borderRadius: 8,
    border: "1px solid #ddd4c2",
    background: "#fdfcf9",
    color: "#7a7164",
  },
  workoutRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 0" },
  schedaDot: { width: 9, height: 9, borderRadius: "50%", flexShrink: 0 },
  workoutDate: { color: "#9a9286", minWidth: 80 },
  workoutScheda: { fontWeight: 600, color: "#2b2520" },
  workoutNote: { color: "#9a9286", fontStyle: "italic", fontSize: 12 },
  workoutNoteList: { color: "#9a9286", fontStyle: "italic", fontSize: 12, flex: 1 },
  listRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 6px",
    borderRadius: 8,
    fontSize: 13,
  },
  listDate: { color: "#9a9286", minWidth: 80 },
  listValue: { fontWeight: 600, color: "#2b2520" },
  delBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    color: "#b5563f",
    fontSize: 13,
    cursor: "pointer",
    padding: "2px 6px",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", color: "#9a9286", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid #ece5d6" },
  td: { padding: "9px 10px", color: "#2b2520", borderBottom: "1px solid #f3eee2" },
  footer: { textAlign: "center", fontSize: 11, color: "#bcb3a2", marginTop: 4 },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 12,
    marginTop: 10,
  },
  photoCard: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #ece5d6",
    background: "#fdfcf9",
  },
  photoThumb: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    display: "block",
    cursor: "pointer",
  },
  photoCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
  },
  photoDate: { fontSize: 11.5, color: "#7a7164", fontWeight: 600 },
  lightboxOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(20,16,12,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },
  lightboxContent: {
    maxWidth: "90vw",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  lightboxImg: {
    maxWidth: "90vw",
    maxHeight: "78vh",
    objectFit: "contain",
    borderRadius: 10,
  },
  lightboxFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lightboxClose: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
};
