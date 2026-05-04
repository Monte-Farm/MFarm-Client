import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatWeightKg } from "utils/closingFormatters";
import { darkenHex } from "utils/colorUtils";

interface Props {
    snapshot: ClosingSnapshot;
}

const FeedingTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const { feeding, meta } = snapshot;

    if (!feeding) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.feeding.empty")}</Alert>;
    }

    const sortedPhases = [...feeding.byPhase].sort((a, b) => b.cost - a.cost);

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-restaurant-line me-2 text-primary" />{t("finance.periodClosing.tabs.feeding.summary.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.summary.totalConsumed")}</div>
                                <div className="fw-bold fs-5">{formatWeightKg(feeding.totalConsumedKg, 0)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3" style={{ backgroundColor: bg("#FFEBEE") }}>
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.summary.totalCost")}</div>
                                <div className="fw-bold fs-5 text-danger">{formatCurrency(feeding.totalCost, meta)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.summary.avgCostPerKg")}</div>
                                <div className="fw-bold fs-5">{formatCurrency(feeding.avgCostPerKgFeed, meta)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-pie-chart-2-line me-2 text-info" />{t("finance.periodClosing.tabs.feeding.byPhase.header")}</h5>
                </CardHeader>
                <CardBody>
                    {sortedPhases.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.feeding.byPhase.empty")}</p>
                    ) : (
                        <Table className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.feeding.byPhase.col.phase")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.feeding.byPhase.col.consumed")}</th>
                                    <th className="text-end" style={{ backgroundColor: bg("#FFEBEE") }}>{t("finance.periodClosing.tabs.feeding.byPhase.col.cost")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.feeding.byPhase.col.pct")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPhases.map((p) => {
                                    const pct = feeding.totalCost > 0 ? (p.cost / feeding.totalCost) * 100 : 0;
                                    return (
                                        <tr key={p.phase}>
                                            <td className="fw-semibold">{p.label}</td>
                                            <td className="text-end">{formatWeightKg(p.consumedKg, 0)}</td>
                                            <td className="text-end fw-semibold" style={{ backgroundColor: bg("#FFEBEE") }}>{formatCurrency(p.cost, meta)}</td>
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
                    <h5 className="mb-0"><i className="ri-scales-line me-2 text-warning" />{t("finance.periodClosing.tabs.feeding.perAnimal.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.perAnimal.avgDaily")}</div>
                                <div className="fw-bold fs-5">{formatWeightKg(feeding.perAnimal.avgDailyConsumptionKg, 2)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.perAnimal.avgCostPerPig")}</div>
                                <div className="fw-bold fs-5">{formatCurrency(feeding.perAnimal.avgCostPerPigInInventory, meta)}</div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="border rounded p-3">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.feeding.perAnimal.costPerKgProduced")}</div>
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
