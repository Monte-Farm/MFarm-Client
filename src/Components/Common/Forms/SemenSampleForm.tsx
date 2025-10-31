import { ConfigContext } from "App";
import { ExtractionData, SemenSample } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, Table, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiXCircle } from "react-icons/fi";
import { Column } from "common/data/data_types";
import SuccessModal from "../SuccessModal";
import { HttpStatusCode } from "axios";
import DatePicker from "react-flatpickr";
import SimpleBar from "simplebar-react";
import PigDetailsModal from "../Details/DetailsPigModal";
import SelectableTable from "../Tables/SelectableTable";

interface SemenSampleFormProps {
    initialData?: SemenSample;
    onSave: () => void;
    onCancel: () => void;
}



const SemenSampleForm: React.FC<SemenSampleFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [extractions, setExtractions] = useState<any[]>([])
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertExtractionEmpty, setAlertExtractionEmpty] = useState<boolean>(false)
    const [doseSize, setDoseSize] = useState<number>(0);
    const [selectedExtraction, setSelectedExtraction] = useState<ExtractionData | null>(null)
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);

    const extractionsColumns: Column<any>[] = [
        { header: 'Lote', accessor: 'batch', type: 'text', isFilterable: true },
        {
            header: 'Verraco',
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
        { header: 'Fecha de extracción', accessor: 'date', type: 'date', isFilterable: false },
        {
            header: 'Volumen',
            accessor: 'volume',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row ? `${row.volume} ${row.unit_measurement}` : "Sin volumen"
        },
        {
            header: 'Responsable',
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : "Sin responsable"
        },
        { header: 'Ubicacion de la extracción', accessor: 'extraction_location', type: 'text', isFilterable: true },
    ]

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
        console.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const validationSchema = Yup.object({
        extraction_id: Yup.string().required("Por favor seleccione una extracción"),
        concentration_million: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .required("Por favor, ingrese un número"),
        motility_percent: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .required("Por favor, ingrese un número"),
        vitality_percent: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .max(100, 'El número no puede ser mayor a 100')
            .required("Por favor, ingrese un número"),
        abnormal_percent: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .max(100, 'El número no puede ser mayor a 100')
            .required("Por favor, ingrese un número"),
        pH: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .required("Por favor, ingrese un número"),
        temperature: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .required("Por favor, ingrese un número"),
        diluent: Yup.object({
            type: Yup.string().required("Por favor, ingrese el tipo de diluyente"),
            lot: Yup.string().required("Por favor, ingrese el lote del diluyente"),
            volume: Yup.number()
                .min(0, "El número no puede ser menor a 0")
                .required("Por favor, ingrese el volumen del diluyente"),
            unit_measurement: Yup.string().required("Por favor, ingrese la unidad de medida"),

        }),
        conservation_method: Yup.string().required("Por favor, ingrese el método de conservación"),
        expiration_date: Yup.date().min(new Date(new Date().setHours(0, 0, 0, 0)), 'La fecha de expiración no puede ser pasada').required('Por favor, ingrese la fecha de expiración'),
        post_dilution_motility: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .notRequired(),
        alert_hours_before_expiration: Yup.number()
            .min(0, "El número no puede ser menor a 0")
            .required("Por favor, ingrese un numero"),
    });

    const formik = useFormik<SemenSample>({
        initialValues: initialData || {
            extraction_id: '',
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

            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkExtractionSelected = () => {
        if (formik.values.extraction_id === "") {
            setAlertExtractionEmpty(true)
            setTimeout(() => {
                setAlertExtractionEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(2)
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
        } catch (err) {

        }
    };

    const fetchExtractions = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_sample_not_registered/${userLogged.farm_assigned}`)
            const extractionsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setExtractions(extractionsWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo mas tarde')
        }
    }

    useEffect(() => {
        fetchExtractions();
    }, [])

    useEffect(() => {
        const selected = extractions.find(e => e._id === formik.values.extraction_id);
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
                    <Nav className="nav-pills custom-nav nav-justified">
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
                                Selección de extracción
                            </NavLink>
                        </NavItem>

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
                                Información de la muestra
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
                                Información de las dosis
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
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>


                <TabContent activeTab={activeStep}>
                    <TabPane id="step-extractionselect-tab" tabId={1}>
                        <SelectableTable data={extractions} columns={extractionsColumns} selectionMode="single" showPagination={true} rowsPerPage={15} onSelect={(rows) => formik.setFieldValue('extraction_id', rows[0]?._id)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkExtractionSelected()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alertExtractionEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, seleccione una extracción</span>

                                <Button close onClick={() => setAlertExtractionEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-extractioninfo-tab" tabId={2}>
                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="date" className="form-label">Fecha de expiración</Label>
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

                            <div className="mt-4 w-50">
                                <Label htmlFor="dose_size" className="form-label">Tamaño de dosis</Label>
                                <Input
                                    type="number"
                                    id="dose_size"
                                    name="dose_size"
                                    value={doseSize}
                                    onChange={(e) => setDoseSize(Number(e.target.value))}
                                    placeholder="Ej: 10"
                                    min={1}
                                />
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="alert_days_before_expiration" className="form-label">Alerta de expiración</Label>
                                <div className="input-group">
                                    <Input
                                        className="form-control"
                                        type="number"
                                        id="alert_days_before_expiration"
                                        name="alert_days_before_expiration"
                                        value={formik.values.alert_hours_before_expiration}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.alert_hours_before_expiration && !!formik.errors.alert_hours_before_expiration}
                                        min={0}
                                    />
                                    <span className="input-group-text">horas antes</span>
                                    {formik.touched.alert_hours_before_expiration && formik.errors.alert_hours_before_expiration && (
                                        <FormFeedback>{formik.errors.alert_hours_before_expiration}</FormFeedback>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="d-flex gap-2">
                            {/* Concentración */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="concentration_million" className="form-label">Concentración (millones)</Label>
                                <Input
                                    type="number"
                                    id="concentration_million"
                                    name="concentration_million"
                                    value={formik.values.concentration_million}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.concentration_million && !!formik.errors.concentration_million}
                                    placeholder="Ej: 250"
                                />
                                {formik.touched.concentration_million && formik.errors.concentration_million && (
                                    <FormFeedback>{formik.errors.concentration_million}</FormFeedback>
                                )}
                            </div>

                            {/* Motilidad */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="motility_percent" className="form-label">Motilidad (%)</Label>
                                <Input
                                    type="number"
                                    id="motility_percent"
                                    name="motility_percent"
                                    value={formik.values.motility_percent}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.motility_percent && !!formik.errors.motility_percent}
                                    placeholder="Ej: 80"
                                />
                                {formik.touched.motility_percent && formik.errors.motility_percent && (
                                    <FormFeedback>{formik.errors.motility_percent}</FormFeedback>
                                )}
                            </div>

                            {/* Vitalidad */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="vitality_percent" className="form-label">Vitalidad (%)</Label>
                                <Input
                                    type="number"
                                    id="vitality_percent"
                                    name="vitality_percent"
                                    value={formik.values.vitality_percent}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.vitality_percent && !!formik.errors.vitality_percent}
                                    placeholder="Ej: 85"
                                />
                                {formik.touched.vitality_percent && formik.errors.vitality_percent && (
                                    <FormFeedback>{formik.errors.vitality_percent}</FormFeedback>
                                )}
                            </div>

                            {/* Anomalías */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="abnormal_percent" className="form-label">Anomalías (%)</Label>
                                <Input
                                    type="number"
                                    id="abnormal_percent"
                                    name="abnormal_percent"
                                    value={formik.values.abnormal_percent}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.abnormal_percent && !!formik.errors.abnormal_percent}
                                    placeholder="Ej: 5"
                                />
                                {formik.touched.abnormal_percent && formik.errors.abnormal_percent && (
                                    <FormFeedback>{formik.errors.abnormal_percent}</FormFeedback>
                                )}
                            </div>

                            {/* pH */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="pH" className="form-label">pH</Label>
                                <Input
                                    type="number"
                                    id="pH"
                                    name="pH"
                                    value={formik.values.pH}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.pH && !!formik.errors.pH}
                                    placeholder="Ej: 7.2"
                                />
                                {formik.touched.pH && formik.errors.pH && (
                                    <FormFeedback>{formik.errors.pH}</FormFeedback>
                                )}
                            </div>

                            {/* Temperatura */}
                            <div className="mt-4 w-100">
                                <Label htmlFor="temperature" className="form-label">Temperatura (°C)</Label>
                                <Input
                                    type="number"
                                    id="temperature"
                                    name="temperature"
                                    value={formik.values.temperature}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.temperature && !!formik.errors.temperature}
                                    placeholder="Ej: 37"
                                />
                                {formik.touched.temperature && formik.errors.temperature && (
                                    <FormFeedback>{formik.errors.temperature}</FormFeedback>
                                )}
                            </div>

                        </div>

                        <div className="d-flex gap-2">

                            {/* Diluyente */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="diluent_type" className="form-label">Tipo de diluyente</Label>
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

                            <div className="mt-4 w-50">
                                <Label htmlFor="diluent_lot" className="form-label">Lote de diluyente</Label>
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

                            <div className="mt-4 w-50">
                                <Label htmlFor="diluent_final_volume" className="form-label">Volumen de diluyente ({selectedExtraction?.unit_measurement})</Label>
                                <Input
                                    type="number"
                                    id="diluent_final_concentration"
                                    name="diluent.volume"
                                    value={formik.values.diluent.volume}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.diluent?.volume && !!formik.errors.diluent?.volume}
                                    placeholder="Ej: 1.5"
                                />
                                {formik.touched.diluent?.volume && formik.errors.diluent?.volume && (
                                    <FormFeedback>{formik.errors.diluent.volume}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            {/* Método de conservación */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="conservation_method" className="form-label">Método de conservación</Label>
                                <Input
                                    type="select"
                                    id="conservation_method"
                                    name="conservation_method"
                                    value={formik.values.conservation_method}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.conservation_method && !!formik.errors.conservation_method}
                                >
                                    <option value="">Seleccione un método</option>
                                    <option value="Refrigeración">Refrigeración</option>
                                    <option value="Congelación">Congelación</option>
                                    <option value="Extender">Extender</option>
                                    <option value="Inmersión en nitrógeno líquido">Inmersión en nitrógeno líquido</option>
                                    <option value="Otro">Otro</option>
                                </Input>
                                {formik.touched.conservation_method && formik.errors.conservation_method && (
                                    <FormFeedback>{formik.errors.conservation_method}</FormFeedback>
                                )}
                            </div>

                            {/* Post-dilution motility */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="post_dilution_motility" className="form-label">Motilidad post-dilución (%)</Label>
                                <Input
                                    type="number"
                                    id="post_dilution_motility"
                                    name="post_dilution_motility"
                                    value={formik.values.post_dilution_motility || ''}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.post_dilution_motility && !!formik.errors.post_dilution_motility}
                                    placeholder="Opcional"
                                />
                                {formik.touched.post_dilution_motility && formik.errors.post_dilution_motility && (
                                    <FormFeedback>{formik.errors.post_dilution_motility}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={() => checkSampleData()}>
                                Siguiente
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
                                            <th>Codigo</th>
                                            <th>Volumen semen (ml)</th>
                                            <th>Volumen diluyente (ml)</th>
                                            <th>Total (ml)</th>
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
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={() => toggleArrowTab(activeStep + 1)}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="row g-4 mt-4">

                            {/* Datos de la extracción */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        Datos de la extracción
                                    </div>
                                    <div className="card-body">
                                        {(() => {
                                            const selectedExtraction = extractions.find(e => e._id === formik.values.extraction_id);
                                            if (!selectedExtraction) return <p className="text-muted text-center">No se seleccionó una extracción</p>;
                                            return (
                                                <ul className="list-group list-group-flush fs-5">
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Lote:</strong></span>
                                                        <span className="text-black">{selectedExtraction.batch}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Fecha:</strong></span>
                                                        <span className="text-black">{selectedExtraction.date ? new Date(selectedExtraction.date).toLocaleDateString() : "-"}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Ubicación:</strong></span>
                                                        <span className="text-black">{selectedExtraction.extraction_location}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Técnico:</strong></span>
                                                        <span className="text-black">{selectedExtraction.technician ? `${selectedExtraction.technician.name} ${selectedExtraction.technician.lastname}` : "-"}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Volumen:</strong></span>
                                                        <span className="text-black">{selectedExtraction.volume} {selectedExtraction.unit_measurement}</span>
                                                    </li>
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Información de la muestra */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        Información de la muestra
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush fs-5">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Concentración (millones):</strong></span>
                                                <span className="text-black">{formik.values.concentration_million}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Motilidad (%):</strong></span>
                                                <span className="text-black">{formik.values.motility_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Vitalidad (%):</strong></span>
                                                <span className="text-black">{formik.values.vitality_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Anomalías (%):</strong></span>
                                                <span className="text-black">{formik.values.abnormal_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>pH:</strong></span>
                                                <span className="text-black">{formik.values.pH}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Temperatura (°C):</strong></span>
                                                <span className="text-black">{formik.values.temperature}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Diluyente:</strong></span>
                                                <span className="text-black">{formik.values.diluent.type} (Lote: {formik.values.diluent.lot}, Cantidad.: {formik.values.diluent.volume})</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Método de conservación:</strong></span>
                                                <span className="text-black">{formik.values.conservation_method}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Fecha de expiración:</strong></span>
                                                <span className="text-black">{formik.values.expiration_date ? new Date(formik.values.expiration_date).toLocaleDateString() : "-"}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Motilidad post-dilución (%):</strong></span>
                                                <span className="text-black">{formik.values.post_dilution_motility || "-"}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Dosis */}
                            <div className="col-12">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-info text-white fs-5 d-flex align-items-center justify-content-center">
                                        Dosis
                                    </div>
                                    <div className="card-body" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                        {formik.values.doses.length === 0 ? (
                                            <p className="text-muted text-center fs-5">No se han generado dosis</p>
                                        ) : (
                                            <ul className="list-group list-group-flush fs-6">
                                                {formik.values.doses.map((dose, idx) => (
                                                    <li key={idx} className="list-group-item d-flex justify-content-between">
                                                        <div>
                                                            <span className="text-black fs-5"><strong>{dose.code}</strong></span>
                                                            <div className="text-muted fs-6">
                                                                Semen: {dose.semen_volume} {dose.unit_measurement} |
                                                                Diluyente: {dose.diluent_volume} {dose.unit_measurement}
                                                            </div>
                                                        </div>
                                                        <span className="text-black fw-bold fs-5">
                                                            Total: {dose.total_volume} {dose.unit_measurement}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size="sm" />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        Registrar
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
                    <h4 className="modal-title text-primary fw-bold">Detalles de la extracción</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Muestra registrada con éxito"} />
        </>
    )
}

export default SemenSampleForm;