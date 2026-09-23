import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
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

  const reducedMotion = useReducedMotion();
  const backgroundRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const viewHeightRef = useRef(850);
  const lastTrailPositionRef = useRef<Ball | null>(null);

  // Canvas dimensions (responsive)
  const W = 1500;
  const H = 850;

  // Build pegs once on mount
  useEffect(() => {
    pegsRef.current = buildPegs(W, H);
  }, []);

  // Rendering uses separate display coordinates. Physics stays at 1500 × 850.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const vh = viewHeightRef.current;
    const sy = vh / H;
    const bucketW = W / 12;
    const floor = H * 0.78 * sy;
    if (!backgroundRef.current) {
      const surface = document.createElement('canvas');
      surface.width = W;
      surface.height = vh;
      const bg = surface.getContext('2d')!;
      const field = bg.createLinearGradient(0, 0, W, vh);
      field.addColorStop(0, '#173638'); field.addColorStop(0.45, '#0c232a'); field.addColorStop(1, '#06151e');
      bg.fillStyle = field; bg.fillRect(0, 0, W, vh);
      const light = bg.createRadialGradient(W * .5, vh * .14, 0, W * .5, vh * .4, W * .8);
      light.addColorStop(0, '#55dbc019'); light.addColorStop(1, '#03101a00');
      bg.fillStyle = light; bg.fillRect(0,0,W,vh);
      // Quiet etched grid, recessed collection wells, and raised metal dividers.
      bg.strokeStyle = '#b4eee909'; bg.lineWidth = 1;
      for (let x=25;x<W;x+=50) { bg.beginPath();bg.moveTo(x,0);bg.lineTo(x,floor);bg.stroke(); }
      for(let i=0;i<12;i++) {
        const x = i * bucketW, p = PRIZES[i];
        const well = bg.createLinearGradient(0,floor,0,vh);
        well.addColorStop(0,'#020b10');well.addColorStop(.25,p ? PRIZE_META[p].color + '24' : '#18262c');well.addColorStop(1,'#040b11');
        bg.fillStyle=well;bg.fillRect(x+4,floor,bucketW-8,vh-floor);
        bg.fillStyle=p ? PRIZE_META[p].color : '#415361';bg.fillRect(x+15,vh-12,bucketW-30,4);
        const rail=bg.createLinearGradient(x,0,x+9,0);
        rail.addColorStop(0,'#0a1419');rail.addColorStop(.45,'#98acac');rail.addColorStop(.6,'#53686d');rail.addColorStop(1,'#0b1820');
        bg.fillStyle=rail;bg.fillRect(x,floor,9,vh-floor);
        bg.textAlign='center';bg.textBaseline='middle';bg.font='500 19px system-ui';bg.fillStyle='#91a8ae';
        bg.fillText(String(i+1).padStart(2,'0'),x+bucketW/2,floor+(vh-floor)*.17);
        bg.font='43px "Segoe UI Emoji", sans-serif';
        const emoji=p ? p==='pochette' && isAdulteRef.current ? '🥃' : p==='bonbons' && isAdulteRef.current ? '🥃' : p==='barbapapa' && isAdulteRef.current ? '🍭' : PRIZE_META[p].emoji : '–';
        bg.fillStyle=p ? '#ffffff' : '#455766';bg.fillText(emoji,x+bucketW/2,floor+(vh-floor)*.61);
      }
      for (const peg of pegsRef.current) {
        const y=peg.y*sy;
        bg.beginPath();bg.ellipse(peg.x+5,y+8,PEG_R*1.55,PEG_R*.8,0,0,Math.PI*2);bg.fillStyle='#00000070';bg.fill();
        bg.fillStyle='#243a42';bg.beginPath();bg.arc(peg.x,y+3,PEG_R+2,0,Math.PI*2);bg.fill();
        const steel=bg.createRadialGradient(peg.x-3,y-3,0,peg.x,y,PEG_R);
        steel.addColorStop(0,'#f5fffa');steel.addColorStop(.28,'#c3e5db');steel.addColorStop(.56,'#7bafb0');steel.addColorStop(1,'#284c58');
        bg.fillStyle=steel;bg.beginPath();bg.arc(peg.x,y,PEG_R,0,Math.PI*2);bg.fill();
        bg.fillStyle='#ffffffb0';bg.beginPath();bg.arc(peg.x-2,y-3,1.4,0,Math.PI*2);bg.fill();
      }
      backgroundRef.current=surface;
    }
    ctx.clearRect(0,0,W,vh);
    ctx.drawImage(backgroundRef.current,0,0);
    if(highlight!==null) {
      const x=highlight*bucketW,p=PRIZES[highlight];
      const color=p ? PRIZE_META[p].color : '#a1c7cc';
      const glow=ctx.createLinearGradient(0,floor,0,vh);
      glow.addColorStop(0,color+'06');glow.addColorStop(1,color+'70');
      ctx.fillStyle=glow;ctx.fillRect(x+9,floor,bucketW-13,vh-floor);
      ctx.strokeStyle=color;ctx.lineWidth=4;ctx.strokeRect(x+9,floor+2,bucketW-15,vh-floor-5);
    }
    const ball=ballRef.current;
    // Reset the visual trail for each new ball without consuming game randomness.
    if(lastTrailPositionRef.current!==ball){trailRef.current=[];lastTrailPositionRef.current=ball;}
    if(ball) {
      if(!reducedMotion && !ball.done) {
        trailRef.current.push({x:ball.x,y:ball.y});
        if(trailRef.current.length>14)trailRef.current.shift();
        trailRef.current.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y*sy,3+i*.65,0,Math.PI*2);ctx.fillStyle=`rgba(137,255,223,${i/80})`;ctx.fill();});
      }
      const x=ball.done && ball.bucket!==null ? bucketX(ball.bucket,W) : ball.x;
      const y=ball.done ? floor+(vh-floor)*.34 : ball.y*sy;
      if(!ball.done) {
        for(const peg of pegsRef.current) {
          const distance=Math.hypot(ball.x-peg.x,ball.y-peg.y);
          if(distance<34){ctx.beginPath();ctx.arc(peg.x,peg.y*sy,PEG_R+7,0,Math.PI*2);ctx.strokeStyle='#a6ffe99a';ctx.lineWidth=2;ctx.stroke();}
        }
      }
      ctx.beginPath();ctx.ellipse(x+8,y+12,BALL_R*1.3,BALL_R*.7,0,0,Math.PI*2);ctx.fillStyle='#00000080';ctx.fill();
      const halo=ctx.createRadialGradient(x,y,0,x,y,45);halo.addColorStop(0,'#b1ffe976');halo.addColorStop(1,'#8dffdf00');ctx.fillStyle=halo;ctx.fillRect(x-45,y-45,90,90);
      const chrome=ctx.createRadialGradient(x-4,y-5,1,x,y,BALL_R+2);chrome.addColorStop(0,'#ffffff');chrome.addColorStop(.26,'#e2fff0');chrome.addColorStop(.57,'#69d9b9');chrome.addColorStop(.8,'#176758');chrome.addColorStop(1,'#a8ead6');
      ctx.beginPath();ctx.arc(x,y,BALL_R+2,0,Math.PI*2);ctx.fillStyle=chrome;ctx.fill();
    }
  }, [highlight, reducedMotion, isAdulte]);

  // Fit the visible board to the available screen while preserving all physical coordinates.
  useEffect(() => {
    const canvas=canvasRef.current;
    if(!canvas)return;
    const resize = () => {
      const rect=canvas.getBoundingClientRect();
      if(!rect.width || !rect.height)return;
      const height=Math.max(300,Math.round(W*rect.height/rect.width));
      if(canvas.height!==height){canvas.width=W;canvas.height=height;viewHeightRef.current=height;}
      backgroundRef.current=null;
      draw();
    };
    const observer=new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return()=>observer.disconnect();
  },[draw,isAdulte]);

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

  const visiblePrizes = isAdulte
    ? { ...PRIZE_META, bonbons: {...PRIZE_META.bonbons,emoji:'🥃',label:'1 Shooter'}, barbapapa:{...PRIZE_META.barbapapa,emoji:'🍭',label:'Barbe à Papa'}, pochette:{...PRIZE_META.pochette,emoji:'🥃',label:'Tournée de Shooters'} }
    : PRIZE_META;

  return (
    <div className="pl-page">
      <style>{PLINKO_STYLES}</style>
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


      <nav className="pl-nav"><Link to={isAdulte ? '/jeux/adultes' : '/jeux/enfants'}><ArrowLeft size={18}/> Retour aux jeux</Link><span><Crown size={19}/> L.J.D.C</span></nav>
      <main className="pl-main">
        <header className="pl-heading"><div><p>GRAMONT CASINO</p><h1>Plinko<span> ✦</span></h1></div><p>Lâchez la bille. Suivez votre chance.</p></header>
        <div className="pl-game">
          <section className="pl-stage" aria-label="Plateau de Plinko">
            <div className="pl-cabinet" data-active={isDropping}>
              <div className="pl-board-top"><span>PLINKO</span><div className="pl-launcher" aria-hidden="true"><i /></div><span>12 CASES</span></div>
              <div className="pl-frame"><canvas ref={canvasRef} width={W} height={H} role="img" aria-label="Plateau de 18 rangées de plots et 12 cases d’arrivée. Les résultats sont annoncés sous le plateau." /></div>
              <div className="pl-board-base"><span>LES JEUX DE CARLOS</span><span>GRAMONT</span></div>
            </div>
          </section>
          <aside className="pl-panel" aria-label="Commandes et lots">
            <div className="pl-stats"><div><span>Lancers</span><strong>{String(stats.drops).padStart(2,'0')}</strong></div><div><span>Victoires</span><strong>{String(stats.wins).padStart(2,'0')}</strong></div></div>
            <div className="pl-controls"><p className="pl-status" role="status" aria-live="polite" aria-atomic="true">{isDropping ? 'La bille est en jeu…' : phase==='won' && prize ? visiblePrizes[prize].emoji + ' ' + visiblePrizes[prize].label : phase==='lost' ? 'Pas de chance… Réessayez !' : 'À vous de jouer'}</p><motion.button type="button" onClick={handleDrop} disabled={isDropping} whileTap={reducedMotion ? undefined : {scale:.98}} className="pl-drop"><span className="pl-button-ball" aria-hidden="true"/>{isDropping ? 'Bille en jeu…' : 'Lâcher la bille'}</motion.button><p className="pl-selected">{highlight===null ? '5 cases gagnantes sur 12' : 'Bille arrivée dans la case ' + String(highlight+1).padStart(2,'0')}</p></div>
            <div className="pl-prizes"><h2>Les lots à gagner</h2>{(Object.entries(visiblePrizes)).map(([id,p])=><div className="pl-prize" key={id}><span aria-hidden="true">{p.emoji}</span><div><strong>{p.label}</strong><small>{PRIZES.filter(x=>x===id).length} case{PRIZES.filter(x=>x===id).length>1?'s':''} gagnante{PRIZES.filter(x=>x===id).length>1?'s':''}</small></div></div>)}</div>
            <p className="pl-note">Chaque rebond compte.</p>
          </aside>
        </div>
        <footer className="pl-footer">Bowling de Gramont <span>18 rangées · 12 cases · Une bille</span></footer>
      </main>
    </div>
  );
}

const PLINKO_STYLES = `
.pl-page{height:100dvh;min-height:530px;display:flex;flex-direction:column;color:#eaf3f3;background:radial-gradient(ellipse at 20% 35%,#16464570,transparent 55%),radial-gradient(ellipse at 95% 80%,#20353e50,transparent 50%),#080f16;font-family:Inter,system-ui,sans-serif;color-scheme:dark}.pl-page *{box-sizing:border-box}.pl-nav{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:12px 32px;border-bottom:1px solid #ffffff10}.pl-nav a{display:flex;align-items:center;gap:10px;font-size:14px;color:#acbac5;text-decoration:none}.pl-nav>span{display:flex;align-items:center;gap:8px;color:#dfc297;font-weight:700;letter-spacing:.15em}.pl-main{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;max-width:1500px;margin:auto;padding:20px 30px 12px;gap:16px}.pl-heading{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-shrink:0}.pl-heading div>p{font-size:10px;letter-spacing:.25em;color:#9bafa8;margin:0 0 4px}.pl-heading h1{font-size:34px;font-weight:600;letter-spacing:-.045em;line-height:1.1;margin:0}.pl-heading h1 span{font-size:23px;color:#94e6cd}.pl-heading>p{color:#9eafb8;font-size:13px;margin:0}.pl-game{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:24px}.pl-stage{min-width:0;min-height:0;perspective:1700px;padding:3px 8px 10px 0;display:flex}.pl-cabinet{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0;transform:rotateX(3deg);border:1px solid #bbb394;border-radius:22px;padding:8px;background:linear-gradient(110deg,#1d343b,#6f8887 2%,#233840 5%,#192c34 94%,#79938e 98%,#20343b);box-shadow:inset 0 2px 1px #edfff780,5px 7px 0 #0a191e,6px 8px 0 #58665e,10px 18px 30px #0009;position:relative}.pl-cabinet:before,.pl-cabinet:after{content:'';position:absolute;top:72px;bottom:46px;width:2px;background:#74e7c9;box-shadow:0 0 8px #62eac8aa,0 0 18px #62eac850;border-radius:8px;pointer-events:none}.pl-cabinet:before{left:5px}.pl-cabinet:after{right:5px}.pl-board-top{display:flex;align-items:center;justify-content:space-between;flex:0 0 40px;padding:0 14px;background:linear-gradient(#17292e,#102028);border-radius:14px 14px 0 0;border:1px solid #ffffff12;border-bottom:0;color:#b6d0c8;font-size:10px;letter-spacing:.18em;font-weight:700}.pl-launcher{width:80px;align-self:stretch;position:relative;background:linear-gradient(90deg,#344740,#13221f 18%,#081310 50%,#13221f 82%,#6f8a7c);border-left:1px solid #acc2a862;border-right:1px solid #acc2a862;border-radius:0 0 18px 18px;box-shadow:inset 0 4px 8px #0009}.pl-launcher i{position:absolute;width:14px;height:14px;border-radius:50%;left:calc(50% - 7px);top:10px;background:radial-gradient(circle at 30% 25%,#fff,#a5ead2 30%,#297b68 70%,#103e37);box-shadow:0 0 12px #87f1c966}.pl-cabinet[data-active=true] .pl-launcher i{opacity:.2}.pl-frame{flex:1;min-height:0;min-width:0;position:relative;padding:7px;background:linear-gradient(130deg,#080f13,#697d78 1%,#102327 3%,#08141a 97%,#65847b);border:1px solid #081217;border-radius:5px;box-shadow:inset 0 3px 7px #000b,0 1px 0 #9fbeb94d}.pl-frame:after{content:'';position:absolute;inset:7px;pointer-events:none;background:linear-gradient(115deg,transparent 8%,#f0fff904 9%,#f0fff907 19%,transparent 20%);box-shadow:inset 0 0 30px #0006}.pl-frame canvas{display:block;width:100%;height:100%;border-radius:2px}.pl-board-base{display:flex;justify-content:space-between;align-items:center;flex:0 0 26px;padding:0 12px;color:#7f969d;font-size:8px;letter-spacing:.2em;border-top:1px solid #a5b6a71c;background:linear-gradient(#1b3039,#14232b);border-radius:0 0 13px 13px}
.pl-panel{display:flex;flex-direction:column;justify-content:center;gap:20px;min-height:0}.pl-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pl-stats>div{border:1px solid #ffffff0e;border-radius:12px;background:#ffffff03;padding:13px 16px}.pl-stats span{display:block;font-size:12px;color:#8fa6b0;margin-bottom:4px}.pl-stats strong{font-size:30px;line-height:1;font-weight:500;font-variant-numeric:tabular-nums;color:#e8efdf}.pl-controls{padding:18px 16px;background:linear-gradient(145deg,#1c343b70,#11242d60);border:1px solid #9cd7c41c;border-radius:16px}.pl-status{font-size:14px;min-height:40px;display:flex;justify-content:center;align-items:center;text-align:center;line-height:1.4;color:#c8ded8;margin:0 0 12px}.pl-drop{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;padding:10px 14px;border-radius:10px;border:1px solid #d5ffee;background:linear-gradient(135deg,#b9f5df,#77cdb3);color:#123d35;font:700 14px Inter,system-ui,sans-serif;box-shadow:0 4px 0 #31594c,0 8px 18px #0006,inset 0 1px 0 #fff9;cursor:pointer;transition:filter .2s}.pl-drop:hover:not(:disabled){filter:brightness(1.1)}.pl-drop:disabled{cursor:wait;filter:saturate(.4);opacity:.7}.pl-button-ball{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#fff,#d5ffe9 20%,#4b9b7f 60%,#154435);box-shadow:1px 2px 2px #17413160}.pl-selected{font-size:11px;text-align:center;color:#8fa9a8;margin:14px 0 0;line-height:1.3}.pl-prizes{border-top:1px solid #ffffff10;padding-top:18px}.pl-prizes h2{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#839ba5;margin:0 0 14px;font-weight:500}.pl-prize{display:flex;align-items:center;gap:12px;margin-top:14px}.pl-prize>span{display:flex;align-items:center;justify-content:center;width:40px;height:40px;font-size:22px;background:#ffffff04;border:1px solid #ffffff0d;border-radius:11px;flex-shrink:0}.pl-prize strong{font-size:13px;font-weight:500;color:#d6dfdf;display:block;line-height:1.3}.pl-prize small{display:block;font-size:11px;color:#819ba4;margin-top:4px}.pl-note{font-size:11px;color:#63828a;text-align:center;margin:0}.pl-footer{flex-shrink:0;display:flex;justify-content:space-between;gap:12px;color:#71868f;font-size:10px;letter-spacing:.06em}.pl-page button:focus-visible,.pl-page a:focus-visible{outline:3px solid #bbffe4;outline-offset:5px}
@media(max-height:720px) and (min-width:761px){.pl-main{padding-top:12px;gap:10px}.pl-panel{gap:12px}.pl-stats>div{padding:10px 14px}.pl-stats strong{font-size:24px}.pl-controls{padding:12px}.pl-status{min-height:30px;margin-bottom:8px}.pl-prizes{padding-top:12px}.pl-prizes h2{margin-bottom:8px}.pl-prize{margin-top:9px}.pl-note{display:none}}
@media(max-width:760px){.pl-nav{padding:10px 16px}.pl-nav a{font-size:12px}.pl-nav>span{font-size:13px}.pl-main{padding:12px 14px 8px;gap:10px}.pl-heading h1{font-size:27px}.pl-heading>p{font-size:11px;max-width:140px;text-align:right;line-height:1.4}.pl-game{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto;gap:12px}.pl-stage{padding-right:6px;padding-bottom:7px}.pl-cabinet{padding:6px;border-radius:17px}.pl-board-top{flex-basis:27px;font-size:8px;padding:0 10px;border-radius:11px 11px 0 0}.pl-launcher{width:52px}.pl-launcher i{top:5px;width:11px;height:11px;left:calc(50% - 5.5px)}.pl-frame{padding:4px}.pl-frame:after{inset:4px}.pl-board-base{flex-basis:18px;font-size:6px;padding:0 8px}.pl-cabinet:before,.pl-cabinet:after{top:46px;bottom:29px;width:1px}.pl-cabinet:before{left:3px}.pl-cabinet:after{right:3px}.pl-panel{display:grid;grid-template-columns:100px minmax(0,1fr);gap:8px 10px}.pl-stats{gap:6px;align-self:stretch}.pl-stats>div{padding:8px 5px;text-align:center;border-radius:9px;display:flex;flex-direction:column;justify-content:center}.pl-stats span{font-size:9px}.pl-stats strong{font-size:20px}.pl-controls{padding:0;background:none;border:0;display:flex;flex-direction:column}.pl-status{font-size:11px;min-height:14px;margin-bottom:6px;line-height:1.3}.pl-drop{min-height:40px;font-size:13px;padding:8px}.pl-selected{font-size:9px;margin-top:8px}.pl-prizes{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding-top:8px}.pl-prizes h2{grid-column:1/-1;margin:0;font-size:9px;letter-spacing:.1em}.pl-prize{gap:6px;margin:0;align-items:center}.pl-prize>span{width:26px;height:30px;font-size:18px;border:0;background:none}.pl-prize strong{font-size:10px;line-height:1.25}.pl-prize small{font-size:9px;margin-top:3px}.pl-note{display:none}.pl-footer{font-size:8px;gap:6px;letter-spacing:0}}
@media(prefers-reduced-motion:reduce){.pl-page *{transition:none!important}}
`;
