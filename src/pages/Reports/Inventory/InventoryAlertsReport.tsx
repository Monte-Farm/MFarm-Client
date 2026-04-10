import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import { getLoggedinUser } from "helpers/api_helper";
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
    document.title = "Analisis de Inventario | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

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
        if (!configContext || !userLogged) return;
        setLoading(true);
        try {
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/reports/inventory/alerts/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setRotation(data.rotation || []);
            setStaleProducts(data.staleProducts || []);
            setShrinkage(data.shrinkage || []);
            setKpis(data.kpis);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/inventory/alerts/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const rotationColumns: Column<RotationItem>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Entradas", accessor: "totalIn", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        {
            header: "Salidas", accessor: "totalOut", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        {
            header: "Stock Prom.", accessor: "avgStock", type: "text",
            render: (v: number, row: RotationItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: "Indice de Rotacion", accessor: "rotationIndex", type: "text", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 4 ? "text-success" : v >= 2 ? "text-warning" : "text-danger"}`}>
                    {v?.toFixed(2)}
                </span>
            ),
        },
    ];

    const staleColumns: Column<StaleProduct>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Stock Actual", accessor: "currentStock", type: "text",
            render: (v: number, row: StaleProduct) => <span>{v} {row.unit}</span>,
        },
        { header: "Ultimo Movimiento", accessor: "lastMovementDate", type: "date" },
        {
            header: "Dias sin Movimiento", accessor: "daysSinceLastMovement", type: "number", bgColor: "#fff8e1",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 90 ? "text-danger" : v >= 30 ? "text-warning" : ""}`}>
                    {v} dias
                </span>
            ),
        },
    ];

    const shrinkageColumns: Column<ShrinkageItem>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Stock Esperado", accessor: "expectedStock", type: "text",
            render: (v: number, row: ShrinkageItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: "Stock Real", accessor: "actualStock", type: "text",
            render: (v: number, row: ShrinkageItem) => <span>{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: "Merma", accessor: "shrinkage", type: "text", bgColor: "#ffebee",
            render: (v: number, row: ShrinkageItem) => <span className="text-danger fw-semibold">{v?.toFixed(1)} {row.unit}</span>,
        },
        {
            header: "Merma %", accessor: "shrinkagePercent", type: "text", bgColor: "#ffebee",
            render: (v: number) => <span className="text-danger fw-semibold">{v?.toFixed(2)}%</span>,
        },
    ];

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Analisis de Inventario"
            pageTitle="Reportes de Inventario"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Analisis de Inventario"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Rotacion Promedio"
                        value={kpis.avgRotationIndex}
                        icon={<i className="ri-refresh-line fs-4 text-primary"></i>}
                        animateValue
                        decimals={2}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Productos sin Movimiento"
                        value={kpis.staleProductCount}
                        icon={<i className="ri-time-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Merma Total"
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
                        title="Merma %"
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
                                <i className="ri-refresh-line me-1"></i> Rotacion ({rotation.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-time-line me-1"></i> Sin Movimiento ({staleProducts.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-down-circle-line me-1"></i> Mermas ({shrinkage.length})
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
