import { motion } from "framer-motion";

/**
 * q = { text, image? }
 */
export default function QuestionCard({ q, index = 0, total = 0 }) {
  if (!q) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse w-full max-w-3xl min-h-[320px]">
        Chargement…
      </div>
    );
  }

  // Toujours une hauteur de 600px
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-[78rem] h-[600px] min-h-[600px] max-h-[600px] flex flex-col"
    >
      <p className="text-sm text-zinc-500 mb-2 pt-5 pl-8">
        Question {index + 1}
        {total ? ` / ${total}` : ""}
      </p>

      {q.image ? (
        // ----- AVEC IMAGE : le titre puis l'image prend tout le reste -----
        <>
          <h2 className="text-2xl font-semibold leading-snug text-center mb-4 px-8">{q.text}</h2>
          <div className="flex-1 flex justify-center items-center w-full px-4 pb-6">
            <img
              src={q.image}
              alt=""
              className="object-contain h-full w-auto max-h-full max-w-full rounded-xl shadow"
              style={{ flex: 1 }}
            />
          </div>
        </>
      ) : (
        // ----- SANS IMAGE : tout centré verticalement ET horizontalement -----
        <div className="flex flex-1 flex-col justify-center items-center w-full">
          <h2 className="text-2xl font-semibold leading-snug text-center px-8">{q.text}</h2>
        </div>
      )}
    </motion.div>
  );
}
