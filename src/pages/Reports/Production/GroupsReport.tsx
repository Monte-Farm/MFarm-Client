import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { Column } from "common/data/data_types";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import classnames from "classnames";

interface GroupRecord {
    _id: string;
    name: string;
    stage: string;
    pigCount: number;
    avgWeight: number;
    entryDate: string;
    daysInStage: number;
}

interface GroupMovement {
    _id: string;
    date: string;
    groupName: string;
    movementType: string;
    quantity: number;
    origin: string;
    destination: string;
    observations: string;
}

interface GroupSummary {
    _id: string;
    groupName: string;
    entries: number;
    exits: number;
    deaths: number;
    currentCount: number;
    avgWeight: number;
    totalFeedConsumed: number;
}

interface GroupKpis {
    totalGroups: number;
    totalPigs: number;
    avgPigsPerGroup: number;
    totalMovements: number;
    avgDaysInStage: number;
    totalDeaths: number;
}

const GroupsReport = () => {
    const { t } = useTranslation();

    const stageLabels: Record<string, { label: string; color: string }> = {
        lactation: { label: t("reports.groups.stage.lactation"), color: "info" },
        weaning: { label: t("reports.groups.stage.weaning"), color: "primary" },
        growing: { label: t("reports.groups.stage.growing"), color: "success" },
        finishing: { label: t("reports.groups.stage.finishing"), color: "warning" },
        sold: { label: t("reports.groups.stage.sold"), color: "secondary" },
    };

    const movementLabels: Record<string, { label: string; color: string }> = {
        entry: { label: t("reports.groups.movement.entry"), color: "success" },
        exit: { label: t("reports.groups.movement.exit"), color: "warning" },
        transfer: { label: t("reports.groups.movement.transfer"), color: "info" },
        death: { label: t("reports.groups.movement.death"), color: "danger" },
        sale: { label: t("reports.groups.movement.sale"), color: "primary" },
    };

    document.title = `${t("reports.groups.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [movements, setMovements] = useState<GroupMovement[]>([]);
    const [summaries, setSummaries] = useState<GroupSummary[]>([]);
    const [kpis, setKpis] = useState<GroupKpis>({
        totalGroups: 0,
        totalPigs: 0,
        avgPigsPerGroup: 0,
        totalMovements: 0,
        avgDaysInStage: 0,
        totalDeaths: 0,
    });
    const [groupsByStage, setGroupsByStage] = useState<any[]>([]);

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
                basePath: "reports/production/groups",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setGroups(data.groups || []);
            setMovements(data.movements || []);
            setSummaries(data.summaries || []);
            setKpis(data.kpis);
            setGroupsByStage(data.groupsByStage || []);
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
            basePath: "reports/production/groups",
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

    const groupColumns: Column<GroupRecord>[] = [
        { header: t("reports.col.group"), accessor: "name", type: "text", isFilterable: true },
        {
            header: t("reports.col.stage"), accessor: "stage", type: "text",
            render: (value: string) => {
                const s = stageLabels[value] || { label: value, color: "secondary" };
                return <Badge color={s.color}>{s.label}</Badge>;
            },
        },
        { header: t("reports.groups.col.pigs"), accessor: "pigCount", type: "number", bgColor: "#e3f2fd" },
        {
            header: t("reports.groups.col.avgWeight"), accessor: "avgWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: t("reports.groups.col.entryDate"), accessor: "entryDate", type: "date" },
        {
            header: t("reports.groups.col.daysInStage"), accessor: "daysInStage", type: "number",
            render: (v: number) => <span>{v} dias</span>,
        },
    ];

    const movementColumns: Column<GroupMovement>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        {
            header: t("reports.col.type"), accessor: "movementType", type: "text",
            render: (value: string) => {
                const m = movementLabels[value] || { label: value, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        { header: t("reports.col.quantity"), accessor: "quantity", type: "number", bgColor: "#e3f2fd" },
        { header: t("reports.groups.col.origin"), accessor: "origin", type: "text" },
        { header: t("reports.groups.col.destination"), accessor: "destination", type: "text" },
        { header: t("reports.col.observations"), accessor: "observations", type: "text" },
    ];

    const summaryColumns: Column<GroupSummary>[] = [
        { header: t("reports.col.group"), accessor: "groupName", type: "text", isFilterable: true },
        { header: t("reports.groups.col.entries"), accessor: "entries", type: "number", bgColor: "#e8f5e9" },
        { header: t("reports.groups.col.exits"), accessor: "exits", type: "number", bgColor: "#fff3e0" },
        { header: t("reports.groups.col.deaths"), accessor: "deaths", type: "number", bgColor: "#ffebee" },
        { header: t("reports.groups.col.current"), accessor: "currentCount", type: "number", bgColor: "#e3f2fd" },
        {
            header: t("reports.groups.col.avgWeight"), accessor: "avgWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        {
            header: t("reports.groups.col.feed"), accessor: "totalFeedConsumed", type: "text",
            render: (v: number) => <span>{v?.toFixed(0)} kg</span>,
        },
    ];

    const stageBarData = groupsByStage.map((s: any) => ({
        stage: stageLabels[s.stage]?.label || s.stage,
        Grupos: s.groupCount,
        Cerdos: s.pigCount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.groups.title")}
            pageTitle={t("reports.production")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.groups.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.totalGroups")}
                        value={kpis.totalGroups}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.totalPigs")}
                        value={kpis.totalPigs}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.avgPerGroup")}
                        value={kpis.avgPigsPerGroup}
                        icon={<i className="ri-bar-chart-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.movements")}
                        value={kpis.totalMovements}
                        icon={<i className="ri-arrow-left-right-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.avgDaysInStage")}
                        value={kpis.avgDaysInStage}
                        icon={<i className="ri-calendar-line fs-4 text-secondary"></i>}
                        animateValue
                        decimals={0}
                        suffix=" dias"
                        iconBgColor="#F5F5F5"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.groups.kpi.deaths")}
                        value={kpis.totalDeaths}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
            </Row>

            {/* Chart */}
            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title={t("reports.groups.chart.groupsAndPigsByStage")}
                        data={stageBarData}
                        indexBy="stage"
                        keys={["Grupos", "Cerdos"]}
                        xLegend={t("reports.axis.stage")}
                        yLegend={t("reports.axis.quantity")}
                        height={280}
                    />
                </Col>
            </Row>

            {/* Tables */}
            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-group-line me-1"></i> {t("reports.groups.tab.stock")} ({groups.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-left-right-line me-1"></i> {t("reports.groups.tab.movements")} ({movements.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-file-list-3-line me-1"></i> {t("reports.groups.tab.summary")} ({summaries.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={groupColumns} data={groups} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={movementColumns} data={movements} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={summaryColumns} data={summaries} showSearchAndFilter rowsPerPage={15} />
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

export default GroupsReport;
