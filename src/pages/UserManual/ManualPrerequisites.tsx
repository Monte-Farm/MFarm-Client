import React from "react";
import { useTranslation } from "react-i18next";
import { renderBold } from "./manualUtils";

interface Props {
  sectionKey: string;
}

const ManualPrerequisites = ({ sectionKey }: Props) => {
  const { t } = useTranslation("manual");
  const items = t(`sections.${sectionKey}.prerequisites`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  if (!items.length) return null;

  return (
    <div className="manual-prerequisites alert alert-warning mt-3 mb-3">
      <div className="d-flex align-items-center mb-2">
        <i className="ri-error-warning-line fs-16 me-2"></i>
        <strong>{t("labels.prerequisites")}</strong>
      </div>
      <ul className="mb-0 ps-3">
        {items.map((item, i) => (
          <li key={i}>{renderBold(item)}</li>
        ))}
      </ul>
    </div>
  );
};

export default ManualPrerequisites;
