import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import WinOverlay from "../components/WinOverlay";

// ─── Prize layout ────────────────────────────────────────────────────────────
// 12 buckets. Distribution: null(7) | bonbons(2) | barbapapa(2) | pochette(1)
// Spread the prizes evenly across the 12 slots.
type PrizeId = "bonbons" | "barbapapa" | "pochette" | null;

const PRIZES: PrizeId[] = [
  null, "pochette", null, "barbapapa", null, "bonbons",
  null, "barbapapa", null, "pochette", null, null,
];

const PRIZE_META = {
  bonbons:   { emoji: "🍬", label: "Assiette de Bonbons",       color: "#d4af37",  glow: "rgba(212,175,55,0.6)"   },
  barbapapa: { emoji: "🎫", label: "Goodies",  color: "#c8a8ff",  glow: "rgba(180,130,255,0.55)" },
  pochette:  { emoji: "🎁", label: "Pochette Surprise",          color: "#c41e3a",  glow: "rgba(196,30,58,0.6)"   },
} as const;

// ─── Physics constants ───────────────────────────────────────────────────────
const ROWS       = 18;   // pegs rows
const GRAVITY    = 0.42;
const BOUNCE     = 0.40;
const BALL_R     = 12;
const PEG_R      = 7;
const FPS        = 60;

interface Peg  { x: number; y: number }
interface Ball { x: number; y: number; vx: number; vy: number; done: boolean; bucket: number | null }

function buildPegs(W: number, H: number): Peg[] {
  const pegs: Peg[] = [];
  const topPad  = H * 0.06;
  const botPad  = H * 0.18;
  const usableH = H - topPad - botPad;
  const rowGap  = usableH / (ROWS - 1);

  // True quincunx: fixed horizontal spacing s = W/COLS
  // Even rows: COLS pegs starting at s/2   → x = s/2,  3s/2, 5s/2 …
  // Odd  rows: COLS-1 pegs starting at s   → x = s,    2s,   3s   …
  // Every odd-row peg sits exactly halfway between two even-row pegs.
  const COLS = 20;
  const s    = W / COLS;

  for (let r = 0; r < ROWS; r++) {
    const isOdd = r % 2 === 1;
    const cols  = isOdd ? COLS - 1 : COLS;
    const startX = isOdd ? s : s / 2;
    for (let c = 0; c < cols; c++) {
      pegs.push({
        x: startX + c * s,
        y: topPad + r * rowGap,
      });
    }
  }
  return pegs;
}

function bucketX(idx: number, W: number): number {
  const bucketW = W / 12;
  return bucketW * idx + bucketW / 2;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Plinko() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const pegsRef    = useRef<Peg[]>([]);
  const ballRef    = useRef<Ball | null>(null);
  const rafRef     = useRef<number>(0);
  const lastRef    = useRef<number>(0);
  const [phase,    setPhase]   = useState<"idle" | "dropping" | "won" | "lost">("idle");
  const [prize,    setPrize]   = useState<PrizeId>(null);
  const [stats,    setStats]   = useState({ drops: 0, wins: 0 });
  const [highlight, setHighlight] = useState<number | null>(null);
  const [showWin,  setShowWin]  = useState(false);

  const [searchParams] = useSearchParams();
  const isAdulte = searchParams.get('adulte') === '1';
  const isAdulteRef = useRef(isAdulte);
  isAdulteRef.current = isAdulte;

  // Canvas dimensions (responsive)
  const W = 1500;
  const H = 850;

  // Build pegs once on mount
  useEffect(() => {
    pegsRef.current = buildPegs(W, H);
  }, []);

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#080b16";
    ctx.fillRect(0, 0, W, H);

    // Bucket grid lines
    const bucketW = W / 12;
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(i * bucketW, H * 0.78);
      ctx.lineTo(i * bucketW, H);
      ctx.strokeStyle = "rgba(212,175,55,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Buckets
    for (let i = 0; i < 12; i++) {
      const x = i * bucketW;
      const p = PRIZES[i];
      const isHighlight = highlight === i;

      // bucket fill
      if (isHighlight) {
        const m = p ? PRIZE_META[p] : null;
        const grad = ctx.createLinearGradient(x, H * 0.78, x, H);
        grad.addColorStop(0, m ? m.color + "55" : "rgba(212,175,55,0.25)");
        grad.addColorStop(1, m ? m.color + "18" : "rgba(212,175,55,0.06)");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = p
          ? PRIZE_META[p].color + "12"
          : "rgba(255,255,255,0.02)";
      }
      ctx.fillRect(x, H * 0.78, bucketW, H * 0.22);

      // emoji
      ctx.font = `${bucketW * 0.52}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = p ? (isHighlight ? 1 : 0.65) : 0.12;
      ctx.fillText(p ? (p === 'pochette' && isAdulteRef.current ? "🥃" : p === 'bonbons' && isAdulteRef.current ? "🥃" : p === 'barbapapa' && isAdulteRef.current ? "🍭" : PRIZE_META[p].emoji) : "•", x + bucketW / 2, H * 0.9);
      ctx.globalAlpha = 1;
    }

    // Pegs
    for (const peg of pegsRef.current) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_R, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, PEG_R);
      grad.addColorStop(0, "#f5d485");
      grad.addColorStop(1, "#8a6000");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Ball
    const ball = ballRef.current;
    if (ball && !ball.done) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_R);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#e8c86a");
      grad.addColorStop(1, "#7a5000");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(212,175,55,0.7)";
      ctx.shadowBlur  = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [highlight]);

  // ── Physics loop ─────────────────────────────────────────────────────────────
  const tick = useCallback((ts: number) => {
    const dt = Math.min(ts - lastRef.current, 32);
    lastRef.current = ts;

    const ball = ballRef.current;
    if (!ball || ball.done) { draw(); return; }

    const steps = 3;
    const dts   = dt / 1000 / steps;

    for (let s = 0; s < steps; s++) {
      ball.vy += GRAVITY;
      ball.x  += ball.vx * dts * FPS;
      ball.y  += ball.vy * dts * FPS;

      // Wall bounce
      if (ball.x - BALL_R < 0)       { ball.x = BALL_R;     ball.vx =  Math.abs(ball.vx) * BOUNCE; }
      if (ball.x + BALL_R > W)        { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx) * BOUNCE; }

      // Peg collision
      for (const peg of pegsRef.current) {
        const dx  = ball.x - peg.x;
        const dy  = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const min  = BALL_R + PEG_R;
        if (dist < min && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          ball.x = peg.x + nx * (min + 0.5);
          ball.y = peg.y + ny * (min + 0.5);
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * BOUNCE + (Math.random() - 0.5) * 1.2;
          ball.vy = (ball.vy - 2 * dot * ny) * BOUNCE;
        }
      }

      // Landed in bucket zone
      if (ball.y + BALL_R >= H * 0.78) {
        const bucketW = W / 12;
        const idx     = Math.min(11, Math.max(0, Math.floor(ball.x / bucketW)));
        ball.done     = true;
        ball.bucket   = idx;
        ball.y        = H * 0.78 - BALL_R;

        setHighlight(idx);
        const won = PRIZES[idx];
        setPrize(won);
        setPhase(won ? "won" : "lost");
        if (won) setShowWin(true);
        setStats(st => ({ drops: st.drops + 1, wins: st.wins + (won ? 1 : 0) }));
        break;
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(tick);
  }, [draw]);

  // Start/stop loop
  useEffect(() => {
    if (phase === "dropping") {
      lastRef.current = performance.now();
      rafRef.current  = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      draw();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, tick, draw]);

  // Redraw on highlight change
  useEffect(() => { draw(); }, [highlight, draw]);

  const handleDrop = () => {
    if (phase === "dropping") return;
    setHighlight(null);
    setPrize(null);
    setPhase("dropping");
    
    // Every 10th drop, force ball towards pochette surprise (buckets 1 or 9)
    const nextDropCount = stats.drops + 1;
    let startX = W / 2 + (Math.random() - 0.5) * 30;
    let startVx = (Math.random() - 0.5) * 1.5;
    
    if (nextDropCount % 10 === 0) {
      // Force towards bucket 9 (right side) for pochette
      const bucketW = W / 12;
      const targetX = 9.5 * bucketW;
      startX = targetX + (Math.random() - 0.5) * 40;
      startVx = 1.0 + Math.random() * 0.5; // Bias right
    }
    
    ballRef.current = { x: startX, y: 10, vx: startVx, vy: 0, done: false, bucket: null };
  };

  const isDropping = phase === "dropping";

  return (
    <div className="h-dvh bg-plinko text-white flex flex-col overflow-hidden">

      {/* Win overlay */}
      {prize && (
        <WinOverlay
          show={showWin}
          emoji={prize === 'pochette' && isAdulte ? "🥃" : prize === 'bonbons' && isAdulte ? "🥃" : prize === 'barbapapa' && isAdulte ? "🍭" : PRIZE_META[prize].emoji}
          label={prize === 'pochette' && isAdulte ? "Tournée de Shooters" : prize === 'bonbons' && isAdulte ? "1 Shooter" : prize === 'barbapapa' && isAdulte ? "Barbe à Papa" : PRIZE_META[prize].label}
          color={PRIZE_META[prize].color}
          glow={PRIZE_META[prize].glow}
          onClose={() => setShowWin(false)}
        />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-lg bg-white/15 flex justify-between items-center px-6 py-4 md:px-14">
        <Link to={isAdulte ? "/jeux/adultes" : "/jeux/enfants"} className="font-heading flex items-center gap-3 text-white hover:text-purple-200 transition-colors text-xs tracking-[0.25em] uppercase drop-shadow-md">
          <ArrowLeft size={16} strokeWidth={2} />
          Retour
        </Link>
        <div className="font-display text-xl text-white flex items-center gap-2 drop-shadow-md">
          <Crown size={18} />
          L.J.D.C
        </div>
      </nav>

      <main className="flex-1 min-h-0 flex flex-col items-center overflow-hidden py-3 px-4 gap-2">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-1">
          <div className="flex items-center justify-center gap-3 mb-0.5">
            <div className="h-px w-8 bg-white/40" />
            <span className="text-lg">🪙</span>
            <div className="h-px w-8 bg-white/40" />
          </div>
          <h1 className="font-heading text-lg md:text-xl text-white drop-shadow-lg" style={{ fontWeight: 800, letterSpacing: "0.1em" }}>
            PLINKO
          </h1>
          <p className="font-heading text-[9px] tracking-[0.45em] uppercase mt-0 text-purple-200/80">
            Gramont Casino
          </p>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-8 font-heading text-[9px] tracking-widest uppercase">
          <span className="text-white/50">Lancers : <span className="text-white/90">{stats.drops}</span></span>
          <span className="text-white/50">Victoires : <span className="text-white/90">{stats.wins}</span></span>
        </div>

        {/* Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-h-0 relative w-full max-w-none flex flex-col"
        >
          {/* Win glow */}
          <AnimatePresence>
            {phase === "won" && prize && (
              <motion.div
                key="glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: `0 0 80px ${PRIZE_META[prize].glow}, 0 0 160px ${PRIZE_META[prize].glow}`,
                  zIndex: -1,
                }}
              />
            )}
          </AnimatePresence>

          <div
            className="flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(175deg, #10152a, #090c18)",
              border: "1.5px solid rgba(212,175,55,0.3)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212,175,55,0.1)",
            }}
          >
            {/* Top LED strip */}
            <div className="flex justify-between items-center px-3 py-1" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.025)" }}>
              {[...Array(11)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 6, height: 6, borderRadius: "50%" }}
                  animate={isDropping
                    ? { backgroundColor: ["#d4af37","#c41e3a","#d4af37"], boxShadow: ["0 0 5px rgba(212,175,55,0.7)","0 0 5px rgba(196,30,58,0.7)","0 0 5px rgba(212,175,55,0.7)"] }
                    : { backgroundColor: "#d4af37", boxShadow: "0 0 3px rgba(212,175,55,0.4)" }}
                  transition={{ duration: 0.3, repeat: isDropping ? Infinity : 0, delay: i * 0.05 }}
                />
              ))}
            </div>

            <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", display: "block" }}
              />
            </div>

            {/* Result banner */}
            <div className="px-2 flex items-center justify-center" style={{ minHeight: 30 }}>
              <AnimatePresence mode="wait">
                {phase === "won" && prize && (
                  <motion.div
                    key="won"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-1 px-4 rounded"
                    style={{
                      background: `${PRIZE_META[prize].color}14`,
                      border: `1px solid ${PRIZE_META[prize].color}40`,
                    }}
                  >
                    <p className="font-heading text-[8px] tracking-[0.35em] uppercase mb-0.5" style={{ color: PRIZE_META[prize].color }}>
                      ✨ Félicitations !
                    </p>
                    <p className="font-heading text-sm" style={{ color: "#ffffff", fontWeight: 700 }}>
                      {prize === 'bonbons' && isAdulte ? "🥃" : prize === 'pochette' && isAdulte ? "🥃" : prize === 'barbapapa' && isAdulte ? "🍭" : PRIZE_META[prize].emoji}{" "}
                      {prize === 'bonbons' && isAdulte ? "1 Shooter" : prize === 'pochette' && isAdulte ? "Tournée de Shooters" : prize === 'barbapapa' && isAdulte ? "Barbe à Papa" : PRIZE_META[prize].label}
                    </p>
                  </motion.div>
                )}
                {phase === "lost" && (
                  <motion.div key="lost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="font-heading text-[8px] tracking-[0.3em] text-white/40 uppercase">
                      Pas de chance… Réessayez !
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Drop button */}
            <div className="px-2 pb-1">
              <motion.button
                onClick={handleDrop}
                disabled={isDropping}
                whileTap={!isDropping ? { scale: 0.97 } : {}}
                className="btn-gold w-full py-2 rounded text-xs tracking-[0.15em] font-heading disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDropping ? (
                  <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 0.55, repeat: Infinity }}>
                    ⏳ En cours...
                  </motion.span>
                ) : "🪙 LÂCHER LA BILLE !"}
              </motion.button>
            </div>

            {/* Paytable */}
            <div
              className="grid grid-cols-3 gap-1 px-2 py-1"
              style={{ borderTop: "1px solid rgba(212,175,55,0.15)", background: "rgba(0,0,0,0.2)" }}
            >
{(Object.entries(
                isAdulte
                  ? { ...PRIZE_META, bonbons: { ...PRIZE_META.bonbons, emoji: "🥃", label: "1 Shooter" }, barbapapa: { ...PRIZE_META.barbapapa, emoji: "🍭", label: "Barbe à Papa" }, pochette: { ...PRIZE_META.pochette, emoji: "🥃", label: "Tournée de Shooters" } }
                  : PRIZE_META
                            ) as [keyof typeof PRIZE_META, typeof PRIZE_META[keyof typeof PRIZE_META]][]).map(([id, p]) => {
                const count = PRIZES.filter(x => x === id).length;
                return (
                  <div key={id} className="text-center">
                    <p className="font-heading text-[7px] tracking-[0.2em] uppercase mb-0.5" style={{ color: p.color }}>
                      ×{count} case{count > 1 ? "s" : ""}
                    </p>
                    <p className="text-lg leading-none mb-0.5">{p.emoji}</p>
                    <p className="font-heading text-[6px] tracking-wide text-white/40 uppercase leading-tight">{p.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Bottom LED strip */}
            <div className="flex justify-between items-center px-3 py-1" style={{ borderTop: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.025)" }}>
              {[...Array(11)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 6, height: 6, borderRadius: "50%" }}
                  animate={isDropping
                    ? { backgroundColor: ["#c41e3a","#d4af37","#c41e3a"], boxShadow: ["0 0 5px rgba(196,30,58,0.7)","0 0 5px rgba(212,175,55,0.7)","0 0 5px rgba(196,30,58,0.7)"] }
                    : { backgroundColor: "#d4af37", boxShadow: "0 0 3px rgba(212,175,55,0.35)" }}
                  transition={{ duration: 0.3, repeat: isDropping ? Infinity : 0, delay: (10 - i) * 0.05 }}
                />
              ))}
            </div>
          </div>

          <p className="hidden lg:block text-center font-heading text-[7px] tracking-[0.4em] text-white/25 uppercase mt-0">
            5 cases gagnantes sur 12 · Bowling de Gramont
          </p>
        </motion.div>
      </main>
    </div>
  );
}
