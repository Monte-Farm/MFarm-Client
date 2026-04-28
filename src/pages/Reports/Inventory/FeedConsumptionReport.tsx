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

interface ConsumptionByGroup {
    groupName: string;
    stage: string;
    pigCount: number;
    totalConsumed: number;
    avgPerPig: number;
    unit: string;
}

interface ConsumptionByPhase {
    phase: string;
    productName: string;
    totalConsumed: number;
    groupCount: number;
    avgPerGroup: number;
    unit: string;
}

interface ConsumptionByDay {
    date: string;
    totalConsumed: number;
    groupsActive: number;
    avgPerGroup: number;
    unit: string;
}

interface FeedConsumptionKpis {
    totalConsumed: number;
    avgPerDay: number;
    avgPerPig: number;
    avgPerGroup: number;
    groupsWithConsumption: number;
    mostConsumedProduct: string;
}

const FeedConsumptionReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.feedConsumption.title")} | ${t("reports.inventory")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [byGroup, setByGroup] = useState<ConsumptionByGroup[]>([]);
    const [byPhase, setByPhase] = useState<ConsumptionByPhase[]>([]);
    const [byDay, setByDay] = useState<ConsumptionByDay[]>([]);
    const [kpis, setKpis] = useState<FeedConsumptionKpis>({
        totalConsumed: 0, avgPerDay: 0, avgPerPig: 0,
        avgPerGroup: 0, groupsWithConsumption: 0, mostConsumedProduct: "",
    });
    const [dailyTrend, setDailyTrend] = useState<any[]>([]);

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
                basePath: "reports/inventory/feed-consumption",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setByGroup(data.byGroup || []);
            setByPhase(data.byPhase || []);
            setByDay(data.byDay || []);
            setKpis(data.kpis);
            setDailyTrend(data.dailyTrend || []);
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
            basePath: "reports/inventory/feed-consumption",
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

    const groupColumns: Column<ConsumptionByGroup>[] = [
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        { header: t("reports.col.stage"), accessor: "stage", type: "text" },
        { header: t("reports.col.pigs"), accessor: "pigCount", type: "number" },
        {
            header: t("reports.feedConsumption.col.totalConsumed"), accessor: "totalConsumed", type: "text", bgColor: "#e8f5e9",
            render: (v: number, row: ConsumptionByGroup) => <span className="fw-semibold">{v?.toLocaleString()} {row.unit}</span>,
        },
        {
            header: t("reports.feedConsumption.col.avgPerPig"), accessor: "avgPerPig", type: "text", bgColor: "#e3f2fd",
            render: (v: number, row: ConsumptionByGroup) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
    ];

    const phaseColumns: Column<ConsumptionByPhase>[] = [
        { header: t("reports.feedConsumption.col.phase"), accessor: "phase", type: "text", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("reports.feedConsumption.col.totalConsumed"), accessor: "totalConsumed", type: "text", bgColor: "#e8f5e9",
            render: (v: number, row: ConsumptionByPhase) => <span className="fw-semibold">{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.col.group") + "s", accessor: "groupCount", type: "number" },
        {
            header: t("reports.feedConsumption.col.avgPerGroup"), accessor: "avgPerGroup", type: "text", bgColor: "#e3f2fd",
            render: (v: number, row: ConsumptionByPhase) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
    ];

    const dayColumns: Column<ConsumptionByDay>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        {
            header: t("reports.feedConsumption.col.totalConsumed"), accessor: "totalConsumed", type: "text", bgColor: "#e8f5e9",
            render: (v: number, row: ConsumptionByDay) => <span className="fw-semibold">{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: t("reports.feedConsumption.col.groupsActive"), accessor: "groupsActive", type: "number" },
        {
            header: t("reports.feedConsumption.col.avgPerGroup"), accessor: "avgPerGroup", type: "text", bgColor: "#e3f2fd",
            render: (v: number, row: ConsumptionByDay) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
    ];

    const trendData = [{
        id: "Consumo diario",
        data: dailyTrend.map((d: any) => ({ x: d.date, y: d.totalConsumed })),
    }];

    const groupBarData = byGroup.slice(0, 15).map(g => ({
        grupo: g.groupName,
        "Consumo Total": g.totalConsumed,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.feedConsumption.title")}
            pageTitle={t("reports.inventory")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.feedConsumption.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.totalConsumed")}
                        value={kpis.totalConsumed}
                        icon={<i className="ri-plant-line fs-4 text-success"></i>}
                        animateValue
                        suffix=" kg"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.avgPerDay")}
                        value={kpis.avgPerDay}
                        icon={<i className="ri-calendar-line fs-4 text-primary"></i>}
                        animateValue
                        decimals={1}
                        suffix=" kg"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.avgPerPig")}
                        value={kpis.avgPerPig}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        animateValue
                        decimals={2}
                        suffix=" kg"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.avgPerGroup")}
                        value={kpis.avgPerGroup}
                        icon={<i className="ri-group-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={1}
                        suffix=" kg"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.groupsWithConsumption")}
                        value={kpis.groupsWithConsumption}
                        icon={<i className="ri-bar-chart-line fs-4 text-secondary"></i>}
                        animateValue
                        iconBgColor="#F5F5F5"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.feedConsumption.kpi.mainProduct")}
                        value={kpis.mostConsumedProduct || "—"}
                        icon={<i className="ri-star-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title={t("reports.feedConsumption.chart.dailyTrend")}
                        data={trendData}
                        yLabel={`${t("reports.feedConsumption.kpi.totalConsumed")} (${t("reports.axis.kg")})`}
                        xLabel={t("reports.feedConsumption.tab.byDay")}
                        height={280}
                        color="#10b981"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title={t("reports.feedConsumption.chart.byGroup")}
                        data={groupBarData}
                        indexBy="grupo"
                        keys={["Consumo Total"]}
                        xLegend={t("reports.axis.group")}
                        yLegend={t("reports.axis.kg")}
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
                                <i className="ri-group-line me-1"></i> {t("reports.feedConsumption.tab.byGroup")} ({byGroup.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-stack-line me-1"></i> {t("reports.feedConsumption.tab.byPhase")} ({byPhase.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-calendar-line me-1"></i> {t("reports.feedConsumption.tab.byDay")} ({byDay.length})
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
                            <CustomTable columns={phaseColumns} data={byPhase} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={dayColumns} data={byDay} showSearchAndFilter rowsPerPage={15} />
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

export default FeedConsumptionReport;
