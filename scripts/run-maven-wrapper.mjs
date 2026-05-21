import { spawnSync } from "node:child_process";
import { platform } from "node:os";

const args = process.argv.slice(2);
const isWindows = platform() === "win32";
const command = isWindows ? "mvnw.cmd" : "sh";
const commandArgs = isWindows ? args : ["mvnw", ...args];

const result = spawnSync(command, commandArgs, {
  cwd: "backend-spring",
  stdio: "inherit",
  shell: isWindows,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
