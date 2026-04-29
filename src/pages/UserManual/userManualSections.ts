export interface ManualSection {
  id: string;
  labelKey: string;
  screenshotPath?: string;
  screenshotFormPath?: string;
}

export interface ManualCategory {
  id: string;
  labelKey: string;
  icon: string;
  sections: ManualSection[];
}

export const MANUAL_CATEGORIES: ManualCategory[] = [
  {
    id: "intro",
    labelKey: "manual.categories.intro",
    icon: "ri-information-line",
    sections: [
      { id: "overview", labelKey: "manual.sections.overview.title" },
      {
        id: "home",
        labelKey: "manual.sections.home.title",
        screenshotPath: "/manual-screenshots/home-dashboard.png",
      },
    ],
  },
  {
    id: "admin",
    labelKey: "manual.categories.admin",
    icon: "ri-community-line",
    sections: [
      {
        id: "farms",
        labelKey: "manual.sections.farms.title",
        screenshotPath: "/manual-screenshots/farms-view.png",
      },
      {
        id: "warehouse-inventory",
        labelKey: "manual.sections.warehouseInventory.title",
        screenshotPath: "/manual-screenshots/warehouse-inventory.png",
        screenshotFormPath: "/manual-screenshots/warehouse-inventory-form.png",
      },
      {
        id: "warehouse-suppliers",
        labelKey: "manual.sections.warehouseSuppliers.title",
        screenshotPath: "/manual-screenshots/warehouse-suppliers.png",
        screenshotFormPath: "/manual-screenshots/warehouse-suppliers-form.png",
      },
      {
        id: "warehouse-products",
        labelKey: "manual.sections.warehouseProducts.title",
        screenshotPath: "/manual-screenshots/warehouse-products.png",
        screenshotFormPath: "/manual-screenshots/warehouse-products-form.png",
      },
      {
        id: "warehouse-incomes",
        labelKey: "manual.sections.warehouseIncomes.title",
        screenshotPath: "/manual-screenshots/warehouse-incomes.png",
        screenshotFormPath: "/manual-screenshots/warehouse-inventory-form.png",
      },
      {
        id: "warehouse-outcomes",
        labelKey: "manual.sections.warehouseOutcomes.title",
        screenshotPath: "/manual-screenshots/warehouse-outcomes.png",
        screenshotFormPath: "/manual-screenshots/warehouse-outcomes-form.png",
      },
      {
        id: "purchase-orders",
        labelKey: "manual.sections.purchaseOrders.title",
        screenshotPath: "/manual-screenshots/purchase-orders.png",
        screenshotFormPath: "/manual-screenshots/purchase-orders-form.png",
      },
      {
        id: "subwarehouse",
        labelKey: "manual.sections.subwarehouse.title",
        screenshotPath: "/manual-screenshots/subwarehouse-view.png",
      },
      {
        id: "orders",
        labelKey: "manual.sections.orders.title",
        screenshotPath: "/manual-screenshots/orders-view.png",
      },
      {
        id: "sales",
        labelKey: "manual.sections.sales.title",
        screenshotPath: "/manual-screenshots/sales-view.png",
        screenshotFormPath: "/manual-screenshots/sales-form.png",
      },
      {
        id: "expenses",
        labelKey: "manual.sections.expenses.title",
        screenshotPath: "/manual-screenshots/expenses-view.png",
        screenshotFormPath: "/manual-screenshots/expenses-form.png",
      },
      {
        id: "period-closing",
        labelKey: "manual.sections.periodClosing.title",
        screenshotPath: "/manual-screenshots/period-closing.png",
      },
    ],
  },
  {
    id: "pigs",
    labelKey: "manual.categories.pigs",
    icon: "ri-database-2-line",
    sections: [
      {
        id: "pigs-view",
        labelKey: "manual.sections.pigsView.title",
        screenshotPath: "/manual-screenshots/pigs-inventory.png",
      },
      {
        id: "pigs-discarded",
        labelKey: "manual.sections.pigsDiscarded.title",
        screenshotPath: "/manual-screenshots/pigs-discarded.png",
      },
      {
        id: "groups",
        labelKey: "manual.sections.groups.title",
        screenshotPath: "/manual-screenshots/weaning-groups.png",
      },
    ],
  },
  {
    id: "operation",
    labelKey: "manual.categories.operation",
    icon: "ri-settings-4-line",
    sections: [
      {
        id: "replacement-sows",
        labelKey: "manual.sections.replacementSows.title",
        screenshotPath: "/manual-screenshots/replacement-sows.png",
      },
      {
        id: "replacement-boars",
        labelKey: "manual.sections.replacementBoars.title",
        screenshotPath: "/manual-screenshots/replacement-boars.png",
      },
      {
        id: "lab-extractions",
        labelKey: "manual.sections.labExtractions.title",
        screenshotPath: "/manual-screenshots/lab-extractions.png",
        screenshotFormPath: "/manual-screenshots/lab-extractions-form.png",
      },
      {
        id: "lab-samples",
        labelKey: "manual.sections.labSamples.title",
        screenshotPath: "/manual-screenshots/lab-samples.png",
        screenshotFormPath: "/manual-screenshots/lab-samples-form.png",
      },
      {
        id: "gestation-inseminations",
        labelKey: "manual.sections.gestationInseminations.title",
        screenshotPath: "/manual-screenshots/gestation-inseminations.png",
        screenshotFormPath: "/manual-screenshots/gestation-inseminations-form.png",
      },
      {
        id: "gestation-pregnancies",
        labelKey: "manual.sections.gestationPregnancies.title",
        screenshotPath: "/manual-screenshots/gestation-pregnancies.png",
      },
      {
        id: "births",
        labelKey: "manual.sections.births.title",
        screenshotPath: "/manual-screenshots/births-view.png",
        screenshotFormPath: "/manual-screenshots/births-form.png",
      },
      {
        id: "lactation",
        labelKey: "manual.sections.lactation.title",
        screenshotPath: "/manual-screenshots/lactation-litters.png",
      },
      {
        id: "weaning",
        labelKey: "manual.sections.weaning.title",
        screenshotPath: "/manual-screenshots/weaning-groups.png",
      },
      {
        id: "growing",
        labelKey: "manual.sections.growing.title",
        screenshotPath: "/manual-screenshots/growing-groups.png",
      },
    ],
  },
  {
    id: "health",
    labelKey: "manual.categories.health",
    icon: "mdi mdi-heart-pulse",
    sections: [
      {
        id: "medication",
        labelKey: "manual.sections.medication.title",
        screenshotPath: "/manual-screenshots/medication-packages.png",
        screenshotFormPath: "/manual-screenshots/medication-form.png",
      },
      {
        id: "feeding",
        labelKey: "manual.sections.feeding.title",
        screenshotPath: "/manual-screenshots/feeding-packages.png",
      },
    ],
  },
  {
    id: "reports",
    labelKey: "manual.categories.reports",
    icon: "ri-bar-chart-box-line",
    sections: [
      {
        id: "reports-production",
        labelKey: "manual.sections.reportsProduction.title",
        screenshotPath: "/manual-screenshots/reports-production.png",
      },
      {
        id: "reports-inventory",
        labelKey: "manual.sections.reportsInventory.title",
        screenshotPath: "/manual-screenshots/reports-inventory.png",
      },
      {
        id: "reports-finance",
        labelKey: "manual.sections.reportsFinance.title",
        screenshotPath: "/manual-screenshots/reports-finance.png",
      },
      {
        id: "reports-sales",
        labelKey: "manual.sections.reportsSales.title",
        screenshotPath: "/manual-screenshots/reports-sales.png",
      },
      {
        id: "reports-traceability",
        labelKey: "manual.sections.reportsTraceability.title",
        screenshotPath: "/manual-screenshots/reports-traceability.png",
      },
      {
        id: "reports-audit",
        labelKey: "manual.sections.reportsAudit.title",
        screenshotPath: "/manual-screenshots/reports-audit.png",
      },
    ],
  },
  {
    id: "config",
    labelKey: "manual.categories.config",
    icon: "mdi mdi-cog-outline",
    sections: [
      {
        id: "users",
        labelKey: "manual.sections.users.title",
        screenshotPath: "/manual-screenshots/users-view.png",
        screenshotFormPath: "/manual-screenshots/users-form.png",
      },
      {
        id: "configurations",
        labelKey: "manual.sections.configurations.title",
        screenshotPath: "/manual-screenshots/configurations.png",
      },
    ],
  },
];

export function idToCamelKey(id: string): string {
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
