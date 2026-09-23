import { useState, useRef, useEffect, FC } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import WinOverlay from "../components/WinOverlay";

type SymbolId = "boule" | "quille" | "strike";

const PRIZES: Record<SymbolId, { name: string; emoji: string; color: string; glow: string }> = {
  boule:  { name: "Assiette de Bonbons",              emoji: "🍬", color: "#d4af37", glow: "rgba(212,175,55,0.5)"   },
  quille: { name: "Goodies",           emoji: "🎫", color: "#c8deff", glow: "rgba(180,210,255,0.45)" },
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
        background: "radial-gradient(circle at 33% 28%, #8980ff 0%, #3c258e 48%, #170c42 100%)",
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

const SYMBOL_LABELS: Record<SymbolId, string> = { boule: 'Boule', quille: 'Quille', strike: 'Strike' };

const Reel: FC<{ symbol: SymbolId; spinning: boolean; index: number }> = ({ symbol, spinning, index }) => {
  const reducedMotion = useReducedMotion();
  const position = ALL.indexOf(symbol);
  const visible = [ALL[(position + 2) % 3], symbol, ALL[(position + 1) % 3]];
  return <div className="bs-reel" data-running={spinning} role="img" aria-label={`Rouleau ${index + 1} : ${spinning ? 'en rotation' : SYMBOL_LABELS[symbol]}`}>
    {spinning && !reducedMotion ? <div className="bs-strip" aria-hidden="true">
      {[...ALL, ...ALL].map((id, j) => <div className="bs-symbol" key={j}><div className="bs-symbol-art"><SymbolDisplay id={id} /></div></div>)}
    </div> : <motion.div className="bs-rest" key={spinning ? 'spin' : 'stop'} aria-hidden="true"
      initial={reducedMotion ? false : { y: -18 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 330, damping: 22 }}>
      {visible.map((id, j) => <div className="bs-symbol" key={j}><div className="bs-symbol-art"><SymbolDisplay id={id} /></div></div>)}
    </motion.div>}
    <div className="bs-reel-glass" aria-hidden="true" />
  </div>;
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

  // Clear animation timers when leaving the game; results and timings are unchanged.
  useEffect(() => () => {
    iids.current.forEach(clearInterval);
    tids.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="bs-page">
      <style>{SLOT_STYLES}</style>
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


      <nav className="bs-nav"><Link to={isAdulte ? '/jeux/adultes' : '/jeux/enfants'}><ArrowLeft size={18} /> Retour aux jeux</Link><span><Crown size={19} /> L.J.D.C</span></nav>
      <main className="bs-main">
        <header className="bs-page-heading"><div><p>GRAMONT CASINO</p><h1>Bowling Slots</h1></div><span>Alignez 3 symboles identiques pour gagner.</span></header>
        <section className="bs-stage" aria-label="Machine à sous à trois rouleaux">
          <div className="bs-machine" data-phase={phase}>
            <div className="bs-marquee">
              <div className="bs-bulbs" aria-hidden="true">{Array.from({length:11},(_,i) => <i key={i} style={{animationDelay: `${i * 0.09}s`}} />)}</div>
              <div className="bs-marquee-title"><span>★</span><div><small>LES JEUX DE CARLOS</small><strong>BOWLING <em>SLOTS</em></strong></div><span>★</span></div>
              <div className="bs-marquee-rule">BOULE • QUILLE • STRIKE</div>
            </div>
            <div className="bs-fascia">
              <i className="bs-screw bs-screw-left" aria-hidden="true" /><i className="bs-screw bs-screw-right" aria-hidden="true" />
              <div className="bs-meter-row"><div><small>PARTIES</small><strong>{String(stats.spins).padStart(3, '0')}</strong></div><span>TRIPLE CHANCE</span><div><small>VICTOIRES</small><strong>{String(stats.wins).padStart(3, '0')}</strong></div></div>
              <div className="bs-reel-frame">
                <div className="bs-reels">{reels.map((symbol,i) => <Reel key={i} symbol={symbol} spinning={running[i]} index={i} />)}</div>
                <span className="bs-payline bs-payline-left" aria-hidden="true">▶</span><span className="bs-payline bs-payline-right" aria-hidden="true">◀</span>
              </div>
              <div className="bs-reel-numbers" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>
              <div className="bs-status" role="status" aria-live="polite" aria-atomic="true">
                {isSpinning ? 'Les rouleaux tournent…' : isWon && winner ? `${prizes[winner].emoji} ${prizes[winner].name} !` : phase === 'lost' ? 'Pas de chance… À vous de rejouer !' : 'À vous de jouer !'}
              </div>
              <div className="bs-console"><div className="bs-speaker" aria-hidden="true" /><button type="button" className="bs-spin" onClick={handleSpin} disabled={isSpinning}><span>{isSpinning ? 'EN COURS…' : 'LANCER'}</span></button><div className="bs-coin" aria-hidden="true"><span /> <small>GRAMONT</small></div></div>
            </div>
            <div className="bs-paytable" aria-label="Combinaisons gagnantes">{ALL.map(id => <div key={id}><strong>{SYMBOL_LABELS[id]} ×3</strong><span>{prizes[id].emoji} {prizes[id].name}</span></div>)}</div>
            <div className="bs-base" aria-hidden="true"><span /></div>
            <button type="button" className="bs-lever" onClick={handleSpin} disabled={isSpinning} aria-label="Tirer le levier pour lancer les rouleaux"><span className="bs-lever-mount" /><span className="bs-lever-arm"><span className="bs-lever-ball" /></span></button>
          </div>
        </section>
        <footer className="bs-footer"><span>3 rouleaux · 3 combinaisons gagnantes</span><span>Chance de victoire : 25 %</span></footer>
      </main>
    </div>
  );
}

const SLOT_STYLES = `
.bs-page{height:100dvh;min-height:560px;display:flex;flex-direction:column;color:#f9edda;font-family:Inter,system-ui,sans-serif;background:radial-gradient(ellipse at 50% 40%,#48314250,transparent 60%),radial-gradient(ellipse at 0 0,#233d4b60,transparent 50%),#080d17;color-scheme:dark}.bs-page *{box-sizing:border-box}.bs-nav{display:flex;justify-content:space-between;align-items:center;padding:12px 32px;border-bottom:1px solid #ffffff12;flex-shrink:0}.bs-nav a{display:flex;gap:10px;align-items:center;color:#b5bdca;text-decoration:none;font-size:14px}.bs-nav>span{display:flex;gap:8px;align-items:center;color:#e4c187;font-weight:700;letter-spacing:.15em}.bs-main{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;width:100%;max-width:1120px;margin:auto;padding:16px 28px 10px}.bs-page-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-shrink:0}.bs-page-heading p{font-size:10px;letter-spacing:.25em;color:#c6a36e;margin:0 0 4px}.bs-page-heading h1{font-size:28px;font-weight:600;letter-spacing:-.04em;line-height:1.1;margin:0}.bs-page-heading>span{font-size:13px;color:#aab4c4}.bs-stage{flex:1;min-height:0;display:flex;justify-content:center;align-items:center;padding:8px 48px 10px;perspective:1500px;position:relative}.bs-stage:before{content:'';position:absolute;bottom:0;left:10%;right:10%;height:12%;background:radial-gradient(ellipse,#000b,transparent 70%);filter:blur(8px)}
.bs-machine{min-width:0;height:100%;max-height:660px;position:relative;display:flex;flex-direction:column;max-width:650px;width:100%;min-height:0;border:2px solid #e2b579;border-radius:36px 36px 22px 22px;padding:10px 12px 0;background:linear-gradient(100deg,#530a18,#bc2438 4%,#68101f 9%,#941b2e 50%,#440812 93%,#ce5b68 98%,#4c0b1a);box-shadow:inset 0 2px 2px #fff8,inset 0 -5px 8px #0009,7px 9px 0 #300710,9px 10px 0 #bc8650,16px 23px 26px #0009,0 0 70px #e6584310;transform:rotateX(2deg);isolation:isolate}
.bs-marquee{flex:0 0 auto;background:radial-gradient(ellipse at center,#492217,#160e14 85%);border:2px solid #c7a362;border-radius:24px 24px 8px 8px;padding:8px 18px 7px;box-shadow:inset 0 0 0 2px #322117,inset 0 0 25px #000c,0 2px 2px #fff3}.bs-bulbs{display:flex;justify-content:space-between;gap:10px;margin-bottom:6px}.bs-bulbs i{width:6px;height:6px;background:#ffdfa1;border-radius:50%;box-shadow:0 0 6px #ffa940,0 0 12px #ffc06080}.bs-machine[data-phase=spinning] .bs-bulbs i{animation:bs-light .65s ease-in-out infinite alternate}.bs-machine[data-phase=won] .bs-marquee{box-shadow:0 0 26px #ecc97480,inset 0 0 25px #ffab2920}.bs-marquee-title{display:flex;align-items:center;justify-content:space-around;gap:10px}.bs-marquee-title>span{color:#e7b66b;font-size:24px;text-shadow:0 0 16px #ffc56488}.bs-marquee-title div{text-align:center}.bs-marquee-title small{display:block;font-size:9px;letter-spacing:.28em;color:#e2b781}.bs-marquee-title strong{font-size:clamp(22px,3.2vw,35px);font-weight:900;font-style:italic;letter-spacing:-.04em;line-height:1.1;color:#fff0c8;text-shadow:0 2px 0 #9b6533,0 4px 0 #372011,0 0 22px #ffb63260}.bs-marquee-title em{color:#f0b457;font-style:inherit}.bs-marquee-rule{text-align:center;font-size:9px;letter-spacing:.22em;color:#b39570;margin-top:5px}
.bs-fascia{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;margin:8px 3px 0;padding:9px 16px 10px;border:2px solid #232529;border-radius:12px 12px 5px 5px;background:linear-gradient(112deg,#b3aaa0 0%,#eee3d1 3%,#706c65 6%,#d9d0bf 12%,#b9afa0 49%,#eee6d7 80%,#575954 96%,#c8c3b5);box-shadow:inset 0 1px 0 #fff,0 0 0 1px #f7d89580,0 4px 8px #0008}.bs-screw{position:absolute;top:8px;width:7px;height:7px;border-radius:50%;background:linear-gradient(130deg,#dce1dc 40%,#4a4b45 45%,#4a4b45 55%,#c8cbc2 60%);box-shadow:0 1px 2px #000a}.bs-screw-left{left:6px}.bs-screw-right{right:6px}.bs-meter-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 8px 8px;flex-shrink:0}.bs-meter-row>div{display:flex;gap:10px;align-items:center;background:#171719;border:2px solid #605c54;border-radius:4px;padding:4px 10px;box-shadow:0 1px 1px #fff8,inset 0 2px 5px #000}.bs-meter-row small{font-size:8px;letter-spacing:.12em;color:#bbb19d}.bs-meter-row strong{font:20px/1 monospace;color:#ffd183;text-shadow:0 0 8px #ffc25060}.bs-meter-row>span{font-size:9px;letter-spacing:.18em;font-weight:800;color:#574b3f}
.bs-reel-frame{position:relative;flex:1;min-height:0;padding:8px 12px;background:linear-gradient(145deg,#393933,#f7ead5 4%,#766451 7%,#171616 10%,#0a0a0a 90%,#d9c6a4 94%,#faf2e1 97%,#5a4c3c);border-radius:10px;box-shadow:0 2px 2px #fff9,0 -1px 2px #000a,inset 0 3px 6px #000}.bs-reels{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;height:100%;overflow:hidden;border-radius:5px;border:2px solid #181716;background:#141313}.bs-reel{position:relative;overflow:hidden;container-type:size;background:#f0eadf;border-left:1px solid #ffffff;border-right:1px solid #857b6c;isolation:isolate}.bs-rest{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center}.bs-symbol{flex-shrink:0;height:62cqh;display:flex;align-items:center;justify-content:center}.bs-rest .bs-symbol:first-child,.bs-rest .bs-symbol:last-child{opacity:.48}.bs-reel .bs-symbol-art{scale:clamp(.45,tan(atan2(min(76cqw,48cqh),76px)),1.5)}.bs-symbol-art{transform:none;filter:drop-shadow(0 5px 3px #40332425)}
.bs-strip{position:absolute;left:0;right:0;top:50%;margin-top:-31cqh;animation:bs-roll .46s linear infinite;filter:blur(1.4px)}.bs-strip .bs-symbol{height:62cqh}.bs-reel-glass{position:absolute;z-index:2;inset:0;pointer-events:none;background:linear-gradient(#201c19bf 0%,#655a4655 14%,#ffffff08 32%,#fff4 43%,transparent 52%,#54463550 84%,#171411d9 100%);box-shadow:inset 3px 0 8px #0005,inset -3px 0 8px #0005}.bs-reel-glass:after{content:'';position:absolute;inset:0;background:linear-gradient(113deg,transparent 20%,#fff5 21%,#fff1 29%,transparent 30%)}.bs-payline{position:absolute;top:50%;transform:translateY(-50%);font-size:16px;color:#f23d44;text-shadow:0 1px 2px #000,0 0 8px #ff2626;z-index:3}.bs-payline-left{left:-5px}.bs-payline-right{right:-5px}.bs-reel-numbers{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;font-size:9px;line-height:1;color:#574c3c;font-weight:700;letter-spacing:.14em;padding:5px 12px 2px;flex-shrink:0}
.bs-status{flex:0 0 auto;text-align:center;min-height:30px;display:flex;align-items:center;justify-content:center;color:#ead296;font:12px/1.3 monospace;letter-spacing:.025em;background:#141d1a;border:2px solid #756c5f;border-radius:4px;margin:3px 8px 7px;padding:4px 8px;box-shadow:inset 0 2px 5px #000,0 1px 0 #fff9}.bs-machine[data-phase=won] .bs-status{color:#bbffb2;text-shadow:0 0 8px #72ff8860}.bs-console{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:0 10px;flex-shrink:0}.bs-spin{min-width:190px;min-height:48px;border-radius:50px;border:3px solid #4f3720;padding:4px;background:linear-gradient(#fff2ba,#99702f);box-shadow:0 4px 0 #45351e,0 7px 9px #0007,inset 0 1px 1px #fff;cursor:pointer;transition:transform .15s,box-shadow .15s}.bs-spin span{display:flex;align-items:center;justify-content:center;min-height:32px;border:1px solid #ffe9a3;border-radius:40px;background:radial-gradient(ellipse at 50% 0%,#fff4bd,#efb449 70%);color:#5a3210;font-size:17px;font-weight:900;letter-spacing:.14em;text-shadow:0 1px #fff8;box-shadow:inset 0 -4px 6px #b5682280}.bs-spin:not(:disabled):active{transform:translateY(3px);box-shadow:0 1px 0 #45351e,0 3px 5px #0007}.bs-spin:disabled{cursor:wait;filter:saturate(.5)}.bs-spin:disabled span{font-size:13px}.bs-speaker{height:28px;width:58px;background:repeating-linear-gradient(0deg,#252624 0 2px,transparent 2px 5px);border-radius:50%;opacity:.85}.bs-coin{display:flex;flex-direction:column;align-items:center;gap:4px}.bs-coin>span{display:block;width:47px;height:15px;border:4px solid #746f66;background:#080909;box-shadow:0 1px 0 #fff9,inset 0 2px 3px #000;border-radius:3px}.bs-coin small{font-size:7px;color:#5c5042;letter-spacing:.12em}.bs-paytable{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:10px 10px 8px;flex-shrink:0}.bs-paytable>div{text-align:center;padding:0 6px;border-right:1px solid #ffd9a330;line-height:1.2}.bs-paytable>div:last-child{border:0}.bs-paytable strong{display:block;font-size:11px;color:#ffd994;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}.bs-paytable span{font-size:11px;color:#f6dace}.bs-base{height:20px;flex-shrink:0;margin:0 -5px;background:linear-gradient(#ad7356,#3b1720 22%,#1a0a0e 80%,#ad8260);border-radius:5px 5px 14px 14px;border-top:1px solid #edb68b;display:flex;justify-content:center;padding-top:5px}.bs-base>span{width:45%;height:9px;background:linear-gradient(#0a0a0b,#272528);border:1px solid #755645;border-radius:3px;box-shadow:0 1px 0 #e6b99540}
.bs-lever{position:absolute;right:-48px;top:40%;height:140px;width:46px;background:transparent;border:0;cursor:pointer;padding:0;perspective:600px;touch-action:manipulation}.bs-lever:disabled{cursor:wait}.bs-lever-mount{position:absolute;left:-3px;bottom:6px;width:28px;height:36px;border-radius:0 50% 50% 0;background:linear-gradient(90deg,#514b40,#d6c5a4 45%,#4b4137);border:2px solid #bcad92;box-shadow:3px 4px 5px #0008}.bs-lever-arm{position:absolute;bottom:24px;left:20px;width:10px;height:91px;background:linear-gradient(90deg,#4a4945,#fff3dd 40%,#a19279 65%,#393934);border-radius:5px;transform-origin:50% 100%;transform:rotate(10deg);box-shadow:3px 2px 4px #0008;transition:transform .2s}.bs-lever-ball{position:absolute;left:50%;top:-17px;transform:translateX(-50%);width:35px;height:35px;border-radius:50%;background:radial-gradient(circle at 30% 23%,#ffafb0,#e53645 28%,#8b091a 64%,#37050c);box-shadow:inset 0 1px 2px #fff8,4px 6px 10px #0008}.bs-lever:not(:disabled):hover .bs-lever-arm{transform:rotate(16deg)}.bs-machine[data-phase=spinning] .bs-lever-arm{animation:bs-pull .7s ease-in-out}.bs-footer{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#8591a1;flex-shrink:0}.bs-page button:focus-visible,.bs-page a:focus-visible{outline:3px solid #fff2b9;outline-offset:5px}
@keyframes bs-roll{from{transform:translateY(-186cqh)}to{transform:translateY(0)}}@keyframes bs-light{to{opacity:.35;box-shadow:0 0 2px #ffa940}}@keyframes bs-pull{0%,100%{transform:rotateX(0) rotate(10deg)}45%{transform:rotateX(-58deg) rotate(18deg)}}
@media(max-width:640px){.bs-page{min-height:540px}.bs-nav{padding:10px 16px}.bs-nav a{font-size:12px}.bs-nav>span{font-size:13px}.bs-main{padding:10px 12px 8px;gap:8px}.bs-page-heading{display:block}.bs-page-heading h1{font-size:24px}.bs-page-heading>span{display:block;font-size:11px;margin-top:5px}.bs-stage{padding:3px 38px 8px 0}.bs-machine{max-height:570px;border-radius:25px 25px 18px 18px;padding:7px 7px 0;box-shadow:inset 0 2px 2px #fff8,4px 7px 0 #300710,6px 8px 0 #bc8650,10px 16px 20px #0008}.bs-marquee{padding:6px 8px;border-radius:18px 18px 6px 6px}.bs-bulbs{gap:4px;margin-bottom:4px}.bs-bulbs i{width:4px;height:4px}.bs-marquee-title strong{font-size:23px}.bs-marquee-title>span{font-size:15px}.bs-marquee-title small{font-size:7px}.bs-marquee-rule{font-size:7px;margin-top:4px}.bs-fascia{padding:7px 7px 9px;margin:6px 0 0}.bs-meter-row{gap:5px;padding:0 4px 6px}.bs-meter-row>span{font-size:7px;letter-spacing:.05em}.bs-meter-row>div{padding:4px;gap:5px}.bs-meter-row small{font-size:6px;letter-spacing:.03em}.bs-meter-row strong{font-size:16px}.bs-reel-frame{padding:6px}.bs-reels{gap:3px}.bs-status{margin:3px 0 7px;font-size:10px;min-height:28px}.bs-console{padding:0 3px;gap:8px}.bs-spin{min-width:138px;min-height:44px}.bs-spin span{font-size:15px;min-height:29px}.bs-speaker{width:28px;height:24px}.bs-coin>span{width:26px;height:12px;border-width:3px}.bs-coin small{font-size:5px}.bs-paytable{padding:8px 0;gap:2px}.bs-paytable>div{padding:0 3px}.bs-paytable strong{font-size:9px;letter-spacing:0}.bs-paytable span{font-size:9px;display:block;line-height:1.2}.bs-lever{right:-31px;width:30px;height:110px}.bs-lever-arm{left:13px;height:68px;width:7px}.bs-lever-ball{width:26px;height:26px;top:-14px}.bs-lever-mount{width:20px;height:30px;bottom:9px}.bs-base{height:16px}.bs-base>span{height:7px}.bs-footer{font-size:9px;gap:6px}}
@media(min-width:641px) and (max-height:720px){.bs-main{padding-top:10px;gap:7px}.bs-marquee{padding-top:5px;padding-bottom:5px}.bs-marquee-title strong{font-size:27px}.bs-marquee-rule{margin-top:2px}.bs-paytable{padding-top:7px;padding-bottom:7px}.bs-status{min-height:26px;margin-bottom:5px}.bs-meter-row{padding-bottom:5px}.bs-spin{min-height:42px}.bs-spin span{min-height:27px}.bs-base{height:16px}}
@media(prefers-reduced-motion:reduce){.bs-page *,.bs-page *:before,.bs-page *:after{animation:none!important;transition:none!important}}
`;
