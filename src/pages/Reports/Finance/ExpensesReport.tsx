import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { useReportScope } from "hooks/useReportScope";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";

interface ExpenseRecord {
    _id: string;
    date: string;
    category: string;
    amount: number;
    metadata?: { description?: string };
    createdBy: any;
}

interface ExpenseByCategoryRecord {
    category: string;
    totalAmount: number;
    count: number;
    percentage: number;
}

interface ExpensesReportKpis {
    totalExpenses: number;
    totalAmount: number;
    avgExpenseAmount: number;
    categoriesCount: number;
    topCategory: string;
    topCategoryAmount: number;
}

const categoryColors: Record<string, string> = {
    LABOR: "#3b82f6",
    UTILITY: "#f59e0b",
    MAINTENANCE: "#6b7280",
    TRANSPORT: "#8b5cf6",
    LIVESTOCK_PURCHASE: "#10b981",
    VETERINARY: "#ef4444",
    OTHER: "#ec4899",
};

const ExpensesReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.expenses.title")} | ${t("reports.title")} | ${t("systemName")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });

    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [byCategory, setByCategory] = useState<ExpenseByCategoryRecord[]>([]);
    const [kpis, setKpis] = useState<ExpensesReportKpis>({
        totalExpenses: 0, totalAmount: 0, avgExpenseAmount: 0,
        categoriesCount: 0, topCategory: "", topCategoryAmount: 0,
    });
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

    const categoryLabels: Record<string, string> = {
        LABOR: t("reports.expenses.category.LABOR"),
        UTILITY: t("reports.expenses.category.UTILITY"),
        MAINTENANCE: t("reports.expenses.category.MAINTENANCE"),
        TRANSPORT: t("reports.expenses.category.TRANSPORT"),
        LIVESTOCK_PURCHASE: t("reports.expenses.category.LIVESTOCK_PURCHASE"),
        VETERINARY: t("reports.expenses.category.VETERINARY"),
        OTHER: t("reports.expenses.category.OTHER"),
    };

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [startDate, setStartDate] = useState(monthStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(monthEnd.toISOString().split("T")[0]);

    const fetchData = async () => {
        if (!configContext || !farmId) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/finances/manual_expenses_report/${farmId}/${startDate}/${endDate}`
            );
            const data = res.data.data;
            setExpenses(data.expenses || []);
            setByCategory(data.byCategory || []);
            setKpis(data.kpis);
            setMonthlyData(data.monthlyData || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: t("reports.error.loadData") });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/finances/manual_expenses_report/pdf/${farmId}/${pdfStart}/${pdfEnd}?orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, scopeKey]);

    const expenseColumns: Column<ExpenseRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        {
            header: t("reports.expenses.col.category"), accessor: "category", type: "text", isFilterable: true,
            render: (v: string) => <span>{categoryLabels[v] || v}</span>,
        },
        {
            header: t("reports.expenses.col.description"), accessor: "metadata", type: "text",
            render: (v: any) => <span>{v?.description || "-"}</span>,
        },
        { header: t("reports.expenses.col.amount"), accessor: "amount", type: "currency", bgColor: "#FFEBEE" },
    ];

    const categoryColumns: Column<ExpenseByCategoryRecord>[] = [
        {
            header: t("reports.expenses.col.category"), accessor: "category", type: "text",
            render: (v: string) => <span>{categoryLabels[v] || v}</span>,
        },
        { header: t("reports.expenses.col.totalAmount"), accessor: "totalAmount", type: "currency", bgColor: "#FFEBEE" },
        {
            header: t("reports.expenses.col.percentage"), accessor: "percentage", type: "text",
            render: (v: number) => <span className="fw-semibold">{v?.toFixed(1)}%</span>,
        },
        { header: t("reports.expenses.col.records"), accessor: "count", type: "number" },
    ];

    const donutData: DonutDataItem[] = byCategory
        .filter((c) => c.totalAmount > 0)
        .map((c) => ({
            id: c.category,
            label: categoryLabels[c.category] || c.category,
            value: c.totalAmount,
            color: categoryColors[c.category] || "#999",
        }));

    const donutLegend: DonutLegendItem[] = byCategory
        .filter((c) => c.totalAmount > 0)
        .map((c) => ({
            label: categoryLabels[c.category] || c.category,
            value: `$${c.totalAmount?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
            percentage: `${c.percentage?.toFixed(1)}%`,
        }));

    const barData = monthlyData.map((m: any) => ({
        mes: m.month,
        Gasto: m.totalAmount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.expenses.title")}
            pageTitle={t("reports.pageTitle")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Gastos Operativos"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.expenses.kpi.totalRecords")}
                        value={kpis.totalExpenses}
                        icon={<i className="ri-file-list-3-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.expenses.kpi.totalAmount")}
                        value={kpis.totalAmount}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.expenses.kpi.avgPerExpense")}
                        value={kpis.avgExpenseAmount}
                        icon={<i className="ri-bar-chart-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF3E0"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.expenses.kpi.topCategory")}
                        value={kpis.topCategoryAmount}
                        subtext={categoryLabels[kpis.topCategory] || kpis.topCategory}
                        icon={<i className="ri-pie-chart-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <BasicBarChart
                        title={t("reports.expenses.chart.byMonth")}
                        data={barData}
                        indexBy="mes"
                        keys={["Gasto"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.amountUsd")}
                        height={280}
                        colors={["#ef4444"]}
                    />
                </Col>
                <Col xl={5}>
                    <DonutChartCard
                        title={t("reports.expenses.chart.byCategory")}
                        data={donutData}
                        legendItems={donutLegend}
                        height={180}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={4}>
                    <Card>
                        <CardHeader className="fw-semibold">{t("reports.expenses.card.summary")}</CardHeader>
                        <CardBody>
                            <CustomTable columns={categoryColumns} data={byCategory} showSearchAndFilter={false} showPagination={false} />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={8}>
                    <Card>
                        <CardHeader className="fw-semibold">{t("reports.expenses.card.details")}</CardHeader>
                        <CardBody>
                            <CustomTable columns={expenseColumns} data={expenses} showSearchAndFilter rowsPerPage={15} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
            />
        </ReportPageLayout>
    );
};

export default ExpensesReport;
