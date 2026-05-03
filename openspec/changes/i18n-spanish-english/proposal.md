# Proposal: i18n-spanish-english

## Why

The application currently only supports English, but the target deployment (Espacio Arroelo) is in Galicia, Spain where Spanish and Galician are both official languages. Supporting Spanish, Galician, and English will make the application accessible to the local community while maintaining international usability.

## What Changes

- Add i18n infrastructure using a lightweight library (e.g., `i18next` or similar)
- Extract all user-facing strings from components into translation files
- Add language switcher in the UI (header or settings)
- Support Spanish (es), Galician (gl), and English (en) with Spanish as the default for this deployment
- Persist user's language preference in localStorage
- Translate all UI strings: navigation, forms, buttons, validation messages, empty states, admin interface
- Format dates and times according to selected locale

## Capabilities

### New Capabilities
- `i18n-infrastructure`: Translation system setup, language detection, persistence, and switching mechanism
- `ui-translations`: All user-facing strings extracted and translated (Spanish + Galician + English)

### Modified Capabilities
<!-- No existing capabilities require spec-level changes - this is purely additive -->

## Impact

**Affected packages:**
- `@dfs/ui` — may need locale-aware formatting utilities
- `@dfs/common` — may need shared i18n utilities

**Affected apps:**
- `apps/webapp` — all components need translation keys, language switcher in header
- `apps/api` — error messages returned to client should be translatable (or use error codes)

**Dependencies:**
- Add i18n library (e.g., `react-i18next` for webapp)
- May need `date-fns` locale support for date formatting

**Breaking changes:**
- None (purely additive)

## Non-goals

- Mobile app translation (webapp only for now)
- Admin-configurable languages (hardcoded Spanish + Galician + English)
- Right-to-left (RTL) language support
- Pluralization rules beyond simple singular/plural
- Translation management UI (translations live in JSON files)
