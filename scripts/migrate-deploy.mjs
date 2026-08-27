import { execSync } from "node:child_process";

// Neon's free-tier compute suspends when idle and can take longer than
// Prisma Migrate's fixed 10s advisory-lock timeout to wake back up, which
// makes `prisma migrate deploy` fail with P1002 on the first request after
// a period of inactivity (see https://pris.ly/d/migrate-advisory-locking).
// Retrying a few times with a short delay lets the first attempt "wake up"
// the database so a later attempt succeeds against a warm connection.
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 5000;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    process.exit(0);
  } catch {
    if (attempt === MAX_ATTEMPTS) {
      console.error(`prisma migrate deploy failed after ${MAX_ATTEMPTS} attempts.`);
      process.exit(1);
    }
    console.log(
      `prisma migrate deploy attempt ${attempt} failed (likely a database cold start) — retrying in ${RETRY_DELAY_MS}ms...`
    );
    sleepSync(RETRY_DELAY_MS);
  }
}
