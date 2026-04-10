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
import classnames from "classnames";

interface TopClient {
    clientName: string;
    totalSales: number;
    totalPigs: number;
    totalWeight: number;
    totalRevenue: number;
    totalProfit: number;
    margin: number;
    avgPricePerKg: number;
}

interface ClientFrequency {
    clientName: string;
    totalSales: number;
    firstPurchaseDate: string;
    lastPurchaseDate: string;
    avgDaysBetweenPurchases: number;
    avgPurchaseAmount: number;
    totalRevenue: number;
}

interface ClientsKpis {
    totalClients: number;
    activeClients: number;
    topClientName: string;
    topClientRevenue: number;
    avgRevenuePerClient: number;
    avgSalesPerClient: number;
}

const ClientsReport = () => {
    document.title = "Analisis de Clientes | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [topClients, setTopClients] = useState<TopClient[]>([]);
    const [frequency, setFrequency] = useState<ClientFrequency[]>([]);
    const [kpis, setKpis] = useState<ClientsKpis>({
        totalClients: 0, activeClients: 0, topClientName: "",
        topClientRevenue: 0, avgRevenuePerClient: 0, avgSalesPerClient: 0,
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
                `${configContext.apiUrl}/reports/sales/clients/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setTopClients(data.topClients || []);
            setFrequency(data.frequency || []);
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
            `${configContext.apiUrl}/reports/sales/clients/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const topClientColumns: Column<TopClient>[] = [
        { header: "Cliente", accessor: "clientName", type: "text", isFilterable: true },
        { header: "Ventas", accessor: "totalSales", type: "number" },
        { header: "Cerdos", accessor: "totalPigs", type: "number" },
        {
            header: "Peso Total", accessor: "totalWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: "Ingreso", accessor: "totalRevenue", type: "currency", bgColor: "#e8f5e9" },
        {
            header: "Utilidad", accessor: "totalProfit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: "Margen %", accessor: "margin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
        { header: "Prom. $/kg", accessor: "avgPricePerKg", type: "currency" },
    ];

    const frequencyColumns: Column<ClientFrequency>[] = [
        { header: "Cliente", accessor: "clientName", type: "text", isFilterable: true },
        { header: "Ventas", accessor: "totalSales", type: "number" },
        { header: "Primera Compra", accessor: "firstPurchaseDate", type: "date" },
        { header: "Ultima Compra", accessor: "lastPurchaseDate", type: "date" },
        {
            header: "Dias entre Compras", accessor: "avgDaysBetweenPurchases", type: "text", bgColor: "#e3f2fd",
            render: (v: number) => <span className="fw-semibold">{v?.toFixed(0)} dias</span>,
        },
        { header: "Prom. por Compra", accessor: "avgPurchaseAmount", type: "currency" },
        { header: "Ingreso Total", accessor: "totalRevenue", type: "currency", bgColor: "#e8f5e9" },
    ];

    const topBarData = topClients.slice(0, 10).map(c => ({
        cliente: c.clientName,
        Ingreso: c.totalRevenue,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Analisis de Clientes"
            pageTitle="Reportes de Ventas"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Analisis de Clientes"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Clientes"
                        value={kpis.totalClients}
                        icon={<i className="ri-user-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Clientes Activos"
                        value={kpis.activeClients}
                        icon={<i className="ri-user-follow-line fs-4 text-success"></i>}
                        animateValue
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Prom. Ventas / Cliente"
                        value={kpis.avgSalesPerClient}
                        icon={<i className="ri-shopping-bag-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Prom. Ingreso / Cliente"
                        value={kpis.avgRevenuePerClient}
                        icon={<i className="ri-money-dollar-circle-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={4} md={8}>
                    <StatKpiCard
                        title="Cliente Principal"
                        value={kpis.topClientRevenue}
                        subtext={kpis.topClientName}
                        icon={<i className="ri-vip-crown-line fs-4 text-warning"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title="Top 10 Clientes por Ingreso"
                        data={topBarData}
                        indexBy="cliente"
                        keys={["Ingreso"]}
                        xLegend="Cliente"
                        yLegend="Ingreso ($)"
                        height={280}
                        colors={["#10b981"]}
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
                                <i className="ri-vip-crown-line me-1"></i> Clientes mas Rentables ({topClients.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-calendar-check-line me-1"></i> Frecuencia de Compra ({frequency.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={topClientColumns} data={topClients} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={frequencyColumns} data={frequency} showSearchAndFilter rowsPerPage={15} />
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

export default ClientsReport;
