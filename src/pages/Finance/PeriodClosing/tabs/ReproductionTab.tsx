import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatNumber, formatPercentDecimal } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const ReproductionTab: React.FC<Props> = ({ snapshot }) => {
    const { reproduction } = snapshot;

    if (!reproduction) {
        return <Alert color="secondary">Este cierre no incluye datos de reproducción.</Alert>;
    }

    return (
        <>
            {/* Reproductive funnel */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-heart-pulse-line me-2 text-primary" />Embudo reproductivo</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">Inseminaciones</div>
                                <div className="fw-bold fs-3 text-primary">{formatNumber(reproduction.inseminations.count)}</div>
                                <small className="text-muted">Éxito: {formatPercentDecimal(reproduction.inseminations.successRate)}</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">Gestaciones confirmadas</div>
                                <div className="fw-bold fs-3 text-info">{formatNumber(reproduction.activePregnancies.confirmedInPeriod)}</div>
                                <small className="text-muted">en el periodo</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">Partos</div>
                                <div className="fw-bold fs-3 text-success">{formatNumber(reproduction.farrowings.count)}</div>
                                <small className="text-muted">{formatNumber(reproduction.farrowings.totalPigletsBorn)} lechones</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">Destetes</div>
                                <div className="fw-bold fs-3 text-warning">{formatNumber(reproduction.sows.weanedInPeriod)}</div>
                                <small className="text-muted">camadas destetadas</small>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* Pregnancies */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-pulse-line me-2 text-info" />Gestaciones activas</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Inicio del periodo</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.activePregnancies.atPeriodStart)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Fin del periodo</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.activePregnancies.atPeriodEnd)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#E8F5E9" }}>
                                <div className="text-muted small">Confirmadas en periodo</div>
                                <div className="fw-bold fs-5 text-success">{formatNumber(reproduction.activePregnancies.confirmedInPeriod)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* Farrowings */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-seedling-line me-2 text-success" />Partos del periodo</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Cantidad de partos</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.count)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Total lechones nacidos</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.totalPigletsBorn)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Camada promedio</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.avgLitterSize, 1)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* Sows */}
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-community-line me-2 text-primary" />Cerdas</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Activas al fin del periodo</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.sows.activeAtPeriodEnd)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Nuevamente paridas</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.sows.newlyFarrowed)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Destetadas en el periodo</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.sows.weanedInPeriod)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>
        </>
    );
};

export default ReproductionTab;
