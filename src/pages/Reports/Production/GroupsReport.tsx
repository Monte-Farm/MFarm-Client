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

interface GroupRecord {
    _id: string;
    name: string;
    stage: string;
    pigCount: number;
    avgWeight: number;
    entryDate: string;
    daysInStage: number;
}

interface GroupMovement {
    _id: string;
    date: string;
    groupName: string;
    movementType: string;
    quantity: number;
    origin: string;
    destination: string;
    observations: string;
}

interface GroupSummary {
    _id: string;
    groupName: string;
    entries: number;
    exits: number;
    deaths: number;
    currentCount: number;
    avgWeight: number;
    totalFeedConsumed: number;
}

interface GroupKpis {
    totalGroups: number;
    totalPigs: number;
    avgPigsPerGroup: number;
    totalMovements: number;
    avgDaysInStage: number;
    totalDeaths: number;
}

const stageLabels: Record<string, { label: string; color: string }> = {
    lactation: { label: "Lactancia", color: "info" },
    weaning: { label: "Destete", color: "primary" },
    growing: { label: "Crecimiento", color: "success" },
    finishing: { label: "Engorda", color: "warning" },
    sold: { label: "Vendido", color: "secondary" },
};

const movementLabels: Record<string, { label: string; color: string }> = {
    entry: { label: "Entrada", color: "success" },
    exit: { label: "Salida", color: "warning" },
    transfer: { label: "Transferencia", color: "info" },
    death: { label: "Muerte", color: "danger" },
    sale: { label: "Venta", color: "primary" },
};

const GroupsReport = () => {
    document.title = "Reporte de Grupos | Reportes";

    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeTab, setActiveTab] = useState("1");

    const [groups, setGroups] = useState<GroupRecord[]>([]);
    const [movements, setMovements] = useState<GroupMovement[]>([]);
    const [summaries, setSummaries] = useState<GroupSummary[]>([]);
    const [kpis, setKpis] = useState<GroupKpis>({
        totalGroups: 0,
        totalPigs: 0,
        avgPigsPerGroup: 0,
        totalMovements: 0,
        avgDaysInStage: 0,
        totalDeaths: 0,
    });
    const [groupsByStage, setGroupsByStage] = useState<any[]>([]);

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
                `${configContext.apiUrl}/reports/production/groups/${userLogged.farm_assigned}?start_date=${startDate}&end_date=${endDate}`
            );
            const data = res.data.data;
            setGroups(data.groups || []);
            setMovements(data.movements || []);
            setSummaries(data.summaries || []);
            setKpis(data.kpis);
            setGroupsByStage(data.groupsByStage || []);
        } catch {
            setAlertConfig({ visible: true, color: "danger", message: "Error al cargar los datos del reporte." });
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (pdfStart: string, pdfEnd: string): Promise<string> => {
        if (!configContext) throw new Error("No config");
        const response = await configContext.axiosHelper.getBlob(
            `${configContext.apiUrl}/reports/production/groups/pdf/${userLogged.farm_assigned}?start_date=${pdfStart}&end_date=${pdfEnd}&orientation=landscape&format=A4`
        );
        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        return window.URL.createObjectURL(pdfBlob);
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const groupColumns: Column<GroupRecord>[] = [
        { header: "Grupo", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Etapa", accessor: "stage", type: "text",
            render: (value: string) => {
                const s = stageLabels[value] || { label: value, color: "secondary" };
                return <Badge color={s.color}>{s.label}</Badge>;
            },
        },
        { header: "Cerdos", accessor: "pigCount", type: "number", bgColor: "#e3f2fd" },
        {
            header: "Peso Prom.", accessor: "avgWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        { header: "Fecha Entrada", accessor: "entryDate", type: "date" },
        {
            header: "Dias en Etapa", accessor: "daysInStage", type: "number",
            render: (v: number) => <span>{v} dias</span>,
        },
    ];

    const movementColumns: Column<GroupMovement>[] = [
        { header: "Fecha", accessor: "date", type: "date", isFilterable: true },
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        {
            header: "Tipo", accessor: "movementType", type: "text",
            render: (value: string) => {
                const m = movementLabels[value] || { label: value, color: "secondary" };
                return <Badge color={m.color}>{m.label}</Badge>;
            },
        },
        { header: "Cantidad", accessor: "quantity", type: "number", bgColor: "#e3f2fd" },
        { header: "Origen", accessor: "origin", type: "text" },
        { header: "Destino", accessor: "destination", type: "text" },
        { header: "Observaciones", accessor: "observations", type: "text" },
    ];

    const summaryColumns: Column<GroupSummary>[] = [
        { header: "Grupo", accessor: "groupName", type: "text", isFilterable: true },
        { header: "Entradas", accessor: "entries", type: "number", bgColor: "#e8f5e9" },
        { header: "Salidas", accessor: "exits", type: "number", bgColor: "#fff3e0" },
        { header: "Muertes", accessor: "deaths", type: "number", bgColor: "#ffebee" },
        { header: "Actual", accessor: "currentCount", type: "number", bgColor: "#e3f2fd" },
        {
            header: "Peso Prom.", accessor: "avgWeight", type: "text",
            render: (v: number) => <span>{v?.toFixed(1)} kg</span>,
        },
        {
            header: "Alimento (kg)", accessor: "totalFeedConsumed", type: "text",
            render: (v: number) => <span>{v?.toFixed(0)} kg</span>,
        },
    ];

    const stageBarData = groupsByStage.map((s: any) => ({
        stage: stageLabels[s.stage]?.label || s.stage,
        Grupos: s.groupCount,
        Cerdos: s.pigCount,
    }));

    if (loading) return <LoadingAnimation />;

    return (
        <ReportPageLayout
            title="Reporte de Grupos"
            pageTitle="Reportes de Produccion"
            onGeneratePdf={handleGeneratePdf}
            pdfTitle="Reporte - Grupos"
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        >
            {/* KPIs */}
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Grupos"
                        value={kpis.totalGroups}
                        icon={<i className="ri-group-line fs-4 text-primary"></i>}
                        animateValue
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Total Cerdos"
                        value={kpis.totalPigs}
                        icon={<i className="bx bxs-dog fs-4 text-info"></i>}
                        animateValue
                        iconBgColor="#E0F7FA"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Prom. / Grupo"
                        value={kpis.avgPigsPerGroup}
                        icon={<i className="ri-bar-chart-line fs-4 text-success"></i>}
                        animateValue
                        decimals={1}
                        iconBgColor="#E8F5E9"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Movimientos"
                        value={kpis.totalMovements}
                        icon={<i className="ri-arrow-left-right-line fs-4 text-warning"></i>}
                        animateValue
                        iconBgColor="#FFF8E1"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Dias Prom. Etapa"
                        value={kpis.avgDaysInStage}
                        icon={<i className="ri-calendar-line fs-4 text-secondary"></i>}
                        animateValue
                        decimals={0}
                        suffix=" dias"
                        iconBgColor="#F5F5F5"
                    />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard
                        title="Muertes"
                        value={kpis.totalDeaths}
                        icon={<i className="ri-alert-line fs-4 text-danger"></i>}
                        animateValue
                        iconBgColor="#FFEBEE"
                    />
                </Col>
            </Row>

            {/* Chart */}
            <Row className="g-3 mb-3">
                <Col xl={12}>
                    <BasicBarChart
                        title="Grupos y Cerdos por Etapa"
                        data={stageBarData}
                        indexBy="stage"
                        keys={["Grupos", "Cerdos"]}
                        xLegend="Etapa"
                        yLegend="Cantidad"
                        height={280}
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
                                <i className="ri-group-line me-1"></i> Existencia ({groups.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-arrow-left-right-line me-1"></i> Movimientos ({movements.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <i className="ri-file-list-3-line me-1"></i> Resumen Productivo ({summaries.length})
                            </NavLink>
                        </NavItem>
                    </Nav>
                </CardHeader>
                <CardBody>
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <CustomTable columns={groupColumns} data={groups} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="2">
                            <CustomTable columns={movementColumns} data={movements} showSearchAndFilter rowsPerPage={15} />
                        </TabPane>
                        <TabPane tabId="3">
                            <CustomTable columns={summaryColumns} data={summaries} showSearchAndFilter rowsPerPage={15} />
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

export default GroupsReport;
