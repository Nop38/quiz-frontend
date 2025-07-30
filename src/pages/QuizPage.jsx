import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import logo from "../images/logo.png";


const QUESTION_TIME = 20;
const TIMEOUT_MARKER = "Pas de réponse";
const LS_AVATAR = "quiz-avatar";

export default function QuizPage({ socket, state }) {
  const { questions = [], lobbyId, token, players = [], phase } = state;

  /* -------- Données joueur -------- */
  const me = useMemo(
    () =>
      players.find((p) => p.token === token) || {
        answers: Array(questions.length).fill(null),
        avatar: localStorage.getItem(LS_AVATAR) || null,
      },
    [players, token, questions.length]
  );

  const avatarSrc =
    me.avatar ||
    localStorage.getItem(LS_AVATAR) ||
    new URL("../images/avatars/avatar_01.png", import.meta.url).href;

  const serverIdx = useMemo(
    () => me.answers.findIndex((a) => a == null),
    [me.answers]
  );

  /* -------- State UI -------- */
  const [qIndex, setQIndex] = useState(
    serverIdx === -1 ? questions.length - 1 : serverIdx
  );
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [waiting, setWaiting] = useState(serverIdx === -1);
  const [iAmDone, setIAmDone] = useState(serverIdx === -1);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const sendingRef = useRef(false);
  const doneRef = useRef(iAmDone);
  useEffect(() => { sendingRef.current = sending; }, [sending]);
  useEffect(() => { doneRef.current = iAmDone; }, [iAmDone]);

  /* -------- Sync -------- */
  useEffect(() => {
    if (serverIdx > qIndex) setQIndex(serverIdx);
    if (serverIdx === -1 && !doneRef.current) {
      doneRef.current = true;
      setIAmDone(true);
      setWaiting(true);
    }
  }, [serverIdx, qIndex]);

  useEffect(() => {
    if (qIndex >= 0 && qIndex < questions.length && phase === "quiz") {
      setTimeLeft(QUESTION_TIME);
      setAnswer("");
    }
  }, [qIndex, phase, questions.length]);

  /* -------- Timer -------- */
  useEffect(() => {
    if (phase !== "quiz" || waiting || iAmDone || qIndex === -1) return;

    const int = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => clearInterval(int);
  }, [phase, waiting, iAmDone, qIndex]);

  useEffect(() => {
    if (
      timeLeft === 0 &&
      phase === "quiz" &&
      qIndex !== -1 &&
      !sendingRef.current &&
      !doneRef.current
    ) {
      skipQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  /* -------- Socket -------- */
  useEffect(() => {
    if (!socket) return;

    const onAck = () => setSending(false);
    const onState = (payload) => {
      if (payload.phase === "validation") setWaiting(false);
    };

    socket.off("answerAck", onAck).on("answerAck", onAck);
    socket.off("stateSync", onState).on("stateSync", onState);
    socket.off("startValidation", onState).on("startValidation", onState);
    socket.off("phaseChange", onState).on("phaseChange", onState);

    return () => {
      socket.off("answerAck", onAck);
      socket.off("stateSync", onState);
      socket.off("startValidation", onState);
      socket.off("phaseChange", onState);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !waiting) return;
    const id = setInterval(() => socket.emit("requestState", { lobbyId }), 2000);
    return () => clearInterval(id);
  }, [socket, waiting, lobbyId]);

  /* -------- Envoi -------- */
  const realSend = (text, timedOut = false) => {
    setSending(true);
    socket.emit("submitAnswer", {
      lobbyId,
      token,
      questionIndex: qIndex,
      answer: text,
      timedOut,
    });
  };

  const goNextLocal = () => {
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      doneRef.current = true;
      setIAmDone(true);
      setWaiting(true);
    }
  };

  const send = () => {
    const text = answer.trim();
    if (!text || sending || iAmDone || qIndex === -1) return;
    realSend(text, false);
    goNextLocal();
  };

  const skipQuestion = () => {
    if (sendingRef.current || doneRef.current || qIndex === -1) return;
    realSend(TIMEOUT_MARKER, true);
    goNextLocal();
  };

  /* -------- UI -------- */
  if ((iAmDone || waiting) && phase === "quiz") {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-lg font-medium">En attente des autres joueurs…</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          La validation démarre dès que tout le monde a répondu.
        </p>
      </div>
    );
  }

  if (qIndex < 0 || qIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-sm opacity-80">Synchronisation…</p>
      </div>
    );
  }

  const q = questions[qIndex];
  const progress = (timeLeft / QUESTION_TIME) * 100;

  return (
    <div className="flex flex-col items-center space-y-5 w-full max-w-3xl">
      {/* Logo */}
      <img src={logo} alt="Logo" className="h-[8em] object-contain mb-4" />

      {/* Timer */}
      <div className="w-full max-w-3xl">
        <div className="h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-cyan-400 transition-[width] duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-xs mt-1 text-zinc-500 dark:text-zinc-400">
          {timeLeft}s restantes
        </p>
      </div>

      <QuestionCard q={q} index={qIndex} total={questions.length} />

      {/* Avatar + zone de réponse */}
      <div className="w-full max-w-3xl flex items-center gap-3">
        <img
          src={avatarSrc}
          alt="avatar"
          className="h-10 w-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
        />

        <input
          className="input flex-1"
          value={answer}
          placeholder="Ta réponse"
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={sending || timeLeft === 0}
        />
      </div>

      <button className="btn" disabled={sending || !answer.trim() || timeLeft === 0} onClick={send}>
        {sending ? "..." : "Envoyer"}
      </button>
    </div>
  );
}
