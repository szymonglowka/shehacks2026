You are agent `b-content`, polish round (demo data). First read docs/agents/prompts/polish/_common.md (setup).

seed_demo is what the jury will see — make Marta's story coherent with SPEC §9 and SCREENS:
1. Support sessions currently have strategy=None, so /support/toolkit shows "not tried yet" for everything while
   the design promises "helped you on 4 of 5 harder days". Give the 6 sessions real strategy codes from
   support fixtures and helped values (yes/somewhat/no) so the ranking visibly shifts (top: a rest/walk strategy).
   Update UserCopingPreference counters consistently (use the same accounting as the support PATCH view).
2. Add trusted contact "Tomek" (partner, phone +48 600 000 000 example, preferred_channel whatsapp) so "Poproś o
   wsparcie" works; circle request claimed by "Tomek" stays.
3. Check-ins: add realistic symptoms (fatigue, wound_pain early on, headache…) and emotions so the visit report
   symptom section and patterns have content; keep one past red flag? NO — keep red flags empty (we do not want
   the report to look alarming), but add 1–2 entries to visit questions about symptoms.
4. Make sure today's check-in exists for Marta (so /today shows the summary) AND provide `seed_demo --no-today`
   so the presenter can show an empty check-in live.
5. Run seed_demo twice (idempotent), run backend pytest, smoke the API (/support/toolkit, /support/contacts,
   /reports/visit?weeks=6). Push agent/b-content and report.
