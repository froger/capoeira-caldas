import { useCallback, useEffect, useState } from 'react';
import { api } from '../ports/api';
import type { PageName, PublishStatus, SyncResult } from '../core/schemas';
import { PublishBadge, ConflictDialog } from '../components/PublishBadge';
import { SiteTermsPage } from '../pages/SiteTermsPage';
import { PageTermsPage } from '../pages/PageTermsPage';
import { EventsPage } from '../pages/EventsPage';
import { GalleryPage } from '../pages/GalleryPage';
import { TimetablePage } from '../pages/TimetablePage';

type Nav =
  | 'site-terms'
  | `page-terms-${PageName}`
  | 'events'
  | 'gallery'
  | 'timetable';

const PAGE_TERMS: PageName[] = [
  'classes',
  'about',
  'contact',
  'gallery',
  'schedule',
  'privacy',
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState<Nav>('site-terms');
  const [device, setDevice] = useState<{
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    deviceCode: string;
    interval: number;
  } | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [publish, setPublish] = useState<PublishStatus | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [conflict, setConflict] = useState<Extract<SyncResult, { kind: 'conflict' }> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refreshPublish = useCallback(async () => {
    setPublishLoading(true);
    try {
      setPublish(await api('publish.status'));
    } catch {
      setPublish(null);
    } finally {
      setPublishLoading(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const status = await api('auth.status');
    setAuthed(status.authenticated);
    if (!status.authenticated) {
      setReady(false);
      return;
    }
    try {
      await api('repo.ensure');
      setReady(true);
      await refreshPublish();
    } catch (e) {
      setReady(false);
      setError(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+':\s*/i, '').replace(/^Error:\s*/i, '') : String(e));
      throw e;
    }
  }, [refreshPublish]);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!authed) return;
    const id = window.setInterval(() => void refreshPublish(), 15_000);
    return () => window.clearInterval(id);
  }, [authed, refreshPublish]);

  function handleResult(result: SyncResult) {
    if (result.kind === 'conflict') setConflict(result);
    else if (result.kind === 'error') setError(result.message);
    else setError(null);
  }

  function ipcError(e: unknown): string {
    if (!(e instanceof Error)) return String(e);
    const m = e.message.replace(/^Error invoking remote method '[^']+':\s*/i, '');
    return m.replace(/^Error:\s*/i, '') || e.message;
  }

  async function beginDeviceFlow() {
    setError(null);
    setAuthBusy(true);
    try {
      const started = await api('auth.startDeviceFlow');
      const next = {
        userCode: started.userCode,
        verificationUri: started.verificationUri,
        verificationUriComplete: started.verificationUriComplete,
        deviceCode: started.deviceCode,
        interval: started.interval,
      };
      setDevice(next);
      await api('shell.openExternal', { url: next.verificationUriComplete });
      await api('auth.waitForToken', {
        deviceCode: next.deviceCode,
        interval: next.interval,
      });
      setDevice(null);
      await refreshAuth();
    } catch (e) {
      setError(ipcError(e));
    } finally {
      setAuthBusy(false);
    }
  }

  async function openLoginPage() {
    if (!device) return;
    try {
      await api('shell.openExternal', { url: device.verificationUriComplete });
    } catch (e) {
      setError(ipcError(e));
    }
  }

  async function waitToken() {
    if (!device) return;
    setError(null);
    setAuthBusy(true);
    try {
      await api('auth.waitForToken', {
        deviceCode: device.deviceCode,
        interval: device.interval,
      });
      setDevice(null);
      await refreshAuth();
    } catch (e) {
      setError(ipcError(e));
    } finally {
      setAuthBusy(false);
    }
  }

  async function syncPull() {
    setSyncing(true);
    setError(null);
    try {
      const result = await api('sync.pull');
      handleResult(result);
      if (result.kind === 'ok') await refreshPublish();
    } finally {
      setSyncing(false);
    }
  }

  async function resolve(choice: 'force-push-mine' | 'discard-local') {
    const result = await api('sync.resolve', { choice });
    setConflict(null);
    handleResult(result);
    if (result.kind === 'ok') {
      setReady(false);
      await api('repo.ensure');
      setReady(true);
      await refreshPublish();
    }
  }

  if (!authed) {
    return (
      <div className="login">
        <h1>Capoeira Admin</h1>
        <p>Sign in with GitHub (device flow).</p>
        {device ? (
          <>
            <p>
              Browser should open with code <strong>{device.userCode}</strong>.
            </p>
            <p className="muted">
              If it did not,{' '}
              <button type="button" className="linkish" onClick={() => void openLoginPage()}>
                open GitHub login
              </button>{' '}
              outside this app.
            </p>
            {authBusy ? <p>Waiting for GitHub authorization…</p> : null}
            <button type="button" disabled={authBusy} onClick={() => void waitToken()}>
              {authBusy ? 'Waiting…' : 'I authorized — continue'}
            </button>
          </>
        ) : (
          <button type="button" disabled={authBusy} onClick={() => void beginDeviceFlow()}>
            {authBusy ? 'Starting…' : 'Sign in with GitHub'}
          </button>
        )}
        {error ? <p className="error">{error}</p> : null}
      </div>
    );
  }

  if (!ready) {
    return (
      <p className="login">
        Preparing workspace…{error ? <span className="error"> {error}</span> : null}
      </p>
    );
  }

  return (
    <div className="app">
      <aside className="nav">
        <h1>Capoeira Admin</h1>
        <button type="button" className={nav === 'site-terms' ? 'active' : ''} onClick={() => setNav('site-terms')}>
          Site terms
        </button>
        {PAGE_TERMS.map((p) => {
          const id = `page-terms-${p}` as Nav;
          return (
            <button
              key={p}
              type="button"
              className={nav === id ? 'active' : ''}
              onClick={() => setNav(id)}
            >
              {p} terms
            </button>
          );
        })}
        <button type="button" className={nav === 'events' ? 'active' : ''} onClick={() => setNav('events')}>
          Events
        </button>
        <button type="button" className={nav === 'gallery' ? 'active' : ''} onClick={() => setNav('gallery')}>
          Gallery
        </button>
        <button type="button" className={nav === 'timetable' ? 'active' : ''} onClick={() => setNav('timetable')}>
          Timetable
        </button>
        <hr />
        <button type="button" disabled={syncing} onClick={() => void syncPull()}>
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
        <PublishBadge status={publish} loading={publishLoading} />
        <button
          type="button"
          className="ghost"
          onClick={() =>
            void api('auth.signOut').then(() => {
              setAuthed(false);
              setReady(false);
            })
          }
        >
          Sign out
        </button>
      </aside>
      <main>
        {error ? <p className="error">{error}</p> : null}
        {nav === 'site-terms' ? (
          <SiteTermsPage onResult={handleResult} onSaved={() => void refreshPublish()} />
        ) : null}
        {PAGE_TERMS.map((p) =>
          nav === `page-terms-${p}` ? (
            <PageTermsPage
              key={p}
              page={p}
              onResult={handleResult}
              onSaved={() => void refreshPublish()}
            />
          ) : null,
        )}
        {nav === 'events' ? (
          <EventsPage onResult={handleResult} onSaved={() => void refreshPublish()} />
        ) : null}
        {nav === 'gallery' ? (
          <GalleryPage onResult={handleResult} onSaved={() => void refreshPublish()} />
        ) : null}
        {nav === 'timetable' ? (
          <TimetablePage onResult={handleResult} onSaved={() => void refreshPublish()} />
        ) : null}
      </main>
      <ConflictDialog
        conflict={conflict}
        onChoose={(c) => void resolve(c)}
        onClose={() => setConflict(null)}
      />
    </div>
  );
}
