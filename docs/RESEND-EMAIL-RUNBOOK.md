# Resend transactional email runbook

## Architecture

- Google Workspace receives human replies and keeps the team inbox.
- Resend sends branded transactional messages from the verified domain.
- Stripe sends official payment receipts and refund confirmations.
- The website uses a domain-restricted **Sending Access** API key.
- Template, automation, webhook and key management uses a short-lived **Full
  Access** setup key that is revoked immediately after provisioning.
- Resend Receiving remains off. No Gmail API or Gmail password is connected.

## Source of truth

- `emails/layout.mjs` — email-safe visual system
- `emails/catalog.mjs` — subjects, copy, variables and sender identity
- `emails/automations.mjs` — disabled event automation definitions
- `scripts/check-email-system.mjs` — structural and safety validation
- `scripts/build-email-preview.mjs` — local preview gallery
- `scripts/sync-resend.mjs` — idempotent Resend provisioning
- `api/_lib/email-service.mjs` — allowlisted application delivery
- `api/resend/webhook.mjs` — signed delivery-event endpoint

Run:

```sh
npm run email:check
npm run email:preview
RESEND_SETUP_API_KEY=... npm run resend:sync
```

Never save or paste a real key into source, documentation, screenshots, commit
history, issue text or chat. `RESEND_SETUP_API_KEY` is local-only.

## Vercel gates

Preview environment:

```text
RESEND_EMAIL_ENABLED=true
RESEND_API_KEY=<domain-restricted Sending Access key>
RESEND_ALLOWED_RECIPIENTS=workspace-admin@rainbowsanctuary.life
RESEND_PRODUCTION_APPROVED=false
RESEND_WEBHOOK_SECRET=<Preview webhook signing secret>
```

Production remains blocked:

```text
RESEND_EMAIL_ENABLED=false
RESEND_PRODUCTION_APPROVED=false
```

Production is approved only after the email checklist passes, the responsible
operator is named, privacy and terms are final, all trigger producers are governed,
and suppression/cancellation behavior is tested.

## Staging acceptance checklist

- [ ] Catalog validation and repository tests pass.
- [ ] All templates are published; all automations remain disabled.
- [ ] From, Reply-To, SPF and DKIM pass for every sender family.
- [ ] Desktop, mobile, dark-mode fallback and plain-text rendering are reviewed.
- [ ] A test message is sent only to the Preview allowlist.
- [ ] Replying reaches the correct Google Workspace alias and Gmail label.
- [ ] Links use HTTPS and contain no secret access data in public URLs.
- [ ] Duplicate API/webhook delivery does not duplicate participant messages.
- [ ] Invalid webhook signatures are rejected.
- [ ] Bounce, complaint and delivery webhook events are visible without logging PII.
- [ ] Booking reminders are suppressed after cancellation.
- [ ] Stripe alone sends financial receipts and refunds.
- [ ] No sensitive application content is included in email.

## Operational response

- **Bounce:** verify the address through the human workflow; do not repeatedly
  resend or silently substitute another address.
- **Complaint:** stop non-essential messaging to the address and review the source
  of the relationship.
- **Provider incident:** disable `RESEND_EMAIL_ENABLED`; do not fall back to an
  unverified sender.
- **Key exposure:** revoke the key in Resend, rotate the Vercel secret, inspect
  sending activity and record the incident.
- **Template change:** update source, validate, preview, sync, review the draft,
  publish and attach evidence to staging acceptance.

## Enabling an automation

Automations are initially disabled. Before enabling one, confirm that the producer
sends the exact event name, a valid `email`, and every required uppercase variable
listed in `emails/automations.mjs`. Test it with a non-production event and the
allowlisted inbox. Record the owner and rollback step. Enable only that individual
automation, not the entire catalog at once.
