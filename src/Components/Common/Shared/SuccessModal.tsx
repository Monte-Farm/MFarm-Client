import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SuccessImg from "../../../assets/images/success-modal.webp"

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    onGeneratePdf?: () => void;
    pdfLoading?: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, onGeneratePdf, pdfLoading }) => {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader></ModalHeader>
            <ModalBody className="d-flex flex-column align-items-center text-center">
                <img src={SuccessImg} alt="" style={{ height: "150px" }} />
                <h4 className="mt-3">{message}</h4>
            </ModalBody>
            <ModalFooter className="justify-content-center">
                {onGeneratePdf && (
                    <Button color="primary" onClick={onGeneratePdf} disabled={pdfLoading}>
                        {pdfLoading ? <><span className="spinner-border spinner-border-sm me-2" />{t("common.button.generating", { defaultValue: "Generando..." })}</> : <><i className="ri-file-pdf-line me-2"></i>{t("common.button.generatePdf", { defaultValue: "Generar PDF" })}</>}
                    </Button>
                )}
                <Button color="success" onClick={onClose}>{t("common.button.accept")}</Button>
            </ModalFooter>
        </Modal>
    )
};

export default SuccessModal;
