import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import WinOverlay from "../components/WinOverlay";

type SymbolId = "boule" | "quille" | "strike";

const PRIZES: Record<SymbolId, { name: string; emoji: string; color: string; glow: string }> = {
  boule:  { name: "Assiette de Bonbons",              emoji: "🍬", color: "#d4af37", glow: "rgba(212,175,55,0.5)"   },
  quille: { name: "Jeton Machine à Cadeaux",           emoji: "🎫", color: "#c8deff", glow: "rgba(180,210,255,0.45)" },
  strike: { name: "Pochette Surprise",                emoji: "🎁", color: "#c41e3a", glow: "rgba(196,30,58,0.55)"   },
};

const ALL: SymbolId[] = ["boule", "quille", "strike"];

function getResult(): SymbolId[] {
  if (Math.random() < 0.25) {
    const w = ALL[Math.floor(Math.random() * 3)];
    return [w, w, w];
  }
  let r: SymbolId[];
  do {
    r = [0, 1, 2].map(() => ALL[Math.floor(Math.random() * 3)]) as SymbolId[];
  } while (r[0] === r[1] && r[1] === r[2]);
  return r;
}

/* ── Symbol visuals ──────────────────────────────────── */

function BowlingBall() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 62, height: 62, borderRadius: "50%",
        background: "radial-gradient(circle at 33% 28%, #6b3510 0%, #2a0c00 60%, #140600 100%)",
        boxShadow: "inset -5px -5px 14px rgba(0,0,0,0.85), inset 3px 3px 8px rgba(255,140,60,0.08), 0 6px 22px rgba(0,0,0,0.6)",
      }}
    >
      {/* Shine */}
      <div style={{ position: "absolute", top: "10%", left: "13%", width: "27%", height: "22%",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.28), transparent)" }} />
      {/* Finger holes */}
      <div style={{ position: "absolute", top: "24%", left: "26%", width: "15%", height: "20%",
        borderRadius: "50%", background: "rgba(0,0,0,0.78)" }} />
      <div style={{ position: "absolute", top: "16%", left: "46%", width: "15%", height: "20%",
        borderRadius: "50%", background: "rgba(0,0,0,0.78)" }} />
      <div style={{ position: "absolute", top: "43%", left: "52%", width: "14%", height: "18%",
        borderRadius: "50%", background: "rgba(0,0,0,0.78)" }} />
    </div>
  );
}

function BowlingPin() {
  return (
    <div className="flex flex-col items-center mx-auto" style={{ width: 44 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%",
        background: "linear-gradient(140deg, #ffffff 30%, #aaaaaa)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(0,0,0,0.12)" }} />
      {/* Neck */}
      <div style={{ width: 10, height: 6, background: "linear-gradient(to bottom, #c0c0c0, #e8e8e8)" }} />
      {/* Red stripe */}
      <div style={{ width: 18, height: 5, background: "#c41e3a", borderRadius: 2,
        boxShadow: "0 1px 4px rgba(196,30,58,0.4)" }} />
      {/* Waist */}
      <div style={{ width: 10, height: 4, background: "linear-gradient(to bottom, #e8e8e8, #f8f8f8)" }} />
      {/* Body */}
      <div style={{ width: 38, height: 34,
        background: "linear-gradient(140deg, #ffffff 30%, #cccccc)",
        borderRadius: "45% 45% 36% 36% / 28% 28% 52% 52%",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function StrikeIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5 mx-auto">
      <span className="select-none leading-none" style={{
        fontSize: 44,
        filter: "drop-shadow(0 0 10px #c41e3a) drop-shadow(0 0 22px rgba(196,30,58,0.45))",
      }}>⚡</span>
      <span className="font-heading" style={{
        fontSize: 9, letterSpacing: "0.35em", color: "#c41e3a",
        border: "1px solid rgba(196,30,58,0.55)", padding: "2px 6px",
      }}>STRIKE</span>
    </div>
  );
}

function SymbolDisplay({ id }: { id: SymbolId }) {
  if (id === "boule")  return <BowlingBall />;
  if (id === "quille") return <BowlingPin />;
  return <StrikeIcon />;
}

/* ── Main Component ──────────────────────────────────── */

export default function BowlingSlots() {
  const [reels,   setReels]   = useState<SymbolId[]>(["boule", "quille", "strike"]);
  const [phase,   setPhase]   = useState<"idle" | "spinning" | "won" | "lost">("idle");
  const [running, setRunning] = useState([false, false, false]);
  const [winner,  setWinner]  = useState<SymbolId | null>(null);
  const [stats,   setStats]   = useState({ spins: 0, wins: 0 });
  const [showWin, setShowWin] = useState(false);

  const iids = useRef<number[]>([]);
  const tids  = useRef<number[]>([]);

  const [searchParams] = useSearchParams();
  const isAdulte = searchParams.get('adulte') === '1';
  const prizes = isAdulte
    ? {
        ...PRIZES,
        boule:  { ...PRIZES.boule,  name: "1 Shooter",            emoji: "🥃" },
        quille: { ...PRIZES.quille, name: "Barbe à Papa",          emoji: "🍭" },
        strike: { ...PRIZES.strike, name: "Tournée de Shooters",  emoji: "🥃" },
      }
    : PRIZES;

  const handleSpin = () => {
    if (phase === "spinning") return;
    iids.current.forEach(clearInterval);
    tids.current.forEach(clearTimeout);
    iids.current = [];
    tids.current = [];

    setPhase("spinning");
    setWinner(null);
    setRunning([true, true, true]);

    const result = getResult();

    [0, 1, 2].forEach((i) => {
      let tick = Math.floor(Math.random() * 3);
      const iid = window.setInterval(() => {
        tick++;
        setReels((prev) => { const n = [...prev] as SymbolId[]; n[i] = ALL[tick % 3]; return n; });
      }, 85);
      iids.current.push(iid);

      const stopAt = 1100 + i * 660; // 1.1s  1.76s  2.42s
      const tid = window.setTimeout(() => {
        clearInterval(iid);
        setReels((prev) => { const n = [...prev] as SymbolId[]; n[i] = result[i]; return n; });
        setRunning((prev) => { const n = [...prev]; n[i] = false; return n; });
        if (i === 2) {
          const won = result[0] === result[1] && result[1] === result[2];
          setWinner(won ? result[0] : null);
          setPhase(won ? "won" : "lost");
          if (won) setShowWin(true);
          setStats((s) => ({ spins: s.spins + 1, wins: s.wins + (won ? 1 : 0) }));
        }
      }, stopAt);
      tids.current.push(tid);
    });
  };

  const isSpinning = phase === "spinning";
  const isWon = phase === "won";

  return (
    <div className="h-dvh bg-bowling text-white flex flex-col overflow-hidden">

      {/* Win overlay */}
      {winner && (
        <WinOverlay
          show={showWin}
          emoji={prizes[winner].emoji}
          label={prizes[winner].name}
          color={prizes[winner].color}
          glow={prizes[winner].glow}
          onClose={() => setShowWin(false)}
        />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-lg bg-white/15 flex justify-between items-center px-6 py-4 md:px-14">
        <Link
          to={isAdulte ? "/jeux/adultes" : "/jeux/enfants"}
          className="font-heading flex items-center gap-3 text-white hover:text-yellow-200 transition-colors text-xs tracking-[0.25em] uppercase drop-shadow-md"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Retour
        </Link>
        <div className="font-display text-xl text-white flex items-center gap-2 drop-shadow-md">
          <Crown size={18} />
          L.J.D.C
        </div>
      </nav>

      <main className="flex-1 min-h-0 flex flex-col items-center overflow-hidden py-6 px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-1"
        >
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="h-px w-10 bg-white/40" />
            <span className="text-lg">🎳</span>
            <div className="h-px w-10 bg-white/40" />
          </div>
          <h1
            className="font-heading text-xl md:text-2xl text-white drop-shadow-lg"
            style={{ fontWeight: 800, letterSpacing: "0.1em" }}
          >
            BOWLING SLOTS
          </h1>
          <p className="font-heading text-[10px] tracking-[0.45em] uppercase mt-1 text-yellow-200/80">
            Gramont Casino
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-8 mb-1 font-heading text-[10px] tracking-widest uppercase"
        >
          <span className="text-white/50">
            Parties : <span className="text-white/90">{stats.spins}</span>
          </span>
          <span className="text-white/50">
            Victoires : <span className="text-white/90">{stats.wins}</span>
          </span>
        </motion.div>

        {/* Cabinet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-h-0 relative w-full max-w-none flex flex-col"
        >
          {/* Glow behind cabinet on win */}
          <AnimatePresence>
            {isWon && winner && (
              <motion.div
                key="cabinet-glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: `0 0 90px ${prizes[winner].glow}, 0 0 180px ${prizes[winner].glow}`,
                  zIndex: -1,
                }}
              />
            )}
          </AnimatePresence>

          <div
            className="flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(175deg, #12162a 0%, #0a0c18 100%)",
              border: "1.5px solid rgba(212,175,55,0.35)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212,175,55,0.12)",
            }}
          >
            {/* Top decorative lights */}
            <div
              className="flex justify-between items-center px-8 py-1.5"
              style={{
                borderBottom: "1px solid rgba(212,175,55,0.18)",
                background: "rgba(212,175,55,0.03)",
              }}
            >
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 10, height: 10, borderRadius: "50%" }}
                  animate={
                    isSpinning
                      ? {
                          backgroundColor: ["#d4af37", "#c41e3a", "#d4af37"],
                          boxShadow: [
                            "0 0 6px rgba(212,175,55,0.7)",
                            "0 0 6px rgba(196,30,58,0.7)",
                            "0 0 6px rgba(212,175,55,0.7)",
                          ],
                        }
                      : { backgroundColor: "#d4af37", boxShadow: "0 0 4px rgba(212,175,55,0.4)" }
                  }
                  transition={{
                    duration: 0.35,
                    repeat: isSpinning ? Infinity : 0,
                    delay: i * 0.06,
                  }}
                />
              ))}
            </div>

            {/* Machine name */}
            <div className="text-center py-1">
              <span className="font-heading text-[10px] tracking-[0.4em] uppercase text-amber-300/60">
                BOWLING SLOTS GRAMONT
              </span>
            </div>

            {/* Reels */}
            <div className="flex-1 min-h-0 px-3 py-2">
              <div className="grid grid-cols-3 gap-2" style={{ height: "100%" }}>
                {reels.map((symbol, i) => (
                  <div key={i} className="flex flex-col items-center gap-1" style={{ minHeight: 0 }}>
                    {/* Reel label */}
                    <span className="font-heading text-[9px] tracking-[0.28em] uppercase" style={{
                      color: symbol === "boule" ? "#d4af37" : symbol === "quille" ? "#c8deff" : "#c41e3a",
                      opacity: 0.5,
                    }}>
                      {symbol === "boule" ? "Boule" : symbol === "quille" ? "Quille" : "Strike"}
                    </span>

                    {/* Reel window */}
                    <div
                      style={{
                        width: "100%", flex: "1 1 0", minHeight: 0,
                        borderRadius: 8,
                        background: "linear-gradient(160deg, #060810, #0b0e1c)",
                        border: `1.5px solid ${running[i] ? "rgba(212,175,55,0.55)" : "rgba(212,175,55,0.2)"}`,
                        boxShadow: running[i]
                          ? "inset 0 0 20px rgba(212,175,55,0.07), 0 0 15px rgba(212,175,55,0.12)"
                          : "inset 0 4px 16px rgba(0,0,0,0.65)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative", overflow: "hidden",
                        transition: "border-color 0.25s, box-shadow 0.25s",
                      }}
                    >
                      {/* Top / bottom fade */}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to bottom, rgba(6,8,16,0.88) 0%, transparent 28%, transparent 72%, rgba(6,8,16,0.88) 100%)",
                        pointerEvents: "none", zIndex: 1,
                      }} />

                      {/* Symbol */}
                      <motion.div
                        style={{ position: "relative", zIndex: 2 }}
                        animate={
                          running[i]
                            ? { y: [-6, 6, -6], opacity: [1, 0.6, 1] }
                            : { y: 0, opacity: 1 }
                        }
                        transition={
                          running[i]
                            ? { duration: 0.18, repeat: Infinity, ease: "linear" }
                            : { duration: 0.22, ease: "easeOut" }
                        }
                      >
                        <SymbolDisplay id={symbol} />
                      </motion.div>
                    </div>

                    {/* Win indicator dot */}
                    <motion.div
                      animate={
                        !running[i] && isWon && winner
                          ? {
                              backgroundColor: PRIZES[winner].color,
                              boxShadow: `0 0 10px ${PRIZES[winner].glow}`,
                              scale: [1, 1.4, 1],
                            }
                          : { backgroundColor: "transparent", boxShadow: "none", scale: 1 }
                      }
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      style={{
                        width: 8, height: 8, borderRadius: "50%",
                        border: "1px solid rgba(212,175,55,0.22)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Result banner */}
            <div
              className="px-3 flex items-center justify-center"
              style={{ minHeight: 44 }}
            >
              <AnimatePresence mode="wait">
                {isWon && winner && (
                  <motion.div
                    key="won"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="text-center py-2 px-5 rounded"
                    style={{
                      background: `rgba(${winner === "strike" ? "196,30,58" : winner === "boule" ? "212,175,55" : "100,160,255"},0.08)`,
                      border: `1px solid ${prizes[winner].color}38`,
                    }}
                  >
                    <p
                      className="font-heading text-[9px] tracking-[0.35em] uppercase mb-1"
                      style={{ color: prizes[winner].color }}
                    >
                      ✨ Félicitations !
                    </p>
                    <p className="font-heading text-base" style={{ color: "#ffffff", fontWeight: 700 }}>
                      {prizes[winner].emoji} {prizes[winner].name}
                    </p>
                  </motion.div>
                )}
                {phase === "lost" && (
                  <motion.div
                    key="lost"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="font-heading text-[9px] tracking-[0.3em] text-white/40 uppercase">
                      Pas de chance... Réessayez !
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spin button */}
            <div className="px-3 pb-2">
              <motion.button
                onClick={handleSpin}
                disabled={isSpinning}
                whileTap={!isSpinning ? { scale: 0.97 } : {}}
                className="btn-gold w-full py-2.5 rounded text-sm tracking-[0.15em] font-heading disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSpinning ? (
                  <motion.span
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 0.55, repeat: Infinity }}
                  >
                    ⏳ En cours...
                  </motion.span>
                ) : (
                  "🎳 LANCER !"
                )}
              </motion.button>
            </div>

            {/* Paytable */}
            <div
              className="grid grid-cols-3 gap-1.5 px-3 py-2"
              style={{
                borderTop: "1px solid rgba(212,175,55,0.18)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              {(Object.entries(prizes) as [SymbolId, (typeof PRIZES)[SymbolId]][]).map(([id, p]) => (
                <div key={id} className="text-center">
                  <p
                    className="font-heading text-[8px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: p.color }}
                  >
                    {id === "boule" ? "BOULE" : id === "quille" ? "QUILLE" : "STRIKE"} ×3
                  </p>
                  <p className="text-xl leading-none mb-1">{p.emoji}</p>
                  <p className="font-heading text-[7px] tracking-wide text-white/40 uppercase leading-tight">
                    {p.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom decorative lights */}
            <div
              className="flex justify-between items-center px-8 py-1.5"
              style={{
                borderTop: "1px solid rgba(212,175,55,0.18)",
                background: "rgba(212,175,55,0.03)",
              }}
            >
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 10, height: 10, borderRadius: "50%" }}
                  animate={
                    isSpinning
                      ? {
                          backgroundColor: ["#c41e3a", "#d4af37", "#c41e3a"],
                          boxShadow: [
                            "0 0 6px rgba(196,30,58,0.7)",
                            "0 0 6px rgba(212,175,55,0.7)",
                            "0 0 6px rgba(196,30,58,0.7)",
                          ],
                        }
                      : { backgroundColor: "#d4af37", boxShadow: "0 0 4px rgba(212,175,55,0.35)" }
                  }
                  transition={{
                    duration: 0.35,
                    repeat: isSpinning ? Infinity : 0,
                    delay: (8 - i) * 0.06,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Subtitle */}
          <p className="hidden md:block text-center font-heading text-[8px] tracking-[0.4em] text-white/30 uppercase mt-1">
            Chance de victoire : 25% · Bowling de Gramont
          </p>
        </motion.div>
      </main>
    </div>
  );
}
