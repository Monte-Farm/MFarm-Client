import { useTranslation } from "react-i18next";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import WarningImg from "../../../assets/images/error-modal.png";

interface MissingStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingItems: Array<{
        product: string;
        required: number;
        available: number;
    }>;
}

const MissingStockModal: React.FC<MissingStockModalProps> = ({ isOpen, onClose, missingItems }) => {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} backdrop="static" keyboard={false} centered>
            <ModalHeader></ModalHeader>

            <ModalBody className="d-flex flex-column align-items-center text-center">
                <img src={WarningImg} alt="" style={{ height: "140px" }} />

                <h4 className="mt-4 fw-bold" style={{ color: "#b30000" }}>
                    {t("shared.missingStock.title")}
                </h4>

                <p className="mt-2 text-muted" style={{ fontSize: "14px", maxWidth: "300px" }}>
                    {t("shared.missingStock.message")}
                </p>

                <div
                    className="w-100 mt-3"
                    style={{
                        maxHeight: "180px",
                        overflowY: "auto",
                        borderRadius: "10px",
                        padding: "10px 15px",
                        background: "#f9f9f9",
                        border: "1px solid #ddd"
                    }}
                >
                    {missingItems.map((item, index) => (
                        <div
                            key={index}
                            className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            style={{ fontSize: "14px" }}
                        >
                            <span className="fw-semibold">{item.product}</span>
                            <span style={{ color: "#b30000" }}>
                                {item.available}/{item.required}
                            </span>
                        </div>
                    ))}
                </div>
            </ModalBody>

            <ModalFooter className="justify-content-center">
                <Button color="danger" onClick={onClose} style={{ padding: "8px 30px" }}>
                    {t("common.button.close")}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default MissingStockModal;