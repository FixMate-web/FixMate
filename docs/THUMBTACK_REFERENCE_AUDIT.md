# Reference audit — 2026-10-29

## Evidence and limits

Direct requests to Thumbtack home, `/how-it-works`, `/pro`, and `/k/plumbers/near-me` returned a JavaScript/anti-bot verification screen. No restrictions were bypassed. Indexed, public first-party content was available through search. Exact current pixel dimensions, rendered mobile behavior, and screenshots could not be verified; the dimensions below are FixMate design decisions, not measured Thumbtack facts.

Sources: [customer journey](https://www.thumbtack.com/how-it-works), [professional journey](https://www.thumbtack.com/pro/jobs), [profile information](https://www.thumbtack.com/safetyguidelines/), [marketplace capabilities](https://developers.thumbtack.com/docs/overview).

## Product findings

The accessible material puts discovery before account creation, organizes the journey around choosing a professional, and exposes useful profile information before hiring. Location, service scope, prices, and credentials support comparison. FixMate should adopt that information order while keeping its own approval meaning and available workflows. Thumbtack's paid lead model and guarantees are not adopted.

## FixMate design decisions

- White surfaces, charcoal-green headings, restrained evergreen CTAs, 1240px content container, compact 80px header.
- Large search-led hero with real home photography; service and governorate are separate inputs.
- Consistent photo cards, 3:2 image crops, shorter headings, quiet borders, few shadows.
- Desktop results with a 260px filter column; compact profile cards with identity, services, region, experience, and actual pricing. Mobile filters use native accessible disclosure.
- Profile details use a main information column and contextual action panel; initial avatars are explicitly neutral, never stock technician identities.
- Arabic and English share templates, logical spacing, and locale-aware labels. No US ZIP-code or unsupported proximity controls.

## Original weaknesses

The first redesign improved the shell but retained icon-only categories, a single interior photo, no location in the hero, no real professionals on the homepage, and technical onboarding/admin forms. Provider pagination was missing from the UI; weekly availability was read-only despite a working backend update contract. Public detail pages used generic cards and nested subscriptions with stale response risk.

See FEATURE_PARITY_MATRIX.md for implementation scope and pending workflows.
