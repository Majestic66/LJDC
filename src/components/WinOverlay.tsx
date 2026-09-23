import { useEffect, useRef, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import "../casino.css";

interface Props {
  show: boolean;
  emoji: string;
  label: string;
  color: string;
  glow: string;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  "#d4af37", "#f5d485", "#ffe066",
  "#c41e3a", "#ff6b6b", "#ff9f9f",
  "#c8a8ff", "#a78bfa", "#7dd3fc",
  "#6ee7b7", "#ffffff",
];

export default function WinOverlay({ show, emoji, label, color, glow, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!show) return;
    const previous = document.activeElement as HTMLElement | null;
    buttonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key === 'Tab') { event.preventDefault(); buttonRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [show]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!show || reducedMotion) { cancelAnimationFrame(rafRef.current); return; }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;

    const particles = Array.from({ length: 160 }, () => ({
      x:        Math.random() * canvas.width,
      y:        -30 - Math.random() * 200,
      vx:       (Math.random() - 0.5) * 3.5,
      vy:       2.5 + Math.random() * 3.5,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w:        7 + Math.random() * 9,
      h:        4 + Math.random() * 7,
      rot:      Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.14,
      wave:     Math.random() * Math.PI * 2,
      waveAmp:  0.6 + Math.random() * 1.0,
      waveSpd:  0.035 + Math.random() * 0.05,
      circle:   Math.random() < 0.25,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y    += p.vy;
        p.x    += p.vx + Math.sin(p.wave) * p.waveAmp;
        p.rot  += p.rotSpeed;
        p.wave += p.waveSpd;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.88;
        if (p.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [show, reducedMotion]);

  return <AnimatePresence>{show && <motion.div key="overlay" className="lc-win-overlay"
    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion?0:.2}} onClick={onClose}>
    {!reducedMotion && <canvas ref={canvasRef} className="lc-win-confetti" aria-hidden="true"/>}
    <motion.div role="dialog" aria-modal="true" aria-labelledby={titleId} className="lc-win-card"
      initial={reducedMotion?false:{opacity:0,y:25,rotateX:8,scale:.94}} animate={{opacity:1,y:0,rotateX:0,scale:1}}
      exit={{opacity:0,y:reducedMotion?0:12}} transition={{type:'spring',stiffness:220,damping:24}}
      style={{borderColor:color+'66',boxShadow:'0 35px 90px #000b, 0 0 60px '+glow.replace(/0\.\d+\)/,'0.12)')}}
      onClick={e=>e.stopPropagation()}>
      <div className="lc-win-suits" aria-hidden="true">♠ <span>♥</span> ♦ ♣</div>
      <div className="lc-win-medal" style={{background:'radial-gradient(circle at 35% 25%, #fff4, '+color+'22 58%, #0004)'}} aria-hidden="true"><span>{emoji}</span></div>
      <p className="lc-win-eyebrow">BIEN JOUÉ !</p><h2 id={titleId}>{label}</h2><p className="lc-win-message">La chance était de votre côté.</p>
      <button ref={buttonRef} type="button" onClick={onClose}>Continuer à jouer <span aria-hidden="true">→</span></button>
      <p className="lc-win-signature">LES JEUX DE CARLOS · GRAMONT</p>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
