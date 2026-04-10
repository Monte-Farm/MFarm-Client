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

interface InseminationEffectiveness {
    month: string;
    total: number;
    successful: number;
    rate: number;
}

interface WeaningInterval {
    sowIdentifier: string;
    lastWeaningDate: string;
    heatDate: string;
    intervalDays: number;
}

interface BirthsPerSow {
    sowIdentifier: string;
    totalBirths: number;
    avgBornAlive: number;
    avgBornDead: number;
    totalBornAlive: number;
    totalWeanedPiglets: number;
}

interface BornAliveVsDead {
    month: string;
    bornAlive: number;
    bornDead: number;
    mummified: number;
    total: number;
}

interface ReproductiveKpis {
    inseminationEffectiveness: number;
    avgWeaningHeatInterval: number;
    avgBirthsPerSow: number;
    avgBornAlivePerBirth: number;
    avgBornDeadPerBirth: number;
    avgWeanedPerSow: number;
    totalInseminations: number;
    totalBirths: number;
}

const ReproductiveReport = () => {
    document.title = "Rendimiento Reproductivo | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [effectivenessData, setEffectivenessData] = useState<InseminationEffectiveness[]>([]);
    const [intervalData, setIntervalData] = useState<WeaningInterval[]>([]);
    const [birthsPerSow, setBirthsPerSow] = useState<BirthsPerSow[]>([]);
    const [bornData, setBornData] = useState<BornAliveVsDead[]>([]);
    const [kpis, setKpis] = useState<ReproductiveKpis>({
        inseminationEffectiveness: 0,
        avgWeaningHeatInterval: 0,
        avgBirthsPerSow: 0,
        avgBornAlivePerBirth: 0,
        avgBornDeadPerBirth: 0,
        avgWeanedPerSow: 0,
        totalInseminations: 0,
        totalBirths: 0,
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
                `${configContext.apiUrl}/reports/production/reproductive/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setEffectivenessData(data.inseminationEffectiveness || []);
            setIntervalData(data.weaningIntervals || []);
            setBirthsPerSow(data.birthsPerSow || []);
            setBornData(data.bornAliveVsDead || []);
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
            `${configContext.apiUrl}/reports/production/reproductive/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Columns
    const effectivenessColumns: Column<InseminationEffectiveness>[] = [
        { header: "Mes", accessor: "month", type: "text" },
        { header: "Total", accessor: "total", type: "number" },
        { header: "Exitosas", accessor: "successful", type: "number", bgColor: "#e8f5e9" },
        {
            header: "Efectividad", accessor: "rate", type: "text", bgColor: "#fff8e1",
            render: (v: number) => (
                <span className={`fw-semibold ${v >= 85 ? "text-success" : v >= 70 ? "text-warning" : "text-danger"}`}>
                    {v?.toFixed(1)}%
                </span>
            ),
        },
    ];

    const intervalColumns: Column<WeaningInterval>[] = [
        { header: "Cerda", accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: "Fecha Destete", accessor: "lastWeaningDate", type: "date" },
        { header: "Fecha Celo", accessor: "heatDate", type: "date" },
        {
            header: "Intervalo (dias)", accessor: "intervalDays", type: "number", bgColor: "#e3f2fd",
            render: (v: number) => (
                <span className={`fw-semibold ${v <= 7 ? "text-success" : v <= 14 ? "text-warning" : "text-danger"}`}>
                    {v} dias
                </span>
            ),
        },
    ];

    const birthsPerSowColumns: Column<BirthsPerSow>[] = [
        { header: "Cerda", accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: "Total Partos", accessor: "totalBirths", type: "number" },
        {
            header: "Prom. Vivos", accessor: "avgBornAlive", type: "text", bgColor: "#e8f5e9",
            render: (v: number) => <span>{v?.toFixed(1)}</span>,
        },
        {
            header: "Prom. Muertos", accessor: "avgBornDead", type: "text", bgColor: "#ffebee",
            render: (v: number) => <span>{v?.toFixed(1)}</span>,
        },
        { header: "Total Nacidos Vivos", accessor: "totalBornAlive", type: "number" },
        { header: "Total Destetados", accessor: "totalWeanedPiglets", type: "number", bgColor: "#e3f2fd" },
    ];

    // Charts
    const effectivenessLineData = [{
        id: "Efectividad %",
        data: effectivenessData.map(e => ({ x: e.month, y: e.rate })),
        color: "#10b981",
    }];

    const bornBarData = bornData.map(b => ({
        month: b.month,
        "Nacidos Vivos": b.bornAlive,
        "Nacidos Muertos": b.bornDead,
        Momificados: b.mummified,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Rendimiento Reproductivo"
            pageTitle="Reportes de Produccion"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Rendimiento Reproductivo"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Efectividad Inseminacion"
                        value={kpis.inseminationEffectiveness}
                        icon={<i className="ri-check-double-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Intervalo Destete-Celo"
                        value={kpis.avgWeaningHeatInterval}
                        icon={<i className="ri-timer-line fs-4 text-info"></i>}
                        animateValue
                        decimals={1}
                        suffix=" dias"
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Partos / Cerda"
                        value={kpis.avgBirthsPerSow}
                        icon={<i className="mdi mdi-baby-bottle-outline fs-4 text-primary"></i>}
                        animateValue
                        decimals={1}
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Destetados / Cerda"
                        value={kpis.avgWeanedPerSow}
                        icon={<i className="mdi mdi-baby-carriage fs-4 text-warning"></i>}
                        animateValue
                        decimals={1}
                        iconBgColor="#FFF8E1"
                    />
                </Col>
            </Row>

            <Row className="g-3 mb-3">
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Prom. Nacidos Vivos"
                        value={kpis.avgBornAlivePerBirth}
                        icon={<i className="ri-heart-2-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix=" / parto"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Prom. Nacidos Muertos"
                        value={kpis.avgBornDeadPerBirth}
                        icon={<i className="ri-close-circle-line fs-4 text-danger"></i>}
                        animateValue
                        decimals={1}
                        suffix=" / parto"
                        iconBgColor="#FFEBEE"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Inseminaciones"
                        value={kpis.totalInseminations}
                        icon={<i className="ri-heart-pulse-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Partos"
                        value={kpis.totalBirths}
                        icon={<i className="ri-calendar-check-line fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-3 mb-3">
                <Col xl={6}>
                    <BasicLineChartCard
                        title="Efectividad de Inseminacion por Mes"
                        data={effectivenessLineData}
                        yLabel="Efectividad %"
                        xLabel="Mes"
                        height={280}
                        color="#10b981"
                        enableArea
                        areaOpacity={0.08}
                    />
                </Col>
                <Col xl={6}>
                    <BasicBarChart
                        title="Nacidos Vivos vs Muertos por Mes"
                        data={bornBarData}
                        indexBy="month"
                        keys={["Nacidos Vivos", "Nacidos Muertos", "Momificados"]}
                        xLegend="Mes"
                        yLegend="Cantidad"
                        height={280}
                        colors={["#10b981", "#ef4444", "#6b7280"]}
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
                                <i className="ri-check-double-line me-1"></i> Efectividad Inseminacion
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-timer-line me-1"></i> Intervalo Destete-Celo
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="mdi mdi-baby-bottle-outline me-1"></i> Partos por Cerda
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={effectivenessColumns} data={effectivenessData} showSearchAndFilter={false} showPagination={false} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={intervalColumns} data={intervalData} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={birthsPerSowColumns} data={birthsPerSow} showSearchAndFilter rowsPerPage={15} />
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

export default ReproductiveReport;
