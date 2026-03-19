import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Games from "./pages/Games";
import BowlingSlots from "./pages/BowlingSlots";
import Plinko from "./pages/Plinko";
import BoitesCarlos from "./pages/BoitesCarlos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jeux/:category" element={<Games />} />
        <Route path="/bowling-slots" element={<BowlingSlots />} />
        <Route path="/plinko" element={<Plinko />} />
        <Route path="/boites-carlos" element={<BoitesCarlos />} />
      </Routes>
    </BrowserRouter>
  );
}
