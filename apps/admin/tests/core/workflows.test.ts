import { describe, expect, it } from 'vitest';
import { fetchPublishStatus, mapPublishStatus } from '../../src/core/workflows';

describe('workflows', () => {
  it('maps unknown when no run', () => {
    expect(mapPublishStatus(undefined).status).toBe('unknown');
  });

  it('maps queued building deploying success failure cancelled', () => {
    expect(
      mapPublishStatus({
        id: 1,
        status: 'queued',
        conclusion: null,
        html_url: 'u',
        updated_at: 't',
      }).status,
    ).toBe('queued');

    expect(
      mapPublishStatus(
        {
          id: 2,
          status: 'in_progress',
          conclusion: null,
          html_url: 'u',
          updated_at: 't',
        },
        { jobs: [{ name: 'Build site', status: 'in_progress', conclusion: null }] },
      ).status,
    ).toBe('building');

    expect(
      mapPublishStatus(
        {
          id: 3,
          status: 'in_progress',
          conclusion: null,
          html_url: 'u',
          updated_at: 't',
        },
        { jobs: [{ name: 'Deploy to GitHub Pages', status: 'in_progress', conclusion: null }] },
      ).status,
    ).toBe('deploying');

    expect(
      mapPublishStatus({
        id: 4,
        status: 'completed',
        conclusion: 'success',
        html_url: 'u',
        updated_at: 't',
      }).status,
    ).toBe('success');

    expect(
      mapPublishStatus({
        id: 5,
        status: 'completed',
        conclusion: 'failure',
        html_url: 'u',
        updated_at: 't',
      }).status,
    ).toBe('failure');

    expect(
      mapPublishStatus({
        id: 7,
        status: 'pending',
        conclusion: null,
        html_url: 'u',
        updated_at: 't',
      }).status,
    ).toBe('queued');

    expect(
      mapPublishStatus(
        {
          id: 8,
          status: 'in_progress',
          conclusion: null,
          html_url: 'u',
          updated_at: 't',
        },
        { jobs: [{ name: 'Other', status: 'in_progress', conclusion: null }] },
      ).status,
    ).toBe('building');

    expect(
      mapPublishStatus({
        id: 9,
        status: 'completed',
        conclusion: null,
        html_url: 'u',
        updated_at: 't',
      }).status,
    ).toBe('failure');
  });

  it('fetches latest run and jobs', async () => {
    const status = await fetchPublishStatus({
      listRuns: async () => [
        {
          id: 9,
          status: 'in_progress',
          conclusion: null,
          html_url: 'https://example.com',
          updated_at: 'now',
        },
      ],
      listJobs: async () => ({
        jobs: [{ name: 'Build site', status: 'completed', conclusion: 'success' }],
      }),
    });
    expect(status.runId).toBe(9);
    expect(status.status).toBe('building');
  });

  it('returns unknown when no runs', async () => {
    const status = await fetchPublishStatus({
      listRuns: async () => [],
      listJobs: async () => ({ jobs: [] }),
    });
    expect(status.status).toBe('unknown');
  });
});
