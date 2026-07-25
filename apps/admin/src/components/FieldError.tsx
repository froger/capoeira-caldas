import type { FieldErrors } from '../core/formErrors';

type Props = {
  errors: FieldErrors;
  path: string;
};

export function FieldError({ errors, path }: Props) {
  const message = errors[path];
  if (!message) return null;
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  );
}

export function fieldClass(errors: FieldErrors, path: string): string {
  return errors[path] ? 'field field-invalid' : 'field';
}
