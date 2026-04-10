import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
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

const actionLabels: Record<string, { label: string; color: string }> = {
    create: { label: "Crear", color: "success" },
    update: { label: "Actualizar", color: "info" },
    delete: { label: "Eliminar", color: "danger" },
    login: { label: "Inicio de sesion", color: "primary" },
    export: { label: "Exportar", color: "secondary" },
};

const AuditReport = () => {
    document.title = "Auditoria | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

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
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/audit/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setActivities(data.activities || []);
            setAdjustments(data.adjustments || []);
            setPriceChanges(data.priceChanges || []);
            setKpis(data.kpis);
            setActionsByModule(data.actionsByModule || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/audit/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const activityColumns: Column<ActivityRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Usuario", accessor: "user", type: "text", isFilterable: true },
        {
            header: "Accion", accessor: "action", type: "text",
            render: (value: string) => {
                const a = actionLabels[value] || { label: value, color: "secondary" };
                return <Badge color={a.color}>{a.label}</Badge>;
            },
        },
        { header: "Modulo", accessor: "module", type: "text", isFilterable: true },
        { header: "Descripcion", accessor: "description", type: "text", isFilterable: true },
        { header: "Detalles", accessor: "details", type: "text" },
    ];

    const adjustmentColumns: Column<InventoryAdjustment>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Stock Anterior", accessor: "previousStock", type: "text",
            render: (v: number, row: InventoryAdjustment) => <span>{v} {row.unit}</span>,
        },
        {
            header: "Stock Nuevo", accessor: "newStock", type: "text",
            render: (v: number, row: InventoryAdjustment) => <span>{v} {row.unit}</span>,
        },
        {
            header: "Diferencia", accessor: "difference", type: "text", bgColor: "#fff8e1",
            render: (v: number, row: InventoryAdjustment) => (
                <span className={`fw-semibold ${v > 0 ? "text-success" : v < 0 ? "text-danger" : ""}`}>
                    {v > 0 ? "+" : ""}{v} {row.unit}
                </span>
            ),
        },
        { header: "Motivo", accessor: "reason", type: "text" },
        { header: "Usuario", accessor: "user", type: "text" },
    ];

    const priceChangeColumns: Column<PriceChangeRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Precio Anterior", accessor: "previousPrice", type: "currency" },
        { header: "Precio Nuevo", accessor: "newPrice", type: "currency", bgColor: "#e3f2fd" },
        {
            header: "Variacion", accessor: "variation", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}${v?.toFixed(2)}
                </span>
            ),
        },
        {
            header: "Variacion %", accessor: "variationPercent", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}{v?.toFixed(1)}%
                </span>
            ),
        },
        { header: "Usuario", accessor: "user", type: "text" },
    ];

    const moduleBarData = actionsByModule.map((m: any) => ({
        modulo: m.module,
        Acciones: m.count,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Auditoria"
            pageTitle="Reportes"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Auditoria"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Acciones"
                        value={kpis.totalActions}
                        icon={<i className="ri-history-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Usuarios Activos"
                        value={kpis.totalUsers}
                        icon={<i className="ri-user-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Ajustes Inventario"
                        value={kpis.totalAdjustments}
                        icon={<i className="ri-equalizer-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Cambios de Precio"
                        value={kpis.totalPriceChanges}
                        icon={<i className="ri-price-tag-3-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Usuario mas Activo"
                        value={kpis.mostActiveUser || "—"}
                        icon={<i className="ri-user-star-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Modulo mas Activo"
                        value={kpis.mostActiveModule || "—"}
                        icon={<i className="ri-layout-grid-line fs-4 text-secondary"></i>}
                        iconBgColor="#F5F5F5"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title="Acciones por Modulo"
                        data={moduleBarData}
                        indexBy="modulo"
                        keys={["Acciones"]}
                        xLegend="Modulo"
                        yLegend="Acciones"
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
                                <i className="ri-history-line me-1"></i> Historial de Movimientos ({activities.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-equalizer-line me-1"></i> Ajustes de Inventario ({adjustments.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-price-tag-3-line me-1"></i> Cambios de Precio ({priceChanges.length})
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
