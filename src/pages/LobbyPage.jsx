import { useState, useEffect } from "react";
import logo            from "../images/logo.png";
import AvatarModal     from "../components/AvatarModal";
import EditableAvatar  from "../components/EditableAvatar";

const LS_AVATAR      = "quiz-avatar";
const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

/**
 * Lobby :
 * - Onglets Créer / Rejoindre
 * - Avatar cliquable (80×80) au‑dessus du pseudo
 * - Sélecteur du nombre de questions (10 / 20 / 30 / 40)
 */
export default function LobbyPage({ socket, state }) {
  const { lobbyId, token, players = [], isCreator } = state;

  const [tab,     setTab]     = useState("create"); // "create" | "join"
  const [pseudo,  setPseudo]  = useState("");
  const [joinId,  setJoinId]  = useState("");

  const [creating, setCreating] = useState(false);
  const [joining,  setJoining]  = useState(false);

  /* nombre de questions sélectionné */
  const [numQuestions, setNumQuestions] = useState(20); // 10 | 20 | 30 | 40

  const [avatar,          setAvatar]          = useState(
    localStorage.getItem(LS_AVATAR) || DEFAULT_AVATAR
  );
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => localStorage.setItem(LS_AVATAR, avatar), [avatar]);

  const resetLoading = () => { setCreating(false); setJoining(false); };

  /* ----------------------------------------------------------------- */
  const createLobby = () => {
    if (!pseudo.trim() || creating) return;
    setCreating(true);
    socket.emit(
      "createLobby",
      { name: pseudo.trim(), avatar, nbQuestions: numQuestions },
      (ack) => ack?.error && (alert(ack.error), resetLoading())
    );
    setTimeout(resetLoading, 5000);
  };

  const joinLobby = () => {
    if (!pseudo.trim() || !joinId.trim() || joining) return;
    setJoining(true);
    socket.emit(
      "joinLobby",
      { lobbyId: joinId.trim(), name: pseudo.trim(), avatar },
      (ack) => ack?.error && (alert(ack.error), resetLoading())
    );
    setTimeout(resetLoading, 5000);
  };

  const startQuiz = () => {
    if (!isCreator) return;
    socket.emit("startQuiz", { lobbyId, token });
  };

  /* ----------------------------------------------------------------- */
  if (!lobbyId) {
    return (
      <div className="w-full max-w-md mx-auto py-8 space-y-8">
        <img src={logo} alt="Logo" className="h-28 mx-auto mb-2" />

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

        {/* ===== CRÉER UNE PARTIE ===== */}
        {tab === "create" && (
          <section className="space-y-4 w-full">
            <h2 className="text-xl font-semibold text-center">Créer une partie</h2>

            {/* Avatar */}
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

            {/* Sélecteur du nombre de questions */}
            <label className="text-sm text-muted mt-4">Nombre de questions</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 40].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
                  className={`btn py-2 ${
                    numQuestions === n
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-700 text-white/70"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              className="btn w-full mt-6"
              onClick={createLobby}
              disabled={!pseudo.trim() || creating}
            >
              {creating ? "..." : "Créer"}
            </button>
          </section>
        )}

        {/* ===== REJOINDRE ===== */}
        {tab === "join" && (
          <section className="space-y-4 w-full">
            <h2 className="text-xl font-semibold text-center">Rejoindre une partie</h2>

            <label className="text-sm text-muted">ID / Code</label>
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
              disabled={!pseudo.trim() || joining}
            >
              {joining ? "..." : "Rejoindre"}
            </button>
          </section>
        )}

        {/* Modal avatar */}
        {avatarModalOpen && (
          <AvatarModal
            open={avatarModalOpen}
            value={avatar}
            onChange={setAvatar}
            onClose={() => setAvatarModalOpen(false)}
          />
        )}
      </div>
    );
  }

  /* ===== LOBBY (après connexion) ===== */
  return (
    <div className="w-full max-w-md mx-auto py-8 space-y-6">
      <h2 className="text-xl font-semibold text-center">Lobby</h2>

      <ul className="space-y-2">
        {players.map((p) => {
          const isMe = p.token === token;
          const src  = p.avatar || (isMe ? avatar : DEFAULT_AVATAR);

          return (
            <li key={p.token} className="flex items-center gap-3">
              <img
                src={src}
                alt=""
                className="h-8 w-8 rounded-full object-cover border border-zinc-300 dark:border-zinc-700"
              />
              <span className="flex-1">
                {p.name || "?"}{" "}
                {isMe && <span className="text-xs text-indigo-500">(toi)</span>}
              </span>
              {typeof p.score === "number" && (
                <span className="text-xs opacity-60">Score : {p.score}</span>
              )}
            </li>
          );
        })}
      </ul>

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
