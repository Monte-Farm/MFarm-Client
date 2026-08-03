import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
    Badge, Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalHeader,
    Row, Spinner, Table
} from "reactstrap";
import { fetchCapitalAssetDetail, deleteCapitalAsset } from "slices/capitalAssets/thunk";
import { setCurrent } from "slices/capitalAssets/reducer";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CapitalAssetEditModal from "Components/Common/Forms/CapitalAssetEditModal";
import AdjustMonthsModal from "Components/Common/Forms/AdjustMonthsModal";
import { AdjustmentHistoryEntry, AssetCategory } from "common/data_interfaces";

const formatDate = (iso: string): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface CapitalAssetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    assetId: string;
    onRefresh: () => void;
}

const CapitalAssetDetailModal: React.FC<CapitalAssetDetailModalProps> = ({
    isOpen, onClose, assetId, onRefresh
}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();

    const asset = useSelector((state: any) => state.CapitalAssets.current);
    const loadingDetail = useSelector((state: any) => state.CapitalAssets.loadingDetail);

    const [subModals, setSubModals] = useState({ edit: false, adjust: false, delete: false });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const toggleSub = (key: keyof typeof subModals, val?: boolean) => {
        setSubModals((prev) => ({ ...prev, [key]: val ?? !prev[key] }));
    };

    useEffect(() => {
        if (isOpen && assetId) {
            dispatch(fetchCapitalAssetDetail(assetId));
        }
        if (!isOpen) {
            dispatch(setCurrent(null));
            setSubModals({ edit: false, adjust: false, delete: false });
        }
    }, [isOpen, assetId]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshDetail = () => {
        dispatch(fetchCapitalAssetDetail(assetId));
        onRefresh();
    };

    const handleDelete = async () => {
        if (!asset) return;
        setDeleteLoading(true);
        try {
            await dispatch(deleteCapitalAsset(asset._id));
            onRefresh();
            onClose();
        } catch {
            // error handled in thunk
        } finally {
            setDeleteLoading(false);
            toggleSub("delete", false);
        }
    };

    const progressPct = asset
        ? (asset.progressPercentage ?? (asset.totalMonths > 0 ? Math.round((asset.monthsCharged / asset.totalMonths) * 100) : 0))
        : 0;
    const remainingBalance = asset ? (asset.remainingBalance ?? asset.acquisitionCost) : 0;
    const remainingMonths = asset ? (asset.remainingMonths ?? (asset.totalMonths - asset.monthsCharged)) : 0;

    return (
        <>
            <Modal size="lg" isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={onClose}>
                    {loadingDetail || !asset
                        ? t("capitalAssets.detail.breadcrumb")
                        : asset.name
                    }
                </ModalHeader>
                <ModalBody>
                    {loadingDetail ? (
                        <LoadingAnimation />
                    ) : !asset ? (
                        <p className="text-muted text-center py-3">{t("capitalAssets.errorDetail")}</p>
                    ) : (
                        <>
                            {/* Badges + action buttons */}
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                <div className="d-flex gap-2 flex-wrap">
                                    <Badge color={asset.status === 'active' ? 'success' : 'secondary'}>
                                        {t(`capitalAssets.status.${asset.status}`)}
                                    </Badge>
                                    <Badge color="info" className="text-dark">
                                        {t(`capitalAssets.category.${asset.category as AssetCategory}`)}
                                    </Badge>
                                </div>
                                <div className="d-flex gap-2 flex-wrap">
                                    <Button className="farm-secondary-button" onClick={() => toggleSub("edit", true)}>
                                        <i className="ri-edit-line me-1" />{t("common.button.edit")}
                                    </Button>
                                    {asset.status === 'active' && (
                                        <Button className="farm-secondary-button" onClick={() => toggleSub("adjust", true)}>
                                            <i className="ri-timer-line me-1" />{t("capitalAssets.adjust.title")}
                                        </Button>
                                    )}
                                    <Button
                                        className="btn btn-danger"
                                        disabled={asset.monthsCharged > 0}
                                        title={asset.monthsCharged > 0 ? t("capitalAssets.action.deleteBlocked") : undefined}
                                        onClick={() => toggleSub("delete", true)}
                                    >
                                        <i className="ri-delete-bin-line me-1" />{t("common.button.delete")}
                                    </Button>
                                </div>
                            </div>

                            {asset.description && (
                                <p className="text-muted mb-3">{asset.description}</p>
                            )}

                            {/* KPI cards */}
                            <Row className="g-2 mb-3">
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.acquisitionCost")}
                                        value={asset.acquisitionCost}
                                        prefix="$"
                                        decimals={2}
                                        icon={<i className="ri-money-dollar-circle-line fs-5" />}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.monthlyAmount")}
                                        value={asset.currentMonthlyAmount}
                                        prefix="$"
                                        decimals={2}
                                        icon={<i className="ri-calendar-2-line fs-5" />}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.remainingBalance")}
                                        value={remainingBalance}
                                        prefix="$"
                                        decimals={2}
                                        icon={<i className="ri-scales-line fs-5" />}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.monthsCharged")}
                                        value={asset.monthsCharged}
                                        icon={<i className="ri-checkbox-circle-line fs-5" />}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.monthsRemaining")}
                                        value={remainingMonths}
                                        icon={<i className="ri-hourglass-line fs-5" />}
                                    />
                                </Col>
                                <Col xs={6} md={4}>
                                    <StatKpiCard
                                        title={t("capitalAssets.detail.kpi.progress")}
                                        value={progressPct}
                                        suffix="%"
                                        decimals={1}
                                        icon={<i className="ri-bar-chart-line fs-5" />}
                                    />
                                </Col>
                            </Row>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">{t("capitalAssets.detail.kpi.progress")}</small>
                                    <small className="fw-bold">{progressPct.toFixed(1)}%</small>
                                </div>
                                <div className="progress" style={{ height: 10 }}>
                                    <div
                                        className={`progress-bar ${asset.status === 'amortized' ? 'bg-secondary' : 'bg-success'}`}
                                        role="progressbar"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <div className="d-flex justify-content-between mt-1">
                                    <small className="text-muted">{asset.monthsCharged}/{asset.totalMonths} meses</small>
                                    <small className="text-muted">{formatDate(asset.acquisitionDate)}</small>
                                </div>
                            </div>

                            {/* Adjustment history */}
                            <Card className="mb-0">
                                <CardHeader className="py-2">
                                    <h6 className="mb-0">{t("capitalAssets.detail.history.header")}</h6>
                                </CardHeader>
                                <CardBody className="p-0">
                                    {asset.adjustmentHistory.length === 0 ? (
                                        <p className="text-muted mb-0 p-3">{t("capitalAssets.detail.history.empty")}</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table-sm align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>{t("capitalAssets.detail.history.col.date")}</th>
                                                        <th>{t("capitalAssets.detail.history.col.prevMonths")}</th>
                                                        <th>{t("capitalAssets.detail.history.col.newMonths")}</th>
                                                        <th>{t("capitalAssets.detail.history.col.prevMonthly")}</th>
                                                        <th>{t("capitalAssets.detail.history.col.newMonthly")}</th>
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
                        </>
                    )}
                </ModalBody>
            </Modal>

            {/* Sub-modals */}
            {asset && (
                <>
                    <CapitalAssetEditModal
                        isOpen={subModals.edit}
                        onClose={() => toggleSub("edit", false)}
                        onSuccess={refreshDetail}
                        asset={asset}
                    />
                    <AdjustMonthsModal
                        isOpen={subModals.adjust}
                        onClose={() => toggleSub("adjust", false)}
                        onSuccess={refreshDetail}
                        asset={asset}
                    />
                </>
            )}

            {/* Delete confirm */}
            <Modal isOpen={subModals.delete} toggle={() => toggleSub("delete", false)} centered>
                <ModalHeader toggle={() => toggleSub("delete", false)}>{t("common.button.delete")}</ModalHeader>
                <ModalBody>
                    <p>{t("capitalAssets.action.deleteConfirm")}</p>
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="farm-secondary-button" onClick={() => toggleSub("delete", false)}>
                            {t("common.button.cancel")}
                        </Button>
                        <Button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? <Spinner size="sm" /> : t("common.button.delete")}
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </>
    );
};

export default CapitalAssetDetailModal;
