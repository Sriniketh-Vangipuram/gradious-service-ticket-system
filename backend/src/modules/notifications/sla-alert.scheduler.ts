import { checkSlaAlerts } from "./sla-alert.service";

const SLA_ALERT_INTERVAL_MS = 60_000; // 60 seconds

export function startSlaAlertScheduler(): () => void {
  let isRunning = false;

  const runSlaAlertCheck = async (): Promise<void> => {
    // Prevent overlapping scans within this process.
    if (isRunning) {
      console.warn("[SLA Scheduler] Previous scan is still running; skipping.");
      return;
    }

    isRunning = true;

    try {
      await checkSlaAlerts();
      console.log("[SLA Scheduler] SLA alert scan completed.");
    } catch (error) {
      console.error("[SLA Scheduler] SLA alert scan failed:", error);
    } finally {
      isRunning = false;
    }
  };

  // Run once at startup, then every 60 seconds.
  void runSlaAlertCheck();

  const interval = setInterval(() => {
    void runSlaAlertCheck();
  }, SLA_ALERT_INTERVAL_MS);

  console.log(
    `[SLA Scheduler] Started. Interval: ${SLA_ALERT_INTERVAL_MS / 1000}s.`,
  );

  // Return a stop function for graceful shutdown.
  return () => {
    clearInterval(interval);
    console.log("[SLA Scheduler] Stopped.");
  };
}