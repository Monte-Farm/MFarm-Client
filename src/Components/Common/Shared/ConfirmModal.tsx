import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    confirmColor = "primary",
    loading = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal isOpen={isOpen} toggle={onCancel} centered>
            <ModalHeader toggle={onCancel}>{title}</ModalHeader>
            <ModalBody>{message}</ModalBody>
            <ModalFooter>
                <Button color="light" onClick={onCancel} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    {confirmLabel}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmModal;
