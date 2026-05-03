## ADDED Requirements

### Requirement: Space has an optional color attribute

A Space SHALL have an optional `color` attribute of type `string | null`. When not set, it SHALL default to `null`. The color value SHALL be stored as-is without domain-level format validation.

#### Scenario: Space created without color
- **WHEN** an admin creates a space without specifying a color
- **THEN** the space's color SHALL be `null`

#### Scenario: Space created with a color
- **WHEN** an admin creates a space with color `#ef4444`
- **THEN** the space's color SHALL be `#ef4444`

#### Scenario: Space color updated
- **WHEN** an admin updates a space's color from `#ef4444` to `#3b82f6`
- **THEN** the space's color SHALL be `#3b82f6`

#### Scenario: Space color removed
- **WHEN** an admin updates a space's color to null
- **THEN** the space's color SHALL be `null`

---

### Requirement: Admin can pick a color from a preset grid

The admin space form (create and edit) SHALL display a grid of 16 preset colors. The admin SHALL be able to select one by clicking, or deselect by clicking again (setting color to null).

#### Scenario: Selecting a preset color
- **WHEN** an admin clicks a color swatch in the grid
- **THEN** the color input SHALL be set to that color's hex value

#### Scenario: Deselecting a preset color
- **WHEN** an admin clicks the currently selected color swatch
- **THEN** the color input SHALL be cleared to null

---

### Requirement: Admin can enter a custom hex color

The admin space form SHALL include a text input where the admin can type any hex color code. This input SHALL be synchronized with the preset grid selection.

#### Scenario: Typing a custom hex color
- **WHEN** an admin types `#FF5733` in the color input
- **THEN** the color value SHALL be `#FF5733`

#### Scenario: Custom color matches a preset
- **WHEN** an admin types a hex value that matches a preset color
- **THEN** the corresponding preset swatch SHALL appear selected

---

### Requirement: Space color is displayed in the spaces list

When a space has a color set, the spaces list page SHALL display a visual color indicator on the space card. When color is null, no indicator SHALL be shown.

#### Scenario: Space with color in list
- **WHEN** the spaces list renders a space with color `#ef4444`
- **THEN** the space card SHALL display a colored left border with that color

#### Scenario: Space without color in list
- **WHEN** the spaces list renders a space with color `null`
- **THEN** the space card SHALL NOT display a colored border

---

### Requirement: Space color is displayed on the space detail page

When a space has a color set, the space detail page SHALL display a colored dot next to the space name. When color is null, no dot SHALL be shown.

#### Scenario: Space with color on detail page
- **WHEN** the space detail page renders a space with color `#3b82f6`
- **THEN** a colored dot with that color SHALL appear next to the space name

#### Scenario: Space without color on detail page
- **WHEN** the space detail page renders a space with color `null`
- **THEN** no colored dot SHALL appear
