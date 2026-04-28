import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercentDecimal, formatWeightKg, stageLabel } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const InventoryProductionTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const { inventory, production, meta } = snapshot;

    if (!inventory && !production) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.inventory.empty")}</Alert>;
    }

    return (
        <>
            {inventory && (
                <>
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-archive-line me-2 text-primary" />{t("finance.periodClosing.tabs.inventory.flow.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 align-items-stretch">
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100 bg-light">
                                        <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.inventory.flow.initial")} ({inventory.initial.date})</div>
                                        <div className="fw-bold fs-3">{formatNumber(inventory.initial.totalPigs)}</div>
                                        <div className="text-muted small">{formatWeightKg(inventory.initial.totalWeightKg, 0)}</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100">
                                        <div className="text-muted small mb-2">{t("finance.periodClosing.tabs.inventory.flow.movements")}</div>
                                        <div className="d-flex flex-column gap-1" style={{ fontSize: "0.9rem" }}>
                                            <div className="d-flex justify-content-between"><span className="text-success">{t("finance.periodClosing.tabs.inventory.flow.births")}</span><strong>{inventory.movements.births.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-success">{t("finance.periodClosing.tabs.inventory.flow.purchases")}</span><strong>{inventory.movements.purchases.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">{t("finance.periodClosing.tabs.inventory.flow.sales")}</span><strong>{inventory.movements.sales.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">{t("finance.periodClosing.tabs.inventory.flow.deaths")}</span><strong>{inventory.movements.deaths.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">{t("finance.periodClosing.tabs.inventory.flow.discards")}</span><strong>{inventory.movements.discards.count}</strong></div>
                                            {(inventory.movements.transfersIn.count > 0 || inventory.movements.transfersOut.count > 0) && (
                                                <>
                                                    <div className="d-flex justify-content-between"><span className="text-muted">{t("finance.periodClosing.tabs.inventory.flow.transfersIn")}</span><strong>{inventory.movements.transfersIn.count}</strong></div>
                                                    <div className="d-flex justify-content-between"><span className="text-muted">{t("finance.periodClosing.tabs.inventory.flow.transfersOut")}</span><strong>{inventory.movements.transfersOut.count}</strong></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100 bg-light">
                                        <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.inventory.flow.final")} ({inventory.final.date})</div>
                                        <div className="fw-bold fs-3">{formatNumber(inventory.final.totalPigs)}</div>
                                        <div className="text-muted small">{formatWeightKg(inventory.final.totalWeightKg, 0)}</div>
                                    </div>
                                </Col>
                            </Row>

                            {inventory.reconciliation.diff !== 0 && (
                                (Math.abs(inventory.reconciliation.diff) > 5 ||
                                    (inventory.initial.totalPigs > 0 && Math.abs(inventory.reconciliation.diff) / inventory.initial.totalPigs > 0.05)) ? (
                                    <Alert color="warning" className="mt-3 mb-0 d-flex align-items-start">
                                        <i className="ri-error-warning-line me-2 fs-5 text-warning" />
                                        <div>
                                            <div className="fw-semibold">{t("finance.periodClosing.tabs.inventory.flow.reconciliation.title")}</div>
                                            <small>
                                                {t("finance.periodClosing.tabs.inventory.flow.reconciliation.expected")} {formatNumber(inventory.reconciliation.expectedFinal)} ·{" "}
                                                {t("finance.periodClosing.tabs.inventory.flow.reconciliation.actual")} {formatNumber(inventory.reconciliation.actualFinal)} ·{" "}
                                                {t("finance.periodClosing.tabs.inventory.flow.reconciliation.diff")} <strong>{inventory.reconciliation.diff > 0 ? "+" : ""}{inventory.reconciliation.diff}</strong>.{" "}
                                                {t("finance.periodClosing.tabs.inventory.flow.reconciliation.hint")}
                                            </small>
                                        </div>
                                    </Alert>
                                ) : (
                                    <div className="mt-3 text-muted small">
                                        <i className="ri-information-line me-1 text-muted" />
                                        {t("finance.periodClosing.tabs.inventory.flow.reconciliation.minor", {
                                            expected: inventory.reconciliation.expectedFinal,
                                            actual: inventory.reconciliation.actualFinal,
                                            diff: inventory.reconciliation.diff,
                                        })}
                                    </div>
                                )
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-stack-line me-2 text-primary" />{t("finance.periodClosing.tabs.inventory.stage.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            <Table className="table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>{t("finance.periodClosing.tabs.inventory.stage.col.stage")}</th>
                                        <th className="text-end">{t("finance.periodClosing.tabs.inventory.stage.col.initial")}</th>
                                        <th className="text-end">{t("finance.periodClosing.tabs.inventory.stage.col.initialWeight")}</th>
                                        <th className="text-end">{t("finance.periodClosing.tabs.inventory.stage.col.final")}</th>
                                        <th className="text-end">{t("finance.periodClosing.tabs.inventory.stage.col.finalWeight")}</th>
                                        <th className="text-end">{t("finance.periodClosing.tabs.inventory.stage.col.avgWeight")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.final.byStage.map((finalItem) => {
                                        const initialItem = inventory.initial.byStage.find((i) => i.stage === finalItem.stage);
                                        return (
                                            <tr key={finalItem.stage}>
                                                <td className="fw-semibold">{stageLabel(finalItem.stage)}</td>
                                                <td className="text-end">{formatNumber(initialItem?.count || 0)}</td>
                                                <td className="text-end">{formatWeightKg(initialItem?.totalWeightKg || 0, 0)}</td>
                                                <td className="text-end fw-semibold">{formatNumber(finalItem.count)}</td>
                                                <td className="text-end">{formatWeightKg(finalItem.totalWeightKg, 0)}</td>
                                                <td className="text-end text-muted">{formatWeightKg(finalItem.avgWeightKg, 1)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-money-dollar-circle-line me-2 text-success" />{t("finance.periodClosing.tabs.inventory.valuation.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            {!inventory.valuation ? (
                                <p className="text-muted mb-0">{t("finance.periodClosing.tabs.inventory.valuation.empty")}</p>
                            ) : (
                                <>
                                    <Row className="g-3 mb-3">
                                        <Col md={4}>
                                            <div className="border rounded p-3 bg-light">
                                                <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.valuation.pricePerKg")}</div>
                                                <div className="fw-bold fs-5">{formatCurrency(inventory.valuation.pricePerKg, meta)}</div>
                                                <small className="text-muted">{t("finance.periodClosing.tabs.inventory.valuation.source")} {inventory.valuation.pricePerKgSource}</small>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="border rounded p-3 bg-light">
                                                <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.valuation.totalWeight")}</div>
                                                <div className="fw-bold fs-5">{formatWeightKg(inventory.final.totalWeightKg, 0)}</div>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="border rounded p-3" style={{ backgroundColor: "#E8F5E9" }}>
                                                <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.valuation.totalValue")}</div>
                                                <div className="fw-bold fs-5 text-success">{formatCurrency(inventory.valuation.totalValue, meta)}</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Table size="sm" className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>{t("finance.periodClosing.tabs.inventory.valuation.col.stage")}</th>
                                                <th className="text-end">{t("finance.periodClosing.tabs.inventory.valuation.col.weight")}</th>
                                                <th className="text-end">{t("finance.periodClosing.tabs.inventory.valuation.col.value")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.valuation.byStage.map((v) => (
                                                <tr key={v.stage}>
                                                    <td>{stageLabel(v.stage)}</td>
                                                    <td className="text-end">{formatWeightKg(v.totalWeightKg, 0)}</td>
                                                    <td className="text-end fw-semibold">{formatCurrency(v.value, meta)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </>
            )}

            {production && (
                <>
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-line-chart-line me-2 text-primary" />{t("finance.periodClosing.tabs.inventory.production.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <div className="border rounded p-3">
                                        <div className="fw-semibold mb-2"><i className="ri-seedling-line me-1 text-success" />{t("finance.periodClosing.tabs.inventory.production.births.title")}</div>
                                        <Row className="small g-2">
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.births.litters")}<div className="fw-bold">{formatNumber(production.births.litterCount)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.births.alive")}<div className="fw-bold text-success">{formatNumber(production.births.pigletsBornAlive)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.births.dead")}<div className="fw-bold text-danger">{formatNumber(production.births.pigletsBornDead)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.births.avgLitter")}<div className="fw-bold">{formatNumber(production.births.avgLitterSize, 1)}</div></Col>
                                            <Col xs={12}>{t("finance.periodClosing.tabs.inventory.production.births.avgWeight")}<div className="fw-bold">{formatWeightKg(production.births.avgPigletBirthWeightKg, 2)}</div></Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="border rounded p-3">
                                        <div className="fw-semibold mb-2"><i className="ri-parent-line me-1 text-info" />{t("finance.periodClosing.tabs.inventory.production.weanings.title")}</div>
                                        <Row className="small g-2">
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.weanings.litters")}<div className="fw-bold">{formatNumber(production.weanings.litterCount)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.weanings.piglets")}<div className="fw-bold">{formatNumber(production.weanings.pigletsWeaned)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.weanings.avgLitter")}<div className="fw-bold">{formatNumber(production.weanings.avgLitterSizeAtWeaning, 1)}</div></Col>
                                            <Col xs={6}>{t("finance.periodClosing.tabs.inventory.production.weanings.avgAge")}<div className="fw-bold">{production.weanings.avgWeaningAgeDays !== null ? `${production.weanings.avgWeaningAgeDays} días` : t("finance.periodClosing.tabs.inventory.fcr.noData")}</div></Col>
                                            <Col xs={12}>{t("finance.periodClosing.tabs.inventory.production.weanings.preweanMortality")}<div className="fw-bold text-danger">{formatPercentDecimal(production.weanings.preWeaningMortality)}</div></Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-skull-line me-2 text-danger" />{t("finance.periodClosing.tabs.inventory.mortality.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 mb-3">
                                <Col md={4}>
                                    <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                        <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.mortality.totalDeaths")}</div>
                                        <div className="fw-bold fs-5 text-danger">{formatNumber(production.mortality.totalDeaths)}</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                        <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.mortality.mortalityRate")}</div>
                                        <div className="fw-bold fs-5 text-danger">{formatPercentDecimal(production.mortality.mortalityRate, 2)}</div>
                                    </div>
                                </Col>
                            </Row>

                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">{t("finance.periodClosing.tabs.inventory.mortality.byStage")}</div>
                                    {production.mortality.byStage.length === 0 ? (
                                        <p className="text-muted small">{t("finance.periodClosing.tabs.inventory.mortality.noData")}</p>
                                    ) : (
                                        <Table size="sm" className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>{t("finance.periodClosing.tabs.inventory.mortality.col.stage")}</th>
                                                    <th className="text-end">{t("finance.periodClosing.tabs.inventory.mortality.col.deaths")}</th>
                                                    <th className="text-end">{t("finance.periodClosing.tabs.inventory.mortality.col.rate")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {production.mortality.byStage.map((m) => (
                                                    <tr key={m.stage}>
                                                        <td>{stageLabel(m.stage)}</td>
                                                        <td className="text-end">{formatNumber(m.count)}</td>
                                                        <td className="text-end text-muted">{formatPercentDecimal(m.rate, 2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Col>
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">{t("finance.periodClosing.tabs.inventory.mortality.byCause")}</div>
                                    {production.mortality.byCause.length === 0 ? (
                                        <p className="text-muted small">{t("finance.periodClosing.tabs.inventory.mortality.noCauses")}</p>
                                    ) : (
                                        <Table size="sm" className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>{t("finance.periodClosing.tabs.inventory.mortality.col.cause")}</th>
                                                    <th className="text-end">{t("finance.periodClosing.tabs.inventory.mortality.col.count")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {production.mortality.byCause.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="text-capitalize">{m.cause}</td>
                                                        <td className="text-end">{formatNumber(m.count)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-exchange-line me-2 text-primary" />{t("finance.periodClosing.tabs.inventory.fcr.header")}</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">{t("finance.periodClosing.tabs.inventory.fcr.title")}</div>
                                    <div className="border rounded p-3">
                                        <div className="text-muted small">{t("finance.periodClosing.tabs.inventory.fcr.general")}</div>
                                        <div className="fw-bold fs-5">{production.feedConversion.overall !== null ? production.feedConversion.overall.toFixed(2) : t("finance.periodClosing.tabs.inventory.fcr.noData")}</div>
                                        <small className="text-muted">{t("finance.periodClosing.tabs.inventory.fcr.noBreakdown")}</small>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">{t("finance.periodClosing.tabs.inventory.fcr.avgDays")}</div>
                                    <Table size="sm" className="mb-0">
                                        <tbody>
                                            {production.avgDaysPerStage.map((d) => (
                                                <tr key={d.stage}>
                                                    <td>{stageLabel(d.stage)}</td>
                                                    <td className="text-end">{d.avgDays !== null ? `${d.avgDays} días` : <span className="text-muted">{t("finance.periodClosing.tabs.inventory.fcr.noData")}</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </>
            )}
        </>
    );
};

export default InventoryProductionTab;
