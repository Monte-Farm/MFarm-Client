import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
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
import { FeedAdministration } from "common/data_interfaces";

const FEED_PRODUCT_CATEGORIES = ['nutrition', 'prepared_feed'];

interface EditFeedAdministrationFormProps {
    administrationId: string;
    onSave: () => void;
    onCancel: () => void;
}

const EditFeedAdministrationForm: React.FC<EditFeedAdministrationFormProps> = ({
    administrationId,
    onSave,
    onCancel,
}) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [original, setOriginal] = useState<FeedAdministration | null>(null);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [feedProducts, setFeedProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (m: keyof typeof modals, state?: boolean) =>
        setModals((prev) => ({ ...prev, [m]: state ?? !prev[m] }));

    const validationSchema = Yup.object({
        quantity: Yup.number()
            .typeError(t('form.validation.mustBeNumber'))
            .positive(t('form.validation.positive'))
            .required(t('form.validation.required')),
        date: Yup.date().required(t('form.validation.required')).nullable(),
    });

    const formik = useFormik({
        initialValues: {
            quantity: 0,
            date: new Date() as Date | null,
            preparedProductId: '',
            observations: '',
            editReason: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;

            const payload: Record<string, any> = {
                editedBy: userLogged._id,
                editReason: values.editReason || undefined,
                quantity: values.quantity,
                date: values.date,
                observations: values.observations,
            };

            if (selectedWarehouseId) payload.warehouseId = selectedWarehouseId;
            if (values.preparedProductId) payload.preparedProductId = values.preparedProductId;

            try {
                const url = `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.update(administrationId)}`;
                const response = await configContext.axiosHelper.update(url, payload);
                if (response.status === HttpStatusCode.Ok) {
                    toggleModal('success', true);
                }
            } catch (error: any) {
                logger.error('Error updating administration:', error);
                const msg = error?.response?.data?.message || t('feeding.administration.edit.error');
                setAlertConfig({ visible: true, color: 'danger', message: msg });
                toggleModal('error', true);
            }
        },
    });

    const fetchWarehouses = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [mainWhRes, allSubs] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`),
                configContext.axiosHelper
                    .get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`)
                    .then((res: any) => res.data.data || [])
                    .catch((err: any) => {
                        if (err?.response?.status === HttpStatusCode.NotFound) return [];
                        throw err;
                    }),
            ]);
            const mainWarehouseId: string = mainWhRes.data.data;
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
        }
    };

    const fetchInventory = async (warehouseId: string) => {
        if (!configContext || !warehouseId) return;
        try {
            setLoadingProducts(true);
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
                    unit_measurement: item.product.unit_measurement,
                    stock: item.quantity,
                }));
            setFeedProducts(filtered);
        } catch (error) {
            logger.error('Error fetching inventory:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchAdministration = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/${FEED_ADMINISTRATION_URLS.findById(administrationId)}`
            );
            const record: FeedAdministration = response.data.data;
            setOriginal(record);

            const productId = typeof record.preparedProduct === 'object'
                ? record.preparedProduct._id
                : record.preparedProduct;

            const warehouseId = record.subwarehouse
                ? (typeof record.subwarehouse === 'object' ? record.subwarehouse._id : record.subwarehouse)
                : '';

            formik.setValues({
                quantity: record.quantity,
                date: record.date ? new Date(record.date) : new Date(),
                preparedProductId: productId || '',
                observations: record.observations || '',
                editReason: '',
            });

            if (warehouseId) {
                setSelectedWarehouseId(warehouseId);
                await fetchInventory(warehouseId);
            }
        } catch (error) {
            logger.error('Error fetching administration:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    const handleWarehouseChange = (warehouseId: string) => {
        setSelectedWarehouseId(warehouseId);
        formik.setFieldValue('preparedProductId', '');
        if (warehouseId) fetchInventory(warehouseId);
        else setFeedProducts([]);
    };

    const selectedProduct = useMemo(
        () => feedProducts.find(p => p._id === formik.values.preparedProductId),
        [feedProducts, formik.values.preparedProductId]
    );

    const stockAvailable = selectedProduct?.stock ?? 0;
    const selectedUnit = selectedProduct?.unit_measurement ?? (
        original && typeof original.preparedProduct === 'object'
            ? (original.preparedProduct as any).unit_measurement
            : ''
    );
    const exceedsStock = !!selectedProduct && Number(formik.values.quantity) > stockAvailable;

    useEffect(() => {
        Promise.all([fetchWarehouses(), fetchAdministration()]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
            {/* Motivo de edición */}
            <div className="mb-3">
                <Label className="form-label">{t('feeding.administration.edit.reasonLabel')}</Label>
                <Input
                    type="text"
                    name="editReason"
                    value={formik.values.editReason}
                    onChange={formik.handleChange}
                    placeholder={t('feeding.administration.edit.reasonPlaceholder')}
                />
            </div>

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
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={(formik.touched.quantity && !!formik.errors.quantity) || exceedsStock}
                        />
                        <span className="input-group-text">{selectedUnit}</span>
                    </div>
                    {formik.touched.quantity && formik.errors.quantity && (
                        <div className="text-danger small mt-1">{formik.errors.quantity as string}</div>
                    )}
                    {exceedsStock && selectedProduct && (
                        <div className="text-danger small mt-1">
                            {t('feeding.administration.form.warning.exceedsStock', {
                                val: stockAvailable.toFixed(2),
                                required: Number(formik.values.quantity).toFixed(2),
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedProduct && (
                <div className="mt-3">
                    <div className="bg-light rounded p-3 d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">{t('feeding.administration.form.field.stockAvailable')}</small>
                            <div className="fs-5 fw-bold">{stockAvailable.toFixed(2)} {selectedUnit}</div>
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
                <Button color="secondary" outline onClick={onCancel}>
                    {t('feeding.administration.edit.action.cancel')}
                </Button>
                <Button
                    color="primary"
                    onClick={() => formik.handleSubmit()}
                    disabled={formik.isSubmitting || exceedsStock}
                >
                    {formik.isSubmitting ? <Spinner size="sm" /> : (
                        <><i className="ri-save-line me-2" />{t('feeding.administration.edit.action.save')}</>
                    )}
                </Button>
            </div>

            <SuccessModal
                isOpen={modals.success}
                onClose={onSave}
                message={t('feeding.administration.edit.success')}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={t('feeding.administration.edit.error')}
            />
            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                absolutePosition={false}
                autoClose={4000}
            />
        </form>
    );
};

export default EditFeedAdministrationForm;
