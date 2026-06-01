import React from "react";
import { useTranslation } from "react-i18next";
import { Table } from "reactstrap";

// Role access matrix — derived from LayoutMenuData.tsx
// Each entry: [moduleKey, superadmin, farm_manager, finance_manager, warehouse_manager, subwarehouse_manager, repro_tech, veterinarian, general_worker]
const ROLE_MATRIX: [string, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean][] = [
  ["roleMatrix.home",            true,  true,  true,  true,  true,  true,  true,  true],
  ["roleMatrix.farms",           true,  false, false, false, false, false, false, false],
  ["roleMatrix.users",           true,  false, false, false, false, false, false, false],
  ["roleMatrix.configGlobal",    true,  false, false, false, false, false, false, false],
  ["roleMatrix.configFarm",      false, true,  false, false, false, false, false, false],
  ["roleMatrix.warehouse",       false, true,  true,  true,  false, false, false, false],
  ["roleMatrix.productCatalog",  false, true,  false, false, false, false, false, false],
  ["roleMatrix.subwarehouse",    false, true,  false, true,  true,  false, false, false],
  ["roleMatrix.orders",          false, false, false, true,  true,  false, false, false],
  ["roleMatrix.sales",           false, true,  true,  false, false, false, false, false],
  ["roleMatrix.expenses",        false, true,  true,  false, false, false, false, false],
  ["roleMatrix.periodClosing",   true,  true,  true,  false, false, false, false, false],
  ["roleMatrix.pigs",            false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.replacement",     false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.reproduction",    false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.births",          false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.lactation",       false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.groups",          false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.health",          false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.feeding",         false, true,  false, false, false, true,  true,  true],
  ["roleMatrix.reports",         true,  true,  true,  true,  false, false, false, false],
];

const ROLES = [
  "superadmin",
  "farmManager",
  "financeManager",
  "warehouseManager",
  "subwarehouseManager",
  "reproTech",
  "veterinarian",
  "generalWorker",
];

const ManualRoleTable = () => {
  const { t } = useTranslation("manual");

  return (
    <div className="manual-role-table mt-3 mb-3">
      <div className="table-responsive">
        <Table bordered size="sm" className="align-middle mb-0 manual-role-matrix">
          <thead className="table-dark">
            <tr>
              <th style={{ minWidth: 160 }}>{t("labels.module")}</th>
              {ROLES.map((role) => (
                <th key={role} className="text-center" style={{ minWidth: 80, fontSize: "0.75rem" }}>
                  {t(`roles.${role}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_MATRIX.map(([moduleKey, ...access]) => (
              <tr key={moduleKey}>
                <td className="fw-medium small">{t(moduleKey)}</td>
                {access.map((allowed, idx) => (
                  <td key={idx} className="text-center">
                    {allowed ? (
                      <i className="ri-checkbox-circle-fill text-success fs-15"></i>
                    ) : (
                      <i className="ri-close-circle-line text-muted fs-15"></i>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ManualRoleTable;
