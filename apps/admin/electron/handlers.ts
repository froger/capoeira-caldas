import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, safeStorage, shell, dialog, BrowserWindow } from 'electron';
import { Octokit } from '@octokit/rest';
import { DeviceFlow } from '../src/core/deviceFlow';
import { TokenStore } from '../src/core/tokenStore';
import { RepoService } from '../src/core/repoService';
import { createContentService, savePayloadForPage } from '../src/core/contentService';
import { commitMessageFor } from '../src/core/commitMessages';
import { scopedPathsFor } from '../src/core/contentPaths';
import { fetchPublishStatus } from '../src/core/workflows';
import { resolveWorkspaceRoot, isAdminContentRepo } from '../src/core/workspaceRoot';
import { absolutePublicAsset, copyProductImages } from '../src/core/galleryAssets';
import type { IpcChannel, IpcInput, IpcOutput } from '../src/core/ipcSchema';
import { parseIpcInput, parseIpcOutput } from '../src/core/ipcSchema';
import type { AdminPageId } from '../src/core/schemas';

const DEFAULT_REMOTE = 'https://github.com/froger/capoeira-caldas.git';
const OWNER = 'froger';
const REPO = 'capoeira-caldas';

const __dirname = dirname(fileURLToPath(import.meta.url));

function clientId(): string {
  return process.env.GITHUB_OAUTH_CLIENT_ID ?? '';
}

function tokenFilePath(): string {
  return join(app.getPath('userData'), 'token.enc');
}

function mimeFor(path: string): string {
  const ext = extname(path).slice(1).toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'application/octet-stream';
}

/** data: URLs so the renderer can show local files under Vite http:// origin. */
function dataUrlFor(absPath: string): string {
  const buf = readFileSync(absPath);
  return `data:${mimeFor(absPath)};base64,${buf.toString('base64')}`;
}

function createTokenStore(): TokenStore {
  return new TokenStore(
    {
      encrypt: (plain) => {
        if (!safeStorage.isEncryptionAvailable()) {
          return Buffer.from(plain, 'utf-8').toString('base64');
        }
        return safeStorage.encryptString(plain).toString('base64');
      },
      decrypt: (cipher) => {
        const buf = Buffer.from(cipher, 'base64');
        if (!safeStorage.isEncryptionAvailable()) {
          return buf.toString('utf-8');
        }
        return safeStorage.decryptString(buf);
      },
    },
    {
      read: () => {
        const p = tokenFilePath();
        if (!existsSync(p)) return null;
        return readFileSync(p, 'utf-8');
      },
      write: (value) => {
        const p = tokenFilePath();
        if (value === null) {
          if (existsSync(p)) unlinkSync(p);
          return;
        }
        mkdirSync(join(app.getPath('userData')), { recursive: true });
        writeFileSync(p, value, 'utf-8');
      },
    },
  );
}

export type AppContext = {
  tokenStore: TokenStore;
  repo: RepoService;
  repoDir: string;
  remoteUrl: string;
  deviceFlow: DeviceFlow;
  pendingDevice?: { deviceCode: string; interval: number };
};

export function createAppContext(): AppContext {
  const fallback = join(app.getPath('userData'), 'workspace', 'capoeira-caldas');
  mkdirSync(fallback, { recursive: true });
  const repoDir = resolveWorkspaceRoot(fallback, [
    process.cwd(),
    join(process.cwd(), '..'),
    join(process.cwd(), '../..'),
    join(__dirname, '../..'),
    join(__dirname, '../../..'),
  ]);
  return {
    tokenStore: createTokenStore(),
    repo: new RepoService(),
    repoDir,
    remoteUrl: process.env.CAPOEIRA_REPO_URL ?? DEFAULT_REMOTE,
    deviceFlow: new DeviceFlow({ clientId: clientId() }),
  };
}

function requireToken(ctx: AppContext): string {
  const token = ctx.tokenStore.load();
  if (!token) throw new Error('Not authenticated');
  return token;
}

function content(ctx: AppContext) {
  return createContentService(ctx.repoDir);
}

function assertContentLayout(ctx: AppContext): void {
  if (!isAdminContentRepo(ctx.repoDir)) {
    throw new Error(
      `Workspace is missing split i18n files (src/i18n/site.pt.yml + pages/). Current: ${ctx.repoDir}. Run Sync, or set CAPOEIRA_REPO_DIR to your local checkout.`,
    );
  }
}

function octokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

type HandlerMap = {
  [C in IpcChannel]: (ctx: AppContext, input: IpcInput<C>) => Promise<IpcOutput<C>>;
};

export const handlers: HandlerMap = {
  'auth.status': async (ctx) => ({ authenticated: Boolean(ctx.tokenStore.load()) }),
  'auth.startDeviceFlow': async (ctx) => {
    if (!clientId()) throw new Error('GITHUB_OAUTH_CLIENT_ID is not configured');
    const started = await ctx.deviceFlow.start();
    ctx.pendingDevice = { deviceCode: started.device_code, interval: started.interval };
    const verificationUriComplete =
      started.verification_uri_complete ??
      `${started.verification_uri}?user_code=${encodeURIComponent(started.user_code)}`;
    return {
      userCode: started.user_code,
      verificationUri: started.verification_uri,
      verificationUriComplete,
      expiresIn: started.expires_in,
      deviceCode: started.device_code,
      interval: started.interval,
    };
  },
  'auth.waitForToken': async (ctx, input) => {
    const token = await ctx.deviceFlow.pollForToken(input.deviceCode, input.interval);
    ctx.tokenStore.save(token.access_token);
    return { ok: true as const };
  },
  'shell.openExternal': async (_ctx, input) => {
    await shell.openExternal(input.url);
    return { ok: true as const };
  },
  'gallery.pickImages': async (ctx) => {
    assertContentLayout(ctx);
    const win = BrowserWindow.getFocusedWindow();
    const opts = {
      title: 'Choose product images',
      properties: ['openFile', 'multiSelections'] as Array<
        'openFile' | 'multiSelections'
      >,
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }],
    };
    const picked = win
      ? await dialog.showOpenDialog(win, opts)
      : await dialog.showOpenDialog(opts);
    if (picked.canceled || picked.filePaths.length === 0) {
      return { images: [] };
    }
    const copied = copyProductImages(ctx.repoDir, picked.filePaths);
    return {
      images: copied.map((img) => ({
        publicPath: img.publicPath,
        fileUrl: dataUrlFor(img.absolutePath),
      })),
    };
  },
  'content.resolveAssets': async (ctx, input) => {
    return {
      assets: input.publicPaths.map((publicPath) => {
        const abs = absolutePublicAsset(ctx.repoDir, publicPath);
        return {
          publicPath,
          fileUrl: existsSync(abs) ? dataUrlFor(abs) : null,
        };
      }),
    };
  },
  'auth.signOut': async (ctx) => {
    ctx.tokenStore.clear();
    return { ok: true as const };
  },
  'repo.ensure': async (ctx) => {
    const token = requireToken(ctx);
    await ctx.repo.ensureClone({
      repoDir: ctx.repoDir,
      remoteUrl: ctx.remoteUrl,
      token,
    });
    assertContentLayout(ctx);
    return { repoDir: ctx.repoDir };
  },
  'content.loadSiteTerms': async (ctx) => {
    assertContentLayout(ctx);
    return content(ctx).loadSiteTerms();
  },
  'content.loadPageTerms': async (ctx, input) => {
    assertContentLayout(ctx);
    return content(ctx).loadPageTerms(input.page);
  },
  'content.loadGallery': async (ctx) => {
    assertContentLayout(ctx);
    return content(ctx).loadGallery();
  },
  'content.loadSchedule': async (ctx) => {
    assertContentLayout(ctx);
    return content(ctx).loadSchedule();
  },
  'content.listEvents': async (ctx) => {
    assertContentLayout(ctx);
    return content(ctx).listEvents();
  },
  'content.loadEvent': async (ctx, input) => {
    assertContentLayout(ctx);
    return content(ctx).loadEvent(input.slug);
  },
  'content.saveAndPublish': async (ctx, input) => {
    const token = requireToken(ctx);
    assertContentLayout(ctx);
    savePayloadForPage(content(ctx), input.pageId, input.payload);
    return ctx.repo.publish({
      repoDir: ctx.repoDir,
      paths: scopedPathsFor(input.pageId),
      message: commitMessageFor(input.pageId),
      token,
      remoteUrl: ctx.remoteUrl,
    });
  },
  'content.deleteEvent': async (ctx, input) => {
    const token = requireToken(ctx);
    assertContentLayout(ctx);
    content(ctx).removeEvent(input.slug);
    const pageId: AdminPageId = 'events';
    return ctx.repo.publish({
      repoDir: ctx.repoDir,
      paths: scopedPathsFor(pageId),
      message: commitMessageFor(pageId),
      token,
      remoteUrl: ctx.remoteUrl,
    });
  },
  'sync.pull': async (ctx) => {
    const token = requireToken(ctx);
    return ctx.repo.pull(ctx.repoDir, ctx.remoteUrl, token);
  },
  'sync.resolve': async (ctx, input) => {
    const token = requireToken(ctx);
    return ctx.repo.resolveConflict(ctx.repoDir, input.choice, ctx.remoteUrl, token);
  },
  'publish.status': async (ctx) => {
    const token = requireToken(ctx);
    const api = octokit(token);
    return fetchPublishStatus({
      listRuns: async () => {
        const res = await api.actions.listWorkflowRuns({
          owner: OWNER,
          repo: REPO,
          workflow_id: 'website.yml',
          branch: 'main',
          per_page: 1,
        });
        return res.data.workflow_runs.map((r) => ({
          id: r.id,
          status: r.status,
          conclusion: r.conclusion,
          html_url: r.html_url,
          updated_at: r.updated_at,
          name: r.name ?? undefined,
        }));
      },
      listJobs: async (runId) => {
        const res = await api.actions.listJobsForWorkflowRun({
          owner: OWNER,
          repo: REPO,
          run_id: runId,
        });
        return {
          jobs: res.data.jobs.map((j) => ({
            name: j.name,
            status: j.status,
            conclusion: j.conclusion,
          })),
        };
      },
    });
  },
};

export async function handleIpc<C extends IpcChannel>(
  ctx: AppContext,
  channel: C,
  rawInput: unknown,
): Promise<IpcOutput<C>> {
  const input = parseIpcInput(channel, rawInput ?? undefined);
  const handler = handlers[channel] as (
    c: AppContext,
    i: IpcInput<C>,
  ) => Promise<IpcOutput<C>>;
  const out = await handler(ctx, input);
  return parseIpcOutput(channel, out);
}
