import React from "react";
import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, Button, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import { PERIOD_CLOSING_URLS } from "helpers/period_closing_urls";
import { PeriodClosingByPeriod } from "common/data_interfaces";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

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
    const { t } = useTranslation();
    document.title = "Estado de Resultados | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const { isGlobal, farmId, scopeKey } = useReportScope();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;

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

    const [closingInfo, setClosingInfo] = useState<PeriodClosingByPeriod | null>(null);

    const fetchData = async () => {
        if (!configContext) return;
        setLoading(true);
        try {
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/finance/operations-closing",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setKpis(data.kpis);
            setCostBreakdown(data.costBreakdown || []);
            setSalesSummary(data.salesSummary || []);
            setMonthlySummary(data.monthlySummary || []);
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
            basePath: "reports/finance/operations-closing",
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

    useEffect(() => {
        // Detect if selected range matches exactly a calendar month → check for existing closing
        const check = async () => {
            if (!configContext || !userLogged || isGlobal) { setClosingInfo(null); return; }
            const start = new Date(startDate + "T00:00:00");
            const end = new Date(endDate + "T00:00:00");
            const isFirstOfMonth = start.getDate() === 1;
            const isLastOfMonth = end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
            const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
            if (!(isFirstOfMonth && isLastOfMonth && sameMonth)) {
                setClosingInfo(null);
                return;
            }
            try {
                const res = await configContext.axiosHelper.get(
                    `${configContext.apiUrl}${PERIOD_CLOSING_URLS.byPeriod(userLogged.farm_assigned)}?period_type=monthly&year=${start.getFullYear()}&month=${start.getMonth() + 1}`
                );
                setClosingInfo(res.data?.data || null);
            } catch {
                setClosingInfo(null);
            }
        };
        check();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/finance/operations-closing",
                isGlobal,
                farmId,
                variant: "excel",
                query: { start_date: startDate, end_date: endDate },
            });
            const response = await configContext.axiosHelper.getBlob(url);
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const filePrefix = isGlobal ? "Cierre_Operacion_Global" : "Cierre_Operacion";
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
            title={t("reports.operationsClosing.title")}
            pageTitle={t("reports.pageTitle")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.operationsClosing.title")}
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
            {/* Closing banner */}
            {closingInfo && (
                <Alert color={closingInfo.status === "closed" ? "success" : "warning"} className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                        <i className={`${closingInfo.status === "closed" ? "ri-lock-line" : "ri-lock-unlock-line"} me-2`} />
                        {closingInfo.status === "closed" ? (
                            <>
                                {t("reports.operationsClosing.banner.closed")} <strong>{t("reports.operationsClosing.banner.closedWord")}</strong>
                                {closingInfo.closedBy && <> {t("reports.operationsClosing.banner.closedByPrefix")} {closingInfo.closedBy.name} {closingInfo.closedBy.lastname}</>}
                                {closingInfo.closedAt && <> {t("reports.operationsClosing.banner.closedAtPrefix")} {new Date(closingInfo.closedAt).toLocaleDateString("es-MX")}</>}.
                            </>
                        ) : (
                            <>
                                {t("reports.operationsClosing.banner.reopened")} <strong>{t("reports.operationsClosing.banner.reopenedWord")}</strong>
                                {closingInfo.reopenedBy && <> {t("reports.operationsClosing.banner.closedByPrefix")} {closingInfo.reopenedBy.name} {closingInfo.reopenedBy.lastname}</>}
                                {closingInfo.reopenReason && <> — {t("reports.operationsClosing.banner.reasonPrefix")} {closingInfo.reopenReason}</>}
                            </>
                        )}
                    </div>
                    <Link to={`/finance/period-closing/${closingInfo._id}`} className="btn btn-sm btn-light">
                        {t("reports.operationsClosing.banner.viewClosure")}
                    </Link>
                </Alert>
            )}

            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.operationsClosing.kpi.income")}
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
                        title={t("reports.operationsClosing.kpi.costs")}
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
                        title={t("reports.operationsClosing.kpi.operatingResult")}
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
                        title={t("reports.operationsClosing.kpi.operatingMargin")}
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
                        title={t("reports.operationsClosing.kpi.pigsSold")}
                        value={kpis.totalPigsSold}
                        icon={<i className="bx bxs-dog fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.operationsClosing.kpi.kgSold")}
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
                        title={t("reports.operationsClosing.chart.incomeVsCosts")}
                        data={barData}
                        indexBy="month"
                        keys={["Ingresos", "Costos"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.amountUsd")}
                        height={300}
                        colors={["#10b981", "#ef4444"]}
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title={t("reports.operationsClosing.chart.costsByCategory")}
                        data={costBarData}
                        indexBy="categoria"
                        keys={["Monto"]}
                        xLegend={t("reports.col.category")}
                        yLegend={t("reports.axis.amountUsd")}
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
                        {t("reports.operationsClosing.salesSummary")}
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>{t("reports.col.type")}</th>
                                <th className="text-end">{t("reports.col.pigs")}</th>
                                <th className="text-end">{t("reports.operationsClosing.table.totalWeight")}</th>
                                <th className="text-end">{t("reports.operationsClosing.table.avgPricePerKg")}</th>
                                <th className="text-end" style={{ backgroundColor: bg("#e8f5e9") }}>{t("reports.operationsClosing.table.totalAmount")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesSummary.map((s, i) => (
                                <tr key={i}>
                                    <td className="fw-semibold">{s.type}</td>
                                    <td className="text-end">{s.pigCount}</td>
                                    <td className="text-end">{s.totalWeight?.toFixed(1)}</td>
                                    <td className="text-end">{formatCurrency(s.avgPricePerKg)}</td>
                                    <td className="text-end fw-semibold" style={{ backgroundColor: bg("#e8f5e9") }}>
                                        {formatCurrency(s.totalAmount)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="fw-bold" style={{ backgroundColor: bg("#e8f5e9") }}>
                                <td>{t("reports.operationsClosing.table.totalIncome")}</td>
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
                        {t("reports.operationsClosing.costBreakdown")}
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>{t("reports.col.description")}</th>
                                <th className="text-end" style={{ width: "180px", backgroundColor: bg("#ffebee") }}>{t("reports.col.amount")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(costsByCategory).map(([category, items]) => {
                                const categoryTotal = items.reduce((sum, i) => sum + i.amount, 0);
                                return (
                                    <React.Fragment key={category}>
                                        <tr style={{ backgroundColor: bg("#fff8e1") }}>
                                            <td className="fw-bold text-uppercase text-muted" style={{ fontSize: "13px" }}>
                                                {category}
                                            </td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(categoryTotal)}
                                            </td>
                                        </tr>
                                        {items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ paddingLeft: "2rem" }}>{item.description}</td>
                                                <td className="text-end" style={{ backgroundColor: bg("#ffebee") }}>
                                                    {formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                            <tr className="fw-bold" style={{ backgroundColor: bg("#ffebee") }}>
                                <td>{t("reports.operationsClosing.table.totalCosts")}</td>
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
                        {t("reports.operationsClosing.operatingResult")}
                    </h5>
                </CardHeader>
                <CardBody>
                    <Table className="align-middle mb-0" style={{ maxWidth: "500px" }}>
                        <tbody>
                            <tr>
                                <td className="fw-semibold">{t("reports.operationsClosing.result.totalIncome")}</td>
                                <td className="text-end text-success fw-bold fs-5">{formatCurrency(kpis.totalIncome)}</td>
                            </tr>
                            <tr>
                                <td className="fw-semibold">{t("reports.operationsClosing.result.totalCosts")}</td>
                                <td className="text-end text-danger fw-bold fs-5">({formatCurrency(kpis.totalCosts)})</td>
                            </tr>
                            <tr style={{ backgroundColor: bg(kpis.operatingResult >= 0 ? "#e8f5e9" : "#ffebee") }}>
                                <td className="fw-bold fs-5">{t("reports.operationsClosing.result.operating")}</td>
                                <td className={`text-end fw-bold fs-5 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}>
                                    {formatCurrency(kpis.operatingResult)}
                                </td>
                            </tr>
                            <tr>
                                <td className="fw-semibold">{t("reports.operationsClosing.result.margin")}</td>
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
