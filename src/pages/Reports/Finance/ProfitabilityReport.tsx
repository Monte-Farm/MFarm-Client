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

interface CostVsIncome {
    month: string;
    totalCost: number;
    totalIncome: number;
    profit: number;
    margin: number;
}

interface UtilityByGroup {
    groupName: string;
    stage: string;
    totalCost: number;
    totalIncome: number;
    profit: number;
    margin: number;
    pigCount: number;
    profitPerPig: number;
}

interface UtilityBySale {
    _id: string;
    saleDate: string;
    buyer: string;
    pigCount: number;
    totalWeight: number;
    totalIncome: number;
    totalCost: number;
    profit: number;
    margin: number;
}

interface MarginByClient {
    clientName: string;
    totalSales: number;
    totalIncome: number;
    totalCost: number;
    profit: number;
    margin: number;
    avgMargin: number;
}

interface ProfitabilityKpis {
    totalIncome: number;
    totalCost: number;
    totalProfit: number;
    overallMargin: number;
    bestGroupMargin: number;
    bestGroupName: string;
}

const ProfitabilityReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.profitability.title")} | ${t("reports.title")} | ${t("systemName")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [costVsIncome, setCostVsIncome] = useState<CostVsIncome[]>([]);
    const [byGroup, setByGroup] = useState<UtilityByGroup[]>([]);
    const [bySale, setBySale] = useState<UtilityBySale[]>([]);
    const [byClient, setByClient] = useState<MarginByClient[]>([]);
    const [kpis, setKpis] = useState<ProfitabilityKpis>({
        totalIncome: 0, totalCost: 0, totalProfit: 0,
        overallMargin: 0, bestGroupMargin: 0, bestGroupName: "",
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
                basePath: "reports/finance/profitability",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setCostVsIncome(data.costVsIncome || []);
            setByGroup(data.byGroup || []);
            setBySale(data.bySale || []);
            setByClient(data.byClient || []);
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
            basePath: "reports/finance/profitability",
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

    const costVsIncomeColumns: Column<CostVsIncome>[] = [
        { header: t("reports.col.month"), accessor: "month", type: "text" },
        { header: t("reports.profitability.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        { header: t("reports.profitability.col.totalIncome"), accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        {
            header: t("reports.profitability.col.profit"), accessor: "profit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: t("reports.profitability.col.marginPct"), accessor: "margin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const groupColumns: Column<UtilityByGroup>[] = [
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        { header: t("reports.col.stage"), accessor: "stage", type: "text" },
        { header: t("reports.col.pigs"), accessor: "pigCount", type: "number" },
        { header: t("reports.profitability.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        { header: t("reports.profitability.col.totalIncome"), accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        {
            header: t("reports.profitability.col.profit"), accessor: "profit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: t("reports.profitability.col.marginPct"), accessor: "margin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
        { header: t("reports.profitability.col.profitPerPig"), accessor: "profitPerPig", type: "currency" },
    ];

    const saleColumns: Column<UtilityBySale>[] = [
        { header: t("reports.col.date"), accessor: "saleDate", type: "date", isFilterable: true },
        { header: t("reports.col.buyer"), accessor: "buyer", type: "text", isFilterable: true },
        { header: t("reports.col.pigs"), accessor: "pigCount", type: "number" },
        {
            header: t("reports.profitability.col.totalWeight"), accessor: "totalWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.profitability.col.totalIncome"), accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.profitability.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: t("reports.profitability.col.profit"), accessor: "profit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: t("reports.profitability.col.marginPct"), accessor: "margin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const clientColumns: Column<MarginByClient>[] = [
        { header: t("reports.col.client"), accessor: "clientName", type: "text", isFilterable: true },
        { header: t("reports.col.sales"), accessor: "totalSales", type: "number" },
        { header: t("reports.profitability.col.totalIncome"), accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.profitability.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: t("reports.profitability.col.profit"), accessor: "profit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: t("reports.profitability.col.avgMarginPct"), accessor: "avgMargin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    // Charts
    const trendData = [
        { id: "Ingreso", data: costVsIncome.map(c => ({ x: c.month, y: c.totalIncome })), color: "#10b981" },
        { id: "Costo", data: costVsIncome.map(c => ({ x: c.month, y: c.totalCost })), color: "#ef4444" },
    ];

    const profitBarData = costVsIncome.map(c => ({
        month: c.month,
        Utilidad: c.profit,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.profitability.title")}
            pageTitle={t("reports.financial")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.profitability.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.profitability.kpi.totalIncome")}
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
                        title={t("reports.profitability.kpi.totalCost")}
                        value={kpis.totalCost}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.profitability.kpi.profit")}
                        value={kpis.totalProfit}
                        icon={<i className="ri-money-dollar-box-line fs-4 text-primary"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.profitability.kpi.overallMargin")}
                        value={kpis.overallMargin}
                        icon={<i className="ri-percent-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={4} md={8}>
                    <StatKpiCard
                        title={t("reports.profitability.kpi.bestGroup")}
                        value={kpis.bestGroupMargin}
                        subtext={kpis.bestGroupName}
                        icon={<i className="ri-trophy-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <BasicLineChartCard
                        title={t("reports.profitability.chart.incomeVsCost")}
                        data={trendData}
                        yLabel={t("reports.axis.amountUsd")}
                        xLabel={t("reports.axis.month")}
                        height={300}
                        showLegend
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title={t("reports.profitability.chart.profitByMonth")}
                        data={profitBarData}
                        indexBy="month"
                        keys={["Utilidad"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.profitUsd")}
                        height={300}
                        colors={["#3b82f6"]}
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
                                <i className="ri-arrow-up-down-line me-1"></i> {t("reports.profitability.tab.costVsIncome")}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-group-line me-1"></i> {t("reports.profitability.tab.byGroup")} ({byGroup.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-shopping-bag-line me-1"></i> {t("reports.profitability.tab.bySale")} ({bySale.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => setActiveTab("4")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-user-star-line me-1"></i> {t("reports.profitability.tab.byClient")} ({byClient.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={costVsIncomeColumns} data={costVsIncome} showSearchAndFilter={false} showPagination={false} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={groupColumns} data={byGroup} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={saleColumns} data={bySale} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="4">
                            <CustomTable columns={clientColumns} data={byClient} showSearchAndFilter rowsPerPage={15} />
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

export default ProfitabilityReport;
