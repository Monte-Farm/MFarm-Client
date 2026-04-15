import React, { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";

interface Props { startDate: string; endDate: string; }

interface DeathsByStage { stage: string; stageLabel: string; deaths: number; rate: number; }
interface Treatment { _id: string; date: string; groupName: string; treatmentType: string; productName: string; pigCount: number; }
interface FeedByGroup { groupName: string; stage: string; pigCount: number; avgPerPig: number; unit: string; }

interface VeterinaryData {
    kpis: {
        mortalityRate: number;
        totalDeaths: number;
        medicationsApplied: number;
        vaccinationsApplied: number;
        groupsWithHealthAlerts: number;
    };
    deathsByCause: { cause: string; count: number; percentage: number }[];
    deathsByStage: DeathsByStage[];
    recentTreatments: Treatment[];
    feedConsumptionByGroup: FeedByGroup[];
}

const causeColors = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981", "#ec4899", "#6b7280"];

const treatmentLabels: Record<string, { label: string; color: string }> = {
    medication: { label: "Medicacion", color: "info" },
    vaccination: { label: "Vacunacion", color: "success" },
};

const VeterinaryDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<VeterinaryData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/veterinary/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
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

    const causesDonut = (data.deathsByCause || []).map((c, idx) => ({
        id: c.cause, label: c.cause, value: c.count,
        color: causeColors[idx % causeColors.length],
    }));

    const stageBarData = data.deathsByStage.map(s => ({
        stage: s.stageLabel,
        "Muertes": s.deaths,
    }));

    const treatColumns: Column<Treatment>[] = [
        { header: "Fecha", accessor: "date", type: "date" },
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        {
            header: "Tipo", accessor: "treatmentType", type: "text",
            render: (v: string) => {
                const t = treatmentLabels[v] || { label: v, color: "secondary" };
                return <Badge color={t.color}>{t.label}</Badge>;
            },
        },
        { header: "Producto", accessor: "productName", type: "text" },
        { header: "Cerdos", accessor: "pigCount", type: "number", bgColor: "#e3f2fd" },
    ];

    const feedColumns: Column<FeedByGroup>[] = [
        { header: "Grupo", accessor: "groupName", type: "text" },
        { header: "Etapa", accessor: "stage", type: "text" },
        { header: "Cerdos", accessor: "pigCount", type: "number" },
        {
            header: "Consumo/Cerdo", accessor: "avgPerPig", type: "text",
            render: (v: number, row) => <span>{v?.toFixed(2)} {row.unit}</span>,
            bgColor: "#e8f5e9",
        },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Tasa Mortalidad" value={data.kpis.mortalityRate} suffix="%" decimals={2}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Muertes Totales" value={data.kpis.totalDeaths}
                        icon={<i className="ri-heart-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Medicaciones" value={data.kpis.medicationsApplied}
                        icon={<i className="ri-capsule-line fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Vacunaciones" value={data.kpis.vaccinationsApplied}
                        icon={<i className="ri-syringe-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Grupos con Alertas" value={data.kpis.groupsWithHealthAlerts}
                        icon={<i className="ri-error-warning-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <DonutChartCard
                        title="Mortalidad por Causa"
                        data={causesDonut}
                        height={320}
                    />
                </Col>
                <Col xl={7}>
                    <BasicBarChart
                        title="Mortalidad por Etapa"
                        data={stageBarData}
                        indexBy="stage"
                        keys={["Muertes"]}
                        xLegend="Etapa"
                        yLegend="Cantidad"
                        height={320}
                        colors={["#ef4444"]}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Tratamientos Recientes</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={treatColumns} data={data.recentTreatments || []} rowsPerPage={8} showSearchAndFilter />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={5}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Consumo de Alimento por Grupo</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={feedColumns} data={data.feedConsumptionByGroup || []} rowsPerPage={8} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default VeterinaryDashboard;
