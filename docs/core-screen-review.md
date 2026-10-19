# Core screen review

This review records the current Section 6 implementation against the requested screen order. It distinguishes working UI from functions that are still placeholders. No route, booking rule, validation rule or database flow was changed for this pass.

| Screen | Current implementation | Remaining gap |
|---|---|---|
| Authentication | Login, registration, forgot-password and reset-password share `AuthShell`, labeled fields, blur validation, password visibility controls and plain-language error feedback. | Verify the email-confirmation and expired-reset paths with configured Supabase accounts as part of the evaluation. |
| Public discovery | Landing page explains the service and booking steps; unit cards link to a detail page with a keyboard-operable photo gallery, capacity, price, amenities, booking notes and a sticky booking panel. | The unit data model has no house-rules field, so no unit-specific house rules are displayed. The mobile booking action scrolls to the existing panel. |
| Dates and availability | The calendar explains advance notice and exclusive check-out, distinguishes booked dates with a dashed pattern and legend, supports arrow-key movement, and announces selection and availability results. It shows nights and price before a request. | Verify operation at the specified device widths and with keyboard-only and screen-reader use during Section 7 evaluation. |
| Reservation request | A three-step request flow collects dates and guests, presents a review, and provides deposit instructions with copy actions. Back navigation preserves values while the page remains mounted; cancellation remains available before submission. | Draft state is not restored after a page reload. Persistence would require a product decision and data-flow change. |
| Guest dashboards | Reservation records show a status badge and next action. Inquiry cards show a three-stage progress indicator and plain-language status guidance. Empty and error states offer a next action or retry. | The system stores current inquiry status but no status-transition history. The progress indicator describes the current stage; it does not claim event timestamps. |
| Admin workspace | Admin navigation exists, and role-specific orientation accurately identifies prepared and unfinished areas. | Dashboard, reservations, inquiry inbox, unit management, guest list, reservation timeline/calendar, filters and count badges are placeholders. Building them needs approved admin queries and workflows, outside this presentation-only pass. |
| Super-admin tools | Staff roles and account access can be managed; consequential changes now require confirmation. The page uses the shared page header and breadcrumbs. | Keyword and booking-rule routes remain placeholders. Unit editing and related workflows are also not implemented. |

## Follow-up requiring product or data-flow decisions

- Define and implement role-authorized admin queries and actions for reservations, inquiries, units and guests before designing their populated states.
- Add a reservation event history if the interface must show a true timeline with timestamps for request, deposit verification, review, cancellation and completion. Current status alone cannot establish when each transition occurred.
- Add an optional house-rules field to unit data if the owner wants unit-specific house rules shown to guests.
- Decide whether unfinished reservation and inquiry drafts should persist after reload; the current guard warns before leaving but does not save drafts.

These follow-ups are not implemented because the project constraints prohibit changing routes or data flow in this section.
