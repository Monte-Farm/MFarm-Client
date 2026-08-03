import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
    Badge, Button, Card, CardBody, CardHeader, Col, Container, Row, Spinner, Table
} from "reactstrap";
import { fetchCapitalAssetDetail, deleteCapitalAsset } from "slices/capitalAssets/thunk";
import { setCurrent } from "slices/capitalAssets/reducer";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CapitalAssetEditModal from "Components/Common/Forms/CapitalAssetEditModal";
import AdjustMonthsModal from "Components/Common/Forms/AdjustMonthsModal";
import { AdjustmentHistoryEntry, AssetCategory } from "common/data_interfaces";

const formatDate = (iso: string): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const CapitalAssetDetail: React.FC = () => {
    const { t } = useTranslation();
    const { assetId } = useParams<{ assetId: string }>();
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const { current: asset, loadingDetail, error } = useSelector((state: any) => state.CapitalAssets);

    const [modals, setModals] = useState({ edit: false, adjust: false, delete: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const toggleModal = (key: keyof typeof modals, val?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: val ?? !prev[key] }));
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color, message });
        setTimeout(() => setAlertConfig((prev) => ({ ...prev, visible: false })), 4000);
    };

    useEffect(() => {
        if (assetId) dispatch(fetchCapitalAssetDetail(assetId));
        return () => { dispatch(setCurrent(null)); };
    }, [assetId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loadingDetail) return <div className="page-content"><LoadingAnimation /></div>;
    if (error || !asset) return (
        <div className="page-content">
            <AlertMessage
                color="danger"
                message={error || t("capitalAssets.errorDetail")}
                visible={true}
                onClose={() => {}}
            />
        </div>
    );

    const progressPct = asset.progressPercentage ?? (asset.totalMonths > 0 ? Math.round((asset.monthsCharged / asset.totalMonths) * 100) : 0);
    const remainingBalance = asset.remainingBalance ?? asset.acquisitionCost;
    const remainingMonths = asset.remainingMonths ?? (asset.totalMonths - asset.monthsCharged);

    const handleDelete = async () => {
        if (asset.monthsCharged > 0) {
            showAlert("warning", t("capitalAssets.action.deleteBlocked"));
            toggleModal("delete", false);
            return;
        }
        setDeleteLoading(true);
        try {
            await dispatch(deleteCapitalAsset(asset._id));
            navigate("/finance/capital-assets");
        } catch {
            showAlert("danger", t("capitalAssets.delete.error"));
        } finally {
            setDeleteLoading(false);
            toggleModal("delete", false);
        }
    };

    const refreshDetail = () => {
        if (assetId) dispatch(fetchCapitalAssetDetail(assetId));
    };

    document.title = asset.name;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("capitalAssets.detail.breadcrumb")} pageTitle={t("capitalAssets.breadcrumb")} />

                <AlertMessage
                    color={alertConfig.color}
                    message={alertConfig.message}
                    visible={alertConfig.visible}
                    onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
                />

                {/* Header */}
                <Card className="mb-3">
                    <CardBody>
                        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                            <div>
                                <Button className="farm-secondary-button mb-2" onClick={() => navigate("/finance/capital-assets")}>
                                    <i className="ri-arrow-left-line me-1" />
                                    {t("common.button.back")}
                                </Button>
                                <h4 className="mb-1">{asset.name}</h4>
                                {asset.description && (
                                    <p className="text-muted mb-2">{asset.description}</p>
                                )}
                                <div className="d-flex gap-2">
                                    <Badge color={asset.status === 'active' ? 'success' : 'secondary'}>
                                        {t(`capitalAssets.status.${asset.status}`)}
                                    </Badge>
                                    <Badge color="info" className="text-dark">
                                        {t(`capitalAssets.category.${asset.category as AssetCategory}`)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="d-flex gap-2 flex-wrap">
                                <Button className="farm-secondary-button" onClick={() => toggleModal("edit", true)}>
                                    <i className="ri-edit-line me-1" />
                                    {t("common.button.edit")}
                                </Button>
                                {asset.status === 'active' && (
                                    <Button className="farm-secondary-button" onClick={() => toggleModal("adjust", true)}>
                                        <i className="ri-timer-line me-1" />
                                        {t("capitalAssets.adjust.title")}
                                    </Button>
                                )}
                                <Button
                                    className="btn btn-danger"
                                    disabled={asset.monthsCharged > 0}
                                    title={asset.monthsCharged > 0 ? t("capitalAssets.action.deleteBlocked") : undefined}
                                    onClick={() => toggleModal("delete", true)}
                                >
                                    <i className="ri-delete-bin-line me-1" />
                                    {t("common.button.delete")}
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* KPI cards */}
                <Row className="g-3 mb-3">
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.acquisitionCost")}
                            value={asset.acquisitionCost}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-money-dollar-circle-line fs-4" />}
                        />
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.monthlyAmount")}
                            value={asset.currentMonthlyAmount}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-calendar-2-line fs-4" />}
                        />
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.remainingBalance")}
                            value={remainingBalance}
                            prefix="$"
                            decimals={2}
                            icon={<i className="ri-scales-line fs-4" />}
                        />
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.monthsCharged")}
                            value={asset.monthsCharged}
                            icon={<i className="ri-checkbox-circle-line fs-4" />}
                        />
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.monthsRemaining")}
                            value={remainingMonths}
                            icon={<i className="ri-hourglass-line fs-4" />}
                        />
                    </Col>
                    <Col xl={2} md={4} sm={6}>
                        <StatKpiCard
                            title={t("capitalAssets.detail.kpi.progress")}
                            value={progressPct}
                            suffix="%"
                            decimals={1}
                            icon={<i className="ri-bar-chart-line fs-4" />}
                        />
                    </Col>
                </Row>

                {/* Progress bar */}
                <Card className="mb-3">
                    <CardBody>
                        <div className="d-flex justify-content-between mb-1">
                            <small className="text-muted">{t("capitalAssets.detail.kpi.progress")}</small>
                            <small className="fw-bold">{progressPct.toFixed(1)}%</small>
                        </div>
                        <div className="progress" style={{ height: 12 }}>
                            <div
                                className={`progress-bar ${asset.status === 'amortized' ? 'bg-secondary' : 'bg-success'}`}
                                role="progressbar"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted">{asset.monthsCharged} / {asset.totalMonths} meses</small>
                            <small className="text-muted">{formatDate(asset.acquisitionDate)} → amortizado en {asset.totalMonths} meses</small>
                        </div>
                    </CardBody>
                </Card>

                {/* Adjustment history */}
                <Card>
                    <CardHeader>
                        <h5 className="mb-0">{t("capitalAssets.detail.history.header")}</h5>
                    </CardHeader>
                    <CardBody>
                        {asset.adjustmentHistory.length === 0 ? (
                            <p className="text-muted mb-0">{t("capitalAssets.detail.history.empty")}</p>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table-sm align-middle">
                                    <thead>
                                        <tr>
                                            <th>{t("capitalAssets.detail.history.col.date")}</th>
                                            <th>{t("capitalAssets.detail.history.col.prevMonths")}</th>
                                            <th>{t("capitalAssets.detail.history.col.newMonths")}</th>
                                            <th>{t("capitalAssets.detail.history.col.prevMonthly")}</th>
                                            <th>{t("capitalAssets.detail.history.col.newMonthly")}</th>
                                            <th>{t("capitalAssets.detail.history.col.balance")}</th>
                                            <th>{t("capitalAssets.detail.history.col.reason")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...asset.adjustmentHistory]
                                            .sort((a: AdjustmentHistoryEntry, b: AdjustmentHistoryEntry) =>
                                                new Date(a.adjustedAt).getTime() - new Date(b.adjustedAt).getTime()
                                            )
                                            .map((entry: AdjustmentHistoryEntry, idx: number) => (
                                                <tr key={idx}>
                                                    <td>{formatDate(entry.adjustedAt)}</td>
                                                    <td>{entry.previousRemainingMonths}</td>
                                                    <td>{entry.newRemainingMonths}</td>
                                                    <td>${entry.previousMonthlyAmount.toFixed(2)}</td>
                                                    <td>${entry.newMonthlyAmount.toFixed(2)}</td>
                                                    <td>${entry.remainingBalance.toFixed(2)}</td>
                                                    <td className="text-muted small">{entry.reason || t("capitalAssets.detail.history.noReason")}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Edit modal */}
            <CapitalAssetEditModal
                isOpen={modals.edit}
                onClose={() => toggleModal("edit", false)}
                onSuccess={refreshDetail}
                asset={asset}
            />

            {/* Adjust months modal */}
            <AdjustMonthsModal
                isOpen={modals.adjust}
                onClose={() => toggleModal("adjust", false)}
                onSuccess={refreshDetail}
                asset={asset}
            />

            {/* Delete confirm */}
            {modals.delete && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t("common.button.delete")}</h5>
                                <button className="btn-close" onClick={() => toggleModal("delete", false)} />
                            </div>
                            <div className="modal-body">
                                <p>{t("capitalAssets.action.deleteConfirm")}</p>
                            </div>
                            <div className="modal-footer">
                                <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>
                                    {t("common.button.cancel")}
                                </Button>
                                <Button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                                    {deleteLoading ? <Spinner size="sm" /> : t("common.button.delete")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CapitalAssetDetail;
