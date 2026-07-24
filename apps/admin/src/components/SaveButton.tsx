type Props = {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  label?: string;
};

export function SaveButton({ dirty, saving, onSave, label = 'Save' }: Props) {
  return (
    <button type="button" disabled={!dirty || Boolean(saving)} onClick={onSave}>
      {saving ? 'Saving…' : label}
    </button>
  );
}
