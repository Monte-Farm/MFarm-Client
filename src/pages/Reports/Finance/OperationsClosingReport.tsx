import React from "react";
import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import { saveAs } from "file-saver";

interface CostItem {
    category: string;
    description: string;
    amount: number;
}

interface SalesSummary {
    type: string;
    pigCount: number;
    totalWeight: number;
    totalAmount: number;
    avgPricePerKg: number;
}

interface ClosingKpis {
    totalIncome: number;
    totalCosts: number;
    operatingResult: number;
    operatingMargin: number;
    totalKgSold: number;
    totalPigsSold: number;
}

interface MonthlySummary {
    month: string;
    income: number;
    costs: number;
    result: number;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

const OperationsClosingReport = () => {
    document.title = "Cierre de Operacion | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const [kpis, setKpis] = useState<ClosingKpis>({
        totalIncome: 0, totalCosts: 0, operatingResult: 0,
        operatingMargin: 0, totalKgSold: 0, totalPigsSold: 0,
    });
    const [costBreakdown, setCostBreakdown] = useState<CostItem[]>([]);
    const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
    const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [startDate, setStartDate] = useState(monthStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(monthEnd.toISOString().split("T")[0]);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/finance/operations-closing/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setKpis(data.kpis);
            setCostBreakdown(data.costBreakdown || []);
            setSalesSummary(data.salesSummary || []);
            setMonthlySummary(data.monthlySummary || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/finance/operations-closing/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Group costs by category
    const costsByCategory: Record<string, CostItem[]> = {};
    let totalCostsFromItems = 0;
    costBreakdown.forEach(item => {
        if (!costsByCategory[item.category]) {
            costsByCategory[item.category] = [];
        }
        costsByCategory[item.category].push(item);
        totalCostsFromItems += item.amount;
    });

    const categoryTotals = Object.entries(costsByCategory).map(([category, items]) => ({
        category,
        total: items.reduce((sum, i) => sum + i.amount, 0),
    }));

    const barData = monthlySummary.map(m => ({
        month: m.month,
        Ingresos: m.income,
        Costos: m.costs,
    }));

    const costBarData = categoryTotals.map(c => ({
        categoria: c.category,
        Monto: c.total,
    }));

    const [excelLoading, setExcelLoading] = useState(false);

    const handleExportExcel = async () => {
        if (!configContext) return;
        try {
            setExcelLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/finance/operations-closing/excel/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(blob, `Cierre_Operacion_${startDate}_${endDate}.xlsx`);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al generar el archivo Excel." });
        } finally {
            setExcelLoading(false);
        }
    };

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Cierre de Operacion"
            pageTitle="Reportes Financieros"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Cierre de Operacion"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            headerActions={
                <Button color="success" onClick={handleExportExcel} disabled={excelLoading}>
                    {excelLoading ? (
                        <><i className="ri-loader-4-line ri-spin me-1"></i> Generando...</>
                    ) : (
                        <><i className="ri-file-excel-2-line me-1"></i> Exportar Excel</>
                    )}
                </Button>
            }
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Ingresos"
                        value={kpis.totalIncome}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Costos"
                        value={kpis.totalCosts}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Resultado Operativo"
                        value={kpis.operatingResult}
                        icon={<i className={`ri-money-dollar-box-line fs-4 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor={kpis.operatingResult >= 0 ? "#E8F5E9" : "#FFEBEE"}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Margen Operativo"
                        value={kpis.operatingMargin}
                        icon={<i className="ri-percent-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Cerdos Vendidos"
                        value={kpis.totalPigsSold}
                        icon={<i className="bx bxs-dog fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Kilos Vendidos"
                        value={kpis.totalKgSold}
                        icon={<i className="ri-scales-3-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={0}
                        suffix=" kg"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <BasicBarChart
                        title="Ingresos vs Costos por Mes"
                        data={barData}
                        indexBy="month"
                        keys={["Ingresos", "Costos"]}
                        xLegend="Mes"
                        yLegend="Monto ($)"
                        height={300}
                        colors={["#10b981", "#ef4444"]}
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title="Costos por Categoria"
                        data={costBarData}
                        indexBy="categoria"
                        keys={["Monto"]}
                        xLegend="Categoria"
                        yLegend="Monto ($)"
                        height={300}
                        colors={["#3b82f6"]}
                    />
                </Col>
            </Row>

            {/* Sales Summary */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0">
                        <i className="ri-money-dollar-circle-line me-2 text-success"></i>
                        Ingresos por Ventas
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Tipo</th>
                                <th className="text-end">Cerdos</th>
                                <th className="text-end">Peso Total (kg)</th>
                                <th className="text-end">Precio Prom. / kg</th>
                                <th className="text-end" style={{ backgroundColor: "#e8f5e9" }}>Monto Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesSummary.map((s, i) => (
                                <tr key={i}>
                                    <td className="fw-semibold">{s.type}</td>
                                    <td className="text-end">{s.pigCount}</td>
                                    <td className="text-end">{s.totalWeight?.toFixed(1)}</td>
                                    <td className="text-end">{formatCurrency(s.avgPricePerKg)}</td>
                                    <td className="text-end fw-semibold" style={{ backgroundColor: "#e8f5e9" }}>
                                        {formatCurrency(s.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="table-success fw-bold">
                                <td>TOTAL INGRESOS</td>
                                <td className="text-end">{kpis.totalPigsSold}</td>
                                <td className="text-end">{kpis.totalKgSold?.toFixed(1)}</td>
                                <td></td>
                                <td className="text-end">{formatCurrency(kpis.totalIncome)}</td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Cost Breakdown */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0">
                        <i className="ri-file-list-3-line me-2 text-danger"></i>
                        Desglose de Costos
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Descripcion</th>
                                <th className="text-end" style={{ width: "180px", backgroundColor: "#ffebee" }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(costsByCategory).map(([category, items]) => {
                                const categoryTotal = items.reduce((sum, i) => sum + i.amount, 0);
                                return (
                                    <React.Fragment key={category}>
                                        <tr className="table-light">
                                            <td className="fw-bold text-uppercase" style={{ fontSize: "13px", color: "#6b7280" }}>
                                                {category}
                                            </td>
                                            <td className="text-end fw-bold" style={{ backgroundColor: "#fff8e1" }}>
                                                {formatCurrency(categoryTotal)}
                                            </td>
                                        </tr>
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ paddingLeft: "2rem" }}>{item.description}</td>
                                                <td className="text-end" style={{ backgroundColor: "#ffebee" }}>
                                                    {formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                            <tr className="table-danger fw-bold">
                                <td>TOTAL COSTOS</td>
                                <td className="text-end">{formatCurrency(totalCostsFromItems)}</td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Operating Result */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0">
                        <i className="ri-bar-chart-box-line me-2 text-primary"></i>
                        Resultado de Operacion
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="align-middle mb-0" style={{ maxWidth: "500px" }}>
                        <tbody>
                            <tr>
                                <td className="fw-semibold">Total Ingresos</td>
                                <td className="text-end text-success fw-bold fs-5">{formatCurrency(kpis.totalIncome)}</td>
                            </tr>
                            <tr>
                                <td className="fw-semibold">Total Costos</td>
                                <td className="text-end text-danger fw-bold fs-5">({formatCurrency(kpis.totalCosts)})</td>
                            </tr>
                            <tr className={kpis.operatingResult >= 0 ? "table-success" : "table-danger"}>
                                <td className="fw-bold fs-5">Resultado Operativo</td>
                                <td className={`text-end fw-bold fs-5 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}>
                                    {formatCurrency(kpis.operatingResult)}
                                </td>
                            </tr>
                            <tr>
                                <td className="fw-semibold">Margen Operativo</td>
                                <td className={`text-end fw-bold ${kpis.operatingMargin >= 0 ? "text-success" : "text-danger"}`}>
                                    {kpis.operatingMargin?.toFixed(1)}%
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </ReportPageLayout>
    );
};

export default OperationsClosingReport;
