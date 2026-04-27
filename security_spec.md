# Security Spec - Macau Zen Planner

## 1. Data Invariants
- An itinerary item or expense MUST belong to a trip that the user has access to.
- Timestamps and prices must be valid types.
- Users cannot modify the `ownerId` of a trip once created.

## 2. Dirty Dozen Payloads (Rejection Targets)
1. **Identity Theft**: Creating a trip with someone else's `ownerId`.
2. **Resource Poisoning**: Injecting a 1MB string into a `title` field.
3. **Ghost Fields**: Adding `isAdmin: true` to a user profile.
4. **Orphaned Writes**: Creating an itinerary item for a trip ID that doesn't exist (handled by client logic and parent verification).
5. **State Shortcut**: Updating an expense amount to a negative number (if restricted).
6. **Query Scraping**: Attempting to `list` trips without an `ownerId` filter.
7. **Type Mismatch**: Sending a string for the `amount` field in expenses.
8. **ID Injection**: Using a massive character string as a document ID.
9. **Participant Spoofing**: Adding participants without verifying their existence.
10. **Date Invalidation**: Setting a `startDate` that is far in the future/past beyond reasonable limits (soft check).
11. **Mass Delete**: Attempting to delete a trip as a non-owner.
12. **PII Leak**: Accessing another user's profile PII if it existed.

## 3. Test Runner (Conceptual)
All payloads above should return `PERMISSION_DENIED`.
