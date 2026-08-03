import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
    Badge, Button, Card, CardBody, CardHeader, Col, Container,
    Input, Modal, ModalBody, ModalHeader, Row, Spinner
} from "reactstrap";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { CapitalAsset, AssetCategory } from "common/data_interfaces";
import { fetchCapitalAssets, fetchCapitalAssetsSummary, deleteCapitalAsset, triggerBackfill } from "slices/capitalAssets/thunk";
import { resetCapitalAssets } from "slices/capitalAssets/reducer";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import CapitalAssetForm from "Components/Common/Forms/CapitalAssetForm";
import CapitalAssetEditModal from "Components/Common/Forms/CapitalAssetEditModal";
import CapitalAssetDetailModal from "Components/Common/Details/CapitalAssetDetailModal";
import { Column } from "common/data/data_types";

const CATEGORIES: AssetCategory[] = [
    'construction', 'machinery', 'vehicle', 'equipment', 'technology', 'land', 'other'
];

const isTablet = () => window.innerWidth < 992;

const ViewCapitalAssets: React.FC = () => {
    const { t } = useTranslation();
    document.title = t("capitalAssets.pageTitle");

    const dispatch = useDispatch<any>();
    const userLogged = getEffectiveUser();
    const farmId: string = userLogged?.farm_assigned;

    const { items, loading, error, summary, loadingSummary, pagination } = useSelector((state: any) => state.CapitalAssets);

    const [filters, setFilters] = useState<{ status: string; category: string }>({ status: "", category: "" });
    const [modals, setModals] = useState({ create: false, detail: false, edit: false, delete: false, backfill: false });
    const [selectedAsset, setSelectedAsset] = useState<CapitalAsset | null>(null);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet());
    const [actionLoading, setActionLoading] = useState(false);

    const userRoles: string[] = Array.isArray(userLogged?.role)
        ? userLogged.role
        : (userLogged?.role ? [userLogged.role] : []);
    const canBackfill = userRoles.some(r => ['Superadmin', 'farm_manager'].includes(r));

    const toggleModal = (key: keyof typeof modals, val?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: val ?? !prev[key] }));
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color, message });
        setTimeout(() => setAlertConfig((prev) => ({ ...prev, visible: false })), 4000);
    };

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const fetchData = () => {
        if (!farmId) return;
        dispatch(fetchCapitalAssets(farmId, {
            status: filters.status as any || undefined,
            category: filters.category || undefined,
            limit: 100,
        }));
    };

    useEffect(() => {
        if (farmId) {
            dispatch(fetchCapitalAssetsSummary(farmId));
        }
        return () => { dispatch(resetCapitalAssets()); };
    }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData();
    }, [farmId, filters]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async () => {
        if (!selectedAsset) return;
        if (selectedAsset.monthsCharged > 0) {
            showAlert("warning", t("capitalAssets.action.deleteBlocked"));
            toggleModal("delete", false);
            return;
        }
        setActionLoading(true);
        try {
            await dispatch(deleteCapitalAsset(selectedAsset._id));
            showAlert("success", t("capitalAssets.delete.success"));
            fetchData();
            if (farmId) dispatch(fetchCapitalAssetsSummary(farmId));
        } catch {
            showAlert("danger", t("capitalAssets.delete.error"));
        } finally {
            setActionLoading(false);
            toggleModal("delete", false);
            setSelectedAsset(null);
        }
    };

    const handleBackfill = async () => {
        setActionLoading(true);
        try {
            const result = await dispatch(triggerBackfill(farmId));
            showAlert("success", t("capitalAssets.action.backfillSuccess", { charged: result?.charged ?? 0 }));
            fetchData();
        } catch {
            showAlert("danger", t("capitalAssets.action.backfillError"));
        } finally {
            setActionLoading(false);
            toggleModal("backfill", false);
        }
    };

    const statusBadge = (status: 'active' | 'amortized') => (
        <Badge color={status === 'active' ? 'success' : 'secondary'}>
            {t(`capitalAssets.status.${status}`)}
        </Badge>
    );

    const categoryBadge = (cat: AssetCategory) => (
        <Badge color="info" className="text-dark">
            {t(`capitalAssets.category.${cat}`)}
        </Badge>
    );

    const columns: Column<CapitalAsset>[] = [
        {
            header: t("capitalAssets.column.name"),
            accessor: "name",
        },
        {
            header: t("capitalAssets.column.category"),
            accessor: "category",
            render: (_: any, row: CapitalAsset) => categoryBadge(row.category),
        },
        {
            header: t("capitalAssets.column.acquisitionCost"),
            accessor: "acquisitionCost",
            render: (_: any, row: CapitalAsset) => `$${row.acquisitionCost.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        {
            header: t("capitalAssets.column.monthlyAmount"),
            accessor: "currentMonthlyAmount",
            render: (_: any, row: CapitalAsset) => `$${row.currentMonthlyAmount.toFixed(2)}`,
        },
        {
            header: t("capitalAssets.column.progress"),
            accessor: "monthsCharged",
            render: (_: any, row: CapitalAsset) => {
                const pct = row.totalMonths > 0 ? Math.round((row.monthsCharged / row.totalMonths) * 100) : 0;
                return (
                    <div style={{ minWidth: 100 }}>
                        <div className="progress" style={{ height: 8 }}>
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <small className="text-muted">{pct}% ({row.monthsCharged}/{row.totalMonths})</small>
                    </div>
                );
            },
        },
        {
            header: t("capitalAssets.column.status"),
            accessor: "status",
            render: (_: any, row: CapitalAsset) => statusBadge(row.status),
        },
        {
            header: t("capitalAssets.column.actions"),
            accessor: "_id",
            render: (_: any, row: CapitalAsset) => (
                <div className="d-flex gap-2">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedAsset(row); toggleModal("detail", true); }}>
                        <i className="ri-eye-line" />
                    </Button>
                    <Button className="farm-secondary-button btn-icon" onClick={() => { setSelectedAsset(row); toggleModal("edit", true); }}>
                        <i className="ri-edit-line" />
                    </Button>
                    <Button
                        className="btn-icon btn-danger"
                        disabled={row.monthsCharged > 0}
                        onClick={() => { setSelectedAsset(row); toggleModal("delete", true); }}
                        title={row.monthsCharged > 0 ? t("capitalAssets.action.deleteBlocked") : undefined}
                    >
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t("capitalAssets.breadcrumb")} pageTitle="Finance" />

                <AlertMessage
                    color={alertConfig.color}
                    message={alertConfig.message}
                    visible={alertConfig.visible}
                    onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
                />

                {/* Summary KPI cards */}
                <Row className="g-3 mb-3">
                    <Col xl={4} md={4} sm={12}>
                        <StatKpiCard
                            title={t("capitalAssets.summary.activeAssets")}
                            value={loadingSummary ? "—" : (summary?.activeAssets ?? 0)}
                            icon={<i className="ri-building-2-line fs-4" />}
                        />
                    </Col>
                    <Col xl={4} md={4} sm={12}>
                        <StatKpiCard
                            title={t("capitalAssets.summary.monthlyBurden")}
                            value={loadingSummary ? 0 : (summary?.totalMonthlyBurden ?? 0)}
                            prefix="$"
                            decimals={2}
                            animateValue
                            icon={<i className="ri-calendar-2-line fs-4" />}
                        />
                    </Col>
                    <Col xl={4} md={4} sm={12}>
                        <StatKpiCard
                            title={t("capitalAssets.summary.totalInvestment")}
                            value={loadingSummary ? 0 : (summary?.totalAcquisitionCost ?? 0)}
                            prefix="$"
                            decimals={2}
                            animateValue
                            icon={<i className="ri-funds-line fs-4" />}
                        />
                    </Col>
                </Row>

                <Card>
                    <CardHeader className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                        {/* Filters */}
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <Input
                                type="select"
                                style={{ width: 160 }}
                                value={filters.status}
                                onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); }}
                            >
                                <option value="">{t("capitalAssets.filter.statusAll")}</option>
                                <option value="active">{t("capitalAssets.status.active")}</option>
                                <option value="amortized">{t("capitalAssets.status.amortized")}</option>
                            </Input>
                            <Input
                                type="select"
                                style={{ width: 200 }}
                                value={filters.category}
                                onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); }}
                            >
                                <option value="">{t("capitalAssets.filter.categoryAll")}</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{t(`capitalAssets.category.${cat}`)}</option>
                                ))}
                            </Input>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2">
                            {canBackfill && (
                                <Button className="farm-secondary-button" onClick={() => toggleModal("backfill", true)}>
                                    <i className="ri-refresh-line me-1" />
                                    {t("capitalAssets.action.runBackfill")}
                                </Button>
                            )}
                            <Button className="farm-primary-button" onClick={() => toggleModal("create", true)}>
                                <i className="ri-add-line me-1" />
                                {t("capitalAssets.action.newAsset")}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        {loading ? (
                            <LoadingAnimation />
                        ) : error ? (
                            <AlertMessage color="danger" message={error} visible={true} onClose={() => {}} />
                        ) : items.length === 0 ? (
                            <div className="text-center text-muted py-4">{t("capitalAssets.noData")}</div>
                        ) : (
                            <CustomTable
                                columns={columns}
                                data={items}
                                rowsPerPage={20}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Detail modal */}
            <CapitalAssetDetailModal
                isOpen={modals.detail}
                onClose={() => { toggleModal("detail", false); setSelectedAsset(null); }}
                assetId={selectedAsset?._id || ""}
                onRefresh={() => { fetchData(); if (farmId) dispatch(fetchCapitalAssetsSummary(farmId)); }}
            />

            {/* Create modal */}
            <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t("capitalAssets.form.createTitle")}</ModalHeader>
                <ModalBody>
                    <CapitalAssetForm
                        onSave={() => {
                            toggleModal("create", false);
                            fetchData();
                            if (farmId) dispatch(fetchCapitalAssetsSummary(farmId));
                        }}
                        onCancel={() => toggleModal("create", false)}
                    />
                </ModalBody>
            </Modal>

            {/* Edit modal */}
            {selectedAsset && (
                <CapitalAssetEditModal
                    isOpen={modals.edit}
                    onClose={() => { toggleModal("edit", false); setSelectedAsset(null); }}
                    onSuccess={() => { fetchData(); if (farmId) dispatch(fetchCapitalAssetsSummary(farmId)); }}
                    asset={selectedAsset}
                />
            )}

            {/* Delete confirm modal */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete", false)} centered>
                <ModalHeader toggle={() => toggleModal("delete", false)}>{t("common.button.delete")}</ModalHeader>
                <ModalBody>
                    <p>{t("capitalAssets.action.deleteConfirm")}</p>
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>
                            {t("common.button.cancel")}
                        </Button>
                        <Button className="btn btn-danger" onClick={handleDelete} disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm" /> : t("common.button.delete")}
                        </Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Backfill confirm modal */}
            <Modal isOpen={modals.backfill} toggle={() => toggleModal("backfill", false)} centered>
                <ModalHeader toggle={() => toggleModal("backfill", false)}>{t("capitalAssets.action.runBackfill")}</ModalHeader>
                <ModalBody>
                    <p>{t("capitalAssets.action.backfillConfirm")}</p>
                    <div className="d-flex justify-content-end gap-2">
                        <Button className="farm-secondary-button" onClick={() => toggleModal("backfill", false)}>
                            {t("common.button.cancel")}
                        </Button>
                        <Button className="farm-primary-button" onClick={handleBackfill} disabled={actionLoading}>
                            {actionLoading ? <Spinner size="sm" /> : t("common.button.confirm")}
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};

export default ViewCapitalAssets;
