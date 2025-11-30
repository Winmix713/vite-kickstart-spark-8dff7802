import { useEffect, useState } from "react";
export const useShimmer = (delay = 320) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timeout);
  }, [delay]);
  return ready;
};