import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { SiteTerms, SyncResult } from '../core/schemas';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { ipcError } from '../components/PairedTermsEditor';

type Props = {
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

const empty: { pt: SiteTerms; en: SiteTerms } = {
  pt: { nav: {}, routes: {}, footer: {}, home: {}, common: {} },
  en: { nav: {}, routes: {}, footer: {}, home: {}, common: {} },
};

const SECTIONS = ['nav', 'routes', 'footer', 'home', 'common'] as const;

export function SiteTermsPage({ onResult, onSaved }: Props) {
  const form = useDirtyForm(empty);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void api('content.loadSiteTerms')
      .then((data) => {
        if (!cancelled) form.reset(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(ipcError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: 'site-terms',
        payload: form.value,
      });
      onResult(result);
      if (result.kind === 'ok') {
        form.markSaved();
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title="Site terms (UI)"
      actions={<SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />}
    >
      {loading ? <p>Loading…</p> : null}
      {loadError ? <p className="error">{loadError}</p> : null}
      {!loading && !loadError
        ? SECTIONS.map((section) => {
            const keys = Array.from(
              new Set([
                ...Object.keys(form.value.pt[section]),
                ...Object.keys(form.value.en[section]),
              ]),
            ).sort();
            return (
              <section key={section} className="shared-block">
                <h3>{section}</h3>
                <div className="paired-terms">
                  <div className="paired-terms-head">
                    <span>Key</span>
                    <span>PT</span>
                    <span>EN</span>
                  </div>
                  {keys.map((key) => (
                    <div key={key} className="paired-terms-row">
                      <span className="key">{key}</span>
                      <input
                        value={form.value.pt[section][key] ?? ''}
                        onChange={(e) =>
                          form.setValue({
                            ...form.value,
                            pt: {
                              ...form.value.pt,
                              [section]: { ...form.value.pt[section], [key]: e.target.value },
                            },
                          })
                        }
                      />
                      <input
                        value={form.value.en[section][key] ?? ''}
                        onChange={(e) =>
                          form.setValue({
                            ...form.value,
                            en: {
                              ...form.value.en,
                              [section]: { ...form.value.en[section], [key]: e.target.value },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        : null}
    </PageShell>
  );
}
