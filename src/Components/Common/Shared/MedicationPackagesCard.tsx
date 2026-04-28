import { Card, CardHeader, CardBody, Button, Badge } from "reactstrap";
import {
    FiAlertCircle,
    FiEye,
    FiPackage,
    FiCalendar,
    FiUser,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface Props {
    packages: any[];
    onAdd: () => void;
    onViewDetails: (id: string) => void;
    disabled?: boolean;
    status?: string;
}

const MedicationPackagesCard = ({
    packages,
    onAdd,
    onViewDetails,
    disabled = false,
    status
}: Props) => {
    const { t } = useTranslation();
    const hasData = packages && packages.length > 0;

    return (
        <Card className="w-100 flex-grow-1 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">
                    {t('medical.medication.packagesTitle')}
                </h5>

                <Button size="sm" color="primary" onClick={onAdd} disabled={disabled}>
                    {t('medical.medication.action.adminPackage')}
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
                            {t('medical.medication.action.noPackages')}
                        </span>
                    </>
                ) : (
                    packages.map((p, index) => {
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
                                    onClick={() => onViewDetails(p.packageId._id)}
                                >
                                    <FiEye size={18} />
                                </Button>

                                {/* Título */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiPackage className="text-primary" />
                                    <strong className="fs-5 pe-4">{p.name}</strong>
                                </div>

                                {/* Etapa (condicional) */}
                                {hasStage && (
                                    <div className="mb-2 fs-5">
                                        <Badge color="info">
                                            {t(`feeding.stage.${p.stage}`, { defaultValue: p.stage })}
                                        </Badge>
                                    </div>
                                )}

                                {/* Meta info */}
                                <div className="d-flex justify-content-between flex-wrap gap-2 fs-6 text-muted mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiUser />
                                        {p.appliedBy
                                            ? `${p.appliedBy.name} ${p.appliedBy.lastname}`
                                            : t('medical.medication.field.unknown')}
                                    </span>

                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        {date}
                                    </span>
                                </div>

                                {/* Observaciones */}
                                {p.observations && p.observations.trim() !== "" && (
                                    <div className="fs-6">
                                        <strong className="text-muted">{t('medication.card.packages.notes')}</strong>{" "}
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

export default MedicationPackagesCard;
