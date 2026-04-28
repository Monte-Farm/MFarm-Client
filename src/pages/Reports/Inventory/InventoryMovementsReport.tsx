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

interface MovementRecord {
    _id: string;
    date: string;
    productName: string;
    movementType: string;
    quantity: number;
    stockAfter: number;
    unit: string;
    warehouse: string;
    user: string;
    observations: string;
}

interface WarehouseStock {
    _id: string;
    productName: string;
    category: string;
    warehouse: string;
    currentStock: number;
    unit: string;
    lastMovementDate: string;
}

interface InventoryMovementKpis {
    totalMovements: number;
    totalIncomes: number;
    totalOutcomes: number;
    uniqueProducts: number;
    totalWarehouses: number;
    netChange: number;
}

const InventoryMovementsReport = () => {
    const { t } = useTranslation();
    document.title = `${t("reports.invMovements.title")} | ${t("reports.title")}`;

    const movementTypeLabels: Record<string, { label: string; color: string }> = {
        income: { label: t("reports.invMovements.movementType.income"), color: "success" },
        outcome: { label: t("reports.invMovements.movementType.outcome"), color: "danger" },
        transfer: { label: t("reports.invMovements.movementType.transfer"), color: "info" },
        adjustment: { label: t("reports.invMovements.movementType.adjustment"), color: "warning" },
    };

    const configContext = useContext(ConfigContext);
    const { isGlobal, farmId, scopeKey } = useReportScope();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [movements, setMovements] = useState<MovementRecord[]>([]);
    const [stock, setStock] = useState<WarehouseStock[]>([]);
    const [kpis, setKpis] = useState<InventoryMovementKpis>({
        totalMovements: 0, totalIncomes: 0, totalOutcomes: 0,
        uniqueProducts: 0, totalWarehouses: 0, netChange: 0,
    });
    const [movementsByType, setMovementsByType] = useState<any[]>([]);

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
                basePath: "reports/inventory/movements",
                isGlobal,
                farmId,
                query: { start_date: startDate, end_date: endDate },
            });
            const res = await configContext.axiosHelper.get(url);
            const data = res.data.data;
            setMovements(data.movements || []);
            setStock(data.stock || []);
            setKpis(data.kpis);
            setMovementsByType(data.movementsByType || []);
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
            basePath: "reports/inventory/movements",
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

    const movementColumns: Column<MovementRecord>[] = [
        { header: t("reports.col.date"), accessor: "date", type: "date", isFilterable: true },
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        {
            header: t("reports.col.type"), accessor: "movementType", type: "text",
            render: (value: string) => {
                const m = movementTypeLabels[value] || { label: value, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        {
            header: t("reports.col.quantity"), accessor: "quantity", type: "text", bgColor: "#e3f2fd",
            render: (v: number, row: MovementRecord) => <span className="fw-semibold">{v} {row.unit}</span>,
        },
        {
            header: t("reports.invMovements.col.stockAfter"), accessor: "stockAfter", type: "text", bgColor: "#F3E5F5",
            render: (v: number, row: MovementRecord) => <span className="fw-semibold">{v} {row.unit}</span>,
        },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        { header: t("reports.col.user"), accessor: "user", type: "text" },
        { header: t("reports.col.observations"), accessor: "observations", type: "text" },
    ];

    const stockColumns: Column<WarehouseStock>[] = [
        { header: t("reports.col.product"), accessor: "productName", type: "text", isFilterable: true },
        { header: t("reports.col.category"), accessor: "category", type: "text", isFilterable: true },
        { header: t("reports.col.warehouse"), accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: t("reports.invMovements.col.currentStock"), accessor: "currentStock", type: "text", bgColor: "#e8f5e9",
            render: (v: number, row: WarehouseStock) => <span className="fw-semibold">{v} {row.unit}</span>,
        },
        { header: t("reports.invMovements.col.lastMovement"), accessor: "lastMovementDate", type: "date" },
    ];

    const barData = movementsByType.map((m: any) => ({
        tipo: movementTypeLabels[m.type]?.label || m.type,
        Cantidad: m.count,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title={t("reports.invMovements.title")}
            pageTitle={t("reports.inventory")}
            onGeneratePdf={handleGeneratePdf}
            pdfTitle={t("reports.invMovements.pdfTitle")}
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.totalMovements")}
                        value={kpis.totalMovements}
                        icon={<i className="ri-arrow-left-right-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.incomes")}
                        value={kpis.totalIncomes}
                        icon={<i className="ri-inbox-archive-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.outcomes")}
                        value={kpis.totalOutcomes}
                        icon={<i className="ri-inbox-unarchive-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.netChange")}
                        value={kpis.netChange}
                        icon={<i className={`ri-arrow-${kpis.netChange >= 0 ? 'up' : 'down'}-line fs-4 ${kpis.netChange >= 0 ? 'text-success' : 'text-danger'}`}></i>}
                        animateValue
                        iconBgColor={kpis.netChange >= 0 ? "#E8F5E9" : "#FFEBEE"}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.products")}
                        value={kpis.uniqueProducts}
                        icon={<i className="ri-box-3-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title={t("reports.invMovements.kpi.warehouses")}
                        value={kpis.totalWarehouses}
                        icon={<i className="ri-community-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title={t("reports.invMovements.chart.byType")}
                        data={barData}
                        indexBy="tipo"
                        keys={["Cantidad"]}
                        xLegend={t("reports.axis.type")}
                        yLegend={t("reports.axis.quantity")}
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
                                <i className="ri-arrow-left-right-line me-1"></i> {t("reports.invMovements.tab.movements")} ({movements.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-community-line me-1"></i> {t("reports.invMovements.tab.inventory")} ({stock.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={movementColumns} data={movements} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={stockColumns} data={stock} showSearchAndFilter rowsPerPage={15} />
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

export default InventoryMovementsReport;
