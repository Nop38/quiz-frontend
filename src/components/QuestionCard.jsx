import { motion } from "framer-motion";

/**
 * q = { text, image? }
 */
export default function QuestionCard({ q, index = 0, total = 0 }) {
  if (!q) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse w-full max-w-3xl h-[500px]">
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
      className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 w-full max-w-[78rem] flex flex-col h-[500px] overflow-hidden"
    >
      <p className="text-sm text-zinc-500 mb-3 w-full text-left">
        Question {index + 1}
        {total ? ` / ${total}` : ""}
      </p>
      <div className="flex-1 flex flex-col w-full">
        {q.image ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 leading-snug text-center w-full">{q.text}</h2>
            <div className="flex-1 flex justify-center items-center w-full">
              <img
                src={q.image}
                alt=""
                className="object-contain max-h-full max-w-full rounded-xl"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </>
        ) : (
          // Même zone, centré dans tout l'espace
          <div className="flex flex-1 justify-center items-center w-full">
            <h2 className="text-2xl font-semibold leading-snug text-center w-full">{q.text}</h2>
          </div>
        )}
      </div>
    </motion.div>
  );
}
