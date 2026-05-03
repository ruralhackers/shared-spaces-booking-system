# Design: i18n-spanish-english

## Context

The webapp currently has all user-facing strings hardcoded in English. We need to support Spanish, Galician, and English with:
- Language switcher in the UI
- Persistent language preference
- All strings translated (forms, buttons, navigation, errors, empty states, admin UI)
- Locale-aware date/time formatting

Current state:
- All strings are inline in components
- Date formatting uses `date-fns` with hardcoded timezone but no locale
- No i18n infrastructure

## Goals / Non-Goals

**Goals:**
- Add i18n infrastructure to `apps/webapp` with minimal bundle impact
- Extract all user-facing strings into translation files (Spanish + Galician + English)
- Language switcher in header with localStorage persistence
- Spanish as default language
- Locale-aware date/time formatting
- Type-safe translation keys (no magic strings)

**Non-Goals:**
- Mobile app translation (webapp only)
- Backend error message translation (errors use codes; frontend translates them)
- Admin-configurable languages (hardcoded es/gl/en)
- Translation management UI
- Pluralization beyond simple singular/plural
- RTL support

## Decisions

### 1. i18n Library: `react-i18next`

**Decision:** Use `react-i18next` (React bindings for `i18next`)

**Rationale:**
- Industry standard, mature, well-maintained
- Type-safe with TypeScript
- Lightweight (tree-shakeable)
- Built-in React hooks (`useTranslation`)
- Supports nested keys, interpolation, pluralization
- No build-time compilation needed (unlike `react-intl`)

**Alternatives considered:**
- `react-intl` (FormatJS): Heavier, more opinionated, requires build-time extraction
- `next-intl`: Next.js-specific, not compatible with Vite + TanStack Router
- Custom solution: Reinventing the wheel, no type safety

### 2. Translation File Structure

**Decision:** Flat namespace with feature-based grouping

```
apps/webapp/src/locales/
  en/
    common.json       # Shared strings (nav, buttons, errors)
    booking.json      # Booking form, calendar
    admin.json        # Admin pages
    spaces.json       # Space list, details
  es/
    common.json
    booking.json
    admin.json
    spaces.json
  gl/
    common.json
    booking.json
    admin.json
    spaces.json
```

**Rationale:**
- Feature-based grouping keeps related strings together
- Flat structure (no deep nesting) for simplicity
- Separate namespaces prevent key collisions
- Easy to find and update strings

**Alternatives considered:**
- Single `translation.json` per language: Becomes unwieldy as app grows
- Component-colocated translations: Harder to maintain consistency, no shared strings

### 3. Language Detection & Persistence

**Decision:** 
1. Check localStorage for saved preference
2. Fall back to browser language (`navigator.language`)
3. Default to Spanish (`es`) if no match or unsupported language
4. Save selection to localStorage on change
5. Support `es`, `gl`, and `en` language codes

**Rationale:**
- Respects user's explicit choice (localStorage)
- Sensible default for Spanish-speaking users in Galicia
- Browser language as fallback for first-time visitors (detects `gl` for Galician users)
- No server-side detection needed (client-only app)

### 4. Type Safety

**Decision:** Generate TypeScript types from English translation files

Use `i18next-parser` to extract keys and generate types:
```typescript
// Auto-generated
export interface Resources {
  common: typeof import('./locales/en/common.json')
  booking: typeof import('./locales/en/booking.json')
  // ...
}
```

**Rationale:**
- Compile-time safety for translation keys
- Autocomplete in IDE
- Prevents typos and missing keys
- English as source of truth (most complete initially)

### 5. Date/Time Formatting

**Decision:** Use `date-fns` with locale support

```typescript
import { format } from 'date-fns'
import { es, gl, enUS } from 'date-fns/locale'

const localeMap = { es, gl, en: enUS }
const locale = localeMap[i18n.language] || es
format(date, 'PPp', { locale })
```

**Rationale:**
- Already using `date-fns` for timezone handling
- Locale support built-in for Spanish, Galician, and English
- Consistent with existing date utilities
- No additional library needed

**Alternatives considered:**
- `Intl.DateTimeFormat`: Less flexible formatting, inconsistent browser support for some formats
- `react-i18next` date formatting: Adds complexity, `date-fns` is more powerful

### 6. Language Switcher Placement

**Decision:** Add language toggle next to theme toggle in header

**Rationale:**
- Visible on every page
- Consistent with theme toggle pattern
- No dedicated settings page needed
- Minimal UI footprint (icon + dropdown or toggle)

### 7. Default Language

**Decision:** Spanish (`es`) as default

**Rationale:**
- Target deployment is in Spain (Espacio Arroelo)
- Primary audience is Spanish-speaking
- English as fallback for international users

## Risks / Trade-offs

**Risk:** Translation files drift out of sync (missing keys in Spanish)
→ **Mitigation:** CI check to validate all keys exist in both languages; fallback to English key if Spanish missing

**Risk:** Bundle size increase from i18n library
→ **Mitigation:** `react-i18next` is tree-shakeable; only load active language's JSON files

**Risk:** Incomplete translations during initial implementation
→ **Mitigation:** Start with English, use machine translation for Spanish first pass, then refine manually

**Trade-off:** Type safety requires English as source of truth
→ **Acceptable:** English is more widely understood by developers; Spanish translations can be updated without breaking types

**Risk:** Date formatting edge cases (timezone + locale interaction)
→ **Mitigation:** Existing `bookingTz()` utility handles timezone; locale only affects display format

## Migration Plan

1. **Phase 1: Infrastructure**
   - Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`
   - Set up i18n config in `apps/webapp/src/lib/i18n.ts`
   - Add language switcher component
   - Add type generation script

2. **Phase 2: Extract Strings**
   - Create translation files (English first)
   - Replace hardcoded strings with `t()` calls
   - Test each page/feature after extraction

3. **Phase 3: Spanish Translation**
   - Translate all English strings to Spanish
   - Review and refine translations
   - Test with Spanish as active language

4. **Phase 4: Date Formatting**
   - Update `formatDateTime` utility to accept locale
   - Pass locale from i18n context

5. **Phase 5: Validation**
   - Add CI check for translation completeness
   - Manual QA in both languages
   - Verify localStorage persistence

**Rollback:** If critical issues arise, feature flag the language switcher and default to English until fixed.

## Open Questions

- Should admin interface be translatable, or English-only? → **Decision: Translate admin too** (admins may be Spanish-speaking)
- Should error messages from tRPC be translated on frontend or backend? → **Decision: Frontend translates error codes** (keeps backend language-agnostic)
