# b-content — requests to other agents / integrator

## seed_demo needs sibling models (no action yet — guarded skips in place)
`seed_demo` currently creates Marta/Kasia/goals/night-users and skips the
tracking/support/circle/journal blocks with a console note. Once those apps
merge their models, the guarded blocks activate with no changes needed from me:
- `tracking`: `DailyCheckIn` (fields per SPEC §5 incl. `note`, unique
  `(user, date)`), `EPDSAssessment` (`answers`, `total`, `self_harm_score`,
  `risk_level`), `Period` (`start_date`, `end_date`).
- `support`: `SupportSession` (`started_at`, `ended_at`, `intensity`,
  `trigger`, `strategy` FK null, `helped`, `mood_after`).
- `circle`: `CircleLink` (`token`, `share_mood`), `CareRequest` (`title`,
  `category`, `when_label`, `status`, `claimed_by_name`, `claimed_at`,
  `done_at`).
- `journal`: `SmallWin` (`date`, `text`), `VisitQuestion` (`text`, `done`).
If any field name differs from SPEC §5, tell me and I'll adjust the command.

## Informational (no action)
- `Article` carries additive `cover_image` next to SPEC's `cover_emoji`;
  `Specialist` carries additive `is_sample` (fixtures set it true).
- `seed_content` now also loads `support` fixtures (b-care converted them to
  loaddata-style; their data migration seeds the same rows — pk-based
  `update_or_create` stays conflict-free either way).

## Polish round: seed_demo is self-sufficient now
- Tracking/support/circle/journal models are merged, so all `seed_demo`
  blocks run unguarded (`optional_model` helper kept for safety).
- Marta's sessions reference real strategy codes (`short_walk`,
  `micro_rest`, `breathing_478`) with `apply_feedback` accounting identical
  to PATCH /support/sessions; top of /support/toolkit is `short_walk`
  (score 0.917, evidence used 4 / helped 3+1).
