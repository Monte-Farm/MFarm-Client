import { logger } from 'utils/logger';
import { ConfigContext } from 'App';
import BreadCrumb from 'Components/Common/Shared/BreadCrumb';
import LoadingAnimation from 'Components/Common/Shared/LoadingAnimation';
import CustomTable from 'Components/Common/Tables/CustomTable';
import InventoryAdjustmentForm from 'Components/Common/Forms/InventoryAdjustmentForm';
import InventoryAdjustmentDetail from 'Components/Common/Details/InventoryAdjustmentDetail';
import { getEffectiveUser } from 'helpers/impersonation_helper';
import { INVENTORY_ADJUSTMENT_URLS } from 'helpers/inventory_adjustments_urls';
import { useContext, useEffect, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Spinner,
} from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { AdjustmentDirection, AdjustmentStatus, InventoryAdjustment } from 'common/data_interfaces';
import { Column } from 'common/data/data_types';
import { APIClient } from 'helpers/api_helper';
import AlertMessage from 'Components/Common/Shared/AlertMesagge';

const api = new APIClient();

const directionBadgeColor: Record<AdjustmentDirection, string> = {
    decrease: 'danger',
    increase: 'success',
};

const statusStyle: Record<AdjustmentStatus, { color: string; textDecoration?: string }> = {
    active: { color: 'success' },
    reverted: { color: 'secondary' },
};

const ViewInventoryAdjustments = () => {
    const { t } = useTranslation();
    document.title = `${t('inventoryAdjustments.pageTitle')} | ${t('systemName')}`;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();

    const [loading, setLoading] = useState(true);
    const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [filterWarehouseId, setFilterWarehouseId] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ create: false, revert: false, detail: false });
    const [selectedAdjustment, setSelectedAdjustment] = useState<InventoryAdjustment | null>(null);
    const [revertReason, setRevertReason] = useState('');
    const [reverting, setReverting] = useState(false);
    const [revertError, setRevertError] = useState('');

    const toggleModal = (m: keyof typeof modals, state?: boolean) => {
        setModals(prev => ({ ...prev, [m]: state ?? !prev[m] }));
    };

    const fetchWarehouses = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [mainRes, subsRes] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`
                ),
                configContext.axiosHelper
                    .get(
                        `${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`
                    )
                    .then((r: any) => r.data.data || [])
                    .catch(() => []),
            ]);
            const mainId: string = mainRes.data.data;
            const generalOption = {
                _id: mainId,
                code: '',
                name: t('inventoryAdjustments.form.field.generalWarehouse'),
            };
            setWarehouses([generalOption, ...subsRes]);
        } catch (error) {
            logger.error('Error fetching warehouses:', error);
        }
    };

    const fetchAdjustments = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const params: Record<string, string> = { farmId: userLogged.farm_assigned };
            if (filterWarehouseId) params.warehouseId = filterWarehouseId;
            if (filterStartDate) params.startDate = filterStartDate;
            if (filterEndDate) params.endDate = filterEndDate;

            const res = await api.get(
                `${configContext.apiUrl}${INVENTORY_ADJUSTMENT_URLS.list}`,
                params
            );
            setAdjustments(res.data.data || res.data || []);
        } catch (error) {
            logger.error('Error fetching adjustments:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchAdjustments();
    }, [filterWarehouseId, filterStartDate, filterEndDate]);

    const handleRevert = async () => {
        if (!selectedAdjustment || !revertReason.trim() || !configContext) return;
        try {
            setReverting(true);
            setRevertError('');
            const res = await api.update(
                `${configContext.apiUrl}${INVENTORY_ADJUSTMENT_URLS.revert(selectedAdjustment._id)}`,
                { revertReason }
            );
            const updated: InventoryAdjustment = res.data.data || res.data;
            setAdjustments(prev =>
                prev.map(a => (a._id === updated._id ? { ...a, ...updated } : a))
            );
            toggleModal('revert', false);
            setRevertReason('');
            setSelectedAdjustment(null);
        } catch (err: any) {
            logger.error('Error reverting adjustment:', err);
            const msg =
                err?.response?.data?.message || t('inventoryAdjustments.revert.error');
            setRevertError(msg);
        } finally {
            setReverting(false);
        }
    };

    const getWarehouseName = (warehouseId: any): string => {
        if (typeof warehouseId === 'object' && warehouseId !== null) {
            return warehouseId.name || '—';
        }
        const found = warehouses.find(w => w._id === warehouseId);
        return found ? found.name : warehouseId || '—';
    };

    const getProductName = (productId: any): string => {
        if (typeof productId === 'object' && productId !== null) {
            return productId.name || '—';
        }
        return productId || '—';
    };

    const formatFinancialImpact = (amount: number): string => {
        const sign = amount < 0 ? '-' : '+';
        return `${sign}${Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const columns: Column<InventoryAdjustment>[] = [
        {
            header: t('inventoryAdjustments.table.col.date'),
            accessor: 'date',
            type: 'date',
            render: (value: string) =>
                new Date(value).toLocaleDateString('es-ES'),
        },
        {
            header: t('inventoryAdjustments.table.col.warehouse'),
            accessor: 'warehouseId',
            type: 'text',
            render: (_: any, row: InventoryAdjustment) => getWarehouseName(row.warehouseId),
        },
        {
            header: t('inventoryAdjustments.table.col.direction'),
            accessor: 'direction',
            type: 'text',
            render: (value: AdjustmentDirection | undefined, row: InventoryAdjustment) => {
                if (value) {
                    return (
                        <Badge color={directionBadgeColor[value]}>
                            {t(`inventoryAdjustments.direction.${value}`)}
                        </Badge>
                    );
                }
                const decreaseCount = row.products.filter(p => p.adjustedQuantity < 0).length;
                const increaseCount = row.products.filter(p => p.adjustedQuantity > 0).length;
                return (
                    <span className="small">
                        {decreaseCount > 0 && (
                            <span className="text-danger me-1">↓{decreaseCount}</span>
                        )}
                        {increaseCount > 0 && (
                            <span className="text-success">↑{increaseCount}</span>
                        )}
                    </span>
                );
            },
        },
        {
            header: t('inventoryAdjustments.table.col.adjustmentType'),
            accessor: 'adjustmentType',
            type: 'text',
            render: (value: string) => t(`inventoryAdjustments.adjustmentType.${value}`),
        },
        {
            header: t('inventoryAdjustments.table.col.products'),
            accessor: 'products',
            type: 'text',
            render: (_: any, row: InventoryAdjustment) => (
                <span className="small">
                    {row.products
                        .map(p => getProductName(p.productId))
                        .join(', ')}
                </span>
            ),
        },
        {
            header: t('inventoryAdjustments.table.col.financialImpact'),
            accessor: 'totalFinancialImpact',
            type: 'text',
            render: (value: number) => (
                <span
                    className={`fw-semibold ${value < 0 ? 'text-danger' : 'text-success'}`}
                >
                    {formatFinancialImpact(value)}
                </span>
            ),
        },
        {
            header: t('inventoryAdjustments.table.col.status'),
            accessor: 'status',
            type: 'text',
            render: (value: AdjustmentStatus) => (
                <Badge color={statusStyle[value]?.color || 'secondary'}>
                    {t(`inventoryAdjustments.status.${value}`)}
                </Badge>
            ),
        },
        {
            header: t('inventoryAdjustments.table.col.actions'),
            accessor: '_id' as any,
            type: 'action',
            render: (_: any, row: InventoryAdjustment) => (
                <div className="d-flex gap-1">
                    <Button
                        className="farm-primary-button btn-icon"
                        size="sm"
                        onClick={() => {
                            setSelectedAdjustment(row);
                            toggleModal('detail', true);
                        }}
                    >
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                    {row.status === 'active' && (
                        <Button
                            color="warning"
                            size="sm"
                            className="btn-icon"
                            onClick={() => {
                                setSelectedAdjustment(row);
                                setRevertReason('');
                                setRevertError('');
                                toggleModal('revert', true);
                            }}
                        >
                            <i className="ri-arrow-go-back-line align-middle" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb
                    title={t('inventoryAdjustments.breadcrumb')}
                    pageTitle={t('menu.warehouse')}
                />

                {/* Filtros */}
                <Card className="mb-3">
                    <CardBody>
                        <Row className="align-items-end g-2">
                            <Col md={4}>
                                <Label className="mb-1 small">{t('inventoryAdjustments.filter.warehouse')}</Label>
                                <Input
                                    type="select"
                                    value={filterWarehouseId}
                                    onChange={e => setFilterWarehouseId(e.target.value)}
                                >
                                    <option value="">{t('inventoryAdjustments.filter.allWarehouses')}</option>
                                    {warehouses.map(w => (
                                        <option key={w._id} value={w._id}>
                                            {w.code ? `[${w.code}] ` : ''}{w.name}
                                        </option>
                                    ))}
                                </Input>
                            </Col>
                            <Col md={3}>
                                <Label className="mb-1 small">{t('inventoryAdjustments.filter.startDate')}</Label>
                                <Input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={e => setFilterStartDate(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Label className="mb-1 small">{t('inventoryAdjustments.filter.endDate')}</Label>
                                <Input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={e => setFilterEndDate(e.target.value)}
                                />
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="light"
                                    className="w-100"
                                    onClick={() => {
                                        setFilterWarehouseId('');
                                        setFilterStartDate('');
                                        setFilterEndDate('');
                                    }}
                                >
                                    {t('common.button.clearFilters')}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="d-flex justify-content-end">
                            <Button
                                className="farm-primary-button"
                                onClick={() => toggleModal('create', true)}
                            >
                                <i className="ri-add-line me-2" />
                                {t('inventoryAdjustments.action.create')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <AlertMessage
                            visible={alertConfig.visible}
                            color={alertConfig.color}
                            message={alertConfig.message}
                            onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                        />
                        {loading ? (
                            <div className="text-center py-4">
                                <Spinner />
                            </div>
                        ) : adjustments.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <span>{t('inventoryAdjustments.noRecords')}</span>
                            </div>
                        ) : (
                            <CustomTable
                                columns={columns}
                                data={adjustments}
                                showPagination
                                rowsPerPage={15}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal crear ajuste */}
            <Modal
                size="xl"
                isOpen={modals.create}
                toggle={() => toggleModal('create')}
                backdrop="static"
                keyboard={false}
            >
                <ModalHeader toggle={() => toggleModal('create')}>
                    {t('inventoryAdjustments.modal.createTitle')}
                </ModalHeader>
                <ModalBody>
                    <InventoryAdjustmentForm
                        onSave={() => {
                            toggleModal('create', false);
                            fetchAdjustments();
                        }}
                        onCancel={() => toggleModal('create', false)}
                    />
                </ModalBody>
            </Modal>

            {/* Modal revertir */}
            <Modal
                isOpen={modals.revert}
                toggle={() => toggleModal('revert')}
                backdrop="static"
                keyboard={false}
            >
                <ModalHeader toggle={() => toggleModal('revert')}>
                    {t('inventoryAdjustments.modal.revertTitle')}
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted small mb-3">
                        {t('inventoryAdjustments.revert.consequence')}
                    </p>

                    {revertError && (
                        <div className="alert alert-danger small">{revertError}</div>
                    )}

                    <FormGroup>
                        <Label>{t('inventoryAdjustments.revert.reasonLabel')} *</Label>
                        <Input
                            type="textarea"
                            rows={3}
                            value={revertReason}
                            onChange={e => setRevertReason(e.target.value)}
                            placeholder={t('inventoryAdjustments.revert.reasonPlaceholder')}
                        />
                    </FormGroup>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button
                            color="light"
                            onClick={() => {
                                toggleModal('revert', false);
                                setRevertReason('');
                                setRevertError('');
                            }}
                        >
                            {t('common.button.cancel')}
                        </Button>
                        <Button
                            color="warning"
                            onClick={handleRevert}
                            disabled={!revertReason.trim() || reverting}
                        >
                            {reverting ? (
                                <>
                                    <Spinner size="sm" className="me-1" />
                                    {t('common.button.saving')}
                                </>
                            ) : (
                                t('inventoryAdjustments.action.confirmRevert')
                            )}
                        </Button>
                    </div>
                </ModalBody>
            </Modal>

            {/* Modal detalles */}
            <InventoryAdjustmentDetail
                isOpen={modals.detail}
                onClose={() => toggleModal('detail', false)}
                adjustment={selectedAdjustment}
            />
        </div>
    );
};

export default ViewInventoryAdjustments;
