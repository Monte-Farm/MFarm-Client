# Spec: Global period-closings list endpoint (Superadmin)

## Context

The frontend already has a Superadmin "global scope" pattern: when the farm selector in the header is set to "Todas las granjas", the frontend builds report URLs as `/<module>/global/...` (see `buildReportUrl` in the client repo at `src/helpers/reports_url_helper.ts`). All `/reports/*` endpoints in the backend already support this `/global` variant.

The period-closings module does **not** yet have a global variant. Today the list is:

```
GET /period-closings/:farmId
```

A Superadmin in global scope cannot use this — they need to see the closings registered across **all** their farms so they can tell at a glance which farms have already closed the current month and which haven't.

## What to build

Add a new endpoint that returns period closings aggregated across every farm the requesting user is authorized to see. Behavior must mirror the existing per-farm list except for the scope.

### Endpoint

```
GET /period-closings/global
```

### Auth

- Superadmin only. Reject any other role with `403`.
- No farm path/query param. Scope is implicit from the authenticated user.

### Query parameters (same shape as the per-farm list)

| Param         | Type            | Notes                                        |
|---------------|-----------------|----------------------------------------------|
| `period_type` | `monthly` \| `annual` | optional                              |
| `year`        | number          | optional                                     |
| `status`      | `closed` \| `reopened` \| `archived` | optional                |
| `page`        | number          | optional, default 1                          |
| `limit`       | number          | optional, default 20, client currently uses 100 |

Add one new optional filter:

| Param         | Type   | Notes                                  |
|---------------|--------|----------------------------------------|
| `farm_id`     | string | optional, lets superadmin filter to a single farm without leaving global mode |

### Response

Same envelope as the existing per-farm list:

```json
{
  "items": [ /* PeriodClosingListItem[] */ ],
  "pagination": { "page": 1, "limit": 100, "total": N, "totalPages": M }
}
```

Each item must keep every field the per-farm list returns today (`_id`, `farmId`, `periodType`, `year`, `month`, `periodStart`, `periodEnd`, `status`, `closedBy`, `closedAt`, `kpis`) **and add the farm reference** so the UI can render a "Granja" column:

```ts
farm: {
  _id: string;
  name: string;
}
```

`farm.name` is required (not just `_id`) — the frontend must avoid a second lookup.

### Sorting

Default sort: `closedAt` desc, then `farm.name` asc as tiebreaker. This makes the most recent activity float to the top regardless of which farm closed it.

### Pagination

Pagination is across the merged result set, not per-farm. `total` must reflect the total number of matching closings across all farms (after filters), not a sum of per-farm pages.

### Errors

- `403` if the caller is not Superadmin.
- `400` for malformed query params (same validation rules as the per-farm endpoint).
- `500` on unexpected failure, with the same error envelope the rest of the module uses.

## Out of scope (do NOT change)

- The per-farm endpoint `GET /period-closings/:farmId` stays exactly as it is.
- `detail`, `audit`, `close`, `reopen`, `by-period`, `precheck` endpoints are unchanged — they remain keyed by `farmId` / `closingId`.
- No new fields on the underlying `PeriodClosing` document.

## Acceptance criteria

1. A Superadmin calling `GET /period-closings/global` with no filters gets every closing across every farm they can see, newest first, each item carrying `farm: { _id, name }`.
2. Filters (`period_type`, `year`, `status`, `farm_id`) narrow the result correctly and `pagination.total` reflects the filtered count.
3. A non-Superadmin calling the endpoint gets `403`.
4. The existing per-farm list endpoint behaves identically to before this change (regression check).

## Notes for the frontend follow-up (informational)

Once this is live, the client will:

- Use `useReportScope()` in `PeriodClosingList.tsx`.
- Call `/period-closings/global` when `isGlobal === true`, otherwise keep calling `/period-closings/:farmId`.
- Add a "Granja" column to the table, visible only in global scope, sourced from `item.farm.name`.
- Extend `PeriodClosingListItem` in `src/common/data_interfaces.ts` with an optional `farm?: { _id: string; name: string }`.
