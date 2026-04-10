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

interface MovementRecord {
    _id: string;
    date: string;
    productName: string;
    movementType: string;
    quantity: number;
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

const movementTypeLabels: Record<string, { label: string; color: string }> = {
    income: { label: "Entrada", color: "success" },
    outcome: { label: "Salida", color: "danger" },
    transfer: { label: "Transferencia", color: "info" },
    adjustment: { label: "Ajuste", color: "warning" },
};

const InventoryMovementsReport = () => {
    document.title = "Movimientos e Inventario | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

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
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/inventory/movements/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setMovements(data.movements || []);
            setStock(data.stock || []);
            setKpis(data.kpis);
            setMovementsByType(data.movementsByType || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/inventory/movements/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const movementColumns: Column<MovementRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        {
            header: "Tipo", accessor: "movementType", type: "text",
            render: (value: string) => {
                const m = movementTypeLabels[value] || { label: value, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        {
            header: "Cantidad", accessor: "quantity", type: "text", bgColor: "#e3f2fd",
            render: (v: number, row: MovementRecord) => <span className="fw-semibold">{v} {row.unit}</span>,
        },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        { header: "Usuario", accessor: "user", type: "text" },
        { header: "Observaciones", accessor: "observations", type: "text" },
    ];

    const stockColumns: Column<WarehouseStock>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Categoria", accessor: "category", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Stock Actual", accessor: "currentStock", type: "text", bgColor: "#e8f5e9",
            render: (v: number, row: WarehouseStock) => <span className="fw-semibold">{v} {row.unit}</span>,
        },
        { header: "Ultimo Movimiento", accessor: "lastMovementDate", type: "date" },
    ];

    const barData = movementsByType.map((m: any) => ({
        tipo: movementTypeLabels[m.type]?.label || m.type,
        Cantidad: m.count,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Movimientos e Inventario"
            pageTitle="Reportes de Inventario"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Movimientos e Inventario"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Movimientos"
                        value={kpis.totalMovements}
                        icon={<i className="ri-arrow-left-right-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Entradas"
                        value={kpis.totalIncomes}
                        icon={<i className="ri-inbox-archive-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Salidas"
                        value={kpis.totalOutcomes}
                        icon={<i className="ri-inbox-unarchive-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Cambio Neto"
                        value={kpis.netChange}
                        icon={<i className={`ri-arrow-${kpis.netChange >= 0 ? 'up' : 'down'}-line fs-4 ${kpis.netChange >= 0 ? 'text-success' : 'text-danger'}`}></i>}
                        animateValue
                        iconBgColor={kpis.netChange >= 0 ? "#E8F5E9" : "#FFEBEE"}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Productos"
                        value={kpis.uniqueProducts}
                        icon={<i className="ri-box-3-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Almacenes"
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
                        title="Movimientos por Tipo"
                        data={barData}
                        indexBy="tipo"
                        keys={["Cantidad"]}
                        xLegend="Tipo"
                        yLegend="Cantidad"
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
                                <i className="ri-arrow-left-right-line me-1"></i> Movimientos ({movements.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-community-line me-1"></i> Inventario por Almacen ({stock.length})
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
