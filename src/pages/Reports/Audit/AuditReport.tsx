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
import classnames from "classnames";

interface ActivityRecord {
    _id: string;
    date: string;
    user: string;
    action: string;
    module: string;
    description: string;
    details: string;
}

interface InventoryAdjustment {
    _id: string;
    date: string;
    productName: string;
    warehouse: string;
    previousStock: number;
    newStock: number;
    difference: number;
    unit: string;
    reason: string;
    user: string;
}

interface PriceChangeRecord {
    _id: string;
    date: string;
    productName: string;
    previousPrice: number;
    newPrice: number;
    variation: number;
    variationPercent: number;
    user: string;
}

interface AuditKpis {
    totalActions: number;
    totalUsers: number;
    totalAdjustments: number;
    totalPriceChanges: number;
    mostActiveUser: string;
    mostActiveModule: string;
}

const AuditReport = () => {
    const { t } = useTranslation();

    const actionLabels: Record<string, { label: string; color: string }> = {
        create: { label: t("reports.audit.action.create"), color: "success" },
        update: { label: t("reports.audit.action.update"), color: "info" },
        delete: { label: t("reports.audit.action.delete"), color: "danger" },
        login: { label: t("reports.audit.action.login"), color: "primary" },
        export: { label: t("reports.audit.action.export"), color: "secondary" },
    };

    document.title = `${t("reports.audit.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
    const [priceChanges, setPriceChanges] = useState<PriceChangeRecord[]>([]);
    const [kpis, setKpis] = useState<AuditKpis>({
        totalActions: 0, totalUsers: 0, totalAdjustments: 0,
        totalPriceChanges: 0, mostActiveUser: "", mostActiveModule: "",
    });
    const [actionsByModule, setActionsByModule] = useState<any[]>([]);

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
                basePath: "reports/audit",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setActivities(data.activities || []);
            setAdjustments(data.adjustments || []);
            setPriceChanges(data.priceChanges || []);
            setKpis(data.kpis);
            setActionsByModule(data.actionsByModule || []);
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
            basePath: "reports/audit",
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

    const activityColumns: Column<ActivityRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.user"), accessor: "user", type: "text", isFilterable: true },
        {
            header: t("reports.audit.col.action"), accessor: "action", type: "text",
            render: (value: string) => {
                const a = actionLabels[value] || { label: value, color: "secondary" };
                return <Badge color={a.color}>{a.label}</Badge>;
            },
        },
        { header: t("reports.audit.col.module"), accessor: "module", type: "text", isFilterable: true },
        { header: t("reports.col.description"), accessor: "description", type: "text", isFilterable: true },
        { header: t("reports.col.details"), accessor: "details", type: "text" },
    ];

    const adjustmentColumns: Column<InventoryAdjustment>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.audit.col.prevStock"), accessor: "previousStock", type: "text",
            render: (v: number, row: InventoryAdjustment) => <span>{v} {row.unit}</span>,
        },
        {
            header: t("reports.audit.col.newStock"), accessor: "newStock", type: "text",
            render: (v: number, row: InventoryAdjustment) => <span>{v} {row.unit}</span>,
        },
        {
            header: t("reports.audit.col.difference"), accessor: "difference", type: "text", bgColor: "#fff8e1",
            render: (v: number, row: InventoryAdjustment) => (
                <span className={`fw-semibold ${v > 0 ? "text-success" : v < 0 ? "text-danger" : ""}`}>
                    {v > 0 ? "+" : ""}{v} {row.unit}
                </span>
            ),
        },
        { header: t("reports.col.reason"), accessor: "reason", type: "text" },
        { header: t("reports.col.user"), accessor: "user", type: "text" },
    ];

    const priceChangeColumns: Column<PriceChangeRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.audit.col.prevPrice"), accessor: "previousPrice", type: "currency" },
        { header: t("reports.audit.col.newPrice"), accessor: "newPrice", type: "currency", bgColor: "#e3f2fd" },
        {
            header: t("reports.audit.col.variation"), accessor: "variation", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}${v?.toFixed(2)}
                </span>
            ),
        },
        {
            header: t("reports.audit.col.variationPct"), accessor: "variationPercent", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}{v?.toFixed(1)}%
                </span>
            ),
        },
        { header: t("reports.col.user"), accessor: "user", type: "text" },
    ];

    const moduleBarData = actionsByModule.map((m: any) => ({
        modulo: m.module,
        Acciones: m.count,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.audit.title")}
            pageTitle={t("reports.title")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.audit.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.totalActions")}
                        value={kpis.totalActions}
                        icon={<i className="ri-history-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.activeUsers")}
                        value={kpis.totalUsers}
                        icon={<i className="ri-user-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.invAdjustments")}
                        value={kpis.totalAdjustments}
                        icon={<i className="ri-equalizer-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.priceChanges")}
                        value={kpis.totalPriceChanges}
                        icon={<i className="ri-price-tag-3-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.mostActiveUser")}
                        value={kpis.mostActiveUser || "—"}
                        icon={<i className="ri-user-star-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.audit.kpi.mostActiveModule")}
                        value={kpis.mostActiveModule || "—"}
                        icon={<i className="ri-layout-grid-line fs-4 text-secondary"></i>}
                        iconBgColor="#F5F5F5"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title={t("reports.audit.chart.actionsByModule")}
                        data={moduleBarData}
                        indexBy="modulo"
                        keys={["Acciones"]}
                        xLegend={t("reports.axis.module")}
                        yLegend={t("reports.axis.actions")}
                        height={250}
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
                                <i className="ri-history-line me-1"></i> {t("reports.audit.tab.history")} ({activities.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-equalizer-line me-1"></i> {t("reports.audit.tab.adjustments")} ({adjustments.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-price-tag-3-line me-1"></i> {t("reports.audit.tab.priceChanges")} ({priceChanges.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={activityColumns} data={activities} showSearchAndFilter rowsPerPage={20} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={adjustmentColumns} data={adjustments} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={priceChangeColumns} data={priceChanges} showSearchAndFilter rowsPerPage={15} />
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

export default AuditReport;
