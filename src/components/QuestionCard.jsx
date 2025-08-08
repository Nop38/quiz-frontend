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

  // Hauteur arbitraire qui correspond à ce que tu avais avec image (40vh + paddings)
  const CARD_HEIGHT = "min-h-[450px] md:min-h-[688.17px]"; // Ajuste ici si tu veux plus/moins

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 w-full max-w-[78rem] flex flex-col items-center justify-start h-auto max-h-[calc(100vh-12rem)] overflow-hidden ${CARD_HEIGHT}`}
    >
      <p className="text-sm text-zinc-500 mb-3 w-full text-left">
        Question {index + 1}
        {total ? ` / ${total}` : ""}
      </p>

      {q.image ? (
        <>
          <h2 className="text-2xl font-semibold mb-6 leading-snug text-center w-full">{q.text}</h2>
          <div className="flex justify-center w-full max-h-[40vh] overflow-hidden mb-6">
            <img
              src={q.image}
              alt=""
              className="object-contain w-auto h-full max-h-[40vh]"
            />
          </div>
        </>
      ) : (
        // CENTRER VERTICALEMENT LE TITRE SI PAS D'IMAGE
        <div className="flex flex-1 w-full items-center justify-center">
          <h2 className="text-2xl font-semibold leading-snug text-center">{q.text}</h2>
        </div>
      )}
    </motion.div>
  );
}
