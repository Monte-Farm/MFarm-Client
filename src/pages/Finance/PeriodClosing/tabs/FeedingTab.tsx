import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatWeightKg } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const FeedingTab: React.FC<Props> = ({ snapshot }) => {
    const { feeding, meta } = snapshot;

    if (!feeding) {
        return <Alert color="secondary">Este cierre no incluye datos de alimentación.</Alert>;
    }

    const sortedPhases = [...feeding.byPhase].sort((a, b) => b.cost - a.cost);

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-restaurant-line me-2 text-primary" />Resumen de alimentación</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Consumo total</div>
                                <div className="fw-bold fs-5">{formatWeightKg(feeding.totalConsumedKg, 0)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                <div className="text-muted small">Costo total</div>
                                <div className="fw-bold fs-5 text-danger">{formatCurrency(feeding.totalCost, meta)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Costo promedio / kg</div>
                                <div className="fw-bold fs-5">{formatCurrency(feeding.avgCostPerKgFeed, meta)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-pie-chart-2-line me-2 text-info" />Por fase</h5>
                </CardHeader>
                <CardBody>
                    {sortedPhases.length === 0 ? (
                        <p className="text-muted mb-0">Sin consumo registrado.</p>
                    ) : (
                        <Table className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Fase</th>
                                    <th className="text-end">Consumido</th>
                                    <th className="text-end" style={{ backgroundColor: "#FFEBEE" }}>Costo</th>
                                    <th className="text-end">% del total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPhases.map((p) => {
                                    const pct = feeding.totalCost > 0 ? (p.cost / feeding.totalCost) * 100 : 0;
                                    return (
                                        <tr key={p.phase}>
                                            <td className="fw-semibold">{p.label}</td>
                                            <td className="text-end">{formatWeightKg(p.consumedKg, 0)}</td>
                                            <td className="text-end fw-semibold" style={{ backgroundColor: "#FFEBEE" }}>{formatCurrency(p.cost, meta)}</td>
                                            <td className="text-end text-muted">{pct.toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-scales-line me-2 text-warning" />Por animal</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">Consumo diario prom.</div>
                                <div className="fw-bold fs-5">{formatWeightKg(feeding.perAnimal.avgDailyConsumptionKg, 2)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">Costo prom. por cerdo</div>
                                <div className="fw-bold fs-5">{formatCurrency(feeding.perAnimal.avgCostPerPigInInventory, meta)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">Costo por kg producido</div>
                                <div className="fw-bold fs-5">{formatCurrency(feeding.perAnimal.avgCostPerKgProduced, meta)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        </>
    );
};

export default FeedingTab;
