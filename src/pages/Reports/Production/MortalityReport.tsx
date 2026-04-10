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
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import classnames from "classnames";

interface MortalityByStage {
    stage: string;
    stageLabel: string;
    deaths: number;
    totalAnimals: number;
    rate: number;
}

interface MortalityByGroup {
    groupName: string;
    deaths: number;
    totalAnimals: number;
    rate: number;
    accumulatedDeaths: number;
}

interface MortalityByCause {
    cause: string;
    count: number;
    percentage: number;
}

interface MortalityKpis {
    totalDeaths: number;
    overallRate: number;
    highestStage: string;
    highestStageRate: number;
    deadPigletsByArea: number;
    avgDeathsPerMonth: number;
}

interface MonthlyMortality {
    month: string;
    deaths: number;
    rate: number;
}

const causeColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#06b6d4", "#8b5cf6", "#ec4899", "#6b7280"];

const MortalityReport = () => {
    document.title = "Reporte de Mortalidad | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [byStage, setByStage] = useState<MortalityByStage[]>([]);
    const [byGroup, setByGroup] = useState<MortalityByGroup[]>([]);
    const [byCause, setByCause] = useState<MortalityByCause[]>([]);
    const [monthlyTrend, setMonthlyTrend] = useState<MonthlyMortality[]>([]);
    const [kpis, setKpis] = useState<MortalityKpis>({
        totalDeaths: 0,
        overallRate: 0,
        highestStage: "",
        highestStageRate: 0,
        deadPigletsByArea: 0,
        avgDeathsPerMonth: 0,
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
                `${configContext.apiUrl}/reports/production/mortality/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setByStage(data.byStage || []);
            setByGroup(data.byGroup || []);
            setByCause(data.byCause || []);
            setMonthlyTrend(data.monthlyTrend || []);
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
            `${configContext.apiUrl}/reports/production/mortality/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Table columns
    const stageColumns: Column<MortalityByStage>[] = [
        { header: "Etapa", accessor: "stageLabel", type: "text", isFilterable: true },
        { header: "Muertes", accessor: "deaths", type: "number", bgColor: "#ffebee" },
        { header: "Total Animales", accessor: "totalAnimals", type: "number" },
        {
            header: "Tasa %", accessor: "rate", type: "text",
            render: (v: number) => (
                <span className={v > 5 ? "text-danger fw-semibold" : v > 3 ? "text-warning fw-semibold" : "text-success"}>
                    {v?.toFixed(2)}%
                </span>
            ),
            bgColor: "#fff8e1",
        },
    ];

    const groupColumns: Column<MortalityByGroup>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        { header: "Muertes", accessor: "deaths", type: "number", bgColor: "#ffebee" },
        { header: "Total Animales", accessor: "totalAnimals", type: "number" },
        {
            header: "Tasa %", accessor: "rate", type: "text",
            render: (v: number) => (
                <span className={v > 5 ? "text-danger fw-semibold" : v > 3 ? "text-warning fw-semibold" : "text-success"}>
                    {v?.toFixed(2)}%
                </span>
            ),
        },
        { header: "Acumuladas", accessor: "accumulatedDeaths", type: "number", bgColor: "#fce4ec" },
    ];

    const causeColumns: Column<MortalityByCause>[] = [
        { header: "Causa", accessor: "cause", type: "text", isFilterable: true },
        { header: "Cantidad", accessor: "count", type: "number", bgColor: "#ffebee" },
        {
            header: "Porcentaje", accessor: "percentage", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)}%</span>,
        },
    ];

    // Chart data
    const trendLineData = [{
        id: "Mortalidad %",
        data: monthlyTrend.map(m => ({ x: m.month, y: m.rate })),
    }];

    const stageBarData = byStage.map(s => ({
        etapa: s.stageLabel,
        Muertes: s.deaths,
    }));

    const causeDonutData: DonutDataItem[] = byCause.map((c, i) => ({
        id: c.cause,
        label: c.cause,
        value: c.count,
        color: causeColors[i % causeColors.length],
    }));

    const causeDonutLegend: DonutLegendItem[] = byCause.map(c => ({
        label: c.cause,
        value: c.count,
        percentage: `${c.percentage.toFixed(1)}%`,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Reporte de Mortalidad"
            pageTitle="Reportes de Produccion"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Mortalidad"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Muertes"
                        value={kpis.totalDeaths}
                        icon={<i className="ri-skull-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Tasa General"
                        value={kpis.overallRate}
                        icon={<i className="ri-percent-line fs-4 text-warning"></i>}
                        animateValue
                        decimals={2}
                        suffix="%"
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Etapa con Mayor Tasa"
                        value={kpis.highestStageRate}
                        subtext={kpis.highestStage}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        animateValue
                        decimals={2}
                        suffix="%"
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Lechones Muertos"
                        value={kpis.deadPigletsByArea}
                        icon={<i className="mdi mdi-baby-bottle-outline fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Prom. Muertes / Mes"
                        value={kpis.avgDeathsPerMonth}
                        icon={<i className="ri-calendar-line fs-4 text-secondary"></i>}
                        animateValue
                        decimals={1}
                        iconBgColor="#F5F5F5"
                    />
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-3 mb-3">
                <Col xl={8}>
                    <BasicLineChartCard
                        title="Tendencia de Mortalidad Mensual"
                        data={trendLineData}
                        yLabel="Tasa %"
                        xLabel="Mes"
                        height={300}
                        color="#ef4444"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={4}>
                    <DonutChartCard
                        title="Mortalidad por Causa"
                        data={causeDonutData}
                        legendItems={causeDonutLegend}
                        height={180}
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title="Muertes por Etapa"
                        data={stageBarData}
                        indexBy="etapa"
                        keys={["Muertes"]}
                        xLegend="Etapa"
                        yLegend="Muertes"
                        height={250}
                        colors={["#ef4444"]}
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
                                <i className="ri-stack-line me-1"></i> Por Etapa
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-group-line me-1"></i> Por Grupo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-stethoscope-line me-1"></i> Por Causa
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={stageColumns} data={byStage} showSearchAndFilter={false} showPagination={false} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={groupColumns} data={byGroup} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={causeColumns} data={byCause} showSearchAndFilter={false} showPagination={false} />
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

export default MortalityReport;
