import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEED_PREPARATION_URLS, FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Spinner } from "reactstrap";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import MissingStockModal from "../Shared/MissingStockModal";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import { HttpStatusCode } from "axios";

interface FeedPreparationFormProps {
    onSave: () => void;
    onCancel: () => void;
}

interface PreviewIngredient {
    productId: string;
    name: string;
    unit_measurement: string;
    percentage: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

const FeedPreparationForm: React.FC<FeedPreparationFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [subwarehouses, setSubwarehouses] = useState<any[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, any>>({});
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
    const [pricesMap, setPricesMap] = useState<Record<string, number>>({});
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [missingItems, setMissingItems] = useState<Array<{ product: string; required: number; available: number }>>([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const validationSchema = Yup.object({
        recipeId: Yup.string().required(t('form.validation.required')),
        subwarehouseId: Yup.string().required(t('form.validation.required')),
        batchSize: Yup.number()
            .typeError(t('form.validation.mustBeNumber'))
            .positive(t('form.validation.positive'))
            .required(t('form.validation.required')),
        actualYield: Yup.number()
            .typeError(t('form.validation.mustBeNumber'))
            .positive(t('form.validation.positive'))
            .required(t('form.validation.required'))
            .test('le-batch', t('form.validation.exceedsStock'), function (value) {
                const batch = this.parent.batchSize;
                if (!batch || !value) return true;
                return value <= batch;
            }),
        date: Yup.date().required(t('form.validation.required')).nullable(),
    });

    const formik = useFormik({
        initialValues: {
            recipeId: '',
            subwarehouseId: '',
            batchSize: 0,
            actualYield: 0,
            date: new Date() as Date | null,
            notes: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;
            try {
                const payload = {
                    farmId: userLogged.farm_assigned,
                    recipeId: values.recipeId,
                    batchSize: values.batchSize,
                    actualYield: values.actualYield,
                    subwarehouseId: values.subwarehouseId,
                    date: values.date,
                    responsibleId: userLogged._id,
                    notes: values.notes,
                };
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/${FEED_PREPARATION_URLS.create}`, payload);
                if (response.status === HttpStatusCode.Created || response.status === HttpStatusCode.Ok) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Feed batch prepared (${selectedRecipe?.name || ''})`,
                    });
                    toggleModal('success', true);
                }
            } catch (error: any) {
                logger.error('Error creating preparation:', error);
                if (error?.response?.status === 400 && Array.isArray(error.response.data?.missing)) {
                    const items = error.response.data.missing.map((m: any) => ({
                        product: m.product || productsMap[m.productId]?.name || m.productName || m.productId,
                        required: Number((m.required ?? m.quantity ?? 0).toFixed(2)),
                        available: Number((m.available ?? m.stock ?? 0).toFixed(2)),
                    }));
                    setMissingItems(items);
                    toggleModal('missingStock', true);
                    return;
                }
                const msg = error?.response?.data?.message || t('feeding.preparation.form.error');
                setAlertConfig({ visible: true, color: 'danger', message: msg });
                toggleModal('error', true);
            }
        }
    });

    const fetchInitialData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [recipesResponse, subwarehousesResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findByFarm(userLogged.farm_assigned)}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/feeding_products/${userLogged.farm_assigned}`),
            ]);
            const allRecipes = recipesResponse.data.data || [];
            const activeRecipes = allRecipes.filter((r: any) => r.is_active);
            setRecipes(activeRecipes);
            setSubwarehouses(subwarehousesResponse.data.data || []);
            const map: Record<string, any> = {};
            for (const p of (productsResponse.data.data || [])) {
                if (p.id) map[p.id] = p;
                if (p._id) map[p._id] = p;
            }
            setProductsMap(map);
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    const handleRecipeChange = async (recipeId: string) => {
        formik.setFieldValue('recipeId', recipeId);
        const recipe = recipes.find(r => r._id === recipeId) || null;
        setSelectedRecipe(recipe);
        setPricesMap({});

        if (!recipe || !configContext) return;

        const productIds = (recipe.feedings || [])
            .map((f: any) => f.feeding?._id || f.feeding?.id || f.feeding)
            .filter(Boolean);

        if (productIds.length === 0) return;

        try {
            const pricesResponse = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/warehouse/average_prices/${userLogged.farm_assigned}`,
                { productIds }
            );
            const map: Record<string, number> = {};
            for (const p of pricesResponse.data.data) {
                map[p.productId] = p.averagePrice;
            }
            setPricesMap(map);
        } catch (error) {
            logger.error('Error fetching prices:', error);
        }
    };

    const previewIngredients: PreviewIngredient[] = useMemo(() => {
        if (!selectedRecipe || !formik.values.batchSize) return [];
        return (selectedRecipe.feedings || []).map((f: any) => {
            const productId = f.feeding?._id || f.feeding?.id || f.feeding;
            const product = productsMap[productId] || f.feeding || {};
            const percentage = f.percentage ?? 0;
            const quantity = (formik.values.batchSize * percentage) / 100;
            const unitPrice = pricesMap[productId] ?? 0;
            return {
                productId,
                name: product.name || '—',
                unit_measurement: product.unit_measurement || 'kg',
                percentage,
                quantity,
                unitPrice,
                subtotal: quantity * unitPrice,
            };
        });
    }, [selectedRecipe, formik.values.batchSize, pricesMap, productsMap]);

    const totalCostEstimated = previewIngredients.reduce((acc, i) => acc + i.subtotal, 0);

    const previewColumns: Column<PreviewIngredient>[] = [
        {
            header: t('feeding.preparation.form.column.ingredient'),
            accessor: 'name',
            type: 'text',
            render: (_, row) => <span className="fw-semibold">{row.name}</span>,
        },
        {
            header: t('feeding.preparation.form.column.recipePercent'),
            accessor: 'percentage',
            type: 'currency',
            render: (_, row) => <span>{row.percentage.toFixed(2)}%</span>,
        },
        {
            header: t('feeding.preparation.form.column.quantity'),
            accessor: 'quantity',
            type: 'currency',
            bgColor: '#e3f2fd',
            render: (_, row) => <span className="fw-medium">{row.quantity.toFixed(2)} {row.unit_measurement}</span>,
        },
        {
            header: t('feeding.preparation.form.column.avgPrice'),
            accessor: 'unitPrice',
            type: 'currency',
            bgColor: '#f3e5f5',
            render: (_, row) => <span>${row.unitPrice.toFixed(2)}</span>,
        },
        {
            header: t('feeding.preparation.form.column.subtotal'),
            accessor: 'subtotal',
            type: 'currency',
            bgColor: '#e8f5e9',
            render: (_, row) => <span className="fw-semibold">${row.subtotal.toFixed(2)}</span>,
        },
    ];
    const shrinkage = Math.max(0, formik.values.batchSize - formik.values.actualYield);
    const shrinkagePercentage = formik.values.batchSize > 0
        ? (shrinkage / formik.values.batchSize) * 100
        : 0;
    const costPerKgEstimated = formik.values.actualYield > 0
        ? totalCostEstimated / formik.values.actualYield
        : 0;

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
            <div className="d-flex gap-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.recipe')}</Label>
                    <Input
                        type="select"
                        name="recipeId"
                        value={formik.values.recipeId}
                        onChange={(e) => handleRecipeChange(e.target.value)}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.recipeId && !!formik.errors.recipeId}
                    >
                        <option value="">{t('feeding.preparation.form.field.recipeSelect')}</option>
                        {recipes.map(r => (
                            <option key={r._id} value={r._id}>
                                {r.code} — {r.name} ({r.expectedYield ?? 100}% rendimiento)
                            </option>
                        ))}
                    </Input>
                    {formik.touched.recipeId && formik.errors.recipeId && (<FormFeedback>{formik.errors.recipeId}</FormFeedback>)}
                </div>

                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.subwarehouse')}</Label>
                    <Input
                        type="select"
                        name="subwarehouseId"
                        value={formik.values.subwarehouseId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.subwarehouseId && !!formik.errors.subwarehouseId}
                    >
                        <option value="">{t('feeding.preparation.form.field.subwarehouseSelect')}</option>
                        {subwarehouses.map(s => (
                            <option key={s._id} value={s._id}>{s.code} — {s.name}</option>
                        ))}
                    </Input>
                    {formik.touched.subwarehouseId && formik.errors.subwarehouseId && (<FormFeedback>{formik.errors.subwarehouseId}</FormFeedback>)}
                </div>
            </div>

            <div className="d-flex gap-3 mt-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.mixAmount')}</Label>
                    <div className="input-group">
                        <Input
                            type="number"
                            name="batchSize"
                            min={0}
                            step="0.01"
                            value={formik.values.batchSize || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.batchSize && !!formik.errors.batchSize}
                        />
                        <span className="input-group-text">kg</span>
                    </div>
                    {formik.touched.batchSize && formik.errors.batchSize && (
                        <div className="text-danger small mt-1">{formik.errors.batchSize as string}</div>
                    )}
                </div>

                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.producedAmount')}</Label>
                    <div className="input-group">
                        <Input
                            type="number"
                            name="actualYield"
                            min={0}
                            step="0.01"
                            value={formik.values.actualYield || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.actualYield && !!formik.errors.actualYield}
                        />
                        <span className="input-group-text">kg</span>
                    </div>
                    {formik.touched.actualYield && formik.errors.actualYield && (
                        <div className="text-danger small mt-1">{formik.errors.actualYield as string}</div>
                    )}
                </div>
            </div>

            <div className="d-flex gap-3 mt-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.date')}</Label>
                    <DatePicker
                        className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                        value={formik.values.date ?? undefined}
                        onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('date', d[0]); }}
                        options={{ dateFormat: 'd/m/Y' }}
                    />
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.responsible')}</Label>
                    <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                </div>
            </div>

            <div className="mt-3">
                <Label className="form-label">{t('feeding.preparation.form.field.notes')}</Label>
                <Input
                    type="textarea"
                    name="notes"
                    rows={2}
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    placeholder={t('feeding.preparation.form.field.notesPlaceholder')}
                />
            </div>

            {/* Preview */}
            {selectedRecipe && formik.values.batchSize > 0 && (
                <Card className="mt-4 border-info border-opacity-25">
                    <CardHeader className="bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-info">
                            <i className="ri-flask-line me-2" /> {t('feeding.preparation.form.ingredientPreview')}
                        </h6>
                        <Badge color="info" className="fs-5 px-3 py-2">
                            {t('feeding.preparation.form.estimatedCost', { val: totalCostEstimated.toFixed(2) })}
                        </Badge>
                    </CardHeader>
                    <CardBody className="p-3">
                        <CustomTable
                            columns={previewColumns}
                            data={previewIngredients}
                            showSearchAndFilter={false}
                            showPagination={false}
                            fontSize={13}
                        />
                    </CardBody>
                    <div className="px-3 py-2 bg-light border-top">
                        <small className="text-muted">
                            <i className="ri-information-line me-1" />
                            {t('feeding.preparation.form.costNote')}
                        </small>
                    </div>
                </Card>
            )}

            {/* Resumen del batch */}
            {formik.values.batchSize > 0 && formik.values.actualYield > 0 && (
                <Card className="mt-3 border-success border-opacity-25">
                    <CardBody className="py-3">
                        <div className="row text-center">
                            <div className="col">
                                <div className="text-muted small">{t('feeding.preparation.form.waste')}</div>
                                <div className="fs-5 fw-bold text-warning">
                                    {shrinkage.toFixed(2)} kg
                                    <span className="ms-2 small">({shrinkagePercentage.toFixed(2)}%)</span>
                                </div>
                            </div>
                            <div className="col border-start">
                                <div className="text-muted small">{t('feeding.preparation.form.costPerKgProduced')}</div>
                                <div className="fs-5 fw-bold text-success">
                                    ${costPerKgEstimated.toFixed(2)}
                                </div>
                            </div>
                            <div className="col border-start">
                                <div className="text-muted small">{t('feeding.preparation.form.realYield')}</div>
                                <div className="fs-5 fw-bold text-primary">
                                    {((formik.values.actualYield / formik.values.batchSize) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="secondary" className="btn-cancel" outline onClick={onCancel}>{t('common.button.cancel')}</Button>
                <Button color="success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner size="sm" /> : (<><i className="ri-check-line me-2" />{t('feeding.administration.form.action.register')}</>)}
                </Button>
            </div>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('feeding.preparation.form.success')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('feeding.preparation.form.error')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={4000} />
        </form>
    );
};

export default FeedPreparationForm;
