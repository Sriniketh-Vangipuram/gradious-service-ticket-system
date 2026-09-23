import { useEffect } from "react";

import { socket } from "./socket";

interface UseSocketConnectionOptions {
  enabled: boolean;
}

export function useSocketConnection({
  enabled,
}: UseSocketConnectionOptions) {
  useEffect(() => {
    if (!enabled) {
      socket.disconnect();
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Do not disconnect here.
      //
      // React may run effect cleanup during development lifecycle
      // checks. The socket should remain alive while authentication
      // is still active.
    };
  }, [enabled]);
}