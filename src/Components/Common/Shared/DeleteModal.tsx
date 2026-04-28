import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalBody } from "reactstrap";

interface DeleteModalProps {
  show ?: boolean;
  onDeleteClick ?: () => void;
  onCloseClick ?: () => void;
  recordId ?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ show, onDeleteClick, onCloseClick, recordId }) => {
  const { t } = useTranslation();
  return (
    <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-3 px-5">
        <div className="mt-2 text-center">
          <i className="ri-delete-bin-line display-5 text-danger"></i>
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>{t("shared.deleteModal.title")}</h4>
            <p className="text-muted mx-4 mb-0">
              {t("shared.deleteModal.message")} {recordId ? recordId : ""}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <button
            type="button"
            className="btn w-sm btn-light"
            data-bs-dismiss="modal"
            onClick={onCloseClick}
          >
            {t("common.button.close")}
          </button>
          <button
            type="button"
            className="btn w-sm btn-danger "
            id="delete-record"
            onClick={onDeleteClick}
          >
            {t("shared.deleteModal.btnDelete")}
          </button>
        </div>
      </ModalBody>
    </Modal>
  ) as unknown as JSX.Element;
};

export default DeleteModal;
