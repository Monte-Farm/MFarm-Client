import React from "react";
import { useTranslation } from "react-i18next";
import { Table } from "reactstrap";
import { ManualFieldItem } from "./userManualSections";

interface Props {
  sectionKey: string;
}

const ManualFieldTable = ({ sectionKey }: Props) => {
  const { t } = useTranslation("manual");
  const fields = t(`sections.${sectionKey}.fields`, {
    returnObjects: true,
    defaultValue: [],
  }) as ManualFieldItem[];

  if (!fields.length) return null;

  return (
    <div className="manual-field-table mt-3 mb-3">
      <h6 className="fw-semibold mb-2">
        <i className="ri-edit-box-line me-2 text-primary"></i>
        {t("labels.fieldsTitle")}
      </h6>
      <div className="table-responsive">
        <Table bordered hover size="sm" className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ minWidth: 130 }}>{t("labels.fieldName")}</th>
              <th style={{ minWidth: 100 }}>{t("labels.fieldType")}</th>
              <th style={{ minWidth: 80 }} className="text-center">
                {t("labels.fieldRequired")}
              </th>
              <th>{t("labels.fieldDesc")}</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, i) => (
              <tr key={i}>
                <td className="fw-medium">{field.name}</td>
                <td>
                  <span className="badge bg-secondary-subtle text-secondary">
                    {field.type}
                  </span>
                </td>
                <td className="text-center">
                  {field.required ? (
                    <i className="ri-checkbox-circle-fill text-success fs-15"></i>
                  ) : (
                    <i className="ri-minus-line text-muted fs-15"></i>
                  )}
                </td>
                <td className="text-muted small">{field.desc}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default ManualFieldTable;
