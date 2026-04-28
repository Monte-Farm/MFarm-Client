import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatNumber, formatPercentDecimal } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const ReproductionTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const { reproduction } = snapshot;

    if (!reproduction) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.reproduction.empty")}</Alert>;
    }

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-heart-pulse-line me-2 text-primary" />{t("finance.periodClosing.tabs.reproduction.funnel.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.reproduction.funnel.inseminations")}</div>
                                <div className="fw-bold fs-3 text-primary">{formatNumber(reproduction.inseminations.count)}</div>
                                <small className="text-muted">{t("finance.periodClosing.tabs.reproduction.funnel.success")} {formatPercentDecimal(reproduction.inseminations.successRate)}</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.reproduction.funnel.pregnancies")}</div>
                                <div className="fw-bold fs-3 text-info">{formatNumber(reproduction.activePregnancies.confirmedInPeriod)}</div>
                                <small className="text-muted">{t("finance.periodClosing.tabs.reproduction.funnel.inPeriod")}</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.reproduction.funnel.farrowings")}</div>
                                <div className="fw-bold fs-3 text-success">{formatNumber(reproduction.farrowings.count)}</div>
                                <small className="text-muted">{formatNumber(reproduction.farrowings.totalPigletsBorn)} {t("finance.periodClosing.tabs.reproduction.funnel.piglets")}</small>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light text-center">
                                <div className="text-muted small mb-1">{t("finance.periodClosing.tabs.reproduction.funnel.weanings")}</div>
                                <div className="fw-bold fs-3 text-warning">{formatNumber(reproduction.sows.weanedInPeriod)}</div>
                                <small className="text-muted">{t("finance.periodClosing.tabs.reproduction.funnel.weanedLitters")}</small>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-pulse-line me-2 text-info" />{t("finance.periodClosing.tabs.reproduction.activePregnancies.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.activePregnancies.atStart")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.activePregnancies.atPeriodStart)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.activePregnancies.atEnd")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.activePregnancies.atPeriodEnd)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3" style={{ backgroundColor: "#E8F5E9" }}>
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.activePregnancies.confirmed")}</div>
                                <div className="fw-bold fs-5 text-success">{formatNumber(reproduction.activePregnancies.confirmedInPeriod)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-seedling-line me-2 text-success" />{t("finance.periodClosing.tabs.reproduction.farrowings.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.farrowings.count")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.count)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.farrowings.totalPiglets")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.totalPigletsBorn)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.farrowings.avgLitter")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.farrowings.avgLitterSize, 1)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-community-line me-2 text-primary" />{t("finance.periodClosing.tabs.reproduction.sows.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.sows.activeAtEnd")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.sows.activeAtPeriodEnd)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.sows.newlyFarrowed")}</div>
                                <div className="fw-bold fs-5">{formatNumber(reproduction.sows.newlyFarrowed)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.reproduction.sows.weanedInPeriod")}</div>
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
