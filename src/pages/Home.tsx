import { motion, useScroll, useTransform } from "motion/react";
import { Crown, ChevronRight, Gem, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

const PARTICLES = [
  { left: "8%",  top: "14%", size: 5,  delay: 0,   dur: 7  },
  { left: "23%", top: "78%", size: 4,  delay: 1.5, dur: 6  },
  { left: "45%", top: "32%", size: 6,  delay: 0.8, dur: 8  },
  { left: "67%", top: "56%", size: 4,  delay: 2.2, dur: 5  },
  { left: "82%", top: "22%", size: 5,  delay: 0.4, dur: 9  },
  { left: "15%", top: "65%", size: 3,  delay: 3,   dur: 7  },
  { left: "91%", top: "70%", size: 4,  delay: 1,   dur: 6  },
  { left: "55%", top: "88%", size: 3,  delay: 2.5, dur: 8  },
  { left: "35%", top: "9%",  size: 5,  delay: 0.2, dur: 10 },
  { left: "75%", top: "42%", size: 4,  delay: 1.8, dur: 7  },
  { left: "3%",  top: "45%", size: 3,  delay: 2.8, dur: 6  },
  { left: "60%", top: "5%",  size: 5,  delay: 0.6, dur: 9  },
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

  return (
    <div ref={containerRef} className="min-h-screen casino-bg text-[#f4f2fa] overflow-hidden">

      {/* Floating ambient particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full select-none"
            style={{
              left: p.left, top: p.top,
              width: p.size, height: p.size,
              background: "rgba(212,175,55,0.35)",
            }}
            animate={{ y: [0, -24, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-[#ffffff14] backdrop-blur-lg bg-[#090c16]/85 flex justify-between items-center px-6 py-4 md:px-14">
        <div className="font-display text-lg md:text-xl text-[#efd29c] tracking-[0.14em] font-semibold flex items-center gap-3">
          <Crown size={20} className="text-[#efd29c]" />
          L.J.D.C
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8 font-heading text-xs tracking-[0.2em] uppercase">
            <Link to="/" className="text-[#a8abbe] hover:text-[#efd29c] transition-colors">Accueil</Link>
            <Link to="/jeux/enfants" className="text-[#a8abbe] hover:text-[#efd29c] transition-colors">Enfants</Link>
            <Link to="/jeux/adultes" className="text-[#a8abbe] hover:text-[#efd29c] transition-colors">Adultes</Link>
          </div>
          <Link to="/jeux/adultes" className="btn-gold px-5 py-2 text-xs rounded-lg">
            Jouer Maintenant
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 pt-20 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/4 w-125 h-125 rounded-full bg-[#d4af37]/4 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full bg-[#8b0000]/6 blur-[100px] pointer-events-none" />

        <motion.div style={{ y: heroY }} className="relative z-10 flex flex-col items-center text-center">
          {/* Pre-title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="gold-divider w-12 md:w-28" />
            <span className="font-heading text-[10px] md:text-xs tracking-[0.4em] text-[#efd29c]/70 uppercase">
              Bowling de Gramont
            </span>
            <div className="gold-divider w-12 md:w-28" />
          </motion.div>

          {/* Icon row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex gap-6 md:gap-8 mb-6 text-[#efd29c]/60"
          >
            {[Crown, Gem, Sparkles].map((Icon, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
              >
                <Icon size={20} />
              </motion.span>
            ))}
          </motion.div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          >
            <h1
              className="font-display leading-[0.9]"
              style={{ fontSize: "clamp(3rem, 10vw, 8rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              <span className="gold-gradient-text">Les Jeux</span>
              <br />
              <span className="text-[#f4f2fa]">De </span>
              <span className="gold-gradient-text">Carlos</span>
            </h1>
          </motion.div>

          {/* Subtitle + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-6 mt-10"
          >
            <div className="gold-divider w-40 md:w-72" />
            <p className="font-heading text-[#a8abbe] text-sm md:text-base tracking-[0.3em] uppercase">
              L'Excellence du Divertissement
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link to="/jeux/enfants" className="btn-gold px-8 py-4 text-xs tracking-widest rounded-lg">
                Explorer les Jeux
              </Link>
              <Link
                to="/jeux/adultes"
                className="font-heading px-8 py-4 text-xs tracking-widest uppercase border border-[#ffffff20] text-[#efd29c] hover:bg-[#efd29c]/10 hover:border-[#efd29c]/40 transition-colors rounded-lg"
              >
                Section VIP
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#a8abbe]"
        >
          <span className="font-heading text-[9px] tracking-[0.4em] uppercase">Découvrir</span>
          <div className="w-px h-10 bg-linear-to-b from-[#efd29c]/40 to-transparent" />
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="relative w-full overflow-hidden border-y border-[#ffffff14] bg-[#0b0e18] py-4">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap font-heading text-xs md:text-sm tracking-[0.3em] uppercase text-[#a8abbe]"
        >
          {Array(24).fill(null).map((_, i) => (
            <span key={i} className="px-8">
              {i % 2 === 0 ? "Bowling de Gramont" : "Les Jeux de Carlos — Expérience VIP"}
            </span>
          ))}
        </motion.div>
        <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-[#0b0e18] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-[#0b0e18] to-transparent pointer-events-none" />
      </div>

      {/* ── Categories ── */}
      <section className="py-10 md:py-20 px-4 md:px-14 max-w-350 mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-14"
        >
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="gold-divider w-16 md:w-28" />
            <Gem size={16} className="text-[#efd29c]" />
            <div className="gold-divider w-16 md:w-28" />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl text-[#f4f2fa] mb-3" style={{ fontWeight: 700 }}>
            Choisissez Votre Table
          </h2>
          <p className="font-heading text-[#a8abbe] tracking-[0.3em] text-xs uppercase">
            Sélectionnez votre expérience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">

          {/* ── Enfants card ── */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, type: "spring" }}
          >
            <Link
              to="/jeux/enfants"
              className="block relative overflow-hidden rounded-2xl transition-all duration-500 group"
              style={{
                background: "linear-gradient(145deg, #ffffff05, #ffffff01), #0f1320",
                border: "1px solid #ffffff16",
              }}
            >
              <div className="absolute inset-0 bg-[#efd29c]/0 group-hover:bg-[#efd29c]/4 transition-all duration-500" />

              <div className="relative z-10 p-6 md:p-10 min-h-64 flex flex-col justify-between">
                <div>
                  <p className="font-heading text-[#bc9b64] text-[10px] tracking-[0.4em] uppercase mb-2">Section</p>
                  <h3 className="font-heading text-[#f4f2fa] leading-none mb-4" style={{ fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 700 }}>
                    Jeux<br />
                    <span className="gold-gradient-text">Enfants</span>
                  </h3>
                  <div className="gold-divider mb-4" />
                  <p className="text-[#a8abbe] text-sm md:text-base leading-relaxed max-w-sm">
                    Des aventures féeriques pour les petits champions. Un monde de magie et d'émerveillement les attend.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[#efd29c] font-heading text-xs tracking-[0.2em] uppercase mt-6 group-hover:gap-5 transition-all">
                  <span>Découvrir</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* ── Adultes card ── */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.15, type: "spring" }}
          >
            <Link
              to="/jeux/adultes"
              className="block relative overflow-hidden rounded-2xl transition-all duration-500 group"
              style={{
                background: "linear-gradient(145deg, #1a0d10, #120a0d), #0f1320",
                border: "1px solid #ffffff16",
              }}
            >
              <div className="absolute inset-0 bg-[#c41e3a]/0 group-hover:bg-[#c41e3a]/4 transition-all duration-500" />
              <div className="absolute bottom-0 right-0 w-52 h-52 bg-[#c41e3a]/8 blur-[60px] rounded-full pointer-events-none" />

              <div className="relative z-10 p-6 md:p-10 min-h-64 flex flex-col justify-between">
                <div>
                  <p className="font-heading text-[#bc9b64] text-[10px] tracking-[0.4em] uppercase mb-2">Section VIP</p>
                  <h3 className="font-heading text-[#f4f2fa] leading-none mb-4" style={{ fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 700 }}>
                    Jeux<br />
                    <span className="gold-gradient-text">Adultes</span>
                  </h3>
                  <div className="h-px bg-linear-to-r from-transparent via-[#c41e3a]/40 to-transparent mb-4" />
                  <p className="text-[#a8abbe] text-sm md:text-base leading-relaxed max-w-sm">
                    Sensations fortes et défis ultimes pour les joueurs aguerris. Êtes-vous prêt à relever le défi ?
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[#efd29c] font-heading text-xs tracking-[0.2em] uppercase mt-6 group-hover:gap-5 transition-all">
                  <span>Accéder</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          </motion.div>

        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 felt-panel" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="gold-divider w-12 md:w-20" />
              <Crown size={20} className="text-[#efd29c]" />
              <div className="gold-divider w-12 md:w-20" />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl text-[#f4f2fa] mb-4" style={{ fontWeight: 700 }}>
              L'Expérience <span className="gold-gradient-text">Carlos</span>
            </h2>
            <p className="text-[#a8abbe] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-12">
              Rejoignez-nous au Bowling de Gramont pour une expérience de divertissement d'exception, pour toute la famille dans un cadre unique.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { Icon: Sparkles, title: "Jeux Exclusifs",  desc: "Une sélection premium d'activités soigneusement choisies" },
                { Icon: Crown,    title: "Ambiance VIP",    desc: "Un cadre luxueux et une atmosphère incomparable" },
                { Icon: Gem,      title: "Pour Tous",        desc: "Enfants et adultes — tout le monde est le bienvenu" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="casino-card p-8 rounded-2xl text-center"
                >
                  <item.Icon size={26} className="text-[#efd29c] mx-auto mb-4" />
                  <h3 className="font-heading text-[#efd29c] text-sm mb-2" style={{ fontWeight: 600 }}>{item.title}</h3>
                  <p className="text-[#a8abbe] text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#070912] border-t border-[#ffffff14] py-16 px-4 relative overflow-hidden">
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-175 h-45 bg-[#efd29c]/4 blur-[80px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="flex justify-center mb-8 text-[#efd29c]/50">
            <Crown size={32} />
          </div>
          <div className="font-display text-3xl md:text-4xl text-[#efd29c] mb-4 font-bold tracking-[0.14em]">L.J.D.C</div>
          <div className="gold-divider w-48 mx-auto mb-4" />
          <p className="font-heading text-[#a8abbe] tracking-[0.3em] text-xs uppercase">
            Bowling de Gramont · Les Jeux de Carlos
          </p>
          <div className="gold-divider w-full mt-10 mb-6" />
          <p className="text-[#747d98] text-xs">
            © 2026 Les Jeux de Carlos — Bowling de Gramont. Tous droits réservés.
          </p>
          <p className="text-[#747d98] text-xs mt-2">
            Site créé par{" "}
            <a
              href="https://rosevaldesign.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#efd29c]/60 hover:text-[#efd29c] transition-colors underline underline-offset-2"
            >
              Roseval Design
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}
