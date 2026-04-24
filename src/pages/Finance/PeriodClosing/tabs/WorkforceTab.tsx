import React from "react";
import { Alert, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const WorkforceTab: React.FC<Props> = ({ snapshot }) => {
    const { workforce, meta } = snapshot;

    if (!workforce) {
        return <Alert color="secondary">Este cierre no incluye datos de personal.</Alert>;
    }

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-group-line me-2 text-primary" />Personal del periodo</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={6}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                <div className="text-muted small">Costo total de mano de obra</div>
                                <div className="fw-bold fs-4 text-danger">{formatCurrency(workforce.totalLaborCost, meta)}</div>
                                <small className="text-muted">Suma de entradas financieras de categoría LABOR</small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Empleados activos</div>
                                <div className="fw-bold fs-4">{formatNumber(workforce.employeeCount)}</div>
                                <small className="text-muted">Usuarios asignados a la granja al momento del cierre</small>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-user-star-line me-2 text-info" />Desglose por rol</h5>
                </CardHeader>
                <CardBody>
                    {!workforce.costByRole ? (
                        <div className="text-center py-3">
                            <i className="ri-tools-line fs-3 text-muted" />
                            <div className="text-muted mt-2">Próximamente</div>
                            <small className="text-muted">El sistema no vincula entradas de mano de obra con roles específicos.</small>
                        </div>
                    ) : workforce.costByRole.length === 0 ? (
                        <p className="text-muted mb-0">Sin desglose disponible.</p>
                    ) : (
                        <ul className="list-unstyled mb-0">
                            {workforce.costByRole.map((r) => (
                                <li key={r.role} className="d-flex justify-content-between border-bottom py-2">
                                    <span>{r.role} ({r.count})</span>
                                    <strong>{formatCurrency(r.totalCost, meta)}</strong>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-time-line me-2 text-warning" />Horas trabajadas</h5>
                </CardHeader>
                <CardBody>
                    {!workforce.hoursWorked ? (
                        <div className="text-center py-3">
                            <i className="ri-tools-line fs-3 text-muted" />
                            <div className="text-muted mt-2">Próximamente</div>
                            <small className="text-muted">El sistema aún no registra horas trabajadas.</small>
                        </div>
                    ) : (
                        <Row className="g-3">
                            <Col md={6}>
                                <div className="border rounded p-3 bg-light">
                                    <div className="text-muted small">Horas totales</div>
                                    <div className="fw-bold fs-5">{formatNumber(workforce.hoursWorked.total)}</div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="border rounded p-3 bg-light">
                                    <div className="text-muted small">Promedio por empleado</div>
                                    <div className="fw-bold fs-5">{formatNumber(workforce.hoursWorked.avgPerEmployee)}</div>
                                </div>
                            </Col>
                        </Row>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default WorkforceTab;
