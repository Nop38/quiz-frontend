import { motion } from "framer-motion";
import QuestionCard from "../components/QuestionCard";

const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

export default function ValidationPage({ socket, state }) {
  const questions   = state.questions     ?? [];
  const questionIdx = state.questionIndex ?? 0;
  const players     = state.players       ?? [];
  const validations = state.validations   ?? {};
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
  const correctAnswer = q.answer || q.reponse || "";
  const isPetitBac = q?.meta?.type === "petit_bac";
  const petitThemes = q?.meta?.themes || [];

  const sendValidate = (playerToken, ok) => {
    socket.emit("validateAnswer", {
      lobbyId,
      token,
      playerToken,
      questionIndex: questionIdx,
      isCorrect: ok,
    });
  };

  const sendPetitBacValidate = (playerToken, theme, ok) => {
    socket.emit("validateAnswer", {
      lobbyId,
      token,
      playerToken,
      questionIndex: questionIdx,
      isCorrect: { theme, ok },
    });
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
          const answer = pl.answers?.[questionIdx];
          const val = validations?.[pl.token]?.[questionIdx];

          const fullValid = val === true;
          const fullInvalid = val === false;

          const petitVal = val && typeof val === "object" ? val : {};
          const allPetitValidated =
            isPetitBac &&
            petitThemes.every((theme) => petitVal?.[theme] !== undefined);

          const hasPetitWrong =
            isPetitBac &&
            petitThemes.some((theme) => petitVal?.[theme] === false);

          const bgColor = isPetitBac
            ? allPetitValidated
              ? hasPetitWrong
                ? "bg-red-400/40"
                : "bg-green-400/40"
              : ""
            : fullValid
            ? "bg-green-400/40"
            : fullInvalid
            ? "bg-red-400/40"
            : "";

          return (
            <motion.div
              key={pl.token}
              layout
              initial={false}
              transition={{ duration: 0.4 }}
              className={`relative gap-[25px] flex flex-col items-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 w-[220px] text-center overflow-hidden ${bgColor}`}
            >
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

              {/* --- PETIT BAC --- */}
              {isPetitBac ? (
                <div className="text-sm space-y-1">
                  {petitThemes.map((theme) => {
                    const themeVal = petitVal?.[theme];
                    const responseObj = answer || {};
                    const response = responseObj?.[theme] || "(vide)";

                    return (
                      <div key={theme} className="flex flex-col items-center">
                        <div className="font-semibold capitalize">{theme}</div>
                        <div className="text-md">{response}</div>

                        {isCreator ? (
                          <div className="mt-1 space-x-2">
                            <button
                              className="px-2 py-1 text-sm font-semibold rounded-md text-white bg-green-500 hover:bg-green-600 transition disabled:opacity-60 disabled:cursor-default"
                              disabled={themeVal === true}
                              onClick={() => sendPetitBacValidate(pl.token, theme, true)}
                            >
                              ✔︎
                            </button>
                            <button
                              className="px-2 py-1 text-sm font-semibold rounded-md text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-default"
                              disabled={themeVal === false}
                              onClick={() => sendPetitBacValidate(pl.token, theme, false)}
                            >
                              ✘
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 text-xl">
                            {themeVal == null ? "…" : themeVal ? "✔︎" : "✘"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="mt-1 break-words text-[20px]">{answer || "(vide)"}</div>

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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
