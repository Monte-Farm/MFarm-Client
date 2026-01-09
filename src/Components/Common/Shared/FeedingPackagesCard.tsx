import { Card, CardBody, CardHeader, Button, Badge } from "reactstrap";
import { FiAlertCircle, FiEye, FiCalendar, FiBox } from "react-icons/fi";

interface Props {
    packages: any[];
    onAdd: () => void;
    onViewDetails: (id: string) => void;
    onDiscountStock: (id: string) => void;
    onUnassign: (id: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
    piglet: "Lechón",
    sow: "Cerda",
    nursery: "Destete",
    grower: "Crecimiento",
    finisher: "Finalización",
};

const PERIODICITY_LABELS: Record<string, string> = {
    once_day: "1 vez al día",
    twice_day: "2 veces al día",
    three_times_day: "3 veces al día",
    ad_libitum: "Libre acceso",
    weekly: "1 vez a la semana",
    biweekly: "2 veces a la semana",
    montly: "Mensual",
    specific_days: "Días específicos",
    by_event: "Por evento",
};

const FeedingPackagesCard = ({
    packages,
    onAdd,
    onViewDetails,
    onDiscountStock,
    onUnassign,
}: Props) => {
    const hasPackages = packages && packages.length > 0;

    return (
        <Card className="w-100 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">
                    Paquetes de alimentación administrados
                </h5>

                <Button size="sm" color="primary" onClick={onAdd}>
                    Asignar paquete
                </Button>
            </CardHeader>

            <CardBody
                className={
                    hasPackages
                        ? "d-flex flex-column gap-3 flex-grow-1 overflow-auto"
                        : "d-flex flex-column justify-content-center align-items-center gap-2 text-center"
                }
            >
                {!hasPackages ? (
                    <>
                        <FiAlertCircle size={36} className="text-muted" />
                        <span className="fs-5 text-muted">
                            No hay paquetes administrados
                        </span>
                    </>
                ) : (
                    packages.map((p, index) => {
                        const date = new Date(p.applicationDate).toLocaleString(
                            "es-MX",
                            {
                                dateStyle: "short",
                                timeStyle: "short",
                            }
                        );

                        return (
                            <div
                                key={p._id || index}
                                className="border rounded p-3 position-relative bg-light-subtle"
                            >
                                {/* Acciones */}
                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => onViewDetails(p.packageId?._id)}
                                >
                                    <FiEye size={18} />
                                </Button>

                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 mt-2 me-5"
                                    disabled={!p.isActive}
                                    onClick={() =>
                                        onDiscountStock(p.packageId?._id)
                                    }
                                >
                                    <i className="bx bx-trending-down fs-5" />
                                </Button>

                                {p.isActive && (
                                    <Button
                                        size="sm"
                                        color="link"
                                        className="position-absolute top-0 end-0 mt-2 me-10 text-danger"
                                        onClick={() => onUnassign(p._id)}
                                        style={{ marginRight: "4.5rem" }}
                                    >
                                        <i className="ri-forbid-line fs-5" />
                                    </Button>
                                )}

                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiBox className="text-primary" />
                                    <strong className="fs-5 pe-5">
                                        {p.name}
                                    </strong>
                                </div>

                                {/* Badges */}
                                <div className="d-flex gap-2 flex-wrap mb-2 fs-5">
                                    {p.stage && (
                                        <Badge color="secondary">
                                            {STAGE_LABELS[p.stage] ?? p.stage}
                                        </Badge>
                                    )}

                                    <Badge color="info">
                                        {PERIODICITY_LABELS[p.periodicity] ??
                                            p.periodicity}
                                    </Badge>

                                    {!p.isActive && (
                                        <Badge color="danger">Inactivo</Badge>
                                    )}
                                </div>

                                {/* Fecha */}
                                <div className="d-flex align-items-center gap-1 text-muted fs-6 mb-2">
                                    <FiCalendar />
                                    {date}
                                </div>

                                {/* Aplicado por */}
                                <div className="fs-6 text-muted">
                                    Aplicado por{" "}
                                    <strong>
                                        {p.appliedBy
                                            ? `${p.appliedBy.name} ${p.appliedBy.lastname}`
                                            : "Desconocido"}
                                    </strong>
                                </div>

                                {/* Observaciones */}
                                {p.observations?.trim() && (
                                    <div className="mt-2 fs-6">
                                        <strong className="text-muted">
                                            Notas:
                                        </strong>{" "}
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

export default FeedingPackagesCard;
