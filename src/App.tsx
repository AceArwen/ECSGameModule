import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Menu from './Routes/Menu';
import GameScreen from './Routes/GameScreen';
import Settings from './Routes/Settings';
import { ECSProvider } from './Context/ECSContext';
import { GameConsoleProvider } from './Context/GameConsoleContext';

export default function App() {
  return (
    <GameConsoleProvider>
      <ECSProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/gamescreen" element={<GameScreen />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </ECSProvider>
    </GameConsoleProvider>
  );
}