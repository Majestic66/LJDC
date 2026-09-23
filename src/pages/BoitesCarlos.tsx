import { useState, useCallback, FC, CSSProperties } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

function shadeColor(hex: string, percent: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * percent)));
  return `rgb(${r}, ${g}, ${b})`;
}

const Box: FC<BoxProps> = ({ index, prize, state, onClick, disabled, isAdulte }) => {
  const base    = BOX_COLORS[index % BOX_COLORS.length];
  const light   = shadeColor(base, 32);
  const dark    = shadeColor(base, -38);
  const isOpen    = state === "open";
  const isOpening = state === "opening";
  const isClosed  = state === "closed";
  const meta  = prize
    ? (prize === 'pochette' && isAdulte
      ? { ...PRIZE_META.pochette, label: "Tournée de Shooters", emoji: "🥃", short: "Shooter" }
      : prize === 'bonbons' && isAdulte
      ? { ...PRIZE_META.bonbons, label: "1 Shooter", emoji: "🥃", short: "Shooter" }
      : prize === 'barbapapa' && isAdulte
      ? { ...PRIZE_META.barbapapa, label: "Barbe à Papa", emoji: "🍭", short: "Barbe à Papa" }
      : PRIZE_META[prize])
    : null;
  const revealed = isOpening || isOpen;
  const dimmed = disabled && isClosed;

  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      className="carlos-box"
      data-state={state}
      aria-label={`Boîte ${index + 1}${isOpen ? meta ? ': ' + meta.label : ': vide' : isOpening ? ' : ouverture' : ''}`}
      onClick={onClick}
      disabled={disabled || !isClosed}
      whileHover={!disabled && isClosed && !reduceMotion ? { y: -7 } : undefined}
      whileTap={!disabled && isClosed && !reduceMotion ? { scale: 0.96 } : undefined}
      style={{ '--box': base, '--light': light, '--dark': dark, opacity: dimmed ? 0.4 : 1 } as CSSProperties}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <span className="carlos-box-shadow" aria-hidden="true" />
      <span className="carlos-cube" aria-hidden="true">
        <span className="carlos-face carlos-back" />
        <span className="carlos-face carlos-floor" />
        <span className="carlos-face carlos-left" />
        <span className="carlos-face carlos-right" />
        <span className="carlos-face carlos-front">
          <span className="carlos-ribbon" />
          <span className="carlos-seal">{String(index + 1).padStart(2, '0')}</span>
        </span>
        <motion.span className="carlos-lid"
          animate={{ rotateX: revealed ? -112 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="carlos-lid-top"><span className="carlos-ribbon" /><span className="carlos-ribbon-cross" /></span>
          <span className="carlos-lid-edge" />
        </motion.span>
      </span>
      <AnimatePresence>
        {isOpen && (
          <motion.span className={`carlos-reveal ${meta ? 'carlos-reveal-win' : ''}`}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.12 }}
            aria-hidden="true"
          >
            <span className="carlos-prize-icon">{meta ? meta.emoji : '💨'}</span>
            <span>{meta ? meta.short : 'Vide'}</span>
          </motion.span>
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
    }, 620);

    const prize = prizes[i];
    const newCount = openCount + 1;
    setOpenCount(newCount);

    if (prize) {
      // Won — show overlay after a short delay so box animation plays first
      const p = prize as Exclude<PrizeId, null>;
      setWonPrize(p);
      setTimeout(() => setShowWin(true), 750);
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
    <div className="carlos-page">
      <style>{CARLOS_STYLES}</style>
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


      <nav className="carlos-nav">
        <Link to={isAdulte ? '/jeux/adultes' : '/jeux/enfants'}><ArrowLeft size={18} /> Retour aux jeux</Link>
        <span className="carlos-brand"><Crown size={21} /> L.J.D.C</span>
      </nav>
      <main className="carlos-main">
        <header className="carlos-header">
          <div><p className="carlos-eyebrow">GRAMONT CASINO</p><h1>Les boîtes de <span>Carlos</span></h1></div>
          <div className="carlos-stats"><span>Parties <strong>{stats.plays}</strong></span><span>Victoires <strong>{stats.wins}</strong></span></div>
        </header>
        <section className="carlos-cabinet" aria-label="Les quinze boîtes de Carlos">
          <div className="carlos-board-header"><h2>Choisissez une boîte</h2><span aria-live="polite" aria-atomic="true">{gameOver ? 'Partie terminée' : <><strong>{remaining}</strong> / 15 restantes</>}</span></div>
          <div className="carlos-grid">
            {prizes.map((prize, i) => <Box key={i} index={i} prize={prize} state={states[i]} onClick={() => handleBox(i)} disabled={gameOver && states[i] === 'closed'} isAdulte={isAdulte} />)}
          </div>
          {allEmpty && <p className="carlos-result" role="status">Toutes les boîtes étaient vides… Réessayez !</p>}
          {gameOver && wonPrize && !showWin && <p className="carlos-result" role="status">{wonPrize === 'pochette' && isAdulte ? 'Tournée de Shooters' : wonPrize === 'bonbons' && isAdulte ? '1 Shooter' : wonPrize === 'barbapapa' && isAdulte ? 'Barbe à Papa' : PRIZE_META[wonPrize].label}</p>}
          <div className="carlos-board-footer"><span>5 boîtes gagnantes sur 15</span><button type="button" onClick={handleReset}><RefreshCw size={16} /> Nouvelle partie</button></div>
        </section>
        <section className="carlos-prizes" aria-label="Les lots à gagner">
          {(Object.entries(isAdulte ? { ...PRIZE_META, bonbons: { ...PRIZE_META.bonbons, emoji: '🥃', label: '1 Shooter' }, barbapapa: { ...PRIZE_META.barbapapa, emoji: '🍭', label: 'Barbe à Papa' }, pochette: { ...PRIZE_META.pochette, emoji: '🥃', label: 'Tournée de Shooters' } } : PRIZE_META)).map(([id, p]) => <div className="carlos-prize" key={id}><span aria-hidden="true">{p.emoji}</span><div><p>{p.label}</p><small>×{PRIZE_POOL.filter(x => x === id).length} boîte{PRIZE_POOL.filter(x => x === id).length > 1 ? 's' : ''}</small></div></div>)}
        </section>
        <p className="carlos-location">Bowling de Gramont</p>
      </main>
    </div>
  );
}

const CARLOS_STYLES = `
.carlos-page{min-height:100dvh;color:#f4f2fa;background:radial-gradient(ellipse at 12% 0%,#252043 0%,transparent 48%),radial-gradient(ellipse at 95% 70%,#102b36 0%,transparent 45%),#090c16;font-family:Inter,system-ui,sans-serif;color-scheme:dark}
.carlos-page *{box-sizing:border-box}
.carlos-nav{max-width:1320px;margin:auto;min-height:76px;padding:18px 32px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ffffff12;gap:20px}
.carlos-nav a{display:flex;align-items:center;gap:10px;color:#c4c4d4;font-size:14px;text-decoration:none;transition:color .2s}
.carlos-nav a:hover{color:#f2d49a}.carlos-brand{display:flex;align-items:center;gap:10px;color:#f2d49a;font-weight:700;letter-spacing:.12em}
.carlos-main{max-width:1160px;margin:auto;padding:34px 32px 20px}.carlos-header{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:28px}.carlos-eyebrow{color:#bc9b64;font-size:12px;letter-spacing:.24em;margin:0 0 8px}.carlos-header h1{font-size:clamp(26px,3.5vw,42px);font-weight:650;letter-spacing:-.045em;line-height:1.15;margin:0}.carlos-header h1 span{color:#efd29c}.carlos-stats{display:flex;gap:24px;color:#9d9eb3;font-size:14px}.carlos-stats span{display:flex;flex-direction:column;gap:4px}.carlos-stats strong{font-size:24px;font-weight:500;color:#eeeaf7;font-variant-numeric:tabular-nums}
.carlos-cabinet{border:1px solid #ffffff16;border-radius:24px;background:linear-gradient(145deg,#ffffff05,#ffffff01),#0f1320;box-shadow:0 30px 80px #0005;overflow:hidden}.carlos-board-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 28px;border-bottom:1px solid #ffffff0d}.carlos-board-header h2{font-size:16px;font-weight:500;margin:0}.carlos-board-header>span{font-size:14px;color:#a8abbe}.carlos-board-header strong{color:#efd29c;font-variant-numeric:tabular-nums}
.carlos-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px 22px;padding:18px 34px 8px;background:radial-gradient(ellipse at 50% 40%,#26314640,transparent 70%)}
.carlos-box{--size:clamp(52px,8.7vw,100px);position:relative;display:block;width:100%;height:calc(var(--size)*1.57);border:0;background:transparent;padding:0;perspective:800px;cursor:pointer;isolation:isolate;touch-action:manipulation;border-radius:16px;transition:opacity .3s}.carlos-box:disabled{cursor:default}.carlos-box:focus-visible,.carlos-page a:focus-visible,.carlos-board-footer button:focus-visible{outline:2px solid #f5d697;outline-offset:5px}.carlos-box-shadow{position:absolute;width:76%;height:22%;bottom:12%;left:12%;border-radius:50%;background:radial-gradient(ellipse,#0009,transparent 70%)}
.carlos-cube{position:absolute;width:var(--size);height:var(--size);left:calc(50% - var(--size)/2);top:16%;transform-style:preserve-3d;transform:rotateX(-24deg) rotateY(-28deg);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
@media(hover:hover){.carlos-box:not(:disabled):hover .carlos-cube{transform:rotateX(-29deg) rotateY(-20deg)}}
.carlos-face{position:absolute;inset:0;border:1px solid #ffffff25;backface-visibility:hidden;background:linear-gradient(135deg,var(--light),var(--box) 45%,var(--dark));border-radius:3px}.carlos-front{transform:translateZ(calc(var(--size)/2));overflow:hidden;box-shadow:inset 0 1px 1px #fff5,inset 0 -12px 25px #0003}.carlos-back{transform:rotateY(180deg) translateZ(calc(var(--size)/2));background:var(--dark);backface-visibility:visible}.carlos-left{transform:rotateY(-90deg) translateZ(calc(var(--size)/2));background:linear-gradient(120deg,var(--box),var(--dark))}.carlos-right{transform:rotateY(90deg) translateZ(calc(var(--size)/2));background:linear-gradient(135deg,var(--light),var(--box))}.carlos-floor{transform:rotateX(90deg) translateZ(calc(var(--size)/-2));background:var(--dark);backface-visibility:visible}
.carlos-ribbon{position:absolute;top:0;bottom:0;left:40%;width:20%;background:linear-gradient(90deg,#b78840,#f9e4ad 40%,#d3a857 78%,#ae7f35);box-shadow:1px 0 0 #ffebbe70,-1px 0 0 #0002}.carlos-seal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;width:36%;aspect-ratio:1;border-radius:50%;background:linear-gradient(135deg,#fae9be,#b7863f);border:2px solid #ead29a;color:#3a2913;font-size:calc(var(--size)*.17);font-weight:800;box-shadow:0 3px 8px #0005,inset 0 0 0 2px #7f581d44}
.carlos-lid{position:absolute;inset:0;transform-origin:50% 0;transform-style:preserve-3d}.carlos-lid-top{position:absolute;inset:-3%;transform:rotateX(90deg) translateZ(calc(var(--size)/2));background:linear-gradient(140deg,var(--light),var(--box));border:1px solid #ffffff60;border-radius:4px;box-shadow:inset 0 0 16px #fff2;backface-visibility:visible}.carlos-ribbon-cross{position:absolute;left:0;right:0;top:40%;height:20%;background:linear-gradient(#be934b,#fae5af 45%,#c99d50);box-shadow:0 1px 1px #0003}.carlos-lid-edge{position:absolute;top:-3%;left:-3%;width:106%;height:13%;transform:translateZ(calc(var(--size)*.53));background:linear-gradient(var(--light),var(--box));border:1px solid #ffffff38;border-radius:3px;box-shadow:0 3px 4px #0004}.carlos-lid-edge:after{content:'';position:absolute;inset:0 40%;background:linear-gradient(90deg,#bd934a,#f7dfa3,#c2974c)}
.carlos-box-caption{position:absolute;bottom:0;left:0;right:0;color:#8c91a7;font-size:12px;font-variant-numeric:tabular-nums;letter-spacing:.14em}.carlos-reveal{position:absolute;z-index:2;inset:26% 4% 14%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:#101522ee;border:1px solid #ffffff26;box-shadow:0 8px 24px #0006;border-radius:14px;color:#c1c5d4;font-size:14px;font-weight:600}.carlos-reveal-win{background:radial-gradient(ellipse at top,#514026,#151723 80%);border-color:#edcb8066;color:#f9dfab;box-shadow:0 0 22px #e9bc4620}.carlos-prize-icon{font-size:clamp(26px,3vw,38px);line-height:1.2}
.carlos-board-footer{padding:22px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#a8abbe;font-size:14px;border-top:1px solid #ffffff0d;margin-top:18px}.carlos-board-footer button{display:flex;align-items:center;justify-content:center;gap:9px;padding:12px 20px;border-radius:10px;border:1px solid #ffe7b880;background:linear-gradient(120deg,#f3dba8,#d7b16b);color:#302310;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 3px 14px #0002;transition:filter .2s,transform .2s}.carlos-board-footer button:hover{filter:brightness(1.08);transform:translateY(-1px)}.carlos-board-footer button:active{transform:scale(.98)}.carlos-result{text-align:center;padding:12px;color:#efd29c;font-size:14px}.carlos-prizes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px}.carlos-prize{display:flex;align-items:center;gap:14px;padding:16px 20px;border:1px solid #ffffff0e;border-radius:14px;background:#ffffff03}.carlos-prize>span{font-size:28px}.carlos-prize p{margin:0 0 4px;font-size:14px;color:#dedee9}.carlos-prize small{font-size:12px;color:#999fb5}.carlos-location{text-align:center;font-size:12px;color:#747d98;letter-spacing:.14em;margin:20px 0 0}
/* Size the playing area from the available viewport, then fit each 3D box
   to its grid cell. No content is hidden to make the page fit. */
.carlos-page{height:100dvh;min-height:0;display:flex;flex-direction:column}
.carlos-nav{flex:0 0 auto;width:100%;min-height:48px;margin:0 auto;padding:10px 28px}
.carlos-main{flex:1;min-height:0;width:100%;margin:0 auto;padding:14px 28px 10px;display:flex;flex-direction:column;gap:12px}
.carlos-header{flex:0 0 auto;margin:0;gap:16px}.carlos-header h1{font-size:clamp(24px,3vw,36px)}.carlos-eyebrow{margin-bottom:4px}.carlos-stats strong{font-size:20px}
.carlos-cabinet{flex:1;min-height:0;display:flex;flex-direction:column}
.carlos-board-header{flex:0 0 auto;padding:12px 22px}
.carlos-grid{flex:1;min-height:0;grid-template-rows:repeat(3,minmax(0,1fr));gap:4px 18px;padding:8px 26px}
.carlos-box{container-type:size;height:100%;min-height:0;min-width:0}
.carlos-cube{--size:min(62cqw,60cqh,110px);top:50%;margin-top:calc(var(--size)*-.5)}
.carlos-seal{font-size:max(11px,calc(var(--size)*.17))}
.carlos-reveal{inset:16% 3% 8%;gap:2px;font-size:clamp(11px,12cqh,14px)}
.carlos-prize-icon{font-size:clamp(18px,30cqh,36px)}
.carlos-board-footer{flex:0 0 auto;padding:10px 22px;margin:0;gap:12px}
.carlos-board-footer button{min-height:40px;padding:8px 16px}
.carlos-result{flex:0 0 auto;margin:0;padding:4px 12px}
.carlos-prizes{flex:0 0 auto;margin:0;gap:12px}.carlos-prize{padding:10px 16px;gap:10px}.carlos-prize p{line-height:1.25}.carlos-prize>span{font-size:24px}
.carlos-location{flex:0 0 auto;margin:0;line-height:1.2}
@media(max-width:640px){
 .carlos-nav{min-height:42px;padding:8px 16px}.carlos-brand{font-size:14px}.carlos-nav a{font-size:13px}
 .carlos-main{padding:10px 12px 8px;gap:8px}.carlos-header{gap:6px;align-items:flex-start;flex-direction:column}.carlos-header h1{font-size:24px}.carlos-eyebrow{font-size:10px;line-height:1.2;margin-bottom:3px}
 .carlos-stats{gap:18px;font-size:12px}.carlos-stats span{flex-direction:row;align-items:baseline;gap:6px}.carlos-stats strong{font-size:14px}
 .carlos-cabinet{border-radius:16px}.carlos-board-header{padding:9px 12px;gap:8px}.carlos-board-header h2{font-size:14px}.carlos-board-header>span{font-size:12px}
 .carlos-grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:2px 8px;padding:4px 14px}
 .carlos-board-footer{padding:8px 12px;gap:8px;flex-wrap:nowrap}.carlos-board-footer>span{font-size:11px;max-width:100px;line-height:1.3}.carlos-board-footer button{font-size:12px;padding:8px 10px;gap:6px;min-height:38px;white-space:nowrap}
 .carlos-prizes{gap:6px}.carlos-prize{padding:7px 5px;gap:4px;flex-direction:column;text-align:center}.carlos-prize>span{font-size:20px;line-height:1}.carlos-prize p{font-size:11px;margin-bottom:2px}.carlos-prize small{font-size:10px;line-height:1.2;display:block}.carlos-location{font-size:10px}
}
@media(max-height:500px) and (min-width:641px){
 .carlos-nav{min-height:32px;padding:4px 24px}.carlos-main{padding:6px 24px;gap:5px}.carlos-header h1{font-size:22px}.carlos-eyebrow{font-size:10px;margin:0}.carlos-stats span{flex-direction:row;align-items:center;gap:6px}.carlos-stats strong{font-size:16px}.carlos-board-header{padding:5px 16px}.carlos-board-header h2{font-size:14px}.carlos-grid{padding:2px 20px;gap:0 12px}.carlos-board-footer{padding:4px 16px}.carlos-board-footer button{min-height:30px;padding:4px 12px}.carlos-prize{padding:4px 12px}.carlos-prize p{font-size:12px;margin:0}.carlos-prize small{font-size:10px}.carlos-location{font-size:10px}
}
@media(prefers-reduced-motion:reduce){.carlos-page *,.carlos-page *:before,.carlos-page *:after{transition:none!important;animation:none!important}.carlos-box:hover .carlos-cube{transform:rotateX(-24deg) rotateY(-28deg)}}
`;
