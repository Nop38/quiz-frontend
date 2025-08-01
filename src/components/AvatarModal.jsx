import React from "react";

const AVATARS = Array.from({ length: 20 }, (_, i) =>
  new URL(`../images/avatars/avatar_${String(i + 1).padStart(2, "0")}.png`, import.meta.url).href
);

export default function AvatarModal({ open, value, onChange, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4 text-center">Choisis ton avatar</h3>

        <div className="grid grid-cols-4 gap-4">
          {AVATARS.map((src) => {
            const selected = value === src;
            return (
              <button
                key={src}
                type="button"
                className={`relative rounded-xl overflow-hidden focus:outline-none transition ring-2 ${
                  selected ? "ring-indigo-500 scale-105" : "ring-transparent hover:scale-105"
                }`}
                onClick={() => {
                  onChange(src);
                  onClose();
                }}
              >
                <img src={src} alt="avatar" className="w-24 h-24 object-cover" />
                {selected && (
                  <span className="absolute inset-0 bg-indigo-500/25 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        <button className="btn w-full mt-6" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
