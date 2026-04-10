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
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import classnames from "classnames";

interface ProductValuation {
    productName: string;
    category: string;
    warehouse: string;
    currentStock: number;
    unit: string;
    avgCost: number;
    totalValue: number;
}

interface CostByProduct {
    productName: string;
    category: string;
    avgCost: number;
    minCost: number;
    maxCost: number;
    lastCost: number;
    unit: string;
    priceVariation: number;
}

interface ValuationKpis {
    totalInventoryValue: number;
    totalProducts: number;
    avgCostPerProduct: number;
    highestValueProduct: string;
    highestValueAmount: number;
    totalCategories: number;
}

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280"];

const InventoryValuationReport = () => {
    document.title = "Valoracion de Inventario | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [valuation, setValuation] = useState<ProductValuation[]>([]);
    const [costs, setCosts] = useState<CostByProduct[]>([]);
    const [kpis, setKpis] = useState<ValuationKpis>({
        totalInventoryValue: 0, totalProducts: 0, avgCostPerProduct: 0,
        highestValueProduct: "", highestValueAmount: 0, totalCategories: 0,
    });
    const [valueByCategory, setValueByCategory] = useState<any[]>([]);

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
                `${configContext.apiUrl}/reports/inventory/valuation/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setValuation(data.valuation || []);
            setCosts(data.costs || []);
            setKpis(data.kpis);
            setValueByCategory(data.valueByCategory || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/inventory/valuation/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const valuationColumns: Column<ProductValuation>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Categoria", accessor: "category", type: "text", isFilterable: true },
        { header: "Almacen", accessor: "warehouse", type: "text", isFilterable: true },
        {
            header: "Stock", accessor: "currentStock", type: "text",
            render: (v: number, row: ProductValuation) => <span>{v?.toLocaleString()} {row.unit}</span>,
        },
        { header: "Costo Prom.", accessor: "avgCost", type: "currency", bgColor: "#e3f2fd" },
        { header: "Valor Total", accessor: "totalValue", type: "currency", bgColor: "#e8f5e9" },
    ];

    const costColumns: Column<CostByProduct>[] = [
        { header: "Producto", accessor: "productName", type: "text", isFilterable: true },
        { header: "Categoria", accessor: "category", type: "text", isFilterable: true },
        { header: "Costo Prom.", accessor: "avgCost", type: "currency", bgColor: "#e3f2fd" },
        { header: "Costo Min.", accessor: "minCost", type: "currency" },
        { header: "Costo Max.", accessor: "maxCost", type: "currency" },
        { header: "Ultimo Costo", accessor: "lastCost", type: "currency" },
        {
            header: "Variacion", accessor: "priceVariation", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v > 0 ? "text-danger" : v < 0 ? "text-success" : ""}`}>
                    {v > 0 ? "+" : ""}{v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const donutData: DonutDataItem[] = valueByCategory.map((c: any, i: number) => ({
        id: c.category,
        label: c.category,
        value: c.totalValue,
        color: categoryColors[i % categoryColors.length],
    }));

    const totalVal = valueByCategory.reduce((acc: number, c: any) => acc + c.totalValue, 0);
    const donutLegend: DonutLegendItem[] = valueByCategory.map((c: any) => ({
        label: c.category,
        value: `$${c.totalValue?.toLocaleString()}`,
        percentage: totalVal > 0 ? `${((c.totalValue / totalVal) * 100).toFixed(1)}%` : "0%",
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Valoracion de Inventario"
            pageTitle="Reportes de Inventario"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Valoracion de Inventario"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Valor Total Inventario"
                        value={kpis.totalInventoryValue}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Productos"
                        value={kpis.totalProducts}
                        icon={<i className="ri-box-3-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Costo Prom. / Producto"
                        value={kpis.avgCostPerProduct}
                        icon={<i className="ri-price-tag-3-line fs-4 text-info"></i>}
                        animateValue
                        decimals={2}
                        prefix="$"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Categorias"
                        value={kpis.totalCategories}
                        icon={<i className="ri-folder-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={4} md={8}>
                    <StatKpiCard
                        title="Producto de Mayor Valor"
                        value={kpis.highestValueAmount}
                        subtext={kpis.highestValueProduct}
                        icon={<i className="ri-vip-crown-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={5}>
                    <DonutChartCard
                        title="Valor por Categoria"
                        data={donutData}
                        legendItems={donutLegend}
                        height={200}
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
                                <i className="ri-money-dollar-circle-line me-1"></i> Valor por Producto ({valuation.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-price-tag-3-line me-1"></i> Costo Promedio ({costs.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={valuationColumns} data={valuation} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={costColumns} data={costs} showSearchAndFilter rowsPerPage={15} />
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

export default InventoryValuationReport;
