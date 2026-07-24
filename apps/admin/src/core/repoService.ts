import { simpleGit, type SimpleGit } from 'simple-git';
import type { ConflictChoice, SyncResult } from './schemas';
import { SyncResultSchema } from './schemas';

export type GitAuth = {
  token: string;
  remoteUrl: string;
};

export type RepoServiceDeps = {
  createGit?: (cwd: string) => SimpleGit;
};

function defaultGit(cwd: string): SimpleGit {
  return simpleGit({ baseDir: cwd });
}

function authedUrl(remoteUrl: string, token: string): string {
  const u = new URL(remoteUrl);
  u.username = 'x-access-token';
  u.password = token;
  return u.toString();
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
    const git = this.createGit(opts.repoDir);
    const isRepo = await git.checkIsRepo().catch(() => false);
    if (!isRepo) {
      const rootGit = this.createGit('/');
      await rootGit.clone(authedUrl(opts.remoteUrl, opts.token), opts.repoDir, [
        '--branch',
        branch,
        '--single-branch',
      ]);
      return;
    }
    await git.raw(['remote', 'set-url', 'origin', authedUrl(opts.remoteUrl, opts.token)]);
  }

  async pull(repoDir: string): Promise<SyncResult> {
    const git = this.createGit(repoDir);
    await git.fetch('origin');
    const status = await git.status();
    const localSha = (await git.revparse(['HEAD'])).trim();
    const remoteSha = (await git.revparse(['origin/main'])).trim();

    if (localSha === remoteSha) {
      return SyncResultSchema.parse({ kind: 'ok' });
    }

    const behind = status.behind;
    const ahead = status.ahead;
    if (ahead === 0 && behind > 0) {
      await git.pull('origin', 'main', { '--ff-only': null });
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
    await git.raw(['remote', 'set-url', 'origin', authedUrl(opts.remoteUrl, opts.token)]);
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
      await git.push('origin', 'main');
      return SyncResultSchema.parse({ kind: 'ok' });
    } catch {
      await git.fetch('origin');
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
    await git.raw(['remote', 'set-url', 'origin', authedUrl(remoteUrl, token)]);
    await git.fetch('origin');
    if (choice === 'discard-local') {
      await git.reset(['--hard', 'origin/main']);
      return SyncResultSchema.parse({ kind: 'ok' });
    }
    try {
      await git.push(['origin', 'main', '--force-with-lease']);
      return SyncResultSchema.parse({ kind: 'ok' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return SyncResultSchema.parse({ kind: 'error', message });
    }
  }
}
