import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
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

interface SaleRecord {
    _id: string;
    saleDate: string;
    code: string;
    buyer: string;
    pigCount: number;
    totalWeight: number;
    pricePerKg: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
}

interface SaleByClient {
    clientName: string;
    totalSales: number;
    totalPigs: number;
    totalWeight: number;
    totalAmount: number;
    avgPricePerKg: number;
    avgPricePerPig: number;
}

interface SaleByPeriod {
    period: string;
    salesCount: number;
    totalPigs: number;
    totalWeight: number;
    totalAmount: number;
    avgPricePerKg: number;
}

interface SalesKpis {
    totalSales: number;
    totalRevenue: number;
    totalPigsSold: number;
    totalWeightSold: number;
    avgPricePerPig: number;
    avgPricePerKg: number;
}

const SalesReport = () => {
    const { t } = useTranslation();
    document.title = "Reporte de Ventas | Reportes";

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [byClient, setByClient] = useState<SaleByClient[]>([]);
    const [byPeriod, setByPeriod] = useState<SaleByPeriod[]>([]);
    const [kpis, setKpis] = useState<SalesKpis>({
        totalSales: 0, totalRevenue: 0, totalPigsSold: 0,
        totalWeightSold: 0, avgPricePerPig: 0, avgPricePerKg: 0,
    });
    const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [startDate, setStartDate] = useState(monthStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(monthEnd.toISOString().split("T")[0]);

    const paymentMethodLabels: Record<string, string> = {
        cash: t("reports.sales.paymentMethod.cash"),
        transfer: t("reports.sales.paymentMethod.transfer"),
        check: t("reports.sales.paymentMethod.check"),
        credit: t("reports.sales.paymentMethod.credit"),
        other: t("reports.sales.paymentMethod.other"),
    };

    const paymentStatusLabels: Record<string, { label: string; color: string }> = {
        pending: { label: t("reports.sales.paymentStatus.pending"), color: "warning" },
        partial: { label: t("reports.sales.paymentStatus.partial"), color: "info" },
        completed: { label: t("reports.sales.paymentStatus.completed"), color: "success" },
    };

    const fetchData = async () => {
        if (!configContext) return;
        setLoading(true);
        try {
            const url = buildReportUrl({
                apiUrl: configContext.apiUrl,
                basePath: "reports/sales/overview",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setSales(data.sales || []);
            setByClient(data.byClient || []);
            setByPeriod(data.byPeriod || []);
            setKpis(data.kpis);
            setMonthlyTrend(data.monthlyTrend || []);
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
            basePath: "reports/sales/overview",
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

    const saleColumns: Column<SaleRecord>[] = [
        { header: t("reports.col.date"), accessor: "saleDate", type: "date", isFilterable: true },
        { header: t("reports.sales.col.code"), accessor: "code", type: "text", isFilterable: true },
        { header: t("reports.sales.col.buyer"), accessor: "buyer", type: "text", isFilterable: true },
        { header: t("reports.col.pigs"), accessor: "pigCount", type: "number", bgColor: "#e3f2fd" },
        {
            header: t("reports.sales.col.totalWeight"), accessor: "totalWeight", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.sales.col.pricePerKg"), accessor: "pricePerKg", type: "currency" },
        { header: t("reports.sales.col.totalAmount"), accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        {
            header: t("reports.sales.col.method"), accessor: "paymentMethod", type: "text",
            render: (v: string) => <span>{paymentMethodLabels[v] || v}</span>,
        },
        {
            header: t("reports.col.status"), accessor: "paymentStatus", type: "text",
            render: (v: string) => {
                const s = paymentStatusLabels[v] || { label: v, color: "secondary" };
                return <Badge color={s.color}>{s.label}</Badge>;
            },
        },
    ];

    const clientColumns: Column<SaleByClient>[] = [
        { header: t("reports.col.name"), accessor: "clientName", type: "text", isFilterable: true },
        { header: t("reports.sales.col.salesCount"), accessor: "totalSales", type: "number" },
        { header: t("reports.col.pigs"), accessor: "totalPigs", type: "number" },
        {
            header: t("reports.sales.col.totalWeight"), accessor: "totalWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.sales.col.totalAmount"), accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.sales.col.avgPricePerKg"), accessor: "avgPricePerKg", type: "currency", bgColor: "#e3f2fd" },
        { header: t("reports.sales.col.avgPricePerPig"), accessor: "avgPricePerPig", type: "currency" },
    ];

    const periodColumns: Column<SaleByPeriod>[] = [
        { header: t("reports.col.period"), accessor: "period", type: "text" },
        { header: t("reports.sales.col.salesCount"), accessor: "salesCount", type: "number" },
        { header: t("reports.col.pigs"), accessor: "totalPigs", type: "number" },
        {
            header: t("reports.sales.col.totalWeight"), accessor: "totalWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.sales.col.totalAmount"), accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        { header: t("reports.sales.col.avgPricePerKg"), accessor: "avgPricePerKg", type: "currency", bgColor: "#e3f2fd" },
    ];

    const revenueTrendData = [{
        id: "Ingresos",
        data: monthlyTrend.map((m: any) => ({ x: m.month, y: m.totalAmount })),
    }];

    const pigsSoldBarData = monthlyTrend.map((m: any) => ({
        month: m.month,
        "Cerdos Vendidos": m.pigCount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.sales.title")}
            pageTitle={t("reports.sales")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Ventas"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.totalSales")}
                        value={kpis.totalSales}
                        icon={<i className="ri-shopping-bag-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.totalRevenue")}
                        value={kpis.totalRevenue}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.pigsSold")}
                        value={kpis.totalPigsSold}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.weightSold")}
                        value={kpis.totalWeightSold}
                        icon={<i className="ri-scales-3-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={0}
                        suffix=" kg"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.avgPricePerPig")}
                        value={kpis.avgPricePerPig}
                        icon={<i className="ri-price-tag-3-line fs-4 text-primary"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.sales.kpi.avgPricePerKg")}
                        value={kpis.avgPricePerKg}
                        icon={<i className="ri-price-tag-3-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title={t("reports.sales.chart.revenueTrend")}
                        data={revenueTrendData}
                        yLabel={t("reports.axis.incomeUsd")}
                        xLabel={t("reports.axis.month")}
                        height={280}
                        color="#10b981"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title={t("reports.sales.chart.pigsByMonth")}
                        data={pigsSoldBarData}
                        indexBy="month"
                        keys={["Cerdos Vendidos"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.quantity")}
                        height={280}
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
                                <i className="ri-file-list-3-line me-1"></i> {t("reports.sales.tab.allSales")} ({sales.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-user-line me-1"></i> {t("reports.sales.tab.byClient")} ({byClient.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-calendar-line me-1"></i> {t("reports.sales.tab.byPeriod")} ({byPeriod.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={saleColumns} data={sales} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={clientColumns} data={byClient} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={periodColumns} data={byPeriod} showSearchAndFilter={false} showPagination={false} />
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

export default SalesReport;
