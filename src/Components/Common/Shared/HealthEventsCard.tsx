import { Card, CardBody, CardHeader, Button, Badge } from "reactstrap";
import { FiAlertCircle, FiEye, FiActivity, FiCalendar } from "react-icons/fi";

interface Props {
    events: any[];
    onAdd: () => void;
    onViewDetails: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: "Activo", color: "danger" },
    controlled: { label: "Controlado", color: "warning" },
    resolved: { label: "Resuelto", color: "success" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: "Baja", color: "success" },
    medium: { label: "Media", color: "warning" },
    high: { label: "Alta", color: "danger" },
};

const SYMPTOM_LABELS: Record<string, string> = {
    diarrhea: "Diarrea",
    bloody_diarrhea: "Diarrea con sangre",
    fever: "Fiebre",
    vomiting: "Vómito",
    lethargy: "Letargo",
};

const HealthEventsCard = ({ events, onAdd, onViewDetails }: Props) => {
    const hasEvents = events && events.length > 0;

    return (
        <Card className="w-100 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">Eventos sanitarios</h5>

                <Button size="sm" color="primary" onClick={onAdd}>
                    Registrar evento
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
                            No hay eventos sanitarios registrados
                        </span>
                    </>
                ) : (
                    events.map((e, index) => {
                        const startDate = new Date(e.startDate).toLocaleDateString("es-MX");
                        const endDate = e.endDate
                            ? new Date(e.endDate).toLocaleDateString("es-MX")
                            : "En curso";

                        const status = STATUS_CONFIG[e.status];
                        const severity = SEVERITY_CONFIG[e.severity];

                        return (
                            <div
                                key={e._id || index}
                                className="border rounded p-3 position-relative bg-light-subtle"
                            >
                                {/* Ver detalles */}
                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => onViewDetails(e._id)}
                                >
                                    <FiEye size={18} />
                                </Button>

                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiActivity className="text-primary" />
                                    <strong className="fs-5 pe-4">{e.name}</strong>
                                </div>

                                {/* Badges */}
                                <div className="d-flex gap-2 flex-wrap mb-2 fs-5">
                                    {status && (
                                        <Badge color={status.color}>{status.label}</Badge>
                                    )}
                                    {severity && (
                                        <Badge color={severity.color}>
                                            Severidad {severity.label}
                                        </Badge>
                                    )}
                                    <Badge color="secondary">
                                        {e.scope?.type === "total"
                                            ? "Todo el grupo"
                                            : `Parcial (${e.scope?.affectedCount})`}
                                    </Badge>
                                </div>

                                {/* Fechas */}
                                <div className="d-flex gap-4 flex-wrap text-muted fs-6 mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        Inicio: {startDate}
                                    </span>
                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        Fin: {endDate}
                                    </span>
                                </div>

                                {/* Síntomas */}
                                {e.symptoms?.length > 0 && (
                                    <div className="fs-6 mb-1">
                                        <strong className="text-muted">Síntomas:</strong>{" "}
                                        {e.symptoms
                                            .map((s: string) => SYMPTOM_LABELS[s] || s)
                                            .join(", ")}
                                    </div>
                                )}

                                {/* Tratamientos */}
                                {e.treatments?.length > 0 && (
                                    <div className="fs-6 mb-1">
                                        <strong className="text-muted">Tratamientos:</strong>{" "}
                                        {e.treatments.length} registrados
                                    </div>
                                )}

                                {/* Detectado por */}
                                <div className="fs-6 text-muted">
                                    Detectado por{" "}
                                    <strong>
                                        {e.detectedBy
                                            ? `${e.detectedBy.name} ${e.detectedBy.lastname}`
                                            : "N/A"}
                                    </strong>
                                </div>

                                {/* Observaciones */}
                                {e.observations && e.observations.trim() !== "" && (
                                    <div className="mt-2 fs-6">
                                        <strong className="text-muted">Notas:</strong>{" "}
                                        {e.observations}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </CardBody>
        </Card>
    );
};

export default HealthEventsCard;
