// ─── Content block types ────────────────────────────────────────────────────
// Each block type knows how to look up its content in the i18n JSON under
// manual.sections.{sectionCamelKey}.{impliedKey}.
// Sections that define contentBlocks[] use the new rich rendering path;
// sections that only define screenshotPath/screenshotFormPath use the legacy path.

export type ManualContentBlock =
  | { type: "description" }       // manual.sections.{key}.description  (string)
  | { type: "paragraphs" }        // manual.sections.{key}.paragraphs   (string[])
  | { type: "prerequisites" }     // manual.sections.{key}.prerequisites (string[])
  | { type: "steps" }             // manual.sections.{key}.steps        (ManualStepItem[])
  | { type: "fieldTable" }        // manual.sections.{key}.fields       (ManualFieldItem[])
  | { type: "tips" }              // manual.sections.{key}.tips         (string[])
  | { type: "warning" }           // manual.sections.{key}.warning      (string)
  | { type: "screenshot"; path: string; captionKey?: string }
  | { type: "roleTable" }         // static role-permissions matrix

// ─── Interfaces used in JSON content ────────────────────────────────────────
// These describe the shape of arrays stored in the locale files.
// They are used only as casting helpers in the rendering components.

export interface ManualStepItem {
  title: string;
  desc: string;
  screenshot?: string;
}

export interface ManualFieldItem {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

// ─── Section / Category model ─────────────────────────────────────────────
export interface ManualSection {
  id: string;
  labelKey: string;
  // Optional role restriction — if set, section only renders for users with one of these roles
  roles?: string[];
  // Legacy fields — kept for backward compatibility during migration
  screenshotPath?: string;
  screenshotFormPath?: string;
  // New rich-content system — if present, replaces legacy rendering
  contentBlocks?: ManualContentBlock[];
}

export interface ManualCategory {
  id: string;
  labelKey: string;
  icon: string;
  sections: ManualSection[];
}

// ─── Category / Section registry ─────────────────────────────────────────

export const MANUAL_CATEGORIES: ManualCategory[] = [
  // ── Primeros Pasos ───────────────────────────────────────────────────────
  {
    id: "start",
    labelKey: "manual.categories.start",
    icon: "ri-rocket-line",
    sections: [
      {
        id: "overview",
        labelKey: "manual.sections.overview.title",
        contentBlocks: [
          { type: "description" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "initial-setup",
        labelKey: "manual.sections.initialSetup.title",
        roles: ["Superadmin"],
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
      {
        id: "roles",
        labelKey: "manual.sections.roles.title",
        contentBlocks: [
          { type: "description" },
          { type: "roleTable" },
          { type: "tips" },
        ],
      },
      {
        id: "navigation",
        labelKey: "manual.sections.navigation.title",
        contentBlocks: [
          { type: "description" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
    ],
  },

  // ── Administración ────────────────────────────────────────────────────────
  {
    id: "admin",
    labelKey: "manual.categories.admin",
    icon: "ri-community-line",
    sections: [
      {
        id: "users",
        labelKey: "manual.sections.users.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/admin/users-view.png" },
          { type: "paragraphs" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "farms",
        labelKey: "manual.sections.farms.title",
        roles: ["Superadmin"],
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/admin/farms-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "config-global",
        labelKey: "manual.sections.configGlobal.title",
        roles: ["Superadmin"],
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/admin/config-global.png" },
          { type: "fieldTable" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
      {
        id: "config-farm",
        labelKey: "manual.sections.configFarm.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/admin/config-farm.png" },
          { type: "fieldTable" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
    ],
  },

  // ── Almacén ───────────────────────────────────────────────────────────────
  {
    id: "warehouse",
    labelKey: "manual.categories.warehouse",
    icon: "ri-store-2-line",
    sections: [
      {
        id: "warehouse-products",
        labelKey: "manual.sections.warehouseProducts.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/products-view.png" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "warehouse-suppliers",
        labelKey: "manual.sections.warehouseSuppliers.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/suppliers-view.png" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "purchase-orders",
        labelKey: "manual.sections.purchaseOrders.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/purchase-orders-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "warehouse-incomes",
        labelKey: "manual.sections.warehouseIncomes.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/incomes-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
      {
        id: "warehouse-outcomes",
        labelKey: "manual.sections.warehouseOutcomes.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/outcomes-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "warehouse-inventory",
        labelKey: "manual.sections.warehouseInventory.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/inventory-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "subwarehouse",
        labelKey: "manual.sections.subwarehouse.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/warehouse/subwarehouse-view.png" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
    ],
  },

  // ── Finanzas ──────────────────────────────────────────────────────────────
  {
    id: "finance",
    labelKey: "manual.categories.finance",
    icon: "ri-money-dollar-circle-line",
    sections: [
      {
        id: "sales",
        labelKey: "manual.sections.sales.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/sales/pig-sales-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "expenses",
        labelKey: "manual.sections.expenses.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/finance/expenses-view.png" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "period-closing",
        labelKey: "manual.sections.periodClosing.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/finance/period-closing.png" },
          { type: "paragraphs" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
    ],
  },

  // ── Cerdos ────────────────────────────────────────────────────────────────
  {
    id: "pigs",
    labelKey: "manual.categories.pigs",
    icon: "ri-database-2-line",
    sections: [
      {
        id: "pigs-view",
        labelKey: "manual.sections.pigsView.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/pigs/pigs-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "pig-register",
        labelKey: "manual.sections.pigRegister.title",
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "pig-discard",
        labelKey: "manual.sections.pigDiscard.title",
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
      {
        id: "pigs-discarded",
        labelKey: "manual.sections.pigsDiscarded.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/pigs/discarded-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "groups",
        labelKey: "manual.sections.groups.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/pigs/groups-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "group-create",
        labelKey: "manual.sections.groupCreate.title",
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "group-operations",
        labelKey: "manual.sections.groupOperations.title",
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "tips" },
        ],
      },
    ],
  },

  // ── Operación (ciclo reproductivo) ────────────────────────────────────────
  {
    id: "operation",
    labelKey: "manual.categories.operation",
    icon: "ri-settings-4-line",
    sections: [
      {
        id: "replacement-sows",
        labelKey: "manual.sections.replacementSows.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/replacement-sows.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "replacement-boars",
        labelKey: "manual.sections.replacementBoars.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/replacement-boars.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "lab-extractions",
        labelKey: "manual.sections.labExtractions.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/extractions-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "lab-samples",
        labelKey: "manual.sections.labSamples.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/samples-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "gestation-inseminations",
        labelKey: "manual.sections.gestationInseminations.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/inseminations-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
          { type: "warning" },
        ],
      },
      {
        id: "gestation-pregnancies",
        labelKey: "manual.sections.gestationPregnancies.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/pregnancies-view.png" },
          { type: "paragraphs" },
          { type: "steps" },
          { type: "tips" },
        ],
      },
      {
        id: "births",
        labelKey: "manual.sections.births.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/births-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "lactation",
        labelKey: "manual.sections.lactation.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reproduction/lactation-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "weaning",
        labelKey: "manual.sections.weaning.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/pigs/weaned-groups-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "tips" },
        ],
      },
      {
        id: "growing",
        labelKey: "manual.sections.growing.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/pigs/growing-groups-view.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
    ],
  },

  // ── Salud y Nutrición ─────────────────────────────────────────────────────
  {
    id: "health",
    labelKey: "manual.categories.health",
    icon: "mdi mdi-heart-pulse",
    sections: [
      {
        id: "medication",
        labelKey: "manual.sections.medication.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/health/medication-packages-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "vaccination-plans",
        labelKey: "manual.sections.vaccinationPlans.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/health/vaccination-plans-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "medication-assign",
        labelKey: "manual.sections.medicationAssign.title",
        contentBlocks: [
          { type: "description" },
          { type: "steps" },
          { type: "tips" },
        ],
      },
      {
        id: "feeding",
        labelKey: "manual.sections.feeding.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/health/feeding-packages-view.png" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
      {
        id: "feed-preparation",
        labelKey: "manual.sections.feedPreparation.title",
        contentBlocks: [
          { type: "description" },
          { type: "prerequisites" },
          { type: "steps" },
          { type: "fieldTable" },
          { type: "tips" },
        ],
      },
    ],
  },

  // ── Reportes ──────────────────────────────────────────────────────────────
  {
    id: "reports",
    labelKey: "manual.categories.reports",
    icon: "ri-bar-chart-box-line",
    sections: [
      {
        id: "reports-production",
        labelKey: "manual.sections.reportsProduction.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-inseminations-births.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "reports-inventory",
        labelKey: "manual.sections.reportsInventory.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-inventory-movements.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "reports-finance",
        labelKey: "manual.sections.reportsFinance.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-finance-purchases.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "reports-sales",
        labelKey: "manual.sections.reportsSales.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-sales-overview.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "reports-traceability",
        labelKey: "manual.sections.reportsTraceability.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-traceability.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
      {
        id: "reports-audit",
        labelKey: "manual.sections.reportsAudit.title",
        contentBlocks: [
          { type: "description" },
          { type: "screenshot", path: "/manual-screenshots/reports/report-audit.png" },
          { type: "paragraphs" },
          { type: "tips" },
        ],
      },
    ],
  },
];

// ─── Utility ────────────────────────────────────────────────────────────────
export function idToCamelKey(id: string): string {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
