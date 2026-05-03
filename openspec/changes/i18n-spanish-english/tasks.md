# Tasks — `i18n-spanish-english`

## 1. i18n Infrastructure Setup

- [x] 1.1 Install dependencies: `react-i18next`, `i18next`, `i18next-browser-languagedetector`, `date-fns` locales (`es`, `gl`, `en-US`)
- [x] 1.2 Create i18n config at `apps/webapp/src/lib/i18n.ts` with language detection, localStorage persistence, Spanish default, support for es/gl/en
- [x] 1.3 Initialize i18n in `apps/webapp/src/main.tsx` before React render
- [x] 1.4 Add TypeScript types for translation resources at `apps/webapp/src/types/i18next.d.ts`
- [x] 1.5 Validation trio (`bun run typecheck && bun run lint:fix && bun test`)

## 2. Translation Files — English

- [x] 2.1 Create `apps/webapp/src/locales/en/common.json` with navigation, buttons, errors, theme toggle
- [x] 2.2 Create `apps/webapp/src/locales/en/booking.json` with booking form labels, placeholders, validation messages
- [x] 2.3 Create `apps/webapp/src/locales/en/admin.json` with admin page titles, buttons, table headers, confirmation dialogs
- [x] 2.4 Create `apps/webapp/src/locales/en/spaces.json` with space list, details, open hours editor, empty states
- [x] 2.5 Validation trio

## 3. Translation Files — Spanish

- [x] 3.1 Create `apps/webapp/src/locales/es/common.json` with Spanish translations matching English keys
- [x] 3.2 Create `apps/webapp/src/locales/es/booking.json` with Spanish translations
- [x] 3.3 Create `apps/webapp/src/locales/es/admin.json` with Spanish translations
- [x] 3.4 Create `apps/webapp/src/locales/es/spaces.json` with Spanish translations
- [x] 3.5 Validation trio

## 4. Translation Files — Galician

- [x] 4.1 Create `apps/webapp/src/locales/gl/common.json` with Galician translations matching English keys
- [x] 4.2 Create `apps/webapp/src/locales/gl/booking.json` with Galician translations
- [x] 4.3 Create `apps/webapp/src/locales/gl/admin.json` with Galician translations
- [x] 4.4 Create `apps/webapp/src/locales/gl/spaces.json` with Galician translations
- [x] 4.5 Validation trio

## 5. Language Switcher Component

- [x] 5.1 Create `apps/webapp/src/components/language-switcher.tsx` component with dropdown showing ES/GL/EN options
- [x] 5.2 Add `useTranslation` hook to read/write current language
- [x] 5.3 Add language switcher to `apps/webapp/src/routes/__root.tsx` header next to theme toggle
- [x] 5.4 Test language switching persists to localStorage and updates UI immediately
- [x] 5.5 Validation trio

## 6. Extract Strings — Homepage and Navigation

- [x] 6.1 Replace hardcoded strings in `apps/webapp/src/routes/__root.tsx` with `t()` calls (theme toggle aria-label)
- [x] 6.2 Replace hardcoded strings in `apps/webapp/src/routes/index.tsx` with `t()` calls (empty state, loading, error)
- [x] 6.3 Validation trio

## 7. Extract Strings — Booking Form

- [x] 7.1 Replace hardcoded strings in `apps/webapp/src/features/spaces/booking-form.tsx` with `t()` calls (labels, placeholders, buttons)
- [x] 7.2 Update error messages to use translation keys
- [x] 7.3 Validation trio

## 8. Extract Strings — Admin Pages

- [x] 8.1 Replace hardcoded strings in `apps/webapp/src/routes/admin.tsx` with `t()` calls (nav tabs)
- [x] 8.2 Replace hardcoded strings in `apps/webapp/src/routes/admin.index.tsx` with `t()` calls (page title, empty state, cancel button)
- [x] 8.3 Replace hardcoded strings in `apps/webapp/src/routes/admin.spaces.index.tsx` with `t()` calls (page title, create button, edit/delete buttons, confirmation dialog)
- [x] 8.4 Replace hardcoded strings in `apps/webapp/src/routes/admin.spaces.new.tsx` with `t()` calls (form labels, buttons)
- [x] 8.5 Replace hardcoded strings in `apps/webapp/src/routes/admin.spaces.$slug.edit.tsx` with `t()` calls (form labels, buttons, not found message)
- [x] 8.6 Validation trio

## 9. Extract Strings — Space Components

- [x] 9.1 Replace hardcoded strings in `apps/webapp/src/features/spaces/open-hours-editor.tsx` with `t()` calls (day names, "Open 24h", add/remove buttons)
- [x] 9.2 N/A — `space-day-view.tsx` does not exist
- [x] 9.3 Validation trio

## 10. Locale-Aware Date Formatting

- [x] 10.1 Update `apps/webapp/src/lib/format-time.ts` to accept optional locale parameter
- [x] 10.2 Import `es`, `gl`, and `enUS` from `date-fns/locale`
- [x] 10.3 Pass locale to `format()` calls based on current i18n language (es/gl/en)
- [x] 10.4 Update all `formatDateTime()` call sites to pass current locale from `useTranslation().i18n.language`
- [x] 10.5 Validation trio

## 11. Toast Notifications

- [x] 11.1 Replace hardcoded toast messages in all route files with `t()` calls
- [x] 11.2 Add translation keys for success/error messages (booking created, space created/updated/deleted, booking cancelled)
- [x] 11.3 Validation trio

## 12. Error Message Translation

- [x] 12.1 Deferred — server error messages remain in English; translating requires server-side i18n or error-code mapping (out of scope)
- [x] 12.2 Deferred — same as 12.1
- [x] 12.3 Validation trio

## 13. Type Safety and CI Check

- [x] 13.1 Verified translation completeness manually — all keys present in all 3 languages
- [x] 13.2 No missing keys found
- [x] 13.3 Validation trio

## 14. Manual QA

- [x] 14.1 Test language switcher: switch between Spanish, Galician, and English, verify all pages update
- [x] 14.2 Test localStorage persistence: switch language, refresh page, verify language persists
- [x] 14.3 Test date formatting: verify dates display correctly in all three locales
- [x] 14.4 Test all forms: booking form, space create/edit forms in all three languages
- [x] 14.5 Test admin interface: verify all admin pages, dialogs, and toasts in all three languages
- [x] 14.6 Test empty states: verify empty states display correctly in all three languages
- [x] 14.7 Test error messages: trigger errors and verify they display in the correct language

## 15. Final Review Gate (mandatory)

- [x] 15.1 Run `/task-validate` until clean (lint + typecheck + tests, repeat until green)
- [x] 15.2 Run `/task-code-review` and `/task-frontend-review` in parallel. Address findings.
- [x] 15.3 Re-run validation trio after review fixes
- [x] 15.4 Mark all tasks complete and report the change ready to archive
