import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { StateSchema, type State } from "./schema.js";

const STATE_FILE = "state.json";

export function readState(installDir: string): State | null {
  const statePath = join(installDir, STATE_FILE);
  if (!existsSync(statePath)) {
    return null;
  }
  const raw = readFileSync(statePath, "utf-8");
  const data = JSON.parse(raw);
  return StateSchema.parse(data);
}

/**
 * True when admin.txt exists but cannot be read. This happens when a prior
 * `sudo arrstack install` left it owned by root and a later non-sudo run hits
 * EACCES. The installer must NOT treat that as "no password" and silently
 * generate a new one: the qBittorrent container from the earlier run still
 * holds the old password, so a rotate rewrites qBittorrent.conf with a hash the
 * running container never sees and the user is locked out. Callers should stop
 * with an actionable message instead. A genuinely absent file returns false
 * (that is a normal fresh install).
 */
export function adminTxtUnreadable(installDir: string): boolean {
  const p = join(installDir, "admin.txt");
  if (!existsSync(p)) return false;
  try {
    readFileSync(p, "utf-8");
    return false;
  } catch {
    return true;
  }
}

export function writeState(installDir: string, state: State): void {
  const statePath = join(installDir, STATE_FILE);
  const tmpPath = `${statePath}.tmp`;
  const serialized = JSON.stringify(state, null, 2);
  writeFileSync(tmpPath, serialized, { mode: 0o600 });
  renameSync(tmpPath, statePath);
}
