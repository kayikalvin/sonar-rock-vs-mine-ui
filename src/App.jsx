import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AlertTriangle, Anchor, Crosshair, RotateCcw, Copy, Check, Radio } from "lucide-react";

// ---------------------------------------------------------------------------
// Sample contacts (verified sonar signatures from the dataset)
// ---------------------------------------------------------------------------
const SAMPLES = [
  {
    id: "CT-114",
    label: "Mine",
    note: "Low-density object, smooth return",
    features: [0.02,0.0371,0.0428,0.0207,0.0954,0.0986,0.1539,0.1601,0.3109,0.2111,0.1609,0.1582,0.2238,0.0645,0.066,0.2273,0.31,0.2999,0.5078,0.4797,0.5783,0.5071,0.4328,0.555,0.6711,0.6415,0.7104,0.808,0.6791,0.3857,0.1307,0.2604,0.5121,0.7547,0.8537,0.8507,0.6692,0.6097,0.4943,0.2744,0.051,0.2834,0.2825,0.4256,0.2641,0.1386,0.1051,0.1343,0.0383,0.0324,0.0232,0.0027,0.0065,0.0159,0.0072,0.0167,0.018,0.0084,0.009,0.0032],
  },
  {
    id: "CT-209",
    label: "Mine",
    note: "High-density metal, irregular hull",
    features: [0.0179,0.0136,0.0408,0.0633,0.0596,0.0808,0.209,0.3465,0.5276,0.5965,0.6254,0.4507,0.3693,0.2864,0.1635,0.0422,0.1785,0.4394,0.695,0.8097,0.855,0.8717,0.8601,0.9201,0.8729,0.8084,0.8694,0.8411,0.5793,0.3754,0.3485,0.4639,0.6495,0.6901,0.5666,0.5188,0.506,0.3885,0.3762,0.3738,0.2605,0.1591,0.1875,0.2267,0.1577,0.1211,0.0883,0.085,0.0355,0.0219,0.0086,0.0123,0.006,0.0187,0.0111,0.0126,0.0081,0.0155,0.016,0.0085],
  },
  {
    id: "CT-337",
    label: "Mine",
    note: "Dense cylinder, textured surface",
    features: [0.0453,0.0523,0.0843,0.0689,0.1183,0.2583,0.2156,0.3481,0.3337,0.2872,0.4918,0.6552,0.6919,0.7797,0.7464,0.9444,1.0,0.8874,0.8024,0.7818,0.5212,0.4052,0.3957,0.3914,0.325,0.32,0.3271,0.2767,0.4423,0.2028,0.3788,0.2947,0.1984,0.2341,0.1306,0.4182,0.3835,0.1057,0.184,0.197,0.1674,0.0583,0.1401,0.1628,0.0621,0.0203,0.053,0.0742,0.0409,0.0061,0.0125,0.0084,0.0089,0.0048,0.0094,0.0191,0.014,0.0049,0.0052,0.0044],
  },
  {
    id: "CT-061",
    label: "Rock",
    note: "Irregular natural mass, soft echo",
    features: [0.0317,0.0956,0.1321,0.1408,0.1674,0.171,0.0731,0.1401,0.2083,0.3513,0.1786,0.0658,0.0513,0.3752,0.5419,0.544,0.515,0.4262,0.2024,0.4233,0.7723,0.9735,0.9390,0.5559,0.5268,0.6826,0.5713,0.5429,0.2177,0.2149,0.5811,0.6323,0.2965,0.1873,0.2308,0.2829,0.2222,0.3712,0.1531,0.2014,0.3133,0.2113,0.1135,0.2884,0.1923,0.1349,0.0951,0.0697,0.0103,0.0033,0.011,0.0048,0.0058,0.0027,0.0042,0.0042,0.0028,0.0009,0.0046,0.0036],
  },
];

const N_BANDS = 60;

// ---------------------------------------------------------------------------
// Inference heuristic (placeholder model — replace with real API call)
// ---------------------------------------------------------------------------
function classify(vec) {
  const mean = vec.reduce((s, v) => s + v, 0) / vec.length;
  const variance = vec.reduce((s, v) => s + (v - mean) ** 2, 0) / vec.length;
  const earlyEnergy = vec.slice(0, 20).reduce((s, v) => s + v, 0);
  const lateEnergy = vec.slice(40).reduce((s, v) => s + v, 0);
  const isMine = mean > 0.15 && variance > 0.045 && earlyEnergy > lateEnergy * 0.6;
  const score = Math.min(0.97, Math.max(0.52, mean * 1.4 + variance * 3 + (isMine ? 0.15 : 0)));
  return { label: isMine ? "Mine" : "Rock", confidence: score };
}

// ---------------------------------------------------------------------------
// Radial sweep — the signature element. Draws the 60-band vector as a
// circular sonar trace and sweeps a beam across it on submit.
// ---------------------------------------------------------------------------
function SonarSweep({ vector, sweeping, result, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.42;
  const rMin = size * 0.14;

  const points = useMemo(() => {
    return vector.map((v, i) => {
      const angle = (i / N_BANDS) * Math.PI * 2 - Math.PI / 2;
      const r = rMin + v * (rMax - rMin);
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        angle,
        v,
      };
    });
  }, [vector, cx, cy, rMin, rMax]);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ") + " Z";

  const ringCount = 4;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="select-none">
      <defs>
        <radialGradient id="sweepGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5FA8D3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#5FA8D3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="traceFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={result?.label === "Mine" ? "#E8A33D" : "#9FE8D8"} stopOpacity="0.28" />
          <stop offset="100%" stopColor={result?.label === "Mine" ? "#E8A33D" : "#9FE8D8"} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* background range rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const r = rMin + ((i + 1) / ringCount) * (rMax - rMin);
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#1B4965"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
        );
      })}

      {/* spokes every 90deg for orientation */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * rMin}
            y1={cy + Math.sin(angle) * rMin}
            x2={cx + Math.cos(angle) * rMax}
            y2={cy + Math.sin(angle) * rMax}
            stroke="#1B4965"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        );
      })}

      {/* the data trace */}
      <path d={pathD} fill="url(#traceFill)" stroke="#5FA8D3" strokeWidth="1.5" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.6" fill="#5FA8D3" fillOpacity="0.85" />
      ))}

      {/* center hub */}
      <circle cx={cx} cy={cy} r={rMin - 6} fill="#06141B" stroke="#1B4965" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="3" fill="#5FA8D3" />

      {/* sweeping beam */}
      {sweeping && (
        <g style={{ transformOrigin: `${cx}px ${cy}px` }} className="sweep-beam">
          <path
            d={`M ${cx} ${cy} L ${cx} ${cy - rMax} A ${rMax} ${rMax} 0 0 1 ${cx + rMax * Math.sin(0.5)} ${cy - rMax * Math.cos(0.5)} Z`}
            fill="url(#sweepGlow)"
          />
          <line x1={cx} y1={cy} x2={cx} y2={cy - rMax} stroke="#9FE8D8" strokeWidth="1.5" strokeOpacity="0.9" />
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Band editor — drag vertical bars to set the 60 feature values.
// ---------------------------------------------------------------------------
function BandEditor({ vector, onChange }) {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const lastIndexRef = useRef(null);

  const setFromPointer = useCallback(
    (clientX, clientY, index) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const barW = rect.width / N_BANDS;
      const idx = index !== undefined ? index : Math.min(N_BANDS - 1, Math.max(0, Math.floor((clientX - rect.left) / barW)));
      const value = Math.min(1, Math.max(0, 1 - (clientY - rect.top) / rect.height));
      onChange((prev) => {
        const next = [...prev];
        next[idx] = Math.round(value * 1000) / 1000;
        return next;
      });
      lastIndexRef.current = idx;
    },
    [onChange]
  );

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      setFromPointer(point.clientX, point.clientY);
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [setFromPointer]);

  return (
    <div
      ref={containerRef}
      className="band-editor"
      onMouseDown={(e) => {
        draggingRef.current = true;
        setFromPointer(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        draggingRef.current = true;
        const t = e.touches[0];
        setFromPointer(t.clientX, t.clientY);
      }}
    >
      {vector.map((v, i) => (
        <div key={i} className="band-col" title={`Band ${i + 1}: ${v.toFixed(3)}`}>
          <div className="band-fill" style={{ height: `${v * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SonarConsole() {
  const [vector, setVector] = useState(() => Array.from({ length: N_BANDS }, () => 0.05));
  const [activeSample, setActiveSample] = useState(null);
  const [result, setResult] = useState(null);
  const [sweeping, setSweeping] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [log, setLog] = useState([]);

  const handleVectorChange = (updater) => {
    setActiveSample(null);
    setResult(null);
    setVector((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  const loadSample = (sample) => {
    setVector(sample.features);
    setActiveSample(sample.id);
    setResult(null);
    setError("");
  };

  const clearBoard = () => {
    setVector(Array.from({ length: N_BANDS }, () => 0.05));
    setActiveSample(null);
    setResult(null);
    setError("");
  };

  const runClassification = () => {
    const flat = vector.every((v) => v === 0.05);
    if (flat) {
      setError("Set the contact's return signature before classifying — drag the bands or load a sample.");
      return;
    }
    setError("");
    setSweeping(true);
    setResult(null);
    setTimeout(() => {
      const r = classify(vector);
      setResult(r);
      setSweeping(false);
      setLog((prev) => [
        { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), ...r, id: activeSample || "MANUAL" },
        ...prev,
      ].slice(0, 6));
    }, 1400);
  };

  const copyVector = async (sample) => {
    try {
      await navigator.clipboard.writeText(sample.features.join(","));
      setCopiedId(sample.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch (e) {
      // clipboard unavailable — fail silently, no console contact affected
    }
  };

  return (
    <div className="console-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');

        .console-root {
          --abyss: #06141B;
          --panel: #0F2536;
          --panel-raised: #15314A;
          --steel: #1B4965;
          --sweep: #5FA8D3;
          --warn: #E8A33D;
          --safe: #9FE8D8;
          --ink: #CFE3EE;
          --ink-dim: #6E8CA0;

          background: radial-gradient(ellipse 120% 80% at 50% -10%, #0d2e42 0%, var(--abyss) 55%);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          width: 100%;
          padding: 0;
          position: relative;
          overflow-x: hidden;
        }

        .console-root * { box-sizing: border-box; }

        .mono { font-family: 'IBM Plex Mono', monospace; }

        .grain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: repeating-linear-gradient(0deg, rgba(95,168,211,0.025) 0px, transparent 1px, transparent 2px);
          mix-blend-mode: overlay;
          z-index: 1;
        }

        .shell {
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          position: relative;
          z-index: 2;
        }

        .masthead {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 56px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--steel);
        }

        .masthead-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.18em;
          color: var(--ink-dim);
          text-transform: uppercase;
          margin: 0 0 6px;
        }

        .masthead h1 {
          font-size: 28px;
          font-weight: 600;
          margin: 0;
          color: #EAF4FA;
          letter-spacing: -0.01em;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--safe);
          padding: 6px 12px;
          border: 1px solid var(--steel);
          border-radius: 4px;
          background: rgba(95,168,211,0.06);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--safe);
          box-shadow: 0 0 8px var(--safe);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 40px;
          align-items: center;
          margin-bottom: 64px;
        }

        @media (max-width: 760px) {
          .hero-grid { grid-template-columns: 1fr; gap: 24px; }
        }

        .sweep-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--panel);
          border: 1px solid var(--steel);
          border-radius: 8px;
          padding: 20px;
          aspect-ratio: 1;
        }

        .sweep-beam {
          animation: rotate-sweep 1.4s linear;
        }

        @keyframes rotate-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sweep-readout {
          position: absolute;
          bottom: 14px;
          left: 0;
          right: 0;
          text-align: center;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--ink-dim);
          letter-spacing: 0.08em;
        }

        .hero-copy .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          color: var(--sweep);
          text-transform: uppercase;
          margin: 0 0 12px;
        }

        .hero-copy h2 {
          font-size: 34px;
          line-height: 1.15;
          font-weight: 600;
          color: #EAF4FA;
          margin: 0 0 16px;
          max-width: 460px;
        }

        .hero-copy p {
          font-size: 15px;
          line-height: 1.65;
          color: var(--ink-dim);
          max-width: 440px;
          margin: 0;
        }

        .panel {
          background: var(--panel);
          border: 1px solid var(--steel);
          border-radius: 8px;
          padding: 28px;
          margin-bottom: 28px;
        }

        .panel-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .panel-head h3 {
          font-size: 15px;
          font-weight: 600;
          color: #EAF4FA;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .panel-head .hint {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--ink-dim);
        }

        .band-editor {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 160px;
          background: var(--abyss);
          border: 1px solid var(--steel);
          border-radius: 6px;
          padding: 8px;
          cursor: crosshair;
          user-select: none;
          touch-action: none;
        }

        .band-col {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
          min-width: 2px;
        }

        .band-fill {
          width: 100%;
          background: linear-gradient(to top, var(--sweep), rgba(95,168,211,0.25));
          border-radius: 1px;
          transition: height 0.05s linear;
        }

        .editor-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--ink-dim);
        }

        .btn-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.03em;
          padding: 12px 20px;
          border-radius: 6px;
          border: 1px solid var(--steel);
          background: transparent;
          color: var(--ink);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.15s, background 0.15s;
        }

        .btn:hover { border-color: var(--sweep); background: rgba(95,168,211,0.08); }
        .btn:focus-visible { outline: 2px solid var(--sweep); outline-offset: 2px; }

        .btn-primary {
          background: var(--sweep);
          border-color: var(--sweep);
          color: #06141B;
          font-weight: 600;
        }

        .btn-primary:hover { background: #79bce0; border-color: #79bce0; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .error-line {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 6px;
          border: 1px solid #6b3a1f;
          background: rgba(232,163,61,0.08);
          color: var(--warn);
          font-size: 13px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .result-banner {
          margin-top: 24px;
          padding: 20px 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border: 1px solid var(--steel);
          animation: result-in 0.3s ease-out;
        }

        @keyframes result-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-banner.mine { background: rgba(232,163,61,0.08); border-color: #6b3a1f; }
        .result-banner.rock { background: rgba(159,232,216,0.07); border-color: #2c6b5c; }

        .result-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--ink-dim);
          margin: 0 0 6px;
          text-transform: uppercase;
        }

        .result-class {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-class.mine { color: var(--warn); }
        .result-class.rock { color: var(--safe); }

        .confidence-track {
          width: 140px;
        }

        .confidence-track .bar {
          height: 5px;
          background: var(--abyss);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 6px;
        }

        .confidence-track .fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease-out;
        }

        .confidence-track .fill.mine { background: var(--warn); }
        .confidence-track .fill.rock { background: var(--safe); }

        .confidence-track .pct {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 18px;
          font-weight: 600;
        }

        .sample-grid {
          display: grid;
          gap: 10px;
        }

        .sample-row {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid var(--steel);
          border-radius: 6px;
          background: var(--panel-raised);
          transition: border-color 0.15s;
        }

        .sample-row.active { border-color: var(--sweep); }

        @media (max-width: 600px) {
          .sample-row { grid-template-columns: auto 1fr; row-gap: 10px; }
          .sample-row .sample-actions { grid-column: 1 / -1; justify-self: start; }
        }

        .tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 4px 9px;
          border-radius: 4px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .tag.mine { background: rgba(232,163,61,0.15); color: var(--warn); }
        .tag.rock { background: rgba(159,232,216,0.13); color: var(--safe); }

        .sample-meta { min-width: 0; }
        .sample-meta .id { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #EAF4FA; }
        .sample-meta .note { font-size: 12px; color: var(--ink-dim); margin-top: 2px; }

        .icon-btn {
          background: transparent;
          border: 1px solid var(--steel);
          color: var(--ink-dim);
          border-radius: 5px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .icon-btn:hover { border-color: var(--sweep); color: var(--sweep); }

        .log-table {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          width: 100%;
          border-collapse: collapse;
        }

        .log-table th {
          text-align: left;
          color: var(--ink-dim);
          font-weight: 500;
          padding: 8px 10px;
          border-bottom: 1px solid var(--steel);
          letter-spacing: 0.05em;
        }

        .log-table td {
          padding: 9px 10px;
          border-bottom: 1px solid rgba(27,73,101,0.4);
          color: var(--ink);
        }

        .log-empty {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--ink-dim);
          padding: 20px 0;
          text-align: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .sweep-beam { animation: none; }
          .status-dot { animation: none; }
          .result-banner { animation: none; }
        }
      `}</style>

      <div className="grain-overlay" />

      <div className="shell">
        {/* Masthead */}
        <header className="masthead">
          <div>
            <p className="masthead-title">Acoustic Contact Classifier</p>
            <h1>SONAR / Mk.60</h1>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            <span>MODEL ONLINE</span>
          </div>
        </header>

        {/* Hero: sweep visualization + thesis */}
        <section className="hero-grid">
          <div className="sweep-stage">
            <SonarSweep vector={vector} sweeping={sweeping} result={result} />
            <div className="sweep-readout">{N_BANDS} BANDS · 0–1 NORM</div>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">60-band frequency return</p>
            <h2>Tell a mine from a rock by the shape of its echo.</h2>
            <p>
              Every contact returns a signature across 60 sonar frequency bands.
              Shape the bands below or load a recorded contact, then run it through
              the classifier to get a call: mine or rock, with a confidence score.
            </p>
          </div>
        </section>

        {/* Band editor */}
        <section className="panel">
          <div className="panel-head">
            <h3><Crosshair size={16} strokeWidth={2} /> Contact Signature</h3>
            <span className="hint">{activeSample ? `LOADED: ${activeSample}` : "MANUAL INPUT"}</span>
          </div>

          <BandEditor vector={vector} onChange={handleVectorChange} />

          <div className="editor-meta">
            <span>Click or drag across the bands to set energy per frequency</span>
            <span>{vector.filter((v) => v !== 0.05).length} / {N_BANDS} bands set</span>
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={runClassification} disabled={sweeping}>
              <Radio size={15} />
              {sweeping ? "Sweeping…" : "Classify Contact"}
            </button>
            <button className="btn" onClick={clearBoard}>
              <RotateCcw size={15} />
              Reset Board
            </button>
          </div>

          {error && (
            <div className="error-line">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className={`result-banner ${result.label.toLowerCase()}`}>
              <div>
                <p className="result-label">Classification</p>
                <p className={`result-class ${result.label.toLowerCase()}`}>
                  {result.label === "Mine" ? <AlertTriangle size={22} /> : <Anchor size={22} />}
                  {result.label}
                </p>
              </div>
              <div className="confidence-track">
                <span className={`pct mono ${result.label.toLowerCase()}`} style={{ color: result.label === "Mine" ? "var(--warn)" : "var(--safe)" }}>
                  {(result.confidence * 100).toFixed(1)}%
                </span>
                <div className="bar">
                  <div
                    className={`fill ${result.label.toLowerCase()}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Recorded contacts (samples) */}
        <section className="panel">
          <div className="panel-head">
            <h3><Anchor size={16} strokeWidth={2} /> Recorded Contacts</h3>
            <span className="hint">VERIFIED SIGNATURES</span>
          </div>
          <div className="sample-grid">
            {SAMPLES.map((sample) => (
              <div key={sample.id} className={`sample-row ${activeSample === sample.id ? "active" : ""}`}>
                <span className={`tag ${sample.label.toLowerCase()}`}>{sample.label}</span>
                <div className="sample-meta">
                  <div className="id">{sample.id}</div>
                  <div className="note">{sample.note}</div>
                </div>
                <div className="sample-actions" style={{ display: "flex", gap: 8 }}>
                  <button className="icon-btn" onClick={() => copyVector(sample)} aria-label={`Copy ${sample.id} feature vector`}>
                    {copiedId === sample.id ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <button className="btn" onClick={() => loadSample(sample)}>Load</button>
              </div>
            ))}
          </div>
        </section>

        {/* Session log */}
        <section className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-head">
            <h3><Radio size={16} strokeWidth={2} /> Session Log</h3>
            <span className="hint">LAST {log.length || 0} CALLS</span>
          </div>
          {log.length === 0 ? (
            <div className="log-empty">No classifications run yet this session.</div>
          ) : (
            <table className="log-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Contact</th>
                  <th>Call</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.time}</td>
                    <td>{entry.id}</td>
                    <td style={{ color: entry.label === "Mine" ? "var(--warn)" : "var(--safe)" }}>{entry.label}</td>
                    <td>{(entry.confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}




































// import { useState } from "react";
// import { AlertCircle, Copy, Check, Loader2, Target, Activity } from "lucide-react";

// export default function SonarPrediction() {
//   const [features, setFeatures] = useState("");
//   const [prediction, setPrediction] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [copiedIndex, setCopiedIndex] = useState(null);
//   const [confidence, setConfidence] = useState(null);

//   const handleChange = (e) => {
//     setFeatures(e.target.value);
//     setError("");
//   };

//   const validateFeatures = (featureArray) => {
//     if (featureArray.length !== 60) {
//       throw new Error(`Expected 60 features, got ${featureArray.length}`);
//     }
//     if (featureArray.some(isNaN)) {
//       throw new Error("All features must be valid numbers");
//     }
//     if (featureArray.some(val => val < 0 || val > 1)) {
//       throw new Error("Features should be normalized between 0 and 1");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!features.trim()) {
//       setError("Please enter sonar data before predicting.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setPrediction(null);
//     setConfidence(null);

//     try {
//       const featureArray = features.split(",").map(str => {
//         const num = parseFloat(str.trim());
//         if (isNaN(num)) {
//           throw new Error(`Invalid number: "${str.trim()}"`);
//         }
//         return num;
//       });

//       validateFeatures(featureArray);

//       // Simulate API call with mock response since we can't use axios
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // Mock prediction logic based on feature patterns
//       const avgValue = featureArray.reduce((sum, val) => sum + val, 0) / featureArray.length;
//       const variance = featureArray.reduce((sum, val) => sum + Math.pow(val - avgValue, 2), 0) / featureArray.length;
      
//       const isMine = avgValue > 0.15 && variance > 0.05;
//       const mockConfidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
      
//       setPrediction(isMine ? "Mine" : "Rock");
//       setConfidence(mockConfidence);
      
//     } catch (error) {
//       setError(error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const copyToClipboard = async (text, index) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopiedIndex(index);
//       setTimeout(() => setCopiedIndex(null), 2000);
//     } catch (err) {
//       console.error("Failed to copy:", err);
//     }
//   };

//   const testData = [
//     {
//       features: "0.02,0.0371,0.0428,0.0207,0.0954,0.0986,0.1539,0.1601,0.3109,0.2111,0.1609,0.1582,0.2238,0.0645,0.066,0.2273,0.31,0.2999,0.5078,0.4797,0.5783,0.5071,0.4328,0.555,0.6711,0.6415,0.7104,0.808,0.6791,0.3857,0.1307,0.2604,0.5121,0.7547,0.8537,0.8507,0.6692,0.6097,0.4943,0.2744,0.051,0.2834,0.2825,0.4256,0.2641,0.1386,0.1051,0.1343,0.0383,0.0324,0.0232,0.0027,0.0065,0.0159,0.0072,0.0167,0.018,0.0084,0.009,0.0032",
//       label: "Mine",
//       description: "Low-density object with smooth surface characteristics"
//     },
//     {
//       features: "0.0179,0.0136,0.0408,0.0633,0.0596,0.0808,0.209,0.3465,0.5276,0.5965,0.6254,0.4507,0.3693,0.2864,0.1635,0.0422,0.1785,0.4394,0.695,0.8097,0.855,0.8717,0.8601,0.9201,0.8729,0.8084,0.8694,0.8411,0.5793,0.3754,0.3485,0.4639,0.6495,0.6901,0.5666,0.5188,0.506,0.3885,0.3762,0.3738,0.2605,0.1591,0.1875,0.2267,0.1577,0.1211,0.0883,0.085,0.0355,0.0219,0.0086,0.0123,0.006,0.0187,0.0111,0.0126,0.0081,0.0155,0.016,0.0085",
//       label: "Mine",
//       description: "High-density metallic object with irregular surface"
//     },
//     {
//       features: "0.0453,0.0523,0.0843,0.0689,0.1183,0.2583,0.2156,0.3481,0.3337,0.2872,0.4918,0.6552,0.6919,0.7797,0.7464,0.9444,1.0000,0.8874,0.8024,0.7818,0.5212,0.4052,0.3957,0.3914,0.3250,0.3200,0.3271,0.2767,0.4423,0.2028,0.3788,0.2947,0.1984,0.2341,0.1306,0.4182,0.3835,0.1057,0.184,0.197,0.1674,0.0583,0.1401,0.1628,0.0621,0.0203,0.053,0.0742,0.0409,0.0061,0.0125,0.0084,0.0089,0.0048,0.0094,0.0191,0.014,0.0049,0.0052,0.0044",
//       label: "Mine",
//       description: "Dense metallic cylinder with textured surface"
//     }
//   ];

//   return (
//     <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="flex items-center justify-center gap-3 mb-4">
//             <Target className="w-8 h-8 text-blue-600" />
//             <h1 className="text-3xl font-bold text-gray-800">Sonar Classification System</h1>
//           </div>
//           <p className="text-gray-600 text-lg">
//             Classify underwater objects as mines or rocks using sonar signature analysis
//           </p>
//         </div>

//         {/* Main Content */}
//         <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
//           <div className="flex items-center gap-2 mb-4">
//             <Activity className="w-5 h-5 text-blue-600" />
//             <h2 className="text-xl font-semibold text-gray-800">Prediction Engine</h2>
//           </div>

//           {/* Input Form */}
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Sonar Features (60 comma-separated values, normalized 0-1)
//               </label>
//               <textarea
//                 value={features}
//                 onChange={handleChange}
//                 placeholder="Enter 60 sonar features separated by commas (e.g., 0.02,0.0371,0.0428...)"
//                 className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
//                 rows="3"
//               />
//               <div className="text-xs text-gray-500 mt-1">
//                 Features count: {features ? features.split(",").length : 0} / 60
//               </div>
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Analyzing Sonar Data...
//                 </>
//               ) : (
//                 "Classify Object"
//               )}
//             </button>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
//               <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
//               <span className="text-red-700">{error}</span>
//             </div>
//           )}

//           {/* Prediction Result */}
//           {prediction && (
//             <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Classification Result</h3>
//                   <div className="flex items-center gap-2 mt-2">
//                     <span className="text-sm text-gray-600">Predicted Class:</span>
//                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                       prediction === "Mine" 
//                         ? "bg-red-100 text-red-800" 
//                         : "bg-green-100 text-green-800"
//                     }`}>
//                       {prediction}
//                     </span>
//                   </div>
//                   {confidence && (
//                     <div className="mt-2">
//                       <span className="text-sm text-gray-600">Confidence: </span>
//                       <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
//                       <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
//                         <div 
//                           className="bg-blue-600 h-2 rounded-full transition-all duration-500"
//                           style={{ width: `${confidence * 100}%` }}
//                         />
//                       </div>
//                     </div>
//                   )}
//                 </div>
//                 <div className="text-4xl">
//                   {prediction === "Mine" ? "⚠️" : "🪨"}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Test Data Section */}
//         <div className="bg-white rounded-xl shadow-lg p-6">
//           <h2 className="text-xl font-semibold text-gray-800 mb-4">Sample Test Data</h2>
//           <p className="text-gray-600 mb-4">
//             Use these verified sonar signatures to test the classification system
//           </p>
          
//           <div className="grid gap-4">
//             {testData.map((row, index) => (
//               <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center gap-3">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                       row.label === "Mine" 
//                         ? "bg-red-100 text-red-800" 
//                         : "bg-green-100 text-green-800"
//                     }`}>
//                       {row.label}
//                     </span>
//                     <span className="text-sm text-gray-600">{row.description}</span>
//                   </div>
//                   <button
//                     onClick={() => copyToClipboard(row.features, index)}
//                     className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
//                   >
//                     {copiedIndex === index ? (
//                       <>
//                         <Check className="w-4 h-4" />
//                         Copied!
//                       </>
//                     ) : (
//                       <>
//                         <Copy className="w-4 h-4" />
//                         Copy Features
//                       </>
//                     )}
//                   </button>
//                 </div>
//                 <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
//                   {row.features.split(",").slice(0, 8).join(", ")}...
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }