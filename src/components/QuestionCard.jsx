import { motion } from "framer-motion";

/**
 * q = { text, image? }
 */
export default function QuestionCard({ q, index = 0, total = 0 }) {
  if (!q) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse w-full max-w-3xl">
        Chargement…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 w-full max-w-[78rem]"
    >
      <p className="text-sm text-zinc-500 mb-3">
        Question {index + 1}
        {total ? ` / ${total}` : ""}
      </p>

      <h2 className="text-2xl font-semibold mb-6 leading-snug">{q.text}</h2>

      {q.image && (
        <img
          src={q.image}
          alt=""
          className="rounded-xl w-full object-contain max-h-[calc(100vh-250px)] mb-6"
        />
      )}
    </motion.div>
  );
}
