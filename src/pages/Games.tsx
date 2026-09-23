import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { gamesData } from '../data';
import { CasinoNav, CasinoFooter, GameCard } from '../components/CasinoLayout';
export default function Games(){
 const {category}=useParams<{category:string}>();
 const adults=category==='adultes';
 const games=adults?gamesData.adultes:gamesData.enfants;
 return <div className={'lc-page lc-games '+(adults?'lc-adults':'lc-junior')}><CasinoNav/><main className="lc-games-main">
  <Link to="/" className="lc-back"><ArrowLeft size={15}/> Tous les univers</Link>
  <header className="lc-games-heading"><div><p className="lc-eyebrow">{adults?'L’ESPRIT CASINO':'POUR LES PETITS CHAMPIONS'}</p><h1>Jeux <em>{adults?'adultes':'enfants'}</em><span aria-hidden="true">{adults?'♦':'♣'}</span></h1><p>{adults?'Choisissez votre jeu. Faites place à la chance.':'Un jeu, un peu de chance, et peut-être une surprise !'}</p></div><nav className="lc-category-switch" aria-label="Choisir une catégorie"><Link to="/jeux/enfants" aria-current={!adults?'page':undefined}>Enfants</Link><Link to="/jeux/adultes" aria-current={adults?'page':undefined}>Adultes</Link></nav></header>
  <div className={'lc-games-grid '+(adults?'lc-three':'lc-four')}>{games.map((game,index)=><GameCard key={game.id} game={game} index={index}/>)}</div>
  <div className="lc-lobby-bottom"><span><span aria-hidden="true">♠ ♦ ♣ ♥</span> Faites vos jeux.</span><p>{games.length} jeux à découvrir · Bowling de Gramont</p></div>
 </main><CasinoFooter/></div>;
}
