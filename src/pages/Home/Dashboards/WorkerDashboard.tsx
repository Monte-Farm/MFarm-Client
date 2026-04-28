import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import { movementTypeLabels, stageLabelsEs } from "../dashboardHelpers";

interface Props { startDate: string; endDate: string; }

interface PigMove { _id: string; date: string; groupName: string; movementType: string; quantity: number; origin: string; destination: string; }

interface WorkerData {
    kpis: { totalActivePigs: number; totalActiveGroups: number; myActionsToday: number };
    groupsByStage: { stage: string; stageLabel: string; groupCount: number; pigCount: number }[];
    recentPigMovements: PigMove[];
}

const stageColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];

const WorkerDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<WorkerData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/worker/${userLogged.farm_assigned}?user_id=${userLogged._id}&start_date=${startDate}&end_date=${endDate}`
            );
            setData(res.data.data);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("dashboard.error") });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [startDate, endDate]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;
    if (!data) return null;

    const stageDonut = (data.groupsByStage || []).map((s, idx) => ({
        id: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        label: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        value: s.pigCount,
        color: stageColors[idx % stageColors.length],
    }));

    const moveColumns: Column<PigMove>[] = [
        { header: t("dashboard.worker.table.date"), accessor: "date", type: "date" },
        { header: t("dashboard.worker.table.group"), accessor: "groupName", type: "text", isFilterable: true },
        {
            header: t("dashboard.worker.table.type"), accessor: "movementType", type: "text",
            render: (v: string) => {
                const m = movementTypeLabels[v] || { label: v, color: "secondary" };
                return <Badge color={m.color}>{t(`dashboard.movementType.${v}`, { defaultValue: m.label })}</Badge>;
            },
        },
        { header: t("dashboard.worker.table.quantity"), accessor: "quantity", type: "number", bgColor: "#e3f2fd" },
        { header: t("dashboard.worker.table.origin"), accessor: "origin", type: "text" },
        { header: t("dashboard.worker.table.destination"), accessor: "destination", type: "text" },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={4} md={6}>
                    <StatKpiCard title={t("dashboard.worker.kpi.activePigs")} value={data.kpis.totalActivePigs}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={4} md={6}>
                    <StatKpiCard title={t("dashboard.worker.kpi.activeGroups")} value={data.kpis.totalActiveGroups}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={4} md={6}>
                    <StatKpiCard title={t("dashboard.worker.kpi.myActivityToday")} value={data.kpis.myActionsToday}
                        subtext={t("dashboard.worker.kpi.actionsRegistered")}
                        icon={<i className="ri-checkbox-circle-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <DonutChartCard
                        title={t("dashboard.worker.chart.pigsByStage")}
                        data={stageDonut}
                        height={340}
                    />
                </Col>
                <Col xl={7}>
                    <Card className="h-100">
                        <CardHeader>
                            <h6 className="mb-0 text-muted">{t("dashboard.worker.table.recentMovements")}</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={moveColumns} data={data.recentPigMovements || []} rowsPerPage={10} showSearchAndFilter />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default WorkerDashboard;
