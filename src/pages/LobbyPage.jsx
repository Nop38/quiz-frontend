import { useState, useEffect } from "react";
import logo           from "../images/logo.png";
import AvatarModal    from "../components/AvatarModal";
import EditableAvatar from "../components/EditableAvatar";

const LS_AVATAR      = "quiz-avatar";
const DEFAULT_AVATAR = new URL("../images/avatars/avatar_01.png", import.meta.url).href;

/**
 * Page Lobby
 * - Onglets Créer / Rejoindre
 * - Avatar cliquable (80×80) au‑dessus du pseudo
 * - Choix du nombre de questions (10 / 20 / 30 / 40)
 */
export default function LobbyPage({ socket, state }) {
  const { players = [], isCreator } = state;

  const [tab,      setTab]      = useState("create"); // "create" | "join"
  const [pseudo,   setPseudo]   = useState("");
  const [joinId,   setJoinId]   = useState("");

  const [creating, setCreating] = useState(false);
  const [joining,  setJoining]  = useState(false);

  /* === NOUVEAU : nombre de questions === */
  const [numQuestions, setNumQuestions] = useState(20); // 10 | 20 | 30 | 40

  const [avatar,          setAvatar]          = useState(
    localStorage.getItem(LS_AVATAR) || DEFAULT_AVATAR
  );
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  useEffect(() => localStorage.setItem(LS_AVATAR, avatar), [avatar]);

  /* ----------------------------------------------------------------- */
  const resetLoading = () => { setCreating(false); setJoining(false); };

  const createLobby = () => {
    if (!pseudo.trim() || creating) return;
    setCreating(true);
    socket.emit(
      "createLobby",
      { name: pseudo.trim(), avatar, nbQuestions: numQuestions },
      (ack) => ack?.error && (alert(ack.error), resetLoading())
    );
    setTimeout(resetLoading, 5_000);
  };

  const joinLobby = () => {
    /* … code inchangé … */
  };

  const startQuiz = () => {
    /* … code inchangé … */
  };

  /* ----------------------------------------------------------------- */
  return (
    <div className="container mx-auto max-w-md py-8 space-y-8">
      <img src={logo} alt="Logo" className="w-32 mx-auto" />

      {/* Tabs */}
      <div className="flex justify-center gap-4">
        <button
          className={`btn ${tab === "create" ? "" : "opacity-40"}`}
          onClick={() => setTab("create")}
        >
          Créer
        </button>
        <button
          className={`btn ${tab === "join" ? "" : "opacity-40"}`}
          onClick={() => setTab("join")}
        >
          Rejoindre
        </button>
      </div>

      {/* CREATE ------------------------------------------------------- */}
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

          {/* ─── Sélection du nombre de questions ──────────────────── */}
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
          {/* ───────────────────────────────────────────────────────── */}

          <button
            className="btn w-full mt-6"
            onClick={createLobby}
            disabled={!pseudo.trim() || creating}
          >
            {creating ? "…" : "Créer"}
          </button>
        </section>
      )}

      {/* JOIN --------------------------------------------------------- */}
      {tab === "join" && (
        <section className="space-y-4 w-full">
          {/* … bloc Rejoindre inchangé … */}
        </section>
      )}

      {/* Bouton “Démarrer la partie” pour le créateur ----------------- */}
      {isCreator ? (
        <button className="btn w-full" onClick={startQuiz}>
          Démarrer la partie
        </button>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          En attente que le créateur démarre la partie…
        </p>
      )}

      {/* Modal avatar ------------------------------------------------- */}
      {avatarModalOpen && (
        <AvatarModal
          onClose={() => setAvatarModalOpen(false)}
          onSelect={(src) => (setAvatar(src), setAvatarModalOpen(false))}
        />
      )}
    </div>
  );
}
