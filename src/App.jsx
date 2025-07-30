import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSocket from "./hooks/useSocket";
import "./theme.css";

import LobbyPage from "./pages/LobbyPage";
import QuizPage from "./pages/QuizPage";
import ValidationPage from "./pages/ValidationPage";
import ResultPage from "./pages/ResultPage";

const LS_KEY = "quiz-session";

const saveSession = ({ lobbyId, token }) =>
  lobbyId && token && localStorage.setItem(LS_KEY, JSON.stringify({ lobbyId, token }));
const loadSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "null");
  } catch {
    return null;
  }
};
const clearSession = () => localStorage.removeItem(LS_KEY);

export default function App() {
  const socket = useSocket();

  const [phase, setPhase] = useState("lobby");
  const [state, setState] = useState({});
  const [triedRejoin, setTriedRejoin] = useState(false);
  const listenersSet = useRef(false);

  /* Reconnexion auto */
  useEffect(() => {
    if (!socket || triedRejoin) return;
    const s = loadSession();
    if (s?.lobbyId && s?.token) socket.emit("rejoinLobby", s);
    setTriedRejoin(true);
  }, [socket, triedRejoin]);

  /* Listeners (une seule fois) */
  useEffect(() => {
    if (!socket || listenersSet.current) return;
    listenersSet.current = true;

    const merge = (d) => setState((p) => ({ ...p, ...d }));

    socket.on("lobbyCreated", (d) => {
      saveSession(d);
      setState(d);
      setPhase("lobby");
    });

    socket.on("lobbyJoined", (d) => {
      saveSession(d);
      setState(d);
      setPhase("lobby");
    });

    socket.on("rejoinSuccess", (d) => {
      merge(d);
      setPhase(d.phase || "lobby");
    });

    socket.on("playersUpdate", (players) => merge({ players }));

    socket.on("quizStarted", () => setPhase("quiz"));

    socket.on("phaseChange", ({ phase }) => setPhase(phase));

    socket.on("startValidation", (payload) => {
      merge(payload);
      setPhase("validation");
    });

    socket.on("stateSync", (payload) => {
      merge(payload);
      if (payload.phase) setPhase(payload.phase);
    });

    socket.on("validationUpdated", ({ playerId, questionIndex, isCorrect, score }) => {
      setState((p) => {
        const validations = { ...p.validations };
        const arr = validations[playerId] ? [...validations[playerId]] : [];
        arr[questionIndex] = isCorrect;
        validations[playerId] = arr;

        const players = (p.players || []).map((pl) =>
          pl.token === playerId ? { ...pl, score } : pl
        );

        return { ...p, validations, players };
      });
    });

    socket.on("validationEnded", ({ classement }) => {
      merge({ classement });
      clearSession();
      setPhase("result");
    });

    socket.on("errorMsg", (msg) => alert(msg));
  }, [socket]);

  /* Abandonner */
  const abandonGame = () => {
    try {
      if (socket && state.lobbyId && state.token) {
        socket.emit("leaveLobby", { lobbyId: state.lobbyId, token: state.token });
      }
    } catch (_) {}
    clearSession();
    window.location.reload();
  };

  const pages = {
    lobby: <LobbyPage socket={socket} state={state} />,
    quiz: <QuizPage socket={socket} state={state} />,
    validation: <ValidationPage socket={socket} state={state} />,
    result: <ResultPage state={state} />,
  };

  const inGame = Boolean(state?.lobbyId);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Bouton abandon */}
      {inGame && (
        <button
          onClick={abandonGame}
          className="btn fixed right-6 top-6 px-3 py-2 text-sm z-50"
          style={{ fontSize: "0.8rem" }}
        >
          Abandonner
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={phase}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex items-center justify-center p-4"
        >
          {pages[phase] || <div>Phase inconnue : {phase}</div>}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
