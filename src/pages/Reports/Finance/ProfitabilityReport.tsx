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

interface CostVsIncome {
    month: string;
    totalCost: number;
    totalIncome: number;
    profit: number;
    margin: number;
}

interface UtilityByGroup {
    groupName: string;
    stage: string;
    totalCost: number;
    totalIncome: number;
    profit: number;
    margin: number;
    pigCount: number;
    profitPerPig: number;
}

interface UtilityBySale {
    _id: string;
    saleDate: string;
    buyer: string;
    pigCount: number;
    totalWeight: number;
    totalIncome: number;
    totalCost: number;
    profit: number;
    margin: number;
}

interface MarginByClient {
    clientName: string;
    totalSales: number;
    totalIncome: number;
    totalCost: number;
    profit: number;
    margin: number;
    avgMargin: number;
}

interface ProfitabilityKpis {
    totalIncome: number;
    totalCost: number;
    totalProfit: number;
    overallMargin: number;
    bestGroupMargin: number;
    bestGroupName: string;
}

const ProfitabilityReport = () => {
    document.title = "Rentabilidad | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [costVsIncome, setCostVsIncome] = useState<CostVsIncome[]>([]);
    const [byGroup, setByGroup] = useState<UtilityByGroup[]>([]);
    const [bySale, setBySale] = useState<UtilityBySale[]>([]);
    const [byClient, setByClient] = useState<MarginByClient[]>([]);
    const [kpis, setKpis] = useState<ProfitabilityKpis>({
        totalIncome: 0, totalCost: 0, totalProfit: 0,
        overallMargin: 0, bestGroupMargin: 0, bestGroupName: "",
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
                `${configContext.apiUrl}/reports/finance/profitability/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setCostVsIncome(data.costVsIncome || []);
            setByGroup(data.byGroup || []);
            setBySale(data.bySale || []);
            setByClient(data.byClient || []);
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
            `${configContext.apiUrl}/reports/finance/profitability/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const costVsIncomeColumns: Column<CostVsIncome>[] = [
        { header: "Mes", accessor: "month", type: "text" },
        { header: "Costo Total", accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        { header: "Ingreso Total", accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        {
            header: "Utilidad", accessor: "profit", type: "currency", bgColor: "#e3f2fd",
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
    ];

    const groupColumns: Column<UtilityByGroup>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        { header: "Etapa", accessor: "stage", type: "text" },
        { header: "Cerdos", accessor: "pigCount", type: "number" },
        { header: "Costo", accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        { header: "Ingreso", accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        {
            header: "Utilidad", accessor: "profit", type: "currency", bgColor: "#e3f2fd",
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
        { header: "Utilidad / Cerdo", accessor: "profitPerPig", type: "currency" },
    ];

    const saleColumns: Column<UtilityBySale>[] = [
        { header: "Fecha", accessor: "saleDate", type: "date", isFilterable: true },
        { header: "Comprador", accessor: "buyer", type: "text", isFilterable: true },
        { header: "Cerdos", accessor: "pigCount", type: "number" },
        {
            header: "Peso Total", accessor: "totalWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: "Ingreso", accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        { header: "Costo", accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: "Utilidad", accessor: "profit", type: "currency", bgColor: "#e3f2fd",
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
    ];

    const clientColumns: Column<MarginByClient>[] = [
        { header: "Cliente", accessor: "clientName", type: "text", isFilterable: true },
        { header: "Ventas", accessor: "totalSales", type: "number" },
        { header: "Ingreso Total", accessor: "totalIncome", type: "currency", bgColor: "#e8f5e9" },
        { header: "Costo Total", accessor: "totalCost", type: "currency", bgColor: "#ffebee" },
        {
            header: "Utilidad", accessor: "profit", type: "currency", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    ${v?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: "Margen Prom. %", accessor: "avgMargin", type: "text",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0 ? "text-success" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    // Charts
    const trendData = [
        { id: "Ingreso", data: costVsIncome.map(c => ({ x: c.month, y: c.totalIncome })), color: "#10b981" },
        { id: "Costo", data: costVsIncome.map(c => ({ x: c.month, y: c.totalCost })), color: "#ef4444" },
    ];

    const profitBarData = costVsIncome.map(c => ({
        month: c.month,
        Utilidad: c.profit,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Rentabilidad"
            pageTitle="Reportes Financieros"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Rentabilidad"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Ingreso Total"
                        value={kpis.totalIncome}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Costo Total"
                        value={kpis.totalCost}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Utilidad"
                        value={kpis.totalProfit}
                        icon={<i className="ri-money-dollar-box-line fs-4 text-primary"></i>}
                        animateValue
                        prefix="$"
                        decimals={2}
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Margen General"
                        value={kpis.overallMargin}
                        icon={<i className="ri-percent-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={4} md={8}>
                    <StatKpiCard
                        title="Mejor Margen (Grupo)"
                        value={kpis.bestGroupMargin}
                        subtext={kpis.bestGroupName}
                        icon={<i className="ri-trophy-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={7}>
                    <BasicLineChartCard
                        title="Ingreso vs Costo por Mes"
                        data={trendData}
                        yLabel="Monto ($)"
                        xLabel="Mes"
                        height={300}
                        showLegend
                    />
                </Col>
                <Col xl={5}>
                    <BasicBarChart
                        title="Utilidad por Mes"
                        data={profitBarData}
                        indexBy="month"
                        keys={["Utilidad"]}
                        xLegend="Mes"
                        yLegend="Utilidad ($)"
                        height={300}
                        colors={["#3b82f6"]}
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
                                <i className="ri-arrow-up-down-line me-1"></i> Costo vs Ingreso
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-group-line me-1"></i> Por Grupo ({byGroup.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-shopping-bag-line me-1"></i> Por Venta ({bySale.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => setActiveTab("4")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-user-star-line me-1"></i> Por Cliente ({byClient.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={costVsIncomeColumns} data={costVsIncome} showSearchAndFilter={false} showPagination={false} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={groupColumns} data={byGroup} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={saleColumns} data={bySale} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="4">
                            <CustomTable columns={clientColumns} data={byClient} showSearchAndFilter rowsPerPage={15} />
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

export default ProfitabilityReport;
