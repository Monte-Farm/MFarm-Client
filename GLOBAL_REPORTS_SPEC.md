# Global Reports — Specification

All global endpoints aggregate data across **all active farms** (`status: true`) simultaneously.
No `farm_id` parameter is required. All date params are `YYYY-MM-DD`.

## Response envelope

**JSON endpoints:**
```json
{
  "data": {
    "farms": [
      { "farmId": "...", "farmName": "...", "farmCode": "...", "data": { ... } }
    ],
    "totals": { ... },
    "dateRange": { "startDate": "...", "endDate": "..." }
  }
}
```

**PDF endpoints:** `application/pdf` binary stream (`Content-Disposition: attachment`).  
**Excel endpoints:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` binary stream.

---

## Production — `/reports/production`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /inseminations-births/:farm_id` | `GET /global/inseminations-births` | JSON | `start_date`, `end_date` |
| `GET /inseminations-births/pdf/:farm_id` | `GET /global/inseminations-births/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /groups/:farm_id` | `GET /global/groups` | JSON | `start_date`, `end_date` |
| `GET /groups/pdf/:farm_id` | `GET /global/groups/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /mortality/:farm_id` | `GET /global/mortality` | JSON | `start_date`, `end_date` |
| `GET /mortality/pdf/:farm_id` | `GET /global/mortality/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /feed-weight/:farm_id` | `GET /global/feed-weight` | JSON | `start_date`, `end_date` |
| `GET /feed-weight/pdf/:farm_id` | `GET /global/feed-weight/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /reproductive/:farm_id` | `GET /global/reproductive` | JSON | `start_date`, `end_date` |
| `GET /reproductive/pdf/:farm_id` | `GET /global/reproductive/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |

**Global totals shape:**
```json
{
  "totalInseminations": 0,
  "totalBirths": 0,         // inseminations-births
  "totalPigs": 0,
  "totalGroups": 0,         // groups
  "totalDeaths": 0,         // mortality
  "avgFcr": 0,
  "avgAdg": 0,              // feed-weight
  "inseminationEffectiveness": 0  // reproductive
}
```

---

## Inventory — `/reports/inventory`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /movements/:farm_id` | `GET /global/movements` | JSON | `start_date`, `end_date` |
| `GET /movements/pdf/:farm_id` | `GET /global/movements/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /feed-consumption/:farm_id` | `GET /global/feed-consumption` | JSON | `start_date`, `end_date` |
| `GET /feed-consumption/pdf/:farm_id` | `GET /global/feed-consumption/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /alerts/:farm_id` | `GET /global/alerts` | JSON | `start_date`, `end_date` |
| `GET /alerts/pdf/:farm_id` | `GET /global/alerts/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /valuation/:farm_id` | `GET /global/valuation` | JSON | `start_date`, `end_date` |
| `GET /valuation/pdf/:farm_id` | `GET /global/valuation/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |

**Global totals shape:**
```json
{
  "totalMovements": 0,         // movements
  "totalFeedConsumed": 0,      // feed-consumption
  "staleProductCount": 0,
  "shrinkagePercent": 0,       // alerts
  "totalInventoryValue": 0,
  "totalProducts": 0           // valuation
}
```

---

## Sales — `/reports/sales`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /overview/:farm_id` | `GET /global/overview` | JSON | `start_date`, `end_date` |
| `GET /overview/pdf/:farm_id` | `GET /global/overview/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /clients/:farm_id` | `GET /global/clients` | JSON | `start_date`, `end_date` |
| `GET /clients/pdf/:farm_id` | `GET /global/clients/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |

**Global totals shape:**
```json
{
  "totalSales": 0,
  "totalRevenue": 0,
  "totalPigsSold": 0,   // overview
  "totalClients": 0     // clients
}
```

---

## Catalogs — `/reports/catalogs`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /:farm_id` | `GET /global` | JSON | _(none)_ |
| `GET /pdf/:farm_id` | `GET /global/pdf` | PDF | `orientation?`, `format?` |

No date range — catalog data is not time-bounded.

**Global totals shape:**
```json
{
  "totalSuppliers": 0,
  "totalClients": 0
}
```

---

## Traceability — `/reports/traceability`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /groups/:farm_id` | `GET /global/groups` | JSON | _(none)_ |

JSON only — no PDF for global traceability.

**Response shape:**
```json
{
  "data": [
    { "farmId": "...", "farmName": "...", "farmCode": "...", "groups": [ ... ] }
  ]
}
```

---

## Audit — `/reports/audit`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /:farm_id` | `GET /global` | JSON | `start_date`, `end_date` |
| `GET /pdf/:farm_id` | `GET /global/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |

**Global totals shape:**
```json
{
  "totalActions": 0,
  "totalAdjustments": 0,
  "totalPriceChanges": 0
}
```

---

## Finance — `/reports/finance`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /purchases/:farm_id` | `GET /global/purchases` | JSON | `start_date`, `end_date` |
| `GET /purchases/pdf/:farm_id` | `GET /global/purchases/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /costs/:farm_id` | `GET /global/costs` | JSON | `start_date`, `end_date` |
| `GET /costs/pdf/:farm_id` | `GET /global/costs/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /profitability/:farm_id` | `GET /global/profitability` | JSON | `start_date`, `end_date` |
| `GET /profitability/pdf/:farm_id` | `GET /global/profitability/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /operations-closing/:farm_id` | `GET /global/operations-closing` | JSON | `start_date`, `end_date` |
| `GET /operations-closing/pdf/:farm_id` | `GET /global/operations-closing/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /operations-closing/excel/:farm_id` | `GET /global/operations-closing/excel` | Excel | `start_date`, `end_date` |
| `GET /cash-flow/:farm_id` | `GET /global/cash-flow` | JSON | `start_date`, `end_date` |
| `GET /cash-flow/pdf/:farm_id` | `GET /global/cash-flow/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |
| `GET /cash-flow/excel/:farm_id` | `GET /global/cash-flow/excel` | Excel | `start_date`, `end_date` |
| `GET /manual-expenses/pdf/:farm_id` | `GET /global/manual-expenses/pdf` | PDF | `start_date`, `end_date`, `orientation?`, `format?` |

**Global totals shape (per report):**
```json
// purchases
{ "totalPurchases": 0, "totalSpent": 0 }

// costs
{ "totalCost": 0 }

// profitability
{ "totalIncome": 0, "totalCost": 0, "totalProfit": 0 }

// operations-closing
{ "totalIncome": 0, "totalCosts": 0, "operatingResult": 0 }

// cash-flow
{ "totalInflows": 0, "totalOutflows": 0, "netCashFlow": 0 }

// manual-expenses
{ "totalExpenses": 0, "totalAmount": 0 }
```

**Excel — operations-closing:** one worksheet per farm + `Consolidado` summary sheet.  
**Excel — cash-flow:** one worksheet per farm (movement entries) + `Consolidado` summary sheet.

---

## Dashboards — `/dashboard`

| Per-farm route | Global route | Format | Query params |
|---|---|---|---|
| `GET /executive/:farm_id` | `GET /global/executive` | JSON | `start_date`, `end_date` |
| `GET /warehouse/:farm_id` | `GET /global/warehouse` | JSON | `start_date`, `end_date` |
| `GET /reproduction/:farm_id` | `GET /global/reproduction` | JSON | `start_date`, `end_date` |
| `GET /veterinary/:farm_id` | `GET /global/veterinary` | JSON | `start_date`, `end_date` |
| `GET /worker/:farm_id` | `GET /global/worker` | JSON | `start_date`, `end_date` |

No PDFs for global dashboards — JSON only.  
Global worker dashboard omits `user_id` (aggregates all farms without user filter).

**Global totals shape (per dashboard):**
```json
// executive
{ "totalActivePigs": 0, "totalActiveGroups": 0, "totalIncome": 0, "operatingResult": 0 }

// warehouse
{ "totalInventoryValue": 0, "totalProducts": 0, "criticalStockCount": 0 }

// reproduction
{ "pendingInseminations": 0, "upcomingBirths": 0 }

// veterinary
{ "totalDeaths": 0, "medicationsApplied": 0, "vaccinationsApplied": 0 }

// worker
{ "totalActivePigs": 0, "totalActiveGroups": 0 }
```

---

## Summary counts

| Module | Per-farm endpoints | Global endpoints added |
|---|---|---|
| Production | 10 | 10 |
| Inventory | 8 | 8 |
| Sales | 4 | 4 |
| Catalogs | 2 | 2 |
| Traceability | 1 | 1 |
| Audit | 2 | 2 |
| Finance | 13 | 13 |
| Dashboards | 5 | 5 |
| **Total** | **45** | **45** |
