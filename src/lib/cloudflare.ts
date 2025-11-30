export const isCloudflareBeaconEnabled = (): boolean => {
  const token = import.meta.env.VITE_CLOUDFLARE_BEACON_TOKEN as string | undefined;
  return Boolean(token && token.trim().length > 0);
};
export function initCloudflareBeacon(): void {
  try {
    const token = import.meta.env.VITE_CLOUDFLARE_BEACON_TOKEN as string | undefined;
    if (!token) return;

    // Check if already injected
    const existing = document.querySelector('script[src*="cloudflareinsights.com/beacon"]');
    if (existing) return;
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.setAttribute("data-cf-beacon", JSON.stringify({
      token
    }));
    document.head.appendChild(script);
  } catch {
    // ignore
  }
}