import React from "react";
import { useTranslation } from "react-i18next";
import { ManualContentBlock } from "./userManualSections";
import { renderBold } from "./manualUtils";
import ManualPrerequisites from "./ManualPrerequisites";
import ManualWarning from "./ManualWarning";
import ManualScreenshot from "./ManualScreenshot";
import ManualSteps from "./ManualSteps";
import ManualFieldTable from "./ManualFieldTable";
import ManualRoleTable from "./ManualRoleTable";

interface Props {
  block: ManualContentBlock;
  sectionKey: string;
  sectionLabel: string;
}

const ManualBlockRenderer = ({ block, sectionKey, sectionLabel }: Props) => {
  const { t } = useTranslation("manual");

  switch (block.type) {
    case "description": {
      const text = t(`sections.${sectionKey}.description`, { defaultValue: "" });
      if (!text) return null;
      return <p className="text-muted lead">{renderBold(text)}</p>;
    }

    case "paragraphs": {
      const paragraphs = t(`sections.${sectionKey}.paragraphs`, {
        returnObjects: true,
        defaultValue: [],
      }) as string[];
      if (!paragraphs.length) return null;
      return (
        <>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-muted">{renderBold(p)}</p>
          ))}
        </>
      );
    }

    case "prerequisites":
      return <ManualPrerequisites sectionKey={sectionKey} />;

    case "steps":
      return <ManualSteps sectionKey={sectionKey} />;

    case "fieldTable":
      return <ManualFieldTable sectionKey={sectionKey} />;

    case "tips": {
      const tips = t(`sections.${sectionKey}.tips`, {
        returnObjects: true,
        defaultValue: [],
      }) as string[];
      if (!tips.length) return null;
      return (
        <div className="alert alert-info mt-3">
          <i className="ri-lightbulb-line me-2"></i>
          <strong>{t("labels.tipsLabel")}</strong>
          <ul className="mb-0 mt-1">
            {tips.map((tip, i) => (
              <li key={i}>{renderBold(tip)}</li>
            ))}
          </ul>
        </div>
      );
    }

    case "warning":
      return <ManualWarning sectionKey={sectionKey} />;

    case "screenshot":
      return (
        <ManualScreenshot
          path={block.path}
          alt={sectionLabel}
          captionKey={block.captionKey}
        />
      );

    case "roleTable":
      return <ManualRoleTable />;

    default:
      return null;
  }
};

export default ManualBlockRenderer;
