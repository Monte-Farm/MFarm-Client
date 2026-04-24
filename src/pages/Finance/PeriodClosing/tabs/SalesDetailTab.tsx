import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatWeightKg } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const SalesDetailTab: React.FC<Props> = ({ snapshot }) => {
    const { salesDetail, meta } = snapshot;

    if (!salesDetail) {
        return <Alert color="secondary">Este cierre no incluye detalle de ventas.</Alert>;
    }

    const sortedClients = [...salesDetail.byClient].sort((a, b) => b.totalAmount - a.totalAmount);

    return (
        <>
            {/* Averages */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-line-chart-line me-2 text-primary" />Promedios</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Peso prom. al sacrificio</div>
                                <div className="fw-bold fs-5">{formatWeightKg(salesDetail.averages.avgWeightAtSaleKg, 1)}</div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Edad prom. al sacrificio</div>
                                <div className="fw-bold fs-5">
                                    {salesDetail.averages.avgAgeAtSaleDays !== null ? `${salesDetail.averages.avgAgeAtSaleDays} días` : "Sin datos"}
                                </div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Precio prom. / kg</div>
                                <div className="fw-bold fs-5">{formatCurrency(salesDetail.averages.avgPricePerKg, meta)}</div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Ingreso prom. / cerdo</div>
                                <div className="fw-bold fs-5">{formatCurrency(salesDetail.averages.avgRevenuePerPig, meta)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* By type */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-stack-line me-2 text-info" />Ventas por tipo</h5>
                </CardHeader>
                <CardBody>
                    {salesDetail.byType.length === 0 ? (
                        <p className="text-muted mb-0">Sin ventas registradas en el periodo.</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Tipo</th>
                                    <th className="text-end">Cerdos</th>
                                    <th className="text-end">Peso total</th>
                                    <th className="text-end">Peso / cerdo</th>
                                    <th className="text-end">Precio / kg</th>
                                    <th className="text-end" style={{ backgroundColor: "#E8F5E9" }}>Monto total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesDetail.byType.map((t) => (
                                    <tr key={t.type}>
                                        <td className="fw-semibold">{t.label}</td>
                                        <td className="text-end">{formatNumber(t.pigCount)}</td>
                                        <td className="text-end">{formatWeightKg(t.totalWeightKg, 1)}</td>
                                        <td className="text-end">{formatWeightKg(t.avgWeightPerPig, 1)}</td>
                                        <td className="text-end">{formatCurrency(t.avgPricePerKg, meta)}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#E8F5E9" }}>{formatCurrency(t.totalAmount, meta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* By client */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-user-line me-2 text-primary" />Ventas por cliente</h5>
                </CardHeader>
                <CardBody>
                    {sortedClients.length === 0 ? (
                        <p className="text-muted mb-0">Sin ventas por cliente registradas.</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Cliente</th>
                                    <th>RFC</th>
                                    <th className="text-end"># Ventas</th>
                                    <th className="text-end">Cerdos</th>
                                    <th className="text-end">Peso</th>
                                    <th className="text-end">Precio / kg</th>
                                    <th className="text-end" style={{ backgroundColor: "#E8F5E9" }}>Monto total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedClients.map((c, i) => (
                                    <tr key={i}>
                                        <td className="fw-semibold">{c.clientName}</td>
                                        <td className="text-muted small">{c.clientId || "—"}</td>
                                        <td className="text-end">{formatNumber(c.saleCount)}</td>
                                        <td className="text-end">{formatNumber(c.pigCount)}</td>
                                        <td className="text-end">{formatWeightKg(c.totalWeightKg, 1)}</td>
                                        <td className="text-end">{formatCurrency(c.avgPricePerKg, meta)}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#E8F5E9" }}>{formatCurrency(c.totalAmount, meta)}</td>
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

export default SalesDetailTab;
