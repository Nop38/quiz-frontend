import { motion } from "framer-motion";

export default function QuestionCard({ q, index = 0, total = 0 }) {
  if (!q) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse w-full max-w-3xl min-h-[320px]">
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
      className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-[78rem] h-[600px] min-h-[600px] max-h-[600px] flex flex-col"
    >
      {/* Header = question n° + titre */}
      <div className="flex flex-col items-center pt-5 pb-2 px-6">
        <p className="text-sm text-zinc-500 mb-2 self-start">
          Question {index + 1}
          {total ? ` / ${total}` : ""}
        </p>
        <h2 className="text-2xl font-semibold leading-snug text-center">{q.text}</h2>
      </div>

      {/* Corps = image occupe tout le reste */}
      <div className="flex-1 flex items-center justify-center px-4 pb-6">
        {q.image && (
          <img
            src={q.image}
            alt=""
            className="object-contain max-h-full max-w-full rounded-xl shadow"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </motion.div>
  );
}
