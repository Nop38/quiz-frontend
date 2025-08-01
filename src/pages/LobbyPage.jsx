import { useState, useEffect } from "react";
import logo from "../images/logo.png";
import AvatarModal from "../components/AvatarModal";
import EditableAvatar from "../components/EditableAvatar";


const LS_AVATAR = "quiz-avatar";
const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

/**
 * Lobby :
 * - Onglets Créer / Rejoindre
 * - Avatar cliquable (80x80) au-dessus du pseudo
 * - Liste des joueurs avec avatar : on force l'avatar local pour "moi" si le back ne l'envoie pas
 */
export default function LobbyPage({ socket, state }) {
  const { lobbyId, token, players = [], isCreator } = state;

  const [tab, setTab] = useState("create"); // "create" | "join"
  const [pseudo, setPseudo] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [joinId, setJoinId] = useState("");

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [avatar, setAvatar] = useState(
    localStorage.getItem(LS_AVATAR) || DEFAULT_AVATAR
  );
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_AVATAR, avatar);
  }, [avatar]);

  const resetLoading = () => {
    setCreating(false);
    setJoining(false);
  };

  const createLobby = () => {
    if (!pseudo.trim() || creating) return;
    setCreating(true);
    socket.emit("createLobby", { name: pseudo.trim(), avatar, questionCount: parseInt(questionCount, 10) || 10 },
      (ack) => ack?.error && (alert(ack.error), resetLoading())
    );
    setTimeout(resetLoading, 5000);
  };

  const joinLobby = () => {
    if (!pseudo.trim() || !joinId.trim() || joining) return;
    setJoining(true);
    const payload = {
      lobbyId: joinId.trim(),
      code: joinId.trim(),
      name: pseudo.trim(),
      avatar,
    };
    socket.emit("joinLobby", payload, (ack) => {
      if (ack?.error) {
        alert(ack.error);
        resetLoading();
      }
    });
    setTimeout(resetLoading, 5000);
  };

  const startQuiz = () => {
    if (!isCreator) return;
    socket.emit("startQuiz", { lobbyId, token });
  };

  /* ---------- PAS ENCORE DANS UN LOBBY ---------- */
  if (!lobbyId) {
    return (
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        {/* Logo 15em */}
        <img src={logo} alt="Logo" className="h-[15em] object-contain mb-8" />

        {/* Tabs */}
        <div className="flex border-b border-zinc-300 dark:border-zinc-700 w-full">
          <button
            className={`tab-btn ${tab === "create" ? "active" : "inactive"}`}
            onClick={() => setTab("create")}
          >
            Créer
          </button>
          <button
            className={`tab-btn ${tab === "join" ? "active" : "inactive"}`}
            onClick={() => setTab("join")}
          >
            Rejoindre
          </button>
        </div>

        {/* CREATE */}
        {tab === "create" && (
          <section className="space-y-4 w-full">
            <h2 className="text-xl font-semibold text-center">Créer une partie</h2>

            {/* Avatar centré */}
            <div className="w-full flex justify-center mt-2 mb-4">
              <EditableAvatar
                src={avatar}
                size={80}
                onClick={() => setAvatarModalOpen(true)}
              />
            </div>

            <label className="text-sm text-muted">Pseudo</label>
            <input
              className="input w-full"
              placeholder="Ton pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
            />

            <button
              className="btn w-full mt-6"
              onClick={createLobby}
              disabled={!pseudo.trim() || creating}
            >
              {creating ? "..." : "Créer"}
            </button>
          </section>
        )}

        {/* JOIN */}
        {tab === "join" && (
          <section className="space-y-4 w-full">
            <h2 className="text-xl font-semibold text-center">Rejoindre une partie</h2>

            {/* Avatar centré */}
            <div className="w-full flex justify-center mt-2 mb-4">
              <EditableAvatar
                src={avatar}
                size={80}
                onClick={() => setAvatarModalOpen(true)}
              />
            </div>

            <label className="text-sm text-muted">ID / Code de la partie</label>
            <input
              className="input w-full"
              placeholder="ID / Code"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />

            <label className="text-sm text-muted">Pseudo</label>
            <input
              className="input w-full"
              placeholder="Ton pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
            />

            <button
              className="btn w-full mt-6"
              onClick={joinLobby}
              disabled={!pseudo.trim() || !joinId.trim() || joining}
            >
              {joining ? "..." : "Rejoindre"}
            </button>
          </section>
        )}

        {/* Modal */}
        <AvatarModal
          open={avatarModalOpen}
          value={avatar}
          onChange={setAvatar}
          onClose={() => setAvatarModalOpen(false)}
        />
      </div>
    );
  }
 
  /* ---------- DÉJÀ DANS UN LOBBY ---------- */
  return (
    <div className="w-full max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold text-center">Lobby #{lobbyId}</h1>

      <section className="bg-white dark:bg-zinc-800 rounded-xl shadow p-5 space-y-3">
        <h2 className="text-lg font-medium">Joueurs</h2>
        <ul className="space-y-2">
          {players.map((p) => {
            // Si c'est moi, j'affiche mon avatar local si le back ne l'a pas renvoyé
            const isMe = p.token === token;
            const src = isMe ? avatar : (p.avatar || DEFAULT_AVATAR);

            return (
              <li key={p.token} className="flex items-center gap-3">
                <img
                  src={src}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
                />
                <span className="flex-1">
                  {p.name || "?"} {isMe && <span className="text-xs text-indigo-500">(toi)</span>}
                </span>
                {typeof p.score === "number" && (
                  <span className="text-xs opacity-60">Score: {p.score}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {isCreator ? (
        <button className="btn w-full" onClick={startQuiz}>
          Démarrez la partie
        </button>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          En attente que le créateur démarre la partie…
        </p>
      )}
    </div>
  );
}
