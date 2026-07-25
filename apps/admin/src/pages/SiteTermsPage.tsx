import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { SiteTerms, SyncResult } from '../core/schemas';
import { SiteTermsSchema } from '../core/schemas';
import type { FieldErrors } from '../core/formErrors';
import { validateLocalePair } from '../core/formErrors';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { FieldError } from '../components/FieldError';
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
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let cancelled = false;
    void api('content.loadSiteTerms')
      .then((data) => {
        if (!cancelled) {
          form.reset(data);
          setErrors({});
        }
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
    const parsed = validateLocalePair(SiteTermsSchema, form.value);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: 'site-terms',
        payload: parsed.data,
      });
      onResult(result);
      if (result.kind === 'ok') {
        form.markSaved();
        setErrors({});
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
      {Object.keys(errors).length > 0 ? (
        <p className="form-error-banner">Fix the highlighted fields before saving.</p>
      ) : null}
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
                  {keys.map((key) => {
                    const ptPath = `pt.${section}.${key}`;
                    const enPath = `en.${section}.${key}`;
                    return (
                      <div key={key} className="paired-terms-row">
                        <span className="key">{key}</span>
                        <div className={errors[ptPath] ? 'field field-invalid' : 'field'}>
                          <input
                            value={form.value.pt[section][key] ?? ''}
                            onChange={(e) => {
                              form.setValue({
                                ...form.value,
                                pt: {
                                  ...form.value.pt,
                                  [section]: { ...form.value.pt[section], [key]: e.target.value },
                                },
                              });
                              setErrors({});
                            }}
                          />
                          <FieldError errors={errors} path={ptPath} />
                        </div>
                        <div className={errors[enPath] ? 'field field-invalid' : 'field'}>
                          <input
                            value={form.value.en[section][key] ?? ''}
                            onChange={(e) => {
                              form.setValue({
                                ...form.value,
                                en: {
                                  ...form.value.en,
                                  [section]: { ...form.value.en[section], [key]: e.target.value },
                                },
                              });
                              setErrors({});
                            }}
                          />
                          <FieldError errors={errors} path={enPath} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        : null}
    </PageShell>
  );
}
