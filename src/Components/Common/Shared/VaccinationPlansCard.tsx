import { useTranslation } from "react-i18next";
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
    status?: string;
    disabled?: boolean;
}

const VaccinationPlansCard = ({
    plans,
    onAdd,
    onViewDetails,
    status,
    disabled = false,
}: Props) => {
    const { t } = useTranslation();
    const hasData = plans && plans.length > 0;

    const STAGE_LABELS: Record<string, string> = {
        piglet: t("shared.vaccinationPlans.stage.piglet"),
        sow: t("shared.vaccinationPlans.stage.sow"),
        nursery: t("shared.vaccinationPlans.stage.nursery"),
        grower: t("shared.vaccinationPlans.stage.grower"),
        finisher: t("shared.vaccinationPlans.stage.finisher"),
    };

    return (
        <Card className="w-100 flex-grow-1 h-100 m-0">
            <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                <h5 className="mb-0 fw-semibold">
                    {t("shared.vaccinationPlans.title")}
                </h5>

                <Button size="sm" color="primary" onClick={onAdd} disabled={disabled}>
                    {t("shared.vaccinationPlans.assign")}
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
                            {t("shared.vaccinationPlans.empty")}
                        </span>
                    </>
                ) : (
                    plans.map((p, index) => {
                        const date = new Date(p.applicationDate).toLocaleString(undefined, {
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
                                <Button
                                    size="sm"
                                    color="link"
                                    className="position-absolute top-0 end-0 m-2"
                                    onClick={() => onViewDetails(p.planId._id)}
                                >
                                    <FiEye size={18} />
                                </Button>

                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <FiShield className="text-success" />
                                    <strong className="fs-5 pe-4">{p.name}</strong>
                                </div>

                                {hasStage && (
                                    <div className="mb-2">
                                        <Badge color="info">
                                            {STAGE_LABELS[p.stage] ?? p.stage}
                                        </Badge>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between flex-wrap gap-2 fs-6 text-muted mb-2">
                                    <span className="d-flex align-items-center gap-1">
                                        <FiUser />
                                        {p.appliedBy
                                            ? `${p.appliedBy.name} ${p.appliedBy.lastname}`
                                            : t("shared.vaccinationPlans.unknown")}
                                    </span>

                                    <span className="d-flex align-items-center gap-1">
                                        <FiCalendar />
                                        {date}
                                    </span>
                                </div>

                                {p.observations && p.observations.trim() !== "" && (
                                    <div className="fs-6">
                                        <strong className="text-muted">{t("shared.vaccinationPlans.notes")}</strong>{" "}
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
