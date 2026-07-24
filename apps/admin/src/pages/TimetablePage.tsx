import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { ScheduleFile, ScheduleRow, SyncResult } from '../core/schemas';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ipcError } from '../components/PairedTermsEditor';

type Props = {
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

const empty: { pt: ScheduleFile; en: ScheduleFile } = {
  pt: { classes: [] },
  en: { classes: [] },
};

function blankRow(): ScheduleRow {
  return {
    day: '',
    time: '',
    level: '',
    instructor: '',
    location: '',
  };
}

export function TimetablePage({ onResult, onSaved }: Props) {
  const form = useDirtyForm(empty);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api('content.loadSchedule')
      .then((data) => {
        if (!cancelled) form.reset(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(ipcError(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: 'timetable',
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

  function updateRow(
    locale: 'pt' | 'en',
    index: number,
    field: keyof ScheduleRow,
    value: string,
  ) {
    const classes = form.value[locale].classes.map((row, i) => {
      if (i !== index) return row;
      if (field === 'audience') {
        return { ...row, audience: value === '' ? undefined : (value as 'kids' | 'adult') };
      }
      return { ...row, [field]: value };
    });
    form.setValue({ ...form.value, [locale]: { classes } });
  }

  function addEntry() {
    form.setValue({
      pt: { classes: [...form.value.pt.classes, blankRow()] },
      en: { classes: [...form.value.en.classes, blankRow()] },
    });
  }

  function deleteEntry(index: number) {
    form.setValue({
      pt: { classes: form.value.pt.classes.filter((_, i) => i !== index) },
      en: { classes: form.value.en.classes.filter((_, i) => i !== index) },
    });
    setPendingDelete(null);
  }

  const count = Math.max(form.value.pt.classes.length, form.value.en.classes.length);
  const deleteLabel =
    pendingDelete === null
      ? ''
      : form.value.pt.classes[pendingDelete]?.day ||
        form.value.en.classes[pendingDelete]?.day ||
        `entry #${pendingDelete + 1}`;

  return (
    <PageShell
      title="Timetable"
      actions={
        <>
          <button type="button" className="btn btn-new" onClick={addEntry}>
            New
          </button>
          <span className="action-sep" aria-hidden="true" />
          <SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />
        </>
      }
    >
      {loadError ? <p className="error">{loadError}</p> : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete class slot?"
        message={`Delete “${deleteLabel}” from PT and EN? Save to publish.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete !== null) deleteEntry(pendingDelete);
        }}
      />

      {Array.from({ length: count }, (_, i) => (
        <section key={i} className="shared-block">
          <header className="page-header" style={{ marginBottom: '0.75rem' }}>
            <h3>Slot {i + 1}</h3>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setPendingDelete(i)}
            >
              Delete
            </button>
          </header>
          <div className="locale-grid">
            {(['pt', 'en'] as const).map((locale) => {
              const row = form.value[locale].classes[i] ?? blankRow();
              return (
                <div key={locale} className="card">
                  <h4>{locale.toUpperCase()}</h4>
                  {(['day', 'time', 'level', 'instructor', 'location'] as const).map((field) => (
                    <label key={field} className="field">
                      <span>{field}</span>
                      <input
                        value={row[field]}
                        onChange={(e) => updateRow(locale, i, field, e.target.value)}
                      />
                    </label>
                  ))}
                  <label className="field">
                    <span>audience</span>
                    <select
                      value={row.audience ?? ''}
                      onChange={(e) => updateRow(locale, i, 'audience', e.target.value)}
                    >
                      <option value="">(default adult)</option>
                      <option value="adult">adult</option>
                      <option value="kids">kids</option>
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {count === 0 ? <p>No class slots yet. Click New to add one.</p> : null}
    </PageShell>
  );
}
