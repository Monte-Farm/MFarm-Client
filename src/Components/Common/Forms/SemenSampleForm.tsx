import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { ExtractionData, SemenSample } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
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
    const [loading, setLoading] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [extractions, setExtractions] = useState<any[]>([])
    const [activeStep, setActiveStep] = useState<number>(preselectedExtraction ? 2 : 1);
    const [passedarrowSteps, setPassedarrowSteps] = useState(preselectedExtraction ? [1, 2] : [1]);
    const [alertExtractionEmpty, setAlertExtractionEmpty] = useState<boolean>(false)
    const [doseSize, setDoseSize] = useState<number>(0);
    const [selectedExtraction, setSelectedExtraction] = useState<ExtractionData | null>(null)
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);

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

    const validationSchema = Yup.object({
        extraction_id: Yup.string().required(t('laboratory.sample.form.validation.selectExtraction', { defaultValue: 'Por favor seleccione una extracción' })),
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
        diluent: Yup.object({
            type: Yup.string().required(t('laboratory.sample.form.validation.diluentType', { defaultValue: 'Por favor, ingrese el tipo de diluyente' })),
            lot: Yup.string().required(t('laboratory.sample.form.validation.diluentLot', { defaultValue: 'Por favor, ingrese el lote del diluyente' })),
            volume: Yup.number()
                .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
                .required(t('laboratory.sample.form.validation.diluentVolume', { defaultValue: 'Por favor, ingrese el volumen del diluyente' })),
            unit_measurement: Yup.string().required(t('laboratory.sample.form.validation.diluentUnit', { defaultValue: 'Por favor, ingrese la unidad de medida' })),
        }),
        conservation_method: Yup.string().required(t('laboratory.sample.form.validation.conservationMethod', { defaultValue: 'Por favor, ingrese el método de conservación' })),
        expiration_date: Yup.date().min(new Date(new Date().setHours(0, 0, 0, 0)), t('laboratory.sample.form.validation.expirationDate', { defaultValue: 'La fecha de expiración no puede ser pasada' })).required(t('laboratory.sample.form.validation.expirationDateRequired', { defaultValue: 'Por favor, ingrese la fecha de expiración' })),
        post_dilution_motility: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .notRequired(),
        alert_hours_before_expiration: Yup.number()
            .min(0, t('laboratory.sample.form.validation.minZero', { defaultValue: 'El número no puede ser menor a 0' }))
            .required(t('laboratory.sample.form.validation.alertHours', { defaultValue: 'Por favor, ingrese un numero' })),
    });

    const formik = useFormik<SemenSample>({
        initialValues: initialData || {
            extraction_id: preselectedExtraction?._id || '',
            concentration_million: 0,
            motility_percent: 0,
            vitality_percent: 0,
            abnormal_percent: 0,
            pH: 0,
            temperature: 0,
            diluent: {
                type: '',
                lot: '',
                volume: 0,
                unit_measurement: ''
            },
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
                const selectedExtraction = extractions.find(e => e._id === formik.values.extraction_id);
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/semen_sample/create`, values);
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Muestras de semen del lote ${selectedExtraction.batch} registradas`
                    });
                    setSuccessModalOpen(true)
                }

            } catch (err: any) {
                handleError(err, t('laboratory.sample.form.error', { defaultValue: 'Error al registrar la muestra. Por favor, inténtelo nuevamente.' }));
            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkExtractionSelected = () => {
        if (formik.values.extraction_id === "" || !formik.values.extraction_id) {
            setAlertExtractionEmpty(true);
            setTimeout(() => {
                setAlertExtractionEmpty(false);
            }, 4000);
            return false;
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
            diluent: {
                type: true,
                lot: true,
                volume: true,
                unit_measurement: true,
            },
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
        fetchExtractions();
    }, [])

    useEffect(() => {
        const selected = extractions.find(e => e._id === formik.values.extraction_id);
        setSelectedExtraction(selected || null);

        if (!selected) {
            formik.setFieldValue('doses', []);
            return;
        }

        formik.setFieldValue('diluent.unit_measurement', selected.unit_measurement);

        const semenTotal = selected.volume;
        const diluentTotal = Number(formik.values.diluent.volume || 0);
        const totalVolume = semenTotal + diluentTotal;

        if (doseSize <= 0) {
            formik.setFieldValue('doses', []);
            return;
        }

        const dosesCount = Math.floor(totalVolume / doseSize);
        const remainder = totalVolume % doseSize;

        const semenRatio = semenTotal / totalVolume;
        const diluentRatio = diluentTotal / totalVolume;

        const unit = selected.unit_measurement;
        const batchCode = selected.batch;

        const dosesArray = Array.from({ length: dosesCount }, (_, i) => {
            const semen_volume = Number((doseSize * semenRatio).toFixed(2));
            const diluent_volume = Number((doseSize * diluentRatio).toFixed(2));
            return {
                code: `${batchCode}-${(i + 1).toString().padStart(4, '0')}`,
                semen_volume,
                diluent_volume,
                total_volume: doseSize,
                unit_measurement: unit,
                status: 'available' as const,
            };
        });

        if (remainder > 0) {
            const semen_volume = Number((remainder * semenRatio).toFixed(2));
            const diluent_volume = Number((remainder * diluentRatio).toFixed(2));
            dosesArray.push({
                code: `${batchCode}-${(dosesArray.length + 1).toString().padStart(4, '0')}`,
                semen_volume,
                diluent_volume,
                total_volume: remainder,
                unit_measurement: unit,
                status: 'available' as const,
            });
        }

        formik.setFieldValue('doses', dosesArray);
        formik.setFieldValue('total_doses', dosesArray.length);
        formik.setFieldValue('available_doses', dosesArray.length);
    }, [formik.values.extraction_id, formik.values.diluent.volume, extractions, doseSize]);

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
                                    id="step-extractionselect-tab"
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    onClick={() => toggleArrowTab(1)}
                                    aria-selected={activeStep === 1}
                                    aria-controls="step-extractionselect-tab"
                                    disabled
                                >
                                    {t('laboratory.sample.form.step.selectExtraction', { defaultValue: 'Selección de extracción' })}
                                </NavLink>
                            </NavItem>
                        )}

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-sampleinfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-sampleinfo-tab"
                                disabled
                            >
                                {t('laboratory.sample.form.step.sampleInfo', { defaultValue: 'Información de la muestra' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-dosesinfo-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-dosesinfo-tab"
                                disabled
                            >
                                {t('laboratory.sample.form.step.dosesInfo', { defaultValue: 'Información de las dosis' })}
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 4,
                                    done: activeStep > 4,
                                })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                aria-controls="step-summary-tab"
                                disabled
                            >
                                {t('laboratory.sample.form.step.summary', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>


                <TabContent activeTab={activeStep}>
                    {!preselectedExtraction && (
                        <TabPane id="step-extractionselect-tab" tabId={1}>
                            <SelectableTable data={extractions} columns={extractionsColumns} selectionMode="single" showPagination={true} rowsPerPage={15} onSelect={(rows) => formik.setFieldValue('extraction_id', rows[0]?._id)} />
                            <div className="mt-4 d-flex">
                                <Button className="ms-auto" onClick={() => checkExtractionSelected()}>
                                    {t('laboratory.sample.form.action.next', { defaultValue: 'Siguiente' })}
                                    <i className="ri-arrow-right-line" />
                                </Button>
                            </div>
                            {alertExtractionEmpty && (
                                <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                    <FiXCircle size={22} />
                                    <span className="flex-grow-1 text-black">{t('laboratory.sample.form.alert.selectExtraction', { defaultValue: 'Por favor, seleccione una extracción' })}</span>

                                    <Button close onClick={() => setAlertExtractionEmpty(false)} />
                                </Alert>
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

                        {/* Sección 3: Dilución y Conservación */}
                        <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-light">
                                <h6 className="mb-0 text-info fw-bold">
                                    <i className="ri-flask-line me-2 text-info"></i>
                                    {t('laboratory.sample.form.section.dilution', { defaultValue: 'Dilución y Conservación' })}
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <Label htmlFor="diluent_type" className="form-label">{t('laboratory.sample.form.field.diluentType', { defaultValue: 'Tipo de diluyente' })}</Label>
                                        <Input
                                            type="text"
                                            id="diluent_type"
                                            name="diluent.type"
                                            value={formik.values.diluent.type}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.diluent?.type && !!formik.errors.diluent?.type}
                                            placeholder="Ej: Extender X"
                                        />
                                        {formik.touched.diluent?.type && formik.errors.diluent?.type && (
                                            <FormFeedback>{formik.errors.diluent.type}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="diluent_lot" className="form-label">{t('laboratory.sample.form.field.diluentLot', { defaultValue: 'Lote de diluyente' })}</Label>
                                        <Input
                                            type="text"
                                            id="diluent_lot"
                                            name="diluent.lot"
                                            value={formik.values.diluent.lot}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            invalid={formik.touched.diluent?.lot && !!formik.errors.diluent?.lot}
                                            placeholder="Ej: D-001"
                                        />
                                        {formik.touched.diluent?.lot && formik.errors.diluent?.lot && (
                                            <FormFeedback>{formik.errors.diluent.lot}</FormFeedback>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label htmlFor="diluent_final_volume" className="form-label">{t('laboratory.sample.form.field.diluentVolume', { defaultValue: 'Volumen de diluyente' })} ({selectedExtraction?.unit_measurement})</Label>
                                        <Input
                                            type="number"
                                            id="diluent_final_concentration"
                                            name="diluent.volume"
                                            value={formik.values.diluent.volume}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            onFocus={(e) => e.target.select()}
                                            invalid={formik.touched.diluent?.volume && !!formik.errors.diluent?.volume}
                                            placeholder="Ej: 1.5"
                                        />
                                        {formik.touched.diluent?.volume && formik.errors.diluent?.volume && (
                                            <FormFeedback>{formik.errors.diluent.volume}</FormFeedback>
                                        )}
                                    </div>

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
                                    {/* Datos de extracción - Compacto */}
                                    <div className="col-lg-4">
                                        <div className="border rounded-2 p-3 bg-light h-100 d-flex flex-column">
                                            <h6 className="text-primary fw-bold mb-3">
                                                <i className="ri-drop-line me-2"></i>{t('laboratory.sample.form.summary.extractionData', { defaultValue: 'Datos Extracción' })}
                                            </h6>
                                            {(() => {
                                                const selectedExtraction = extractions.find(e => e._id === formik.values.extraction_id);
                                                if (!selectedExtraction) return <p className="text-muted">{t('laboratory.sample.form.summary.noExtraction', { defaultValue: 'No seleccionada' })}</p>;
                                                return (
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.batch', { defaultValue: 'Lote:' })}</span>
                                                            <span className="fw-semibold">{selectedExtraction.batch}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.date', { defaultValue: 'Fecha:' })}</span>
                                                            <span>{selectedExtraction.date ? new Date(selectedExtraction.date).toLocaleDateString() : "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.boar', { defaultValue: 'Verraco:' })}</span>
                                                            <span className="fw-semibold">{selectedExtraction.boar?.code || "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.technician', { defaultValue: 'Técnico:' })}</span>
                                                            <span>{selectedExtraction.technician ? `${selectedExtraction.technician.name} ${selectedExtraction.technician.lastname}` : "-"}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span className="text-muted">{t('laboratory.sample.form.summary.volume', { defaultValue: 'Volumen:' })}</span>
                                                            <span className="fw-semibold">{selectedExtraction.volume} {selectedExtraction.unit_measurement}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
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

                                    {/* Dilución y conservación - Compacto */}
                                    <div className="col-lg-4">
                                        <div className="border rounded-2 p-3 bg-light h-100 d-flex flex-column">
                                            <h6 className="text-info fw-bold mb-3">
                                                <i className="ri-flask-line me-2"></i>{t('laboratory.sample.form.summary.dilutionConservation', { defaultValue: 'Dilución & Conservación' })}
                                            </h6>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.diluent', { defaultValue: 'Diluyente:' })}</span>
                                                    <span className="fw-semibold">{formik.values.diluent.type}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.lot', { defaultValue: 'Lote:' })}</span>
                                                    <span>{formik.values.diluent.lot}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-muted">{t('laboratory.sample.form.summary.diluentVolume', { defaultValue: 'Vol. Diluyente:' })}</span>
                                                    <span className="fw-semibold">{formik.values.diluent.volume} {selectedExtraction?.unit_measurement}</span>
                                                </div>
                                                <div className="d-flex justify-content-between mb-2">
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
                                    <div>
                                        <Spinner size="sm" />
                                    </div>
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
