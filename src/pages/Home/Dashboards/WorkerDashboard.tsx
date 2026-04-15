import React, { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
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
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
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
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar el dashboard." });
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
        { header: "Fecha", accessor: "date", type: "date" },
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        {
            header: "Tipo", accessor: "movementType", type: "text",
            render: (v: string) => {
                const m = movementTypeLabels[v] || { label: v, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        { header: "Cantidad", accessor: "quantity", type: "number", bgColor: "#e3f2fd" },
        { header: "Origen", accessor: "origin", type: "text" },
        { header: "Destino", accessor: "destination", type: "text" },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={4} md={6}>
                    <StatKpiCard title="Cerdos Activos" value={data.kpis.totalActivePigs}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={4} md={6}>
                    <StatKpiCard title="Grupos Activos" value={data.kpis.totalActiveGroups}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={4} md={6}>
                    <StatKpiCard title="Mi Actividad Hoy" value={data.kpis.myActionsToday}
                        subtext="Acciones registradas"
                        icon={<i className="ri-checkbox-circle-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <DonutChartCard
                        title="Cerdos por Etapa"
                        data={stageDonut}
                        height={340}
                    />
                </Col>
                <Col xl={7}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Movimientos de Cerdos Recientes</h6>
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
