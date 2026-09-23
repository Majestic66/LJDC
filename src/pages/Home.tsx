import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Sparkles, Dice5, CircleDot } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { CasinoNav, CasinoFooter, TiltCard } from '../components/CasinoLayout';
export default function Home(){
 const reduced=useReducedMotion();
 return <div className="lc-page lc-home"><CasinoNav/><main>
  <section className="lc-hero">
   <motion.div className="lc-hero-copy" initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
    <p className="lc-eyebrow"><span/> BOWLING DE GRAMONT</p><h1>À vous<br/>de <em>jouer.</em></h1>
    <p className="lc-intro">Un tour de rouleaux, une bille qui rebondit, une boîte surprise. Bienvenue dans les jeux de Carlos.</p>
    <div className="lc-hero-actions"><Link className="lc-button lc-button-gold" to="/jeux/enfants">Jeux enfants <ArrowRight size={18}/></Link><Link className="lc-button lc-button-outline" to="/jeux/adultes">Jeux adultes <ArrowRight size={18}/></Link></div>
    <p className="lc-hero-footnote"><span aria-hidden="true">♠ ♦ ♣ ♥</span> Une partie, plein de possibilités.</p>
   </motion.div>
   <div className="lc-deck" aria-hidden="true"><div className="lc-deck-orbit"/><div className="lc-deck-floor"/>
    <div className="lc-deck-card lc-deck-back"><img src="/images/games/enfants/boites-carlos.webp" alt=""/><span>LA SURPRISE<small>Les Boîtes de Carlos</small></span></div>
    <div className="lc-deck-card lc-deck-middle"><img src="/images/games/enfants/plinko.webp" alt=""/><span>LE REBOND<small>Plinko</small></span></div>
    <div className="lc-deck-card lc-deck-front"><img src="/images/games/adultes/bowling-slots.webp" alt=""/><span>LE GRAND JEU<small>Bowling Slots</small></span></div>
    <div className="lc-chip lc-chip-gold"><Crown size={29}/></div><div className="lc-chip lc-chip-red">♦</div><div className="lc-deck-caption">LES JEUX DE CARLOS <span>★</span> GRAMONT</div>
   </div>
  </section>
  <div className="lc-ribbon"><span>♠</span> CASINO <span>♦</span> BOWLING <span>♣</span> SURPRISES <span>♥</span> CARLOS</div>
  <section className="lc-universes"><div className="lc-section-heading"><div><p className="lc-eyebrow">CHOISISSEZ VOTRE UNIVERS</p><h2>La partie commence ici.</h2></div><p>Les mêmes sensations.<br/>Des surprises pour chacun.</p></div>
   <div className="lc-category-grid">
    <TiltCard className="lc-category lc-category-junior"><Link to="/jeux/enfants"><span className="lc-category-icon"><Sparkles size={22}/></span><div><p>POUR LES PETITS CHAMPIONS</p><h3>Jeux enfants</h3><span>Bonbons, goodies et pochettes surprises.</span></div><span className="lc-category-cta">Découvrir les jeux <ArrowRight size={19}/></span><b className="lc-category-suit" aria-hidden="true">♣</b></Link></TiltCard>
    <TiltCard className="lc-category lc-category-adults"><Link to="/jeux/adultes"><span className="lc-category-icon"><Crown size={22}/></span><div><p>L’ESPRIT CASINO</p><h3>Jeux adultes</h3><span>Vos jeux préférés, en version adultes.</span></div><span className="lc-category-cta">Entrer dans le jeu <ArrowRight size={19}/></span><b className="lc-category-suit" aria-hidden="true">♦</b></Link></TiltCard>
   </div>
  </section>
  <section className="lc-experience"><div><p className="lc-eyebrow">LES JEUX DE CARLOS</p><h2>Le plaisir du jeu.<br/>L’esprit du bowling.</h2><p>À partager au Bowling de Gramont, entre deux strikes ou simplement pour tenter votre chance.</p></div><div className="lc-experience-items"><span><Dice5/><strong>Des jeux à découvrir</strong><small>Rouleaux, rebonds et surprises.</small></span><span><Crown/><strong>Une ambiance casino</strong><small>L’or, les lumières, le plaisir de jouer.</small></span><span><CircleDot/><strong>Chacun sa partie</strong><small>Un espace enfants et un espace adultes.</small></span></div></section>
 </main><CasinoFooter/></div>;
}
