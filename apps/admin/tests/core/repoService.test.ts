import { describe, expect, it, vi } from 'vitest';
import { RepoService } from '../../src/core/repoService';

function mockGit(overrides: Record<string, unknown> = {}) {
  return {
    checkIsRepo: vi.fn(async () => true),
    clone: vi.fn(async () => undefined),
    raw: vi.fn(async () => ''),
    fetch: vi.fn(async () => undefined),
    status: vi.fn(async () => ({ ahead: 0, behind: 0, staged: [], files: [] })),
    revparse: vi.fn(async () => 'abc'),
    pull: vi.fn(async () => undefined),
    add: vi.fn(async () => undefined),
    commit: vi.fn(async () => undefined),
    push: vi.fn(async () => undefined),
    reset: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('RepoService', () => {
  it('clones when not a repo', async () => {
    const g = mockGit({ checkIsRepo: vi.fn(async () => false) });
    const svc = new RepoService({ createGit: () => g as never });
    await svc.ensureClone({
      repoDir: '/tmp/r',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
      token: 't',
    });
    expect(g.clone).toHaveBeenCalled();
  });

  it('sets remote when already a repo', async () => {
    const g = mockGit();
    const svc = new RepoService({ createGit: () => g as never });
    await svc.ensureClone({
      repoDir: '/tmp/r',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
      token: 't',
    });
    expect(g.raw).toHaveBeenCalled();
  });

  it('pulls ff-only when behind', async () => {
    const g = mockGit({
      status: vi.fn(async () => ({ ahead: 0, behind: 2, staged: [], files: [] })),
      revparse: vi
        .fn()
        .mockResolvedValueOnce('local')
        .mockResolvedValueOnce('remote'),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.pull('/tmp/r');
    expect(result.kind).toBe('ok');
    expect(g.pull).toHaveBeenCalled();
  });

  it('reports conflict when diverged', async () => {
    const g = mockGit({
      status: vi.fn(async () => ({ ahead: 1, behind: 1, staged: [], files: [] })),
      revparse: vi
        .fn()
        .mockResolvedValueOnce('locals')
        .mockResolvedValueOnce('remotes'),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.pull('/tmp/r');
    expect(result).toEqual({ kind: 'conflict', localSha: 'locals', remoteSha: 'remotes' });
  });

  it('publishes with commit and push', async () => {
    const g = mockGit({
      status: vi
        .fn()
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: [], files: [{ path: 'a' }] })
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: ['a'], files: [] }),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.publish({
      repoDir: '/tmp/r',
      paths: ['src/i18n'],
      message: 'updating site terms',
      token: 't',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
    });
    expect(result.kind).toBe('ok');
    expect(g.commit).toHaveBeenCalledWith('updating site terms');
    expect(g.push).toHaveBeenCalled();
  });

  it('returns conflict when push fails', async () => {
    const g = mockGit({
      status: vi
        .fn()
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: ['a'], files: [] })
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: ['a'], files: [] }),
      push: vi.fn(async () => {
        throw new Error('rejected');
      }),
      revparse: vi
        .fn()
        .mockResolvedValueOnce('L')
        .mockResolvedValueOnce('R'),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.publish({
      repoDir: '/tmp/r',
      paths: ['x'],
      message: 'm',
      token: 't',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
    });
    expect(result.kind).toBe('conflict');
  });

  it('resolves discard and force-push', async () => {
    const g = mockGit();
    const svc = new RepoService({ createGit: () => g as never });
    expect(
      (
        await svc.resolveConflict(
          '/tmp/r',
          'discard-local',
          'https://github.com/froger/capoeira-caldas.git',
          't',
        )
      ).kind,
    ).toBe('ok');
    expect(g.reset).toHaveBeenCalled();

    expect(
      (
        await svc.resolveConflict(
          '/tmp/r',
          'force-push-mine',
          'https://github.com/froger/capoeira-caldas.git',
          't',
        )
      ).kind,
    ).toBe('ok');

    g.push = vi.fn(async () => {
      throw new Error('lease failed');
    });
    const err = await svc.resolveConflict(
      '/tmp/r',
      'force-push-mine',
      'https://github.com/froger/capoeira-caldas.git',
      't',
    );
    expect(err.kind).toBe('error');
  });

  it('pull ok when equal or ahead-only', async () => {
    const equal = mockGit({
      revparse: vi.fn(async () => 'same'),
      status: vi.fn(async () => ({ ahead: 0, behind: 0, staged: [], files: [] })),
    });
    const svc = new RepoService({ createGit: () => equal as never });
    expect((await svc.pull('/tmp/r')).kind).toBe('ok');

    const ahead = mockGit({
      status: vi.fn(async () => ({ ahead: 2, behind: 0, staged: [], files: [] })),
      revparse: vi
        .fn()
        .mockResolvedValueOnce('L')
        .mockResolvedValueOnce('R'),
    });
    const svc2 = new RepoService({ createGit: () => ahead as never });
    expect((await svc2.pull('/tmp/r')).kind).toBe('ok');
  });

  it('publish ok when push fails but shas match', async () => {
    const g = mockGit({
      status: vi.fn(async () => ({ ahead: 0, behind: 0, staged: ['a'], files: [] })),
      push: vi.fn(async () => {
        throw new Error('race');
      }),
      revparse: vi.fn(async () => 'SAME'),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.publish({
      repoDir: '/tmp/r',
      paths: ['x'],
      message: 'm',
      token: 't',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
    });
    expect(result.kind).toBe('ok');
  });

  it('publish re-adds when first status has files but empty staged', async () => {
    const g = mockGit({
      status: vi
        .fn()
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: [], files: [{ path: 'a' }] })
        .mockResolvedValueOnce({ ahead: 0, behind: 0, staged: [], files: [{ path: 'a' }] }),
    });
    const svc = new RepoService({ createGit: () => g as never });
    const result = await svc.publish({
      repoDir: '/tmp/r',
      paths: ['x'],
      message: 'm',
      token: 't',
      remoteUrl: 'https://github.com/froger/capoeira-caldas.git',
    });
    expect(result.kind).toBe('ok');
    expect(g.commit).not.toHaveBeenCalled();
  });
});
