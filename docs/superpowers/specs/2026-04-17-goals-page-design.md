# Goals Page Design

**Goal:** Add explicit goal lifecycle actions on the goals page so users can mark goals completed, mark goals failed, or delete them, while separating ongoing work from finished history.

## Scope

- Add per-goal actions for `completed`, `failed`, and `delete`.
- Show goals in two tabs: `Ongoing Goals` and `Completed Goals`.
- Count only ongoing goals in the active goal metric.
- Keep the existing goal creation flow unchanged.

## Data And Backend

- Continue using the existing `goals` table and `status` field.
- Treat `completed` and `failed` as finished states.
- Add a delete API path for removing a goal owned by the current user.
- Reuse the existing update route for status changes.

## UI Behavior

- Newly created goals appear in the ongoing tab.
- Ongoing goal cards show `Completed`, `Failed`, and `Delete` actions.
- Completed-tab cards show a status badge and allow delete.
- Failed goals appear in the completed tab as part of goal history.
- Empty states should differ for ongoing and completed views.

## Error Handling

- Show inline action errors near the goals list when goal actions fail.
- Keep form submission errors in the existing modal error area.
- Disable action buttons while a request is in flight for that goal.

## Testing

- Add small regression coverage for goal grouping/action-state helpers with Node's built-in test runner.
- Manually verify the page in the browser after changes.
