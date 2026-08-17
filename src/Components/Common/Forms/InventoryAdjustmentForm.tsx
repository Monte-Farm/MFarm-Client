import { logger } from 'utils/logger';
import { ConfigContext } from 'App';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { getEffectiveUser } from 'helpers/impersonation_helper';
import { INVENTORY_ADJUSTMENT_URLS } from 'helpers/inventory_adjustments_urls';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Col,
    FormFeedback,
    FormGroup,
    Input,
    Label,
    Row,
    Spinner,
} from 'reactstrap';
import * as Yup from 'yup';
import DatePicker from 'react-flatpickr';
import AlertMessage from '../Shared/AlertMesagge';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';
import LoadingAnimation from '../Shared/LoadingAnimation';
import { AdjustmentDirection, AdjustmentType } from 'common/data_interfaces';
import { APIClient } from 'helpers/api_helper';

const api = new APIClient();

interface InventoryAdjustmentFormProps {
    onSave: () => void;
    onCancel: () => void;
}

interface WarehouseOption {
    _id: string;
    code: string;
    name: string;
}

interface InventoryProduct {
    _id: string;
    name: string;
    unit: string;
    stock: number;
}

interface SelectedProduct {
    productId: string;
    adjustedQuantity: number | '';
}

const DECREASE_TYPES: AdjustmentType[] = ['shrinkage', 'breakage', 'expiration', 'count_correction', 'other'];
const INCREASE_TYPES: AdjustmentType[] = ['count_correction', 'other'];

const DIRECTION_META: Record<AdjustmentDirection, { icon: string; color: string; borderColor: string; bg: string }> = {
    decrease: {
        icon: 'ri-arrow-down-circle-fill',
        color: '#dc3545',
        borderColor: '#dc3545',
        bg: '#fff5f5',
    },
    increase: {
        icon: 'ri-arrow-up-circle-fill',
        color: '#198754',
        borderColor: '#198754',
        bg: '#f0fff4',
    },
};

const InventoryAdjustmentForm: React.FC<InventoryAdjustmentFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [insufficientIds, setInsufficientIds] = useState<string[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (m: keyof typeof modals, state?: boolean) =>
        setModals(prev => ({ ...prev, [m]: state ?? !prev[m] }));

    const validationSchema = Yup.object({
        warehouseId: Yup.string().required(t('form.validation.required')),
        date: Yup.date().required(t('form.validation.required')).nullable(),
        direction: Yup.string().required(t('form.validation.required')),
        adjustmentType: Yup.string().required(t('form.validation.required')),
        reason: Yup.string().trim().required(t('form.validation.required')),
    });

    const formik = useFormik({
        initialValues: {
            warehouseId: '',
            date: new Date() as Date | null,
            direction: 'decrease' as AdjustmentDirection,
            adjustmentType: '' as AdjustmentType | '',
            reason: '',
            notes: '',
        },
        validationSchema,
        onSubmit: async values => {
            if (!userLogged || !configContext) return;

            const validLines = selectedProducts.filter(
                l => l.adjustedQuantity !== '' && Number(l.adjustedQuantity) > 0
            );
            if (validLines.length === 0) {
                setAlertConfig({
                    visible: true,
                    color: 'danger',
                    message: t('inventoryAdjustments.form.validation.noProducts'),
                });
                return;
            }

            // Front-end stock validation for decrease
            if (values.direction === 'decrease') {
                const overStock = validLines.filter(l => {
                    const product = inventoryProducts.find(p => p._id === l.productId);
                    return product && Number(l.adjustedQuantity) > product.stock;
                });
                if (overStock.length > 0) {
                    setInsufficientIds(overStock.map(l => l.productId));
                    setAlertConfig({
                        visible: true,
                        color: 'danger',
                        message: t('inventoryAdjustments.form.validation.insufficientStock'),
                    });
                    return;
                }
            }

            const payload = {
                farmId: userLogged.farm_assigned,
                warehouseId: values.warehouseId,
                date: values.date
                    ? new Date(values.date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                direction: values.direction,
                adjustmentType: values.adjustmentType as AdjustmentType,
                reason: values.reason.trim(),
                products: validLines.map(l => ({
                    productId: l.productId,
                    adjustedQuantity: Number(l.adjustedQuantity),
                })),
                notes: values.notes.trim() || undefined,
            };

            try {
                await api.create(
                    `${configContext.apiUrl}${INVENTORY_ADJUSTMENT_URLS.create}`,
                    payload
                );
                toggleModal('success', true);
            } catch (err: any) {
                logger.error('Error creating inventory adjustment:', err);
                const missing: any[] = err?.response?.data?.missing || [];
                if (missing.length > 0) {
                    setInsufficientIds(missing.map((m: any) => m.productId));
                }
                const msg = err?.response?.data?.message || t('inventoryAdjustments.form.error');
                setAlertConfig({ visible: true, color: 'danger', message: msg });
                toggleModal('error', true);
            }
        },
    });

    const fetchWarehouses = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [mainRes, subsRes] = await Promise.all([
                configContext.axiosHelper.get(
                    `${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`
                ),
                configContext.axiosHelper
                    .get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`)
                    .then((r: any) => r.data.data || [])
                    .catch(() => []),
            ]);
            const mainId: string = mainRes.data.data;
            setWarehouses([
                { _id: mainId, code: '', name: t('inventoryAdjustments.form.field.generalWarehouse') },
                ...subsRes,
            ]);
        } catch (error) {
            logger.error('Error fetching warehouses:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async (warehouseId: string) => {
        if (!configContext || !warehouseId) return;
        try {
            setLoadingProducts(true);
            setInventoryProducts([]);
            setSelectedProducts([]);
            setProductSearch('');
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`
            );
            const inventory: any[] = res.data.data || [];
            setInventoryProducts(
                inventory
                    .filter((item: any) => item.product)
                    .map((item: any) => ({
                        _id: item.product._id || item.product.id,
                        name: item.product.name,
                        unit: item.product.unit_measurement || item.product.unit || '',
                        stock: item.quantity ?? 0,
                    }))
            );
        } catch (error) {
            logger.error('Error fetching inventory:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => { fetchWarehouses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWarehouseChange = (warehouseId: string) => {
        formik.setFieldValue('warehouseId', warehouseId);
        if (warehouseId) fetchInventory(warehouseId);
        else { setInventoryProducts([]); setSelectedProducts([]); }
    };

    const handleDirectionChange = (direction: AdjustmentDirection) => {
        formik.setFieldValue('direction', direction);
        formik.setFieldValue('adjustmentType', '');
        setInsufficientIds([]);
    };

    const toggleProduct = (productId: string) => {
        setInsufficientIds(prev => prev.filter(id => id !== productId));
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.productId === productId);
            if (exists) return prev.filter(p => p.productId !== productId);
            return [...prev, { productId, adjustedQuantity: '' }];
        });
    };

    const updateQuantity = (productId: string, value: string) => {
        setInsufficientIds(prev => prev.filter(id => id !== productId));
        setSelectedProducts(prev =>
            prev.map(p =>
                p.productId === productId
                    ? { ...p, adjustedQuantity: value === '' ? '' : parseFloat(value) || '' }
                    : p
            )
        );
    };

    const availableTypes = formik.values.direction === 'decrease' ? DECREASE_TYPES : INCREASE_TYPES;

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        return q
            ? inventoryProducts.filter(p => p.name.toLowerCase().includes(q))
            : inventoryProducts;
    }, [inventoryProducts, productSearch]);

    const selectedIds = new Set(selectedProducts.map(p => p.productId));

    const hasErrors = selectedProducts.some(sp => {
        const product = inventoryProducts.find(p => p._id === sp.productId);
        if (!product) return false;
        const qty = Number(sp.adjustedQuantity);
        return insufficientIds.includes(sp.productId) ||
            (formik.values.direction === 'decrease' && qty > product.stock);
    });

    if (loading) return <LoadingAnimation />;

    return (
        <>
            <form onSubmit={formik.handleSubmit}>
                <AlertMessage
                    visible={alertConfig.visible}
                    color={alertConfig.color}
                    message={alertConfig.message}
                    onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                />

                {/* ── Fila 1: Almacén + Fecha ── */}
                <Row className="mb-3">
                    <Col md={7}>
                        <FormGroup className="mb-0">
                            <Label className="fw-semibold">{t('inventoryAdjustments.form.field.warehouse')} *</Label>
                            <Input
                                type="select"
                                value={formik.values.warehouseId}
                                onChange={e => handleWarehouseChange(e.target.value)}
                                onBlur={() => formik.setFieldTouched('warehouseId')}
                                invalid={!!(formik.touched.warehouseId && formik.errors.warehouseId)}
                            >
                                <option value="">{t('inventoryAdjustments.form.field.warehouseSelect')}</option>
                                {warehouses.map(w => (
                                    <option key={w._id} value={w._id}>
                                        {w.code ? `[${w.code}] ` : ''}{w.name}
                                    </option>
                                ))}
                            </Input>
                            <FormFeedback>{formik.errors.warehouseId}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={5}>
                        <FormGroup className="mb-0">
                            <Label className="fw-semibold">{t('inventoryAdjustments.form.field.date')} *</Label>
                            <DatePicker
                                className={`form-control${formik.touched.date && formik.errors.date ? ' is-invalid' : ''}`}
                                value={formik.values.date ? formik.values.date.toString() : ''}
                                options={{ dateFormat: 'Y-m-d', maxDate: 'today' }}
                                onChange={([date]: Date[]) => formik.setFieldValue('date', date)}
                            />
                            {formik.touched.date && formik.errors.date && (
                                <div className="invalid-feedback d-block">{formik.errors.date as string}</div>
                            )}
                        </FormGroup>
                    </Col>
                </Row>

                {/* ── Dirección: cards visuales ── */}
                <div className="mb-3">
                    <Label className="fw-semibold d-block mb-2">{t('inventoryAdjustments.form.field.direction')} *</Label>
                    <Row className="g-2">
                        {(['decrease', 'increase'] as AdjustmentDirection[]).map(dir => {
                            const meta = DIRECTION_META[dir];
                            const isSelected = formik.values.direction === dir;
                            return (
                                <Col xs={6} key={dir}>
                                    <div
                                        onClick={() => handleDirectionChange(dir)}
                                        style={{
                                            cursor: 'pointer',
                                            border: `2px solid ${isSelected ? meta.borderColor : '#dee2e6'}`,
                                            borderRadius: '10px',
                                            padding: '14px 16px',
                                            background: isSelected ? meta.bg : '#fff',
                                            transition: 'all 0.15s ease',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <i
                                                className={`${meta.icon} fs-3`}
                                                style={{ color: meta.color }}
                                            />
                                            <div>
                                                <div className="fw-semibold" style={{ color: meta.color }}>
                                                    {t(`inventoryAdjustments.direction.${dir}`)}
                                                </div>
                                                <div className="text-muted small">
                                                    {t(`inventoryAdjustments.direction.${dir}Hint`)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </div>

                {/* ── Tipo de ajuste: chips ── */}
                <div className="mb-3">
                    <Label className="fw-semibold d-block mb-2">{t('inventoryAdjustments.form.field.adjustmentType')} *</Label>
                    <div className="d-flex flex-wrap gap-2">
                        {availableTypes.map(type => {
                            const isSelected = formik.values.adjustmentType === type;
                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => formik.setFieldValue('adjustmentType', type)}
                                    style={{
                                        border: `1.5px solid ${isSelected ? '#4a9b6f' : '#ced4da'}`,
                                        borderRadius: '20px',
                                        padding: '5px 14px',
                                        background: isSelected ? '#4a9b6f' : '#fff',
                                        color: isSelected ? '#fff' : '#495057',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontWeight: isSelected ? 600 : 400,
                                    }}
                                >
                                    {t(`inventoryAdjustments.adjustmentType.${type}`)}
                                </button>
                            );
                        })}
                    </div>
                    {formik.touched.adjustmentType && formik.errors.adjustmentType && (
                        <div className="text-danger small mt-1">{formik.errors.adjustmentType}</div>
                    )}
                </div>

                {/* ── Motivo ── */}
                <FormGroup className="mb-3">
                    <Label className="fw-semibold">{t('inventoryAdjustments.form.field.reason')} *</Label>
                    <Input
                        type="textarea"
                        name="reason"
                        rows={2}
                        value={formik.values.reason}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={!!(formik.touched.reason && formik.errors.reason)}
                        placeholder={t('inventoryAdjustments.form.field.reasonPlaceholder')}
                    />
                    <FormFeedback>{formik.errors.reason}</FormFeedback>
                </FormGroup>

                {/* ── Sección de productos ── */}
                <div className="mb-3">
                    <Label className="fw-semibold d-block mb-2">
                        {t('inventoryAdjustments.form.products.title')} *
                        {selectedIds.size > 0 && (
                            <span className="ms-2 badge bg-success">{selectedIds.size} {t('inventoryAdjustments.form.products.selected')}</span>
                        )}
                    </Label>

                    {!formik.values.warehouseId ? (
                        <div className="text-center text-muted py-3 border rounded" style={{ background: '#f8f9fa' }}>
                            <i className="ri-store-2-line fs-4 d-block mb-1" />
                            <span className="small">{t('inventoryAdjustments.form.products.selectWarehouseFirst')}</span>
                        </div>
                    ) : loadingProducts ? (
                        <div className="text-center py-4">
                            <Spinner size="sm" className="me-2" />
                            <span className="small text-muted">{t('common.status.loading')}</span>
                        </div>
                    ) : inventoryProducts.length === 0 ? (
                        <div className="text-center text-muted py-3 border rounded" style={{ background: '#f8f9fa' }}>
                            <span className="small">{t('inventoryAdjustments.form.products.noInventory')}</span>
                        </div>
                    ) : (
                        <>
                            {/* Buscador */}
                            <div className="mb-2 position-relative">
                                <i className="ri-search-line position-absolute text-muted" style={{ top: '9px', left: '10px', fontSize: '14px' }} />
                                <Input
                                    bsSize="sm"
                                    placeholder={t('inventoryAdjustments.form.products.search')}
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    style={{ paddingLeft: '30px' }}
                                />
                            </div>

                            {/* Lista de productos */}
                            <div
                                style={{
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                }}
                            >
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center text-muted py-3 small">
                                        {t('inventoryAdjustments.form.products.noResults')}
                                    </div>
                                ) : (
                                    filteredProducts.map((product, idx) => {
                                        const isSelected = selectedIds.has(product._id);
                                        const sel = selectedProducts.find(s => s.productId === product._id);
                                        const qty = sel ? Number(sel.adjustedQuantity) : 0;
                                        const isInsufficient = insufficientIds.includes(product._id);
                                        const isOver =
                                            formik.values.direction === 'decrease' &&
                                            qty > 0 &&
                                            qty > product.stock;
                                        const hasError = isInsufficient || isOver;
                                        const remaining = isSelected && qty > 0
                                            ? formik.values.direction === 'decrease'
                                                ? product.stock - qty
                                                : product.stock + qty
                                            : null;

                                        return (
                                            <div
                                                key={product._id}
                                                style={{
                                                    borderBottom: idx < filteredProducts.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                    background: isSelected
                                                        ? (hasError ? '#fff5f5' : '#f0fff4')
                                                        : '#fff',
                                                    transition: 'background 0.15s ease',
                                                }}
                                            >
                                                <div className="d-flex align-items-center px-3 py-2 gap-2">
                                                    {/* Toggle checkbox */}
                                                    <div
                                                        onClick={() => toggleProduct(product._id)}
                                                        style={{ cursor: 'pointer', flexShrink: 0 }}
                                                    >
                                                        <i
                                                            className={isSelected
                                                                ? 'ri-checkbox-circle-fill text-success fs-5'
                                                                : 'ri-checkbox-blank-circle-line text-muted fs-5'
                                                            }
                                                        />
                                                    </div>

                                                    {/* Nombre y stock */}
                                                    <div
                                                        className="flex-grow-1"
                                                        onClick={() => toggleProduct(product._id)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="fw-semibold small">{product.name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                                            {t('inventoryAdjustments.form.products.col.stock')}: {product.stock} {product.unit}
                                                        </div>
                                                    </div>

                                                    {/* Cantidad + stock resultante */}
                                                    {isSelected && (
                                                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                                            <div>
                                                                <Input
                                                                    type="number"
                                                                    bsSize="sm"
                                                                    min={0}
                                                                    step="any"
                                                                    value={sel?.adjustedQuantity ?? ''}
                                                                    onChange={e => updateQuantity(product._id, e.target.value)}
                                                                    onClick={e => e.stopPropagation()}
                                                                    invalid={hasError}
                                                                    style={{ width: '90px' }}
                                                                    placeholder="0"
                                                                />
                                                                {hasError && (
                                                                    <div className="text-danger" style={{ fontSize: '0.72rem' }}>
                                                                        {t('inventoryAdjustments.form.products.insufficientStock')}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {remaining !== null && !hasError && (
                                                                <div
                                                                    className="text-center"
                                                                    style={{ minWidth: '70px', fontSize: '0.78rem' }}
                                                                >
                                                                    <div className="text-muted">{t('inventoryAdjustments.form.products.col.estimatedStock')}</div>
                                                                    <div className={`fw-semibold ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
                                                                        {remaining.toFixed(2)} {product.unit}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Notas ── */}
                <FormGroup className="mb-4">
                    <Label className="text-muted small">{t('inventoryAdjustments.form.field.notes')}</Label>
                    <Input
                        type="textarea"
                        name="notes"
                        rows={2}
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        placeholder={t('inventoryAdjustments.form.field.notesPlaceholder')}
                    />
                </FormGroup>

                {/* ── Botones ── */}
                <div className="d-flex justify-content-end gap-2">
                    <Button type="button" color="light" onClick={onCancel}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        className="farm-primary-button"
                        disabled={formik.isSubmitting || hasErrors}
                    >
                        {formik.isSubmitting ? (
                            <><Spinner size="sm" className="me-1" />{t('common.button.saving')}</>
                        ) : (
                            t('inventoryAdjustments.form.submit')
                        )}
                    </Button>
                </div>
            </form>

            <SuccessModal
                isOpen={modals.success}
                message={t('inventoryAdjustments.form.success')}
                onClose={() => { toggleModal('success', false); onSave(); }}
            />
            <ErrorModal
                isOpen={modals.error}
                message={alertConfig.message}
                onClose={() => toggleModal('error', false)}
            />
        </>
    );
};

export default InventoryAdjustmentForm;
