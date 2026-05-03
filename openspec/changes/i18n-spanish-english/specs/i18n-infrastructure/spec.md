# Spec: i18n-infrastructure

## ADDED Requirements

### Requirement: Language detection and initialization
The system SHALL detect the user's preferred language on first visit and initialize the i18n system accordingly.

#### Scenario: First-time visitor with Spanish browser
- **WHEN** a user visits the app for the first time with browser language set to Spanish (`es` or `es-*`)
- **THEN** the app displays in Spanish

#### Scenario: First-time visitor with English browser
- **WHEN** a user visits the app for the first time with browser language set to English (`en` or `en-*`)
- **THEN** the app displays in English

#### Scenario: First-time visitor with unsupported language
- **WHEN** a user visits the app for the first time with browser language set to an unsupported language (e.g., French)
- **THEN** the app defaults to Spanish

#### Scenario: Returning visitor with saved preference
- **WHEN** a user who previously selected a language returns to the app
- **THEN** the app displays in their saved language preference, ignoring browser language

### Requirement: Language switching
The system SHALL allow users to switch between Spanish and English at any time.

#### Scenario: Switch from Spanish to English
- **WHEN** a user viewing the app in Spanish clicks the language switcher and selects English
- **THEN** all UI text immediately updates to English
- **AND** the preference is saved to localStorage

#### Scenario: Switch from English to Spanish
- **WHEN** a user viewing the app in English clicks the language switcher and selects Spanish
- **THEN** all UI text immediately updates to Spanish
- **AND** the preference is saved to localStorage

#### Scenario: Language persists across page navigation
- **WHEN** a user switches language and navigates to a different page
- **THEN** the selected language remains active

#### Scenario: Language persists across sessions
- **WHEN** a user switches language, closes the browser, and returns later
- **THEN** the app displays in their previously selected language

### Requirement: Language switcher UI
The system SHALL provide a visible language switcher in the application header.

#### Scenario: Language switcher displays current language
- **WHEN** a user views the header
- **THEN** the language switcher shows the currently active language (e.g., "ES" or "EN")

#### Scenario: Language switcher shows available options
- **WHEN** a user clicks the language switcher
- **THEN** a dropdown or menu displays both Spanish and English options

### Requirement: Locale-aware date formatting
The system SHALL format dates and times according to the selected language's locale.

#### Scenario: Date formatting in Spanish
- **WHEN** the app is displaying in Spanish
- **THEN** dates are formatted using Spanish locale conventions (e.g., "2 may 2026, 14:30")

#### Scenario: Date formatting in English
- **WHEN** the app is displaying in English
- **THEN** dates are formatted using English locale conventions (e.g., "May 2, 2026, 2:30 PM")

#### Scenario: Timezone remains consistent across locales
- **WHEN** a date is displayed in either language
- **THEN** the timezone (America/Argentina/Buenos_Aires) remains the same, only the format changes

### Requirement: Type-safe translation keys
The system SHALL provide compile-time type safety for translation keys to prevent runtime errors.

#### Scenario: Valid translation key
- **WHEN** a developer uses a translation key that exists in the translation files
- **THEN** TypeScript compilation succeeds

#### Scenario: Invalid translation key
- **WHEN** a developer uses a translation key that does not exist in the translation files
- **THEN** TypeScript compilation fails with a type error

#### Scenario: Autocomplete for translation keys
- **WHEN** a developer types a translation function call in an IDE
- **THEN** the IDE provides autocomplete suggestions for available translation keys

### Requirement: Fallback behavior
The system SHALL gracefully handle missing translations by falling back to the English key.

#### Scenario: Missing Spanish translation
- **WHEN** a translation key exists in English but not in Spanish
- **AND** the user has Spanish selected
- **THEN** the app displays the English text for that key

#### Scenario: Missing translation key entirely
- **WHEN** a translation key does not exist in any language file
- **THEN** the app displays the key itself (e.g., "common.button.save")
- **AND** logs a warning to the console in development mode
