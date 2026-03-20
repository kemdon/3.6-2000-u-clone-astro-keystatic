import fs from 'node:fs/promises';
import path from 'node:path';

const pidFile = path.join(process.cwd(), '.playwright-test-server.pid');

export default async function globalTeardown() {
  try {
    const pid = Number(await fs.readFile(pidFile, 'utf8'));
    if (pid) {
      try {
        process.kill(pid);
      } catch {
        // ignore process already exited
      }
    }
  } finally {
    await fs.rm(pidFile, { force: true });
  }
}
