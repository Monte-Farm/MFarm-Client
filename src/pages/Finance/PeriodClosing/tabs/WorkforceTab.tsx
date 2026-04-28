import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const WorkforceTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const { workforce, meta } = snapshot;

    if (!workforce) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.workforce.empty")}</Alert>;
    }

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-group-line me-2 text-primary" />{t("finance.periodClosing.tabs.workforce.summary.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={6}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#FFEBEE" }}>
                                <div className="text-muted small">{t("finance.periodClosing.tabs.workforce.summary.totalCost")}</div>
                                <div className="fw-bold fs-4 text-danger">{formatCurrency(workforce.totalLaborCost, meta)}</div>
                                <small className="text-muted">{t("finance.periodClosing.tabs.workforce.summary.totalCostNote")}</small>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.workforce.summary.employees")}</div>
                                <div className="fw-bold fs-4">{formatNumber(workforce.employeeCount)}</div>
                                <small className="text-muted">{t("finance.periodClosing.tabs.workforce.summary.employeesNote")}</small>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-user-star-line me-2 text-info" />{t("finance.periodClosing.tabs.workforce.byRole.header")}</h5>
                </CardHeader>
                <CardBody>
                    {!workforce.costByRole ? (
                        <div className="text-center py-3">
                            <i className="ri-tools-line fs-3 text-muted" />
                            <div className="text-muted mt-2">{t("finance.periodClosing.tabs.workforce.byRole.soon")}</div>
                            <small className="text-muted">{t("finance.periodClosing.tabs.workforce.byRole.soonNote")}</small>
                        </div>
                    ) : workforce.costByRole.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.workforce.byRole.empty")}</p>
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
                    <h5 className="mb-0"><i className="ri-time-line me-2 text-warning" />{t("finance.periodClosing.tabs.workforce.hours.header")}</h5>
                </CardHeader>
                <CardBody>
                    {!workforce.hoursWorked ? (
                        <div className="text-center py-3">
                            <i className="ri-tools-line fs-3 text-muted" />
                            <div className="text-muted mt-2">{t("finance.periodClosing.tabs.workforce.hours.soon")}</div>
                            <small className="text-muted">{t("finance.periodClosing.tabs.workforce.hours.soonNote")}</small>
                        </div>
                    ) : (
                        <Row className="g-3">
                            <Col md={6}>
                                <div className="border rounded p-3 bg-light">
                                    <div className="text-muted small">{t("finance.periodClosing.tabs.workforce.hours.total")}</div>
                                    <div className="fw-bold fs-5">{formatNumber(workforce.hoursWorked.total)}</div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className="border rounded p-3 bg-light">
                                    <div className="text-muted small">{t("finance.periodClosing.tabs.workforce.hours.avgPerEmployee")}</div>
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
