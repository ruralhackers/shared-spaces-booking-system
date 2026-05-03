## REMOVED Requirements

### Requirement: Book button is always visible without scrolling

**Reason:** The tap-to-reserve interaction pattern replaces the need for a separate "Book" button. Users can now tap any free slot in the timeline to initiate a booking, eliminating the need to scroll to a form or button.

**Migration:** The "Book" button in the sticky top bar is removed. Users tap free slots in the timeline to open the quick-book sheet. For advanced bookings (recurring), a "Reserva avanzada (recurrente)" button is placed at the bottom of the timeline.

---

### Requirement: Booking form pre-fills default times on load

**Reason:** There is no longer a separate booking form section on the page. The timeline replaces the list+form layout. Default times are now computed dynamically when a user taps a free slot (start = tapped hour, end = start + 1h capped).

**Migration:** The `BookingForm` component is removed from the main detail page flow. Its logic is extracted into:
- `quick-book-sheet.tsx` (for tap-to-reserve with dynamic defaults)
- `advanced-booking-sheet.tsx` (for recurring bookings, accessed via a button at the bottom)

---
