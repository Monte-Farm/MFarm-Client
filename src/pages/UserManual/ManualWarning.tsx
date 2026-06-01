import React from "react";
import { useTranslation } from "react-i18next";
import { renderBold } from "./manualUtils";

interface Props {
  sectionKey: string;
}

const ManualWarning = ({ sectionKey }: Props) => {
  const { t } = useTranslation("manual");
  const text = t(`sections.${sectionKey}.warning`, { defaultValue: "" });

  if (!text) return null;

  return (
    <div className="manual-warning alert alert-danger mt-3">
      <i className="ri-forbid-line me-2"></i>
      {renderBold(text)}
    </div>
  );
};

export default ManualWarning;
