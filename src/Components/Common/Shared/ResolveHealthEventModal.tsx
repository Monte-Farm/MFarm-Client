import { useTranslation } from "react-i18next";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge, Spinner } from "reactstrap";
import { FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";

interface ResolveHealthEventModalProps {
    isOpen: boolean;
    event: any | null;
    resolving: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ResolveHealthEventModal = ({ isOpen, event, resolving, onConfirm, onCancel }: ResolveHealthEventModalProps) => {
    const { t } = useTranslation();

    const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        active: { label: t("shared.healthEvent.status.active"), color: "danger" },
        controlled: { label: t("shared.healthEvent.status.controlled"), color: "warning" },
        resolved: { label: t("shared.healthEvent.status.resolved"), color: "success" },
    };

    return (
        <Modal isOpen={isOpen} toggle={() => !resolving && onCancel()} centered>
            <ModalHeader toggle={() => !resolving && onCancel()}>
                {t("shared.healthEvent.resolve.title")}
            </ModalHeader>
            <ModalBody>
                {event && (
                    <div>
                        <p className="mb-3">
                            {t("shared.healthEvent.resolve.confirm", { name: event.name })} <Badge color="success">{t("shared.healthEvent.resolve.resolved")}</Badge>
                        </p>
                        <div className="border rounded p-3 bg-light">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <FiActivity className="text-primary" />
                                <strong>{event.name}</strong>
                            </div>
                            <div className="d-flex gap-2 flex-wrap mb-2">
                                <Badge color={STATUS_CONFIG[event.status]?.color}>
                                    {STATUS_CONFIG[event.status]?.label}
                                </Badge>
                                <span className="text-muted">→</span>
                                <Badge color="success">{t("shared.healthEvent.resolve.resolved")}</Badge>
                            </div>
                            <div className="text-muted fs-6 d-flex align-items-center gap-1">
                                <FiCalendar />
                                {t("shared.healthEvent.resolve.endDate")} <strong>{new Date().toLocaleDateString()}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={onCancel} disabled={resolving}>
                    {t("common.button.cancel")}
                </Button>
                <Button color="success" onClick={onConfirm} disabled={resolving}>
                    {resolving ? <Spinner size="sm" /> : (
                        <>
                            <FiCheckCircle className="me-1" />
                            {t("common.button.confirm")}
                        </>
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ResolveHealthEventModal;
