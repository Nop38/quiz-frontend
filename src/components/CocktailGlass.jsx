import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";

const MAX_FILL_RATIO = 0.8;   // le gagnant remplit 80 %
const BUBBLES_COUNT  = 14;

export default function CocktailGlass({
  avatar,
  name,
  score,
  topScore,
  active,               // contrôle le remplissage point par point
  onDone,
  delayPerPoint = 220,  // temps pour animer 1 point entier ; on adaptera pour 0.25
  scale = 1,
  showFinalScore = false,
  percentOverride = null, // si fourni, remplace score/topScore pour le ratio de remplissage
}) {
  const [shown, setShown] = useState(0);    // valeur affichée (animée) — peut être décimale
  const pouring = useRef(false);

  // IDs uniques pour clipPath / gradients / masks
  const ids = useMemo(() => {
    const r = Math.random().toString(36).slice(2);
    return {
      clip: `clip-${r}`,
      grad: `grad-${r}`,
      glassGrad: `glassGrad-${r}`,
      shineMask: `shineMask-${r}`,
    };
  }, []);

  // Couleurs aléatoires pour le liquide (top/bottom du dégradé)
  const liquidColors = useMemo(() => {
    const hue = Math.floor(Math.random() * 360);
    const top = `hsl(${hue}, 85%, 62%)`;
    const bottom = `hsl(${(hue + 30) % 360}, 85%, 52%)`;
    return { top, bottom };
  }, []);

  // Base pour le pourcentage de remplissage (avant application du 0.8 max)
  const basePercent =
    percentOverride != null
      ? Math.max(0, Math.min(1, percentOverride))
      : topScore ? Math.max(0, Math.min(1, score / topScore)) : 0;

  // Ratio cible de remplissage dans le verre (80% max)
  const targetFill = basePercent * MAX_FILL_RATIO;

  // Ratio courant en fonction de l'animation (clampé pour ne jamais dépasser le targetFill)
  const currentRatio =
    score > 0
      ? Math.min((shown / score) * targetFill, targetFill)
      : 0;

  // Remplissage par pas de 0.25 (pour bien refléter les +0.25)
  useEffect(() => {
    if (!active) return;
    if (!Number.isFinite(score) || score <= 0) {
      setShown(0);
      return;
    }

    pouring.current = true;
    let current = 0;
    const step = 0.25;                    // on anime par incréments de 0.25
    const stepDelay = delayPerPoint * step; // pour garder la même vitesse globale que 1 point en 220ms

    setShown(0);
    const id = setInterval(() => {
      current = Math.min(score, +(current + step).toFixed(2));
      setShown(current);
      if (current >= score - 1e-9) {
        clearInterval(id);
        pouring.current = false;
        setTimeout(() => onDone?.(), 400);
      }
    }, stepDelay);

    return () => clearInterval(id);
  }, [active, score, delayPerPoint, onDone]);

  // Bulles
  const bubbles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < BUBBLES_COUNT; i++) {
      arr.push({
        key: i,
        cx: 18 + Math.random() * 84,
        size: 3 + Math.random() * 4,
        delay: Math.random() * 1.5,
        duration: 1.8 + Math.random() * 1.8,
      });
    }
    return arr;
  }, []);

  const displayedScore = showFinalScore ? score : shown;

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: "center bottom" }}
    >
      {/* -------- Verre -------- */}
      <div className="relative w-24 h-32 sm:w-28 sm:h-40">
        <svg viewBox="0 0 120 180" className="w-full h-full">
          <defs>
            {/* Dégradé liquide aléatoire */}
            <linearGradient id={ids.grad} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={liquidColors.top} stopOpacity="0.95" />
              <stop offset="100%" stopColor={liquidColors.bottom} stopOpacity="0.85" />
            </linearGradient>

            {/* Dégradé du verre (reflets) */}
            <linearGradient id={ids.glassGrad} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>

            {/* Masque d'éclat */}
            <mask id={ids.shineMask}>
              <rect x="0" y="0" width="120" height="180" fill="black" />
              <path d="M25 14 L45 14 L62 88 L48 88 Z" fill="white" opacity="0.45" />
            </mask>

            {/* ClipPath liquide + bulles */}
            <clipPath id={ids.clip}>
              <path d="M12 12 L108 12 L60 92 Z" />
            </clipPath>
          </defs>

          {/* Bol du verre */}
          <path
            d="M12 12 L108 12 L60 92 Z"
            fill={`url(#${ids.glassGrad})`}
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="3"
          />
          <path
            d="M12 12 L108 12 L60 92 Z"
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="1"
          />

          {/* Reflet */}
          <rect
            x="0"
            y="0"
            width="120"
            height="100"
            fill="white"
            mask={`url(#${ids.shineMask})`}
            opacity="0.12"
          />

          {/* Liquide */}
          <motion.rect
            x="12"
            width="96"
            clipPath={`url(#${ids.clip})`}
            height="80"
            y={92 - 80 * currentRatio}
            fill={`url(#${ids.grad})`}
            transition={{ duration: 0.3 }}
          />

          {/* Bulles (anim en continu) */}
          <g clipPath={`url(#${ids.clip})`}>
            {bubbles.map((b) => (
              <motion.circle
                key={b.key}
                cx={b.cx}
                r={b.size}
                fill="rgba(255,255,255,0.65)"
                initial={{ cy: 92, opacity: 0 }}
                animate={{ cy: [92, 20], opacity: [0, 1, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: b.duration,
                  delay: b.delay,
                  ease: [0.16, 0.84, 0.44, 1],
                }}
              />
            ))}
          </g>

          {/* Tige & base */}
          <line
            x1="60"
            y1="92"
            x2="60"
            y2="152"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="4"
          />
          <rect
            x="35"
            y="152"
            width="50"
            height="6"
            rx="2"
            fill="rgba(255,255,255,0.5)"
          />
          <rect
            x="32"
            y="158"
            width="56"
            height="4"
            rx="2"
            fill="rgba(0,0,0,0.15)"
          />
        </svg>
      </div>

      {/* Avatar */}
      <img
        src={avatar}
        alt=""
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white dark:border-black shadow -mt-2 mb-2"
      />

      {/* Nom + score */}
      <p className="text-center text-sm max-w-full truncate">{name}</p>
      <p className="text-xs opacity-70">{Number(displayedScore ?? 0).toFixed(2)}</p>
    </div>
  );
}
