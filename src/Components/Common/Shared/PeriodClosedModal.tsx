import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { onPeriodClosed, PeriodClosedEventPayload } from "utils/periodClosedEvents";

const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const PeriodClosedModal = () => {
    const [payload, setPayload] = useState<PeriodClosedEventPayload | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const off = onPeriodClosed((p) => setPayload(p));
        return () => { off(); };
    }, []);

    const close = () => setPayload(null);

    const goToClosing = () => {
        if (payload?.closingId) {
            navigate(`/finance/period-closing/${payload.closingId}`);
        }
        close();
    };

    if (!payload) return null;

    return (
        <Modal isOpen={true} toggle={close} centered size="md" backdrop="static">
            <ModalHeader toggle={close}>
                <i className="ri-lock-line me-2 text-warning" />
                Periodo cerrado
            </ModalHeader>
            <ModalBody>
                <Alert color="warning" className="d-flex align-items-start mb-3">
                    <i className="ri-error-warning-line me-2 fs-5 text-warning mt-1" />
                    <div>
                        <div className="fw-semibold mb-1">No se puede operar en este periodo</div>
                        <small>{payload.message}</small>
                    </div>
                </Alert>

                <div className="border rounded p-3 bg-light">
                    <div className="mb-2">
                        <span className="text-muted small">Periodo: </span>
                        <strong>{payload.periodLabel}</strong>
                    </div>
                    {payload.closedBy && (
                        <div className="mb-2">
                            <span className="text-muted small">Cerrado por: </span>
                            {payload.closedBy.name} {payload.closedBy.lastname}
                        </div>
                    )}
                    <div>
                        <span className="text-muted small">Fecha del cierre: </span>
                        {formatDateTime(payload.closedAt)}
                    </div>
                </div>

                <div className="mt-3 text-muted small">
                    Para editar datos de este periodo, un Superadmin debe <strong>reabrir el cierre</strong>,
                    aplicar los cambios y volver a cerrarlo.
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="light" onClick={close}>Entendido</Button>
                <Button color="primary" onClick={goToClosing}>
                    <i className="ri-eye-line me-1" />Ver cierre
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PeriodClosedModal;
