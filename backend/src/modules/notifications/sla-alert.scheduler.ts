import { checkSlaAlerts } from "./sla-alert.service";

const SLA_ALERT_INTERVAL_MS = 60_000;

export function startSlaAlertScheduler(): () => Promise<void> {
  let activeScan: Promise<void> | undefined;

  const startScan = (): void => {
    // Prevent overlapping scans within this process.
    if (activeScan) {
      console.warn(
        "[SLA Scheduler] Previous scan is still running; skipping.",
      );
      return;
    }

    activeScan = checkSlaAlerts()
      .then(() => {
        console.log("[SLA Scheduler] SLA alert scan completed.");
      })
      .catch((error: unknown) => {
        console.error("[SLA Scheduler] SLA alert scan failed:", error);
      })
      .finally(() => {
        activeScan = undefined;
      });
  };

  startScan();

  const interval = setInterval(startScan, SLA_ALERT_INTERVAL_MS);

  console.log(
    `[SLA Scheduler] Started. Interval: ${SLA_ALERT_INTERVAL_MS / 1000}s.`,
  );

  return async (): Promise<void> => {
    clearInterval(interval);

    // Wait for an already-running scan to finish before shutdown continues.
    await activeScan;

    console.log("[SLA Scheduler] Stopped.");
  };
}