import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../api/client';
import { fetchCheckin } from '../../../api/tracking';

vi.mock('../../../api/client', async (importOriginal) => ({
  ...(await importOriginal()),
  apiGet: vi.fn(),
}));

import { apiGet } from '../../../api/client';

const mockedGet = apiGet as unknown as ReturnType<typeof vi.fn>;

describe('fetchCheckin', () => {
  it('maps 404 (day without a check-in) to null', async () => {
    mockedGet.mockRejectedValueOnce(new ApiError(404, 'Not found.'));
    await expect(fetchCheckin('2020-01-01')).resolves.toBeNull();
  });

  it('rethrows non-404 errors', async () => {
    mockedGet.mockRejectedValueOnce(new ApiError(500, 'Boom'));
    await expect(fetchCheckin('2026-10-04')).rejects.toMatchObject({ status: 500 });
  });

  it('returns the check-in when present', async () => {
    mockedGet.mockResolvedValueOnce({ date: '2026-10-04', mood: 3 });
    await expect(fetchCheckin('2026-10-04')).resolves.toMatchObject({ mood: 3 });
  });
});
