import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const BACK_URL = import.meta.env.VITE_API_URL || "https://quiz-back.onrender.com";

export default function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(BACK_URL, {
      transports: ["websocket"], // Safari/iPhone OK
      autoConnect: true,
    });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  return socket;
}
