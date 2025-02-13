import { useEffect } from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import ErrorImg from "../../assets/images/error-modal.png"

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const ErrorModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message }) => {
    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader></ModalHeader>
            <ModalBody className="d-flex flex-column align-items-center text-center">
                <img src={ErrorImg} alt="Error" style={{ height: "150px" }} />
                <h4 className="mt-4">{message}</h4>
            </ModalBody>
            <ModalFooter className="justify-content-center">
                <Button color="success" onClick={onClose}>Aceptar</Button>
            </ModalFooter>
        </Modal>

    )
};

export default ErrorModal;
