import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercent } from "utils/closingFormatters";

interface SummaryTabProps {
    snapshot: ClosingSnapshot;
    isAnnual?: boolean;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ snapshot, isAnnual }) => {
    const { t } = useTranslation();
    const { kpis, costBreakdown, salesSummary, meta, monthlyEvolution } = snapshot;

    const costsByCategory: Record<string, typeof costBreakdown> = {};
    costBreakdown.forEach((item) => {
        if (!costsByCategory[item.category]) costsByCategory[item.category] = [];
        costsByCategory[item.category].push(item);
    });

    return (
        <>
            <Row className="g-3 mb-3">
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.income")} value={kpis.totalIncome} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className="ri-arrow-up-circle-line fs-4 text-success" />} iconBgColor="#E8F5E9" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.costs")} value={kpis.totalCosts} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className="ri-arrow-down-circle-line fs-4 text-danger" />} iconBgColor="#FFEBEE" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.operatingResult")} value={kpis.operatingResult} prefix={meta.currencySymbol || "$"} decimals={2}
                        icon={<i className={`ri-money-dollar-box-line fs-4 ${kpis.operatingResult >= 0 ? "text-success" : "text-danger"}`} />}
                        iconBgColor={kpis.operatingResult >= 0 ? "#E8F5E9" : "#FFEBEE"} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.operatingMargin")} value={kpis.operatingMargin} suffix="%" decimals={1}
                        icon={<i className="ri-percent-line fs-4 text-info" />} iconBgColor="#E0F7FA" animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.pigsSold")} value={kpis.totalPigsSold}
                        icon={<i className="bx bxs-dog fs-4 text-primary" />} animateValue />
                </Col>
                <Col xl={2} md={4} sm={6}>
                    <StatKpiCard title={t("finance.periodClosing.tabs.summary.kpi.kgSold")} value={kpis.totalKgSold} suffix=" kg" decimals={0}
                        icon={<i className="ri-scales-3-line fs-4 text-warning" />} iconBgColor="#FFF8E1" animateValue />
                </Col>
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
                                    <th className="text-end" style={{ backgroundColor: "#E8F5E9" }}>{t("finance.periodClosing.tabs.summary.evolution.col.income")}</th>
                                    <th className="text-end" style={{ backgroundColor: "#FFEBEE" }}>{t("finance.periodClosing.tabs.summary.evolution.col.costs")}</th>
                                    <th className="text-end" style={{ backgroundColor: "#FFF8E1" }}>{t("finance.periodClosing.tabs.summary.evolution.col.result")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.margin")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.pigs")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.evolution.col.kg")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyEvolution.map((m) => (
                                    <tr key={m.month}>
                                        <td className="fw-semibold">{m.monthLabel}</td>
                                        <td className="text-end" style={{ backgroundColor: "#E8F5E9" }}>{m.kpis ? formatCurrency(m.kpis.totalIncome, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end" style={{ backgroundColor: "#FFEBEE" }}>{m.kpis ? formatCurrency(m.kpis.totalCosts, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#FFF8E1" }}>{m.kpis ? formatCurrency(m.kpis.operatingResult, meta) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatPercent(m.kpis.operatingMargin) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatNumber(m.kpis.totalPigsSold) : <span className="text-muted">—</span>}</td>
                                        <td className="text-end">{m.kpis ? formatNumber(m.kpis.totalKgSold, 0) : <span className="text-muted">—</span>}</td>
                                    </tr>
                                ))}
                                <tr className="table-primary fw-bold">
                                    <td>{t("finance.periodClosing.tabs.summary.evolution.totalRow")}</td>
                                    <td className="text-end">{formatCurrency(kpis.totalIncome, meta)}</td>
                                    <td className="text-end">{formatCurrency(kpis.totalCosts, meta)}</td>
                                    <td className="text-end">{formatCurrency(kpis.operatingResult, meta)}</td>
                                    <td className="text-end">{formatPercent(kpis.operatingMargin)}</td>
                                    <td className="text-end">{formatNumber(kpis.totalPigsSold)}</td>
                                    <td className="text-end">{formatNumber(kpis.totalKgSold, 0)}</td>
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
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.sales.col.totalWeight")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.summary.sales.col.avgPrice")}</th>
                                    <th className="text-end" style={{ backgroundColor: "#e8f5e9" }}>{t("finance.periodClosing.tabs.summary.sales.col.totalAmount")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesSummary.map((s, i) => (
                                    <tr key={i}>
                                        <td className="fw-semibold">{s.type}</td>
                                        <td className="text-end">{formatNumber(s.pigCount)}</td>
                                        <td className="text-end">{formatNumber(s.totalWeight, 1)}</td>
                                        <td className="text-end">{formatCurrency(s.avgPricePerKg, meta)}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#e8f5e9" }}>
                                            {formatCurrency(s.totalAmount, meta)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="table-success fw-bold">
                                    <td>{t("finance.periodClosing.tabs.summary.sales.totalRow")}</td>
                                    <td className="text-end">{formatNumber(kpis.totalPigsSold)}</td>
                                    <td className="text-end">{formatNumber(kpis.totalKgSold, 1)}</td>
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
                                    <th className="text-end" style={{ width: "180px", backgroundColor: "#ffebee" }}>{t("finance.periodClosing.tabs.summary.costs.col.amount")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(costsByCategory).map(([category, items]) => {
                                    const categoryTotal = items.reduce((sum, i) => sum + i.amount, 0);
                                    return (
                                        <React.Fragment key={category}>
                                            <tr className="table-light">
                                                <td className="fw-bold text-uppercase" style={{ fontSize: "13px", color: "#6b7280" }}>{category}</td>
                                                <td className="text-end fw-bold" style={{ backgroundColor: "#fff8e1" }}>{formatCurrency(categoryTotal, meta)}</td>
                                            </tr>
                                            {items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ paddingLeft: "2rem" }}>{item.description}</td>
                                                    <td className="text-end" style={{ backgroundColor: "#ffebee" }}>{formatCurrency(item.amount, meta)}</td>
                                                </tr>
                                            ))}
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
