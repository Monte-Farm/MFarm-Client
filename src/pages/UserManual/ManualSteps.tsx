import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody } from "reactstrap";
import { ManualStepItem } from "./userManualSections";
import { renderBold } from "./manualUtils";

interface Props {
  sectionKey: string;
}

const ManualSteps = ({ sectionKey }: Props) => {
  const { t } = useTranslation("manual");
  const steps = t(`sections.${sectionKey}.steps`, {
    returnObjects: true,
    defaultValue: [],
  }) as ManualStepItem[];

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!steps.length) return null;

  return (
    <div className="manual-steps mt-3 mb-3">
      <h6 className="manual-steps-title fw-semibold mb-3">
        <i className="ri-list-ordered me-2 text-primary"></i>
        {t("labels.stepsTitle")}
      </h6>
      <ol className="manual-steps-list ps-0">
        {steps.map((step, i) => (
          <li key={i} className="manual-step-item">
            <div className="manual-step-number">{i + 1}</div>
            <div className="manual-step-body">
              {step.title && (
                <p className="manual-step-title fw-semibold mb-1">{renderBold(step.title)}</p>
              )}
              <p className="text-muted mb-2">{renderBold(step.desc)}</p>
              {step.screenshot && (
                <>
                  <div className="manual-screenshot-wrapper mb-2">
                    <img
                      src={step.screenshot}
                      alt={step.title || `Paso ${i + 1}`}
                      loading="lazy"
                      className="img-fluid rounded shadow-sm border"
                      style={{ cursor: "zoom-in", maxWidth: "100%" }}
                      onClick={() => setLightboxIdx(i)}
                    />
                    <small className="text-muted d-block mt-1">
                      <i className="ri-zoom-in-line me-1"></i>
                      {t("labels.clickToZoom")}
                    </small>
                  </div>
                  <Modal
                    isOpen={lightboxIdx === i}
                    toggle={() => setLightboxIdx(null)}
                    size="xl"
                    centered
                  >
                    <ModalBody className="p-1">
                      <img
                        src={step.screenshot}
                        alt={step.title || `Paso ${i + 1}`}
                        className="img-fluid w-100"
                        style={{ cursor: "zoom-out" }}
                        onClick={() => setLightboxIdx(null)}
                      />
                    </ModalBody>
                  </Modal>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ManualSteps;
