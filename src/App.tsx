import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Menu from './Routes/Menu';
import GameScreen from './Routes/GameScreen';
import Settings from './Routes/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/gamescreen" element={<GameScreen />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}