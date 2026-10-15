# Rule tests

Each file is one self-contained block for the Supabase SQL editor. Every block ends by raising an error that carries a `RESULT ...` line, so **nothing is ever saved**. Run one file at a time and compare the result with the expected line in the file header.

| File | Covers |
| --- | --- |
| 01_invoices_and_payouts.sql | invoice cap and the customer / provider steps, payout account review, verified status |
| 02_company_documents.sql | Private, Team, Public files, owner-only publishing, public page on and off |
| 03_shifts_and_tasks.sql | member sees only their own, clock window, unassigned tasks, removed member |
| 04_notifications_and_organiser.sql | mute groups, organiser needs a checked identity, trigger functions still fire |
| 05_waitlist.sql | volunteer waiting list promotion |
| 06_reminders.sql | all reminder kinds, no duplicates |
| 07_space_overview.sql | Piron Work Space overview, owner flag, audit log |
| 08_profile_columns.sql | a person cannot change their own identity or job count |
| 09_space_people.sql | Piron Work Space People: list, person, pause and resume |
| 10_space_marketplace.sql | Piron Work Space Marketplace health, owner only |

Notes
- The blocks use two real account ids (POR and Piron). If they change, replace the two uuids at the top of the file. Test 01 needs the provider (`pv`) to be an account that is not an admin.
- The editor shows a "destructive operation" warning for blocks that delete or revoke inside the test; confirm it, the transaction still rolls back.
- Run these after any migration that touches invoices, documents, shifts, tasks, notifications, activities or reminders.
