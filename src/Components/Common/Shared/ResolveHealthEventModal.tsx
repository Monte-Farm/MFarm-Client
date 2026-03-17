import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge, Spinner } from "reactstrap";
import { FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";

interface ResolveHealthEventModalProps {
    isOpen: boolean;
    event: any | null;
    resolving: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: "Activo", color: "danger" },
    controlled: { label: "Controlado", color: "warning" },
    resolved: { label: "Resuelto", color: "success" },
};

const ResolveHealthEventModal = ({ isOpen, event, resolving, onConfirm, onCancel }: ResolveHealthEventModalProps) => {
    return (
        <Modal isOpen={isOpen} toggle={() => !resolving && onCancel()} centered>
            <ModalHeader toggle={() => !resolving && onCancel()}>
                Finalizar evento sanitario
            </ModalHeader>
            <ModalBody>
                {event && (
                    <div>
                        <p className="mb-3">
                            ¿Está seguro de marcar el evento <strong>{event.name}</strong> como <Badge color="success">Resuelto</Badge>?
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
                                <Badge color="success">Resuelto</Badge>
                            </div>
                            <div className="text-muted fs-6 d-flex align-items-center gap-1">
                                <FiCalendar />
                                Fecha de término: <strong>{new Date().toLocaleDateString("es-MX")}</strong>
                            </div>
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={onCancel} disabled={resolving}>
                    Cancelar
                </Button>
                <Button color="success" onClick={onConfirm} disabled={resolving}>
                    {resolving ? <Spinner size="sm" /> : (
                        <>
                            <FiCheckCircle className="me-1" />
                            Confirmar
                        </>
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ResolveHealthEventModal;
