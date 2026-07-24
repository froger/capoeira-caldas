import { useEffect, useState } from 'react';
import { api } from '../ports/api';
import { useDirtyForm } from '../shared/dirtyForm';
import type { GalleryFile, SyncResult } from '../core/schemas';
import { PageShell } from '../components/PageShell';
import { SaveButton } from '../components/SaveButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ipcError } from '../components/PairedTermsEditor';

type Props = {
  onResult: (r: SyncResult) => void;
  onSaved: () => void;
};

const empty: { pt: GalleryFile; en: GalleryFile } = {
  pt: { items: [] },
  en: { items: [] },
};

export function GalleryPage({ onResult, onSaved }: Props) {
  const form = useDirtyForm(empty);
  const [saving, setSaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api('content.loadGallery')
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

  const item = form.value.pt.items[index];
  const imagePaths = item?.images ?? [];

  useEffect(() => {
    if (imagePaths.length === 0) {
      setPreviews({});
      return;
    }
    let cancelled = false;
    void api('content.resolveAssets', { publicPaths: imagePaths }).then((res) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const a of res.assets) {
        if (a.fileUrl) map[a.publicPath] = a.fileUrl;
      }
      setPreviews(map);
    });
    return () => {
      cancelled = true;
    };
  }, [imagePaths.join('|')]);

  async function save() {
    setSaving(true);
    try {
      const result = await api('content.saveAndPublish', {
        pageId: 'gallery',
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

  function updateItem(locale: 'pt' | 'en', patch: Partial<(typeof form.value.pt.items)[0]>) {
    const items = form.value[locale].items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    form.setValue({ ...form.value, [locale]: { items } });
  }

  function patchShared(patch: { id?: string; src?: string; images?: string[] }) {
    form.setValue({
      pt: {
        items: form.value.pt.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
      },
      en: {
        items: form.value.en.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
      },
    });
  }

  async function addImages() {
    setPicking(true);
    try {
      const { images } = await api('gallery.pickImages');
      if (!item || images.length === 0) return;
      const nextImages = [...item.images, ...images.map((i) => i.publicPath)];
      const src = item.src || images[0]!.publicPath;
      patchShared({ images: nextImages, src });
      setPreviews((prev) => {
        const map = { ...prev };
        for (const img of images) map[img.publicPath] = img.fileUrl;
        return map;
      });
    } catch (e) {
      setLoadError(ipcError(e));
    } finally {
      setPicking(false);
    }
  }

  function removeImage(path: string) {
    if (!item) return;
    const next = item.images.filter((p) => p !== path);
    const src = item.src === path ? (next[0] ?? '') : item.src;
    patchShared({ images: next, src });
    setPendingRemove(null);
  }

  function setAsCover(path: string) {
    patchShared({ src: path });
  }

  return (
    <PageShell
      title="Gallery products"
      actions={<SaveButton dirty={form.dirty} saving={saving} onSave={() => void save()} />}
    >
      {loadError ? <p className="error">{loadError}</p> : null}
      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove image?"
        message={`Remove “${pendingRemove?.split('/').pop() ?? ''}” from this product? Save to publish.`}
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove) removeImage(pendingRemove);
        }}
      />
      <label className="field">
        Item
        <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {form.value.pt.items.map((it, i) => (
            <option key={it.id} value={i}>
              {it.id}
            </option>
          ))}
        </select>
      </label>

      {item ? (
        <>
          <section className="shared-block">
            <h3>Shared</h3>
            <label className="field">
              <span>id</span>
              <input value={item.id} onChange={(e) => patchShared({ id: e.target.value })} />
            </label>
            <label className="field">
              <span>cover (src)</span>
              <code>{item.src || '—'}</code>
            </label>
            <div className="row">
              <button
                type="button"
                className="btn btn-new"
                disabled={picking}
                onClick={() => void addImages()}
              >
                {picking ? 'Opening…' : 'Add images…'}
              </button>
            </div>
            <div className="thumb-grid">
              {item.images.map((path) => (
                <figure key={path} className={`thumb ${item.src === path ? 'cover' : ''}`}>
                  {previews[path] ? (
                    <img src={previews[path]} alt="" />
                  ) : (
                    <div className="thumb-missing">Missing</div>
                  )}
                  <figcaption>
                    <code>{path.split('/').pop()}</code>
                    <div className="row">
                      <button type="button" className="btn btn-ghost" onClick={() => setAsCover(path)}>
                        Cover
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setPendingRemove(path)}
                      >
                        Remove
                      </button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          <div className="locale-grid">
            {(['pt', 'en'] as const).map((locale) => (
              <div key={locale} className="card">
                <h3>{locale.toUpperCase()}</h3>
                <label className="field">
                  <span>title</span>
                  <input
                    value={form.value[locale].items[index]?.title ?? ''}
                    onChange={(e) => updateItem(locale, { title: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>price</span>
                  <input
                    value={form.value[locale].items[index]?.price ?? ''}
                    onChange={(e) => updateItem(locale, { price: e.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
