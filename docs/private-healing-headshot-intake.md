# Private Healing headshot intake

Status: implemented in code, fail-closed, staging activation pending HubSpot scope and environment verification.

## Approved flow

1. The visitor completes the Private Healing form and explicitly consents to the image use.
2. The browser sends one multipart request to the same-origin `/api/crm/intake` endpoint.
3. The endpoint accepts exactly one JSON payload and one JPG, PNG, or WebP image of at most 2 MB.
4. The server verifies the image signature, not only the browser-provided filename or MIME type.
5. The textual application is forwarded to the private Rainbow CRM through the existing signed, idempotent intake contract. The image is never copied into the Rainbow CRM payload.
6. HubSpot upserts the contact with Ethel as owner.
7. HubSpot Files stores the image as `PRIVATE`, under `/rainbow-sanctuary/private-healing-intake`, with a 30-day automatic deletion period.
8. A private HubSpot note attaches the file to that contact and records the submission reference, consent purpose, owner, and retention period.

Google Drive is not used as a second attachment store. This prevents shared-link mistakes, duplicate copies, split retention controls, and dependence on one administrator's personal Drive ownership.

## Provider configuration

The HubSpot private app used by `HUBSPOT_ACCESS_TOKEN` must have:

- `files`
- `crm.objects.contacts.write`

The existing contact, owner, portal, and form settings remain required.

Set these only in the Vercel Preview environment first:

```text
HUBSPOT_PRIVATE_INTAKE_ENABLED=true
HUBSPOT_PRIVATE_INTAKE_TTL=P30D
```

Do not enable the production variable until the staging verification below passes. The retention value is restricted in code to 1–30 days and defaults to `P30D`.

## Staging verification

- Submit a valid synthetic JPG smaller than 2 MB.
- Confirm the website shows the success state.
- Confirm one contact is created or updated in HubSpot and owned by Ethel.
- Confirm the structured application text is visible on the contact.
- Confirm a timeline note contains the private attachment.
- Confirm the file access is `PRIVATE`; its ordinary HubSpot URL must not work publicly.
- Confirm the note states the 30-day retention period.
- Retry the same browser submission and confirm the submission reference does not create an uncontrolled duplicate.
- Reject a renamed non-image, a MIME mismatch, an image larger than 2 MB, missing photo consent, missing general consent, and an unapproved origin.
- Confirm ordinary enquiries still use JSON and do not accept attachments.

## Operational rule

Ethel may review the image from the HubSpot contact timeline. She must not download, forward, email, or copy it to Google Drive. If a longer-lived image becomes necessary after acceptance, obtain a new purpose-specific consent and use the future approved case-record policy rather than extending this intake copy.

## Deletion and incident handling

- Normal intake deletion: automatic after 30 days through the HubSpot file TTL.
- Early withdrawal: locate the file from the contact note and perform HubSpot's permanent/GDPR file deletion, then record the action without retaining the image.
- Suspected exposure: disable `HUBSPOT_PRIVATE_INTAKE_ENABLED`, preserve non-image audit evidence, rotate the HubSpot token if compromise is possible, and follow the project incident process.
