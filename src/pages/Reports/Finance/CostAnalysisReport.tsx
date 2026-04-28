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
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import classnames from "classnames";

interface CostByGroup {
    groupName: string;
    stage: string;
    pigCount: number;
    feedCost: number;
    medicationCost: number;
    otherCost: number;
    totalCost: number;
    costPerPig: number;
}

interface CostByPig {
    pigIdentifier: string;
    groupName: string;
    feedCost: number;
    medicationCost: number;
    otherCost: number;
    totalCost: number;
    currentWeight: number;
    costPerKg: number;
}

interface CostByType {
    type: string;
    totalCost: number;
    percentage: number;
    itemCount: number;
}

interface CostAnalysisKpis {
    totalCost: number;
    avgCostPerGroup: number;
    avgCostPerPig: number;
    avgCostPerKg: number;
    feedCostPercent: number;
    medicationCostPercent: number;
}

const typeColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const CostAnalysisReport = () => {
    const { t } = useTranslation();
    document.title = "Analisis de Costos | Reportes";

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [byGroup, setByGroup] = useState<CostByGroup[]>([]);
    const [byPig, setByPig] = useState<CostByPig[]>([]);
    const [byType, setByType] = useState<CostByType[]>([]);
    const [kpis, setKpis] = useState<CostAnalysisKpis>({
        totalCost: 0, avgCostPerGroup: 0, avgCostPerPig: 0,
        avgCostPerKg: 0, feedCostPercent: 0, medicationCostPercent: 0,
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
                basePath: "reports/finance/costs",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setByGroup(data.byGroup || []);
            setByPig(data.byPig || []);
            setByType(data.byType || []);
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
            basePath: "reports/finance/costs",
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

    const groupColumns: Column<CostByGroup>[] = [
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        { header: t("reports.col.stage"), accessor: "stage", type: "text" },
        { header: t("reports.col.pigs"), accessor: "pigCount", type: "number" },
        { header: t("reports.costAnalysis.col.feed"), accessor: "feedCost", type: "currency" },
        { header: t("reports.costAnalysis.col.medication"), accessor: "medicationCost", type: "currency" },
        { header: t("reports.costAnalysis.col.other"), accessor: "otherCost", type: "currency" },
        { header: t("reports.costAnalysis.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        { header: t("reports.costAnalysis.col.costPerPig"), accessor: "costPerPig", type: "currency", bgColor: "#e3f2fd" },
    ];

    const pigColumns: Column<CostByPig>[] = [
        { header: t("reports.col.pigs"), accessor: "pigIdentifier", type: "text", isFilterable: true },
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        { header: t("reports.costAnalysis.col.feed"), accessor: "feedCost", type: "currency" },
        { header: t("reports.costAnalysis.col.medication"), accessor: "medicationCost", type: "currency" },
        { header: t("reports.costAnalysis.col.other"), accessor: "otherCost", type: "currency" },
        { header: t("reports.costAnalysis.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: t("reports.costAnalysis.col.currentWeight"), accessor: "currentWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.costAnalysis.col.costPerKg"), accessor: "costPerKg", type: "currency", bgColor: "#e3f2fd" },
    ];

    const typeColumns: Column<CostByType>[] = [
        { header: t("reports.col.type"), accessor: "type", type: "text" },
        { header: t("reports.costAnalysis.col.totalCost"), accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: t("reports.col.percentage"), accessor: "percentage", type: "text",
            render: (v: number) => <span className="fw-semibold">{v?.toFixed(1)}%</span>,
        },
        { header: t("reports.costAnalysis.col.records"), accessor: "itemCount", type: "number" },
    ];

    const donutData: DonutDataItem[] = byType.map((item, i) => ({
        id: item.type, label: item.type, value: item.totalCost,
        color: typeColors[i % typeColors.length],
    }));

    const donutLegend: DonutLegendItem[] = byType.map(item => ({
        label: item.type, value: `$${item.totalCost?.toLocaleString()}`,
        percentage: `${item.percentage?.toFixed(1)}%`,
    }));

    const groupBarData = byGroup.slice(0, 12).map(g => ({
        grupo: g.groupName,
        Alimento: g.feedCost,
        Medicamento: g.medicationCost,
        Otros: g.otherCost,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.costAnalysis.title")}
            pageTitle={t("reports.financial")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.costAnalysis.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.totalCost")}
                        value={kpis.totalCost}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.costPerGroup")}
                        value={kpis.avgCostPerGroup}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.costPerPig")}
                        value={kpis.avgCostPerPig}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.costPerKg")}
                        value={kpis.avgCostPerKg}
                        icon={<i className="ri-scales-3-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.feedPct")}
                        value={kpis.feedCostPercent}
                        icon={<i className="ri-plant-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.costAnalysis.kpi.medicationPct")}
                        value={kpis.medicationCostPercent}
                        icon={<i className="mdi mdi-heart-pulse fs-4 text-danger"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#FFEBEE"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={8}>
                    <BasicBarChart
                        title={t("reports.costAnalysis.chart.costByGroup")}
                        data={groupBarData}
                        indexBy="grupo"
                        keys={["Alimento", "Medicamento", "Otros"]}
                        xLegend={t("reports.axis.group")}
                        yLegend={t("reports.axis.costUsd")}
                        height={300}
                        colors={["#3b82f6", "#ef4444", "#6b7280"]}
                    />
                </Col>
                <Col xl={4}>
                    <DonutChartCard
                        title={t("reports.costAnalysis.chart.byType")}
                        data={donutData}
                        legendItems={donutLegend}
                        height={180}
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
                                <i className="ri-group-line me-1"></i> {t("reports.costAnalysis.tab.byGroup")} ({byGroup.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bxs-dog me-1"></i> {t("reports.costAnalysis.tab.byPig")} ({byPig.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-pie-chart-line me-1"></i> {t("reports.costAnalysis.tab.byType")} ({byType.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={groupColumns} data={byGroup} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={pigColumns} data={byPig} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={typeColumns} data={byType} showSearchAndFilter={false} showPagination={false} />
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

export default CostAnalysisReport;
