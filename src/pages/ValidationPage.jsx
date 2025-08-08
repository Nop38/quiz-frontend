import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import classNames from "classnames";

export default function ValidationPage({
  state,
  currentUserToken,
  onValidate,
}) {
  const { players, questions, questionIndex, validations } = state;
  const question = questions[questionIndex];
  const isPetitBac = question?.meta?.type === "petit_bac";
  const themes = isPetitBac ? question.meta.themes : [];

  const [validated, setValidated] = useState({});
  const [overlay, setOverlay] = useState(null); // green / red

  const handleValidate = (playerToken, isCorrect, theme = null) => {
    const key = playerToken + (theme || "");

    if (validated[key]) return;

    setValidated((v) => ({ ...v, [key]: true }));
    setOverlay(isCorrect ? "green" : "red");
    setTimeout(() => setOverlay(null), 700);

    onValidate(
      playerToken,
      isPetitBac ? { theme, ok: isCorrect } : isCorrect
    );
  };

  const renderAnswer = (player, index) => {
    const rawAnswer = player.answers?.[index];
    if (!rawAnswer) {
      return <i className="text-sm opacity-60">Pas de réponse</i>;
    }

    if (isPetitBac) {
      let obj = {};
      try {
        obj = JSON.parse(rawAnswer);
      } catch (e) {
        return <i className="text-sm opacity-60">Pas de réponse</i>;
      }

      return (
        <div className="flex flex-col gap-1">
          {themes.map((theme) => {
            const val = obj[theme] || "";
            const key = player.token + theme;
            const alreadyValidated = validated[key];

            return (
              <div
                key={theme}
                className="flex justify-between items-center gap-2 bg-white/60 dark:bg-zinc-700/50 px-2 py-1 rounded"
              >
                <span className="text-xs font-medium text-zinc-500 uppercase">
                  {theme}
                </span>
                <span className="flex-1 text-right text-sm">
                  {val || <i className="opacity-50">Pas de réponse</i>}
                </span>
                {!alreadyValidated && (
                  <span className="flex gap-1">
                    <button
                      className="text-green-500 hover:scale-125 transition"
                      onClick={() =>
                        handleValidate(player.token, true, theme)
                      }
                    >
                      ✔
                    </button>
                    <button
                      className="text-red-500 hover:scale-125 transition"
                      onClick={() =>
                        handleValidate(player.token, false, theme)
                      }
                    >
                      ✘
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Cas normal (hors petit bac)
    return (
      <div className="flex justify-between items-center gap-4">
        <div className="text-sm max-w-[75%]">
          {rawAnswer || <i className="opacity-60">Pas de réponse</i>}
        </div>
        {!validated[player.token] && (
          <div className="flex gap-2">
            <button
              onClick={() => handleValidate(player.token, true)}
              className="text-green-500 hover:scale-125 transition"
            >
              ✔
            </button>
            <button
              onClick={() => handleValidate(player.token, false)}
              className="text-red-500 hover:scale-125 transition"
            >
              ✘
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative px-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-center mb-6">Validation</h2>

      <div className="space-y-4">
        {players.map((player) => (
          <div
            key={player.token}
            className={classNames(
              "p-3 rounded shadow bg-white/80 dark:bg-zinc-800/50",
              { "opacity-60": currentUserToken === player.token }
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{player.name}</span>
              <span className="text-sm text-zinc-500">
                Score : {(player.score ?? 0).toFixed(2)} pts
              </span>
            </div>
            {renderAnswer(player, questionIndex)}
          </div>
        ))}
      </div>

      {/* Overlay validation ✔️ / ❌ */}
      <AnimatePresence>
        {overlay && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-40 pointer-events-none ${
              overlay === "green" ? "bg-green-500" : "bg-red-500"
            }`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
