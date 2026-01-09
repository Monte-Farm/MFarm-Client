import { Card, CardHeader, CardBody, Button, Badge } from "reactstrap";
import {
    FiAlertCircle,
    FiEye,
    FiShield,
    FiCalendar,
    FiUser,
} from "react-icons/fi";

interface Props {
    plans: any[];
    onAdd: () => void;
    onViewDetails: (id: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
    piglet: "Lechón",
    sow: "Cerda",
    nursery: "Destete",
    grower: "Crecimiento",
    finisher: "Finalización",
};

const VaccinationPlansCard = ({
    plans,
    onAdd,
    onViewDetails,
}: Props) => {
    const hasData = plans && plans.length > 0;

    return (
        <Card className="w-100 flex-grow-1 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">
                    Planes de vacunación asignados
                </h5>

                <Button size="sm" color="primary" onClick={onAdd}>
                    Asignar plan
                </Button>
            </CardHeader>

            <CardBody
                className={
                    hasData
                        ? "d-flex flex-column gap-3"
                        : "d-flex justify-content-center align-items-center flex-column gap-2 text-center"
                }
                style={{ overflowY: "auto" }}
            >
                {!hasData ? (
                    <>
                        <FiAlertCircle size={32} className="text-muted" />
                        <span className="fs-5 text-muted">
                            No hay planes de vacunación asignados
                        </span>
                    </>
                ) : (
                    plans.map((p, index) => {
                        const date = new Date(p.applicationDate).toLocaleString("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                        });

                        const hasStage = Boolean(p.stage);

                        return (
                            <div
                                key={p._id || index}
                                className="border rounded p-3 position-relative"
                                style={{ backgroundColor: "#eef2ff" }}
                            >
                                {/* Ver detalles */}
                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => onViewDetails(p.planId._id)}
                                >
                                    <FiEye size={18} />
                                </Button>

                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiShield className="text-success" />
                                    <strong className="fs-5 pe-4">{p.name}</strong>
                                </div>

                                {/* Etapa (condicional) */}
                                {hasStage && (
                                    <div className="mb-2">
                                        <Badge color="info">
                                            {STAGE_LABELS[p.stage] ?? p.stage}
                                        </Badge>
                                    </div>
                                )}

                                {/* Meta info */}
                                <div className="d-flex justify-content-between flex-wrap gap-2 fs-6 text-muted mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiUser />
                                        {p.appliedBy
                                            ? `${p.appliedBy.name} ${p.appliedBy.lastname}`
                                            : "Desconocido"}
                                    </span>

                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        {date}
                                    </span>
                                </div>

                                {/* Observaciones */}
                                {p.observations && p.observations.trim() !== "" && (
                                    <div className="fs-6">
                                        <strong className="text-muted">Notas:</strong>{" "}
                                        {p.observations}
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

export default VaccinationPlansCard;
