import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { EventDoc, SyncResult } from '../core/schemas';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Props = {
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

function blank(slug: string, locale: 'pt' | 'en'): EventDoc {
  return {
    slug,
    locale,
    data: {
      title: '',
      description: '',
      locale,
      date: new Date().toISOString().slice(0, 10),
      location: '',
    },
    body: '',
  };
}

export function EventsPage({ onResult, onSaved }: Props) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const form = useDirtyForm<{ pt: EventDoc; en: EventDoc }>({
    pt: blank('new', 'pt'),
    en: blank('new', 'en'),
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function refresh() {
    const list = await api('content.listEvents');
    setSlugs(list);
    if (list[0] && !selected) {
      setSelected(list[0]);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selected) return;
    void api('content.loadEvent', { slug: selected }).then((data) => form.reset(data));
  }, [selected]);

  async function save() {
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: 'events',
        payload: form.value,
      });
      onResult(result);
      if (result.kind === 'ok') {
        form.markSaved();
        onSaved();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await api('content.deleteEvent', { slug: selected });
      onResult(result);
      if (result.kind === 'ok') {
        setConfirmDelete(false);
        setSelected('');
        onSaved();
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function newEvent() {
    const slug = `event-${Date.now()}`;
    const pair = { pt: blank(slug, 'pt'), en: blank(slug, 'en') };
    form.reset(pair);
    setSelected(slug);
  }

  return (
    <PageShell
      title="Events"
      actions={
        <>
          <button type="button" className="btn btn-new" onClick={newEvent}>
            New
          </button>
          <span className="action-sep" aria-hidden="true" />
          <button
            type="button"
            className="btn btn-danger"
            disabled={!selected || saving}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </button>
          <span className="action-sep" aria-hidden="true" />
          <SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />
        </>
      }
    >
      <ConfirmDialog
        open={confirmDelete}
        title="Delete event?"
        message={`Delete “${selected}” in PT and EN? This will publish the removal.`}
        confirmLabel="Delete"
        busy={saving}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
      <div className="row">
        <label>
          Event
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">—</option>
            {slugs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="locale-grid">
        {(['pt', 'en'] as const).map((locale) => (
          <div key={locale}>
            <h3>{locale.toUpperCase()}</h3>
            <label className="field">
              <span>slug</span>
              <input
                value={form.value[locale].slug}
                onChange={(e) => {
                  const slug = e.target.value;
                  form.setValue({
                    pt: { ...form.value.pt, slug },
                    en: { ...form.value.en, slug },
                  });
                }}
              />
            </label>
            {(['title', 'description', 'date', 'location', 'rsvp_url', 'rsvp_label'] as const).map(
              (field) => (
                <label key={field} className="field">
                  <span>{field}</span>
                  <input
                    value={form.value[locale].data[field] ?? ''}
                    onChange={(e) =>
                      form.setValue({
                        ...form.value,
                        [locale]: {
                          ...form.value[locale],
                          data: { ...form.value[locale].data, [field]: e.target.value || undefined },
                        },
                      })
                    }
                  />
                </label>
              ),
            )}
            <label className="field">
              <span>body</span>
              <textarea
                rows={8}
                value={form.value[locale].body}
                onChange={(e) =>
                  form.setValue({
                    ...form.value,
                    [locale]: { ...form.value[locale], body: e.target.value },
                  })
                }
              />
            </label>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
