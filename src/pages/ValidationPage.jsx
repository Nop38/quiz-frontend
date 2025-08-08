import { motion } from "framer-motion";
import QuestionCard from "../components/QuestionCard";

const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

export default function ValidationPage({ socket, state }) {
  const questions = state.questions ?? [];
  const questionIdx = state.questionIndex ?? 0;
  const players = state.players ?? [];
  const validations = state.validations ?? {};
  const { lobbyId, token, isCreator } = state;

  if (!questions.length || !Array.isArray(players) || !validations) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-sm opacity-80">Préparation de la validation…</p>
      </div>
    );
  }

  const q = questions[questionIdx] || {};
  const isPetitBac = q.meta?.type === "petit_bac";

  const sendValidate = (playerToken, themeOrValue, ok = undefined) => {
    if (isPetitBac) {
      socket.emit("validateAnswer", {
        lobbyId,
        token,
        playerToken,
        questionIndex: questionIdx,
        isCorrect: { theme: themeOrValue, ok },
      });
    } else {
      socket.emit("validateAnswer", {
        lobbyId,
        token,
        playerToken,
        questionIndex: questionIdx,
        isCorrect: themeOrValue, // true ou false
      });
    }
  };

  return (
    <div className="w-full max-w-[78rem] space-y-6">
      <QuestionCard q={q} index={questionIdx} total={questions.length} />

      {!isPetitBac && q.answer && (
        <div
          className="bg-zinc-100 dark:bg-zinc-800/50 text-sm rounded-md p-3"
          style={{
            width: "fit-content",
            margin: "20px auto 0 auto",
            fontSize: "20px",
            border: "1px solid #4caf50a3",
          }}
        >
          <span className="break-words whitespace-pre-wrap">{q.answer}</span>
        </div>
      )}

      <h3 className="text-lg font-semibold">Réponses des joueurs</h3>

      <div className="flex flex-wrap justify-center gap-[55px]">
        {players.map((pl) => {
          const val = validations?.[pl.token]?.[questionIdx];
          const avatarSrc = pl.avatar || DEFAULT_AVATAR;
          const rawAnswer = pl.answers?.[questionIdx] ?? (isPetitBac ? {} : "(vide)");

          let bacAnswers = {};
          if (isPetitBac) {
            try {
              bacAnswers = typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : (rawAnswer || {});
            } catch (err) {
              bacAnswers = {};
            }
          }

          const getHighlightClass = () => {
            if (!isPetitBac) {
              if (val === true) return "bg-green-100 dark:bg-green-900/50";
              if (val === false) return "bg-red-100 dark:bg-red-900/40";
            }
            return "";
          };

          return (
            <motion.div
              key={pl.token}
              layout
              initial={false}
              transition={{ duration: 0.4 }}
              className={
                "relative gap-[25px] flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-[280px] text-center overflow-hidden " +
                getHighlightClass()
              }
            >
              <img
                src={avatarSrc}
                alt=""
                className="h-[91px] w-[91px] rounded-full object-contain border border-zinc-300 dark:border-zinc-700"
              />
              <div className="truncate text-sm font-medium mt-[-20px]">
                {pl.name}
                {pl.token === token && <span className="text-xs text-indigo-500 ml-1">(toi)</span>}
              </div>

              <div className="mt-2 space-y-2 text-[15px] w-full">
                {isPetitBac ? (
                  q.meta.themes.map((theme) => {
                    const answerText = bacAnswers?.[theme] || "(vide)";
                    const subVal = val?.[theme];
                    const highlight =
                      subVal === true
                        ? "bg-green-100 dark:bg-green-900/50"
                        : subVal === false
                        ? "bg-red-100 dark:bg-red-900/40"
                        : "";

                    return (
                      <div
                        key={theme}
                        className={`flex items-center justify-between px-2 py-1 rounded ${highlight}`}
                      >
                        <div className="text-left">{theme}: <strong>{answerText}</strong></div>
                        {isCreator ? (
                          <div className="space-x-1">
                            <button
                              className="text-green-600 font-bold"
                              disabled={subVal === true}
                              onClick={() => sendValidate(pl.token, theme, true)}
                            >
                              ✔
                            </button>
                            <button
                              className="text-red-600 font-bold"
                              disabled={subVal === false}
                              onClick={() => sendValidate(pl.token, theme, false)}
                            >
                              ✘
                            </button>
                          </div>
                        ) : (
                          <div>{subVal == null ? "…" : subVal ? "✔" : "✘"}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="mt-1 break-words text-[20px]">{rawAnswer}</div>
                    {isCreator ? (
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
                    ) : (
                      <div className="mt-2 text-xl">
                        {val == null ? "…" : val ? "✔︎" : "✘"}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}