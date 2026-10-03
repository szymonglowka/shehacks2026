You are agent `f-care`, polish round. First read docs/agents/prompts/polish/_common.md and follow its setup.

1. Tough day (/tough-day) is now a modal overlay (integrator wrapped it in .otula-backdrop/.otula-modal).
   Make it match SCREENS §3.9 visually: intensity as 5 growing petals (not bare digits), breathing orb faithful
   to Figma, strategy cards with "helped X of Y" evidence, finishing screen. Verify the full WRITE flow against the
   real API: POST /support/sessions → choose strategy → PATCH {strategy, helped ("partly" is mapped to API
   "somewhat" in api/support.ts), mood_after}; toolkit order changes afterwards; intensity 5 → /help.
2. "Ask for support": uses GET /support/contacts/{id}/message (sms/WhatsApp URLs). Verify with the demo trusted
   contact (b-content is adding "Tomek" to seed_demo; until then add one in Profile/Wsparcie).
3. Circle mum side in /support: create request, share link (copy + navigator.share), revoke + re-create,
   share_mood toggle. Public page /c/:token logged OUT (incognito): claim with name → mum gets a notification,
   mark done, revoked link → friendly 404 page, rate limit (429) → friendly message.
4. Wins jar: add a win from /today and from quick-add, RandomWinCard in tough day.
5. Night shift (/night): quick 1-tap mood saves today's check-in; "Nie mogę zasnąć" and "Zapisz myśl na rano"
   actually do something meaningful (5-4-3-2-1 guide; thought saved as a visit question or small note).
Push agent/f-care and report.
