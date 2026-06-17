import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

const SaleDetails: React.FC<SaleDetailsProps> = ({ saleId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState(true);
    const [saleDetails, setSaleDetails] = useState<any>(null);
    const [metrics, setMetrics] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("metrics");

    const paymentMethodLabel: Record<string, string> = {
        cash: t('warehouse.inventoryDetails.paymentMethod.cash', { defaultValue: 'Efectivo' }),
        transfer: t('warehouse.inventoryDetails.paymentMethod.transfer', { defaultValue: 'Transferencia' }),
        check: t('warehouse.inventoryDetails.paymentMethod.check', { defaultValue: 'Cheque' }),
        credit: t('warehouse.inventoryDetails.paymentMethod.credit', { defaultValue: 'Crédito' }),
        other: t('warehouse.inventoryDetails.paymentMethod.other', { defaultValue: 'Otro' }),
    };

    const paymentStatusLabel: Record<string, string> = {
        pending: t('warehouse.common.orderStatus.pending', { defaultValue: 'Pendiente' }),
        partial: t('warehouse.inventoryDetails.paymentStatus.partial', { defaultValue: 'Parcial' }),
        completed: t('warehouse.common.orderStatus.completed', { defaultValue: 'Completado' }),
    };

    const paymentStatusColor: Record<string, string> = {
        pending: "warning", partial: "info", completed: "success",
    };

    const saleTypeLabel: Record<string, string> = {
        individual: t('warehouse.inventoryDetails.saleType.individual', { defaultValue: 'Individual' }),
        group: t('warehouse.inventoryDetails.saleType.group', { defaultValue: 'Grupo' }),
        mixed: t('warehouse.inventoryDetails.saleType.mixed', { defaultValue: 'Mixta' }),
        litter: t('warehouse.inventoryDetails.saleType.litter', { defaultValue: 'Camada' }),
    };

    const sexLabel: Record<string, string> = {
        male: t('warehouse.inventoryDetails.sex.male', { defaultValue: 'Macho' }),
        female: t('warehouse.inventoryDetails.sex.female', { defaultValue: 'Hembra' }),
    };

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

    if (!saleDetails) return <p className="text-muted text-center">{t('warehouse.inventoryDetails.noDetails', { defaultValue: 'No se encontraron detalles.' })}</p>;

    const { summary, profitability, timeMetrics, feedEfficiency, survivalMetrics, costBreakdown, weightMetrics } = metrics || {};

    const costDonutData: DonutDataItem[] = [
        { id: "feed", label: t('warehouse.inventoryDetails.cost.feed', { defaultValue: 'Alimentación' }), value: costBreakdown?.feed || 0, color: "#4f46e5" },
        { id: "medication", label: t('warehouse.inventoryDetails.cost.medication', { defaultValue: 'Medicación' }), value: costBreakdown?.medication || 0, color: "#06b6d4" },
        { id: "vaccines", label: t('warehouse.inventoryDetails.cost.vaccines', { defaultValue: 'Vacunas' }), value: costBreakdown?.vaccines || 0, color: "#f59e0b" },
        { id: "other", label: t('warehouse.inventoryDetails.cost.other', { defaultValue: 'Otros' }), value: costBreakdown?.other || 0, color: "#8b5cf6" },
    ].filter(d => d.value > 0);

    const costLegendItems: DonutLegendItem[] = [
        { label: t('warehouse.inventoryDetails.cost.feed', { defaultValue: 'Alimentación' }), value: fmtCurrency(costBreakdown?.feed), percentage: `${fmt(costBreakdown?.feedPercentage, 1)}%` },
        { label: t('warehouse.inventoryDetails.cost.medication', { defaultValue: 'Medicación' }), value: fmtCurrency(costBreakdown?.medication), percentage: `${fmt(costBreakdown?.medicationPercentage, 1)}%` },
        { label: t('warehouse.inventoryDetails.cost.vaccines', { defaultValue: 'Vacunas' }), value: fmtCurrency(costBreakdown?.vaccines), percentage: `${fmt(costBreakdown?.vaccinePercentage, 1)}%` },
        { label: t('warehouse.inventoryDetails.cost.other', { defaultValue: 'Otros' }), value: fmtCurrency(costBreakdown?.other), percentage: `${fmt(costBreakdown?.otherPercentage, 1)}%` },
    ];

    const round2 = (v: number) => Math.round((v || 0) * 100) / 100;

    const profitBarData = [
        { category: t('warehouse.inventoryDetails.profit.revenue', { defaultValue: 'Ingresos' }), valor: round2(summary?.totalAmount), color: "#10b981" },
        { category: t('warehouse.inventoryDetails.profit.costs', { defaultValue: 'Costos' }), valor: round2(profitability?.totalProductionCost), color: "#ef4444" },
        { category: t('warehouse.inventoryDetails.profit.profit', { defaultValue: 'Ganancia' }), valor: round2(profitability?.profit), color: "#3b82f6" },
    ];

    const pigColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: "pig" as any,
            isFilterable: true,
            type: "text",
            render: (_, row) => <span className="fw-semibold">{row.pig?.code || "—"}</span>,
            bgColor: "#f0f4ff",
        },
        {
            header: t('common.field.breed', { defaultValue: 'Raza' }),
            accessor: "pig" as any,
            type: "text",
            render: (_, row) => <span>{row.pig?.breed || "—"}</span>,
        },
        {
            header: t('warehouse.inventoryDetails.sex', { defaultValue: 'Sexo' }),
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
            header: t('common.field.stage', { defaultValue: 'Etapa' }),
            accessor: "pig" as any,
            type: "text",
            render: (_, row) => <Badge color="info">{t(`pigs.stage.${row.pig?.currentStage}`, { defaultValue: row.pig?.currentStage })}</Badge>,
        },
        {
            header: t('common.field.weight'),
            accessor: "weight" as any,
            type: "text",
            render: (_, row) => <span>{fmt(row.weight)}</span>,
        },
        {
            header: t('warehouse.inventoryDetails.pricePerKg', { defaultValue: 'Precio/kg' }),
            accessor: "pricePerKg" as any,
            type: "text",
            render: (_, row) => <span>{fmtCurrency(row.pricePerKg)}</span>,
        },
        {
            header: t('common.field.totalPrice', { defaultValue: 'Total' }),
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
                        {t('warehouse.inventoryDetails.tab.metrics', { defaultValue: 'Métricas' })}
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
                        {t('warehouse.inventoryDetails.tab.details', { defaultValue: 'Detalles' })}
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={activeTab} className="border border-top-0 rounded-bottom">
                <TabPane tabId="metrics">
                    {metrics ? (
                        <SimpleBar style={{ maxHeight: "65vh", padding: "1rem" }}>
                            {/* Resumen financiero */}
                            <h6 className="text-muted text-uppercase mb-3">{t('warehouse.inventoryDetails.section.financialSummary', { defaultValue: 'Resumen financiero' })}</h6>
                            <Row className="g-3 mb-3">
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.totalRevenue', { defaultValue: 'Ingreso total' })}
                                        value={summary?.totalAmount || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-money-dollar-circle-line fs-4 text-success"></i>}
                                        iconBgColor="#d1fae5"
                                        subtext={`${summary?.totalPigs} ${t('warehouse.inventoryDetails.kpi.pigsSold', { defaultValue: 'cerdos vendidos' })}`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.productionCost', { defaultValue: 'Costo de producción' })}
                                        value={profitability?.totalProductionCost || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-shopping-cart-line fs-4 text-danger"></i>}
                                        iconBgColor="#fee2e2"
                                        subtext={`${fmtCurrency(profitability?.costPerPig || 0)} ${t('warehouse.inventoryDetails.kpi.perPig', { defaultValue: 'por cerdo' })}`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.netProfit', { defaultValue: 'Ganancia neta' })}
                                        value={profitability?.profit || 0}
                                        animateValue
                                        decimals={2}
                                        prefix="$"
                                        icon={<i className="ri-funds-line fs-4 text-primary"></i>}
                                        iconBgColor="#dbeafe"
                                        subtext={`${fmtCurrency(profitability?.profitPerPig || 0)} ${t('warehouse.inventoryDetails.kpi.perPig', { defaultValue: 'por cerdo' })} · ${fmt(profitability?.profitMargin, 1)}% ${t('warehouse.inventoryDetails.kpi.margin', { defaultValue: 'margen' })}`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.roi', { defaultValue: 'ROI' })}
                                        value={profitability?.roi || 0}
                                        animateValue
                                        decimals={2}
                                        suffix="%"
                                        icon={<i className="ri-line-chart-line fs-4 text-warning"></i>}
                                        iconBgColor="#fef3c7"
                                        subtext={`${fmtCurrency(profitability?.revenuePerPig || 0)} ${t('warehouse.inventoryDetails.kpi.revenuePerPig', { defaultValue: 'ingreso/cerdo' })}`}
                                    />
                                </Col>
                            </Row>

                            {/* Métricas de tiempo y supervivencia */}
                            <h6 className="text-muted text-uppercase mb-3">{t('warehouse.inventoryDetails.section.productionPerformance', { defaultValue: 'Producción y rendimiento' })}</h6>
                            <Row className="g-3 mb-3">
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.daysInProduction', { defaultValue: 'Días en producción' })}
                                        value={timeMetrics?.daysInProduction || 0}
                                        animateValue
                                        icon={<i className="ri-calendar-check-line fs-4 text-info"></i>}
                                        iconBgColor="#cffafe"
                                        subtext={`${fmtCurrency(timeMetrics?.profitPerDay || 0)} ${t('warehouse.inventoryDetails.kpi.profitPerDay', { defaultValue: 'ganancia/día' })}`}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.survivalRate', { defaultValue: 'Tasa de supervivencia' })}
                                        value={survivalMetrics?.survivalRate || 0}
                                        animateValue
                                        decimals={1}
                                        suffix="%"
                                        icon={<i className="ri-heart-pulse-line fs-4 text-success"></i>}
                                        iconBgColor="#d1fae5"
                                        subtext={`${survivalMetrics?.mortality || 0} ${t('warehouse.inventoryDetails.kpi.losses', { defaultValue: 'bajas' })}`}
                                        trendVariant={survivalMetrics?.survivalRate >= 95 ? "success" : "warning"}
                                    />
                                </Col>
                                <Col xs={12} sm={6} lg={3}>
                                    <StatKpiCard
                                        title={t('warehouse.inventoryDetails.kpi.avgSaleWeight', { defaultValue: 'Peso promedio venta' })}
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
                                        title={t('warehouse.inventoryDetails.kpi.uniformity', { defaultValue: 'Uniformidad' })}
                                        value={weightMetrics?.uniformity || 0}
                                        animateValue
                                        decimals={2}
                                        suffix="%"
                                        icon={<i className="ri-equalizer-line fs-4" style={{ color: "#8b5cf6" }}></i>}
                                        iconBgColor="#ede9fe"
                                        subtext={`${t('warehouse.inventoryDetails.kpi.variance', { defaultValue: 'Varianza:' })} ${fmt(weightMetrics?.weightVariance)} kg`}
                                    />
                                </Col>
                            </Row>

                            {/* Gráficas */}
                            <Row className="g-3">
                                <Col xs={12} lg={6}>
                                    <DonutChartCard
                                        title={t('warehouse.inventoryDetails.chart.costBreakdown', { defaultValue: 'Desglose de costos' })}
                                        data={costDonutData}
                                        legendItems={costLegendItems}
                                        height={250}
                                    />
                                </Col>
                                <Col xs={12} lg={6}>
                                    <BasicBarChart
                                        title={t('warehouse.inventoryDetails.chart.revenueVsCosts', { defaultValue: 'Ingresos vs Costos vs Ganancia' })}
                                        data={profitBarData}
                                        indexBy="category"
                                        keys={["valor"]}
                                        xLegend=""
                                        yLegend={t('warehouse.inventoryDetails.chart.amount', { defaultValue: 'Monto ($)' })}
                                        height={380}
                                        colors={({ data }: any) => data.color}
                                    />
                                </Col>
                            </Row>
                        </SimpleBar>
                    ) : (
                        <p className="text-muted text-center p-3">{t('warehouse.inventoryDetails.noMetrics', { defaultValue: 'No se encontraron métricas.' })}</p>
                    )}
                </TabPane>
                <TabPane tabId="details">
                    <SimpleBar style={{ maxHeight: "65vh", padding: "1rem" }}>
                        {/* Info general */}
                        <h6 className="text-muted text-uppercase mb-3">{t('warehouse.inventoryDetails.section.generalInfo', { defaultValue: 'Información general' })}</h6>
                        <Card className="border shadow-sm mb-3">
                            <CardBody className="p-0">
                                <Row className="g-0">
                                    {[
                                        { label: t('common.field.code'), value: saleDetails?.code, icon: "ri-hashtag" },
                                        { label: t('warehouse.inventoryDetails.saleDate', { defaultValue: 'Fecha de venta' }), value: saleDetails?.saleDate ? new Date(saleDetails.saleDate).toLocaleDateString() : "—", icon: "ri-calendar-line" },
                                        { label: t('warehouse.inventoryDetails.saleType.label', { defaultValue: 'Tipo de venta' }), value: saleTypeLabel[saleDetails?.saleType] || saleDetails?.saleType, icon: "ri-exchange-line" },
                                        { label: t('warehouse.inventoryDetails.buyer', { defaultValue: 'Comprador' }), value: saleDetails?.buyer?.name || "—", icon: "ri-user-line" },
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
                                        { label: t('warehouse.inventoryDetails.totalAmount', { defaultValue: 'Monto total' }), value: fmtCurrency(saleDetails?.totalAmount || 0), icon: "ri-money-dollar-circle-line", highlight: true },
                                        { label: t('warehouse.inventoryDetails.paymentMethod.label', { defaultValue: 'Método de pago' }), value: paymentMethodLabel[saleDetails?.paymentMethod] || saleDetails?.paymentMethod, icon: "ri-bank-card-line" },
                                        { label: t('warehouse.inventoryDetails.paymentStatus.label', { defaultValue: 'Estado de pago' }), value: paymentStatusLabel[saleDetails?.paymentStatus] || saleDetails?.paymentStatus, icon: "ri-checkbox-circle-line", badgeColor: paymentStatusColor[saleDetails?.paymentStatus] },
                                        { label: t('warehouse.inventoryDetails.registeredBy', { defaultValue: 'Registrado por' }), value: saleDetails?.registeredBy ? `${saleDetails.registeredBy.name} ${saleDetails.registeredBy.lastname}` : "—", icon: "ri-shield-user-line" },
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

                        {/* Sección de lechones (si aplica) */}
                        {saleDetails?.litter && (
                            <div className="mb-4">
                                <h6 className="text-uppercase mb-3" style={{ fontSize: 11, letterSpacing: "1px", color: "#2ab57d" }}>
                                    <i className="ri-seedling-line me-2" />
                                    {t('warehouse.inventoryDetails.litterSection', { defaultValue: 'Lechones de camada' })}
                                </h6>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: 12, borderLeft: "4px solid #2ab57d" }}>
                                    <CardBody>
                                        <Row className="g-3">
                                            <Col xs={6} md={3}>
                                                <div className="text-muted small mb-1">{t('litter.field.code', { defaultValue: 'Camada' })}</div>
                                                <div className="fw-semibold">{saleDetails.litter.litterId?.code || saleDetails.litter.litterId || "—"}</div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="text-muted small mb-1">{t('sellPigs.litter.field.pigCount', { defaultValue: 'Lechones vendidos' })}</div>
                                                <div className="fw-bold" style={{ fontSize: 18, color: "#2ab57d" }}>
                                                    {saleDetails.litter.pigCount}
                                                    <span className="text-muted fw-normal ms-1" style={{ fontSize: 12 }}>
                                                        {saleDetails.litter.male != null || saleDetails.litter.female != null
                                                            ? `(${saleDetails.litter.male ?? "—"}♂ / ${saleDetails.litter.female ?? "—"}♀)`
                                                            : ""}
                                                    </span>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="text-muted small mb-1">{t('sellPigs.litter.totalWeight', { defaultValue: 'Peso total:' }).replace(":", "")}</div>
                                                <div className="fw-semibold">{fmt(saleDetails.litter.totalWeight)} kg</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{fmt(saleDetails.litter.avgWeight)} kg {t('sellPigs.label.kgAvg', { defaultValue: 'prom.' })}</div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="text-muted small mb-1">{t('common.field.totalPrice', { defaultValue: 'Total lechones' })}</div>
                                                <div className="fw-bold text-success" style={{ fontSize: 16 }}>{fmtCurrency(saleDetails.litter.totalPrice)}</div>
                                                <div className="text-muted" style={{ fontSize: 11 }}>{fmtCurrency(saleDetails.litter.pricePerKg)}/kg</div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </div>
                        )}

                        {/* Tabla de cerdos individuales */}
                        {(saleDetails?.pigs?.length > 0) && (
                            <>
                                <h6 className="text-muted text-uppercase mb-3">{t('warehouse.inventoryDetails.soldPigs', { defaultValue: 'Cerdos vendidos' })} ({saleDetails.pigs.length})</h6>
                                <CustomTable
                                    columns={pigColumns}
                                    data={saleDetails.pigs}
                                    showSearchAndFilter={true}
                                    showPagination={true}
                                    rowsPerPage={10}
                                    fontSize={14}
                                />
                            </>
                        )}
                    </SimpleBar>
                </TabPane>
            </TabContent>
        </div>
    );
};

export default SaleDetails;
