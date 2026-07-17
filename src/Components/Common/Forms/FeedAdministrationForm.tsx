import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { useFormik } from "formik";
import { Trans, useTranslation } from "react-i18next";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEED_ADMINISTRATION_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useMemo, useState } from "react";
import { Button, FormFeedback, Input, Label, Spinner } from "reactstrap";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { HttpStatusCode } from "axios";

const FEED_PRODUCT_CATEGORIES = ['nutrition', 'prepared_feed'];

type TargetType = 'group' | 'litter' | 'pig';
type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface FeedAdministrationFormProps {
    targetType: TargetType;
    targetId?: string;            // requerido si NO es bulk
    bulkTargets?: string[];       // requerido si bulk
    isBulk?: boolean;
    targetStage?: Stage;          // etapa del target (para filtrar preparados); litter siempre 'piglet'
    onSave: () => void;
    onCancel: () => void;
}

const FeedAdministrationForm: React.FC<FeedAdministrationFormProps> = ({
    targetType,
    targetId,
    bulkTargets = [],
    isBulk = false,
    targetStage,
    onSave,
    onCancel,
}) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [feedProducts, setFeedProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (m: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [m]: state ?? !prev[m] }));
    };

    const validationSchema = Yup.object({
        preparedProductId: Yup.string().required(t('form.validation.required')),
        quantity: Yup.number()
            .typeError(t('form.validation.mustBeNumber'))
            .positive(t('form.validation.positive'))
            .required(t('form.validation.required')),
        totalQuantity: isBulk
            ? Yup.number()
                .typeError(t('form.validation.mustBeNumber'))
                .positive(t('form.validation.positive'))
                .required(t('form.validation.required'))
            : Yup.number().notRequired(),
        date: Yup.date().required(t('form.validation.required')).nullable(),
    });

    const formik = useFormik({
        initialValues: {
            preparedProductId: '',
            quantity: 0,
            totalQuantity: 0,
            date: new Date() as Date | null,
            observations: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;

            const basePayload = {
                farmId: userLogged.farm_assigned,
                warehouseId: selectedWarehouseId,
                preparedProductId: values.preparedProductId,
                quantity: values.quantity,
                date: values.date,
                responsibleId: userLogged._id,
                observations: values.observations,
            };

            try {
                let url: string;
                let payload: any = basePayload;

                if (isBulk) {
                    if (targetType === 'group') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.bulkGroups}`;
                    } else if (targetType === 'litter') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.bulkLitters}`;
                    } else {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.bulkPigs}`;
                    }
                    payload = { ...basePayload, targets: bulkTargets };
                } else {
                    if (!targetId) throw new Error('targetId requerido en modo individual');
                    if (targetType === 'group') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForGroup(targetId)}`;
                    } else if (targetType === 'litter') {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForLitter(targetId)}`;
                    } else {
                        url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.createForPig(targetId)}`;
                    }
                }

                const response = await configContext.axiosHelper.create(url, payload);
                if (response.status === HttpStatusCode.Created || response.status === HttpStatusCode.Ok) {
                    const targetLabel = isBulk
                        ? `${bulkTargets.length} ${targetType === 'group' ? t('feeding.administration.target.groups') : targetType === 'litter' ? t('feeding.administration.target.litters') : t('feeding.administration.target.pigs')}`
                        : `1 ${targetType}`;
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Administración de alimento registrada (${targetLabel})`,
                    });
                    toggleModal('success', true);
                }
            } catch (error: any) {
                logger.error('Error creating administration:', error);
                const msg = error?.response?.data?.message || t('feeding.administration.form.error');
                setAlertConfig({ visible: true, color: 'danger', message: msg });
                toggleModal('error', true);
            }
        }
    });

    const fetchWarehouses = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [mainWhRes, subWhRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ]);
            const mainWarehouseId: string = mainWhRes.data.data;
            const allSubs: any[] = subWhRes.data.data || [];
            const feedSubs = allSubs.filter((s: any) => s.type === 'feed');
            const generalOption = {
                _id: mainWarehouseId,
                code: '',
                name: t('feeding.administration.form.field.generalWarehouse', { defaultValue: 'Almacén general' }),
            };
            setWarehouses([generalOption, ...feedSubs]);
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
            formik.setFieldValue('preparedProductId', '');
            setFeedProducts([]);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`
            );
            const inventory: any[] = response.data.data || [];
            const filtered = inventory
                .filter((item: any) => item.product && FEED_PRODUCT_CATEGORIES.includes(item.product.category) && item.quantity > 0)
                .map((item: any) => ({
                    _id: item.product._id || item.product.id,
                    name: item.product.name,
                    category: item.product.category,
                    unit_measurement: item.product.unit_measurement || 'kg',
                    stock: item.quantity,
                }));
            setFeedProducts(filtered);
        } catch (error) {
            logger.error('Error fetching inventory:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleWarehouseChange = (warehouseId: string) => {
        setSelectedWarehouseId(warehouseId);
        if (warehouseId) fetchInventory(warehouseId);
        else {
            setFeedProducts([]);
            formik.setFieldValue('preparedProductId', '');
        }
    };

    const selectedProduct = useMemo(
        () => feedProducts.find(p => p._id === formik.values.preparedProductId),
        [feedProducts, formik.values.preparedProductId]
    );

    const stockAvailable = selectedProduct?.stock ?? 0;
    const requiredQuantity = isBulk ? Number(formik.values.totalQuantity) : Number(formik.values.quantity);
    const exceedsStock = !!selectedProduct && requiredQuantity > stockAvailable;

    const roundQuantity = (value: number) => Math.round(value * 10000) / 10000;

    const handleIndividualQuantityChange = (value: string) => {
        formik.setFieldValue('quantity', value);
        if (isBulk) {
            formik.setFieldValue('totalQuantity', value === '' ? '' : roundQuantity(Number(value) * bulkTargets.length));
        }
    };

    const handleTotalQuantityChange = (value: string) => {
        formik.setFieldValue('totalQuantity', value);
        formik.setFieldValue('quantity', value === '' ? '' : roundQuantity(Number(value) / bulkTargets.length));
    };

    useEffect(() => {
        fetchWarehouses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
            {isBulk && (
                <div className="alert alert-info py-2 mb-3 small">
                    <i className="ri-information-line me-1" />
                    <Trans
                        i18nKey="feeding.administration.form.bulkInfo"
                        values={{ count: bulkTargets.length, target: targetType === 'group' ? t('feeding.administration.target.groups') : targetType === 'litter' ? t('feeding.administration.target.litters') : t('feeding.administration.target.pigs') }}
                        components={{ 1: <strong /> }}
                    />
                </div>
            )}

            {/* Selector de almacén */}
            <div className="mb-3">
                <Label className="form-label">{t('feeding.administration.form.field.warehouse')}</Label>
                <Input
                    type="select"
                    value={selectedWarehouseId}
                    onChange={e => handleWarehouseChange(e.target.value)}
                >
                    <option value="">{t('feeding.administration.form.field.warehouseSelect')}</option>
                    {warehouses.map(w => (
                        <option key={w._id} value={w._id}>
                            {w.code ? `${w.code} — ${w.name}` : w.name}
                        </option>
                    ))}
                </Input>
            </div>

            {/* Producto + cantidad */}
            <div className="d-flex gap-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.administration.form.field.preparedFeed')}</Label>
                    {loadingProducts ? (
                        <div className="d-flex align-items-center gap-2 mt-1">
                            <Spinner size="sm" /><small className="text-muted">{t('common.status.loading')}</small>
                        </div>
                    ) : (
                        <>
                            <Input
                                type="select"
                                name="preparedProductId"
                                value={formik.values.preparedProductId}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.preparedProductId && !!formik.errors.preparedProductId}
                                disabled={!selectedWarehouseId}
                            >
                                <option value="">{t('feeding.administration.form.field.preparedFeedSelect')}</option>
                                {feedProducts.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} — Stock: {(p.stock ?? 0).toFixed(2)} {p.unit_measurement}
                                    </option>
                                ))}
                            </Input>
                            {formik.touched.preparedProductId && formik.errors.preparedProductId && (
                                <FormFeedback>{formik.errors.preparedProductId}</FormFeedback>
                            )}
                            {selectedWarehouseId && !loadingProducts && feedProducts.length === 0 && (
                                <div className="text-warning small mt-1">
                                    <i className="ri-alert-line me-1" />
                                    {t('feeding.administration.form.warning.noPreparedFeed')}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="w-50">
                    <Label className="form-label">{t('feeding.administration.form.field.quantity')}</Label>
                    <div className="input-group">
                        <Input
                            type="number"
                            name="quantity"
                            min={0}
                            step="0.0001"
                            value={formik.values.quantity || ''}
                            onChange={(e) => handleIndividualQuantityChange(e.target.value)}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.quantity && !!formik.errors.quantity}
                            disabled={!formik.values.preparedProductId}
                        />
                        <span className="input-group-text">kg</span>
                    </div>
                    {formik.touched.quantity && formik.errors.quantity && (
                        <div className="text-danger small mt-1">{formik.errors.quantity as string}</div>
                    )}
                    {isBulk && (
                        <div className="mt-3">
                            <Label className="form-label">{t('feeding.administration.form.field.totalQuantity')}</Label>
                            <div className="input-group">
                                <Input
                                    type="number"
                                    name="totalQuantity"
                                    min={0}
                                    step="0.01"
                                    value={formik.values.totalQuantity || ''}
                                    onChange={(e) => handleTotalQuantityChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    invalid={(formik.touched.totalQuantity && !!formik.errors.totalQuantity) || exceedsStock}
                                    disabled={!formik.values.preparedProductId}
                                />
                                <span className="input-group-text">kg</span>
                            </div>
                            {formik.touched.totalQuantity && formik.errors.totalQuantity && (
                                <div className="text-danger small mt-1">{formik.errors.totalQuantity as string}</div>
                            )}
                        </div>
                    )}
                    {exceedsStock && selectedProduct && (
                        <div className="text-danger small mt-1">
                            {t('feeding.administration.form.warning.exceedsStock', { val: stockAvailable.toFixed(2), required: requiredQuantity.toFixed(2) })}
                        </div>
                    )}
                </div>
            </div>

            {selectedProduct && (
                <div className="mt-3">
                    <div className="bg-light rounded p-3 d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">{t('feeding.administration.form.field.stockAvailable')}</small>
                            <div className="fs-5 fw-bold">{stockAvailable.toFixed(2)} kg</div>
                        </div>
                        <i className="ri-archive-line fs-3 text-muted opacity-75" />
                    </div>
                </div>
            )}

            <div className="d-flex gap-3 mt-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.administration.form.field.date')}</Label>
                    <DatePicker
                        className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                        value={formik.values.date ?? undefined}
                        onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('date', d[0]); }}
                        options={{ dateFormat: 'd/m/Y' }}
                    />
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('feeding.administration.form.field.responsible')}</Label>
                    <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                </div>
            </div>

            <div className="mt-3">
                <Label className="form-label">{t('feeding.administration.form.field.observations')}</Label>
                <Input
                    type="textarea"
                    name="observations"
                    rows={2}
                    value={formik.values.observations}
                    onChange={formik.handleChange}
                    placeholder={t('feeding.administration.form.field.observationsPlaceholder')}
                />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="secondary" className="btn-cancel" outline onClick={onCancel}>{t('feeding.administration.form.action.cancel')}</Button>
                <Button
                    color="success"
                    onClick={() => formik.handleSubmit()}
                    disabled={formik.isSubmitting || !selectedWarehouseId || feedProducts.length === 0 || exceedsStock}
                >
                    {formik.isSubmitting ? <Spinner size="sm" /> : (
                        <><i className="ri-check-line me-2" />{t('feeding.administration.form.action.register')}</>
                    )}
                </Button>
            </div>

            <SuccessModal
                isOpen={modals.success}
                onClose={onSave}
                message={isBulk
                    ? t('feeding.administration.form.success.bulk', { count: bulkTargets.length, target: targetType === 'group' ? t('feeding.administration.target.groups') : targetType === 'litter' ? t('feeding.administration.target.litters') : t('feeding.administration.target.pigs') })
                    : t('feeding.administration.form.success.single')}
            />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('feeding.administration.form.error')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={4000} />
        </form>
    );
};

export default FeedAdministrationForm;
