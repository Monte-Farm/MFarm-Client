# i18n Handoff — Estado del proyecto

**Plan de referencia:** `/Users/dpax/.claude/plans/vamos-a-hacer-un-splendid-mccarthy.md`

---

## Progreso global

| # | Dominio | Archivos | Estado |
|---|---|---|---|
| — | Infraestructura (i18n.ts, locales, LanguageSelector) | — | ✅ Completo |
| — | Layout / Shell | 3 | ✅ Completo |
| — | Cerdos | ~12 | ✅ Completo |
| — | Alimentación | ~14 | ✅ Completo |
| — | Reproducción | ~9 | ✅ Completo |
| — | Grupos | ~11 | ✅ Completo |
| — | Medicación | ~18 | ✅ Completo |
| 1 | Laboratorio | 3 | ✅ Completo |
| 2 | Finanzas simples (Sales, Expenses, Incomes, Outcomes) | 4 | ✅ Completo |
| 3 | Auth | ~6 | ✅ Completo |
| 4 | Configuración / Admin | 5 | ✅ Completo |
| 5 | Finance / PeriodClosing | ~13 | ✅ Completo |
| 6 | Componentes compartidos (SuccessModal, ErrorModal, CustomTable…) | ~26 | ✅ Completo |
| 7 | Reportes (21 archivos, 7 subdirs) | 21 | ✅ Completo |
| **8** | **Almacén / Inventario** | **~35+** | **✅ Completo** |

---

## Infraestructura (completo)

- `src/i18n.ts` — keySeparator `.`, `fallbackLng: "sp"`, detector de navegador con `convertDetectedLanguage` (pt→pt, en→en, resto→sp), persistencia en `localStorage` clave `I18N_LANGUAGE`
- `src/common/languages.ts` — 3 idiomas: `sp`, `en`, `pt`
- `src/locales/sp.json` — archivo maestro reescrito con estructura anidada
- `src/locales/en.json` — localizaciones nativas (industria porcina EN)
- `src/locales/pt.json` — localizaciones nativas (suinocultura BR)
- `src/Components/Common/Velzon/LanguageDropdown.tsx` — refactorizado a `LanguageSelector` inline con `Collapse`, sin banderas, embebido en ProfileDropdown
- `src/Components/Common/Velzon/ProfileDropdown.tsx` — selector de idioma integrado, strings migrados

---

## Dominios migrados

### Layout / Shell
| Archivo | Estado |
|---|---|
| `src/Layouts/LayoutMenuData.tsx` | ✅ Completo |
| `src/Layouts/Sidebar.tsx` | ✅ roleLabels muertos eliminados |
| `src/Components/Common/Velzon/ProfileDropdown.tsx` | ✅ Completo |

### Dominio: Cerdos (`src/pages/Pigs/` + componentes)
| Archivo | Estado |
|---|---|
| `src/pages/Pigs/ViewPigs.tsx` | ✅ Completo |
| `src/pages/Pigs/DiscardedPigs.tsx` | ✅ Completo |
| `src/pages/Pigs/InventoryPigs.tsx` | ✅ Completo |
| `src/Components/Common/Details/PigDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/PigReproductionDetails.tsx` | ✅ Completo (configs movidas dentro del componente) |
| `src/Components/Common/Details/PigMedicalDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/DetailsPigModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/PigCards.tsx` (o similar) | ✅ Completo |
| `src/Components/Common/Forms/PigForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/DiscardPigForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/WeightForm.tsx` | ✅ Completo |
| `src/Components/Common/Filters/PigFilters.tsx` | ✅ Completo |

### Dominio: Alimentación (`src/pages/Feeding/` + componentes)
| Archivo | Estado |
|---|---|
| `src/pages/Feeding/ViewFeedingPackages.tsx` | ✅ Completo |
| `src/pages/Feeding/ViewFeedPreparations.tsx` | ✅ Completo |
| `src/pages/Feeding/ViewFeedingConsumption.tsx` | ✅ Completo |
| `src/Components/Common/Forms/FeedingPackageForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/FeedPreparationForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/FeedAdministrationForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/BulkFeedAdministrationModal.tsx` | ✅ Completo |
| `src/Components/Common/Details/FeedingPackageDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/FeedPreparationDetails.tsx` | ✅ Completo |
| `src/Components/Common/Shared/FeedAdministrationsCard.tsx` | ✅ Completo |
| `src/Components/Common/Details/GroupFeedingDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/LitterFeedingDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/PigFeedingDetails.tsx` | ✅ Completo |

---

### Dominio: Reproducción (`src/pages/Gestation/`, `src/pages/Lactation/`, `src/pages/Births/`, `src/pages/Replacement/`)
| Archivo | Estado |
|---|---|
| `src/pages/Gestation/ViewInseminations.tsx` | ✅ Completo |
| `src/pages/Gestation/ViewPregnancies.tsx` | ✅ Completo |
| `src/pages/Gestation/InseminationDetails.tsx` | ✅ Completo (Attribute arrays movidos dentro del componente) |
| `src/pages/Lactation/ViewLitters.tsx` | ✅ Completo |
| `src/pages/Lactation/LitterDetails.tsx` | ✅ Completo |
| `src/pages/Births/ViewBirths.tsx` | ✅ Completo |
| `src/pages/Births/ViewUpcomingBirths.tsx` | ✅ Completo |
| `src/pages/Replacement/ViewSows.tsx` | ✅ Completo |
| `src/pages/Replacement/ViewBoars.tsx` | ✅ Completo |

---

### Dominio: Grupos (`src/pages/Groups/` + componentes)
| Archivo | Estado |
|---|---|
| `src/pages/Groups/ViewGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewGrowingGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewWeanedGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewFinishingGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewSaleGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewSoldGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewSowsGroups.tsx` | ✅ Completo |
| `src/pages/Groups/ViewExitGroups.tsx` | ✅ Completo |
| `src/pages/Groups/GroupDetails.tsx` | ✅ Completo |
| `src/Components/Common/Views/GroupsView.tsx` | ✅ Completo |
| `src/Components/Common/Forms/GroupForm.tsx` | ✅ Completo |
| `src/config/groupColumnsConfig.tsx` | ✅ Completo (factory fns aceptan `t` como parámetro) |

---

---

### Dominio: Medicación (`src/pages/Medication/` + componentes)
| Archivo | Estado |
|---|---|
| `src/pages/Medication/ViewMedicationPackages.tsx` | ✅ Completo |
| `src/pages/Medication/ViewVaccinePlans.tsx` | ✅ Completo |
| `src/Components/Common/Details/MedicationPackageDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/VaccinationPlanDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/GroupMedicalDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/LitterMedicalDetails.tsx` | ✅ Completo |
| `src/Components/Common/Details/PigMedicalDetails.tsx` | ✅ Completo |
| `src/Components/Common/Forms/MedicationPackageForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignMedicationForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignMedicationPackageForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignGroupMedicationForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignGroupMedicationPackageForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignLitterMedicationForm.tsx` | ✅ Completo |
| `src/Components/Common/Forms/AsignLitterMedicationPackage.tsx` | ✅ Completo |
| `src/Components/Common/Forms/BulkMedicationAssignmentModal.tsx` | ✅ Completo |
| `src/Components/Common/Forms/BulkGroupMedicationAssignmentModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/AdministeredMedicationsCard.tsx` | ✅ Completo |
| `src/Components/Common/Shared/MedicationPackagesCard.tsx` | ✅ Completo |

---

### Dominio: Configuración / Admin
| Archivo | Estado |
|---|---|
| `src/pages/Configurations/FarmConfiguration.tsx` | ✅ Completo |
| `src/pages/Configurations/GlobalConfiguration.tsx` | ✅ Completo |
| `src/pages/Users/ViewUsers.tsx` | ✅ Completo |
| `src/pages/Farms/FarmDetails.tsx` | ✅ Completo (farmAttributes/managerAttributes movidos dentro del componente) |
| `src/pages/Farms/ViewFarms.tsx` | ✅ Completo (farmColumns con useMemo + t) |

---

### Dominio: Finance / PeriodClosing
| Archivo | Estado |
|---|---|
| `src/pages/Finance/PeriodClosing/PeriodClosingList.tsx` | ✅ Completo (MONTHS_ES movido dentro del componente) |
| `src/pages/Finance/PeriodClosing/PeriodClosingDetail.tsx` | ✅ Completo (MONTHS + auditActionLabel movidos dentro del componente) |
| `src/pages/Finance/PeriodClosing/ClosePeriodModal.tsx` | ✅ Completo (MONTHS + ChecklistItemRow movidos dentro; Trans para submitting body) |
| `src/pages/Finance/PeriodClosing/CloseYearModal.tsx` | ✅ Completo (ChecklistItemRow movido dentro; Trans para submitting body) |
| `src/pages/Finance/PeriodClosing/ReopenPeriodModal.tsx` | ✅ Completo (Trans para alert con `<strong>`) |
| `src/pages/Finance/PeriodClosing/tabs/SummaryTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/InventoryProductionTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/SalesDetailTab.tsx` | ✅ Completo (var loop renombrada `t_` para evitar colisión) |
| `src/pages/Finance/PeriodClosing/tabs/FeedingTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/HealthTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/ReproductionTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/WorkforceTab.tsx` | ✅ Completo |
| `src/pages/Finance/PeriodClosing/tabs/ComparisonsTab.tsx` | ✅ Completo (sourceBadge movido dentro de cada sub-componente) |

---

### Dominio: Componentes Compartidos (Shared + Tables)
| Archivo | Estado |
|---|---|
| `src/Components/Common/Shared/SuccessModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/ErrorModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/DeleteModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/MissingStockModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/LoadingAnimation.tsx` | ✅ Completo |
| `src/Components/Common/Shared/FileUploader.tsx` | ✅ Completo |
| `src/Components/Common/Shared/WeaningProgress.tsx` | ✅ Completo (theme texts movidos dentro del componente) |
| `src/Components/Common/Shared/GrowthStatusProgress.tsx` | ✅ Completo (baseSteps + finalStagesMap movidos dentro) |
| `src/Components/Common/Shared/SicknessSymptomsSelector.tsx` | ✅ Completo (SYMPTOMS_CATALOG refactorizado a claves) |
| `src/Components/Common/Shared/SicknessSymptomsSummary.tsx` | ✅ Completo (SYMPTOMS_CATALOG refactorizado a claves) |
| `src/Components/Common/Shared/PigTimeline.tsx` | ✅ Completo (stages movido dentro; breederFemale nueva clave) |
| `src/Components/Common/Shared/ResolveHealthEventModal.tsx` | ✅ Completo (STATUS_CONFIG movido dentro) |
| `src/Components/Common/Shared/HealthEventsCard.tsx` | ✅ Completo (STATUS/SEVERITY_CONFIG movidos dentro) |
| `src/Components/Common/Shared/VaccinationPlansCard.tsx` | ✅ Completo (STAGE_LABELS movido dentro) |
| `src/Components/Common/Shared/LitterEventsCard.tsx` | ✅ Completo (EVENT_CONFIG movido dentro) |
| `src/Components/Common/Shared/PeriodClosedModal.tsx` | ✅ Completo |
| `src/Components/Common/Shared/ReportPageLayout.tsx` | ✅ Completo (formatDateLabel usa common.shortMonths) |
| `src/Components/Common/Shared/ReportDateRangeSelector.tsx` | ✅ Completo (generateButtonText default vía t()) |
| `src/Components/Common/Shared/ImpersonationBanner.tsx` | ✅ Completo |
| `src/Components/Common/Shared/NoGlobalReportPlaceholder.tsx` | ✅ Completo |
| `src/Components/Common/Tables/CustomTable.tsx` | ✅ Completo |
| `src/Components/Common/Tables/Pagination.tsx` | ✅ Completo (prevText/nextText ahora opcionales con fallback) |
| `src/Components/Common/Tables/TableFilter.tsx` | ✅ Completo |
| `src/Components/Common/Tables/SelectableTable.tsx` | ✅ Completo |
| `src/Components/Common/Tables/SelectTable.tsx` | ✅ Completo (t pasado como prop a sub-componentes) |
| `src/Components/Common/Tables/InseminationFilters.tsx` | ✅ Completo (reutiliza insemination.status/result.*) |

---

### Dominio 7: Reportes (`src/pages/Reports/`)
| Archivo | Estado |
|---|---|
| `src/pages/Reports/Audit/AuditReport.tsx` | ✅ Completo (actionLabels movido dentro) |
| `src/pages/Reports/Catalogs/CatalogsReport.tsx` | ✅ Completo |
| `src/pages/Reports/Traceability/GroupTraceabilityReport.tsx` | ✅ Completo (eventTypeLabels movido dentro) |
| `src/pages/Reports/Production/InseminationsBirthsReport.tsx` | ✅ Completo (resultLabels movido dentro) |
| `src/pages/Reports/Production/GroupsReport.tsx` | ✅ Completo (stageLabels + movementLabels movidos dentro) |
| `src/pages/Reports/Production/MortalityReport.tsx` | ✅ Completo |
| `src/pages/Reports/Production/FeedWeightReport.tsx` | ✅ Completo |
| `src/pages/Reports/Production/ReproductiveReport.tsx` | ✅ Completo |
| `src/pages/Reports/Inventory/InventoryMovementsReport.tsx` | ✅ Completo (movementTypeLabels movido dentro) |
| `src/pages/Reports/Inventory/FeedConsumptionReport.tsx` | ✅ Completo |
| `src/pages/Reports/Inventory/InventoryAlertsReport.tsx` | ✅ Completo |
| `src/pages/Reports/Inventory/InventoryValuationReport.tsx` | ✅ Completo |
| `src/pages/Reports/Sales/SalesReport.tsx` | ✅ Completo (paymentMethodLabels + paymentStatusLabels movidos dentro) |
| `src/pages/Reports/Sales/ClientsReport.tsx` | ✅ Completo |
| `src/pages/Reports/Finance/CashFlowReport.tsx` | ✅ Completo (flowTypeLabels movido dentro) |
| `src/pages/Reports/Finance/PurchasesReport.tsx` | ✅ Completo |
| `src/pages/Reports/Finance/CostAnalysisReport.tsx` | ✅ Completo |
| `src/pages/Reports/Finance/ProfitabilityReport.tsx` | ✅ Completo |
| `src/pages/Reports/Finance/OperationsClosingReport.tsx` | ✅ Completo (banner condicional JSX traducido) |
| `src/pages/Reports/Finance/ExpensesReport.tsx` | ✅ Completo (categoryLabels movido dentro) |
| `src/pages/Reports/Finance/SupplierStatementReport.tsx` | ✅ Completo (selector de proveedor traducido) |

---

## Dominios pendientes

### 8. Almacén / Inventario (~35+ archivos — más grande al final)

**Pages:**
- `src/pages/Inventory/ViewInventory.tsx`
- `src/pages/Inventory/InventoryDetails.tsx`
- `src/pages/Subwarehouse/ViewSubwarehouse.tsx`
- `src/pages/Subwarehouse/SubwarehouseDetails.tsx`
- `src/pages/Subwarehouse/SubwarehouseInventory.tsx`
- `src/pages/Subwarehouse/SubwarehouseIncomes.tsx`
- `src/pages/Subwarehouse/SubwarehouseOutcomes.tsx`
- `src/pages/Products/ViewProducts.tsx`
- `src/pages/Suppliers/Suppliers.tsx`
- `src/pages/Orders/CompleteOrder.tsx`
- `src/pages/Orders/OrderDetails.tsx`
- `src/pages/Orders/SendOrders.tsx`
- `src/pages/PurchaseOrders/ViewPurchaseOrders.tsx`

**Forms:**
- `src/Components/Common/Forms/ProductForm.tsx`
- `src/Components/Common/Forms/SupplierForm.tsx`
- `src/Components/Common/Forms/OrderForm.tsx`
- `src/Components/Common/Forms/CompleteOrderForm.tsx`
- `src/Components/Common/Forms/PurchaseOrderForm.tsx`
- `src/Components/Common/Forms/IncomeForm.tsx`
- `src/Components/Common/Forms/OutcomeForm.tsx`
- `src/Components/Common/Forms/SubwarehouseOutcomeForm.tsx`
- `src/Components/Common/Forms/ExtractionForm.tsx`

**Tables:**
- `src/Components/Common/Tables/CreateOrderTable.tsx`
- `src/Components/Common/Tables/OrderTable.tsx`
- `src/Components/Common/Tables/TaxesTable.tsx`
- `src/Components/Common/Tables/PurchaseOrderProductsTable.tsx`

**Details:**
- `src/Components/Common/Details/IncomeDetailsModal.tsx`
- `src/Components/Common/Details/OutcomeDetails.tsx`
- `src/Components/Common/Details/OrderDetailsModal.tsx`
- `src/Components/Common/Details/PurchaseOrderDetails.tsx`
- `src/Components/Common/Details/SupplierDetailsModal.tsx`
- `src/Components/Common/Details/ExtractionDetails.tsx`
- `src/Components/Common/Details/SaleDetails.tsx`

**Otros (posiblemente pendientes — verificar):**
- `src/Components/Common/Forms/SellPigsFormV2.tsx` / `SellPigsForm.tsx`
- `src/Components/Common/Forms/ProcessPigSaleForm.tsx`
- `src/Components/Common/Forms/WeighGroupForm.tsx`
- `src/Components/Common/Notifications/NotificationDropdown.tsx`
- `src/Components/Common/Lists/HistoryList.tsx` / `HistoryListFilter.tsx`

---

## Estructura de claves locale (top-level)

```
common.button.*        — botones reutilizables (save, saving, cancel, delete, next, back, generating, exportPdf…)
common.status.*        — active, inactive, loading, noData
common.sex.*           — male, female
common.field.*         — code, name, date, weight…
profile.*              — logout, settings, language, darkMode…
auth.*                 — login, logout, logoutConfirm
pigs.*                 — stage, health, view, form
medical.*              — medication, treatment, routes
reproduction.*         — type, cycle, quality, result, form
form.pig.*             — steps, fields, validation, actions (pig forms)
form.validation.*      — required, codeExists, mustBeNumber, min, max, positive…
roles.*                — Superadmin, farm_manager…
menu.*                 — sidebar labels
feeding.stage.*        — piglet, weaning, fattening, breeder, general…
feeding.productCategory.* — nutrition, vitamins, minerals…
feeding.package.*      — form, column, action, success, error, detail
feeding.preparation.*  — form, column, detail
feeding.administration.* — form, card, column, bulk, target
feeding.consumption.*  — kpi, chart, table, filter, modal
groups.*               — column, area, status, stage, kpi, card, metric, tab, action, button, modal, form, validation, empty, error, report, pageTitle, view
insemination.*         — breadcrumb, column, status, result, kpi, chart, action, modal, selected, bulk, field, placeholder, empty, error, success, detail, form
pregnancy.*            — breadcrumb, column, status, kpi, chart, action, modal, selected, bulk, field, placeholder, empty, error, success
litter.*               — breadcrumb, column, status, kpi, tab, card, attr, motherAttr, pigletColumn, action, modal, selected, tooltip, empty, error, wean
birth.*                — breadcrumb, column, type, assisted, kpi, chart, card, modal, action, selected, bulk, field, placeholder, empty, error, success, form
replacement.*          — breadcrumb, kpi, chart, column, stage, status, filter, action, modal, empty, error, form
config.farm.*          — pageTitle, breadcrumb, noFarm, header, button, section, field (all cycle thresholds), validation, success, error
config.global.*        — pageTitle, breadcrumb, header, field, logo, button, validation, error, success
users.*                — pageTitle, breadcrumb, column, button, selection, empty, modal (details/create/update/bulkDeactivate/bulkActivate), success, error
farms.*                — pageTitle, breadcrumb, details (breadcrumb/generalInfo/managerInfo/attr), column, search, button, modal, success, error
finance.periodClosing.* — months[], status, list (columns/buttons/empty/success), detail (breadcrumb/badge/audit/tabs/actions), modal (shared/closePeriod/forceClose/closeYear/reopen), tabs (summary/inventory/sales/feeding/health/reproduction/workforce/comparisons)
common.button.accept   — "Aceptar" (nuevo)
common.shortMonths[]   — abreviaturas de mes para ReportPageLayout
shared.*               — modal, deleteModal, missingStock, fileUploader, weaningProgress, growthStatus, symptoms (categorías + síntomas), pigTimeline, healthEvent (status/severity/resolve/card), vaccinationPlans, litterEvents, periodClosed, reportLayout, dateRangeSelector, impersonation, noGlobalReport, table, pagination, selectTable
insemination.filter.*  — search, filters, clearFilters, clearAll, applyFilters, title, doses, status, result, dateFrom/To, farrowingFrom/To, all
reports.*              — title, production, inventory, financial, error.*, excel.*, col.*, axis.*
reports.audit.*        — action.*, kpi.*, col.*, tab.*, chart.*
reports.catalogs.*     — kpi.*, tab.*, col.*
reports.groupTraceability.* — selector.*, kpi.*, col.*, card.*
reports.inseminationsBirths.* — resultLabel.*, kpi.*, chart.*, col.*, tab.*
reports.groups.*       — stage.*, movement.*, kpi.*, chart.*, col.*, tab.*
reports.mortality.*    — kpi.*, chart.*, col.*, tab.*
reports.feedWeight.*   — kpi.*, chart.*, col.*, tab.*
reports.reproductive.* — kpi.*, chart.*, col.*, tab.*
reports.invMovements.* — movementType.*, kpi.*, chart.*, col.*, tab.*
reports.feedConsumption.* — kpi.*, chart.*, col.*, tab.*
reports.invAlerts.*    — kpi.*, col.*, tab.*
reports.invValuation.* — kpi.*, chart.*, col.*, tab.*
reports.sales.*        — paymentMethod.*, paymentStatus.*, kpi.*, chart.*, col.*, tab.*
reports.clients.*      — kpi.*, chart.*, col.*, tab.*
reports.cashFlow.*     — flowType.*, kpi.*, table.*, card.*, col.*
reports.purchases.*    — kpi.*, chart.*, col.*, tab.*
reports.costAnalysis.* — kpi.*, chart.*, col.*, tab.*
reports.profitability.* — kpi.*, chart.*, col.*, tab.*
reports.operationsClosing.* — kpi.*, banner.*, table.*, card.*
reports.expenses.*     — category.*, kpi.*, chart.*, card.*, col.*
reports.supplierStatement.* — selector.*, kpi.*, chart.*, card.*, col.*, error.*
```

---

## Convenciones clave

1. **Configs con `t()` en módulo-level están prohibidas** — si un objeto usa `t()` para sus labels (stageConfig, statusConfig), debe definirse DENTRO del componente (`const MyComponent = () => { const stageConfig = {...} }`), no fuera.
2. **Claves dinámicas** — `t('pigs.stage.${value}', { defaultValue: value })` para enums desde la API.
3. **Claves de roles** — No usar `userRoles.ts` para labels; llamar `t('roles.${role}', { defaultValue: role })` en cada render site.
4. **Interpolación** — `t('feeding.package.form.ingredient.exceeds', { val: n })` — siempre `val` como nombre de variable genérica en las claves con `{{val}}`.
5. **Trans para HTML embebido** — `<Trans i18nKey="..." components={{ 1: <strong /> }} />` cuando la string tenga nodos HTML.
6. **fallbackLng: "sp"** — si falta una clave en EN o PT, se muestra el valor en español; no rompe la UI.
