import { PublishStatusSchema, type PublishStatus } from './schemas';

export type WorkflowRunLike = {
  id: number;
  status: string | null;
  conclusion: string | null;
  html_url: string;
  updated_at: string;
  name?: string;
};

export type WorkflowJobsLike = {
  jobs: Array<{ name: string; status: string; conclusion: string | null }>;
};

export type WorkflowsClient = {
  listRuns: () => Promise<WorkflowRunLike[]>;
  listJobs: (runId: number) => Promise<WorkflowJobsLike>;
};

export function mapPublishStatus(
  run: WorkflowRunLike | undefined,
  jobs?: WorkflowJobsLike,
): PublishStatus {
  if (!run) {
    return PublishStatusSchema.parse({
      status: 'unknown',
      conclusion: null,
      htmlUrl: null,
      runId: null,
      updatedAt: null,
    });
  }

  const jobList = jobs?.jobs ?? [];
  const deploy = jobList.find((j) => /deploy/i.test(j.name));
  const build = jobList.find((j) => /build/i.test(j.name));

  let status: PublishStatus['status'] = 'unknown';
  if (run.status === 'queued' || run.status === 'pending') status = 'queued';
  else if (run.status === 'in_progress') {
    if (deploy && deploy.status === 'in_progress') status = 'deploying';
    else if (build && (build.status === 'in_progress' || build.status === 'completed')) status = 'building';
    else status = 'building';
  } else if (run.status === 'completed') {
    if (run.conclusion === 'success') status = 'success';
    else if (run.conclusion === 'cancelled') status = 'cancelled';
    else status = 'failure';
  }

  return PublishStatusSchema.parse({
    status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    runId: run.id,
    updatedAt: run.updated_at,
  });
}

export async function fetchPublishStatus(client: WorkflowsClient): Promise<PublishStatus> {
  const runs = await client.listRuns();
  const run = runs[0];
  if (!run) return mapPublishStatus(undefined);
  const jobs =
    run.status === 'in_progress' || run.status === 'completed'
      ? await client.listJobs(run.id)
      : undefined;
  return mapPublishStatus(run, jobs);
}
