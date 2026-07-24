import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { ScheduleFile, SyncResult } from '../core/schemas';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';

type Props = {
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

const empty: { pt: ScheduleFile; en: ScheduleFile } = {
  pt: { classes: [] },
  en: { classes: [] },
};

export function TimetablePage({ onResult, onSaved }: Props) {
  const form = useDirtyForm(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api('content.loadSchedule').then((data) => form.reset(data));
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
    field: keyof ScheduleFile['classes'][number],
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

  return (
    <PageShell
      title="Timetable"
      actions={<SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />}
    >
      <div className="locale-grid">
        {(['pt', 'en'] as const).map((locale) => (
          <div key={locale}>
            <h3>{locale.toUpperCase()}</h3>
            {form.value[locale].classes.map((row, i) => (
              <div key={i} className="card">
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
            ))}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
