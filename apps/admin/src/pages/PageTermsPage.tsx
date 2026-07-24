import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { PageName, PageTerms, SyncResult } from '../core/schemas';
import { adminIdForPageTerms } from '../core/commitMessages';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { PairedTermsEditor, ipcError } from '../components/PairedTermsEditor';

type Props = {
  page: PageName;
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

export function PageTermsPage({ page, onResult, onSaved }: Props) {
  const form = useDirtyForm<{ pt: PageTerms; en: PageTerms }>({ pt: {}, en: {} });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void api('content.loadPageTerms', { page })
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
  }, [page]);

  async function save() {
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: adminIdForPageTerms(page),
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
      title={`${page} terms`}
      actions={<SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />}
    >
      {loading ? <p>Loading…</p> : null}
      {loadError ? <p className="error">{loadError}</p> : null}
      {!loading && !loadError ? (
        <PairedTermsEditor
          pt={form.value.pt}
          en={form.value.en}
          onChange={(next) => form.setValue(next)}
        />
      ) : null}
    </PageShell>
  );
}
