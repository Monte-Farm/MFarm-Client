import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import classnames from "classnames";

interface PurchaseRecord {
    _id: string;
    date: string;
    supplier: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    invoiceNumber: string;
}

interface PriceFluctuation {
    productName: string;
    category: string;
    currentPrice: number;
    previousPrice: number;
    variation: number;
    variationPercent: number;
    unit: string;
}

interface PurchasesKpis {
    totalPurchases: number;
    totalSpent: number;
    avgPurchaseAmount: number;
    suppliersCount: number;
}

const PurchasesReport = () => {
    const { t } = useTranslation();

    document.title = `${t("reports.purchases.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [priceChanges, setPriceChanges] = useState<PriceFluctuation[]>([]);
    const [kpis, setKpis] = useState<PurchasesKpis>({
        totalPurchases: 0, totalSpent: 0, avgPurchaseAmount: 0, suppliersCount: 0,
    });
    const [monthlySpending, setMonthlySpending] = useState<any[]>([]);

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
                basePath: "reports/finance/purchases",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setPurchases(data.purchases || []);
            setPriceChanges(data.priceChanges || []);
            setKpis(data.kpis);
            setMonthlySpending(data.monthlySpending || []);
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
            basePath: "reports/finance/purchases",
            isGlobal,
            farmId,
            variant: "pdf",
            query: { start_date: pdfStart, end_date: pdfEnd, orientation: "landscape", format: "A4" },
        });
        const response = await configContext.axiosHelper.getBlob(url);
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, scopeKey]);

    const purchaseColumns: Column<PurchaseRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.supplier"), accessor: "supplier", type: "text", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("reports.col.quantity"), accessor: "quantity", type: "text",
            render: (v: number, row: PurchaseRecord) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.purchases.col.unitPrice"), accessor: "unitPrice", type: "currency" },
        { header: t("reports.col.total"), accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.col.invoice"), accessor: "invoiceNumber", type: "text" },
    ];

    const priceColumns: Column<PriceFluctuation>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.category"), accessor: "category", type: "text", isFilterable: true },
        { header: t("reports.purchases.col.currentPrice"), accessor: "currentPrice", type: "currency", bgColor: "#e3f2fd" },
        { header: t("reports.purchases.col.prevPrice"), accessor: "previousPrice", type: "currency" },
        {
            header: t("reports.purchases.col.variation"), accessor: "variation", type: "currency",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}${v?.toFixed(2)}
                </span>
            ),
        },
        {
            header: t("reports.purchases.col.variationPct"), accessor: "variationPercent", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}{v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const spendingTrendData = [{
        id: t("reports.purchases.kpi.totalSpent"),
        data: monthlySpending.map((m: any) => ({ x: m.month, y: m.totalSpent })),
    }];

    const spendingBarData = monthlySpending.map((m: any) => ({
        month: m.month,
        Compras: m.purchaseCount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.purchases.title")}
            pageTitle={t("reports.financial")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.purchases.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.purchases.kpi.totalPurchases")}
                        value={kpis.totalPurchases}
                        icon={<i className="ri-shopping-cart-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.purchases.kpi.totalSpent")}
                        value={kpis.totalSpent}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.purchases.kpi.avgPerPurchase")}
                        value={kpis.avgPurchaseAmount}
                        icon={<i className="ri-price-tag-3-line fs-4 text-info"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.purchases.kpi.suppliers")}
                        value={kpis.suppliersCount}
                        icon={<i className="ri-truck-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title={t("reports.purchases.chart.monthlySpending")}
                        data={spendingTrendData}
                        yLabel={t("reports.axis.expenseUsd")}
                        xLabel={t("reports.axis.month")}
                        height={280}
                        color="#ef4444"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title={t("reports.purchases.chart.purchasesByMonth")}
                        data={spendingBarData}
                        indexBy="month"
                        keys={["Compras"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.quantity")}
                        height={280}
                    />
                </Col>
            </Row>

            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-shopping-cart-line me-1"></i> {t("reports.purchases.tab.purchases")} ({purchases.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-up-down-line me-1"></i> {t("reports.purchases.tab.priceFluctuation")} ({priceChanges.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={purchaseColumns} data={purchases} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={priceColumns} data={priceChanges} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                    </TabContent>
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

export default PurchasesReport;
