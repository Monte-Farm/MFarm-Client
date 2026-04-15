import React, { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";

interface Props { startDate: string; endDate: string; }

interface UpcomingBirth { sowIdentifier: string; estimatedBirthDate: string; daysToBirth: number; }
interface Insemination { _id: string; date: string; sowIdentifier: string; boarOrSample: string; result: string; }

interface ReproductionData {
    kpis: {
        inseminationEffectiveness: number;
        avgWeaningHeatInterval: number;
        avgBornAlivePerBirth: number;
        avgWeanedPerSow: number;
        pendingInseminations: number;
        upcomingBirths: number;
    };
    upcomingBirthsList: UpcomingBirth[];
    recentInseminations: Insemination[];
    monthlyEffectiveness: { month: string; total: number; successful: number; rate: number }[];
    bornAliveVsDead: { month: string; bornAlive: number; bornDead: number; mummified: number }[];
}

const resultLabels: Record<string, { label: string; color: string }> = {
    success: { label: "Exitosa", color: "success" },
    pending: { label: "Pendiente", color: "warning" },
    failed: { label: "Fallida", color: "danger" },
};

const ReproductionDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<ReproductionData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/reproduction/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
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

    const effectivenessLine = [{
        id: "Efectividad",
        data: data.monthlyEffectiveness.map(m => ({ x: m.month, y: m.rate })),
        color: "#10b981",
    }];

    const bornBarData = data.bornAliveVsDead.map(m => ({
        month: m.month,
        "Nacidos vivos": m.bornAlive,
        "Nacidos muertos": m.bornDead,
        "Momificados": m.mummified,
    }));

    const upcomingColumns: Column<UpcomingBirth>[] = [
        { header: "Cerda", accessor: "sowIdentifier", type: "text" },
        { header: "Fecha Estimada", accessor: "estimatedBirthDate", type: "date" },
        {
            header: "Dias", accessor: "daysToBirth", type: "text",
            render: (v: number) => (
                <Badge color={v < 0 ? "danger" : v <= 7 ? "warning" : "info"}>
                    {v < 0 ? `Retrasada ${Math.abs(v)}d` : `En ${v}d`}
                </Badge>
            ),
        },
    ];

    const insemColumns: Column<Insemination>[] = [
        { header: "Fecha", accessor: "date", type: "date" },
        { header: "Cerda", accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: "Berraco / Muestra", accessor: "boarOrSample", type: "text" },
        {
            header: "Resultado", accessor: "result", type: "text",
            render: (v: string) => {
                const r = resultLabels[v] || { label: v, color: "secondary" };
                return <Badge color={r.color}>{r.label}</Badge>;
            },
        },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Efectividad" value={data.kpis.inseminationEffectiveness} suffix="%" decimals={1}
                        icon={<i className="ri-check-double-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Destete-Celo" value={data.kpis.avgWeaningHeatInterval} suffix=" d" decimals={1}
                        icon={<i className="ri-timer-line fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Nacidos Vivos/Parto" value={data.kpis.avgBornAlivePerBirth} decimals={1}
                        icon={<i className="bx bxs-baby-carriage fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Destetados/Cerda" value={data.kpis.avgWeanedPerSow} decimals={1}
                        icon={<i className="ri-parent-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Inseminaciones Pend." value={data.kpis.pendingInseminations}
                        icon={<i className="ri-hourglass-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Partos Proximos" value={data.kpis.upcomingBirths}
                        icon={<i className="ri-calendar-event-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title="Efectividad Mensual"
                        data={effectivenessLine}
                        yLabel="Efectividad (%)"
                        xLabel="Mes"
                        height={300}
                        enableArea
                        areaOpacity={0.1}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title="Nacidos Vivos vs Muertos"
                        data={bornBarData}
                        indexBy="month"
                        keys={["Nacidos vivos", "Nacidos muertos", "Momificados"]}
                        xLegend="Mes"
                        yLegend="Cantidad"
                        height={300}
                        colors={["#10b981", "#ef4444", "#6b7280"]}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">
                                <i className="ri-calendar-event-line me-1 text-primary"></i>
                                Partos Proximos
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={upcomingColumns} data={data.upcomingBirthsList || []} rowsPerPage={8} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={7}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Inseminaciones Recientes</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={insemColumns} data={data.recentInseminations || []} rowsPerPage={8} showSearchAndFilter />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default ReproductionDashboard;
