import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEED_PREPARATION_URLS, FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Progress, Spinner } from "reactstrap";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import MissingStockModal from "../Shared/MissingStockModal";
import SelectableCustomTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";
import { PRODUCT_TYPES } from "common/enums/products.enums";
import { HttpStatusCode } from "axios";
import noImageUrl from '../../../assets/images/no-image.png';

interface FeedPreparationFormProps {
    onSave: () => void;
    onCancel: () => void;
}

interface IngredientRow {
    productId: string;
    code: string;
    name: string;
    image?: string;
    category?: string;
    unit_measurement: string;
    averagePrice: number;
    quantity: number;
    quantityInput: string;
    percentage: number;
    percentageInput: string;
}

type RecipeSaveMode = 'none' | 'new' | 'update';

const roundN = (n: number, decimals = 2) => {
    const f = Math.pow(10, decimals);
    return Math.round(n * f) / f;
};

const FeedPreparationForm: React.FC<FeedPreparationFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [subwarehouses, setSubwarehouses] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, any>>({});
    const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
    const [originalRecipePercentages, setOriginalRecipePercentages] = useState<Record<string, number>>({});

    const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
    const [preselectedIds, setPreselectedIds] = useState<string[]>([]);
    const [selectIngredientsOpen, setSelectIngredientsOpen] = useState<boolean>(false);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false, saveOptions: false });
    const [missingItems, setMissingItems] = useState<Array<{ product: string; required: number; available: number }>>([]);

    const [targetBatchInput, setTargetBatchInput] = useState<string>('');

    const [recipeSaveMode, setRecipeSaveMode] = useState<RecipeSaveMode>('none');
    const [customName, setCustomName] = useState<string>('');
    const [newRecipeCode, setNewRecipeCode] = useState<string>('');
    const [newRecipeName, setNewRecipeName] = useState<string>('');
    const [newRecipeStage, setNewRecipeStage] = useState<string>('general');
    const [savingRecipe, setSavingRecipe] = useState<boolean>(false);
    const [fetchingNextCode, setFetchingNextCode] = useState<boolean>(false);

    const handleSelectNewRecipeMode = async () => {
        setRecipeSaveMode('new');
        if (newRecipeCode || fetchingNextCode || !configContext) return;
        try {
            setFetchingNextCode(true);
            const res = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.nextCode}`
            );
            setNewRecipeCode(res.data.data);
        } catch (error) {
            logger.error('Error fetching next recipe code:', error);
        } finally {
            setFetchingNextCode(false);
        }
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals(prev => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const batchSize = useMemo(
        () => ingredients.reduce((acc, i) => acc + (i.quantity || 0), 0),
        [ingredients]
    );

    const totalPercentage = useMemo(
        () => ingredients.reduce((acc, i) => acc + (i.percentage || 0), 0),
        [ingredients]
    );

    const totalCostEstimated = useMemo(
        () => ingredients.reduce((acc, i) => acc + (i.quantity * i.averagePrice), 0),
        [ingredients]
    );

    const recomputePercentages = (rows: IngredientRow[]): IngredientRow[] => {
        const total = rows.reduce((acc, i) => acc + (i.quantity || 0), 0);
        if (total <= 0) {
            return rows.map(r => ({ ...r, percentage: 0, percentageInput: '' }));
        }
        return rows.map(r => {
            const pct = roundN((r.quantity / total) * 100, 2);
            return { ...r, percentage: pct, percentageInput: pct > 0 ? String(pct) : '' };
        });
    };

    // Editar kg de una fila → recalcular % de TODAS las filas
    const handleQuantityChange = (productId: string, rawInput: string) => {
        if (rawInput !== '' && !/^\d*\.?\d*$/.test(rawInput)) return;
        const parsed = rawInput === '' || rawInput === '.' ? 0 : Number(rawInput);
        setIngredients(prev => {
            const updated = prev.map(r =>
                r.productId === productId ? { ...r, quantity: parsed, quantityInput: rawInput } : r
            );
            return recomputePercentages(updated);
        });
    };

    const handleTargetBatchChange = (rawInput: string) => {
        if (rawInput !== '' && !/^\d*\.?\d*$/.test(rawInput)) return;
        setTargetBatchInput(rawInput);
        const targetKg = rawInput === '' || rawInput === '.' ? 0 : Number(rawInput);
        if (targetKg <= 0 || Object.keys(originalRecipePercentages).length === 0) return;
        setIngredients(prev =>
            prev.map(r => {
                const pct = originalRecipePercentages[r.productId] ?? r.percentage;
                const qty = roundN((targetKg * pct) / 100, 4);
                return { ...r, quantity: qty, quantityInput: qty > 0 ? String(qty) : '', percentage: pct, percentageInput: pct > 0 ? String(pct) : '' };
            })
        );
    };

    // Editar % de una fila → mantener kg de las demás, ajustar kg de esta fila
    const handlePercentageChange = (productId: string, rawInput: string) => {
        if (rawInput !== '' && !/^\d*\.?\d*$/.test(rawInput)) return;
        const parsedPct = rawInput === '' || rawInput === '.' ? 0 : Number(rawInput);
        if (parsedPct >= 100) return; // imposible: una sola fila no puede ser ≥100% del total

        setIngredients(prev => {
            const others = prev.filter(r => r.productId !== productId);
            const sumOthers = others.reduce((acc, r) => acc + (r.quantity || 0), 0);
            // Si parsedPct = 0, el quantity se vuelve 0 directamente.
            // Si parsedPct > 0, derivamos: nuevoQty / (sumOthers + nuevoQty) = parsedPct/100
            // → nuevoQty = (parsedPct/100 * sumOthers) / (1 - parsedPct/100)
            let newQty = 0;
            if (parsedPct > 0 && sumOthers > 0) {
                const p = parsedPct / 100;
                newQty = roundN((p * sumOthers) / (1 - p), 4);
            } else if (parsedPct > 0 && sumOthers === 0) {
                // Sin otras filas con kg, no podemos derivar kg desde un %. Mantener el input pero qty=0.
                newQty = 0;
            }
            const updated = prev.map(r =>
                r.productId === productId
                    ? { ...r, quantity: newQty, quantityInput: newQty > 0 ? String(newQty) : '', percentageInput: rawInput }
                    : r
            );
            return recomputePercentages(updated);
        });
    };

    const validationSchema = Yup.object({
        subwarehouseId: Yup.string().required(t('form.validation.required')),
        actualYield: Yup.number()
            .typeError(t('form.validation.mustBeNumber'))
            .positive(t('form.validation.positive'))
            .required(t('form.validation.required')),
        date: Yup.date().required(t('form.validation.required')).nullable(),
    });

    const formik = useFormik({
        initialValues: {
            recipeId: '',
            subwarehouseId: '',
            actualYield: 0,
            date: new Date() as Date | null,
            notes: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async () => {
            // Validar que hay ingredientes con kg > 0
            const validRows = ingredients.filter(i => i.quantity > 0);
            if (validRows.length === 0) {
                setAlertConfig({ visible: true, color: 'danger', message: t('feeding.preparation.form.error.noIngredients') });
                return;
            }
            if (formik.values.actualYield > batchSize) {
                setAlertConfig({ visible: true, color: 'danger', message: t('feeding.preparation.form.error.yieldExceedsBatch') });
                return;
            }
            toggleModal('saveOptions', true);
        }
    });

    const submitPreparation = async () => {
        if (!configContext) return;
        if (recipeSaveMode === 'new' && (!newRecipeCode.trim() || !newRecipeName.trim())) {
            setAlertConfig({ visible: true, color: 'danger', message: t('feeding.preparation.form.error.recipeFieldsRequired') });
            return;
        }
        setSavingRecipe(true);
        try {
            const validRows = ingredients.filter(i => i.quantity > 0);
            const payload: any = {
                farmId: userLogged.farm_assigned,
                subwarehouseId: formik.values.subwarehouseId,
                date: formik.values.date,
                responsibleId: userLogged._id,
                notes: formik.values.notes,
                batchSize: roundN(batchSize, 4),
                actualYield: formik.values.actualYield,
                ingredients: validRows.map(r => ({
                    productId: r.productId,
                    quantity: roundN(r.quantity, 4),
                    percentage: roundN(r.percentage, 4),
                })),
                recipeId: formik.values.recipeId || null,
                recipeSaveMode,
                ...(recipeSaveMode === 'none' && !formik.values.recipeId && customName.trim() && {
                    customName: customName.trim(),
                }),
                ...(recipeSaveMode === 'new' && {
                    newRecipe: {
                        code: newRecipeCode.trim(),
                        name: newRecipeName.trim(),
                        stage: newRecipeStage,
                        farm: userLogged.farm_assigned,
                    },
                }),
            };

            const response = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/${FEED_PREPARATION_URLS.create}`,
                payload
            );

            if (response.status === HttpStatusCode.Created || response.status === HttpStatusCode.Ok) {
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                    { event: `Feed batch prepared (${selectedRecipe?.name || 'custom mix'})` }
                );
                toggleModal('saveOptions', false);
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
                toggleModal('saveOptions', false);
                toggleModal('missingStock', true);
                return;
            }
            const msg = error?.response?.data?.message || t('feeding.preparation.form.error.generic');
            setAlertConfig({ visible: true, color: 'danger', message: msg });
            toggleModal('saveOptions', false);
            toggleModal('error', true);
        } finally {
            setSavingRecipe(false);
        }
    };

    const fetchInitialData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [recipesResponse, mainWhResponse, subwarehousesResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findByFarm(userLogged.farm_assigned)}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ]);
            setRecipes((recipesResponse.data.data || []).filter((r: any) => r.is_active));

            const mainWarehouseId: string = mainWhResponse.data.data;
            const allSubwarehouses: any[] = subwarehousesResponse.data.data || [];
            const feedSubwarehouses = allSubwarehouses.filter((s: any) => s.type === 'feed');
            const generalOption = { _id: mainWarehouseId, code: '', name: t('feeding.preparation.form.field.generalWarehouse', { defaultValue: 'Almacén general' }) };
            setSubwarehouses([generalOption, ...feedSubwarehouses]);
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    const FEED_INGREDIENT_CATEGORIES = ['nutrition', 'vitamins', 'minerals'];

    const loadInventoryForWarehouse = async (warehouseId: string) => {
        if (!configContext || !warehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`);
            const inventory: any[] = response.data.data || [];
            const rawIngredients = inventory
                .filter((item: any) =>
                    item.product &&
                    (!item.product.type || item.product.type === PRODUCT_TYPES.RAW) &&
                    FEED_INGREDIENT_CATEGORIES.includes(item.product.category)
                )
                .map((item: any) => ({
                    ...item.product,
                    id: item.product._id || item.product.id,
                    averagePrice: item.averagePrice ?? 0,
                    quantity_in_stock: item.quantity,
                }));
            setProducts(rawIngredients);
            const map: Record<string, any> = {};
            for (const p of rawIngredients) {
                if (p.id) map[p.id] = p;
                if (p._id) map[p._id] = p;
            }
            setProductsMap(map);
        } catch (error) {
            logger.error('Error loading warehouse inventory:', error);
        }
    };

    const handleWarehouseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        formik.handleChange(e);
        setIngredients([]);
        setPreselectedIds([]);
        const warehouseId = e.target.value;
        if (warehouseId) loadInventoryForWarehouse(warehouseId);
        else { setProducts([]); setProductsMap({}); }
    };

    const fetchAveragePrices = async (productIds: string[]): Promise<Record<string, number>> => {
        if (!configContext || productIds.length === 0) return {};
        try {
            const res = await configContext.axiosHelper.create(
                `${configContext.apiUrl}/warehouse/average_prices/${userLogged.farm_assigned}`,
                { productIds }
            );
            const map: Record<string, number> = {};
            for (const p of res.data.data) map[p.productId] = p.averagePrice;
            return map;
        } catch (error) {
            logger.error('Error fetching prices:', error);
            return {};
        }
    };

    const buildIngredientRow = (product: any, quantity: number, averagePrice?: number): IngredientRow => {
        const pid = product.id || product._id;
        return {
            productId: pid,
            code: product.code || '',
            name: product.name || '—',
            image: product.image,
            category: product.category,
            unit_measurement: product.unit_measurement || 'kg',
            averagePrice: averagePrice ?? product.averagePrice ?? 0,
            quantity: quantity,
            quantityInput: quantity > 0 ? String(quantity) : '',
            percentage: 0,
            percentageInput: '',
        };
    };

    const handleRecipeChange = async (recipeId: string) => {
        formik.setFieldValue('recipeId', recipeId);
        setTargetBatchInput('');

        if (!recipeId) {
            setSelectedRecipe(null);
            setOriginalRecipePercentages({});
            setIngredients([]);
            setPreselectedIds([]);
            return;
        }
        const recipe = recipes.find(r => r._id === recipeId);
        if (!recipe) return;
        setSelectedRecipe(recipe);

        const recipeFeedings = recipe.feedings || [];
        const productIds = recipeFeedings
            .map((f: any) => f.feeding?._id || f.feeding?.id || f.feeding)
            .filter(Boolean);

        const prices = await fetchAveragePrices(productIds);

        // batch base sugerido: 100 kg → cantidades = porcentaje. El usuario lo ajusta luego.
        const baseBatch = 100;
        const rows: IngredientRow[] = recipeFeedings
            .map((f: any) => {
                const rawRef = f.feeding?._id || f.feeding?.id || f.feeding;
                const product = productsMap[rawRef] || f.feeding;
                if (!product) return null;
                const pid = product.id || product._id;
                const pct = f.percentage ?? 0;
                const qty = roundN((baseBatch * pct) / 100, 4);
                return {
                    productId: pid,
                    code: product.code || '',
                    name: product.name || '—',
                    image: product.image,
                    category: product.category,
                    unit_measurement: product.unit_measurement || 'kg',
                    averagePrice: prices[pid] ?? prices[rawRef] ?? 0,
                    quantity: qty,
                    quantityInput: String(qty),
                    percentage: pct,
                    percentageInput: pct > 0 ? String(pct) : '',
                };
            })
            .filter((r: IngredientRow | null): r is IngredientRow => r !== null);

        const origPct: Record<string, number> = {};
        for (const r of rows) origPct[r.productId] = r.percentage;
        setOriginalRecipePercentages(origPct);
        setIngredients(recomputePercentages(rows));
        setPreselectedIds(rows.map(r => r.productId));
    };

    const openSelectIngredients = () => setSelectIngredientsOpen(true);

    const handleIngredientsSelection = async (selectedRows: any[]) => {
        const selectedIds = selectedRows.map(r => r.id || r._id);

        // Mantener filas existentes que sigan seleccionadas, agregar nuevas
        const existing = ingredients.filter(i => selectedIds.includes(i.productId));
        const existingIds = new Set(existing.map(i => i.productId));
        const newRowsRaw = selectedRows.filter(r => !existingIds.has(r.id || r._id));

        let newRows: IngredientRow[] = [];
        if (newRowsRaw.length > 0) {
            const newIds = newRowsRaw.map(r => r.id || r._id);
            const prices = await fetchAveragePrices(newIds);
            newRows = newRowsRaw.map(r => buildIngredientRow(r, 0, prices[r.id || r._id]));
        }

        const merged = [...existing, ...newRows];
        setIngredients(recomputePercentages(merged));
        setPreselectedIds(merged.map(r => r.productId));
    };

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (batchSize > 0) formik.setFieldValue('actualYield', roundN(batchSize, 2));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchSize]);

    const shrinkage = Math.max(0, batchSize - formik.values.actualYield);
    const shrinkagePercentage = batchSize > 0 ? (shrinkage / batchSize) * 100 : 0;
    const costPerKgEstimated = formik.values.actualYield > 0 ? totalCostEstimated / formik.values.actualYield : 0;
    const sumIs100 = ingredients.length > 0 && Math.abs(totalPercentage - 100) < 0.5;
    const recipeWasModified = useMemo(() => {
        if (!selectedRecipe) return false;
        const currentIds = new Set(ingredients.filter(i => i.quantity > 0).map(i => i.productId));
        const origIds = new Set(Object.keys(originalRecipePercentages));
        if (currentIds.size !== origIds.size) return true;
        const idsArr = Array.from(currentIds);
        for (const id of idsArr) {
            if (!origIds.has(id)) return true;
            const cur = ingredients.find(i => i.productId === id)?.percentage ?? 0;
            const orig = originalRecipePercentages[id] ?? 0;
            if (Math.abs(cur - orig) > 0.5) return true;
        }
        return false;
    }, [selectedRecipe, ingredients, originalRecipePercentages]);

    // Columnas para la tabla de selección de productos
    const productColumns: Column<any>[] = [
        {
            header: t('feeding.package.form.column.image'),
            accessor: 'image',
            render: (_, row) => (
                <img src={row.image || noImageUrl} alt="" style={{ height: '50px' }} />
            ),
        },
        { header: t('feeding.package.form.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: 'name', type: 'text', isFilterable: true },
        {
            header: t('feeding.package.form.column.category'),
            accessor: 'category',
            render: (value: string) => (
                <Badge color="secondary">{t(`feeding.productCategory.${value}`, { defaultValue: value })}</Badge>
            ),
        },
        {
            header: t('feeding.package.form.column.avgPrice'),
            accessor: 'averagePrice',
            render: (_, row) => <span>${(row.averagePrice ?? 0).toFixed(2)} / {row.unit_measurement}</span>,
        },
    ];

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
            {/* Receta opcional + Subalmacén */}
            <div className="d-flex gap-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.recipeOptional')}</Label>
                    <Input
                        type="select"
                        name="recipeId"
                        value={formik.values.recipeId}
                        onChange={e => handleRecipeChange(e.target.value)}
                    >
                        <option value="">{t('feeding.preparation.form.field.recipeNone')}</option>
                        {recipes.map(r => (
                            <option key={r._id} value={r._id}>{r.code} — {r.name}</option>
                        ))}
                    </Input>
                    {selectedRecipe && recipeWasModified && (
                        <small className="text-warning d-block mt-1">
                            <i className="ri-edit-line me-1" />{t('feeding.preparation.form.recipeModified')}
                        </small>
                    )}
                    {selectedRecipe && (
                        <div className="mt-2">
                            <Label className="form-label">{t('feeding.preparation.form.field.targetBatch')}</Label>
                            <div className="input-group">
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={targetBatchInput}
                                    onChange={e => handleTargetBatchChange(e.target.value)}
                                    placeholder="0.00"
                                />
                                <span className="input-group-text">kg</span>
                            </div>
                            <small className="text-muted">{t('feeding.preparation.form.field.targetBatchHint')}</small>
                        </div>
                    )}
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.subwarehouse')}</Label>
                    <Input
                        type="select"
                        name="subwarehouseId"
                        value={formik.values.subwarehouseId}
                        onChange={handleWarehouseChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.subwarehouseId && !!formik.errors.subwarehouseId}
                    >
                        <option value="">{t('feeding.preparation.form.field.subwarehouseSelect')}</option>
                        {subwarehouses.map(s => (
                            <option key={s._id} value={s._id}>{s.code ? `${s.code} — ${s.name}` : s.name}</option>
                        ))}
                    </Input>
                    {formik.touched.subwarehouseId && formik.errors.subwarehouseId && (<FormFeedback>{formik.errors.subwarehouseId}</FormFeedback>)}
                </div>
            </div>

            {/* Ingredientes — editable kg/% */}
            <Card className="mt-4 border-primary border-opacity-25">
                <CardHeader className="bg-primary bg-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <i className="ri-flask-line fs-5 text-primary" />
                        <h6 className="mb-0 text-primary">{t('feeding.preparation.form.ingredients')}</h6>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <span className="small text-muted">
                            {t('feeding.preparation.form.batchTotal')}: <strong>{batchSize.toFixed(2)} kg</strong>
                        </span>
                        <Button color="primary" size="sm" type="button" onClick={openSelectIngredients}>
                            <i className="ri-add-line me-1" />{t('feeding.preparation.form.selectIngredients')}
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="p-3">
                    {ingredients.length === 0 ? (
                        <div className="text-center text-muted py-4">
                            <i className="ri-inbox-line fs-3 d-block mb-2" />
                            {t('feeding.preparation.form.noIngredientsYet')}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>{t('feeding.preparation.form.column.ingredient')}</th>
                                            <th style={{ width: 180 }}>{t('feeding.preparation.form.column.quantity')}</th>
                                            <th style={{ width: 160 }}>{t('feeding.preparation.form.column.percentage')}</th>
                                            <th style={{ width: 140 }} className="text-end">{t('feeding.preparation.form.column.avgPrice')}</th>
                                            <th style={{ width: 140 }} className="text-end">{t('feeding.preparation.form.column.subtotal')}</th>
                                            <th style={{ width: 50 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredients.map(row => {
                                            const subtotal = row.quantity * row.averagePrice;
                                            const isOriginal = !!originalRecipePercentages[row.productId];
                                            const origPct = originalRecipePercentages[row.productId];
                                            const changedFromOriginal = isOriginal && origPct !== undefined && Math.abs(row.percentage - origPct) > 0.5;
                                            return (
                                                <tr key={row.productId}>
                                                    <td style={{ verticalAlign: 'top', paddingTop: '0.6rem' }}>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <img src={row.image || noImageUrl} alt="" style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 4 }} />
                                                            <div>
                                                                <div className="fw-semibold">{row.name}</div>
                                                                <div className="text-muted small">{row.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <div className="input-group input-group-sm">
                                                            <Input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={row.quantityInput}
                                                                onChange={e => handleQuantityChange(row.productId, e.target.value)}
                                                                placeholder="0.00"
                                                            />
                                                            <span className="input-group-text">{row.unit_measurement}</span>
                                                        </div>
                                                        <small className="d-block mt-1" style={{ minHeight: '1.1em', visibility: 'hidden' }}>&nbsp;</small>
                                                    </td>
                                                    <td style={{ verticalAlign: 'top' }}>
                                                        <div className="input-group input-group-sm">
                                                            <Input
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={row.percentageInput}
                                                                onChange={e => handlePercentageChange(row.productId, e.target.value)}
                                                                placeholder="0.00"
                                                            />
                                                            <span className="input-group-text">%</span>
                                                        </div>
                                                        <small
                                                            className="text-warning d-block mt-1"
                                                            style={{ minHeight: '1.1em', visibility: changedFromOriginal ? 'visible' : 'hidden' }}
                                                        >
                                                            {changedFromOriginal && origPct !== undefined
                                                                ? t('feeding.preparation.form.originalPct', { val: origPct.toFixed(2) })
                                                                : ' '}
                                                        </small>
                                                    </td>
                                                    <td className="text-end" style={{ verticalAlign: 'top', paddingTop: '0.6rem' }}>${row.averagePrice.toFixed(2)}</td>
                                                    <td className="text-end fw-semibold" style={{ verticalAlign: 'top', paddingTop: '0.6rem' }}>${subtotal.toFixed(2)}</td>
                                                    <td className="text-center" style={{ verticalAlign: 'top', paddingTop: '0.4rem' }}>
                                                        <Button
                                                            type="button"
                                                            color="link"
                                                            className="p-0 text-danger"
                                                            onClick={() => {
                                                                const filtered = ingredients.filter(i => i.productId !== row.productId);
                                                                setIngredients(recomputePercentages(filtered));
                                                                setPreselectedIds(filtered.map(r => r.productId));
                                                            }}
                                                            title={t('common.button.remove')}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-light">
                                            <td className="fw-bold">{t('feeding.preparation.form.total')}</td>
                                            <td className="fw-bold">{batchSize.toFixed(2)} kg</td>
                                            <td className="fw-bold">
                                                <span className={sumIs100 ? 'text-success' : 'text-warning'}>
                                                    {totalPercentage.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td></td>
                                            <td className="text-end fw-bold">${totalCostEstimated.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="mt-3">
                                <Progress
                                    value={Math.min(totalPercentage, 100)}
                                    color={sumIs100 ? 'success' : totalPercentage > 100 ? 'danger' : 'warning'}
                                    style={{ height: 8 }}
                                />
                                <small className="text-muted d-block mt-1">
                                    {sumIs100
                                        ? <><i className="ri-check-line text-success me-1" />{t('feeding.preparation.form.sumOk')}</>
                                        : t('feeding.preparation.form.sumNote', { val: totalPercentage.toFixed(2) })
                                    }
                                </small>
                            </div>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Producido + fecha + responsable */}
            <div className="d-flex gap-3 mt-3">
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
                    <small className="text-muted">{t('feeding.preparation.form.field.producedHint')}</small>
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.date')}</Label>
                    <DatePicker
                        className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                        value={formik.values.date ?? undefined}
                        onChange={(d: Date[]) => { if (d[0]) formik.setFieldValue('date', d[0]); }}
                        options={{ dateFormat: 'd/m/Y' }}
                    />
                </div>
            </div>

            <div className="d-flex gap-3 mt-3">
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.responsible')}</Label>
                    <Input type="text" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                </div>
                <div className="w-50">
                    <Label className="form-label">{t('feeding.preparation.form.field.notes')}</Label>
                    <Input
                        type="text"
                        name="notes"
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        placeholder={t('feeding.preparation.form.field.notesPlaceholder')}
                    />
                </div>
            </div>

            {/* Resumen del batch */}
            {batchSize > 0 && formik.values.actualYield > 0 && (
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
                                <div className="fs-5 fw-bold text-success">${costPerKgEstimated.toFixed(2)}</div>
                            </div>
                            <div className="col border-start">
                                <div className="text-muted small">{t('feeding.preparation.form.realYield')}</div>
                                <div className="fs-5 fw-bold text-primary">
                                    {batchSize > 0 ? ((formik.values.actualYield / batchSize) * 100).toFixed(2) : '0.00'}%
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button color="secondary" outline onClick={onCancel} type="button">{t('common.button.cancel')}</Button>
                <Button color="success" type="submit" disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? <Spinner size="sm" /> : (<><i className="ri-check-line me-2" />{t('feeding.administration.form.action.register')}</>)}
                </Button>
            </div>

            {/* Modal: selección de ingredientes */}
            <Modal size="xl" isOpen={selectIngredientsOpen} toggle={() => setSelectIngredientsOpen(false)} backdrop="static" centered>
                <ModalHeader toggle={() => setSelectIngredientsOpen(false)}>
                    {t('feeding.preparation.form.selectIngredientsTitle')}
                </ModalHeader>
                <ModalBody>
                    <SelectableCustomTable
                        columns={productColumns}
                        data={products}
                        showPagination
                        rowsPerPage={6}
                        initialSelectedIds={preselectedIds}
                        onSelect={(rows) => { handleIngredientsSelection(rows); }}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => setSelectIngredientsOpen(false)}>
                        {t('common.button.done')}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal: opciones de guardado */}
            <Modal isOpen={modals.saveOptions} toggle={() => toggleModal('saveOptions', false)} backdrop="static" centered size="lg">
                <ModalHeader toggle={() => toggleModal('saveOptions', false)}>
                    {t('feeding.preparation.form.saveOptions.title')}
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted small">{t('feeding.preparation.form.saveOptions.intro')}</p>

                    <div className="d-flex flex-column gap-2">
                        <label className={`border rounded p-3 d-flex gap-3 align-items-start ${recipeSaveMode === 'none' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                            <Input
                                type="radio"
                                name="saveMode"
                                checked={recipeSaveMode === 'none'}
                                onChange={() => setRecipeSaveMode('none')}
                                className="mt-1"
                            />
                            <div className="flex-grow-1">
                                <div className="fw-semibold">{t('feeding.preparation.form.saveOptions.none.title')}</div>
                                <small className="text-muted d-block mb-2">{t('feeding.preparation.form.saveOptions.none.desc')}</small>
                                {recipeSaveMode === 'none' && !selectedRecipe && (
                                    <div className="mt-2">
                                        <Label className="form-label small mb-1">{t('feeding.preparation.form.saveOptions.none.customNameLabel')}</Label>
                                        <Input
                                            type="text"
                                            bsSize="sm"
                                            value={customName}
                                            onChange={e => setCustomName(e.target.value)}
                                            placeholder={t('feeding.preparation.form.saveOptions.none.customNamePlaceholder')}
                                        />
                                    </div>
                                )}
                            </div>
                        </label>

                        <label className={`border rounded p-3 d-flex gap-3 align-items-start ${recipeSaveMode === 'new' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                            <Input
                                type="radio"
                                name="saveMode"
                                checked={recipeSaveMode === 'new'}
                                onChange={handleSelectNewRecipeMode}
                                className="mt-1"
                            />
                            <div className="flex-grow-1">
                                <div className="fw-semibold">{t('feeding.preparation.form.saveOptions.new.title')}</div>
                                <small className="text-muted d-block mb-2">{t('feeding.preparation.form.saveOptions.new.desc')}</small>
                                {recipeSaveMode === 'new' && (
                                    <div className="d-flex gap-2 flex-wrap mt-2">
                                        <div className="flex-grow-1" style={{ minWidth: 140 }}>
                                            <Label className="form-label small mb-1">{t('feeding.package.form.field.code')}</Label>
                                            <div className="input-group input-group-sm">
                                                <Input
                                                    type="text"
                                                    bsSize="sm"
                                                    value={newRecipeCode}
                                                    onChange={e => setNewRecipeCode(e.target.value)}
                                                    placeholder={t('feeding.package.form.field.codePlaceholder')}
                                                    disabled={fetchingNextCode}
                                                />
                                                {fetchingNextCode && (
                                                    <span className="input-group-text"><Spinner size="sm" /></span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-grow-1" style={{ minWidth: 200 }}>
                                            <Label className="form-label small mb-1">{t('feeding.package.form.field.name')}</Label>
                                            <Input
                                                type="text"
                                                bsSize="sm"
                                                value={newRecipeName}
                                                onChange={e => setNewRecipeName(e.target.value)}
                                                placeholder={t('feeding.package.form.field.namePlaceholder')}
                                            />
                                        </div>
                                        <div style={{ minWidth: 150 }}>
                                            <Label className="form-label small mb-1">{t('feeding.package.form.field.stage')}</Label>
                                            <Input
                                                type="select"
                                                bsSize="sm"
                                                value={newRecipeStage}
                                                onChange={e => setNewRecipeStage(e.target.value)}
                                            >
                                                <option value="general">{t('feeding.stage.general')}</option>
                                                <option value="piglet">{t('feeding.stage.piglet')}</option>
                                                <option value="weaning">{t('feeding.stage.weaning')}</option>
                                                <option value="fattening">{t('feeding.stage.fattening')}</option>
                                                <option value="breeder">{t('feeding.stage.breeder')}</option>
                                            </Input>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </label>

                        {selectedRecipe && recipeWasModified && (
                            <label className={`border rounded p-3 d-flex gap-3 align-items-start ${recipeSaveMode === 'update' ? 'border-primary bg-primary bg-opacity-10' : ''}`} style={{ cursor: 'pointer' }}>
                                <Input
                                    type="radio"
                                    name="saveMode"
                                    checked={recipeSaveMode === 'update'}
                                    onChange={() => setRecipeSaveMode('update')}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="fw-semibold">
                                        {t('feeding.preparation.form.saveOptions.update.title')}
                                    </div>
                                    <small className="text-muted">
                                        {t('feeding.preparation.form.saveOptions.update.desc', { name: selectedRecipe.name })}
                                    </small>
                                </div>
                            </label>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => toggleModal('saveOptions', false)} disabled={savingRecipe}>
                        {t('common.button.cancel')}
                    </Button>
                    <Button color="success" onClick={submitPreparation} disabled={savingRecipe}>
                        {savingRecipe ? <Spinner size="sm" /> : (<><i className="ri-check-line me-2" />{t('feeding.preparation.form.saveOptions.confirm')}</>)}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('feeding.preparation.form.success')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('feeding.preparation.form.error.generic')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={4000} />
        </form>
    );
};

export default FeedPreparationForm;
