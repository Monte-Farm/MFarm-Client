import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ReportPageLayout from "Components/Common/Shared/ReportPageLayout";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import classnames from "classnames";
import { useReportScope } from "hooks/useReportScope";
import { buildReportUrl } from "helpers/reports_url_helper";

interface InseminationRecord {
    _id: string;
    date: string;
    sowIdentifier: string;
    boarOrSample: string;
    technician: string;
    result: string;
    observations: string;
}

interface BirthRecord {
    _id: string;
    date: string;
    sowIdentifier: string;
    bornAlive: number;
    bornDead: number;
    mummified: number;
    totalBorn: number;
    observations: string;
}

interface ReportKpis {
    totalInseminations: number;
    successfulInseminations: number;
    effectivenessRate: number;
    totalBirths: number;
    avgBornAlive: number;
    avgBornDead: number;
    totalBornAlive: number;
    totalBornDead: number;
}

const InseminationsBirthsReport = () => {
    const { t } = useTranslation();

    const resultLabels: Record<string, { label: string; color: string }> = {
        success: { label: t("reports.inseminationsBirths.result.success"), color: "success" },
        pending: { label: t("reports.inseminationsBirths.result.pending"), color: "warning" },
        failed: { label: t("reports.inseminationsBirths.result.failed"), color: "danger" },
    };

    document.title = `${t("reports.inseminationsBirths.title")} | ${t("reports.title")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [inseminations, setInseminations] = useState<InseminationRecord[]>([]);
    const [births, setBirths] = useState<BirthRecord[]>([]);
    const [kpis, setKpis] = useState<ReportKpis>({
        totalInseminations: 0,
        successfulInseminations: 0,
        effectivenessRate: 0,
        totalBirths: 0,
        avgBornAlive: 0,
        avgBornDead: 0,
        totalBornAlive: 0,
        totalBornDead: 0,
    });
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

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
                basePath: "reports/production/inseminations-births",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setInseminations(data.inseminations || []);
            setBirths(data.births || []);
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
        const url = buildReportUrl({
            apiUrl: configContext.apiUrl,
            basePath: "reports/production/inseminations-births",
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

    const inseminationColumns: Column<InseminationRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.sow"), accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: t("reports.inseminationsBirths.col.boarOrSample"), accessor: "boarOrSample", type: "text", isFilterable: true },
        { header: t("reports.inseminationsBirths.col.technician"), accessor: "technician", type: "text", isFilterable: true },
        {
            header: t("reports.inseminationsBirths.col.result"),
            accessor: "result",
            type: "text",
            render: (value: string) => {
                const r = resultLabels[value] || { label: value, color: "secondary" };
                return <Badge color={r.color}>{r.label}</Badge>;
            },
        },
        { header: t("reports.col.observations"), accessor: "observations", type: "text" },
    ];

    const birthColumns: Column<BirthRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.sow"), accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: t("reports.inseminationsBirths.col.bornAlive"), accessor: "bornAlive", type: "number", bgColor: "#e8f5e9" },
        { header: t("reports.inseminationsBirths.col.bornDead"), accessor: "bornDead", type: "number", bgColor: "#ffebee" },
        { header: t("reports.inseminationsBirths.col.mummified"), accessor: "mummified", type: "number" },
        { header: t("reports.col.total"), accessor: "totalBorn", type: "number", bgColor: "#e3f2fd" },
        { header: t("reports.col.observations"), accessor: "observations", type: "text" },
    ];

    const birthsBarData = monthlyData.map((m: any) => ({
        month: m.month,
        "Nacidos Vivos": m.bornAlive,
        "Nacidos Muertos": m.bornDead,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.inseminationsBirths.title")}
            pageTitle={t("reports.production")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.inseminationsBirths.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.inseminationsBirths.kpi.totalInseminations")}
                        value={kpis.totalInseminations}
                        icon={<i className="ri-heart-pulse-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.inseminationsBirths.kpi.effectiveness")}
                        value={kpis.effectivenessRate}
                        icon={<i className="ri-check-double-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.inseminationsBirths.kpi.totalBirths")}
                        value={kpis.totalBirths}
                        icon={<i className="mdi mdi-baby-bottle-outline fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.inseminationsBirths.kpi.avgBornAlive")}
                        value={kpis.avgBornAlive}
                        icon={<i className="ri-heart-2-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix=" / parto"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            {/* Chart - Births by month */}
            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title={t("reports.inseminationsBirths.chart.bornAliveVsDead")}
                        data={birthsBarData}
                        indexBy="month"
                        keys={["Nacidos Vivos", "Nacidos Muertos"]}
                        xLegend={t("reports.axis.month")}
                        yLegend={t("reports.axis.quantity")}
                        height={280}
                        colors={["#10b981", "#ef4444"]}
                    />
                </Col>
            </Row>

            {/* Tables with tabs */}
            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-heart-pulse-line me-1"></i> {t("reports.inseminationsBirths.tab.inseminations")} ({inseminations.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="mdi mdi-baby-bottle-outline me-1"></i> {t("reports.inseminationsBirths.tab.births")} ({births.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable
                                columns={inseminationColumns}
                                data={inseminations}
                                showSearchAndFilter
                                rowsPerPage={15}
                            />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable
                                columns={birthColumns}
                                data={births}
                                showSearchAndFilter
                                rowsPerPage={15}
                            />
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

export default InseminationsBirthsReport;
