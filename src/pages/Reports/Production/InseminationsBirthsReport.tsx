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

interface InseminationRecord {
    _id: string;
    date: string;
    sowIdentifier: string;
    boarOrSample: string;
    technician: string;
    result: string;
    observations: string;
}

interface BirthRecord {
    _id: string;
    date: string;
    sowIdentifier: string;
    bornAlive: number;
    bornDead: number;
    mummified: number;
    totalBorn: number;
    observations: string;
}

interface ReportKpis {
    totalInseminations: number;
    successfulInseminations: number;
    effectivenessRate: number;
    totalBirths: number;
    avgBornAlive: number;
    avgBornDead: number;
    totalBornAlive: number;
    totalBornDead: number;
}

const resultLabels: Record<string, { label: string; color: string }> = {
    success: { label: "Exitosa", color: "success" },
    pending: { label: "Pendiente", color: "warning" },
    failed: { label: "Fallida", color: "danger" },
};

const InseminationsBirthsReport = () => {
    document.title = "Inseminaciones y Partos | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [inseminations, setInseminations] = useState<InseminationRecord[]>([]);
    const [births, setBirths] = useState<BirthRecord[]>([]);
    const [kpis, setKpis] = useState<ReportKpis>({
        totalInseminations: 0,
        successfulInseminations: 0,
        effectivenessRate: 0,
        totalBirths: 0,
        avgBornAlive: 0,
        avgBornDead: 0,
        totalBornAlive: 0,
        totalBornDead: 0,
    });
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

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
                `${configContext.apiUrl}/reports/production/inseminations-births/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setInseminations(data.inseminations || []);
            setBirths(data.births || []);
            setKpis(data.kpis);
            setMonthlyData(data.monthlyData || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/production/inseminations-births/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=portrait&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const inseminationColumns: Column<InseminationRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Cerda", accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: "Berraco / Muestra", accessor: "boarOrSample", type: "text", isFilterable: true },
        { header: "Tecnico", accessor: "technician", type: "text", isFilterable: true },
        {
            header: "Resultado",
            accessor: "result",
            type: "text",
            render: (value: string) => {
                const r = resultLabels[value] || { label: value, color: "secondary" };
                return <Badge color={r.color}>{r.label}</Badge>;
            },
        },
        { header: "Observaciones", accessor: "observations", type: "text" },
    ];

    const birthColumns: Column<BirthRecord>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Cerda", accessor: "sowIdentifier", type: "text", isFilterable: true },
        { header: "Nacidos Vivos", accessor: "bornAlive", type: "number", bgColor: "#e8f5e9" },
        { header: "Nacidos Muertos", accessor: "bornDead", type: "number", bgColor: "#ffebee" },
        { header: "Momificados", accessor: "mummified", type: "number" },
        { header: "Total", accessor: "totalBorn", type: "number", bgColor: "#e3f2fd" },
        { header: "Observaciones", accessor: "observations", type: "text" },
    ];

    const birthsBarData = monthlyData.map((m: any) => ({
        month: m.month,
        "Nacidos Vivos": m.bornAlive,
        "Nacidos Muertos": m.bornDead,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Inseminaciones y Partos"
            pageTitle="Reportes de Produccion"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Inseminaciones y Partos"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
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
                        title="Efectividad"
                        value={kpis.effectivenessRate}
                        icon={<i className="ri-check-double-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix="%"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Total Partos"
                        value={kpis.totalBirths}
                        icon={<i className="mdi mdi-baby-bottle-outline fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={3} md={6}>
                    <StatKpiCard
                        title="Prom. Nacidos Vivos"
                        value={kpis.avgBornAlive}
                        icon={<i className="ri-heart-2-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        suffix=" / parto"
                        iconBgColor="#E8F5E9"
                    />
                </Col>
            </Row>

            {/* Chart - Births by month */}
            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title="Nacidos Vivos vs Muertos por Mes"
                        data={birthsBarData}
                        indexBy="month"
                        keys={["Nacidos Vivos", "Nacidos Muertos"]}
                        xLegend="Mes"
                        yLegend="Cantidad"
                        height={280}
                        colors={["#10b981", "#ef4444"]}
                    />
                </Col>
            </Row>

            {/* Tables with tabs */}
            <Card>
                <CardHeader>
                    <Nav tabs className="card-header-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-heart-pulse-line me-1"></i> Inseminaciones ({inseminations.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="mdi mdi-baby-bottle-outline me-1"></i> Partos ({births.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable
                                columns={inseminationColumns}
                                data={inseminations}
                                showSearchAndFilter
                                rowsPerPage={15}
                            />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable
                                columns={birthColumns}
                                data={births}
                                showSearchAndFilter
                                rowsPerPage={15}
                            />
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

export default InseminationsBirthsReport;
