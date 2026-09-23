import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (!show) { cancelAnimationFrame(rafRef.current); return; }

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
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center"
          style={{ background: "rgba(7,9,18,0.82)" }}
          onClick={onClose}
        >
          {/* Confetti canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Prize card */}
          <motion.div
            key="card"
            initial={{ scale: 0.45, opacity: 0, y: 60 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.7,  opacity: 0, y: 30 }}
            transition={{ type: "spring", bounce: 0.48, duration: 0.55 }}
            className="relative z-10 text-center px-10 py-10 rounded-2xl mx-4"
            style={{
              background: "linear-gradient(145deg, #12162a, #0b0e1e)",
              border: `1.5px solid ${color}55`,
              boxShadow: `0 0 80px ${glow}, 0 0 200px ${glow}, 0 28px 70px rgba(0,0,0,0.9)`,
              maxWidth: 360,
              width: "100%",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Emoji — bounces + wiggles */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1,  rotate: 0   }}
              transition={{ type: "spring", bounce: 0.65, delay: 0.18 }}
              className="leading-none mb-5"
              style={{ fontSize: 96 }}
            >
              <motion.span
                animate={{ rotate: [-6, 6, -6], scale: [1, 1.12, 1] }}
                transition={{ duration: 0.7, repeat: 3, delay: 0.3 }}
                style={{ display: "inline-block" }}
              >
                {emoji}
              </motion.span>
            </motion.div>

            {/* Tag */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="font-heading text-[10px] tracking-[0.45em] uppercase mb-2"
              style={{ color }}
            >
              ✨ Félicitations !
            </motion.p>

            {/* Prize name */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="font-heading text-[#f4f2fa] mb-6"
              style={{ fontWeight: 800, fontSize: "clamp(1.4rem, 5vw, 2rem)" }}
            >
              {label}
            </motion.p>

            {/* Divider */}
            <div
              className="mb-6"
              style={{
                height: 1,
                background: `linear-gradient(90deg, transparent, ${color}70, transparent)`,
              }}
            />

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              onClick={onClose}
              className="btn-gold px-8 py-3 text-xs rounded-lg tracking-widest"
            >
              Continuer
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
