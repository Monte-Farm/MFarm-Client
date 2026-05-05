import { logger } from 'utils/logger';
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Button, Badge } from "reactstrap";
import { FiAlertCircle, FiEye, FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";
import ResolveHealthEventModal from "./ResolveHealthEventModal";
import AlertMessage from "./AlertMesagge";

interface Props {
    events: any[];
    onAdd: () => void;
    onViewDetails: (id: string) => void;
    onResolve: (eventId: string, endDate: Date) => Promise<void>;
    disabled?: boolean;
}

const HealthEventsCard = ({ events, onAdd, onViewDetails, onResolve, disabled = false }: Props) => {
    const { t } = useTranslation();
    const hasEvents = events && events.length > 0;
    const [resolveModal, setResolveModal] = useState<{ open: boolean; event: any | null }>({ open: false, event: null });
    const [resolving, setResolving] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        active: { label: t("shared.healthEvent.status.active"), color: "danger" },
        controlled: { label: t("shared.healthEvent.status.controlled"), color: "warning" },
        resolved: { label: t("shared.healthEvent.status.resolved"), color: "success" },
    };

    const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
        low: { label: t("shared.healthEvent.severity.low"), color: "success" },
        medium: { label: t("shared.healthEvent.severity.medium"), color: "warning" },
        high: { label: t("shared.healthEvent.severity.high"), color: "danger" },
    };

    const handleResolve = async () => {
        if (!resolveModal.event) return;
        try {
            setResolving(true);
            await onResolve(resolveModal.event._id, new Date());
            setResolveModal({ open: false, event: null });
            setAlertConfig({ visible: true, color: "success", message: t("shared.healthEvent.card.success") });
        } catch (error) {
            logger.error('Error al finalizar evento:', error);
            setAlertConfig({ visible: true, color: "danger", message: t("shared.healthEvent.card.error") });
        } finally {
            setResolving(false);
        }
    };

    return (
        <>
            <Card className="w-100 h-100 m-0">
                <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                    <h5 className="mb-0 fw-semibold">{t("shared.healthEvent.card.title")}</h5>

                    <Button size="sm" color="primary" onClick={onAdd} disabled={disabled}>
                        {t("shared.healthEvent.card.register")}
                    </Button>
                </CardHeader>

                <CardBody
                    className={
                        hasEvents
                            ? "d-flex flex-column gap-3 flex-grow-1 overflow-auto"
                            : "d-flex flex-column justify-content-center align-items-center gap-2 text-center"
                    }
                    style={{ overflowY: "auto" }}
                >
                    {!hasEvents ? (
                        <>
                            <FiAlertCircle size={36} className="text-muted" />
                            <span className="fs-5 text-muted">
                                {t("shared.healthEvent.card.empty")}
                            </span>
                        </>
                    ) : (
                        events.map((e, index) => {
                            const startDate = new Date(e.startDate).toLocaleDateString();
                            const endDate = e.endDate
                                ? new Date(e.endDate).toLocaleDateString()
                                : t("shared.healthEvent.card.onGoing");

                            const status = STATUS_CONFIG[e.status];
                            const severity = SEVERITY_CONFIG[e.severity];

                            return (
                                <div
                                    key={e._id || index}
                                    className="border rounded p-3 position-relative bg-light-subtle"
                                >
                                    <div className="position-absolute top-0 end-0 m-2 d-flex gap-1">
                                        {(e.status === 'active' || e.status === 'controlled') && (
                                            <Button
                                                size="sm"
                                                color="success"
                                                outline
                                                title={t("shared.healthEvent.card.resolve")}
                                                onClick={() => setResolveModal({ open: true, event: e })}
                                            >
                                                <FiCheckCircle size={16} />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            color="link"
                                            title={t("common.button.viewDetails")}
                                            onClick={() => onViewDetails(e._id)}
                                        >
                                            <FiEye size={18} />
                                        </Button>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <FiActivity className="text-primary" />
                                        <strong className="fs-5 pe-4">{e.name}</strong>
                                    </div>

                                    <div className="d-flex gap-2 flex-wrap mb-2 fs-5">
                                        {status && (
                                            <Badge color={status.color}>{status.label}</Badge>
                                        )}
                                        {severity && (
                                            <Badge color={severity.color}>
                                                {t("shared.healthEvent.card.severity", { level: severity.label })}
                                            </Badge>
                                        )}
                                        <Badge color="secondary">
                                            {e.scope?.type === "total"
                                                ? t("shared.healthEvent.card.scopeTotal")
                                                : t("shared.healthEvent.card.scopePartial", { count: e.scope?.affectedCount })}
                                        </Badge>
                                    </div>

                                    <div className="d-flex gap-4 flex-wrap text-muted fs-6 mb-2">
                                        <span className="d-flex align-items-center gap-1">
                                            <FiCalendar />
                                            {t("shared.healthEvent.card.dateStart")} {startDate}
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FiCalendar />
                                            {t("shared.healthEvent.card.dateEnd")} {endDate}
                                        </span>
                                    </div>

                                    {e.treatments?.length > 0 && (
                                        <div className="fs-6 mb-1">
                                            <strong className="text-muted">{t("shared.healthEvent.card.treatments")}</strong>{" "}
                                            {t("shared.healthEvent.card.treatmentCount", { count: e.treatments.length })}
                                        </div>
                                    )}

                                    <div className="fs-6 text-muted">
                                        {t("shared.healthEvent.card.detectedBy")}{" "}
                                        <strong>
                                            {e.detectedBy
                                                ? `${e.detectedBy.name} ${e.detectedBy.lastname}`
                                                : "N/A"}
                                        </strong>
                                    </div>

                                    {e.observations && e.observations.trim() !== "" && (
                                        <div className="mt-2 fs-6">
                                            <strong className="text-muted">{t("shared.healthEvent.card.notes")}</strong>{" "}
                                            {e.observations}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </CardBody>
            </Card>
            <ResolveHealthEventModal
                isOpen={resolveModal.open}
                event={resolveModal.event}
                resolving={resolving}
                onConfirm={handleResolve}
                onCancel={() => setResolveModal({ open: false, event: null })}
            />

        </>
    );
};

export default HealthEventsCard;
