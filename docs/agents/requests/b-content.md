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
- `seed_content` loads `goals/goal_templates.json` via `update_or_create` by
  pk — idempotent; it will pick up `support` fixtures automatically once
  `support` models exist AND if b-care converts them to loaddata-style
  (currently custom `{"strategies": [...]}` / `{"helplines": [...]}` shape,
  skipped with a note).
