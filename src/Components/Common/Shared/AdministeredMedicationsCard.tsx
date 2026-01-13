import { Card, CardHeader, CardBody, Button, Badge } from "reactstrap";
import { FiAlertCircle, FiDroplet, FiCalendar, FiUser } from "react-icons/fi";

interface Props {
    medications: any[];
    onAdd: () => void;
    status?: string;
}

const ROUTE_LABELS: Record<string, string> = {
    oral: "Oral",
    intramuscular: "Intramuscular",
    subcutaneous: "Subcutánea",
    intravenous: "Intravenosa",
    intranasal: "Intranasal",
    topical: "Tópica",
    rectal: "Rectal",
};

const AdministeredMedicationsCard = ({ medications, onAdd, status }: Props) => {
    const hasData = medications && medications.length > 0;

    return (
        <Card className="w-100 flex-grow-1 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">Medicamentos administrados</h5>

                <Button size="sm" color="primary" onClick={onAdd} disabled={status === 'weaned'}>
                    Administrar medicamento
                </Button>
            </CardHeader>

            <CardBody
                className={
                    hasData
                        ? "d-flex flex-column gap-3 flex-grow-1 overflow-auto"
                        : "d-flex flex-column justify-content-center align-items-center gap-2 text-center"
                }
                style={{ overflowY: "auto" }}
            >
                {!hasData ? (
                    <>
                        <FiAlertCircle size={32} className="text-muted" />
                        <span className="fs-5 text-muted">
                            No hay medicamentos administrados
                        </span>
                    </>
                ) : (
                    medications.map((m, index) => {
                        const date = new Date(m.applicationDate).toLocaleString("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                        });

                        return (
                            <div
                                key={m._id || index}
                                className="border rounded p-3 bg-light-subtle"
                            >
                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiDroplet className="text-primary" />
                                    <strong className="fs-5">
                                        {m.medication.name}
                                    </strong>
                                </div>

                                {/* Badges */}
                                <div className="d-flex gap-2 flex-wrap mb-2 fs-5">
                                    <Badge color="info">
                                        {ROUTE_LABELS[m.administrationRoute] ??
                                            m.administrationRoute}
                                    </Badge>
                                    <Badge color="secondary">
                                        {m.medication.unit_measurement}
                                    </Badge>
                                </div>

                                {/* Dosis */}
                                <div className="d-flex justify-content-between flex-wrap fs-6 mb-2">
                                    <span>
                                        <strong className="text-muted">Dosis total:</strong>{" "}
                                        {m.totalDose} {m.medication.unit_measurement}
                                    </span>

                                    <span>
                                        <strong className="text-muted">Por cerdo:</strong>{" "}
                                        {m.dosePerPig} {m.medication.unit_measurement}
                                    </span>
                                </div>

                                {/* Aplicación */}
                                <div className="d-flex justify-content-between flex-wrap fs-6 text-muted mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiUser />
                                        {m.appliedBy
                                            ? `${m.appliedBy.name} ${m.appliedBy.lastname}`
                                            : "Desconocido"}
                                    </span>

                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        {date}
                                    </span>
                                </div>

                                {/* Observaciones */}
                                {m.observations && m.observations.trim() !== "" && (
                                    <div className="fs-6">
                                        <strong className="text-muted">Notas:</strong>{" "}
                                        {m.observations}
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

export default AdministeredMedicationsCard;
