import React from "react";

export default function EditableAvatar({ src, onClick, size = 80, alt = "avatar" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative group rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700 focus:outline-none cursor-pointer"
      style={{ width: size, height: size }}
      aria-label="Changer d'avatar"
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />

      {/* Overlay au survol : léger flou + icône crayon */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backdropFilter: "blur(2px)" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </div>
    </button>
  );
}
