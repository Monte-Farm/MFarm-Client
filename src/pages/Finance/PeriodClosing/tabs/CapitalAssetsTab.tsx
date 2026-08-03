import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Badge, Card, CardBody, CardHeader, Col, Row, Table } from "reactstrap";
import { ClosingSnapshot, AssetCategory, CapitalAssetsSnapshotAsset } from "common/data_interfaces";
import { formatCurrency } from "utils/closingFormatters";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";

interface Props {
    snapshot: ClosingSnapshot;
}

const CapitalAssetsTab: React.FC<Props> = ({ snapshot }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";

    const { capitalAssets, meta } = snapshot;

    if (!capitalAssets) {
        return <Alert color="secondary">{t("finance.periodClosing.tabs.capitalAssets.empty")}</Alert>;
    }

    const { totalMonthlyAmortization, activeAssetCount, assets } = capitalAssets;

    return (
        <>
            {/* KPI cards */}
            <Row className="g-3 mb-3">
                <Col xl={3} md={6} sm={6}>
                    <StatKpiCard
                        title={t("finance.periodClosing.tabs.capitalAssets.kpi.totalAmortization")}
                        value={totalMonthlyAmortization}
                        prefix="$"
                        decimals={2}
                        animateValue
                        icon={<i className="ri-building-2-line fs-4" />}
                    />
                </Col>
                <Col xl={3} md={6} sm={6}>
                    <StatKpiCard
                        title={t("finance.periodClosing.tabs.capitalAssets.kpi.activeAssets")}
                        value={activeAssetCount}
                        icon={<i className="ri-checkbox-circle-line fs-4" />}
                    />
                </Col>
            </Row>

            {/* Assets table */}
            <Card>
                <CardHeader>
                    <h5 className="mb-0">{t("finance.periodClosing.tabs.capitalAssets.kpi.totalAmortization")}: {formatCurrency(totalMonthlyAmortization, meta)}</h5>
                </CardHeader>
                <CardBody>
                    {assets.length === 0 ? (
                        <p className="text-muted mb-0">{t("finance.periodClosing.tabs.capitalAssets.empty")}</p>
                    ) : (
                        <div className="table-responsive">
                            <Table className="table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.name")}</th>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.category")}</th>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.acquisitionCost")}</th>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.monthlyAmount")}</th>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.progress")}</th>
                                        <th>{t("finance.periodClosing.tabs.capitalAssets.col.remainingBalance")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset: CapitalAssetsSnapshotAsset) => {
                                        const pct = Math.round(asset.progressPercentage);
                                        return (
                                            <tr key={asset.assetId}>
                                                <td className="fw-semibold">{asset.name}</td>
                                                <td>
                                                    <Badge color="info" className="text-dark">
                                                        {t(`capitalAssets.category.${asset.category as AssetCategory}`)}
                                                    </Badge>
                                                </td>
                                                <td>{formatCurrency(asset.acquisitionCost, meta)}</td>
                                                <td className="fw-bold">{formatCurrency(asset.monthlyAmount, meta)}</td>
                                                <td style={{ minWidth: 120 }}>
                                                    <div className="progress mb-1" style={{ height: 6 }}>
                                                        <div
                                                            className="progress-bar"
                                                            role="progressbar"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <small className="text-muted">{pct}% ({asset.monthsCharged}/{asset.totalMonths})</small>
                                                </td>
                                                <td>{formatCurrency(asset.remainingBalance, meta)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className={`table-${isDark ? "dark" : "light"} fw-bold`}>
                                        <td colSpan={3}>Total</td>
                                        <td>{formatCurrency(totalMonthlyAmortization, meta)}</td>
                                        <td />
                                        <td />
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    )}
                </CardBody>
            </Card>
        </>
    );
};

export default CapitalAssetsTab;
