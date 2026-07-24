import type { PageTerms } from '../core/schemas';

type Props = {
  pt: PageTerms;
  en: PageTerms;
  onChange: (next: { pt: PageTerms; en: PageTerms }) => void;
};

function ipcError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  return e.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^Error:\s*/i, '');
}

export { ipcError };

/** One row per key: label | PT | EN */
export function PairedTermsEditor({ pt, en, onChange }: Props) {
  const keys = Array.from(new Set([...Object.keys(pt), ...Object.keys(en)])).sort();

  if (keys.length === 0) {
    return <p className="error">No terms loaded for this page.</p>;
  }

  return (
    <div className="paired-terms">
      <div className="paired-terms-head">
        <span>Key</span>
        <span>PT</span>
        <span>EN</span>
      </div>
      {keys.map((key) => (
        <div key={key} className="paired-terms-row">
          <span className="key">{key}</span>
          <textarea
            rows={key.startsWith('intro') || key.startsWith('p') || key.includes('body') ? 4 : 2}
            value={pt[key] ?? ''}
            onChange={(e) =>
              onChange({
                pt: { ...pt, [key]: e.target.value },
                en: { ...en },
              })
            }
          />
          <textarea
            rows={key.startsWith('intro') || key.startsWith('p') || key.includes('body') ? 4 : 2}
            value={en[key] ?? ''}
            onChange={(e) =>
              onChange({
                pt: { ...pt },
                en: { ...en, [key]: e.target.value },
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
