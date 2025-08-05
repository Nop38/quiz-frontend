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
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState("");

  const listenersSet = useRef(false);

  // Auth check
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password }),
        });
        const json = await res.json();
        if (json.success) {
          setAuth(true);
        } else {
          setError("Mot de passe incorrect");
        }
      } catch {
        setError("Erreur serveur");
      }
    };
    if (password) check();
  }, [password]);

  useEffect(() => {
    if (!socket || triedRejoin || !auth) return;
    const s = loadSession();
    if (s?.lobbyId && s?.token) socket.emit("rejoinLobby", s);
    setTriedRejoin(true);
  }, [socket, triedRejoin, auth]);

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
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 relative">
      {!auth && (
        <div className="absolute inset-0 backdrop-blur-md bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg space-y-4 w-80 text-center">
            <h2 className="text-lg font-semibold">Mot de passe requis</h2>
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800 outline-none"
              onKeyDown={(e) => e.key === "Enter" && setPassword(e.target.value)}
              onChange={(e) => setError("")}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={() => setPassword(document.querySelector("input[type='password']").value)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Se connecter
            </button>
          </div>
        </div>
      )}

      {/* Bouton abandon */}
      {auth && inGame && (
        <button
          onClick={abandonGame}
          className="fixed right-4 top-4 z-40 flex items-center gap-2 px-2 py-2 text-white hover:text-red-500 transition-colors group"
          title="Abandonner la partie"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-300 text-sm font-medium">
            Abandonner
          </span>
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
          {auth ? pages[phase] : null}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
