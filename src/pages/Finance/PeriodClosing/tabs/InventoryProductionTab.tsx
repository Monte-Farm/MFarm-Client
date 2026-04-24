import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatPercentDecimal, formatWeightKg, stageLabel } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const InventoryProductionTab: React.FC<Props> = ({ snapshot }) => {
    const { inventory, production, meta } = snapshot;

    if (!inventory && !production) {
        return <Alert color="secondary">Este cierre no incluye datos de inventario ni producción.</Alert>;
    }

    return (
        <>
            {inventory && (
                <>
                    {/* Flow diagram: initial → movements → final */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-archive-line me-2 text-primary" />Flujo de inventario</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 align-items-stretch">
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100 bg-light">
                                        <div className="text-muted small mb-1">Inicial ({inventory.initial.date})</div>
                                        <div className="fw-bold fs-3">{formatNumber(inventory.initial.totalPigs)}</div>
                                        <div className="text-muted small">{formatWeightKg(inventory.initial.totalWeightKg, 0)}</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100">
                                        <div className="text-muted small mb-2">Movimientos del periodo</div>
                                        <div className="d-flex flex-column gap-1" style={{ fontSize: "0.9rem" }}>
                                            <div className="d-flex justify-content-between"><span className="text-success">+ Nacimientos</span><strong>{inventory.movements.births.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-success">+ Compras</span><strong>{inventory.movements.purchases.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">− Ventas</span><strong>{inventory.movements.sales.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">− Muertes</span><strong>{inventory.movements.deaths.count}</strong></div>
                                            <div className="d-flex justify-content-between"><span className="text-danger">− Descartes</span><strong>{inventory.movements.discards.count}</strong></div>
                                            {(inventory.movements.transfersIn.count > 0 || inventory.movements.transfersOut.count > 0) && (
                                                <>
                                                    <div className="d-flex justify-content-between"><span className="text-muted">+ Traslados entrada</span><strong>{inventory.movements.transfersIn.count}</strong></div>
                                                    <div className="d-flex justify-content-between"><span className="text-muted">− Traslados salida</span><strong>{inventory.movements.transfersOut.count}</strong></div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3 h-100 bg-light">
                                        <div className="text-muted small mb-1">Final ({inventory.final.date})</div>
                                        <div className="fw-bold fs-3">{formatNumber(inventory.final.totalPigs)}</div>
                                        <div className="text-muted small">{formatWeightKg(inventory.final.totalWeightKg, 0)}</div>
                                    </div>
                                </Col>
                            </Row>

                            {/* Reconciliation warning */}
                            {inventory.reconciliation.diff !== 0 && (
                                (Math.abs(inventory.reconciliation.diff) > 5 ||
                                    (inventory.initial.totalPigs > 0 && Math.abs(inventory.reconciliation.diff) / inventory.initial.totalPigs > 0.05)) ? (
                                    <Alert color="warning" className="mt-3 mb-0 d-flex align-items-start">
                                        <i className="ri-error-warning-line me-2 fs-5 text-warning" />
                                        <div>
                                            <div className="fw-semibold">Inconsistencia en reconciliación</div>
                                            <small>
                                                Esperado: {formatNumber(inventory.reconciliation.expectedFinal)} cerdos ·
                                                Actual: {formatNumber(inventory.reconciliation.actualFinal)} cerdos ·
                                                Diferencia: <strong>{inventory.reconciliation.diff > 0 ? "+" : ""}{inventory.reconciliation.diff}</strong>.
                                                Puede indicar movimientos no registrados.
                                            </small>
                                        </div>
                                    </Alert>
                                ) : (
                                    <div className="mt-3 text-muted small">
                                        <i className="ri-information-line me-1 text-muted" />
                                        Diferencia menor entre esperado ({inventory.reconciliation.expectedFinal}) y actual ({inventory.reconciliation.actualFinal}): {inventory.reconciliation.diff}.
                                    </div>
                                )
                            )}
                        </CardBody>
                    </Card>

                    {/* Inventory by stage */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-stack-line me-2 text-primary" />Inventario por etapa</h5>
                        </CardHeader>
                        <CardBody>
                            <Table className="table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Etapa</th>
                                        <th className="text-end">Inicial</th>
                                        <th className="text-end">Peso inicial</th>
                                        <th className="text-end">Final</th>
                                        <th className="text-end">Peso final</th>
                                        <th className="text-end">Peso prom.</th>
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

                    {/* Valuation */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-money-dollar-circle-line me-2 text-success" />Valorización de inventario final</h5>
                        </CardHeader>
                        <CardBody>
                            {!inventory.valuation ? (
                                <p className="text-muted mb-0">Sin valorización disponible (no hubo ventas para calcular el precio de mercado).</p>
                            ) : (
                                <>
                                    <Row className="g-3 mb-3">
                                        <Col md={4}>
                                            <div className="border rounded p-3 bg-light">
                                                <div className="text-muted small">Precio por kg</div>
                                                <div className="fw-bold fs-5">{formatCurrency(inventory.valuation.pricePerKg, meta)}</div>
                                                <small className="text-muted">Fuente: {inventory.valuation.pricePerKgSource}</small>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="border rounded p-3 bg-light">
                                                <div className="text-muted small">Peso total final</div>
                                                <div className="fw-bold fs-5">{formatWeightKg(inventory.final.totalWeightKg, 0)}</div>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="border rounded p-3" style={{ backgroundColor: "#E8F5E9" }}>
                                                <div className="text-muted small">Valor total</div>
                                                <div className="fw-bold fs-5 text-success">{formatCurrency(inventory.valuation.totalValue, meta)}</div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Table size="sm" className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Etapa</th>
                                                <th className="text-end">Peso (kg)</th>
                                                <th className="text-end">Valor</th>
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
                    {/* Production KPIs */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-line-chart-line me-2 text-primary" />Producción</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 mb-3">
                                <Col md={6}>
                                    <div className="border rounded p-3">
                                        <div className="fw-semibold mb-2"><i className="ri-seedling-line me-1 text-success" />Nacimientos</div>
                                        <Row className="small g-2">
                                            <Col xs={6}>Camadas<div className="fw-bold">{formatNumber(production.births.litterCount)}</div></Col>
                                            <Col xs={6}>Vivos<div className="fw-bold text-success">{formatNumber(production.births.pigletsBornAlive)}</div></Col>
                                            <Col xs={6}>Muertos<div className="fw-bold text-danger">{formatNumber(production.births.pigletsBornDead)}</div></Col>
                                            <Col xs={6}>Camada promedio<div className="fw-bold">{formatNumber(production.births.avgLitterSize, 1)}</div></Col>
                                            <Col xs={12}>Peso prom. al nacer<div className="fw-bold">{formatWeightKg(production.births.avgPigletBirthWeightKg, 2)}</div></Col>
                                        </Row>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="border rounded p-3">
                                        <div className="fw-semibold mb-2"><i className="ri-parent-line me-1 text-info" />Destetes</div>
                                        <Row className="small g-2">
                                            <Col xs={6}>Camadas<div className="fw-bold">{formatNumber(production.weanings.litterCount)}</div></Col>
                                            <Col xs={6}>Lechones destetados<div className="fw-bold">{formatNumber(production.weanings.pigletsWeaned)}</div></Col>
                                            <Col xs={6}>Camada prom.<div className="fw-bold">{formatNumber(production.weanings.avgLitterSizeAtWeaning, 1)}</div></Col>
                                            <Col xs={6}>Edad prom. destete<div className="fw-bold">{production.weanings.avgWeaningAgeDays !== null ? `${production.weanings.avgWeaningAgeDays} días` : "Sin datos"}</div></Col>
                                            <Col xs={12}>Mortalidad pre-destete<div className="fw-bold text-danger">{formatPercentDecimal(production.weanings.preWeaningMortality)}</div></Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* Mortality */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-skull-line me-2 text-danger" />Mortalidad</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3 mb-3">
                                <Col md={4}>
                                    <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                        <div className="text-muted small">Muertes totales</div>
                                        <div className="fw-bold fs-5 text-danger">{formatNumber(production.mortality.totalDeaths)}</div>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                        <div className="text-muted small">Tasa de mortalidad</div>
                                        <div className="fw-bold fs-5 text-danger">{formatPercentDecimal(production.mortality.mortalityRate, 2)}</div>
                                    </div>
                                </Col>
                            </Row>

                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">Por etapa</div>
                                    {production.mortality.byStage.length === 0 ? (
                                        <p className="text-muted small">Sin datos.</p>
                                    ) : (
                                        <Table size="sm" className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Etapa</th>
                                                    <th className="text-end">Muertes</th>
                                                    <th className="text-end">Tasa</th>
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
                                    <div className="fw-semibold mb-2">Por causa</div>
                                    {production.mortality.byCause.length === 0 ? (
                                        <p className="text-muted small">Sin causas registradas.</p>
                                    ) : (
                                        <Table size="sm" className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Causa</th>
                                                    <th className="text-end">Cantidad</th>
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

                    {/* FCR + avg days */}
                    <Card className="mb-3">
                        <CardHeader>
                            <h5 className="mb-0"><i className="ri-exchange-line me-2 text-primary" />Conversión alimenticia y permanencia</h5>
                        </CardHeader>
                        <CardBody>
                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">Conversión alimenticia (FCR)</div>
                                    <div className="border rounded p-3">
                                        <div className="text-muted small">General</div>
                                        <div className="fw-bold fs-5">{production.feedConversion.overall !== null ? production.feedConversion.overall.toFixed(2) : "Sin datos"}</div>
                                        <small className="text-muted">Desglose por etapa: sin datos</small>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="fw-semibold mb-2">Días promedio por etapa</div>
                                    <Table size="sm" className="mb-0">
                                        <tbody>
                                            {production.avgDaysPerStage.map((d) => (
                                                <tr key={d.stage}>
                                                    <td>{stageLabel(d.stage)}</td>
                                                    <td className="text-end">{d.avgDays !== null ? `${d.avgDays} días` : <span className="text-muted">Sin datos</span>}</td>
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
