import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import SimpleBar from "simplebar-react";
import { Column } from "common/data/data_types";
import LoadingAnimation from "../Shared/LoadingAnimation";
import StatKpiCard from "../Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "../Graphics/DonutChartCard";
import BasicBarChart from "../Graphics/BasicBarChart";
import CustomTable from "../Tables/CustomTable";

interface SaleDetailsProps {
    saleId: string;
}

const fmt = (v: number, decimals = 2) => v?.toFixed(decimals) ?? "—";
const fmtCurrency = (v: number) => `$${fmt(v)}`;

const paymentMethodLabel: Record<string, string> = {
    cash: "Efectivo", transfer: "Transferencia", check: "Cheque", credit: "Crédito", other: "Otro",
};
const paymentStatusLabel: Record<string, string> = {
    pending: "Pendiente", partial: "Parcial", completed: "Completado",
};
const paymentStatusColor: Record<string, string> = {
    pending: "warning", partial: "info", completed: "success",
};
const saleTypeLabel: Record<string, string> = {
    individual: "Individual", group: "Grupo", mixed: "Mixta",
};
const sexLabel: Record<string, string> = {
    male: "Macho", female: "Hembra",
};
const stageLabel: Record<string, string> = {
    piglet: "Lechón", weaner: "Destete", grower: "Crecimiento", finisher: "Finalización", breeding: "Reproductor",
};

const SaleDetails: React.FC<SaleDetailsProps> = ({ saleId }) => {
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState(true);
    const [saleDetails, setSaleDetails] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("metrics");

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const [detailsRes, metricsRes] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/finances/pig_sales/find_by_id/${saleId}`
                ),
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/finances/pig_sales/metrics/${saleId}`
                ),
            ]);
            setSaleDetails(detailsRes.data.data || null);
            setMetrics(metricsRes.data.data || null);
        } catch {
            setSaleDetails(null);
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (saleId) fetchData();
    }, [saleId]);

    if (loading) return <LoadingAnimation />;

    if (!saleDetails) return <p className="text-muted text-center">No se encontraron detalles.</p>;

    const { summary, profitability, timeMetrics, feedEfficiency, survivalMetrics, costBreakdown, weightMetrics } = metrics || {};

    const costDonutData: DonutDataItem[] = [
        { id: "feed", label: "Alimentación", value: costBreakdown?.feed || 0, color: "#4f46e5" },
        { id: "medication", label: "Medicación", value: costBreakdown?.medication || 0, color: "#06b6d4" },
        { id: "vaccines", label: "Vacunas", value: costBreakdown?.vaccines || 0, color: "#f59e0b" },
        { id: "other", label: "Otros", value: costBreakdown?.other || 0, color: "#8b5cf6" },
    ].filter(d => d.value > 0);

    const costLegendItems: DonutLegendItem[] = [
        { label: "Alimentación", value: fmtCurrency(costBreakdown?.feed), percentage: `${fmt(costBreakdown?.feedPercentage, 1)}%` },
        { label: "Medicación", value: fmtCurrency(costBreakdown?.medication), percentage: `${fmt(costBreakdown?.medicationPercentage, 1)}%` },
        { label: "Vacunas", value: fmtCurrency(costBreakdown?.vaccines), percentage: `${fmt(costBreakdown?.vaccinePercentage, 1)}%` },
        { label: "Otros", value: fmtCurrency(costBreakdown?.other), percentage: `${fmt(costBreakdown?.otherPercentage, 1)}%` },
    ];

    const round2 = (v: number) => Math.round((v || 0) * 100) / 100;

    const profitBarData = [
        { category: "Ingresos", valor: round2(summary?.totalAmount), color: "#10b981" },
        { category: "Costos", valor: round2(profitability?.totalProductionCost), color: "#ef4444" },
        { category: "Ganancia", valor: round2(profitability?.profit), color: "#3b82f6" },
    ];

    const pigColumns: Column<any>[] = [
        {
            header: "Código",
            accessor: "pig" as any,
            isFilterable: true,
            type: "text",
            render: (_, row) => <span className="fw-semibold">{row.pig?.code || "—"}</span>,
            bgColor: "#f0f4ff",
        },
        {
            header: "Raza",
            accessor: "pig" as any,
            type: "text",
            render: (_, row) => <span>{row.pig?.breed || "—"}</span>,
        },
        {
            header: "Sexo",
            accessor: "pig" as any,
            type: "text",
            render: (_, row) => (
                <span>
                    <i className={`ri-${row.pig?.sex === "male" ? "men" : "women"}-line me-1`}></i>
                    {sexLabel[row.pig?.sex] || row.pig?.sex}
                </span>
            ),
        },
        {
            header: "Etapa",
            accessor: "pig" as any,
            type: "text",
            render: (_, row) => <Badge color="info">{stageLabel[row.pig?.currentStage] || row.pig?.currentStage}</Badge>,
        },
        {
            header: "Peso (kg)",
            accessor: "weight" as any,
            type: "text",
            render: (_, row) => <span>{fmt(row.weight)}</span>,
        },
        {
            header: "Precio/kg",
            accessor: "pricePerKg" as any,
            type: "text",
            render: (_, row) => <span>{fmtCurrency(row.pricePerKg)}</span>,
        },
        {
            header: "Total",
            accessor: "totalPrice" as any,
            type: "text",
            render: (_, row) => <span className="fw-semibold">{fmtCurrency(row.totalPrice)}</span>,
            bgColor: "#f0fdf4",
        },
    ];

    return (
        <div>
            <Nav tabs className="nav-tabs-custom rounded-top border-bottom-0">
                <NavItem>
                    <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames(
                            "rounded-top-3 fw-semibold",
                            { active: activeTab === "metrics" }
                        )}
                        onClick={() => toggleTab("metrics")}
                    >
                        <i className="ri-bar-chart-2-line me-1 align-middle text-primary"></i>
                        Métricas
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        style={{ cursor: "pointer" }}
                        className={classnames(
                            "rounded-top-3 fw-semibold",
                            { active: activeTab === "details" }
                        )}
                        onClick={() => toggleTab("details")}
                    >
                        <i className="ri-file-list-3-line me-1 align-middle text-success"></i>
                        Detalles
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="border border-top-0 rounded-bottom">
                <TabPane tabId="metrics">
                    {metrics ? (
                        <SimpleBar style={{ maxHeight: "65vh", padding: "1rem" }}>
                            {/* Resumen financiero */}
                            <h6 className="text-muted text-uppercase mb-3">Resumen financiero</h6>
                            <Row className="g-3 mb-3">
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Ingreso total"
                                        value={summary?.totalAmount || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                                        iconBgColor="#d1fae5"
                                        subtext={`${summary?.totalPigs} cerdos vendidos`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Costo de producción"
                                        value={profitability?.totalProductionCost || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-shopping-cart-line fs-4 text-danger"></i>}
                                        iconBgColor="#fee2e2"
                                        subtext={`${fmtCurrency(profitability?.costPerPig || 0)} por cerdo`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Ganancia neta"
                                        value={profitability?.profit || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-funds-line fs-4 text-primary"></i>}
                                        iconBgColor="#dbeafe"
                                        subtext={`${fmtCurrency(profitability?.profitPerPig || 0)} por cerdo · ${fmt(profitability?.profitMargin, 1)}% margen`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="ROI"
                                        value={profitability?.roi || 0}
                                        animateValue
                                        decimals={2}
                                        suffix="%"
                                        icon={<i className="ri-line-chart-line fs-4 text-warning"></i>}
                                        iconBgColor="#fef3c7"
                                        subtext={`${fmtCurrency(profitability?.revenuePerPig || 0)} ingreso/cerdo`}
                                    />
                                </Col>
                            </Row>

                            {/* Métricas de tiempo y supervivencia */}
                            <h6 className="text-muted text-uppercase mb-3">Producción y rendimiento</h6>
                            <Row className="g-3 mb-3">
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Días en producción"
                                        value={timeMetrics?.daysInProduction || 0}
                                        animateValue
                                        icon={<i className="ri-calendar-check-line fs-4 text-info"></i>}
                                        iconBgColor="#cffafe"
                                        subtext={`${fmtCurrency(timeMetrics?.profitPerDay || 0)} ganancia/día`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Tasa de supervivencia"
                                        value={survivalMetrics?.survivalRate || 0}
                                        animateValue
                                        decimals={1}
                                        suffix="%"
                                        icon={<i className="ri-heart-pulse-line fs-4 text-success"></i>}
                                        iconBgColor="#d1fae5"
                                        subtext={`${survivalMetrics?.mortality || 0} bajas`}
                                        trendVariant={survivalMetrics?.survivalRate >= 95 ? "success" : "warning"}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Peso promedio venta"
                                        value={weightMetrics?.averageWeightAtSale || 0}
                                        animateValue
                                        decimals={2}
                                        suffix=" kg"
                                        icon={<i className="ri-scales-3-line fs-4 text-secondary"></i>}
                                        iconBgColor="#f3f4f6"
                                        subtext={`Min: ${fmt(weightMetrics?.minWeight)} — Max: ${fmt(weightMetrics?.maxWeight)} kg`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title="Uniformidad"
                                        value={weightMetrics?.uniformity || 0}
                                        animateValue
                                        decimals={2}
                                        suffix="%"
                                        icon={<i className="ri-equalizer-line fs-4" style={{ color: "#8b5cf6" }}></i>}
                                        iconBgColor="#ede9fe"
                                        subtext={`Varianza: ${fmt(weightMetrics?.weightVariance)} kg`}
                                    />
                                </Col>
                            </Row>

                            {/* Gráficas */}
                            <Row className="g-3">
                                <Col xs={12} lg={6}>
                                    <DonutChartCard
                                        title="Desglose de costos"
                                        data={costDonutData}
                                        legendItems={costLegendItems}
                                        height={250}
                                    />
                                </Col>
                                <Col xs={12} lg={6}>
                                    <BasicBarChart
                                        title="Ingresos vs Costos vs Ganancia"
                                        data={profitBarData}
                                        indexBy="category"
                                        keys={["valor"]}
                                        xLegend=""
                                        yLegend="Monto ($)"
                                        height={380}
                                        colors={({ data }: any) => data.color}
                                    />
                                </Col>
                            </Row>
                        </SimpleBar>
                    ) : (
                        <p className="text-muted text-center p-3">No se encontraron métricas.</p>
                    )}
                </TabPane>
                <TabPane tabId="details">
                    <SimpleBar style={{ maxHeight: "65vh", padding: "1rem" }}>
                        {/* Info general */}
                        <h6 className="text-muted text-uppercase mb-3">Información general</h6>
                        <Card className="border shadow-sm mb-3">
                            <CardBody className="p-0">
                                <Row className="g-0">
                                    {[
                                        { label: "Código", value: saleDetails?.code, icon: "ri-hashtag" },
                                        { label: "Fecha de venta", value: saleDetails?.saleDate ? new Date(saleDetails.saleDate).toLocaleDateString() : "—", icon: "ri-calendar-line" },
                                        { label: "Tipo de venta", value: saleTypeLabel[saleDetails?.saleType] || saleDetails?.saleType, icon: "ri-exchange-line" },
                                        { label: "Comprador", value: saleDetails?.buyer?.name || "—", icon: "ri-user-line" },
                                    ].map((item, i) => (
                                        <Col xs={12} sm={6} lg={3} key={i} className={i < 3 ? "border-end" : ""}>
                                            <div className="p-3">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <i className={`${item.icon} text-muted`}></i>
                                                    <span className="text-muted" style={{ fontSize: "13px" }}>{item.label}</span>
                                                </div>
                                                <span className="fw-semibold">{item.value}</span>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </CardBody>
                        </Card>

                        <Card className="border shadow-sm mb-3">
                            <CardBody className="p-0">
                                <Row className="g-0">
                                    {[
                                        { label: "Monto total", value: fmtCurrency(saleDetails?.totalAmount || 0), icon: "ri-money-dollar-circle-line", highlight: true },
                                        { label: "Método de pago", value: paymentMethodLabel[saleDetails?.paymentMethod] || saleDetails?.paymentMethod, icon: "ri-bank-card-line" },
                                        { label: "Estado de pago", value: paymentStatusLabel[saleDetails?.paymentStatus] || saleDetails?.paymentStatus, icon: "ri-checkbox-circle-line", badgeColor: paymentStatusColor[saleDetails?.paymentStatus] },
                                        { label: "Registrado por", value: saleDetails?.registeredBy ? `${saleDetails.registeredBy.name} ${saleDetails.registeredBy.lastname}` : "—", icon: "ri-shield-user-line" },
                                    ].map((item: any, i: number) => (
                                        <Col xs={12} sm={6} lg={3} key={i} className={i < 3 ? "border-end" : ""}>
                                            <div className="p-3">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <i className={`${item.icon} text-muted`}></i>
                                                    <span className="text-muted" style={{ fontSize: "13px" }}>{item.label}</span>
                                                </div>
                                                {item.badgeColor ? (
                                                    <Badge color={item.badgeColor}>{item.value}</Badge>
                                                ) : (
                                                    <span className={`fw-semibold ${item.highlight ? "text-success" : ""}`}>{item.value}</span>
                                                )}
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </CardBody>
                        </Card>

                        {/* Tabla de cerdos */}
                        <h6 className="text-muted text-uppercase mb-3">Cerdos vendidos ({saleDetails?.pigs?.length || 0})</h6>
                        <CustomTable
                            columns={pigColumns}
                            data={saleDetails?.pigs || []}
                            showSearchAndFilter={true}
                            showPagination={true}
                            rowsPerPage={10}
                            fontSize={14}
                        />
                    </SimpleBar>
                </TabPane>
            </TabContent>
        </div>
    );
};

export default SaleDetails;
