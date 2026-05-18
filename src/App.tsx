import { useGameStore } from './store/game-store';
import Menu from './ui/pages/Menu';
import Game from './ui/pages/Game';

export default function App() {
  const state = useGameStore((s) => s.state);
  return (
    <div className="min-h-screen w-full">
      {state ? <Game /> : <Menu />}
    </div>
  );
}
