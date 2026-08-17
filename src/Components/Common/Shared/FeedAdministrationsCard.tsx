import { Card, CardBody, CardHeader, Button, Modal, ModalBody, ModalHeader, Input, Label, Badge } from "reactstrap";
import { FiAlertCircle } from "react-icons/fi";
import { useState, useContext } from "react";
import { FeedAdministrationHistoryEntry } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import FeedAdministrationForm from "../Forms/FeedAdministrationForm";
import EditFeedAdministrationForm from "../Forms/EditFeedAdministrationForm";
import CustomTable from "../Tables/CustomTable";
import { useTranslation } from "react-i18next";
import { ConfigContext } from "App";
import { FEED_ADMINISTRATION_URLS } from "helpers/feeding_urls";
import { getEffectiveUser } from "helpers/impersonation_helper";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import { HttpStatusCode } from "axios";
import { logger } from "utils/logger";

type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface Props {
    administrations: FeedAdministrationHistoryEntry[];
    targetType: 'group' | 'litter' | 'pig';
    targetId: string;
    targetStage?: Stage;
    defaultWeightUnit?: 'kg' | 'lb';
    onAdministered: () => void;
    disabled?: boolean;
}

const FeedAdministrationsCard = ({
    administrations,
    targetType,
    targetId,
    targetStage,
    defaultWeightUnit = 'kg',
    onAdministered,
    disabled = false,
}: Props) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [editModal, setEditModal] = useState<{ open: boolean; administrationId: string | null }>({
        open: false,
        administrationId: null,
    });
    const [revertModal, setRevertModal] = useState<{
        open: boolean;
        entry: FeedAdministrationHistoryEntry | null;
        reason: string;
        loading: boolean;
    }>({ open: false, entry: null, reason: '', loading: false });
    const [resultModals, setResultModals] = useState({ success: false, error: false, errorMsg: '' });

    const hasData = administrations && administrations.length > 0;

    const sorted = hasData
        ? [...administrations].sort(
            (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        )
        : [];

    const openRevert = (entry: FeedAdministrationHistoryEntry) =>
        setRevertModal({ open: true, entry, reason: '', loading: false });

    const closeRevert = () =>
        setRevertModal({ open: false, entry: null, reason: '', loading: false });

    const handleRevert = async () => {
        if (!configContext || !revertModal.entry?.administrationId) return;
        setRevertModal(prev => ({ ...prev, loading: true }));
        try {
            const url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.revert(revertModal.entry.administrationId)}`;
            const response = await configContext.axiosHelper.update(url, {
                revertedBy: userLogged._id,
                revertReason: revertModal.reason || undefined,
            });
            if (response.status === HttpStatusCode.Ok) {
                closeRevert();
                setResultModals({ success: true, error: false, errorMsg: '' });
            }
        } catch (error: any) {
            logger.error('Error reverting administration:', error);
            const msg = error?.response?.data?.message || t('feeding.administration.revert.error');
            closeRevert();
            setResultModals({ success: false, error: true, errorMsg: msg });
        }
    };

    const columns: Column<FeedAdministrationHistoryEntry>[] = [
        {
            header: t('feeding.administration.column.status'),
            accessor: 'isReverted',
            type: 'text',
            render: (_, row) => (
                row.isReverted
                    ? <Badge color="secondary">{t('feeding.administration.status.reverted')}</Badge>
                    : <Badge color="success">{t('feeding.administration.status.active')}</Badge>
            ),
        },
        {
            header: t('feeding.administration.column.date'),
            accessor: 'applicationDate',
            type: 'text',
            render: (_, row) => (
                <span className={row.isReverted ? 'text-decoration-line-through text-muted' : ''}>
                    {new Date(row.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.preparedFeed'),
            accessor: 'preparedProduct',
            type: 'text',
            render: (_, row) => (
                <span className={`fw-semibold${row.isReverted ? ' text-muted' : ''}`}>
                    {row.preparedProduct?.name ?? "—"}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.sourceRecipe'),
            accessor: 'recipe',
            type: 'text',
            render: (_, row) => (
                <span className={row.isReverted ? 'text-muted' : ''}>
                    {row.recipe
                        ? `${row.recipe.code} — ${row.recipe.name}${row.recipe.stage ? ` (${t(`feeding.stage.${row.recipe.stage}`, { defaultValue: row.recipe.stage })})` : ""}`
                        : "—"}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.quantity'),
            accessor: 'quantity',
            type: 'currency',
            bgColor: '#e3f2fd',
            render: (_, row) => (
                <span className={`fw-semibold${row.isReverted ? ' text-muted' : ''}`}>
                    {row.quantity.toFixed(2)} {row.preparedProduct?.unit_measurement || defaultWeightUnit}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.responsible'),
            accessor: 'appliedBy',
            type: 'text',
            render: (_, row) => (
                <span className={row.isReverted ? 'text-muted' : ''}>
                    {row.appliedBy ? `${row.appliedBy.name} ${row.appliedBy.lastname}` : "—"}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.observations'),
            accessor: 'observations',
            type: 'text',
            render: (_, row) => (
                <span className={row.isReverted ? 'text-muted' : ''}>
                    {row.observations?.trim() || "—"}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.actions'),
            accessor: '_id',
            type: 'action',
            render: (_, row) => (
                <div className="d-flex gap-1">
                    <Button
                        size="sm"
                        color="primary"
                        outline
                        disabled={disabled || !!row.isReverted}
                        title={t('feeding.administration.card.editModal')}
                        onClick={() => setEditModal({ open: true, administrationId: row.administrationId })}
                    >
                        <i className="ri-edit-line" />
                    </Button>
                    <Button
                        size="sm"
                        color="danger"
                        outline
                        disabled={disabled || !!row.isReverted}
                        title={t('feeding.administration.revert.title')}
                        onClick={() => openRevert(row)}
                    >
                        <i className="ri-arrow-go-back-line" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Card className="w-100 h-100 m-0">
                <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                    <h5 className="mb-0 fw-semibold">{t('feeding.administration.card.title')}</h5>
                    <Button size="sm" color="primary" onClick={() => setIsRegisterOpen(true)} disabled={disabled}>
                        <i className="ri-add-line me-1" />
                        {t('feeding.administration.card.button')}
                    </Button>
                </CardHeader>
                <CardBody
                    className={!hasData ? "d-flex justify-content-center align-items-center" : ""}
                    style={{ overflowY: "auto" }}
                >
                    {!hasData ? (
                        <div className="text-center">
                            <FiAlertCircle className="text-muted" size={22} />
                            <span className="fs-5 text-muted text-center rounded-5 ms-2">
                                {t('feeding.administration.card.noRecords')}
                            </span>
                        </div>
                    ) : (
                        <CustomTable
                            columns={columns}
                            data={sorted}
                            showSearchAndFilter={false}
                            showPagination={sorted.length > 10}
                            rowsPerPage={10}
                            fontSize={14}
                        />
                    )}
                </CardBody>
            </Card>

            {/* Modal: Registrar nueva administración */}
            <Modal
                size="xl"
                isOpen={isRegisterOpen}
                toggle={() => setIsRegisterOpen(false)}
                backdrop="static"
                keyboard={false}
                centered
            >
                <ModalHeader toggle={() => setIsRegisterOpen(false)}>
                    {t('feeding.administration.card.registerModal')}
                </ModalHeader>
                <ModalBody>
                    <FeedAdministrationForm
                        targetType={targetType}
                        targetId={targetId}
                        targetStage={targetStage}
                        defaultWeightUnit={defaultWeightUnit}
                        isBulk={false}
                        onSave={() => {
                            setIsRegisterOpen(false);
                            onAdministered();
                        }}
                        onCancel={() => setIsRegisterOpen(false)}
                    />
                </ModalBody>
            </Modal>

            {/* Modal: Editar administración */}
            <Modal
                size="xl"
                isOpen={editModal.open}
                toggle={() => setEditModal({ open: false, administrationId: null })}
                backdrop="static"
                keyboard={false}
                centered
            >
                <ModalHeader toggle={() => setEditModal({ open: false, administrationId: null })}>
                    {t('feeding.administration.card.editModal')}
                </ModalHeader>
                <ModalBody>
                    {editModal.administrationId && (
                        <EditFeedAdministrationForm
                            administrationId={editModal.administrationId}
                            onSave={() => {
                                setEditModal({ open: false, administrationId: null });
                                onAdministered();
                            }}
                            onCancel={() => setEditModal({ open: false, administrationId: null })}
                        />
                    )}
                </ModalBody>
            </Modal>

            {/* Modal: Revertir administración */}
            <Modal isOpen={revertModal.open} toggle={closeRevert} centered>
                <ModalHeader toggle={closeRevert}>
                    {t('feeding.administration.revert.title')}
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted mb-3">{t('feeding.administration.revert.message')}</p>
                    <div>
                        <Label className="form-label">{t('feeding.administration.revert.reasonLabel')}</Label>
                        <Input
                            type="textarea"
                            rows={2}
                            value={revertModal.reason}
                            onChange={e => setRevertModal(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder={t('feeding.administration.revert.reasonPlaceholder')}
                        />
                    </div>
                </ModalBody>
                <div className="modal-footer">
                    <Button color="light" onClick={closeRevert} disabled={revertModal.loading}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button color="danger" onClick={handleRevert} disabled={revertModal.loading}>
                        {revertModal.loading
                            ? <><i className="ri-loader-4-line me-1" />{t('common.status.loading')}</>
                            : <><i className="ri-arrow-go-back-line me-1" />{t('feeding.administration.revert.confirm')}</>
                        }
                    </Button>
                </div>
            </Modal>

            {/* Modales de resultado de reversión */}
            <SuccessModal
                isOpen={resultModals.success}
                onClose={() => { setResultModals(p => ({ ...p, success: false })); onAdministered(); }}
                message={t('feeding.administration.revert.success')}
            />
            <ErrorModal
                isOpen={resultModals.error}
                onClose={() => setResultModals(p => ({ ...p, error: false, errorMsg: '' }))}
                message={resultModals.errorMsg || t('feeding.administration.revert.error')}
            />
        </>
    );
};

export default FeedAdministrationsCard;
