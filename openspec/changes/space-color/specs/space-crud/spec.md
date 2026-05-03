## MODIFIED Requirements

### Requirement: Admin can create a space

An admin SHALL be able to create a space by providing a name, description, open hours, and optionally a color. The system SHALL generate a unique slug from the name. If no color is provided, it SHALL default to `null`.

#### Scenario: Create space with color
- **WHEN** an admin creates a space with name "Sala Azul", description "Blue room", default open hours, and color `#3b82f6`
- **THEN** the space SHALL be created with color `#3b82f6`

#### Scenario: Create space without color
- **WHEN** an admin creates a space with name "Sala Simple" and no color
- **THEN** the space SHALL be created with color `null`

---

### Requirement: Admin can update a space

An admin SHALL be able to update a space's name, description, open hours, and color. Updating color to `null` SHALL remove the color.

#### Scenario: Update space color
- **WHEN** an admin updates a space's color to `#ef4444`
- **THEN** the space's color SHALL be `#ef4444`

#### Scenario: Remove space color
- **WHEN** an admin updates a space's color to `null`
- **THEN** the space's color SHALL be `null`
