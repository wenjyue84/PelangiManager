# Proposed Improvements

Here are the identified issues and potential improvements from the codebase scan.

## 1. Refactor `sortable-guest-table.tsx`
- **Problem**: File size is **1877 lines**, significantly violating the 800-line rule.
- **Impact**: Code is hard to maintain, test, and understand.
- **Plan**: Extract sub-components (e.g., table rows, filters, action menus) and move logic to custom hooks.

## 2. Refactor `push-notification-settings.tsx`
- **Problem**: File size is **1385 lines**.
- **Impact**: Maintenance burden and complexity.
- **Plan**: Split into smaller components for each settings section (e.g., General, Subscriptions).

## 3. Implement Staff Photo Upload
- **Problem**: The "Upload Photo" button in `guest-details-modal.tsx` is a placeholder.
- **Context**: `TODO: Implement photo upload functionality for staff`
- **Plan**: Implement the actual file upload logic using the existing `/objects` API or storage service.

## 4. Fix Guest ID Duplicate Check
- **Problem**: Duplicate guest validation is commented out in `server/routes/guests.ts`.
- **Context**: `TODO: Implement getGuestByIdNumber method in storage`
- **Impact**: Risk of creating duplicate guest records.
- **Plan**: Implement the missing method in `StorageFactory` and `DatabaseStorage`/`MemoryStorage`, then enable the validation.
