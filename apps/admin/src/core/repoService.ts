import { simpleGit, type SimpleGit } from 'simple-git';
import type { ConflictChoice, SyncResult } from './schemas';
import { SyncResultSchema } from './schemas';

export type RepoServiceDeps = {
  createGit?: (cwd: string) => SimpleGit;
};

function defaultGit(cwd: string): SimpleGit {
  return simpleGit({ baseDir: cwd });
}

/** One-shot authed URL — never persist this with `remote set-url`. */
export function authedUrl(remoteUrl: string, token: string): string {
  const u = new URL(remoteUrl.replace(/\.git$/, '') + '.git');
  // Strip any previous embedded credentials first.
  u.username = 'x-access-token';
  u.password = token;
  return u.toString().replace(/\.git$/, '') + '.git';
}

function cleanRemoteUrl(remoteUrl: string): string {
  const u = new URL(remoteUrl.includes('://') ? remoteUrl : `https://${remoteUrl}`);
  u.username = '';
  u.password = '';
  let href = u.toString();
  if (!href.endsWith('.git')) href = `${href.replace(/\/$/, '')}.git`;
  return href;
}

export class RepoService {
  private readonly createGit: (cwd: string) => SimpleGit;

  constructor(deps: RepoServiceDeps = {}) {
    this.createGit = deps.createGit ?? defaultGit;
  }

  async ensureClone(opts: {
    repoDir: string;
    remoteUrl: string;
    token: string;
    branch?: string;
  }): Promise<void> {
    const branch = opts.branch ?? 'main';
    const clean = cleanRemoteUrl(opts.remoteUrl);
    const git = this.createGit(opts.repoDir);
    const isRepo = await git.checkIsRepo().catch(() => false);
    if (!isRepo) {
      const rootGit = this.createGit('/');
      await rootGit.clone(authedUrl(clean, opts.token), opts.repoDir, [
        '--branch',
        branch,
        '--single-branch',
      ]);
      // Drop credentials from origin after clone.
      const cloned = this.createGit(opts.repoDir);
      await cloned.raw(['remote', 'set-url', 'origin', clean]);
      return;
    }
    // Keep a credential-free origin so CLI pushes use gh/SSH, not a stale OAuth token.
    await git.raw(['remote', 'set-url', 'origin', clean]);
  }

  async pull(repoDir: string, remoteUrl?: string, token?: string): Promise<SyncResult> {
    const git = this.createGit(repoDir);
    if (remoteUrl && token) {
      await git.fetch(authedUrl(cleanRemoteUrl(remoteUrl), token));
    } else {
      await git.fetch('origin');
    }
    const status = await git.status();
    const localSha = (await git.revparse(['HEAD'])).trim();
    const remoteSha = (await git.revparse(['origin/main'])).trim();

    if (localSha === remoteSha) {
      return SyncResultSchema.parse({ kind: 'ok' });
    }

    const behind = status.behind;
    const ahead = status.ahead;
    if (ahead === 0 && behind > 0) {
      if (remoteUrl && token) {
        await git.pull(authedUrl(cleanRemoteUrl(remoteUrl), token), 'main', { '--ff-only': null });
      } else {
        await git.pull('origin', 'main', { '--ff-only': null });
      }
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    if (ahead > 0 && behind === 0) {
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    return SyncResultSchema.parse({ kind: 'conflict', localSha, remoteSha });
  }

  async publish(opts: {
    repoDir: string;
    paths: string[];
    message: string;
    token: string;
    remoteUrl: string;
  }): Promise<SyncResult> {
    const git = this.createGit(opts.repoDir);
    const clean = cleanRemoteUrl(opts.remoteUrl);
    const pushUrl = authedUrl(clean, opts.token);
    await git.raw(['remote', 'set-url', 'origin', clean]);
    await git.add(opts.paths);
    const status = await git.status();
    if (status.staged.length === 0 && status.files.length === 0) {
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    if (status.staged.length === 0) {
      await git.add(opts.paths);
    }
    const afterAdd = await git.status();
    if (afterAdd.staged.length === 0) {
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    await git.commit(opts.message);

    try {
      await git.push(pushUrl, 'main');
      return SyncResultSchema.parse({ kind: 'ok' });
    } catch {
      await git.fetch(pushUrl);
      const localSha = (await git.revparse(['HEAD'])).trim();
      const remoteSha = (await git.revparse(['origin/main'])).trim();
      if (localSha === remoteSha) {
        return SyncResultSchema.parse({ kind: 'ok' });
      }
      return SyncResultSchema.parse({ kind: 'conflict', localSha, remoteSha });
    }
  }

  async resolveConflict(
    repoDir: string,
    choice: ConflictChoice,
    remoteUrl: string,
    token: string,
  ): Promise<SyncResult> {
    const git = this.createGit(repoDir);
    const clean = cleanRemoteUrl(remoteUrl);
    const pushUrl = authedUrl(clean, token);
    await git.raw(['remote', 'set-url', 'origin', clean]);
    await git.fetch(pushUrl);
    if (choice === 'discard-local') {
      await git.reset(['--hard', 'origin/main']);
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    try {
      await git.push([pushUrl, 'main', '--force-with-lease']);
      return SyncResultSchema.parse({ kind: 'ok' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return SyncResultSchema.parse({ kind: 'error', message });
    }
  }
}
