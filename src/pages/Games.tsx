import { motion } from "motion/react";
import { ArrowLeft, Play, Crown } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { gamesData } from "../data";

export default function Games() {
  const { category } = useParams<{ category: string }>();
  const isAdults = category === "adultes";
  const games = isAdults ? gamesData.adultes : gamesData.enfants;

  const suitPair  = isAdults ? ["♥", "♦"] : ["♣", "♠"];
  const suitColor = isAdults ? "text-[#c41e3a]/60" : "text-[#d4af37]/60";
  const cardSuit  = isAdults ? "♦" : "♣";
  const dividerColor = isAdults
    ? "bg-gradient-to-r from-transparent via-[#c41e3a]/50 to-transparent"
    : "bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent";

  return (
    <div className="min-h-screen casino-bg text-[#f5e6c8] overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-[#d4af37]/25 backdrop-blur-lg bg-[#070912]/85 flex justify-between items-center px-6 py-4 md:px-14">
        <Link
          to="/"
          className="font-heading flex items-center gap-3 text-[#d4af37] hover:text-[#f5d485] transition-colors text-xs tracking-[0.25em] uppercase"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Retour
        </Link>
        <div className="font-display text-xl md:text-2xl text-[#d4af37] flex items-center gap-2">
          <Crown size={18} />
          L.J.D.C
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="relative py-4 md:py-10 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-[#d4af37]/5 blur-[110px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative z-10"
        >
          {/* Suits */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-16 md:w-24 bg-linear-to-r from-transparent to-[#d4af37]/50" />
            <div className={`flex gap-4 text-2xl ${suitColor}`}>
              {suitPair.map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <div className="h-px w-16 md:w-24 bg-linear-to-l from-transparent to-[#d4af37]/50" />
          </div>

          <h1
            className="font-heading leading-none mb-3"
            style={{ fontSize: "clamp(2rem, 8vw, 6rem)", fontWeight: 900 }}
          >
            <span className="text-[#f5e6c8]">Jeux </span>
            <span className="gold-gradient-text">
              {isAdults ? "Adultes" : "Enfants"}
            </span>
          </h1>

          <div className="gold-divider w-40 mx-auto mb-2" />
          <p className="hidden md:block font-heading text-[#f5e6c8]/35 tracking-[0.35em] text-xs uppercase">
            {isAdults ? "Section VIP — Joueurs Chevronnés" : "Section Junior — Pour les Champions"}
          </p>
        </motion.div>
      </header>

      {/* ── Games Grid ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.12, duration: 0.55 }}
              className="casino-card rounded-sm overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-32 md:h-44 overflow-hidden">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0b1120] via-transparent to-transparent" />
                <span className={`absolute top-3 right-4 text-xl ${suitColor} pointer-events-none`}>
                  {cardSuit}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 md:p-5">
                <div className={`h-px ${dividerColor} mb-3`} />
                <h3
                  className="font-heading text-[#f5e6c8] text-base md:text-xl mb-1.5"
                  style={{ fontWeight: 700 }}
                >
                  {game.title}
                </h3>
                <p className="text-[#f5e6c8]/45 text-xs md:text-sm leading-relaxed mb-4">
                  {game.description}
                </p>
                {game.link.startsWith('/') ? (
                  <Link
                    to={game.link}
                    className="btn-gold w-full flex items-center justify-center gap-3 px-6 py-3 text-xs rounded-sm"
                  >
                    Jouer <Play fill="currentColor" size={12} />
                  </Link>
                ) : (
                  <a
                    href={game.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold w-full flex items-center justify-center gap-3 px-6 py-3 text-xs rounded-sm"
                  >
                    Jouer <Play fill="currentColor" size={12} />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="max-w-7xl mx-auto px-4 md:px-14 mt-6 mb-4 text-center">
        <div className="gold-divider" />
        <div className="flex justify-center gap-8 text-[#d4af37]/18 text-3xl mt-8">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>
      </div>

    </div>
  );
}
