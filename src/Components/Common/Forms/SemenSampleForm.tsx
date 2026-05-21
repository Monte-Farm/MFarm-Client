import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { ExtractionData, SemenSample } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, Table, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from "react-icons/fi";
import { Column } from "common/data/data_types";
import SuccessModal from "../Shared/SuccessModal";
import { HttpStatusCode } from "axios";
import DatePicker from "react-flatpickr";
import SimpleBar from "simplebar-react";
import PigDetailsModal from "../Details/DetailsPigModal";
import SelectableTable from "../Tables/SelectableTable";
import { useTranslation } from "react-i18next";

interface SemenSampleFormProps {
    initialData?: SemenSample;
    preselectedExtraction?: ExtractionData;
    onSave: () => void;
    onCancel: () => void;
}

const SemenSampleForm: React.FC<SemenSampleFormProps> = ({ initialData, preselectedExtraction, onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [extractions, setExtractions] = useState<any[]>([])
    const [activeStep, setActiveStep] = useState<number>(preselectedExtraction ? 2 : 1);
    const [passedarrowSteps, setPassedarrowSteps] = useState(preselectedExtraction ? [1, 2] : [1]);
    const [alertExtractionEmpty, setAlertExtractionEmpty] = useState<boolean>(false)
    const [doseSize, setDoseSize] = useState<number>(0);
    const [selectedExtraction, setSelectedExtraction] = useState<ExtractionData | null>(null)
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);
    type SampleOrigin = 'internal' | 'external' | null;
    const [origin, setOrigin] = useState<SampleOrigin>(preselectedExtraction ? 'internal' : null);
    const [externalSemenVolume, setExternalSemenVolume] = useState<number>(0);
    const [externalUnit, setExternalUnit] = useState<string>('ml');
    const [externalLotCode, setExternalLotCode] = useState<string>('');
    const [internalLotCode, setInternalLotCode] = useState<string>('');
    const prevSupplierLotRef = useRef<string>('');
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('');
    const [labProducts, setLabProducts] = useState<any[]>([]);
    const [semenCatalogProducts, setSemenCatalogProducts] = useState<any[]>([]);

    const extractionsColumns: Column<any>[] = [
        { header: t('laboratory.sample.form.column.batch', { defaultValue: 'Lote' }), accessor: 'batch', type: 'text', isFilterable: true },
        {
            header: t('laboratory.sample.form.column.boar', { defaultValue: 'Verraco' }),
            accessor: 'boar',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIdSelectedPig(row.boar?._id);
                        toggleModal();
                    }}
                >
                    {row.boar?.code} ↗
                </Button>
            )
        },
        { header: t('laboratory.sample.form.column.extractionDate', { defaultValue: 'Fecha de extracción' }), accessor: 'date', type: 'date', isFilterable: false },
        {
            header: t('laboratory.sample.form.column.volume', { defaultValue: 'Volumen' }),
            accessor: 'volume',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row ? `${row.volume} ${row.unit_measurement}` : t('laboratory.sample.form.column.noVolume', { defaultValue: 'Sin volumen' })
        },
        {
            header: t('laboratory.sample.form.column.responsible', { defaultValue: 'Responsable' }),
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : t('laboratory.sample.form.column.noResponsible', { defaultValue: 'Sin responsable' })
        },
        { header: t('laboratory.sample.form.column.location', { defaultValue: 'Ubicacion de la extracción' }), accessor: 'extraction_location', type: 'text', isFilterable: true },
    ];

    const toggleModal = () => setModalOpen(!modalOpen);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 2000);
    }

    const handleError = (error: any, message: string) => {
        logger.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const validationSchema = useMemo(() => Yup.object({
        extraction_id: origin === 'internal'
            ? Yup.string().required(t('laboratory.sample.form.validation.selectExtraction', { defaultValue: 'Por favor seleccione una extracción' }))
            : Yup.string().notRequired(),
        supplier: origin === 'external'
            ? Yup.object({
                name: Yup.string().required(t('laboratory.sample.form.validation.supplierName', { defaultValue: 'Por favor, ingrese el nombre del proveedor' })),
                lot: Yup.string().required(t('laboratory.sample.form.validation.supplierLot', { defaultValue: 'Por favor, ingrese el lote del proveedor' })),
                purchase_date: Yup.date().nullable().required(t('laboratory.sample.form.validation.purchaseDate', { defaultValue: 'Por favor, ingrese la fecha de compra' })),
            })
            : Yup.object().notRequired(),
        concentration_million: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        motility_percent: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        vitality_percent: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .max(100, t('laboratory.sample.form.validation.max100', { defaultValue: 'El número no puede ser mayor a 100' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        abnormal_percent: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .max(100, t('laboratory.sample.form.validation.max100', { defaultValue: 'El número no puede ser mayor a 100' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        pH: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        temperature: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.requiredNumber', { defaultValue: 'Por favor, ingrese un número' })),
        lab_supplies: origin === 'internal'
            ? Yup.array()
                .min(1, t('laboratory.sample.form.validation.labSuppliesRequired', { defaultValue: 'Seleccione al menos un insumo de laboratorio' }))
                .required(t('laboratory.sample.form.validation.labSuppliesRequired', { defaultValue: 'Seleccione al menos un insumo de laboratorio' }))
            : Yup.array().notRequired(),
        conservation_method: Yup.string().required(t('laboratory.sample.form.validation.conservationMethod', { defaultValue: 'Por favor, ingrese el método de conservación' })),
        expiration_date: Yup.date().min(new Date(new Date().setHours(0, 0, 0, 0)), t('laboratory.sample.form.validation.expirationDate', { defaultValue: 'La fecha de expiración no puede ser pasada' })).required(t('laboratory.sample.form.validation.expirationDateRequired', { defaultValue: 'Por favor, ingrese la fecha de expiración' })),
        post_dilution_motility: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .notRequired(),
        alert_hours_before_expiration: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.alertHours', { defaultValue: 'Por favor, ingrese un numero' })),
    }), [origin, t]);

    const formik = useFormik<SemenSample>({
        initialValues: initialData || {
            origin: 'internal',
            farm: userLogged.farm_assigned || '',
            extraction_id: preselectedExtraction?._id || '',
            supplier: { name: '', lot: '', purchase_date: null },
            concentration_million: 0,
            motility_percent: 0,
            vitality_percent: 0,
            abnormal_percent: 0,
            pH: 0,
            temperature: 0,
            lab_supplies: [],
            semen_product_id: '',
            conservation_method: '',
            expiration_date: null,
            post_dilution_motility: undefined,
            doses: [],
            technician: userLogged._id || '',
            total_doses: 0,
            available_doses: 0,
            lot_status: 'available',
            alert_hours_before_expiration: 12
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const payload: any = {
                    origin,
                    farm: userLogged.farm_assigned,
                    technician: values.technician,
                    concentration_million: values.concentration_million,
                    motility_percent: values.motility_percent,
                    vitality_percent: values.vitality_percent,
                    abnormal_percent: values.abnormal_percent,
                    pH: values.pH,
                    temperature: values.temperature,
                    conservation_method: values.conservation_method,
                    expiration_date: values.expiration_date,
                    post_dilution_motility: values.post_dilution_motility,
                    doses: values.doses,
                    total_doses: values.total_doses,
                    available_doses: values.available_doses,
                    lot_status: values.lot_status,
                    alert_hours_before_expiration: values.alert_hours_before_expiration,
                };

                if (origin === 'internal') {
                    payload.extraction_id = values.extraction_id;
                    payload.lab_supplies = values.lab_supplies;
                    if (values.semen_product_id) payload.semen_product_id = values.semen_product_id;
                } else {
                    payload.supplier = values.supplier;
                    payload.semen_volume = externalSemenVolume;
                    payload.semen_unit = externalUnit;
                }

                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/semen_sample/create`, payload);
                if (response.status === HttpStatusCode.Created) {
                    const eventMessage = origin === 'external'
                        ? `Muestras de semen externas del proveedor ${values.supplier?.name} registradas`
                        : `Muestras de semen del lote ${extractions.find(e => e._id === values.extraction_id)?.batch} registradas`;
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: eventMessage
                    });
                    setSuccessModalOpen(true)
                }
            } catch (err: any) {
                const missing = err?.response?.data?.missing;
                if (missing && Array.isArray(missing) && missing.length > 0) {
                    const details = missing.map((m: any) => {
                        const product = formik.values.lab_supplies.find(s => s.product_id === m.id);
                        const name = product?.product_name ?? m.id;
                        return `${name}: ${t('laboratory.sample.form.error.stockRequired', { defaultValue: 'requerido' })} ${m.required}, ${t('laboratory.sample.form.error.stockAvailable', { defaultValue: 'disponible' })} ${m.available}`;
                    }).join(' | ');
                    handleError(err, `${t('laboratory.sample.form.error.insufficientStock', { defaultValue: 'Stock insuficiente' })}: ${details}`);
                } else {
                    handleError(err, t('laboratory.sample.form.error', { defaultValue: 'Error al registrar la muestra. Por favor, inténtelo nuevamente.' }));
                }
            } finally {
                setSubmitting(false);
            }
        }
    })

    const selectOrigin = (newOrigin: SampleOrigin) => {
        setOrigin(newOrigin);
        formik.setFieldValue('origin', newOrigin ?? '');
        if (newOrigin === 'external') {
            formik.setFieldValue('extraction_id', '');
            formik.setFieldValue('doses', []);
            setSelectedExtraction(null);
        } else if (newOrigin === 'internal') {
            formik.setFieldValue('supplier', { name: '', lot: '', purchase_date: null });
            setExternalSemenVolume(0);
            fetchExtractions();
        } else {
            // reset to pick again
            formik.setFieldValue('extraction_id', '');
            formik.setFieldValue('supplier', { name: '', lot: '', purchase_date: null });
            formik.setFieldValue('doses', []);
            setSelectedExtraction(null);
            setExternalSemenVolume(0);
            setExternalLotCode('');
            setInternalLotCode('');
        }
    };

    const fetchMainWarehouse = async () => {
        if (!configContext || !userLogged.farm_assigned) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            const warehouseId = response.data.data;
            setMainWarehouseId(warehouseId);
            return warehouseId;
        } catch (error) {
            handleError(error, t('laboratory.sample.form.fetchError.fetchWarehouse', { defaultValue: 'Error al obtener el almacén' }));
        }
    };

    const fetchLabProducts = async (warehouseId: string) => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`);
            const allProducts: any[] = response.data.data;
            const labOnly = allProducts
                .filter((p: any) => p.product?.category === 'laboratory' && p.quantity > 0)
                .map((p: any) => ({
                    id: p.product?._id,
                    code: p.product?.id,
                    name: p.product?.name,
                    category: p.product?.category,
                    unit_measurement: p.product?.unit_measurement,
                    quantity: p.quantity,
                    averagePrice: p.averagePrice ?? 0,
                }));
            setLabProducts(labOnly);
        } catch (error) {
            handleError(error, t('laboratory.sample.form.fetchError.fetchLabProducts', { defaultValue: 'Error al obtener los insumos de laboratorio' }));
        }
    };

    const fetchSemenCatalogProducts = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/product`);
            const all: any[] = response.data.data ?? response.data;
            setSemenCatalogProducts(all.filter((p: any) => p.category === 'laboratory'));
        } catch (error) {
            handleError(error, t('laboratory.sample.form.fetchError.fetchLabProducts', { defaultValue: 'Error al obtener los productos del catálogo' }));
        }
    };

    const addLabSupply = () => {
        formik.setFieldValue('lab_supplies', [
            ...formik.values.lab_supplies,
            { product_id: '', product_name: '', quantity: 1, unit_measurement: '', unit_price: 0 }
        ]);
    };

    const removeLabSupply = (index: number) => {
        const updated = formik.values.lab_supplies.filter((_, i) => i !== index);
        formik.setFieldValue('lab_supplies', updated);
    };

    const updateLabSupply = (index: number, field: string, value: any) => {
        formik.setFieldValue(`lab_supplies[${index}].${field}`, value);
    };

    const selectLabSupplyProduct = (index: number, productId: string) => {
        const product = labProducts.find(p => p.id === productId);
        if (!product) return;
        formik.setFieldValue(`lab_supplies[${index}].product_id`, product.id);
        formik.setFieldValue(`lab_supplies[${index}].product_name`, product.name);
        formik.setFieldValue(`lab_supplies[${index}].unit_measurement`, product.unit_measurement);
        formik.setFieldValue(`lab_supplies[${index}].unit_price`, product.averagePrice ?? 0);
    };

    const estimatedCost = formik.values.lab_supplies.reduce(
        (acc, s) => acc + (s.quantity || 0) * (s.unit_price || 0), 0
    );

    const generateLotCode = (supplierLot: string) => {
        const uid = Date.now().toString(36).toUpperCase();
        return supplierLot ? `${supplierLot}-${uid}` : uid;
    };

    const checkStep1 = async () => {
        if (!origin) return false;
        if (origin === 'internal') {
            if (!formik.values.extraction_id) {
                setAlertExtractionEmpty(true);
                setTimeout(() => setAlertExtractionEmpty(false), 4000);
                return false;
            }
        } else {
            const s = formik.values.supplier;
            if (!s?.name || !s?.lot || !s?.purchase_date || externalSemenVolume <= 0) {
                showAlert('danger', t('laboratory.sample.form.alert.fillSupplierFields', { defaultValue: 'Por favor complete todos los datos del proveedor y el volumen de semen' }));
                return false;
            }
        }
        // Load lab products and semen catalog when moving to step 2 if not already loaded
        if (labProducts.length === 0) {
            const wid = mainWarehouseId || await fetchMainWarehouse();
            if (wid) await fetchLabProducts(wid);
        }
        if (semenCatalogProducts.length === 0) {
            await fetchSemenCatalogProducts();
        }
        toggleArrowTab(2);
        return true;
    }

    const checkSampleData = async () => {
        formik.setTouched({
            concentration_million: true,
            motility_percent: true,
            vitality_percent: true,
            abnormal_percent: true,
            pH: true,
            temperature: true,
            conservation_method: true,
            expiration_date: true,
            alert_hours_before_expiration: true
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err: any) {
            if (err.errors && err.errors.length > 0) {
                showAlert('danger', `${t('laboratory.sample.form.alert.requiredFieldsDetail', { defaultValue: 'Por favor complete los campos requeridos:' })} ${err.errors.slice(0, 2).join(', ')}`);
            } else {
                showAlert('danger', t('laboratory.sample.form.alert.requiredFields', { defaultValue: 'Por favor complete todos los campos requeridos antes de continuar' }));
            }
        }
    };

    const fetchExtractions = async () => {
        if (!configContext || !userLogged) return;
        try {
            if (preselectedExtraction) {
                setExtractions([{ ...preselectedExtraction, id: preselectedExtraction._id }]);
            } else {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_sample_not_registered/${userLogged.farm_assigned}`)
                const extractionsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
                setExtractions(extractionsWithId)
            }
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo mas tarde')
        }
    }

    useEffect(() => {
        if (preselectedExtraction) {
            fetchExtractions();
            fetchMainWarehouse().then(wid => { if (wid) fetchLabProducts(wid); });
            fetchSemenCatalogProducts();
        }
    }, [])

    // Dose calculation effect — diluentTotal from lab supplies (internal only; external uses semen volume alone)
    useEffect(() => {
        const diluentTotal = origin === 'internal'
            ? formik.values.lab_supplies.reduce((acc, s) => acc + (s.quantity || 0), 0)
            : 0;

        if (origin === 'internal') {
            const selected = extractions.find(e => e._id === formik.values.extraction_id);

            if (!selected || selected._id !== selectedExtraction?._id) {
                setInternalLotCode('');
            }
            setSelectedExtraction(selected || null);

            if (!selected) {
                formik.setFieldValue('doses', []);
                return;
            }

            const currentLotCode = internalLotCode || generateLotCode(selected.batch);
            if (!internalLotCode) setInternalLotCode(currentLotCode);

            const semenTotal = selected.volume;
            const totalVolume = semenTotal + diluentTotal;

            if (doseSize <= 0) {
                formik.setFieldValue('doses', []);
                return;
            }

            const dosesCount = Math.floor(totalVolume / doseSize);
            const remainder = totalVolume % doseSize;
            const semenRatio = totalVolume > 0 ? semenTotal / totalVolume : 1;
            const diluentRatio = totalVolume > 0 ? diluentTotal / totalVolume : 0;
            const unit = selected.unit_measurement;
            const batchCode = currentLotCode;

            const dosesArray = Array.from({ length: dosesCount }, (_, i) => ({
                code: `${batchCode}-${(i + 1).toString().padStart(4, '0')}`,
                semen_volume: Number((doseSize * semenRatio).toFixed(2)),
                diluent_volume: Number((doseSize * diluentRatio).toFixed(2)),
                total_volume: doseSize,
                unit_measurement: unit,
                status: 'available' as const,
            }));

            if (remainder > 0) {
                dosesArray.push({
                    code: `${batchCode}-${(dosesArray.length + 1).toString().padStart(4, '0')}`,
                    semen_volume: Number((remainder * semenRatio).toFixed(2)),
                    diluent_volume: Number((remainder * diluentRatio).toFixed(2)),
                    total_volume: remainder,
                    unit_measurement: unit,
                    status: 'available' as const,
                });
            }

            formik.setFieldValue('doses', dosesArray);
            formik.setFieldValue('total_doses', dosesArray.length);
            formik.setFieldValue('available_doses', dosesArray.length);
        } else {
            const semenTotal = externalSemenVolume;
            const totalVolume = semenTotal + diluentTotal;
            const supplierLot = formik.values.supplier?.lot || '';
            const unit = externalUnit;

            if (supplierLot !== prevSupplierLotRef.current) {
                prevSupplierLotRef.current = supplierLot;
                setExternalLotCode('');
                formik.setFieldValue('doses', []);
                return;
            }

            const currentLotCode = externalLotCode || generateLotCode(supplierLot || 'EXT');
            if (!externalLotCode) setExternalLotCode(currentLotCode);
            const batchCode = currentLotCode;

            if (doseSize <= 0 || semenTotal <= 0) {
                formik.setFieldValue('doses', []);
                return;
            }

            const dosesCount = Math.floor(totalVolume / doseSize);
            const remainder = totalVolume % doseSize;
            const semenRatio = totalVolume > 0 ? semenTotal / totalVolume : 1;
            const diluentRatio = totalVolume > 0 ? diluentTotal / totalVolume : 0;

            const dosesArray = Array.from({ length: dosesCount }, (_, i) => ({
                code: `${batchCode}-${(i + 1).toString().padStart(4, '0')}`,
                semen_volume: Number((doseSize * semenRatio).toFixed(2)),
                diluent_volume: Number((doseSize * diluentRatio).toFixed(2)),
                total_volume: doseSize,
                unit_measurement: unit,
                status: 'available' as const,
            }));

            if (remainder > 0) {
                dosesArray.push({
                    code: `${batchCode}-${(dosesArray.length + 1).toString().padStart(4, '0')}`,
                    semen_volume: Number((remainder * semenRatio).toFixed(2)),
                    diluent_volume: Number((remainder * diluentRatio).toFixed(2)),
                    total_volume: remainder,
                    unit_measurement: unit,
                    status: 'available' as const,
                });
            }

            formik.setFieldValue('doses', dosesArray);
            formik.setFieldValue('total_doses', dosesArray.length);
            formik.setFieldValue('available_doses', dosesArray.length);
        }
    }, [formik.values.extraction_id, formik.values.supplier?.lot, formik.values.lab_supplies, extractions, doseSize, origin, externalSemenVolume, externalUnit, externalLotCode, internalLotCode]);

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified disabled">
                        {!preselectedExtraction && (
                            <NavItem>
                                <NavLink
                                    href='#'
                                    id="step-originsource-tab"
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    onClick={() => toggleArrowTab(1)}
                                    aria-selected={activeStep === 1}
                                    disabled
                                >
                                    {origin === 'internal'
                                        ? t('laboratory.sample.form.step.selectExtraction', { defaultValue: 'Selección de extracción' })
                                        : origin === 'external'
                                            ? t('laboratory.sample.form.section.supplier', { defaultValue: 'Datos del proveedor' })
                                            : t('laboratory.sample.form.step.selectOrigin', { defaultValue: 'Origen de la muestra' })}
                                </NavLink>
                            </NavItem>
                        )}

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-sampleinfo-tab"
                                className={classnames({ active: activeStep === 2, done: activeStep > 2 })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                disabled
                            >
                                {t('laboratory.sample.form.step.sampleInfo', { defaultValue: 'Información de la muestra' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-dosesinfo-tab"
                                className={classnames({ active: activeStep === 3, done: activeStep > 3 })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                disabled
                            >
                                {t('laboratory.sample.form.step.dosesInfo', { defaultValue: 'Información de las dosis' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({ active: activeStep === 4, done: activeStep > 4 })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                disabled
                            >
                                {t('laboratory.sample.form.step.summary', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    {!preselectedExtraction && (
                        <TabPane id="step-originsource-tab" tabId={1}>
                            {/* Sin selección: dos tarjetas grandes */}
                            {!origin ? (
                                <div className="d-flex flex-column align-items-center gap-4 py-4">
                                    <h5 className="text-muted">{t('laboratory.sample.form.field.originLabel', { defaultValue: '¿Cuál es el origen de la muestra?' })}</h5>
                                    <div className="d-flex gap-4 w-75">
                                        <div
                                            className="w-50 text-center border rounded shadow-sm"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => selectOrigin('internal')}
                                        >
                                            <div className="py-5 px-3">
                                                <i className="ri-drop-line text-primary" style={{ fontSize: '3rem' }}></i>
                                                <h5 className="mt-3">{t('laboratory.sample.origin.internal', { defaultValue: 'Interna' })}</h5>
                                                <p className="text-muted mb-0">{t('laboratory.sample.form.field.originInternal', { defaultValue: 'Extracción propia registrada en el sistema' })}</p>
                                            </div>
                                        </div>
                                        <div
                                            className="w-50 text-center border rounded shadow-sm"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => selectOrigin('external')}
                                        >
                                            <div className="py-5 px-3">
                                                <i className="ri-store-2-line text-success" style={{ fontSize: '3rem' }}></i>
                                                <h5 className="mt-3">{t('laboratory.sample.origin.external', { defaultValue: 'Externa' })}</h5>
                                                <p className="text-muted mb-0">{t('laboratory.sample.form.field.originExternal', { defaultValue: 'Comprada a un proveedor externo' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : origin === 'internal' ? (
                                /* Interna: tabla de extracciones */
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="text-muted mb-0">{t('laboratory.sample.form.step.selectExtraction', { defaultValue: 'Seleccione una extracción' })}</h5>
                                        <Button size="sm" onClick={() => selectOrigin(null)}>
                                            <i className="ri-arrow-go-back-line me-1"></i>
                                            {t('laboratory.sample.form.action.changeOrigin', { defaultValue: 'Cambiar origen' })}
                                        </Button>
                                    </div>
                                    <SelectableTable data={extractions} columns={extractionsColumns} selectionMode="single" showPagination={true} rowsPerPage={15} onSelect={(rows) => formik.setFieldValue('extraction_id', rows[0]?._id)} />
                                    {alertExtractionEmpty && (
                                        <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                            <FiXCircle size={22} />
                                            <span className="flex-grow-1 text-black">{t('laboratory.sample.form.alert.selectExtraction', { defaultValue: 'Por favor, seleccione una extracción' })}</span>
                                            <Button close onClick={() => setAlertExtractionEmpty(false)} />
                                        </Alert>
                                    )}
                                    <div className="mt-4 d-flex">
                                        <Button className="ms-auto" onClick={() => checkStep1()}>
                                            {t('laboratory.sample.form.action.next', { defaultValue: 'Siguiente' })}
                                            <i className="ri-arrow-right-line ms-2" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Externa: campos del proveedor */
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="text-muted mb-0">{t('laboratory.sample.form.section.supplier', { defaultValue: 'Datos del proveedor' })}</h5>
                                        <Button size="sm" onClick={() => selectOrigin(null)}>
                                            <i className="ri-arrow-go-back-line me-1"></i>
                                            {t('laboratory.sample.form.action.changeOrigin', { defaultValue: 'Cambiar origen' })}
                                        </Button>
                                    </div>
                                    <div className="card shadow-sm border-0 rounded-3 mb-4">
                                        <div className="card-body">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <Label htmlFor="supplier_name" className="form-label">{t('laboratory.sample.form.field.supplierName', { defaultValue: 'Nombre del proveedor' })}</Label>
                                                    <Input
                                                        type="text"
                                                        id="supplier_name"
                                                        name="supplier.name"
                                                        value={formik.values.supplier?.name || ''}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={(formik.touched.supplier as any)?.name && !!(formik.errors.supplier as any)?.name}
                                                        placeholder="Ej: Genética Ibérica S.A."
                                                    />
                                                    {(formik.touched.supplier as any)?.name && (formik.errors.supplier as any)?.name && (
                                                        <FormFeedback>{(formik.errors.supplier as any).name}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="col-md-6">
                                                    <Label htmlFor="supplier_lot" className="form-label">{t('laboratory.sample.form.field.supplierLot', { defaultValue: 'Lote del proveedor' })}</Label>
                                                    <Input
                                                        type="text"
                                                        id="supplier_lot"
                                                        name="supplier.lot"
                                                        value={formik.values.supplier?.lot || ''}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={(formik.touched.supplier as any)?.lot && !!(formik.errors.supplier as any)?.lot}
                                                        placeholder="Ej: EXT-2025-004"
                                                    />
                                                    {(formik.touched.supplier as any)?.lot && (formik.errors.supplier as any)?.lot && (
                                                        <FormFeedback>{(formik.errors.supplier as any).lot}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="col-md-4">
                                                    <Label htmlFor="external_lot_code" className="form-label">
                                                        {t('laboratory.sample.form.field.sampleLotCode', { defaultValue: 'Código de lote de muestra' })}
                                                        <small className="text-muted ms-1">{t('laboratory.sample.form.field.sampleLotCodeHint', { defaultValue: '(único por registro)' })}</small>
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        id="external_lot_code"
                                                        value={externalLotCode}
                                                        onChange={(e) => setExternalLotCode(e.target.value)}
                                                        placeholder="Ej: EXT-MP7AZEVN"
                                                    />
                                                </div>

                                                <div className="col-md-4">
                                                    <Label htmlFor="purchase_date" className="form-label">{t('laboratory.sample.form.field.purchaseDate', { defaultValue: 'Fecha de compra' })}</Label>
                                                    <DatePicker
                                                        id="purchase_date"
                                                        className={`form-control ${(formik.touched.supplier as any)?.purchase_date && (formik.errors.supplier as any)?.purchase_date ? 'is-invalid' : ''}`}
                                                        value={formik.values.supplier?.purchase_date ?? undefined}
                                                        onChange={(date: Date[]) => {
                                                            if (date[0]) formik.setFieldValue('supplier.purchase_date', date[0]);
                                                        }}
                                                        options={{ dateFormat: 'd/m/Y' }}
                                                    />
                                                    {(formik.touched.supplier as any)?.purchase_date && (formik.errors.supplier as any)?.purchase_date && (
                                                        <FormFeedback className="d-block">{(formik.errors.supplier as any).purchase_date}</FormFeedback>
                                                    )}
                                                </div>

                                                <div className="col-md-4">
                                                    <Label htmlFor="external_semen_volume" className="form-label">{t('laboratory.sample.form.field.semenVolume', { defaultValue: 'Volumen de semen' })}</Label>
                                                    <div className="input-group">
                                                        <Input
                                                            type="number"
                                                            id="external_semen_volume"
                                                            value={externalSemenVolume}
                                                            onChange={(e) => setExternalSemenVolume(Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()}
                                                            placeholder="Ej: 250"
                                                            min={0}
                                                        />
                                                        <Input
                                                            type="select"
                                                            id="external_unit"
                                                            value={externalUnit}
                                                            onChange={(e) => setExternalUnit(e.target.value)}
                                                            style={{ maxWidth: '80px' }}
                                                        >
                                                            <option value="ml">ml</option>
                                                            <option value="L">L</option>
                                                            <option value="cc">cc</option>
                                                        </Input>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 d-flex">
                                        <Button className="ms-auto" onClick={() => checkStep1()}>
                                            {t('laboratory.sample.form.action.next', { defaultValue: 'Siguiente' })}
                                            <i className="ri-arrow-right-line ms-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabPane>
                    )}

                    <TabPane id="step-extractioninfo-tab" tabId={2}>
                        {/* Sección 1: Configuración de Dosis */}
                        <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 text-primary fw-bold">
                                    <i className="ri-settings-3-line me-2 text-primary"></i>
                                    {t('laboratory.sample.form.section.doseConfig', { defaultValue: 'Configuración de Dosis' })}
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <Label htmlFor="date" className="form-label">{t('laboratory.sample.form.field.expirationDate', { defaultValue: 'Fecha de expiración' })}</Label>
                                        <DatePicker
                                            id="date"
                                            className={`form-control ${formik.touched.expiration_date && formik.errors.expiration_date ? 'is-invalid' : ''}`}
                                            value={formik.values.expiration_date ?? undefined}
                                            onChange={(date: Date[]) => {
                                                if (date[0]) formik.setFieldValue('expiration_date', date[0]);
                                            }}
                                            options={{ dateFormat: 'd/m/Y' }}
                                        />
                                        {formik.touched.expiration_date && formik.errors.expiration_date && (
                                            <FormFeedback className="d-block">{formik.errors.expiration_date as string}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="dose_size" className="form-label">{t('laboratory.sample.form.field.doseSize', { defaultValue: 'Tamaño de dosis' })}</Label>
                                        <Input
                                            type="number"
                                            id="dose_size"
                                            name="dose_size"
                                            value={doseSize}
                                            onChange={(e) => setDoseSize(Number(e.target.value))}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="Ej: 10"
                                            min={1}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="alert_hours_before_expiration" className="form-label">{t('laboratory.sample.form.field.alertHours', { defaultValue: 'Alerta de expiración' })}</Label>
                                        <div className="input-group">
                                            <Input
                                                className="form-control"
                                                type="number"
                                                id="alert_hours_before_expiration"
                                                name="alert_hours_before_expiration"
                                                value={formik.values.alert_hours_before_expiration}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                onFocus={(e) => e.target.select()}
                                                invalid={formik.touched.alert_hours_before_expiration && !!formik.errors.alert_hours_before_expiration}
                                                min={0}
                                            />
                                            <span className="input-group-text">{t('laboratory.sample.form.field.alertHoursUnit', { defaultValue: 'horas antes' })}</span>
                                            {formik.touched.alert_hours_before_expiration && formik.errors.alert_hours_before_expiration && (
                                                <FormFeedback>{formik.errors.alert_hours_before_expiration}</FormFeedback>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Análisis de Semen */}
                        <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 text-success fw-bold">
                                    <i className="ri-test-tube-line me-2 text-success"></i>
                                    {t('laboratory.sample.form.section.semenAnalysis', { defaultValue: 'Análisis de Semen' })}
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <Label htmlFor="concentration_million" className="form-label">{t('laboratory.sample.form.field.concentration', { defaultValue: 'Concentración (millones)' })}</Label>
                                        <Input
                                            type="number"
                                            id="concentration_million"
                                            name="concentration_million"
                                            value={formik.values.concentration_million}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.concentration_million && !!formik.errors.concentration_million}
                                            placeholder="Ej: 250"
                                        />
                                        {formik.touched.concentration_million && formik.errors.concentration_million && (
                                            <FormFeedback>{formik.errors.concentration_million}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="motility_percent" className="form-label">{t('laboratory.sample.form.field.motility', { defaultValue: 'Motilidad (%)' })}</Label>
                                        <Input
                                            type="number"
                                            id="motility_percent"
                                            name="motility_percent"
                                            value={formik.values.motility_percent}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.motility_percent && !!formik.errors.motility_percent}
                                            placeholder="Ej: 80"
                                        />
                                        {formik.touched.motility_percent && formik.errors.motility_percent && (
                                            <FormFeedback>{formik.errors.motility_percent}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="vitality_percent" className="form-label">{t('laboratory.sample.form.field.vitality', { defaultValue: 'Vitalidad (%)' })}</Label>
                                        <Input
                                            type="number"
                                            id="vitality_percent"
                                            name="vitality_percent"
                                            value={formik.values.vitality_percent}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.vitality_percent && !!formik.errors.vitality_percent}
                                            placeholder="Ej: 85"
                                        />
                                        {formik.touched.vitality_percent && formik.errors.vitality_percent && (
                                            <FormFeedback>{formik.errors.vitality_percent}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="abnormal_percent" className="form-label">{t('laboratory.sample.form.field.abnormality', { defaultValue: 'Anomalías (%)' })}</Label>
                                        <Input
                                            type="number"
                                            id="abnormal_percent"
                                            name="abnormal_percent"
                                            value={formik.values.abnormal_percent}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.abnormal_percent && !!formik.errors.abnormal_percent}
                                            placeholder="Ej: 5"
                                        />
                                        {formik.touched.abnormal_percent && formik.errors.abnormal_percent && (
                                            <FormFeedback>{formik.errors.abnormal_percent}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="pH" className="form-label">{t('laboratory.sample.form.field.ph', { defaultValue: 'pH' })}</Label>
                                        <Input
                                            type="number"
                                            id="pH"
                                            name="pH"
                                            value={formik.values.pH}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.pH && !!formik.errors.pH}
                                            placeholder="Ej: 7.2"
                                        />
                                        {formik.touched.pH && formik.errors.pH && (
                                            <FormFeedback>{formik.errors.pH}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="temperature" className="form-label">{t('laboratory.sample.form.field.temperature', { defaultValue: 'Temperatura (°C)' })}</Label>
                                        <Input
                                            type="number"
                                            id="temperature"
                                            name="temperature"
                                            value={formik.values.temperature}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.temperature && !!formik.errors.temperature}
                                            placeholder="Ej: 37"
                                        />
                                        {formik.touched.temperature && formik.errors.temperature && (
                                            <FormFeedback>{formik.errors.temperature}</FormFeedback>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Insumos de Laboratorio — solo para origen interno */}
                        {origin === 'internal' && <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h6 className="mb-0 text-info fw-bold">
                                    <i className="ri-flask-line me-2 text-info"></i>
                                    {t('laboratory.sample.form.section.labSupplies', { defaultValue: 'Insumos de Laboratorio' })}
                                </h6>
                                <Button size="sm" color="info" outline onClick={addLabSupply} disabled={labProducts.length === 0}>
                                    <i className="ri-add-line me-1"></i>
                                    {t('laboratory.sample.form.labSupplies.add', { defaultValue: 'Agregar insumo' })}
                                </Button>
                            </div>
                            <div className="card-body">
                                {labProducts.length === 0 ? (
                                    <div className="text-center text-muted py-3">
                                        <i className="ri-archive-line fs-3 d-block mb-2"></i>
                                        {t('laboratory.sample.form.labSupplies.empty', { defaultValue: 'No hay insumos de laboratorio disponibles en el almacén. Registre productos con categoría "Laboratorio" primero.' })}
                                    </div>
                                ) : formik.values.lab_supplies.length === 0 ? (
                                    <p className="text-center text-muted mb-0">
                                        {t('laboratory.sample.form.labSupplies.none', { defaultValue: 'Presione "+ Agregar insumo" para añadir los materiales utilizados.' })}
                                    </p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>{t('laboratory.sample.form.labSupplies.col.product', { defaultValue: 'Producto' })}</th>
                                                    <th style={{ width: '130px' }}>{t('laboratory.sample.form.labSupplies.col.quantity', { defaultValue: 'Cantidad' })}</th>
                                                    <th style={{ width: '130px' }}>{t('laboratory.sample.form.labSupplies.col.unitPrice', { defaultValue: 'Precio unit.' })}</th>
                                                    <th style={{ width: '110px' }}>{t('laboratory.sample.form.labSupplies.col.subtotal', { defaultValue: 'Subtotal' })}</th>
                                                    <th style={{ width: '48px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formik.values.lab_supplies.map((supply, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <Input
                                                                type="select"
                                                                bsSize="sm"
                                                                value={supply.product_id}
                                                                onChange={(e) => selectLabSupplyProduct(index, e.target.value)}
                                                            >
                                                                <option value="">{t('laboratory.sample.form.labSupplies.selectProduct', { defaultValue: 'Seleccionar...' })}</option>
                                                                {labProducts.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.code} — {p.name} ({p.quantity} {p.unit_measurement})</option>
                                                                ))}
                                                            </Input>
                                                        </td>
                                                        <td>
                                                            <div className="input-group input-group-sm">
                                                                <Input
                                                                    type="number"
                                                                    bsSize="sm"
                                                                    value={supply.quantity}
                                                                    min={0}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => updateLabSupply(index, 'quantity', Number(e.target.value))}
                                                                />
                                                                {supply.unit_measurement && (
                                                                    <span className="input-group-text">{supply.unit_measurement}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="input-group input-group-sm">
                                                                <span className="input-group-text">$</span>
                                                                <Input
                                                                    type="number"
                                                                    bsSize="sm"
                                                                    value={supply.unit_price}
                                                                    min={0}
                                                                    step={0.01}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => updateLabSupply(index, 'unit_price', parseFloat(e.target.value))}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="fw-semibold text-success">
                                                            ${((supply.quantity || 0) * (supply.unit_price || 0)).toFixed(2)}
                                                        </td>
                                                        <td>
                                                            <Button size="sm" color="danger" outline onClick={() => removeLabSupply(index)}>
                                                                <i className="ri-delete-bin-line"></i>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {(formik.touched.lab_supplies as any) && (formik.errors.lab_supplies as any) && (
                                    <div className="text-danger small mt-2">{formik.errors.lab_supplies as string}</div>
                                )}
                                {formik.values.lab_supplies.length > 0 && (
                                    <div className="mt-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                                        <span className="text-muted fw-semibold">{t('laboratory.sample.form.labSupplies.estimatedCost', { defaultValue: 'Costo estimado:' })}</span>
                                        <span className="fw-bold text-success fs-5">${estimatedCost.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>}

                        {/* Sección 4: Conservación */}
                        <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 text-secondary fw-bold">
                                    <i className="ri-temp-cold-line me-2 text-secondary"></i>
                                    {t('laboratory.sample.form.section.conservation', { defaultValue: 'Conservación' })}
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    {origin === 'internal' && (
                                        <div className="col-md-12">
                                            <Label htmlFor="semen_product_id" className="form-label">
                                                {t('laboratory.sample.form.field.semenProduct', { defaultValue: 'Producto de semen en inventario' })}
                                                <small className="text-muted ms-2">{t('laboratory.sample.form.field.semenProductHint', { defaultValue: '(Las dosis producidas se sumarán a este producto)' })}</small>
                                            </Label>
                                            {semenCatalogProducts.length === 0 ? (
                                                <div className="alert alert-warning py-2 mb-0">
                                                    <i className="ri-alert-line me-2"></i>
                                                    {t('laboratory.sample.form.labSupplies.noSemenProduct', { defaultValue: 'No hay productos de categoría "Laboratorio" en el catálogo. Cree uno primero para registrar el inventario de semen.' })}
                                                </div>
                                            ) : (
                                                <Input
                                                    type="select"
                                                    id="semen_product_id"
                                                    name="semen_product_id"
                                                    value={formik.values.semen_product_id ?? ''}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                >
                                                    <option value="">{t('laboratory.sample.form.field.semenProductNone', { defaultValue: 'Sin registro en inventario (opcional)' })}</option>
                                                    {semenCatalogProducts.map(p => (
                                                        <option key={p._id ?? p.id} value={p._id ?? p.id}>{p.name} ({p.unit_measurement})</option>
                                                    ))}
                                                </Input>
                                            )}
                                        </div>
                                    )}
                                    <div className="col-md-6">
                                        <Label htmlFor="conservation_method" className="form-label">{t('laboratory.sample.form.field.conservationMethod', { defaultValue: 'Método de conservación' })}</Label>
                                        <Input
                                            type="select"
                                            id="conservation_method"
                                            name="conservation_method"
                                            value={formik.values.conservation_method}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.conservation_method && !!formik.errors.conservation_method}
                                        >
                                            <option value="">{t('laboratory.sample.form.conservationOptions.select', { defaultValue: 'Seleccione un método' })}</option>
                                            <option value="Refrigeración">{t('laboratory.sample.form.conservationOptions.refrigeration', { defaultValue: 'Refrigeración' })}</option>
                                            <option value="Congelación">{t('laboratory.sample.form.conservationOptions.freezing', { defaultValue: 'Congelación' })}</option>
                                            <option value="Extender">{t('laboratory.sample.form.conservationOptions.extender', { defaultValue: 'Extender' })}</option>
                                            <option value="Inmersión en nitrógeno líquido">{t('laboratory.sample.form.conservationOptions.liquid_nitrogen', { defaultValue: 'Inmersión en nitrógeno líquido' })}</option>
                                            <option value="Otro">{t('laboratory.sample.form.conservationOptions.other', { defaultValue: 'Otro' })}</option>
                                        </Input>
                                        {formik.touched.conservation_method && formik.errors.conservation_method && (
                                            <FormFeedback>{formik.errors.conservation_method}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <Label htmlFor="post_dilution_motility" className="form-label">{t('laboratory.sample.form.field.postDilutionMotility', { defaultValue: 'Motilidad post-dilución (%)' })}</Label>
                                        <Input
                                            type="number"
                                            id="post_dilution_motility"
                                            name="post_dilution_motility"
                                            value={formik.values.post_dilution_motility || ''}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.post_dilution_motility && !!formik.errors.post_dilution_motility}
                                            placeholder="Opcional"
                                        />
                                        {formik.touched.post_dilution_motility && formik.errors.post_dilution_motility && (
                                            <FormFeedback>{formik.errors.post_dilution_motility}</FormFeedback>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('laboratory.sample.form.action.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkSampleData()}>
                                {t('laboratory.sample.form.action.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-dosesinfo-tab" tabId={3}>
                        <div className="table-responsive">
                            <SimpleBar style={{ maxHeight: "400px" }}>
                                <Table className="table-hover align-middle table-nowrap mb-0 table-striped table-bordered">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>{t('laboratory.sample.form.table.code', { defaultValue: 'Codigo' })}</th>
                                            <th>{t('laboratory.sample.form.table.semenVolume', { defaultValue: 'Volumen semen (ml)' })}</th>
                                            <th>{t('laboratory.sample.form.table.diluentVolume', { defaultValue: 'Volumen diluyente (ml)' })}</th>
                                            <th>{t('laboratory.sample.form.table.total', { defaultValue: 'Total (ml)' })}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formik.values.doses.map((dose, index) => (
                                            <tr key={index}>
                                                <td>{dose.code}</td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        name={`doses[${index}].semen_volume`}
                                                        value={dose.semen_volume}
                                                        onChange={(e) => {
                                                            const newValue = Number(e.target.value);
                                                            formik.setFieldValue(`doses[${index}].semen_volume`, newValue);
                                                            formik.setFieldValue(
                                                                `doses[${index}].total_volume`,
                                                                newValue + formik.values.doses[index].diluent_volume
                                                            );
                                                        }}
                                                        bsSize="sm"
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        name={`doses[${index}].diluent_volume`}
                                                        value={dose.diluent_volume}
                                                        onChange={(e) => {
                                                            const newValue = Number(e.target.value);
                                                            formik.setFieldValue(`doses[${index}].diluent_volume`, newValue);
                                                            formik.setFieldValue(
                                                                `doses[${index}].total_volume`,
                                                                formik.values.doses[index].semen_volume + newValue
                                                            );
                                                        }}
                                                        bsSize="sm"
                                                    />
                                                </td>
                                                <td className="fw-bold text-primary">
                                                    {dose.total_volume}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </SimpleBar>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('laboratory.sample.form.action.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className="ms-auto" onClick={() => toggleArrowTab(activeStep + 1)}>
                                {t('laboratory.sample.form.action.next', { defaultValue: 'Siguiente' })}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="card shadow-sm border-0 rounded-3">
                            <div className="card-header bg-gradient text-white">
                                <h5 className="mb-0 text-center">
                                    <i className="ri-file-list-3-line me-2"></i>
                                    {t('laboratory.sample.form.summary.title', { defaultValue: 'Resumen del Registro de Muestra de Semen' })}
                                </h5>
                            </div>
                            <div className="card-body p-3">
                                <div className="row g-3">
                                    {/* Datos de origen - Compacto */}
                                    <div className="col-lg-4">
                                        <div className="border rounded-2 p-3 bg-light h-100 d-flex flex-column">
                                            {origin === 'internal' ? (
                                                <>
                                                    <h6 className="text-primary fw-bold mb-3">
                                                        <i className="ri-drop-line me-2"></i>{t('laboratory.sample.form.summary.extractionData', { defaultValue: 'Datos Extracción' })}
                                                    </h6>
                                                    {(() => {
                                                        const sel = extractions.find(e => e._id === formik.values.extraction_id);
                                                        if (!sel) return <p className="text-muted">{t('laboratory.sample.form.summary.noExtraction', { defaultValue: 'No seleccionada' })}</p>;
                                                        return (
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span className="text-muted">{t('laboratory.sample.form.summary.batch', { defaultValue: 'Lote:' })}</span>
                                                                    <span className="fw-semibold">{sel.batch}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span className="text-muted">{t('laboratory.sample.form.summary.date', { defaultValue: 'Fecha:' })}</span>
                                                                    <span>{sel.date ? new Date(sel.date).toLocaleDateString() : "-"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span className="text-muted">{t('laboratory.sample.form.summary.boar', { defaultValue: 'Verraco:' })}</span>
                                                                    <span className="fw-semibold">{sel.boar?.code || "-"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span className="text-muted">{t('laboratory.sample.form.summary.technician', { defaultValue: 'Técnico:' })}</span>
                                                                    <span>{sel.technician ? `${sel.technician.name} ${sel.technician.lastname}` : "-"}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted">{t('laboratory.sample.form.summary.volume', { defaultValue: 'Volumen:' })}</span>
                                                                    <span className="fw-semibold">{sel.volume} {sel.unit_measurement}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            ) : (
                                                <>
                                                    <h6 className="text-primary fw-bold mb-3">
                                                        <i className="ri-store-2-line me-2"></i>{t('laboratory.sample.form.summary.supplierData', { defaultValue: 'Datos Proveedor' })}
                                                    </h6>
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.supplierName', { defaultValue: 'Proveedor:' })}</span>
                                                            <span className="fw-semibold">{formik.values.supplier?.name || "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.supplierLot', { defaultValue: 'Lote proveedor:' })}</span>
                                                            <span className="fw-semibold">{formik.values.supplier?.lot || "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.purchaseDate', { defaultValue: 'Fecha de compra:' })}</span>
                                                            <span>{formik.values.supplier?.purchase_date ? new Date(formik.values.supplier.purchase_date).toLocaleDateString() : "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.volume', { defaultValue: 'Volumen:' })}</span>
                                                            <span className="fw-semibold">{externalSemenVolume} {externalUnit}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Análisis de muestra - Compacto */}
                                    <div className="col-lg-4">
                                        <div className="border rounded-2 p-3 bg-light h-100 d-flex flex-column">
                                            <h6 className="text-success fw-bold mb-3">
                                                <i className="ri-test-tube-line me-2"></i>{t('laboratory.sample.form.summary.semenAnalysis', { defaultValue: 'Análisis Semen' })}
                                            </h6>
                                            <div className="flex-grow-1">
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.concentration', { defaultValue: 'Conc:' })}</span>
                                                            <span className="fw-semibold">{formik.values.concentration_million}M</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.motility', { defaultValue: 'Motilidad:' })}</span>
                                                            <span className="fw-semibold">{formik.values.motility_percent}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.vitality', { defaultValue: 'Vitalidad:' })}</span>
                                                            <span className="fw-semibold">{formik.values.vitality_percent}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.abnormality', { defaultValue: 'Anomalías:' })}</span>
                                                            <span className="fw-semibold">{formik.values.abnormal_percent}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">pH:</span>
                                                            <span className="fw-semibold">{formik.values.pH}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.temp', { defaultValue: 'Temp:' })}</span>
                                                            <span className="fw-semibold">{formik.values.temperature}°C</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Insumos y Conservación - Compacto */}
                                    <div className="col-lg-4">
                                        <div className="border rounded-2 p-3 bg-light h-100 d-flex flex-column">
                                            <h6 className="text-info fw-bold mb-3">
                                                <i className="ri-flask-line me-2"></i>{t('laboratory.sample.form.summary.labSupplies', { defaultValue: 'Insumos & Conservación' })}
                                            </h6>
                                            <div className="flex-grow-1">
                                                {formik.values.lab_supplies.length === 0 ? (
                                                    <p className="text-muted small">{t('laboratory.sample.form.summary.noSupplies', { defaultValue: 'Sin insumos seleccionados' })}</p>
                                                ) : (
                                                    formik.values.lab_supplies.map((s, i) => (
                                                        <div key={i} className="d-flex justify-content-between mb-1">
                                                            <span className="text-muted small">{s.product_name || '—'}</span>
                                                            <span className="fw-semibold small">{s.quantity} {s.unit_measurement}</span>
                                                        </div>
                                                    ))
                                                )}
                                                <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                                                    <span className="text-muted fw-semibold">{t('laboratory.sample.form.summary.estimatedCost', { defaultValue: 'Costo estimado:' })}</span>
                                                    <span className="fw-bold text-success">${estimatedCost.toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2 mt-2">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.method', { defaultValue: 'Método:' })}</span>
                                                    <span>{formik.values.conservation_method}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.expires', { defaultValue: 'Expira:' })}</span>
                                                    <span className="fw-semibold">{formik.values.expiration_date ? new Date(formik.values.expiration_date).toLocaleDateString() : "-"}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.postMotility', { defaultValue: 'Mot. Post:' })}</span>
                                                    <span>{formik.values.post_dilution_motility || "-"}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dosis - Compacto */}
                                    <div className="col-12">
                                        <div className="border rounded-2 p-3 bg-light">
                                            <h6 className="text-warning fw-bold mb-3">
                                                <i className="ri-vial-line me-2"></i>{t('laboratory.sample.form.summary.generatedDoses', { defaultValue: 'Dosis Generadas' })} ({formik.values.doses.length})
                                            </h6>
                                            {formik.values.doses.length === 0 ? (
                                                <p className="text-muted text-center mb-0">{t('laboratory.sample.form.summary.noDoses', { defaultValue: 'No se han generado dosis' })}</p>
                                            ) : (
                                                <div className="table-responsive" style={{ maxHeight: "150px" }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead className="sticky-top bg-light">
                                                            <tr>
                                                                <th>{t('laboratory.sample.form.summary.code', { defaultValue: 'Código' })}</th>
                                                                <th>{t('laboratory.sample.form.summary.semen', { defaultValue: 'Semen' })}</th>
                                                                <th>{t('laboratory.sample.form.summary.diluentLabel', { defaultValue: 'Diluyente' })}</th>
                                                                <th className="text-end">{t('laboratory.sample.form.summary.total', { defaultValue: 'Total' })}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {formik.values.doses.map((dose, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="fw-semibold">{dose.code}</td>
                                                                    <td>{dose.semen_volume} {dose.unit_measurement}</td>
                                                                    <td>{dose.diluent_volume} {dose.unit_measurement}</td>
                                                                    <td className="text-end fw-bold text-primary">{dose.total_volume} {dose.unit_measurement}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t('laboratory.sample.form.action.back', { defaultValue: 'Atrás' })}
                            </Button>

                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <div><Spinner size="sm" /></div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        {t('laboratory.sample.form.action.register', { defaultValue: 'Registrar' })}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-4">
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}
                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>
                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}

            <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" centered className="border-0">
                <ModalHeader toggle={toggleModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">{t('laboratory.sample.form.modal.extractionDetails', { defaultValue: 'Detalles de la extracción' })}</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={t('laboratory.sample.form.success', { defaultValue: 'Muestra registrada con éxito' })} />
        </>
    )
}

export default SemenSampleForm;
