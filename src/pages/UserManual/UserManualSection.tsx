import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody } from "reactstrap";
import { ManualSection, idToCamelKey } from "./userManualSections";
import ManualBlockRenderer from "./ManualBlockRenderer";

interface Props {
  section: ManualSection;
}

const UserManualSection = ({ section }: Props) => {
  const { t } = useTranslation(["translation", "manual"]);
  const [lightboxView, setLightboxView] = useState(false);
  const [lightboxForm, setLightboxForm] = useState(false);

  const camelKey = idToCamelKey(section.id);
  const sectionLabel = t(section.labelKey);

  // ── New rich-content path ────────────────────────────────────────────────
  if (section.contentBlocks) {
    return (
      <div id={section.id} className="manual-section mb-5">
        <h4 className="manual-section-title border-bottom pb-2 mb-3">
          {sectionLabel}
        </h4>
        {section.contentBlocks.map((block, i) => (
          <ManualBlockRenderer
            key={i}
            block={block}
            sectionKey={camelKey}
            sectionLabel={sectionLabel}
          />
        ))}
      </div>
    );
  }

  // ── Legacy path (backward compatibility) ──────────────────────────────────
  const paragraphs = t(`manual.sections.${camelKey}.paragraphs`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];
  const tips = t(`manual.sections.${camelKey}.tips`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];
  const formParagraphs = t(`manual.sections.${camelKey}.formParagraphs`, {
    returnObjects: true,
    defaultValue: [],
  }) as string[];

  return (
    <div id={section.id} className="manual-section mb-5">
      <h4 className="manual-section-title border-bottom pb-2 mb-3">
        {sectionLabel}
      </h4>

      {paragraphs.map((p, i) => (
        <p key={i} className="text-muted">{p}</p>
      ))}

      {section.screenshotPath && (
        <div className="manual-screenshot-wrapper my-3">
          <img
            src={section.screenshotPath}
            alt={sectionLabel}
            loading="lazy"
            className="img-fluid rounded shadow-sm border"
            style={{ cursor: "zoom-in" }}
            onClick={() => setLightboxView(true)}
          />
          <small className="text-muted d-block mt-1">
            <i className="ri-zoom-in-line me-1"></i>
            {t("manual.clickToZoom")}
          </small>
        </div>
      )}

      {tips.length > 0 && (
        <div className="alert alert-info mt-3">
          <i className="ri-lightbulb-line me-2"></i>
          <strong>{t("manual.tipsLabel")}</strong>
          <ul className="mb-0 mt-1">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {section.screenshotFormPath && (
        <>
          <h5 className="mt-4 mb-2 fw-semibold">
            <i className="ri-edit-box-line me-2 text-primary"></i>
            {t("manual.howToRegister")}
          </h5>
          {formParagraphs.map((p, i) => (
            <p key={i} className="text-muted">{p}</p>
          ))}
          <div className="manual-screenshot-wrapper my-3">
            <img
              src={section.screenshotFormPath}
              alt={`${sectionLabel} - ${t("manual.howToRegister")}`}
              loading="lazy"
              className="img-fluid rounded shadow-sm border"
              style={{ cursor: "zoom-in" }}
              onClick={() => setLightboxForm(true)}
            />
            <small className="text-muted d-block mt-1">
              <i className="ri-zoom-in-line me-1"></i>
              {t("manual.clickToZoom")}
            </small>
          </div>
        </>
      )}

      {section.screenshotPath && (
        <Modal isOpen={lightboxView} toggle={() => setLightboxView(false)} size="xl" centered>
          <ModalBody className="p-1">
            <img
              src={section.screenshotPath}
              alt={sectionLabel}
              className="img-fluid w-100"
              style={{ cursor: "zoom-out" }}
              onClick={() => setLightboxView(false)}
            />
          </ModalBody>
        </Modal>
      )}

      {section.screenshotFormPath && (
        <Modal isOpen={lightboxForm} toggle={() => setLightboxForm(false)} size="xl" centered>
          <ModalBody className="p-1">
            <img
              src={section.screenshotFormPath}
              alt={`${sectionLabel} - ${t("manual.howToRegister")}`}
              className="img-fluid w-100"
              style={{ cursor: "zoom-out" }}
              onClick={() => setLightboxForm(false)}
            />
          </ModalBody>
        </Modal>
      )}
    </div>
  );
};

export default UserManualSection;
