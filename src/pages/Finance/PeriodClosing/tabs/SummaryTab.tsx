import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Card, CardBody, CardHeader, Col, Collapse, Row, Table } from "reactstrap";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercent, formatPricePerWeight, formatWeight, KG_TO_LB, WeightUnit } from "utils/closingFormatters";
import { darkenHex } from "utils/colorUtils";

interface SummaryTabProps {
    snapshot: ClosingSnapshot;
    isAnnual?: boolean;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ snapshot, isAnnual }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const weightUnit: WeightUnit = useSelector((state: any) => state.Configurations?.farmConfig?.defaultWeightUnit) || 'kg';
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const { kpis, costBreakdown, salesSummary, meta, monthlyEvolution } = snapshot;

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    const toggleCategory = (category: string) =>
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));

    const kgSoldDisplay = weightUnit === 'lb' ? kpis.totalKgSold * KG_TO_LB : kpis.totalKgSold;
    const weightSuffix = weightUnit === 'lb' ? ' lb' : ' kg';

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.income")} value={kpis.totalIncome} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success" />} iconBgColor={bg("#E8F5E9")} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.costs")} value={kpis.totalCosts} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger" />} iconBgColor={bg("#FFEBEE")} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.operatingResult")} value={kpis.operatingResult} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className={`ri-money-dollar-box-line fs-4 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`} />}
                        iconBgColor={kpis.operatingResult >= 0 ? bg("#E8F5E9") : bg("#FFEBEE")} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.operatingMargin")} value={kpis.operatingMargin} suffix="%" decimals={1}
                        icon={<i className="ri-percent-line fs-4 text-info" />} iconBgColor={bg("#E0F7FA")} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.pigsSold")} value={kpis.totalPigsSold}
                        icon={<i className="bx bxs-dog fs-4 text-primary" />} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.kgSold")} value={kgSoldDisplay} suffix={weightSuffix} decimals={0}
                        icon={<i className="ri-scales-3-line fs-4 text-warning" />} iconBgColor={bg("#FFF8E1")} animateValue />
                </Col>
                {kpis.avgPricePerKg !== undefined && (
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("finance.periodClosing.tabs.summary.kpi.avgPricePerKg", { unit: weightUnit })}
                            value={weightUnit === 'lb' ? kpis.avgPricePerKg / KG_TO_LB : kpis.avgPricePerKg}
                            prefix={meta.currencySymbol || "$"}
                            suffix={`/${weightUnit}`}
                            decimals={2}
                            icon={<i className="ri-price-tag-3-line fs-4 text-secondary" />}
                            iconBgColor={bg("#F3E5F5")}
                            animateValue
                        />
                    </Col>
                )}
            </Row>

            {isAnnual && monthlyEvolution && monthlyEvolution.length > 0 && (
                <Card className="mb-3">
                    <CardHeader>
                        <h5 className="mb-0"><i className="ri-line-chart-line me-2 text-info" />{t("finance.periodClosing.tabs.summary.evolution.header")}</h5>
                    </CardHeader>
                    <CardBody>
                        <Table className="table-hover align-middle mb-0" size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.summary.evolution.col.month")}</th>
                                    <th className="text-end" style={{ backgroundColor: bg("#E8F5E9") }}>{t("finance.periodClosing.tabs.summary.evolution.col.income")}</th>
                                    <th className="text-end" style={{ backgroundColor: bg("#FFEBEE") }}>{t("finance.periodClosing.tabs.summary.evolution.col.costs")}</th>
                                    <th className="text-end" style={{ backgroundColor: bg("#FFF8E1") }}>{t("finance.periodClosing.tabs.summary.evolution.col.result")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.margin")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.pigs")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.kg", { unit: weightUnit })}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.avgPrice", { unit: weightUnit })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyEvolution.map((m) => (
                                    <tr key={m.month}>
                                        <td className="fw-semibold">{m.monthLabel}</td>
                                        <td className="text-end" style={{ backgroundColor: bg("#E8F5E9") }}>{m.kpis ? formatCurrency(m.kpis.totalIncome, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end" style={{ backgroundColor: bg("#FFEBEE") }}>{m.kpis ? formatCurrency(m.kpis.totalCosts, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: bg("#FFF8E1") }}>{m.kpis ? formatCurrency(m.kpis.operatingResult, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatPercent(m.kpis.operatingMargin) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatNumber(m.kpis.totalPigsSold) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatWeight(m.kpis.totalKgSold, weightUnit, 0) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis?.avgPricePerKg !== undefined ? formatPricePerWeight(m.kpis.avgPricePerKg, weightUnit, meta) : <span className="text-muted">—</span>}</td>
                                    </tr>
                                ))}
                                <tr className="table-primary fw-bold">
                                    <td>{t("finance.periodClosing.tabs.summary.evolution.totalRow")}</td>
                                    <td className="text-end">{formatCurrency(kpis.totalIncome, meta)}</td>
                                    <td className="text-end">{formatCurrency(kpis.totalCosts, meta)}</td>
                                    <td className="text-end">{formatCurrency(kpis.operatingResult, meta)}</td>
                                    <td className="text-end">{formatPercent(kpis.operatingMargin)}</td>
                                    <td className="text-end">{formatNumber(kpis.totalPigsSold)}</td>
                                    <td className="text-end">{formatWeight(kpis.totalKgSold, weightUnit, 0)}</td>
                                    <td className="text-end">{kpis.avgPricePerKg !== undefined ? formatPricePerWeight(kpis.avgPricePerKg, weightUnit, meta) : <span className="text-muted">—</span>}</td>
                                </tr>
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            )}

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-money-dollar-circle-line me-2 text-success" />{t("finance.periodClosing.tabs.summary.sales.header")}</h5>
                </CardHeader>
                <CardBody>
                    {salesSummary.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.summary.sales.empty")}</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.summary.sales.col.type")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.sales.col.pigs")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.sales.col.totalWeight", { unit: weightUnit })}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.sales.col.avgPrice", { unit: weightUnit })}</th>
                                    <th className="text-end" style={{ backgroundColor: bg("#e8f5e9") }}>{t("finance.periodClosing.tabs.summary.sales.col.totalAmount")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesSummary.map((s, i) => (
                                    <tr key={i}>
                                        <td className="fw-semibold">{s.type}</td>
                                        <td className="text-end">{formatNumber(s.pigCount)}</td>
                                        <td className="text-end">{formatWeight(s.totalWeight, weightUnit, 1)}</td>
                                        <td className="text-end">{formatPricePerWeight(s.avgPricePerKg, weightUnit, meta)}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: bg("#e8f5e9") }}>
                                            {formatCurrency(s.totalAmount, meta)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="table-success fw-bold">
                                    <td>{t("finance.periodClosing.tabs.summary.sales.totalRow")}</td>
                                    <td className="text-end">{formatNumber(kpis.totalPigsSold)}</td>
                                    <td className="text-end">{formatWeight(kpis.totalKgSold, weightUnit, 1)}</td>
                                    <td></td>
                                    <td className="text-end">{formatCurrency(kpis.totalIncome, meta)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-file-list-3-line me-2 text-danger" />{t("finance.periodClosing.tabs.summary.costs.header")}</h5>
                </CardHeader>
                <CardBody>
                    {costBreakdown.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.summary.costs.empty")}</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.summary.costs.col.description")}</th>
                                    <th className="text-end" style={{ width: "180px", backgroundColor: bg("#ffebee") }}>{t("finance.periodClosing.tabs.summary.costs.col.amount")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costBreakdown.map((catItem) => {
                                    const isOpen = !!expandedCategories[catItem.category];
                                    return (
                                        <React.Fragment key={catItem.category}>
                                            <tr
                                                className="table-light"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => toggleCategory(catItem.category)}
                                            >
                                                <td className="fw-bold text-uppercase" style={{ fontSize: "13px", color: "#6b7280" }}>
                                                    <i className={`ri-arrow-${isOpen ? "down" : "right"}-s-line me-1`} />
                                                    {catItem.category}
                                                </td>
                                                <td className="text-end fw-bold" style={{ backgroundColor: bg("#fff8e1") }}>
                                                    {formatCurrency(catItem.amount, meta)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2} style={{ padding: 0, border: 0 }}>
                                                    <Collapse isOpen={isOpen}>
                                                        <Table size="sm" className="mb-0" style={{ backgroundColor: bg("#ffebee") }}>
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ paddingLeft: "2rem", width: "50%", fontWeight: 500, fontSize: "12px" }}>{t("finance.periodClosing.tabs.summary.costs.col.description")}</th>
                                                                    <th className="text-center" style={{ fontSize: "12px", fontWeight: 500 }}>{t("finance.periodClosing.tabs.summary.costs.col.date")}</th>
                                                                    <th className="text-end" style={{ fontSize: "12px", fontWeight: 500, paddingRight: "1rem" }}>{t("finance.periodClosing.tabs.summary.costs.col.amount")}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {catItem.items.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td style={{ paddingLeft: "2rem" }}>{item.description}</td>
                                                                        <td className="text-center text-muted" style={{ fontSize: "12px" }}>
                                                                            {item.date ? new Date(item.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                                        </td>
                                                                        <td className="text-end" style={{ paddingRight: "1rem" }}>{formatCurrency(item.amount, meta)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </Table>
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                                <tr className="table-danger fw-bold">
                                    <td>{t("finance.periodClosing.tabs.summary.costs.totalRow")}</td>
                                    <td className="text-end">{formatCurrency(kpis.totalCosts, meta)}</td>
                                </tr>
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-bar-chart-box-line me-2 text-primary" />{t("finance.periodClosing.tabs.summary.result.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Table className="align-middle mb-0" style={{ maxWidth: "500px" }}>
                        <tbody>
                            <tr>
                                <td className="fw-semibold">{t("finance.periodClosing.tabs.summary.result.totalIncome")}</td>
                                <td className="text-end text-success fw-bold fs-5">{formatCurrency(kpis.totalIncome, meta)}</td>
                            </tr>
                            <tr>
                                <td className="fw-semibold">{t("finance.periodClosing.tabs.summary.result.totalCosts")}</td>
                                <td className="text-end text-danger fw-bold fs-5">({formatCurrency(kpis.totalCosts, meta)})</td>
                            </tr>
                            <tr className={kpis.operatingResult >= 0 ? "table-success" : "table-danger"}>
                                <td className="fw-bold fs-5">{t("finance.periodClosing.tabs.summary.result.operatingResult")}</td>
                                <td className={`text-end fw-bold fs-5 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}>
                                    {formatCurrency(kpis.operatingResult, meta)}
                                </td>
                            </tr>
                            {kpis.resultBeforeTaxes !== undefined && (
                                <tr>
                                    <td className="fw-semibold ps-4 text-muted" style={{ fontSize: "14px" }}>{t("finance.periodClosing.tabs.summary.result.resultBeforeTaxes")}</td>
                                    <td className="text-end fw-semibold" style={{ fontSize: "14px" }}>{formatCurrency(kpis.resultBeforeTaxes, meta)}</td>
                                </tr>
                            )}
                            {kpis.taxes !== undefined && kpis.taxes !== 0 && (
                                <tr>
                                    <td className="fw-semibold ps-4 text-muted" style={{ fontSize: "14px" }}>{t("finance.periodClosing.tabs.summary.result.taxes")}</td>
                                    <td className="text-end text-danger fw-semibold" style={{ fontSize: "14px" }}>({formatCurrency(kpis.taxes, meta)})</td>
                                </tr>
                            )}
                            {kpis.netResult !== undefined && (
                                <tr className={kpis.netResult >= 0 ? "table-success" : "table-danger"}>
                                    <td className="fw-bold fs-5">{t("finance.periodClosing.tabs.summary.result.netResult")}</td>
                                    <td className={`text-end fw-bold fs-5 ${kpis.netResult >= 0 ? "text-success" : "text-danger"}`}>
                                        {formatCurrency(kpis.netResult, meta)}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td className="fw-semibold">{t("finance.periodClosing.tabs.summary.result.operatingMargin")}</td>
                                <td className={`text-end fw-bold ${kpis.operatingMargin >= 0 ? "text-success" : "text-danger"}`}>
                                    {formatPercent(kpis.operatingMargin)}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        </>
    );
};

export default SummaryTab;
