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
import classnames from "classnames";

interface RotationItem {
    productName: string;
    warehouse: string;
    totalIn: number;
    totalOut: number;
    avgStock: number;
    rotationIndex: number;
    unit: string;
}

interface StaleProduct {
    productName: string;
    warehouse: string;
    currentStock: number;
    unit: string;
    lastMovementDate: string;
    daysSinceLastMovement: number;
}

interface ShrinkageItem {
    productName: string;
    warehouse: string;
    expectedStock: number;
    actualStock: number;
    shrinkage: number;
    shrinkagePercent: number;
    unit: string;
}

interface AlertsKpis {
    avgRotationIndex: number;
    staleProductCount: number;
    totalShrinkage: number;
    shrinkagePercent: number;
}

const InventoryAlertsReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.invAlerts.title")} | ${t("reports.inventory")}`;

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [rotation, setRotation] = useState<RotationItem[]>([]);
    const [staleProducts, setStaleProducts] = useState<StaleProduct[]>([]);
    const [shrinkage, setShrinkage] = useState<ShrinkageItem[]>([]);
    const [kpis, setKpis] = useState<AlertsKpis>({
        avgRotationIndex: 0, staleProductCount: 0, totalShrinkage: 0, shrinkagePercent: 0,
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
                basePath: "reports/inventory/alerts",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setRotation(data.rotation || []);
            setStaleProducts(data.staleProducts || []);
            setShrinkage(data.shrinkage || []);
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
            basePath: "reports/inventory/alerts",
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

    const rotationColumns: Column<RotationItem>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.invAlerts.col.incomes"), accessor: "totalIn", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.outcomes"), accessor: "totalOut", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.avgStock"), accessor: "avgStock", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.rotationIndex"), accessor: "rotationIndex", type: "text", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 4 ? "text-success" : v >= 2 ? "text-warning" : "text-danger"}`}>
                    {v?.toFixed(2)}
                </span>
            ),
        },
    ];

    const staleColumns: Column<StaleProduct>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.invAlerts.col.currentStock"), accessor: "currentStock", type: "text",
            render: (v: number, row: StaleProduct) => <span>{v} {row.unit}</span>,
        },
        { header: t("reports.invAlerts.col.lastMovement"), accessor: "lastMovementDate", type: "date" },
        {
            header: t("reports.invAlerts.col.daysSince"), accessor: "daysSinceLastMovement", type: "number", bgColor: "#fff8e1",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 90 ? "text-danger" : v >= 30 ? "text-warning" : ""}`}>
                    {v} {t("reports.axis.days")}
                </span>
            ),
        },
    ];

    const shrinkageColumns: Column<ShrinkageItem>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.invAlerts.col.expected"), accessor: "expectedStock", type: "text",
            render: (v: number, row: ShrinkageItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.actual"), accessor: "actualStock", type: "text",
            render: (v: number, row: ShrinkageItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.shrinkage"), accessor: "shrinkage", type: "text", bgColor: "#ffebee",
            render: (v: number, row: ShrinkageItem) => <span className="text-danger fw-semibold">{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: t("reports.invAlerts.col.shrinkagePct"), accessor: "shrinkagePercent", type: "text", bgColor: "#ffebee",
            render: (v: number) => <span className="text-danger fw-semibold">{v?.toFixed(2)}%</span>,
        },
    ];

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.invAlerts.title")}
            pageTitle={t("reports.inventory")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.invAlerts.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.invAlerts.kpi.avgRotation")}
                        value={kpis.avgRotationIndex}
                        icon={<i className="ri-refresh-line fs-4 text-primary"></i>}
                        animateValue
                        decimals={2}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.invAlerts.kpi.staleProducts")}
                        value={kpis.staleProductCount}
                        icon={<i className="ri-time-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.invAlerts.kpi.totalShrinkage")}
                        value={kpis.totalShrinkage}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        decimals={1}
                        suffix=" kg"
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title={t("reports.invAlerts.kpi.shrinkagePct")}
                        value={kpis.shrinkagePercent}
                        icon={<i className="ri-percent-line fs-4 text-danger"></i>}
                        animateValue
                        decimals={2}
                        suffix="%"
                        iconBgColor="#FFEBEE"
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
                                <i className="ri-refresh-line me-1"></i> {t("reports.invAlerts.tab.rotation")} ({rotation.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-time-line me-1"></i> {t("reports.invAlerts.tab.noMovement")} ({staleProducts.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-down-circle-line me-1"></i> {t("reports.invAlerts.tab.shrinkage")} ({shrinkage.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={rotationColumns} data={rotation} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={staleColumns} data={staleProducts} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={shrinkageColumns} data={shrinkage} showSearchAndFilter rowsPerPage={15} />
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

export default InventoryAlertsReport;
