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

interface FcrRecord {
    groupName: string;
    feedConsumed: number;
    weightGained: number;
    fcr: number;
    stage: string;
}

interface AdgRecord {
    groupName: string;
    initialWeight: number;
    currentWeight: number;
    days: number;
    adg: number;
}

interface WeightByGroup {
    groupName: string;
    stage: string;
    pigCount: number;
    avgWeight: number;
    minWeight: number;
    maxWeight: number;
}

interface DaysInStage {
    stage: string;
    stageLabel: string;
    avgDays: number;
    minDays: number;
    maxDays: number;
    targetDays: number;
}

interface FeedWeightKpis {
    avgFcr: number;
    bestFcr: number;
    avgAdg: number;
    bestAdg: number;
    avgWeight: number;
    totalFeedConsumed: number;
}

interface MonthlyWeight {
    month: string;
    avgWeight: number;
    avgFcr: number;
}

const FeedWeightReport = () => {
    document.title = "Conversion Alimenticia y Peso | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [fcrData, setFcrData] = useState<FcrRecord[]>([]);
    const [adgData, setAdgData] = useState<AdgRecord[]>([]);
    const [weightData, setWeightData] = useState<WeightByGroup[]>([]);
    const [daysData, setDaysData] = useState<DaysInStage[]>([]);
    const [kpis, setKpis] = useState<FeedWeightKpis>({
        avgFcr: 0, bestFcr: 0, avgAdg: 0, bestAdg: 0, avgWeight: 0, totalFeedConsumed: 0,
    });
    const [monthlyTrend, setMonthlyTrend] = useState<MonthlyWeight[]>([]);

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
                `${configContext.apiUrl}/reports/production/feed-weight/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setFcrData(data.fcrByGroup || []);
            setAdgData(data.adgByGroup || []);
            setWeightData(data.weightByGroup || []);
            setDaysData(data.daysInStage || []);
            setKpis(data.kpis);
            setMonthlyTrend(data.monthlyTrend || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/production/feed-weight/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Columns
    const fcrColumns: Column<FcrRecord>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        { header: "Etapa", accessor: "stage", type: "text" },
        {
            header: "Alimento (kg)", accessor: "feedConsumed", type: "text",
            render: (v: number) => <span>{v?.toLocaleString()} kg</span>,
        },
        {
            header: "Peso Ganado (kg)", accessor: "weightGained", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => <span>{v?.toLocaleString()} kg</span>,
        },
        {
            header: "FCR", accessor: "fcr", type: "text", bgColor: "#fff8e1",
            render: (v: number) => (
                <span className={`fw-semibold ${v <= 2.5 ? "text-success" : v <= 3.5 ? "text-warning" : "text-danger"}`}>
                    {v?.toFixed(2)}
                </span>
            ),
        },
    ];

    const adgColumns: Column<AdgRecord>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        {
            header: "Peso Inicial (kg)", accessor: "initialWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        {
            header: "Peso Actual (kg)", accessor: "currentWeight", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        {
            header: "Dias", accessor: "days", type: "number",
        },
        {
            header: "ADG (kg/dia)", accessor: "adg", type: "text", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 0.8 ? "text-success" : v >= 0.5 ? "text-warning" : "text-danger"}`}>
                    {v?.toFixed(3)}
                </span>
            ),
        },
    ];

    const weightColumns: Column<WeightByGroup>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        { header: "Etapa", accessor: "stage", type: "text" },
        { header: "Cerdos", accessor: "pigCount", type: "number" },
        {
            header: "Peso Prom. (kg)", accessor: "avgWeight", type: "text", bgColor: "#e3f2fd",
            render: (v: number) => <span className="fw-semibold">{v?.toFixed(1)} kg</span>,
        },
        {
            header: "Min (kg)", accessor: "minWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        {
            header: "Max (kg)", accessor: "maxWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
    ];

    const daysColumns: Column<DaysInStage>[] = [
        { header: "Etapa", accessor: "stageLabel", type: "text" },
        { header: "Dias Prom.", accessor: "avgDays", type: "number", bgColor: "#e3f2fd" },
        { header: "Min", accessor: "minDays", type: "number" },
        { header: "Max", accessor: "maxDays", type: "number" },
        {
            header: "Objetivo", accessor: "targetDays", type: "number", bgColor: "#e8f5e9",
        },
    ];

    // Charts
    const weightTrendData = [{
        id: "Peso Prom.",
        data: monthlyTrend.map(m => ({ x: m.month, y: m.avgWeight })),
    }];

    const fcrBarData = fcrData.slice(0, 15).map(f => ({
        grupo: f.groupName,
        FCR: f.fcr,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Conversion Alimenticia y Peso"
            pageTitle="Reportes de Produccion"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Conversion Alimenticia y Peso"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="FCR Promedio"
                        value={kpis.avgFcr}
                        icon={<i className="ri-restaurant-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={2}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Mejor FCR"
                        value={kpis.bestFcr}
                        icon={<i className="ri-trophy-line fs-4 text-success"></i>}
                        animateValue
                        decimals={2}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="ADG Promedio"
                        value={kpis.avgAdg}
                        icon={<i className="ri-line-chart-line fs-4 text-primary"></i>}
                        animateValue
                        decimals={3}
                        suffix=" kg/dia"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Mejor ADG"
                        value={kpis.bestAdg}
                        icon={<i className="ri-rocket-line fs-4 text-success"></i>}
                        animateValue
                        decimals={3}
                        suffix=" kg/dia"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Peso Promedio"
                        value={kpis.avgWeight}
                        icon={<i className="ri-scales-3-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        suffix=" kg"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Alimento Total"
                        value={kpis.totalFeedConsumed}
                        icon={<i className="ri-plant-line fs-4 text-success"></i>}
                        animateValue
                        suffix=" kg"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title="Tendencia de Peso Promedio"
                        data={weightTrendData}
                        yLabel="Peso (kg)"
                        xLabel="Mes"
                        height={280}
                        color="#3b82f6"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title="FCR por Grupo"
                        data={fcrBarData}
                        indexBy="grupo"
                        keys={["FCR"]}
                        xLegend="Grupo"
                        yLegend="FCR"
                        height={280}
                        colors={["#f59e0b"]}
                    />
                </Col>
            </Row>

            {/* Tables */}
            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-restaurant-line me-1"></i> FCR por Grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-line-chart-line me-1"></i> ADG por Grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-scales-3-line me-1"></i> Peso por Grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => setActiveTab("4")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-calendar-line me-1"></i> Dias por Etapa
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={fcrColumns} data={fcrData} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={adgColumns} data={adgData} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={weightColumns} data={weightData} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="4">
                            <CustomTable columns={daysColumns} data={daysData} showSearchAndFilter={false} showPagination={false} />
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

export default FeedWeightReport;
