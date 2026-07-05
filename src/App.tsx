import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import AuthDialog, { AuthMode } from './components/AuthDialog';
import {
  User,
  ScoreStats,
  getToken,
  setToken,
  fetchMe,
  fetchScores,
  saveScore,
  signOut,
} from './lib/api';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import keyImg from './assets/key.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

type Session =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'user'; user: User };

export default function App() {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [stats, setStats] = useState<ScoreStats | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const scoreSaved = useRef(false);

  const initializeGame = () => {
    // Randomly assign treasure to one box
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));

    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    scoreSaved.current = false;
  };

  // Initialize game automatically when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  // Restore session from a stored token
  useEffect(() => {
    if (!getToken()) {
      setSession({ status: 'guest' });
      return;
    }
    fetchMe()
      .then(({ user }) => setSession({ status: 'user', user }))
      .catch(() => {
        setToken(null);
        setSession({ status: 'guest' });
      });
  }, []);

  const refreshStats = () => {
    fetchScores()
      .then(({ stats }) => setStats(stats))
      .catch(() => setStats(null));
  };

  useEffect(() => {
    if (session.status === 'user') {
      refreshStats();
    } else {
      setStats(null);
    }
  }, [session.status]);

  // Persist the final score for signed-in players
  useEffect(() => {
    if (!gameEnded || session.status !== 'user' || scoreSaved.current) return;
    scoreSaved.current = true;
    const treasureFound = boxes.some(box => box.isOpen && box.hasTreasure);
    saveScore(score, treasureFound)
      .then(refreshStats)
      .catch(() => {
        scoreSaved.current = false;
      });
  }, [gameEnded, session.status]);

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpen) return;

    new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          const newScore = box.hasTreasure ? score + 100 : score - 50;
          setScore(newScore);
          return { ...box, isOpen: true };
        }
        return box;
      });

      // Check if treasure is found or all boxes are opened
      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }

      return updatedBoxes;
    });
  };

  const resetGame = () => {
    initializeGame();
  };

  const handleSignOut = () => {
    signOut().catch(() => {});
    setToken(null);
    setSession({ status: 'guest' });
    initializeGame();
  };

  const handleSignedIn = (user: User) => {
    setSession({ status: 'user', user });
    setAuthOpen(false);
    initializeGame();
  };

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  if (session.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <p className="text-amber-800 text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8 pt-24">
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-3 bg-amber-50/80 backdrop-blur-sm border-b border-amber-200/70">
        <div className="text-amber-900 font-semibold">🏴‍☠️ Treasure Hunt</div>
        <div className="flex items-center gap-3">
          {session.status === 'user' ? (
            <>
              <div className="text-amber-900 text-sm">
                ⚓ <span className="font-bold">{session.user.username}</span>
                {stats && (
                  <span className="text-amber-700 ml-3 hidden sm:inline">
                    Games: {stats.gamesPlayed} | Total: ${stats.totalScore} | Best: ${stats.bestScore}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-amber-500 text-amber-800 hover:bg-amber-200"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <span className="text-amber-700 text-sm hidden sm:inline">
                👻 Guest — scores not saved
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth('signin')}
                className="text-amber-800 hover:bg-amber-200"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => openAuth('signup')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </header>

      <AuthDialog
        open={authOpen}
        mode={authMode}
        onOpenChange={setAuthOpen}
        onModeChange={setAuthMode}
        onSignedIn={handleSignedIn}
      />

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$100 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 shadow-2xl ${
              score > 0
                ? 'bg-gradient-to-br from-yellow-300 to-green-400 border-yellow-300 shadow-green-300/60'
                : score === 0
                ? 'bg-gradient-to-br from-yellow-200 to-orange-300 border-orange-300 shadow-orange-300/60'
                : 'bg-gradient-to-br from-red-400 to-red-700 border-red-400 shadow-red-400/60'
            }`}
          >
            <div className="text-3xl leading-none mb-1">
              {score > 0 ? '🏆' : score === 0 ? '🤝' : '💀'}
            </div>
            <div className={`text-base font-black tracking-widest uppercase ${
              score > 0 ? 'text-green-900' : score === 0 ? 'text-orange-900' : 'text-white'
            }`}>
              {score > 0 ? 'Win' : score === 0 ? 'Tie' : 'Loss'}
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                className="flex flex-col items-center"
                style={{ cursor: box.isOpen ? 'default' : `url(${keyImg}) 4 4, pointer` }}
                whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
                whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
                onClick={() => openBox(box.id)}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: box.isOpen ? 180 : 0,
                    scale: box.isOpen ? 1.1 : 1
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <img
                    src={box.isOpen
                      ? (box.hasTreasure ? treasureChest : skeletonChest)
                      : closedChest
                    }
                    alt={box.isOpen
                      ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                      : "Treasure Chest"
                    }
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />

                  {box.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      {box.hasTreasure ? (
                        <div className="text-2xl animate-bounce">✨💰✨</div>
                      ) : (
                        <div className="text-2xl animate-pulse">💀👻💀</div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <div className="mt-4 text-center">
                  {box.isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className={`text-lg p-2 rounded-lg ${
                        box.hasTreasure
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {box.hasTreasure ? '+$100' : '-$50'}
                    </motion.div>
                  ) : (
                    <div className="text-amber-700 p-2">
                      Click to open!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {gameEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
                <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
                <p className="text-lg text-amber-800">
                  Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${score}
                  </span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {boxes.some(box => box.isOpen && box.hasTreasure)
                    ? 'Treasure found! Well done, treasure hunter! 🎉'
                    : 'No treasure found this time! Better luck next time! 💀'}
                </p>
                <p className="text-xs text-amber-500 mt-1">
                  {session.status === 'user'
                    ? 'Score saved to your account ✓'
                    : 'Playing as guest — score not saved'}
                </p>
              </div>

              <Button
                onClick={resetGame}
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Play Again
              </Button>
            </motion.div>
          )}
    </div>
  );
}
