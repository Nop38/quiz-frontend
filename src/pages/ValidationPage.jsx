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

  const sendValidate = (playerToken, ok) =>
    socket.emit("validateAnswer", {
      lobbyId,
      token,
      playerToken,
      questionIndex: questionIdx,
      isCorrect: ok,
    });

  const bgFor = (v) =>
    v === true ? "#bbf7d0" : v === false ? "#fecaca" : "transparent";

  return (
    <div className="w-full max-w-2xl space-y-6">
      <QuestionCard q={q} index={questionIdx} total={questions.length} />

      {correctAnswer && (
        <div className="mt-2 p-3 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-sm">
          <span className="font-medium">Réponse correcte :</span>{" "}
          <span className="break-words whitespace-pre-wrap">{correctAnswer}</span>
        </div>
      )}

      <h3 className="text-lg font-semibold">Réponses des joueurs</h3>

      {players.map((pl) => {
        const val = validations?.[pl.token]?.[questionIdx];
        const avatarSrc = pl.avatar || DEFAULT_AVATAR;
        const answer = pl.answers?.[questionIdx] || "(vide)";

        return (
          <motion.div
            key={pl.token}
            layout
            initial={false}
            animate={{ backgroundColor: bgFor(val) }}
            transition={{ duration: 0.4 }}
            className="grid items-center py-1 px-2 rounded-lg"
            style={{
              gridTemplateColumns: "200px 1fr 120px",
              columnGap: "12px",
            }}
          >
            <span className="flex items-center gap-2 overflow-hidden">
              <img
                src={avatarSrc}
                alt=""
                className="h-8 w-8 rounded-full object-contain border border-zinc-300 dark:border-zinc-700 shrink-0"
              />
              <span className="truncate">
                {pl.name}
                {pl.token === token && (
                  <span className="text-xs text-indigo-500 ml-1">(toi)</span>
                )}
              </span>
            </span>

            <span className="text-sm text-center break-words">
              {answer}
            </span>

            {isCreator ? (
              <span className="justify-self-end space-x-1">
                <button
                  className={`px-3 py-1 text-sm font-semibold rounded-md text-white transition disabled:opacity-60 disabled:cursor-default ${
                    val === true
                      ? "bg-green-400"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                  disabled={val === true}
                  onClick={() => sendValidate(pl.token, true)}
                >
                  ✔︎
                </button>
                <button
                  className={`px-3 py-1 text-sm font-semibold rounded-md text-white transition disabled:opacity-60 disabled:cursor-default ${
                    val === false
                      ? "bg-red-400"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  disabled={val === false}
                  onClick={() => sendValidate(pl.token, false)}
                >
                  ✘
                </button>
              </span>
            ) : (
              <span className="justify-self-end">
                {val == null ? "…" : val ? "✔︎" : "✘"}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
