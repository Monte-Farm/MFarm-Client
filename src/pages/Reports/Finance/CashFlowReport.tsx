import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import { saveAs } from "file-saver";

interface CashFlowEntry {
    _id: string;
    date: string;
    type: string;
    description: string;
    reference: string;
    inflow: number;
    outflow: number;
}

interface CashFlowPeriod {
    period: string;
    totalInflows: number;
    totalOutflows: number;
    netFlow: number;
}

interface CashFlowKpis {
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    avgMonthlyInflow: number;
    avgMonthlyOutflow: number;
    inflowTransactions: number;
    outflowTransactions: number;
}

const flowTypeLabels: Record<string, string> = {
    sale_payment: "Pago de venta",
    purchase_payment: "Pago a proveedor",
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

const CashFlowReport = () => {
    document.title = "Flujo de Caja | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const [entries, setEntries] = useState<CashFlowEntry[]>([]);
    const [periods, setPeriods] = useState<CashFlowPeriod[]>([]);
    const [kpis, setKpis] = useState<CashFlowKpis>({
        totalInflows: 0, totalOutflows: 0, netCashFlow: 0,
        avgMonthlyInflow: 0, avgMonthlyOutflow: 0,
        inflowTransactions: 0, outflowTransactions: 0,
    });

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
                `${configContext.apiUrl}/reports/finance/cash-flow/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setEntries(data.entries || []);
            setPeriods(data.periods || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/finance/cash-flow/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const entryColumns: Column<CashFlowEntry>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        {
            header: "Tipo", accessor: "type", type: "text",
            render: (v: string) => <span>{flowTypeLabels[v] || v}</span>,
        },
        { header: "Descripcion", accessor: "description", type: "text", isFilterable: true },
        { header: "Referencia", accessor: "reference", type: "text", isFilterable: true },
        {
            header: "Entrada", accessor: "inflow", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => v > 0 ? <span className="text-success fw-semibold">{formatCurrency(v)}</span> : <span className="text-muted">—</span>,
        },
        {
            header: "Salida", accessor: "outflow", type: "text", bgColor: "#ffebee",
            render: (v: number) => v > 0 ? <span className="text-danger fw-semibold">{formatCurrency(v)}</span> : <span className="text-muted">—</span>,
        },
    ];

    const flowTrendData = [
        { id: "Entradas", data: periods.map(p => ({ x: p.period, y: p.totalInflows })), color: "#10b981" },
        { id: "Salidas", data: periods.map(p => ({ x: p.period, y: p.totalOutflows })), color: "#ef4444" },
    ];

    const netFlowBarData = periods.map(p => ({
        periodo: p.period,
        "Flujo Neto": p.netFlow,
    }));

    const [excelLoading, setExcelLoading] = useState(false);

    const handleExportExcel = async () => {
        if (!configContext) return;
        try {
            setExcelLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/finance/cash-flow/excel/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            saveAs(blob, `Flujo_Caja_${startDate}_${endDate}.xlsx`);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al generar el archivo Excel." });
        } finally {
            setExcelLoading(false);
        }
    };

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Flujo de Caja"
            pageTitle="Reportes Financieros"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Flujo de Caja"
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
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Entradas"
                        value={kpis.totalInflows}
                        subtext={`${kpis.inflowTransactions} transacciones`}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Salidas"
                        value={kpis.totalOutflows}
                        subtext={`${kpis.outflowTransactions} transacciones`}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Flujo Neto"
                        value={kpis.netCashFlow}
                        icon={<i className={`ri-money-dollar-box-line fs-4 ${kpis.netCashFlow >= 0 ? "text-success" : "text-danger"}`}></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor={kpis.netCashFlow >= 0 ? "#E8F5E9" : "#FFEBEE"}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Prom. Entrada / Mes"
                        value={kpis.avgMonthlyInflow}
                        icon={<i className="ri-calendar-line fs-4 text-info"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E0F7FA"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <BasicLineChartCard
                        title="Entradas vs Salidas"
                        data={flowTrendData}
                        yLabel="Monto ($)"
                        xLabel="Periodo"
                        height={300}
                        showLegend
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title="Flujo Neto por Periodo"
                        data={netFlowBarData}
                        indexBy="periodo"
                        keys={["Flujo Neto"]}
                        xLegend="Periodo"
                        yLegend="Monto ($)"
                        height={300}
                        colors={["#3b82f6"]}
                    />
                </Col>
            </Row>

            {/* Summary table by period */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0">
                        <i className="ri-calendar-line me-2"></i>
                        Resumen por Periodo
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Periodo</th>
                                <th className="text-end" style={{ backgroundColor: "#e8f5e9" }}>Entradas</th>
                                <th className="text-end" style={{ backgroundColor: "#ffebee" }}>Salidas</th>
                                <th className="text-end" style={{ backgroundColor: "#e3f2fd" }}>Flujo Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((p, i) => (
                                <tr key={i}>
                                    <td className="fw-semibold">{p.period}</td>
                                    <td className="text-end text-success" style={{ backgroundColor: "#e8f5e9" }}>{formatCurrency(p.totalInflows)}</td>
                                    <td className="text-end text-danger" style={{ backgroundColor: "#ffebee" }}>{formatCurrency(p.totalOutflows)}</td>
                                    <td className={`text-end fw-semibold ${p.netFlow >= 0 ? "text-success" : "text-danger"}`} style={{ backgroundColor: "#e3f2fd" }}>
                                        {formatCurrency(p.netFlow)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="table-primary fw-bold">
                                <td>TOTAL</td>
                                <td className="text-end">{formatCurrency(kpis.totalInflows)}</td>
                                <td className="text-end">{formatCurrency(kpis.totalOutflows)}</td>
                                <td className="text-end">{formatCurrency(kpis.netCashFlow)}</td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Detailed entries */}
            <Card>
                <CardHeader>
                    <h5 className="mb-0">
                        <i className="ri-list-check me-2"></i>
                        Movimientos Detallados ({entries.length})
                    </h5>
                </CardHeader>
                <CardBody>
                    <CustomTable columns={entryColumns} data={entries} showSearchAndFilter rowsPerPage={20} />
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

export default CashFlowReport;
