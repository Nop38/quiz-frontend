import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSocket from "./hooks/useSocket";
import "./theme.css";

import LobbyPage from "./pages/LobbyPage";
import QuizPage from "./pages/QuizPage";
import ValidationPage from "./pages/ValidationPage";
import ResultPage from "./pages/ResultPage";

const LS_KEY = "quiz-session";
const BACKEND_URL = "https://quiz-backend-6834.onrender.com";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Vérifie si l'utilisateur est déjà connecté via le cookie
  useEffect(() => {
    fetch(`${BACKEND_URL}/check`, {
      credentials: "include",
    })
      .then((res) => {
        setIsAuthenticated(res.status === 200);
        setAuthChecked(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setAuthChecked(true);
      });
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        alert("Mot de passe incorrect");
      }
    } catch (err) {
      alert("Erreur de connexion au serveur");
    }
  };

  // Reconnexion automatique après refresh
  useEffect(() => {
    if (!socket || triedRejoin || !isAuthenticated) return;
    const s = loadSession();
    if (s?.lobbyId && s?.token) socket.emit("rejoinLobby", s);
    setTriedRejoin(true);
  }, [socket, triedRejoin, isAuthenticated]);

  // Listeners socket.io
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

  if (!authChecked) {
    return <div className="text-center p-10 text-lg">Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      {!isAuthenticated ? (
        <div className="fixed inset-0 backdrop-blur bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-md shadow-md w-full max-w-xs text-center">
            <h2 className="text-xl mb-4 font-semibold">Connexion requise</h2>
            <input
              type="password"
              placeholder="Mot de passe"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
            />
            <button
              onClick={handleLogin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded w-full"
            >
              Se connecter
            </button>
          </div>
        </div>
      ) : (
        <>
          {inGame && (
            <button
              onClick={abandonGame}
              className="fixed right-4 top-4 z-50 flex items-center gap-2 px-2 py-2 text-white hover:text-red-500 transition-colors group"
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
              {pages[phase] || <div>Phase inconnue : {phase}</div>}
            </motion.main>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
