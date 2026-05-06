## MODIFIED Requirements

### Requirement: Other date picker pre-selects today
The availability finder's "other date" input SHALL initialise with today's date in the booking timezone when the user selects the "other date" preset, so that the native date picker on iOS Safari opens with a valid pre-selected value.

#### Scenario: Date input has a value when first rendered
- **WHEN** the user taps the "Otra fecha" button
- **THEN** the date input SHALL display today's date as its initial value

#### Scenario: User can change the pre-selected date
- **WHEN** the date input is pre-filled with today's date
- **THEN** the user SHALL be able to pick any future date and the time picker SHALL appear

#### Scenario: Date input uses the shared Input component
- **WHEN** the "other date" input is rendered
- **THEN** it SHALL use the shadcn `<Input>` component with `type="date"`
