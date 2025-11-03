import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SuccessImg from "../../../assets/images/success-modal.webp"

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message }) => {
    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader></ModalHeader>
            <ModalBody className="d-flex flex-column align-items-center text-center">
                <img src={SuccessImg} alt="Registro exitoso" style={{ height: "150px" }} />
                <h4 className="mt-3">{message}</h4>
            </ModalBody>
            <ModalFooter className="justify-content-center">
                <Button color="success" onClick={onClose}>Aceptar</Button>
            </ModalFooter>
        </Modal>

    )
};

export default SuccessModal;
