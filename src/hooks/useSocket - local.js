import { useEffect, useState } from "react";
import { io } from "socket.io-client";



/**
 * Retourne le socket prêt ou null si pas encore connecté.
 */
export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:4000", { autoConnect: true });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return socket;
}
