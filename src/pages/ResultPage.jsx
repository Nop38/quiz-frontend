import { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../images/logo.png";
import CocktailGlass from "../components/CocktailGlass";
import Fireworks from "../components/Fireworks";
import { useState } from "react";


const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

export default function ResultPage({ state }) {
  const rawClassement = state.classement ?? [];
  const players = state.players ?? [];

  // Classement décroissant (meilleur en premier)
  const classementDesc = useMemo(() => {
    if (rawClassement.length) return rawClassement;
    return [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [rawClassement, players]);

  const topScore = classementDesc.reduce((m, p) => Math.max(m, p.score || 0), 0);

  // Ordre d’anim : du dernier au premier
  const ordreAnim = useMemo(
    () =>
      classementDesc
        .map((p, i) => ({ ...p, rank: i }))
        .sort((a, b) => (a.score || 0) - (b.score || 0)),
    [classementDesc]
  );

  const [currentIdx, setCurrentIdx] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const fireTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (fireTimeout.current) clearTimeout(fireTimeout.current);
    };
  }, []);

  const handleDone = () => {
    setCurrentIdx((i) => {
      const next = i + 1;
      if (next >= ordreAnim.length) {
        setAllDone(true);
        // Feu d'artifice sur le gagnant
        setShowFireworks(true);
        fireTimeout.current = setTimeout(() => setShowFireworks(false), 2500);
      }
      return next;
    });
  };

  const isActive = (rank) => {
    const idx = ordreAnim.findIndex((p) => p.rank === rank);
    return idx === currentIdx && !allDone;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-8 relative">
      <img src={logo} alt="Logo" className="h-[8em] object-contain mt-4" />
      <h1 className="text-3xl font-semibold text-center">Classement</h1>

      {/* Verres animés */}
      <div className="w-full overflow-x-auto">
        <div className="flex justify-center gap-6 sm:gap-10 pb-12 pt-8">
          <AnimatePresence>
            {classementDesc.map((p, i) => (
              <motion.div
                key={p.token || p.name || i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="relative" // pour positionner le feu d'artifice
              >
                {/* Verre + avatar + score */}
                <CocktailGlass
                  avatar={p.avatar || DEFAULT_AVATAR}
                  name={p.name || "?"}
                  score={p.score || 0}
                  topScore={topScore}
                  active={isActive(i)}
                  onDone={handleDone}
                  delayPerPoint={220}
                />

                {/* Feu d'artifice UNIQUEMENT sur le gagnant, après anim */}
                <AnimatePresence>
                  {showFireworks && i === 0 && (
                    <Fireworks key="fw-inline" inline duration={1.6} count={42} />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Classement texte + bouton après l'animation */}
      {allDone && (
        <>
          <div className="w-full max-w-md space-y-2 mt-2">
            {classementDesc.map((p, i) => (
              <div
                key={p.token || p.name || i}
                className="flex items-center justify-between text-sm bg-white/60 dark:bg-zinc-700/40 rounded px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <img
                    src={p.avatar || DEFAULT_AVATAR}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover border border-white/50 dark:border-black/40"
                  />
                  <span>{i + 1}. {p.name || "?"}</span>
                </span>
                <span className="font-semibold">{p.score || 0} pts</span>
              </div>
            ))}
          </div>

          <button className="btn mt-6" onClick={() => window.location.reload()}>
            Rejouer
          </button>
        </>
      )}
    </div>
  );
}
