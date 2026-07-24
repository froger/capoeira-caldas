import type { PublishStatus, SyncResult } from '../core/schemas';

type Props = {
  status: PublishStatus | null;
  loading?: boolean;
};

export function PublishBadge({ status, loading }: Props) {
  if (loading) return <span className="badge">Checking publish…</span>;
  if (!status) return <span className="badge">Publish: —</span>;
  return (
    <span className={`badge badge-${status.status}`}>
      Publish: {status.status}
      {status.htmlUrl ? (
        <>
          {' '}
          <a href={status.htmlUrl} target="_blank" rel="noreferrer">
            details
          </a>
        </>
      ) : null}
    </span>
  );
}

type ConflictProps = {
  conflict: Extract<SyncResult, { kind: 'conflict' }> | null;
  onChoose: (choice: 'force-push-mine' | 'discard-local') => void;
  onClose: () => void;
};

export function ConflictDialog({ conflict, onChoose, onClose }: ConflictProps) {
  if (!conflict) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-body">
        <h3>Remote changed</h3>
        <p>
          Local: <code>{conflict.localSha.slice(0, 7)}</code> — Remote:{' '}
          <code>{conflict.remoteSha.slice(0, 7)}</code>
        </p>
        <p>Force-push your version, or discard local and take remote?</p>
        <div className="row modal-actions">
          <button type="button" className="btn btn-save" onClick={() => onChoose('force-push-mine')}>
            Force-push my version
          </button>
          <button type="button" className="btn btn-danger" onClick={() => onChoose('discard-local')}>
            Discard local
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
