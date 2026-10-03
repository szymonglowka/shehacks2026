import { describe, expect, it } from 'vitest';
import { riskActionTarget } from '../../../api/tracking';

describe('riskActionTarget', () => {
  it('routes crisis and emergency actions to /help', () => {
    expect(riskActionTarget('show_crisis')).toBe('/help');
    expect(riskActionTarget('show_emergency')).toBe('/help');
    expect(riskActionTarget('contact_doctor_now')).toBe('/help');
  });

  it('routes toolkit/breathing/support actions to their flows', () => {
    expect(riskActionTarget('open_toolkit')).toBe('/support');
    expect(riskActionTarget('ask_support')).toBe('/support');
    expect(riskActionTarget('open_breathing')).toBe('/tough-day');
  });

  it('routes EPDS actions to /epds', () => {
    expect(riskActionTarget('suggest_epds')).toBe('/epds');
    expect(riskActionTarget('repeat_epds_14d')).toBe('/epds');
  });

  it('routes specialist actions to the specialists tab', () => {
    expect(riskActionTarget('contact_specialist')).toContain('/knowledge');
    expect(riskActionTarget('show_specialists')).toContain('/knowledge');
  });

  it('falls back to /today for unknown actions', () => {
    expect(riskActionTarget('something_new')).toBe('/today');
  });
});
