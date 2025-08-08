import { useState } from "react";
import { motion } from "framer-motion";
import QuestionCard from "../components/QuestionCard";

const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

export default function ValidationPage({ socket, state }) {
  const questions = state.questions ?? [];
  const questionIdx = state.questionIndex ?? 0;
  const players = state.players ?? [];
  const validations = state.validations ?? {};
  const { lobbyId, token, isCreator } = state;

  const [overlayMap, setOverlayMap] = useState({}); // Pour animation ✔ / ✘

  if (!questions.length || !Array.isArray(players) || !validations) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-sm opacity-80">Préparation de la validation…</p>
      </div>
    );
  }

  const q = questions[questionIdx] || {};
  const correctAnswer = q.answer || q.reponse || "";
  const isPetitBac = q.meta?.type === "petit_bac";

  const sendValidate = (playerToken, data) => {
    socket.emit("validateAnswer", {
      lobbyId,
      token,
      playerToken,
      questionIndex: questionIdx,
      isCorrect: data,
    });

    // Animation overlay
    if (!isPetitBac) {
      setOverlayMap((prev) => ({
        ...prev,
        [playerToken]: data ? "green" : "red",
      }));
      setTimeout(() => {
        setOverlayMap((prev) => ({ ...prev, [playerToken]: null }));
      }, 1000);
    } else if (typeof data === "object") {
      setOverlayMap((prev) => ({
        ...prev,
        [`${playerToken}_${data.theme}`]: data.ok ? "green" : "red",
      }));
      setTimeout(() => {
        setOverlayMap((prev) => ({ ...prev, [`${playerToken}_${data.theme}`]: null }));
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-[78rem] space-y-6">
      <QuestionCard q={q} index={questionIdx} total={questions.length} />

      {!isPetitBac && correctAnswer && (
        <div
          className="bg-zinc-100 dark:bg-zinc-800/50 text-sm rounded-md p-3"
          style={{
            width: "fit-content",
            margin: "20px auto 0 auto",
            fontSize: "20px",
            border: "1px solid #4caf50a3",
          }}
        >
          <span className="break-words whitespace-pre-wrap">{correctAnswer}</span>
        </div>
      )}

      <h3 className="text-lg font-semibold">Réponses des joueurs</h3>

      <div className="flex flex-wrap justify-center gap-[55px]">
        {players.map((pl) => {
          const avatarSrc = pl.avatar || DEFAULT_AVATAR;
          const rawAnswer = pl.answers?.[questionIdx];
          const val = validations?.[pl.token]?.[questionIdx];
          const parsedAnswer = isPetitBac
            ? typeof rawAnswer === "string"
              ? JSON.parse(rawAnswer || "{}")
              : rawAnswer
            : rawAnswer;

          return (
            <motion.div
              key={pl.token}
              layout
              initial={false}
              transition={{ duration: 0.4 }}
              className="relative gap-[25px] flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-[220px] text-center overflow-hidden"
            >
              {/* Overlay ✔ / ✘ */}
              {(overlayMap[pl.token] || null) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 rounded-lg pointer-events-none ${
                    overlayMap[pl.token] === "green" ? "bg-green-400/40" : "bg-red-400/40"
                  }`}
                />
              )}

              <img
                src={avatarSrc}
                alt=""
                className="h-[91px] w-[91px] rounded-full object-contain border border-zinc-300 dark:border-zinc-700"
              />
              <div className="truncate text-sm font-medium mt-[-20px]">
                {pl.name}
                {pl.token === token && (
                  <span className="text-xs text-indigo-500 ml-1">(toi)</span>
                )}
              </div>

              {/* Réponses */}
              <div className="mt-1 break-words text-[17px] space-y-2">
                {!isPetitBac ? (
                  <div>{parsedAnswer || "(vide)"}</div>
                ) : (
                  q.meta.themes.map((theme) => {
                    const userAnswer = parsedAnswer?.[theme] || "(vide)";
                    const thisVal = val?.[theme];
                    const overlayKey = `${pl.token}_${theme}`;
                    const overlayColor = overlayMap[overlayKey];

                    return (
                      <div
                        key={theme}
                        className="relative p-1 px-2 rounded bg-white/80 dark:bg-zinc-700/40"
                      >
                        {/* Overlay animation pour ce champ */}
                        {overlayColor && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`absolute inset-0 rounded pointer-events-none ${
                              overlayColor === "green" ? "bg-green-400/40" : "bg-red-400/40"
                            }`}
                          />
                        )}
                        <div className="font-semibold text-sm">{theme}</div>
                        <div className="text-base">{userAnswer}</div>

                        {/* Boutons validation par thème */}
                        {isCreator ? (
                          <div className="mt-1 flex justify-center space-x-1">
                            <button
                              className="px-2 py-0.5 text-xs font-bold rounded bg-green-500 text-white"
                              disabled={thisVal === true}
                              onClick={() =>
                                sendValidate(pl.token, { theme, ok: true })
                              }
                            >
                              ✔
                            </button>
                            <button
                              className="px-2 py-0.5 text-xs font-bold rounded bg-red-500 text-white"
                              disabled={thisVal === false}
                              onClick={() =>
                                sendValidate(pl.token, { theme, ok: false })
                              }
                            >
                              ✘
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm mt-0.5">
                            {thisVal == null ? "…" : thisVal ? "✔︎" : "✘"}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Validation globale (classique) */}
              {!isPetitBac && isCreator && (
                <div className="mt-2 space-x-2">
                  <button
                    className="px-3 py-1 text-sm font-semibold rounded-md text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-60 disabled:cursor-default"
                    disabled={val === true}
                    onClick={() => sendValidate(pl.token, true)}
                  >
                    ✔︎
                  </button>
                  <button
                    className="px-3 py-1 text-sm font-semibold rounded-md text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-default"
                    disabled={val === false}
                    onClick={() => sendValidate(pl.token, false)}
                  >
                    ✘
                  </button>
                </div>
              )}

              {!isPetitBac && !isCreator && (
                <div className="mt-2 text-xl">
                  {val == null ? "…" : val ? "✔︎" : "✘"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
