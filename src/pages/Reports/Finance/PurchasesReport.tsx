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
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import classnames from "classnames";

interface PurchaseRecord {
    _id: string;
    date: string;
    supplier: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    invoiceNumber: string;
}

interface PriceFluctuation {
    productName: string;
    category: string;
    currentPrice: number;
    previousPrice: number;
    variation: number;
    variationPercent: number;
    unit: string;
}

interface PurchasesKpis {
    totalPurchases: number;
    totalSpent: number;
    avgPurchaseAmount: number;
    suppliersCount: number;
}

const PurchasesReport = () => {
    document.title = "Compras y Fluctuacion de Precios | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [priceChanges, setPriceChanges] = useState<PriceFluctuation[]>([]);
    const [kpis, setKpis] = useState<PurchasesKpis>({
        totalPurchases: 0, totalSpent: 0, avgPurchaseAmount: 0, suppliersCount: 0,
    });
    const [monthlySpending, setMonthlySpending] = useState<any[]>([]);

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
                `${configContext.apiUrl}/reports/finance/purchases/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setPurchases(data.purchases || []);
            setPriceChanges(data.priceChanges || []);
            setKpis(data.kpis);
            setMonthlySpending(data.monthlySpending || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/finance/purchases/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const purchaseColumns: Column<PurchaseRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Proveedor", accessor: "supplier", type: "text", isFilterable: true },
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        {
            header: "Cantidad", accessor: "quantity", type: "text",
            render: (v: number, row: PurchaseRecord) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: "Precio Unit.", accessor: "unitPrice", type: "currency" },
        { header: "Total", accessor: "totalAmount", type: "currency", bgColor: "#e8f5e9" },
        { header: "Factura", accessor: "invoiceNumber", type: "text" },
    ];

    const priceColumns: Column<PriceFluctuation>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Categoria", accessor: "category", type: "text", isFilterable: true },
        { header: "Precio Actual", accessor: "currentPrice", type: "currency", bgColor: "#e3f2fd" },
        { header: "Precio Anterior", accessor: "previousPrice", type: "currency" },
        {
            header: "Variacion", accessor: "variation", type: "currency",
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
    ];

    const spendingTrendData = [{
        id: "Gasto",
        data: monthlySpending.map((m: any) => ({ x: m.month, y: m.totalSpent })),
    }];

    const spendingBarData = monthlySpending.map((m: any) => ({
        month: m.month,
        Compras: m.purchaseCount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Compras y Fluctuacion de Precios"
            pageTitle="Reportes Financieros"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Compras y Fluctuacion de Precios"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Compras"
                        value={kpis.totalPurchases}
                        icon={<i className="ri-shopping-cart-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Gastado"
                        value={kpis.totalSpent}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Prom. por Compra"
                        value={kpis.avgPurchaseAmount}
                        icon={<i className="ri-price-tag-3-line fs-4 text-info"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Proveedores"
                        value={kpis.suppliersCount}
                        icon={<i className="ri-truck-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title="Tendencia de Gasto Mensual"
                        data={spendingTrendData}
                        yLabel="Gasto ($)"
                        xLabel="Mes"
                        height={280}
                        color="#ef4444"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title="Compras por Mes"
                        data={spendingBarData}
                        indexBy="month"
                        keys={["Compras"]}
                        xLegend="Mes"
                        yLegend="Cantidad"
                        height={280}
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
                                <i className="ri-shopping-cart-line me-1"></i> Compras ({purchases.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-up-down-line me-1"></i> Fluctuacion de Precios ({priceChanges.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={purchaseColumns} data={purchases} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={priceColumns} data={priceChanges} showSearchAndFilter rowsPerPage={15} />
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

export default PurchasesReport;
