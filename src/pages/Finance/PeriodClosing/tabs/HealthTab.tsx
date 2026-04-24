import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const HealthTab: React.FC<Props> = ({ snapshot }) => {
    const { health, meta } = snapshot;

    if (!health) {
        return <Alert color="secondary">Este cierre no incluye datos de sanidad.</Alert>;
    }

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-medicine-bottle-line me-2 text-danger" />Resumen sanidad</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                <div className="text-muted small">Costo total sanidad</div>
                                <div className="fw-bold fs-5 text-danger">{formatCurrency(health.totalCost, meta)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Tratamientos</div>
                                <div className="fw-bold fs-5">{formatNumber(health.treatmentEvents)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Vacunaciones</div>
                                <div className="fw-bold fs-5">{formatNumber(health.vaccinationEvents)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-first-aid-kit-line me-2 text-primary" />Medicamentos aplicados (top 10)</h5>
                </CardHeader>
                <CardBody>
                    {health.medications.length === 0 ? (
                        <p className="text-muted mb-0">Sin medicamentos registrados en el periodo.</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th className="text-end">Aplicaciones</th>
                                    <th className="text-end">Cantidad total</th>
                                    <th className="text-end" style={{ backgroundColor: "#FFEBEE" }}>Costo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {health.medications.map((m, i) => (
                                    <tr key={i}>
                                        <td className="fw-semibold">{m.productName}</td>
                                        <td className="text-end">{formatNumber(m.applicationCount)}</td>
                                        <td className="text-end">{formatNumber(m.totalQuantity, 1)} {m.unit}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#FFEBEE" }}>{formatCurrency(m.totalCost, meta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-skull-line me-2 text-danger" />Mortalidad por causa</h5>
                </CardHeader>
                <CardBody>
                    {health.mortalityByCause.length === 0 ? (
                        <p className="text-muted mb-0">Sin causas de muerte registradas.</p>
                    ) : (
                        <Table size="sm" className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Causa</th>
                                    <th className="text-end">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {health.mortalityByCause.map((c, i) => (
                                    <tr key={i}>
                                        <td className="text-capitalize">{c.cause}</td>
                                        <td className="text-end">{formatNumber(c.count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default HealthTab;
