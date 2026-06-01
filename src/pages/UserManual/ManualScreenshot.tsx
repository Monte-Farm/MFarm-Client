import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody } from "reactstrap";

interface Props {
  path: string;
  alt?: string;
  captionKey?: string;
}

const ManualScreenshot = ({ path, alt = "", captionKey }: Props) => {
  const { t } = useTranslation("manual");
  const [lightbox, setLightbox] = useState(false);
  const caption = captionKey ? t(captionKey) : t("labels.clickToZoom");

  return (
    <div className="manual-screenshot-wrapper my-3">
      <img
        src={path}
        alt={alt}
        loading="lazy"
        className="img-fluid rounded shadow-sm border"
        style={{ cursor: "zoom-in" }}
        onClick={() => setLightbox(true)}
      />
      <small className="text-muted d-block mt-1">
        <i className="ri-zoom-in-line me-1"></i>
        {caption}
      </small>

      <Modal isOpen={lightbox} toggle={() => setLightbox(false)} size="xl" centered>
        <ModalBody className="p-1">
          <img
            src={path}
            alt={alt}
            className="img-fluid w-100"
            style={{ cursor: "zoom-out" }}
            onClick={() => setLightbox(false)}
          />
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ManualScreenshot;
