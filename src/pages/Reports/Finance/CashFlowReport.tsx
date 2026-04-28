import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
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

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
};

const CashFlowReport = () => {
    const { t } = useTranslation();

    const flowTypeLabels: Record<string, string> = {
        sale_payment: t("reports.cashFlow.flowType.sale_payment"),
        purchase_payment: t("reports.cashFlow.flowType.purchase_payment"),
    };

    document.title = `${t("reports.cashFlow.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

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
        if (!configContext) return;
        setLoading(true);
        try {
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/finance/cash-flow",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setEntries(data.entries || []);
            setPeriods(data.periods || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadData") });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const url = buildReportUrl({
            apiUrl: configContext.apiUrl,
            basePath: "reports/finance/cash-flow",
            isGlobal,
            farmId,
            variant: "pdf",
            query: { start_date: pdfStart, end_date: pdfEnd, orientation: "portrait", format: "A4" },
        });
        const response = await configContext.axiosHelper.getBlob(url);
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, scopeKey]);

    const entryColumns: Column<CashFlowEntry>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        {
            header: t("reports.cashFlow.col.type"), accessor: "type", type: "text",
            render: (v: string) => <span>{flowTypeLabels[v] || v}</span>,
        },
        { header: t("reports.col.description"), accessor: "description", type: "text", isFilterable: true },
        { header: t("reports.cashFlow.col.reference"), accessor: "reference", type: "text", isFilterable: true },
        {
            header: t("reports.cashFlow.col.inflow"), accessor: "inflow", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => v > 0 ? <span className="text-success fw-semibold">{formatCurrency(v)}</span> : <span className="text-muted">—</span>,
        },
        {
            header: t("reports.cashFlow.col.outflow"), accessor: "outflow", type: "text", bgColor: "#ffebee",
            render: (v: number) => v > 0 ? <span className="text-danger fw-semibold">{formatCurrency(v)}</span> : <span className="text-muted">—</span>,
        },
    ];

    const flowTrendData = [
        { id: t("reports.cashFlow.table.inflows"), data: periods.map(p => ({ x: p.period, y: p.totalInflows })), color: "#10b981" },
        { id: t("reports.cashFlow.table.outflows"), data: periods.map(p => ({ x: p.period, y: p.totalOutflows })), color: "#ef4444" },
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
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/finance/cash-flow",
                isGlobal,
                farmId,
                variant: "excel",
                query: { start_date: startDate, end_date: endDate },
            });
            const response = await configContext.axiosHelper.getBlob(url);
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const filePrefix = isGlobal ? "Flujo_Caja_Global" : "Flujo_Caja";
            saveAs(blob, `${filePrefix}_${startDate}_${endDate}.xlsx`);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.generateExcel") });
        } finally {
            setExcelLoading(false);
        }
    };

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.cashFlow.title")}
            pageTitle={t("reports.financial")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.cashFlow.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            headerActions={
                <Button color="success" onClick={handleExportExcel} disabled={excelLoading}>
                    {excelLoading ? (
                        <><i className="ri-loader-4-line ri-spin me-1"></i> {t("reports.excel.generating")}</>
                    ) : (
                        <><i className="ri-file-excel-2-line me-1"></i> {t("reports.excel.export")}</>
                    )}
                </Button>
            }
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.cashFlow.kpi.totalInflows")}
                        value={kpis.totalInflows}
                        subtext={t("reports.cashFlow.kpi.transactions", { count: kpis.inflowTransactions })}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.cashFlow.kpi.totalOutflows")}
                        value={kpis.totalOutflows}
                        subtext={t("reports.cashFlow.kpi.transactions", { count: kpis.outflowTransactions })}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.cashFlow.kpi.netFlow")}
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
                        title={t("reports.cashFlow.kpi.avgMonthlyInflow")}
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
                        title={t("reports.cashFlow.chart.inflowVsOutflow")}
                        data={flowTrendData}
                        yLabel={t("reports.axis.amountUsd")}
                        xLabel={t("reports.axis.period")}
                        height={300}
                        showLegend
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title={t("reports.cashFlow.chart.netByPeriod")}
                        data={netFlowBarData}
                        indexBy="periodo"
                        keys={["Flujo Neto"]}
                        xLegend={t("reports.axis.period")}
                        yLegend={t("reports.axis.amountUsd")}
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
                        {t("reports.cashFlow.periodSummary")}
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>{t("reports.cashFlow.table.period")}</th>
                                <th className="text-end" style={{ backgroundColor: "#e8f5e9" }}>{t("reports.cashFlow.table.inflows")}</th>
                                <th className="text-end" style={{ backgroundColor: "#ffebee" }}>{t("reports.cashFlow.table.outflows")}</th>
                                <th className="text-end" style={{ backgroundColor: "#e3f2fd" }}>{t("reports.cashFlow.table.netFlow")}</th>
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
                                <td>{t("reports.cashFlow.table.total")}</td>
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
                        {t("reports.cashFlow.detailedMovements")} ({entries.length})
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
