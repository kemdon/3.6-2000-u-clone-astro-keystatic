import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const pidFile = path.join(root, '.playwright-test-server.pid');
const baseUrl = 'http://127.0.0.1:4510/';

async function waitForServer(timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // ignore until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`测试服务器未在 ${timeoutMs}ms 内启动: ${baseUrl}`);
}

export default async function globalSetup() {
  try {
    const previousPid = Number(await fs.readFile(pidFile, 'utf8'));
    if (previousPid) {
      try {
        process.kill(previousPid);
      } catch {
        // ignore stale pid
      }
    }
  } catch {
    // ignore missing pid file
  }

  const child = spawn('node', ['scripts/test-server.mjs'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  await fs.writeFile(pidFile, String(child.pid), 'utf8');
  await waitForServer();
}
