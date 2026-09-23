import { FC, ReactNode, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Crown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import '../casino.css';

export const CasinoNav: FC = () => { const {pathname}=useLocation(); useEffect(()=>{window.scrollTo(0,0);},[pathname]); return <header className="lc-nav"><Link className="lc-logo" to="/" aria-label="Les Jeux de Carlos — accueil"><span><Crown size={22}/></span><div>L.J.D.C<small>LES JEUX DE CARLOS</small></div></Link><nav aria-label="Navigation principale"><NavLink to="/" end>Accueil</NavLink><NavLink to="/jeux/enfants">Enfants</NavLink><NavLink to="/jeux/adultes">Adultes</NavLink></nav><span className="lc-address">Bowling de Gramont</span></header>; };
export const CasinoFooter: FC = () => <footer className="lc-footer"><Link to="/" className="lc-footer-brand"><Crown size={18}/> Les Jeux de Carlos</Link><span>© 2026 · Bowling de Gramont</span><a href="https://rosevaldesign.com/" target="_blank" rel="noopener noreferrer">Créé par Roseval Design <ArrowUpRight size={12}/></a></footer>;
export const TiltCard: FC<{ children: ReactNode; className?: string }> = ({children,className=''}) => {
  const reduced=useReducedMotion();
  const x=useMotionValue(0),y=useMotionValue(0);
  const rx=useSpring(x,{stiffness:180,damping:24}),ry=useSpring(y,{stiffness:180,damping:24});
  return <motion.div className={'lc-tilt '+className} style={{rotateX:rx,rotateY:ry,transformPerspective:1000}}
    onPointerMove={e=>{if(reduced||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();x.set(-((e.clientY-r.top)/r.height-.5)*7);y.set(((e.clientX-r.left)/r.width-.5)*9);}}
    onPointerLeave={()=>{x.set(0);y.set(0);}} onBlur={()=>{x.set(0);y.set(0);}}>{children}</motion.div>;
};
type Game = {id:number;title:string;description:string;image:string;link:string};
export const GameCard: FC<{game:Game;index:number}> = ({game,index}) => {
  const type=game.link.includes('bowling-slots')?'slots':game.link.includes('plinko')?'plinko':game.link.includes('boites-carlos')?'boxes':'scratch';
  const descriptions={slots:'Trois rouleaux. Trois symboles identiques. À vous de jouer.',plinko:'Une bille, des rebonds et 12 cases pour tenter votre chance.',boxes:'15 coffrets à ouvrir. Lequel cache votre surprise ?',scratch:'Grattez votre ticket et découvrez votre lot.'};
  const titles={slots:'Bowling Slots',plinko:'Plinko',boxes:'Les Boîtes de Carlos',scratch:'Ticket à gratter'};
  const content=<><div className="lc-game-art"><img src={game.image} alt=""/><span className="lc-card-index">0{index+1}</span><span className="lc-card-suit" aria-hidden="true">{['♠','♦','♣','♥'][index%4]}</span></div><div className="lc-game-copy"><span className="lc-game-type">{type==='slots'?'LES ROULEAUX DE LA CHANCE':type==='plinko'?'LAISSEZ FAIRE LES REBONDS':type==='boxes'?'OUVREZ LA SURPRISE':'À VOUS DE GRATTER'}</span><h2>{titles[type]}</h2><p>{descriptions[type]}</p><span className="lc-play">Jouer {game.link.startsWith('/')?<ArrowRight size={17}/>:<ArrowUpRight size={17}/>}</span></div></>;
  return <TiltCard className={'lc-game-card lc-game-'+type}>{game.link.startsWith('/')?<Link className="lc-game-link" to={game.link}>{content}</Link>:<a className="lc-game-link" href={game.link} target="_blank" rel="noopener noreferrer" aria-label={game.title+' — jouer dans un nouvel onglet'}>{content}</a>}</TiltCard>;
};
