import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot, ClosingSnapshotMeta, ComparisonBlock, ComparisonSource, TrailingBlock } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercent, formatPercentDecimal, formatWeightKg } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const variationCell = (value: number | null | undefined) => {
    if (value === null || value === undefined) return <span className="text-muted">—</span>;
    const color = value >= 0 ? "text-success" : "text-danger";
    const sign = value >= 0 ? "+" : "";
    return <span className={color}>{sign}{(value * 100).toFixed(1)}%</span>;
};

const ComparisonTable: React.FC<{
    title: string;
    block: ComparisonBlock;
    currentKpis: ClosingSnapshot["kpis"];
    meta: ClosingSnapshotMeta;
}> = ({ title, block, currentKpis, meta }) => {
    const { t } = useTranslation();

    const sourceBadge = (source: ComparisonSource) => {
        const map: Record<ComparisonSource, { label: string; color: string }> = {
            closed_snapshot: { label: t("finance.periodClosing.tabs.comparisons.source.official"), color: "success" },
            live_computation: { label: t("finance.periodClosing.tabs.comparisons.source.live"), color: "info" },
            mixed: { label: t("finance.periodClosing.tabs.comparisons.source.mixed"), color: "warning" },
            not_available: { label: t("finance.periodClosing.tabs.comparisons.source.noData"), color: "secondary" },
        };
        const cfg = map[source];
        return <span className={`badge bg-${cfg.color}`}>{cfg.label}</span>;
    };

    return (
        <Card className="mb-3">
            <CardHeader className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">{title} <small className="text-muted">· {block.periodLabel}</small></h5>
                {sourceBadge(block.source)}
            </CardHeader>
            <CardBody>
                {!block.kpis ? (
                    <p className="text-muted mb-0">{t("finance.periodClosing.tabs.comparisons.noBlockData")}</p>
                ) : (
                    <Table className="align-middle mb-0" size="sm">
                        <thead className="table-light">
                            <tr>
                                <th>{t("finance.periodClosing.tabs.comparisons.col.kpi")}</th>
                                <th className="text-end">{t("finance.periodClosing.tabs.comparisons.col.current")}</th>
                                <th className="text-end">{block.periodLabel}</th>
                                <th className="text-end">{t("finance.periodClosing.tabs.comparisons.col.variation")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.income")}</td>
                                <td className="text-end">{formatCurrency(currentKpis.totalIncome, meta)}</td>
                                <td className="text-end text-muted">{formatCurrency(block.kpis.totalIncome, meta)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.totalIncome)}</td>
                            </tr>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.costs")}</td>
                                <td className="text-end">{formatCurrency(currentKpis.totalCosts, meta)}</td>
                                <td className="text-end text-muted">{formatCurrency(block.kpis.totalCosts, meta)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.totalCosts)}</td>
                            </tr>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.operatingResult")}</td>
                                <td className="text-end">{formatCurrency(currentKpis.operatingResult, meta)}</td>
                                <td className="text-end text-muted">{formatCurrency(block.kpis.operatingResult, meta)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.operatingResult)}</td>
                            </tr>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.operatingMargin")}</td>
                                <td className="text-end">{formatPercent(currentKpis.operatingMargin)}</td>
                                <td className="text-end text-muted">{formatPercent(block.kpis.operatingMargin)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.operatingMargin)}</td>
                            </tr>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.pigsSold")}</td>
                                <td className="text-end">{formatNumber(currentKpis.totalPigsSold)}</td>
                                <td className="text-end text-muted">{formatNumber(block.kpis.totalPigsSold)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.totalPigsSold)}</td>
                            </tr>
                            <tr>
                                <td>{t("finance.periodClosing.tabs.comparisons.kpi.kgSold")}</td>
                                <td className="text-end">{formatWeightKg(currentKpis.totalKgSold, 0)}</td>
                                <td className="text-end text-muted">{formatWeightKg(block.kpis.totalKgSold, 0)}</td>
                                <td className="text-end fw-semibold">{variationCell(block.variation?.totalKgSold)}</td>
                            </tr>
                        </tbody>
                    </Table>
                )}
            </CardBody>
        </Card>
    );
};

const TrailingSection: React.FC<{
    block: TrailingBlock;
    meta: ClosingSnapshotMeta;
}> = ({ block, meta }) => {
    const { t } = useTranslation();

    const sourceBadge = (source: ComparisonSource) => {
        const map: Record<ComparisonSource, { label: string; color: string }> = {
            closed_snapshot: { label: t("finance.periodClosing.tabs.comparisons.source.official"), color: "success" },
            live_computation: { label: t("finance.periodClosing.tabs.comparisons.source.live"), color: "info" },
            mixed: { label: t("finance.periodClosing.tabs.comparisons.source.mixed"), color: "warning" },
            not_available: { label: t("finance.periodClosing.tabs.comparisons.source.noData"), color: "secondary" },
        };
        const cfg = map[source];
        return <span className={`badge bg-${cfg.color}`}>{cfg.label}</span>;
    };

    return (
        <Card className="mb-3">
            <CardHeader className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">{t("finance.periodClosing.tabs.comparisons.trailing")} <small className="text-muted">· {block.periodRange}</small></h5>
                {sourceBadge(block.source)}
            </CardHeader>
            <CardBody>
                {!block.avgKpis ? (
                    <p className="text-muted mb-0">{t("finance.periodClosing.tabs.comparisons.noTrailing")}</p>
                ) : (
                    <Row className="g-3">
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.income")}</div><div className="fw-bold fs-5">{formatCurrency(block.avgKpis.totalIncome, meta)}</div></div></Col>
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.costs")}</div><div className="fw-bold fs-5">{formatCurrency(block.avgKpis.totalCosts, meta)}</div></div></Col>
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.result")}</div><div className={`fw-bold fs-5 ${block.avgKpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(block.avgKpis.operatingResult, meta)}</div></div></Col>
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.margin")}</div><div className="fw-bold fs-5">{formatPercent(block.avgKpis.operatingMargin)}</div></div></Col>
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.pigs")}</div><div className="fw-bold fs-5">{formatNumber(block.avgKpis.totalPigsSold, 0)}</div></div></Col>
                        <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">{t("finance.periodClosing.tabs.comparisons.trailingKpi.kg")}</div><div className="fw-bold fs-5">{formatWeightKg(block.avgKpis.totalKgSold, 0)}</div></div></Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    );
};

interface AnnualProps extends Props {
    isAnnual?: boolean;
}

const ComparisonsTab: React.FC<AnnualProps> = ({ snapshot, isAnnual }) => {
    const { t } = useTranslation();
    const { comparisons, kpis, meta } = snapshot;

    if (!comparisons) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.comparisons.empty")}</Alert>;
    }

    if (isAnnual) {
        return (
            <>
                {comparisons.previousYear ? (
                    <ComparisonTable title={t("finance.periodClosing.tabs.comparisons.prevYear")} block={comparisons.previousYear} currentKpis={kpis} meta={meta} />
                ) : (
                    <Alert color="secondary">{t("finance.periodClosing.tabs.comparisons.noPreviousYear")}</Alert>
                )}
                <div className="text-muted small">
                    <i className="ri-information-line me-1 text-muted" />
                    {t("finance.periodClosing.tabs.comparisons.variationNote", { val: formatPercentDecimal(0.136) })}
                </div>
            </>
        );
    }

    return (
        <>
            <ComparisonTable title={t("finance.periodClosing.tabs.comparisons.prevMonth")} block={comparisons.previousMonth} currentKpis={kpis} meta={meta} />
            <ComparisonTable title={t("finance.periodClosing.tabs.comparisons.sameMonthLastYear")} block={comparisons.sameMonthLastYear} currentKpis={kpis} meta={meta} />
            <TrailingSection block={comparisons.trailingThreeMonths} meta={meta} />
            <div className="text-muted small">
                <i className="ri-information-line me-1 text-muted" />
                {t("finance.periodClosing.tabs.comparisons.variationNote", { val: formatPercentDecimal(0.136) })}
            </div>
        </>
    );
};

export default ComparisonsTab;
