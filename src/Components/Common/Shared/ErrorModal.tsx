import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import ErrorImg from "../../../assets/images/error-modal.png"
import { wasPeriodClosedRecently } from "utils/periodClosedEvents";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const ErrorModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message }) => {
    const { t } = useTranslation();
    const [suppressed, setSuppressed] = useState(false);

    useEffect(() => {
        if (isOpen && wasPeriodClosedRecently()) {
            setSuppressed(true);
            onClose();
        } else if (!isOpen) {
            setSuppressed(false);
        }
    }, [isOpen, onClose]);

    if (suppressed) return null;

    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader></ModalHeader>
            <ModalBody className="d-flex flex-column align-items-center text-center">
                <img src={ErrorImg} alt="" style={{ height: "150px" }} />
                <h4 className="mt-4">{message}</h4>
            </ModalBody>
            <ModalFooter className="justify-content-center">
                <Button color="success" onClick={onClose}>{t("common.button.accept")}</Button>
            </ModalFooter>
        </Modal>

    )
};

export default ErrorModal;
