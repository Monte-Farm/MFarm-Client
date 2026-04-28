import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot } from "common/data_interfaces";
import { formatCurrency, formatNumber, formatWeightKg } from "utils/closingFormatters";

interface Props {
    snapshot: ClosingSnapshot;
}

const SalesDetailTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const { salesDetail, meta } = snapshot;

    if (!salesDetail) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.sales.empty")}</Alert>;
    }

    const sortedClients = [...salesDetail.byClient].sort((a, b) => b.totalAmount - a.totalAmount);

    return (
        <>
            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-line-chart-line me-2 text-primary" />{t("finance.periodClosing.tabs.sales.averages.header")}</h5>
                </CardHeader>
                <CardBody>
                    <Row className="g-3">
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.sales.averages.avgWeight")}</div>
                                <div className="fw-bold fs-5">{formatWeightKg(salesDetail.averages.avgWeightAtSaleKg, 1)}</div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.sales.averages.avgAge")}</div>
                                <div className="fw-bold fs-5">
                                    {salesDetail.averages.avgAgeAtSaleDays !== null
                                        ? t("finance.periodClosing.tabs.sales.averages.days", { val: salesDetail.averages.avgAgeAtSaleDays })
                                        : t("finance.periodClosing.tabs.sales.averages.noData")}
                                </div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.sales.averages.avgPrice")}</div>
                                <div className="fw-bold fs-5">{formatCurrency(salesDetail.averages.avgPricePerKg, meta)}</div>
                            </div>
                        </Col>
                        <Col md={3} sm={6}>
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">{t("finance.periodClosing.tabs.sales.averages.avgRevenue")}</div>
                                <div className="fw-bold fs-5">{formatCurrency(salesDetail.averages.avgRevenuePerPig, meta)}</div>
                            </div>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-stack-line me-2 text-info" />{t("finance.periodClosing.tabs.sales.byType.header")}</h5>
                </CardHeader>
                <CardBody>
                    {salesDetail.byType.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.sales.byType.empty")}</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.sales.byType.col.type")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byType.col.pigs")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byType.col.totalWeight")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byType.col.weightPerPig")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byType.col.pricePerKg")}</th>
                                    <th className="text-end" style={{ backgroundColor: "#E8F5E9" }}>{t("finance.periodClosing.tabs.sales.byType.col.totalAmount")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesDetail.byType.map((t_) => (
                                    <tr key={t_.type}>
                                        <td className="fw-semibold">{t_.label}</td>
                                        <td className="text-end">{formatNumber(t_.pigCount)}</td>
                                        <td className="text-end">{formatWeightKg(t_.totalWeightKg, 1)}</td>
                                        <td className="text-end">{formatWeightKg(t_.avgWeightPerPig, 1)}</td>
                                        <td className="text-end">{formatCurrency(t_.avgPricePerKg, meta)}</td>
                                        <td className="text-end fw-semibold" style={{ backgroundColor: "#E8F5E9" }}>{formatCurrency(t_.totalAmount, meta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader>
                    <h5 className="mb-0"><i className="ri-user-line me-2 text-primary" />{t("finance.periodClosing.tabs.sales.byClient.header")}</h5>
                </CardHeader>
                <CardBody>
                    {sortedClients.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.sales.byClient.empty")}</p>
                    ) : (
                        <Table className="table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t("finance.periodClosing.tabs.sales.byClient.col.client")}</th>
                                    <th>{t("finance.periodClosing.tabs.sales.byClient.col.rfc")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byClient.col.sales")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byClient.col.pigs")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byClient.col.weight")}</th>
                                    <th className="text-end">{t("finance.periodClosing.tabs.sales.byClient.col.pricePerKg")}</th>
                                    <th className="text-end" style={{ backgroundColor: "#E8F5E9" }}>{t("finance.periodClosing.tabs.sales.byClient.col.totalAmount")}</th>
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
