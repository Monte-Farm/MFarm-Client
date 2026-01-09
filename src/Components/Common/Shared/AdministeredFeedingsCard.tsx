import { Card, CardBody, CardHeader, Button, Badge } from "reactstrap";
import { FiAlertCircle, FiCalendar, FiPackage } from "react-icons/fi";

interface Props {
    feedings: any[];
    onAdd: () => void;
    onDiscountStock: (id: string) => void;
    onUnassign: (id: string) => void;
}

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

const AdministeredFeedingsCard = ({
    feedings,
    onAdd,
    onDiscountStock,
    onUnassign,
}: Props) => {
    const hasFeedings = feedings && feedings.length > 0;

    return (
        <Card className="w-100 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">Alimentos administrados</h5>

                <Button size="sm" color="primary" onClick={onAdd}>
                    Administrar alimento
                </Button>
            </CardHeader>

            <CardBody
                className={
                    hasFeedings
                        ? "d-flex flex-column gap-3 flex-grow-1 overflow-auto"
                        : "d-flex flex-column justify-content-center align-items-center gap-2 text-center"
                }
            >
                {!hasFeedings ? (
                    <>
                        <FiAlertCircle size={36} className="text-muted" />
                        <span className="fs-5 text-muted">
                            No hay alimentos administrados
                        </span>
                    </>
                ) : (
                    feedings.map((f, index) => {
                        const date = new Date(f.applicationDate).toLocaleString(
                            "es-MX",
                            {
                                dateStyle: "short",
                                timeStyle: "short",
                            }
                        );

                        return (
                            <div
                                key={f._id || index}
                                className="border rounded p-3 position-relative bg-light-subtle"
                            >
                                {/* Acciones */}
                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => onDiscountStock(f._id)}
                                    disabled={!f.isActive}
                                >
                                    <i className="bx bx-trending-down fs-5" />
                                </Button>

                                {f.isActive && (
                                    <Button
                                        size="sm"
                                        color="link"
                                        className="position-absolute top-0 end-0 mt-2 me-5 text-danger"
                                        onClick={() => onUnassign(f._id)}
                                    >
                                        <i className="ri-forbid-line fs-5" />
                                    </Button>
                                )}

                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiPackage className="text-primary" />
                                    <strong className="fs-5 pe-5">
                                        {f.feeding?.name}
                                    </strong>
                                </div>

                                {/* Badges */}
                                <div className="d-flex gap-2 flex-wrap mb-2 fs-5">
                                    <Badge color="secondary">
                                        {PERIODICITY_LABELS[f.periodicity] ??
                                            f.periodicity}
                                    </Badge>

                                    {!f.isActive && (
                                        <Badge color="danger">Inactivo</Badge>
                                    )}
                                </div>

                                {/* Cantidad */}
                                <div className="fs-6 mb-2">
                                    <strong className="text-muted">
                                        Cantidad:
                                    </strong>{" "}
                                    {f.totalQuantity}{" "}
                                    {f.feeding?.unit_measurement}
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
                                        {f.appliedBy
                                            ? `${f.appliedBy.name} ${f.appliedBy.lastname}`
                                            : "Desconocido"}
                                    </strong>
                                </div>

                                {/* Observaciones */}
                                {f.observations?.trim() && (
                                    <div className="mt-2 fs-6">
                                        <strong className="text-muted">
                                            Notas:
                                        </strong>{" "}
                                        {f.observations}
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

export default AdministeredFeedingsCard;
