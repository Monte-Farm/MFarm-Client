import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot, ClosingSnapshotMeta, ComparisonBlock, ComparisonSource, TrailingBlock } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercent, formatPercentDecimal, formatWeightKg } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const sourceBadge = (source: ComparisonSource) => {
    const map: Record<ComparisonSource, { label: string; color: string }> = {
        closed_snapshot: { label: "Cierre oficial", color: "success" },
        live_computation: { label: "Cálculo en vivo", color: "info" },
        mixed: { label: "Mixto", color: "warning" },
        not_available: { label: "Sin datos", color: "secondary" },
    };
    const cfg = map[source];
    return <span className={`badge bg-${cfg.color}`}>{cfg.label}</span>;
};

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
}> = ({ title, block, currentKpis, meta }) => (
    <Card className="mb-3">
        <CardHeader className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">{title} <small className="text-muted">· {block.periodLabel}</small></h5>
            {sourceBadge(block.source)}
        </CardHeader>
        <CardBody>
            {!block.kpis ? (
                <p className="text-muted mb-0">Sin datos disponibles para este periodo.</p>
            ) : (
                <Table className="align-middle mb-0" size="sm">
                    <thead className="table-light">
                        <tr>
                            <th>KPI</th>
                            <th className="text-end">Actual</th>
                            <th className="text-end">{block.periodLabel}</th>
                            <th className="text-end">Variación</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Ingresos</td>
                            <td className="text-end">{formatCurrency(currentKpis.totalIncome, meta)}</td>
                            <td className="text-end text-muted">{formatCurrency(block.kpis.totalIncome, meta)}</td>
                            <td className="text-end fw-semibold">{variationCell(block.variation?.totalIncome)}</td>
                        </tr>
                        <tr>
                            <td>Costos</td>
                            <td className="text-end">{formatCurrency(currentKpis.totalCosts, meta)}</td>
                            <td className="text-end text-muted">{formatCurrency(block.kpis.totalCosts, meta)}</td>
                            <td className="text-end fw-semibold">{variationCell(block.variation?.totalCosts)}</td>
                        </tr>
                        <tr>
                            <td>Resultado operativo</td>
                            <td className="text-end">{formatCurrency(currentKpis.operatingResult, meta)}</td>
                            <td className="text-end text-muted">{formatCurrency(block.kpis.operatingResult, meta)}</td>
                            <td className="text-end fw-semibold">{variationCell(block.variation?.operatingResult)}</td>
                        </tr>
                        <tr>
                            <td>Margen operativo</td>
                            <td className="text-end">{formatPercent(currentKpis.operatingMargin)}</td>
                            <td className="text-end text-muted">{formatPercent(block.kpis.operatingMargin)}</td>
                            <td className="text-end fw-semibold">{variationCell(block.variation?.operatingMargin)}</td>
                        </tr>
                        <tr>
                            <td>Cerdos vendidos</td>
                            <td className="text-end">{formatNumber(currentKpis.totalPigsSold)}</td>
                            <td className="text-end text-muted">{formatNumber(block.kpis.totalPigsSold)}</td>
                            <td className="text-end fw-semibold">{variationCell(block.variation?.totalPigsSold)}</td>
                        </tr>
                        <tr>
                            <td>Kg vendidos</td>
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

const TrailingSection: React.FC<{
    block: TrailingBlock;
    meta: ClosingSnapshotMeta;
}> = ({ block, meta }) => (
    <Card className="mb-3">
        <CardHeader className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Promedio últimos 3 meses <small className="text-muted">· {block.periodRange}</small></h5>
            {sourceBadge(block.source)}
        </CardHeader>
        <CardBody>
            {!block.avgKpis ? (
                <p className="text-muted mb-0">Sin datos para promedio trimestral.</p>
            ) : (
                <Row className="g-3">
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Ingresos prom.</div><div className="fw-bold fs-5">{formatCurrency(block.avgKpis.totalIncome, meta)}</div></div></Col>
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Costos prom.</div><div className="fw-bold fs-5">{formatCurrency(block.avgKpis.totalCosts, meta)}</div></div></Col>
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Resultado prom.</div><div className={`fw-bold fs-5 ${block.avgKpis.operatingResult >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(block.avgKpis.operatingResult, meta)}</div></div></Col>
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Margen prom.</div><div className="fw-bold fs-5">{formatPercent(block.avgKpis.operatingMargin)}</div></div></Col>
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Cerdos prom.</div><div className="fw-bold fs-5">{formatNumber(block.avgKpis.totalPigsSold, 0)}</div></div></Col>
                    <Col md={4}><div className="border rounded p-3 bg-light"><div className="text-muted small">Kg prom.</div><div className="fw-bold fs-5">{formatWeightKg(block.avgKpis.totalKgSold, 0)}</div></div></Col>
                </Row>
            )}
        </CardBody>
    </Card>
);

interface AnnualProps extends Props {
    isAnnual?: boolean;
}

const ComparisonsTab: React.FC<AnnualProps> = ({ snapshot, isAnnual }) => {
    const { comparisons, kpis, meta } = snapshot;

    if (!comparisons) {
        return <Alert color="secondary">Este cierre no incluye comparativas.</Alert>;
    }

    if (isAnnual) {
        return (
            <>
                {comparisons.previousYear ? (
                    <ComparisonTable title="Año anterior" block={comparisons.previousYear} currentKpis={kpis} meta={meta} />
                ) : (
                    <Alert color="secondary">No hay datos del año anterior para comparar.</Alert>
                )}
                <div className="text-muted small">
                    <i className="ri-information-line me-1 text-muted" />
                    Las variaciones se expresan como decimales; ej. {formatPercentDecimal(0.136)} equivale a +13.6%.
                </div>
            </>
        );
    }

    return (
        <>
            <ComparisonTable title="Mes anterior" block={comparisons.previousMonth} currentKpis={kpis} meta={meta} />
            <ComparisonTable title="Mismo mes del año anterior" block={comparisons.sameMonthLastYear} currentKpis={kpis} meta={meta} />
            <TrailingSection block={comparisons.trailingThreeMonths} meta={meta} />
            <div className="text-muted small">
                <i className="ri-information-line me-1 text-muted" />
                Las variaciones se expresan como decimales; ej. {formatPercentDecimal(0.136)} equivale a +13.6%.
            </div>
        </>
    );
};

export default ComparisonsTab;
