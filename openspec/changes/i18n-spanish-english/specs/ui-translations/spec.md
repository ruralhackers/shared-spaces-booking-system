# Spec: ui-translations

## ADDED Requirements

### Requirement: Navigation and header translations
The system SHALL translate all navigation and header elements.

#### Scenario: Homepage link
- **WHEN** viewing the header in Spanish
- **THEN** the home link displays "Inicio" or the site name

#### Scenario: Admin link
- **WHEN** viewing the header in English
- **THEN** admin navigation displays "Admin"

#### Scenario: Theme toggle accessibility
- **WHEN** viewing the theme toggle in Spanish
- **THEN** the aria-label is "Cambiar tema"

#### Scenario: Theme toggle accessibility in English
- **WHEN** viewing the theme toggle in English
- **THEN** the aria-label is "Toggle theme"

### Requirement: Booking form translations
The system SHALL translate all booking form labels, placeholders, buttons, and validation messages.

#### Scenario: Form labels in Spanish
- **WHEN** viewing the booking form in Spanish
- **THEN** labels display "Nombre", "Hora de inicio", "Hora de fin"

#### Scenario: Form labels in English
- **WHEN** viewing the booking form in English
- **THEN** labels display "Name", "Start time", "End time"

#### Scenario: Submit button in Spanish
- **WHEN** viewing the booking form in Spanish
- **THEN** the submit button displays "Reservar"

#### Scenario: Submit button in English
- **WHEN** viewing the booking form in English
- **THEN** the submit button displays "Book"

#### Scenario: Validation error in Spanish
- **WHEN** a booking fails validation in Spanish
- **THEN** error messages display in Spanish (e.g., "El horario está ocupado")

#### Scenario: Validation error in English
- **WHEN** a booking fails validation in English
- **THEN** error messages display in English (e.g., "Time slot is already booked")

### Requirement: Admin interface translations
The system SHALL translate all admin interface elements including page titles, buttons, and table headers.

#### Scenario: Admin bookings page in Spanish
- **WHEN** viewing the admin bookings page in Spanish
- **THEN** the page title displays "Reservas activas"
- **AND** the cancel button displays "Cancelar"

#### Scenario: Admin bookings page in English
- **WHEN** viewing the admin bookings page in English
- **THEN** the page title displays "Active bookings"
- **AND** the cancel button displays "Cancel"

#### Scenario: Admin spaces page in Spanish
- **WHEN** viewing the admin spaces page in Spanish
- **THEN** the page title displays "Espacios"
- **AND** the create button displays "Crear espacio"
- **AND** action buttons display "Editar" and "Eliminar"

#### Scenario: Admin spaces page in English
- **WHEN** viewing the admin spaces page in English
- **THEN** the page title displays "Spaces"
- **AND** the create button displays "Create space"
- **AND** action buttons display "Edit" and "Delete"

### Requirement: Empty state translations
The system SHALL translate all empty state messages.

#### Scenario: No spaces available in Spanish
- **WHEN** viewing the homepage with no spaces in Spanish
- **THEN** the empty state displays "No hay espacios disponibles"

#### Scenario: No spaces available in English
- **WHEN** viewing the homepage with no spaces in English
- **THEN** the empty state displays "No spaces available"

#### Scenario: No bookings in Spanish
- **WHEN** viewing the admin bookings page with no bookings in Spanish
- **THEN** the empty state displays "No hay reservas activas"

#### Scenario: No bookings in English
- **WHEN** viewing the admin bookings page with no bookings in English
- **THEN** the empty state displays "No active bookings"

### Requirement: Confirmation dialog translations
The system SHALL translate all confirmation dialogs and their buttons.

#### Scenario: Delete space confirmation in Spanish
- **WHEN** attempting to delete a space in Spanish
- **THEN** the confirmation dialog displays "¿Eliminar espacio?"
- **AND** the warning message is in Spanish
- **AND** buttons display "Cancelar" and "Eliminar"

#### Scenario: Delete space confirmation in English
- **WHEN** attempting to delete a space in English
- **THEN** the confirmation dialog displays "Delete space?"
- **AND** the warning message is in English
- **AND** buttons display "Cancel" and "Delete"

### Requirement: Toast notification translations
The system SHALL translate all toast notifications (success, error, info).

#### Scenario: Booking success in Spanish
- **WHEN** a booking is created successfully in Spanish
- **THEN** the toast displays "Reserva creada"

#### Scenario: Booking success in English
- **WHEN** a booking is created successfully in English
- **THEN** the toast displays "Booking created"

#### Scenario: Error notification in Spanish
- **WHEN** an error occurs in Spanish
- **THEN** the error toast displays the translated error message

#### Scenario: Error notification in English
- **WHEN** an error occurs in English
- **THEN** the error toast displays the error message in English

### Requirement: Date and time display translations
The system SHALL display dates and times using locale-appropriate formatting.

#### Scenario: Booking time display in Spanish
- **WHEN** viewing a booking in Spanish
- **THEN** the time displays in 24-hour format with Spanish month names (e.g., "2 may 2026, 14:30")

#### Scenario: Booking time display in English
- **WHEN** viewing a booking in English
- **THEN** the time displays in 12-hour format with English month names (e.g., "May 2, 2026, 2:30 PM")

### Requirement: Open hours editor translations
The system SHALL translate all open hours editor labels and controls.

#### Scenario: Day names in Spanish
- **WHEN** viewing the open hours editor in Spanish
- **THEN** day names display "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"

#### Scenario: Day names in English
- **WHEN** viewing the open hours editor in English
- **THEN** day names display "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"

#### Scenario: Open 24h checkbox in Spanish
- **WHEN** viewing the open hours editor in Spanish
- **THEN** the checkbox label displays "Abierto 24h"

#### Scenario: Open 24h checkbox in English
- **WHEN** viewing the open hours editor in English
- **THEN** the checkbox label displays "Open 24h"

#### Scenario: Add/remove window buttons in Spanish
- **WHEN** viewing the open hours editor in Spanish
- **THEN** buttons display "Añadir horario" and "Eliminar"

#### Scenario: Add/remove window buttons in English
- **WHEN** viewing the open hours editor in English
- **THEN** buttons display "Add time slot" and "Remove"
