# December retreat listening sample

## Source and credit

- Track: **Hatun Hatun Temblarcuna** — Hanan.
- James supplied a remastered MP3 on 17 October 2026 to replace the earlier listening sample.
- Public description: recreated from a ceremony recording by James Stark; not represented as an unedited live recording.
- Duration: 369.96 seconds (6:10), stereo, 48 kHz MP3.
- Asset: `assets/retreats/awakening-inner-light-december-2026/audio/hatun-hatun-temblarcuna-hanan.mp3`.
- The web copy preserves the remastered encoded audio without recompression. Unrelated embedded artwork and generic title/artist metadata were replaced with track credits.
- Supplied remaster and web-copy audio-stream SHA-256: `16fbe59f83b5479f30c182697e971d48179a0d9750aaf2ac97259f3a5f08d19e`.

## Integration

The `#listen` section immediately follows the December retreat hero. Its 7–10 minute invitation includes time for the 6:10 recording and a quiet pause afterward. Existing facilitator portraits, price, enquiry flow and archive are preserved.

The ALIM/Spirit of James podcast page uses a Spotify-hosted iframe, not a standalone player plugin. This implementation adapts the dark artwork-and-controls layout using first-party HTML audio. It does not imply Spotify hosting or add a Spotify account requirement.

- `retreat-audio.js`: playback, pause/replay, seek, volume/mute, error recovery, accessible status.
- `retreat-event.css`: responsive card and visible keyboard focus.
- Native controls remain available if the enhancement module fails.
- `preload="none"`; no autoplay, no new third-party dependencies or tracking.
- The module mounts on the Design Canvas rendered tree, not its hidden source template.

## Verification

Initial player verification on 15 October 2026, before the remastered audio replacement:

- Full `quality:preflight`: 156 tests passed, 66 HTML pages validated, email-template contracts and release-integrity checks passed. This does not establish live email delivery or activate automations.
- Browser: real MP3 playback, explicit play/pause, pointer seeking to 3:02, keyboard seeking to 3:03, volume adjustment and mute/unmute.
- Initial media state remains unloaded and paused until play is pressed.
- Desktop, 390px and 320px layouts inspected; document width matches viewport width at both phone sizes.
- Playback rejection/retry and end/replay behavior covered by focused regression tests.
- Local audio server returns `206 Partial Content` for range requests, supporting browser seeking. The basic Python static server does not support byte ranges and was replaced for this check.
- Encoded audio-stream hashes match the supplied recording exactly.
- The Design Canvas template requires `controls="{{ true }}"` and `hidden="{{ true }}"` for boolean state; bare empty attributes become false React props. The player also initializes its error state explicitly.
- Evidence: `.security-layer/retreat-audio-preflight.log`; desktop screenshot `/tmp/rainbow-hanan-player-desktop.jpg`.

## Release history

After reviewing the local preview on 15 October 2026, James approved the design, renamed the first song **Medicina Curandeira**, and requested a staging release through PR #162.

On 17 October 2026, James supplied the remastered replacement and named it **Hatun Hatun Temblarcuna**. The page title, player accessibility labels, file name and embedded MP3 title now match the new track. The recorded audio stream is preserved exactly from his remastered source. Validate the new asset and playback on staging before reporting it as released.
