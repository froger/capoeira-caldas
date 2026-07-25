import type { PageTerms } from '../core/schemas';
import type { FieldErrors } from '../core/formErrors';
import { FieldError } from './FieldError';

type Props = {
  pt: PageTerms;
  en: PageTerms;
  onChange: (next: { pt: PageTerms; en: PageTerms }) => void;
  errors?: FieldErrors;
};

function ipcError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  return e.message
    .replace(/^Error invoking remote method '[^']+':\s*/i, '')
    .replace(/^Error:\s*/i, '');
}

export { ipcError };

/** One row per key: label | PT | EN */
export function PairedTermsEditor({ pt, en, onChange, errors = {} }: Props) {
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
      {keys.map((key) => {
        const ptPath = `pt.${key}`;
        const enPath = `en.${key}`;
        return (
          <div key={key} className="paired-terms-row">
            <span className="key">{key}</span>
            <div className={errors[ptPath] ? 'field field-invalid' : 'field'}>
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
              <FieldError errors={errors} path={ptPath} />
            </div>
            <div className={errors[enPath] ? 'field field-invalid' : 'field'}>
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
              <FieldError errors={errors} path={enPath} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
