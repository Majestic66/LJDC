import { useState, useCallback, FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown, RefreshCw } from "lucide-react";
import WinOverlay from "../components/WinOverlay";

// ─── Types & prize config ─────────────────────────────────────────────────────
type PrizeId = "bonbons" | "barbapapa" | "pochette" | null;

const PRIZE_META = {
  bonbons:   { emoji: "🍬", label: "Assiette de Bonbons",      color: "#d4af37", glow: "rgba(212,175,55,0.6)",  short: "Bonbons"      },
  barbapapa: { emoji: "🎫", label: "Goodies", color: "#c8a8ff", glow: "rgba(180,130,255,0.55)", short: "Jeton"         },
  pochette:  { emoji: "🎁", label: "Pochette Surprise",         color: "#c41e3a", glow: "rgba(196,30,58,0.6)",   short: "Surprise"      },
} as const;

const TOTAL = 15;
// Template: 2 bonbons, 2 barbapapa, 1 pochette, 10 null
const PRIZE_POOL: PrizeId[] = [
  "bonbons", "bonbons",
  "barbapapa", "barbapapa",
  "pochette",
  null, null, null, null, null,
  null, null, null, null, null,
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Box visual ──────────────────────────────────────────────────────────────
interface BoxProps {
  index: number;
  prize: PrizeId;
  state: "closed" | "opening" | "open";
  onClick: () => void;
  disabled: boolean;
  isAdulte: boolean;
}

const BOX_COLORS = [
  "#c41e3a", "#d4af37", "#6b46c1", "#0d9488", "#c2410c",
  "#1d4ed8", "#be185d", "#15803d", "#b45309", "#0369a1",
  "#7c3aed", "#b91c1c", "#0f766e", "#a16207", "#4338ca",
];

const Box: FC<BoxProps> = ({ index, prize, state, onClick, disabled, isAdulte }) => {
  const base  = BOX_COLORS[index % BOX_COLORS.length];
  const isOpen = state === "open" || state === "opening";
  const meta  = prize
    ? (prize === 'pochette' && isAdulte
      ? { ...PRIZE_META.pochette, label: "Tournée de Shooters", emoji: "🥃", short: "Shooter" }
      : prize === 'bonbons' && isAdulte
      ? { ...PRIZE_META.bonbons, label: "1 Shooter", emoji: "🥃", short: "Shooter" }
      : prize === 'barbapapa' && isAdulte
      ? { ...PRIZE_META.barbapapa, label: "Barbe à Papa", emoji: "🍭", short: "Barbe à Papa" }
      : PRIZE_META[prize])
    : null;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isOpen}
      whileHover={!disabled && !isOpen ? { scale: 1.07, y: -4 } : {}}
      whileTap={!disabled && !isOpen ? { scale: 0.96 } : {}}
      className="relative flex flex-col items-center justify-center rounded-lg select-none"
      style={{
        aspectRatio: "2.2",
        background: isOpen
          ? "linear-gradient(145deg, #0d1020, #090c18)"
          : `linear-gradient(145deg, ${base}dd, ${base}88)`,
        border: isOpen
          ? `1.5px solid ${meta ? meta.color + "60" : "rgba(255,255,255,0.08)"}`
          : `1.5px solid ${base}cc`,
        boxShadow: isOpen
          ? meta ? `0 0 18px ${meta.glow}` : "none"
          : `0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`,
        cursor: disabled || isOpen ? "default" : "pointer",
        transition: "background 0.3s, border 0.3s, box-shadow 0.3s",
        minWidth: 0,
      }}
      layout
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* ── Closed lid ── */
          <motion.div
            key="closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.18 } }}
            className="flex flex-col items-center gap-0.5 pointer-events-none w-full h-full justify-center"
          >
            {/* Lid */}
            <div
              className="absolute top-0 left-0 right-0 rounded-t-lg"
              style={{
                height: "28%",
                background: `linear-gradient(135deg, ${base}ff, ${base}aa)`,
                borderBottom: `2px solid rgba(255,255,255,0.25)`,
              }}
            />
            {/* Ribbon vertical */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[14%]"
              style={{ background: "rgba(255,255,255,0.2)" }} />
            {/* Ribbon horizontal */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[14%]"
              style={{ background: "rgba(255,255,255,0.2)" }} />
            {/* Bow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-white/80"
              style={{ fontSize: "clamp(10px, 2vw, 16px)", lineHeight: 1 }}>
              🎀
            </div>
            {/* Number */}
            <span
              className="relative z-10 font-heading"
              style={{
                fontSize: "clamp(10px,2.5vw,18px)", fontWeight: 800,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              {index + 1}
            </span>
          </motion.div>
        ) : (
          /* ── Opened ── */
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.55, duration: 0.45 }}
            className="flex flex-col items-center justify-center gap-0.5 pointer-events-none"
          >
            {meta ? (
              <>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.4, repeat: 2 }}
                  style={{ fontSize: "clamp(18px, 4vw, 36px)", lineHeight: 1 }}
                >
                  {meta.emoji}
                </motion.span>
                <span
                  className="font-heading text-center leading-tight"
                  style={{
                    fontSize: "clamp(5px, 1.2vw, 9px)",
                    color: meta.color,
                    letterSpacing: "0.05em",
                  }}
                >
                  {meta.short}
                </span>
              </>
            ) : (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ fontSize: "clamp(14px, 3vw, 26px)", lineHeight: 1 }}
              >
                💨
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function BoitesCarlos() {
  const [prizes,   setPrizes]   = useState<PrizeId[]>(() => shuffle(PRIZE_POOL));
  const [states,   setStates]   = useState<Array<"closed" | "opening" | "open">>(
    () => Array(TOTAL).fill("closed")
  );
  const [openCount, setOpenCount] = useState(0);
  const [showWin,  setShowWin] = useState(false);
  const [wonPrize, setWonPrize] = useState<Exclude<PrizeId, null> | null>(null);
  const [stats,    setStats]   = useState({ plays: 0, wins: 0 });
  const [gameOver, setGameOver] = useState(false);

  const [searchParams] = useSearchParams();
  const isAdulte = searchParams.get('adulte') === '1';

  const handleBox = useCallback((i: number) => {
    if (states[i] !== "closed" || gameOver) return;

    // Opening animation
    setStates(prev => { const n = [...prev]; n[i] = "opening"; return n; });
    setTimeout(() => {
      setStates(prev => { const n = [...prev]; n[i] = "open"; return n; });
    }, 80);

    const prize = prizes[i];
    const newCount = openCount + 1;
    setOpenCount(newCount);

    if (prize) {
      // Won — show overlay after a short delay so box animation plays first
      const p = prize as Exclude<PrizeId, null>;
      setWonPrize(p);
      setTimeout(() => setShowWin(true), 500);
      setStats(s => ({ plays: s.plays + 1, wins: s.wins + 1 }));
    } else if (newCount >= TOTAL) {
      // All boxes opened
      setStats(s => ({ plays: s.plays + 1, wins: s.wins }));
      setGameOver(true);
    }
  }, [states, prizes, openCount, gameOver]);

  const handleReset = () => {
    setPrizes(shuffle(PRIZE_POOL));
    setStates(Array(TOTAL).fill("closed"));
    setOpenCount(0);
    setShowWin(false);
    setWonPrize(null);
    setGameOver(false);
    if (!wonPrize) setStats(s => ({ plays: s.plays + 1, wins: s.wins }));
  };

  const remaining = TOTAL - openCount;
  const allEmpty  = gameOver && !wonPrize;

  return (
    <div className="h-dvh bg-boites text-white flex flex-col overflow-hidden">

      {/* Win overlay */}
      {wonPrize && (
        <WinOverlay
          show={showWin}
          emoji={wonPrize === 'pochette' && isAdulte ? "🥃" : wonPrize === 'bonbons' && isAdulte ? "🥃" : wonPrize === 'barbapapa' && isAdulte ? "🍭" : PRIZE_META[wonPrize].emoji}
          label={wonPrize === 'pochette' && isAdulte ? "Tournée de Shooters" : wonPrize === 'bonbons' && isAdulte ? "1 Shooter" : wonPrize === 'barbapapa' && isAdulte ? "Barbe à Papa" : PRIZE_META[wonPrize].label}
          color={PRIZE_META[wonPrize].color}
          glow={PRIZE_META[wonPrize].glow}
          onClose={() => setShowWin(false)}
        />
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-lg bg-white/15 flex justify-between items-center px-6 py-4 md:px-14">
        <Link to={isAdulte ? "/jeux/adultes" : "/jeux/enfants"} className="font-heading flex items-center gap-3 text-white hover:text-pink-200 transition-colors text-xs tracking-[0.25em] uppercase drop-shadow-md">
          <ArrowLeft size={16} strokeWidth={2} />
          Retour
        </Link>
        <div className="font-display text-xl text-white flex items-center gap-2 drop-shadow-md">
          <Crown size={18} />
          L.J.D.C
        </div>
      </nav>

      <main className="flex-1 min-h-0 flex flex-col items-center overflow-hidden py-1 px-4 gap-0.5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-0">
          <div className="flex items-center justify-center gap-2 mb-0">
            <div className="h-px w-4 bg-white/40" />
            <span className="text-sm">🎁</span>
            <div className="h-px w-4 bg-white/40" />
          </div>
          <h1 className="font-heading text-sm md:text-base text-white drop-shadow-lg" style={{ fontWeight: 800, letterSpacing: "0.08em" }}>
            LES BOÎTES DE CARLOS
          </h1>
          <p className="font-heading text-[7px] tracking-[0.45em] uppercase mt-0 text-pink-200/80">
            Gramont Casino
          </p>
        </motion.div>

        {/* Stats & counter */}
        <div className="flex gap-4 font-heading text-[7px] tracking-widest uppercase py-0">
          <span className="text-white/50">Parties : <span className="text-white/90">{stats.plays}</span></span>
          <span className="text-white/50">Victoires : <span className="text-white/90">{stats.wins}</span></span>
        </div>

        {/* Cabinet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-h-0 w-full max-w-none flex flex-col"
        >
          <div
            className="flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(175deg, #10152a, #090c18)",
              border: "1px solid rgba(212,175,55,0.3)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212,175,55,0.1)",
            }}
          >
            {/* LED strip top */}
            <div className="flex justify-between items-center px-2 py-0" style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.025)" }}>
              {[...Array(11)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 5, height: 5, borderRadius: "50%" }}
                  animate={!gameOver
                    ? { backgroundColor: ["#d4af37","#c41e3a","#d4af37"], boxShadow: ["0 0 5px rgba(212,175,55,0.7)","0 0 5px rgba(196,30,58,0.7)","0 0 5px rgba(212,175,55,0.7)"] }
                    : { backgroundColor: "#d4af37", boxShadow: "0 0 3px rgba(212,175,55,0.4)" }}
                  transition={{ duration: 0.6, repeat: !gameOver ? Infinity : 0, delay: i * 0.07 }}
                />
              ))}
            </div>

            {/* Sub-header */}
            <div className="px-1 pt-0 pb-0 flex items-center justify-between" style={{ minHeight: "12px" }}>
              <span className="font-heading text-[7px] tracking-[0.35em] uppercase text-amber-300/60">
                Choisissez une boîte
              </span>
              <AnimatePresence mode="wait">
                {!gameOver ? (
                  <motion.span
                    key="remaining"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-heading text-[7px] tracking-widest"
                    style={{ color: remaining <= 3 ? "#c41e3a" : "#d4af37", opacity: 0.7 }}
                  >
                    {remaining} boîte{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}
                  </motion.span>
                ) : (
                  <motion.span
                    key="gameover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-heading text-[7px] tracking-widest text-white/40 uppercase"
                  >
                    Partie terminée
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Grid of boxes */}
            <div className="flex-1 min-h-0 px-0.5 pb-0.5 flex flex-col justify-center">
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
              >
                {prizes.map((prize, i) => (
                  // @ts-ignore
                  <Box
                    key={i}
                    index={i}
                    prize={prize}
                    state={states[i]}
                    onClick={() => handleBox(i)}
                    disabled={gameOver && states[i] === "closed"}
                    isAdulte={isAdulte}
                  />
                ))}
              </div>
            </div>

            {/* Result banner */}
            <div className="px-1 flex items-center justify-center" style={{ minHeight: 16 }}>
              <AnimatePresence mode="wait">
                {allEmpty && (
                  <motion.p
                    key="noluck"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-heading text-[7px] tracking-[0.3em] text-white/40 uppercase"
                  >
                    Toutes les boîtes étaient vides… Réessayez !
                  </motion.p>
                )}
                {gameOver && wonPrize && !showWin && (
                  <motion.div
                    key="win-small"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-0.5 px-3 rounded"
                    style={{
                      background: `${PRIZE_META[wonPrize].color}12`,
                      border: `1px solid ${PRIZE_META[wonPrize].color}40`,
                    }}
                  >
                    <p className="font-heading text-[7px] tracking-[0.35em] uppercase" style={{ color: PRIZE_META[wonPrize].color }}>
                      {wonPrize === 'bonbons' && isAdulte ? "🥃" : wonPrize === 'pochette' && isAdulte ? "🥃" : wonPrize === 'barbapapa' && isAdulte ? "🍭" : PRIZE_META[wonPrize].emoji}{" "}
                      {wonPrize === 'bonbons' && isAdulte ? "1 Shooter" : wonPrize === 'pochette' && isAdulte ? "Tournée de Shooters" : wonPrize === 'barbapapa' && isAdulte ? "Barbe à Papa" : PRIZE_META[wonPrize].label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset button */}
            <div className="px-1 pb-0">
              <motion.button
                onClick={handleReset}
                whileTap={{ scale: 0.97 }}
                className="btn-gold w-full py-1 rounded text-[9px] tracking-[0.15em] font-heading flex items-center justify-center gap-0.5"
              >
                <RefreshCw size={9} />
                NOUVELLE PARTIE
              </motion.button>
            </div>

            {/* Paytable */}
            <div
              className="grid grid-cols-3 gap-0.5 px-1 py-0"
              style={{ borderTop: "1px solid rgba(212,175,55,0.15)", background: "rgba(0,0,0,0.2)" }}
            >
{(Object.entries(
                isAdulte
                  ? { ...PRIZE_META, bonbons: { ...PRIZE_META.bonbons, emoji: "🥃", label: "1 Shooter", short: "Shooter" }, barbapapa: { ...PRIZE_META.barbapapa, emoji: "🍭", label: "Barbe à Papa", short: "Barbe à Papa" }, pochette: { ...PRIZE_META.pochette, emoji: "🥃", label: "Tournée de Shooters", short: "Shooter" } }
                  : PRIZE_META
              ) as [keyof typeof PRIZE_META, typeof PRIZE_META[keyof typeof PRIZE_META]][]).map(([id, p]) => {
                const count = PRIZE_POOL.filter(x => x === id).length;
                return (
                  <div key={id} className="text-center">
                    <p className="font-heading text-[6px] tracking-[0.2em] uppercase mb-0" style={{ color: p.color }}>
                      ×{count} boîte{count > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm leading-none mb-0">{p.emoji}</p>
                    <p className="font-heading text-[5px] tracking-wide text-white/40 uppercase leading-tight">{p.label}</p>
                  </div>
                );
              })}
            </div>

            {/* LED strip bottom */}
            <div className="flex justify-between items-center px-2 py-0" style={{ borderTop: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.025)" }}>
              {[...Array(11)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ width: 5, height: 5, borderRadius: "50%" }}
                  animate={!gameOver
                    ? { backgroundColor: ["#c41e3a","#d4af37","#c41e3a"], boxShadow: ["0 0 5px rgba(196,30,58,0.7)","0 0 5px rgba(212,175,55,0.7)","0 0 5px rgba(196,30,58,0.7)"] }
                    : { backgroundColor: "#d4af37", boxShadow: "0 0 3px rgba(212,175,55,0.35)" }}
                  transition={{ duration: 0.6, repeat: !gameOver ? Infinity : 0, delay: (10 - i) * 0.07 }}
                />
              ))}
            </div>
          </div>

          <p className="hidden lg:block text-center font-heading text-[7px] tracking-[0.4em] text-white/25 uppercase mt-0">
            5 boîtes gagnantes sur 15 · Bowling de Gramont
          </p>
        </motion.div>
      </main>
    </div>
  );
}
