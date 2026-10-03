import { describe, expect, it } from 'vitest';
import { draftFromCheckin } from '../pages/CheckinPage';
import { daysUntil } from '../../today/pages/TodayPage';

describe('draftFromCheckin', () => {
  it('returns null for a missing check-in (blank form)', () => {
    expect(draftFromCheckin(null)).toBeNull();
    expect(draftFromCheckin(undefined)).toBeNull();
  });

  it('maps every field for edit mode', () => {
    const draft = draftFromCheckin({
      date: '2026-10-04',
      mood: 2,
      energy: 4,
      anxiety: 1,
      sleep_hours: 6.5,
      sleep_quality: 4,
      pain: 2,
      emotions: ['tired'],
      bleeding: 'light',
      symptoms: ['lack_of_sleep'],
      red_flags: ['fever'],
      note: 'test note',
    });
    expect(draft).toMatchObject({
      mood: 2,
      energy: 4,
      sleepHours: 6.5,
      bleeding: 'light',
      redFlags: ['fever'],
      note: 'test note',
    });
  });

  it('falls back to defaults for null fields', () => {
    const draft = draftFromCheckin({
      date: '2026-10-04',
      mood: null,
      energy: null,
      anxiety: null,
      sleep_hours: null,
      sleep_quality: null,
      pain: null,
      emotions: [],
      bleeding: null,
      symptoms: [],
      red_flags: [],
      note: '',
    });
    expect(draft).toMatchObject({ mood: null, energy: 3, sleepHours: 5, pain: 0 });
  });
});

describe('daysUntil', () => {
  it('counts whole days until the next period', () => {
    const from = new Date(2026, 9, 4); // Oct 4
    expect(daysUntil('2026-10-27', from)).toBe(23);
    expect(daysUntil('2026-10-04', from)).toBe(0);
  });

  it('returns null for missing or invalid dates', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil('not-a-date')).toBeNull();
  });
});
