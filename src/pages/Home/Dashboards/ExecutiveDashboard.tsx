import React, { useContext, useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import { stageLabelsEs } from "../dashboardHelpers";

interface Props {
    startDate: string;
    endDate: string;
}

interface ExecutiveData {
    finance: { totalIncome: number; totalCosts: number; operatingResult: number; operatingMargin: number };
    production: { totalActivePigs: number; totalActiveGroups: number; mortalityRate: number; avgFcr: number; avgAdg: number };
    groupsByStage: { stage: string; stageLabel: string; groupCount: number; pigCount: number }[];
    costVsIncomeMonthly: { month: string; totalCost: number; totalIncome: number; profit: number; margin: number }[];
    topClients: { clientName: string; totalRevenue: number; margin: number }[];
    inventoryAlerts: { staleProductCount: number; criticalStockCount: number; shrinkagePercent: number };
}

const stageColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];

const ExecutiveDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<ExecutiveData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/executive/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            setData(res.data.data);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar el dashboard." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;
    if (!data) return null;

    const incomeVsCostLine = [
        { id: "Ingresos", data: data.costVsIncomeMonthly.map(m => ({ x: m.month, y: m.totalIncome })), color: "#10b981" },
        { id: "Costos", data: data.costVsIncomeMonthly.map(m => ({ x: m.month, y: m.totalCost })), color: "#ef4444" },
    ];

    const stageDonut = (data.groupsByStage || []).map((s, idx) => ({
        id: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        label: s.stageLabel || stageLabelsEs[s.stage] || s.stage,
        value: s.pigCount,
        color: stageColors[idx % stageColors.length],
    }));

    const clientColumns: Column<{ clientName: string; totalRevenue: number; margin: number }>[] = [
        { header: "Cliente", accessor: "clientName", type: "text" },
        { header: "Ingreso", accessor: "totalRevenue", type: "currency", bgColor: "#e8f5e9" },
        {
            header: "Margen", accessor: "margin", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)}%</span>,
        },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard title="Ingreso Total" value={data.finance.totalIncome} prefix="$" decimals={2}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="Costos Totales" value={data.finance.totalCosts} prefix="$" decimals={2}
                        icon={<i className="ri-shopping-cart-2-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="Resultado Operativo" value={data.finance.operatingResult} prefix="$" decimals={2}
                        icon={<i className="ri-line-chart-line fs-4 text-primary"></i>}
                        iconBgColor="#EEF2FF" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="Margen Operativo" value={data.finance.operatingMargin} suffix="%" decimals={2}
                        icon={<i className="ri-percent-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard title="Cerdos Activos" value={data.production.totalActivePigs}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="Grupos Activos" value={data.production.totalActiveGroups}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>}
                        animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="Tasa de Mortalidad" value={data.production.mortalityRate} suffix="%" decimals={2}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard title="FCR Promedio" value={data.production.avgFcr} decimals={2}
                        icon={<i className="ri-restaurant-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={8}>
                    <BasicLineChartCard
                        title="Ingresos vs Costos"
                        data={incomeVsCostLine}
                        yLabel="Monto ($)"
                        xLabel="Mes"
                        height={320}
                        enableArea
                        areaOpacity={0.08}
                        showLegend
                    />
                </Col>
                <Col xl={4}>
                    <DonutChartCard
                        title="Cerdos por Etapa"
                        data={stageDonut}
                        height={320}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={8}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Top Clientes (Ingresos)</h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable
                                columns={clientColumns}
                                data={data.topClients || []}
                                showSearchAndFilter={false}
                                showPagination={false}
                            />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={4}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">Alertas de Inventario</h6>
                        </CardHeader>
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                <div>
                                    <div className="text-muted" style={{ fontSize: "13px" }}>Productos con stock critico</div>
                                    <div className="fw-bold fs-4 text-danger">{data.inventoryAlerts.criticalStockCount}</div>
                                </div>
                                <i className="ri-error-warning-line fs-1 text-danger"></i>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                <div>
                                    <div className="text-muted" style={{ fontSize: "13px" }}>Productos sin movimiento</div>
                                    <div className="fw-bold fs-4 text-warning">{data.inventoryAlerts.staleProductCount}</div>
                                </div>
                                <i className="ri-time-line fs-1 text-warning"></i>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="text-muted" style={{ fontSize: "13px" }}>Merma general</div>
                                    <div className="fw-bold fs-4 text-info">{data.inventoryAlerts.shrinkagePercent?.toFixed(2)}%</div>
                                </div>
                                <i className="ri-scales-line fs-1 text-info"></i>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </>
    );
};

export default ExecutiveDashboard;
