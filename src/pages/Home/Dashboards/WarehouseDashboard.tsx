import React, { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import DonutChartCard from "Components/Common/Graphics/DonutChartCard";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import { movementTypeLabels } from "../dashboardHelpers";

interface Props { startDate: string; endDate: string; }

interface StockItem { productName: string; warehouse: string; currentStock: number; unit: string; status: string; }
interface StaleItem { productName: string; warehouse: string; currentStock: number; unit: string; daysSinceLastMovement: number; }
interface MoveItem { _id: string; date: string; productName: string; movementType: string; quantity: number; unit: string; warehouse: string; }

interface WarehouseData {
    kpis: { totalInventoryValue: number; totalProducts: number; totalMovements: number; shrinkagePercent: number; pendingPurchaseOrders: number; criticalStockCount: number; };
    criticalStock: StockItem[];
    staleProducts: StaleItem[];
    recentMovements: MoveItem[];
    monthlySpending: { month: string; totalSpent: number; purchaseCount: number }[];
    valueByCategory: { category: string; totalValue: number }[];
}

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444", "#f97316"];

const WarehouseDashboard: React.FC<Props> = ({ startDate, endDate }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [data, setData] = useState<WarehouseData | null>(null);

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/dashboard/warehouse/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            setData(res.data.data);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar el dashboard." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [startDate, endDate]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;
    if (!data) return null;

    const spendingData = data.monthlySpending.map(m => ({ month: m.month, "Gasto": m.totalSpent }));

    const categoryDonut = (data.valueByCategory || []).map((c, idx) => ({
        id: c.category, label: c.category, value: c.totalValue,
        color: categoryColors[idx % categoryColors.length],
    }));

    const stockColumns: Column<StockItem>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text" },
        {
            header: "Stock", accessor: "currentStock", type: "text",
            render: (v: number, row) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
        {
            header: "Estado", accessor: "status", type: "text",
            render: (v: string) => <Badge color={v === "critical" ? "danger" : "warning"}>{v === "critical" ? "Critico" : "Bajo"}</Badge>,
        },
    ];

    const staleColumns: Column<StaleItem>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text" },
        {
            header: "Stock", accessor: "currentStock", type: "text",
            render: (v: number, row) => <span>{v?.toFixed(2)} {row.unit}</span>,
        },
        {
            header: "Dias sin movimiento", accessor: "daysSinceLastMovement", type: "number",
            bgColor: "#fef3c7",
        },
    ];

    const movColumns: Column<MoveItem>[] = [
        { header: "Fecha", accessor: "date", type: "date" },
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        {
            header: "Tipo", accessor: "movementType", type: "text",
            render: (v: string) => {
                const m = movementTypeLabels[v] || { label: v, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        {
            header: "Cantidad", accessor: "quantity", type: "text",
            render: (v: number, row) => <span>{v} {row.unit}</span>,
        },
        { header: "Almacen", accessor: "warehouse", type: "text" },
    ];

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Valor Inventario" value={data.kpis.totalInventoryValue} prefix="$" decimals={2}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                        iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Total Productos" value={data.kpis.totalProducts}
                        icon={<i className="ri-archive-line fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Movimientos" value={data.kpis.totalMovements}
                        icon={<i className="ri-swap-line fs-4 text-info"></i>}
                        iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Merma" value={data.kpis.shrinkagePercent} suffix="%" decimals={2}
                        icon={<i className="ri-scales-line fs-4 text-warning"></i>}
                        iconBgColor="#FFF8E1" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="OC Pendientes" value={data.kpis.pendingPurchaseOrders}
                        icon={<i className="ri-file-list-3-line fs-4 text-primary"></i>} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title="Stock Critico" value={data.kpis.criticalStockCount}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        iconBgColor="#FEE2E2" animateValue />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={8}>
                    <BasicBarChart
                        title="Gasto Mensual en Compras"
                        data={spendingData}
                        indexBy="month"
                        keys={["Gasto"]}
                        xLegend="Mes"
                        yLegend="Monto ($)"
                        height={300}
                        colors={["#3b82f6"]}
                    />
                </Col>
                <Col xl={4}>
                    <DonutChartCard
                        title="Valor por Categoria"
                        data={categoryDonut}
                        height={300}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">
                                <i className="ri-error-warning-line me-1 text-danger"></i>
                                Stock Critico / Bajo
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={stockColumns} data={data.criticalStock || []} rowsPerPage={8} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
                <Col xl={6}>
                    <Card className="h-100">
                        <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                            <h6 className="mb-0 text-muted">
                                <i className="ri-time-line me-1 text-warning"></i>
                                Productos sin Movimiento
                            </h6>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={staleColumns} data={data.staleProducts || []} rowsPerPage={8} showSearchAndFilter={false} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Card className="mb-3">
                <CardHeader style={{ backgroundColor: "#f8f9fa" }}>
                    <h6 className="mb-0 text-muted">Movimientos Recientes</h6>
                </CardHeader>
                <CardBody>
                    <CustomTable columns={movColumns} data={data.recentMovements || []} rowsPerPage={10} showSearchAndFilter />
                </CardBody>
            </Card>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))} />
        </>
    );
};

export default WarehouseDashboard;
