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
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import classnames from "classnames";

interface ProductValuation {
    productName: string;
    category: string;
    warehouse: string;
    currentStock: number;
    unit: string;
    avgCost: number;
    totalValue: number;
}

interface CostByProduct {
    productName: string;
    category: string;
    avgCost: number;
    minCost: number;
    maxCost: number;
    lastCost: number;
    unit: string;
    priceVariation: number;
}

interface ValuationKpis {
    totalInventoryValue: number;
    totalProducts: number;
    avgCostPerProduct: number;
    highestValueProduct: string;
    highestValueAmount: number;
    totalCategories: number;
}

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280"];

const InventoryValuationReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.invValuation.title")} | ${t("reports.inventory")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [valuation, setValuation] = useState<ProductValuation[]>([]);
    const [costs, setCosts] = useState<CostByProduct[]>([]);
    const [kpis, setKpis] = useState<ValuationKpis>({
        totalInventoryValue: 0, totalProducts: 0, avgCostPerProduct: 0,
        highestValueProduct: "", highestValueAmount: 0, totalCategories: 0,
    });
    const [valueByCategory, setValueByCategory] = useState<any[]>([]);

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
                basePath: "reports/inventory/valuation",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setValuation(data.valuation || []);
            setCosts(data.costs || []);
            setKpis(data.kpis);
            setValueByCategory(data.valueByCategory || []);
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
            basePath: "reports/inventory/valuation",
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

    const valuationColumns: Column<ProductValuation>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.category"), accessor: "category", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.invValuation.col.stock"), accessor: "currentStock", type: "text",
            render: (v: number, row: ProductValuation) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.invValuation.col.avgCost"), accessor: "avgCost", type: "currency", bgColor: "#e3f2fd" },
        { header: t("reports.invValuation.col.totalValue"), accessor: "totalValue", type: "currency", bgColor: "#e8f5e9" },
    ];

    const costColumns: Column<CostByProduct>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.category"), accessor: "category", type: "text", isFilterable: true },
        { header: t("reports.invValuation.col.avgCost"), accessor: "avgCost", type: "currency", bgColor: "#e3f2fd" },
        { header: t("reports.invValuation.col.minCost"), accessor: "minCost", type: "currency" },
        { header: t("reports.invValuation.col.maxCost"), accessor: "maxCost", type: "currency" },
        { header: t("reports.invValuation.col.lastCost"), accessor: "lastCost", type: "currency" },
        {
            header: t("reports.invValuation.col.variation"), accessor: "priceVariation", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}{v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const donutData: DonutDataItem[] = valueByCategory.map((c: any, i: number) => ({
        id: c.category,
        label: c.category,
        value: c.totalValue,
        color: categoryColors[i % categoryColors.length],
    }));

    const totalVal = valueByCategory.reduce((acc: number, c: any) => acc + c.totalValue, 0);
    const donutLegend: DonutLegendItem[] = valueByCategory.map((c: any) => ({
        label: c.category,
        value: `$${c.totalValue?.toLocaleString()}`,
        percentage: totalVal > 0 ? `${((c.totalValue / totalVal) * 100).toFixed(1)}%` : "0%",
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.invValuation.title")}
            pageTitle={t("reports.inventory")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.invValuation.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invValuation.kpi.totalValue")}
                        value={kpis.totalInventoryValue}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invValuation.kpi.totalProducts")}
                        value={kpis.totalProducts}
                        icon={<i className="ri-box-3-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invValuation.kpi.avgCostPerProduct")}
                        value={kpis.avgCostPerProduct}
                        icon={<i className="ri-price-tag-3-line fs-4 text-info"></i>}
                        animateValue
                        decimals={2}
                        prefix="$"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invValuation.kpi.categories")}
                        value={kpis.totalCategories}
                        icon={<i className="ri-folder-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={4} md={8}>
                    <StatKpiCard
                        title={t("reports.invValuation.kpi.highestValue")}
                        value={kpis.highestValueAmount}
                        subtext={kpis.highestValueProduct}
                        icon={<i className="ri-vip-crown-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <DonutChartCard
                        title={t("reports.invValuation.chart.byCategory")}
                        data={donutData}
                        legendItems={donutLegend}
                        height={200}
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
                                <i className="ri-money-dollar-circle-line me-1"></i> {t("reports.invValuation.tab.byProduct")} ({valuation.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-price-tag-3-line me-1"></i> {t("reports.invValuation.tab.avgCost")} ({costs.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={valuationColumns} data={valuation} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={costColumns} data={costs} showSearchAndFilter rowsPerPage={15} />
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

export default InventoryValuationReport;
