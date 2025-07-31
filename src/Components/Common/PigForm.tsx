import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { PigData, PigMedicationEntry } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";


interface PigFormProps {
    initialData?: PigData;
    onSave: () => void;
    onCancel: () => void;
}

const PigForm: React.FC<PigFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [confirmDiscardModalOpen, setConfirmDiscardModalOpen] = useState(false);
    const [pendingSubmitValues, setPendingSubmitValues] = useState<PigData | null>(null);
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [showFeedingForm, setShowFeedingForm] = React.useState(false);
    const [showMedicationForm, setShowMedicationForm] = React.useState(false);
    const [incompleteFieldsAlert, setIncompleteFieldsAlert] = useState({
        visible: false,
        message: ""
    });

    const showIncompleteFieldsAlert = (message: string) => {
        setIncompleteFieldsAlert({
            visible: true,
            message: message
        });

        setTimeout(() => {
            setIncompleteFieldsAlert(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const validateGeneralInfo = (values: PigData): boolean => {
        return (
            !!values.code &&
            !!values.birthdate &&
            !!values.breed &&
            !!values.origin &&
            (values.origin !== 'otro' || !!values.originDetail) &&
            (values.origin === 'nacido' || !!values.arrivalDate) &&
            (!['comprado', 'donado'].includes(values.origin) || !!values.sourceFarm) &&
            !!values.status &&
            !!values.currentStage &&
            !!values.sex &&
            !!values.weight &&
            (!values.discarded || (
                !!values.discardReason &&
                !!values.discardDestination &&
                (values.discardReason !== 'muerto' || (
                    !!values.discardDeathCause &&
                    !!values.discardResponsible
                ))
            ))
        );
    };

    const [medicationForm, setMedicationForm] = React.useState<PigMedicationEntry>({
        type: '',
        name: '',
        dose: '',
        unit: '',
        route: '',
        applicationDate: null,
        observations: '',
    });

    const [feedingForm, setFeedingForm] = React.useState({
        category: '',
        name: '',
        dailyAmount: '',
        unit: '',
        observations: '',
    });

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 2000);
    }

    const handleFeedingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeedingForm(prev => ({ ...prev, [name]: value }));
    };

    function handleMedicationInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setMedicationForm(prev => ({
            ...prev,
            [name]: name === 'dose' ? (value === '' ? '' : Number(value)) : value,
        }));
    }

    function handleMedicationDateChange(date: Date[]) {
        setMedicationForm(prev => ({
            ...prev,
            applicationDate: date[0] || null,
        }));
    }

    function handleAddMedicationEntry() {
        if (
            !medicationForm.type ||
            !medicationForm.name ||
            medicationForm.dose === '' ||
            !medicationForm.unit ||
            !medicationForm.route ||
            !medicationForm.applicationDate
        ) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        formik.setFieldValue('initialMedications', [
            ...(formik.values.initialMedications || []),
            medicationForm,
        ]);

        setMedicationForm({
            type: '',
            name: '',
            dose: '',
            unit: '',
            route: '',
            applicationDate: null,
            observations: '',
        });
        setShowMedicationForm(false);
    }

    function handleRemoveMedicationEntry(index: number) {
        const newArray = [...(formik.values.initialMedications || [])];
        newArray.splice(index, 1);
        formik.setFieldValue('initialMedications', newArray);
    }

    const handleAddFeedingEntry = () => {
        if (!feedingForm.category || !feedingForm.name || feedingForm.dailyAmount === '' || !feedingForm.unit) {
            showAlert('danger', 'Por favor complete todos los campos')
            return;
        }

        const newEntry = {
            category: feedingForm.category,
            name: feedingForm.name,
            dailyAmount: Number(feedingForm.dailyAmount),
            unit: feedingForm.unit,
            observations: feedingForm.observations,
        };

        formik.setFieldValue('initialFeedings', [...formik.values.initialFeedings, newEntry]);
        setFeedingForm({ category: '', name: '', dailyAmount: '', unit: '', observations: '' });
        setShowFeedingForm(false);
    };

    const handleRemoveFeedingEntry = (index: number) => {
        const updated = [...formik.values.initialFeedings];
        updated.splice(index, 1);
        formik.setFieldValue('initialFeedings', updated);
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            if (tab === 2 && !validateGeneralInfo(formik.values)) {
                formik.validateForm();
                showAlert('danger', 'Por favor complete todos los campos requeridos en la información general');
                return;
            }

            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const handleFormSubmit = (values: PigData, formikHelpers: any) => {
        if (values.discarded) {
            setPendingSubmitValues(values);
            setConfirmDiscardModalOpen(true);
        } else {
            formikHelpers.setSubmitting(true);
            onSubmitForm(values, formikHelpers);
        }
    };

    const onSubmitForm = async (values: PigData, formikHelpers: any) => {
        try {
            if (!configContext) throw new Error('El servicio no está disponible, inténtelo más tarde');
            values.farmId = userLogged.farm_assigned;

            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create`, values);

            if (response.status === HttpStatusCode.Created) {
                if (values.discarded) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de cerdo ${values.code} descartado por motivo: ${values.discardReason}`
                    });
                } else {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de cerdo ${values.code}`
                    });
                }
                onSave();
            }
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al guardar los datos, inténtelo más tarde');
        } finally {
            formikHelpers.setSubmitting(false);
            setConfirmDiscardModalOpen(false);
            setPendingSubmitValues(null);
        }
    };

    const confirmDiscardSubmit = () => {
        if (pendingSubmitValues && formik) {
            formik.setSubmitting(true);
            onSubmitForm(pendingSubmitValues, formik);
        }
    };

    const cancelDiscardModal = () => {
        setConfirmDiscardModalOpen(false);
        setPendingSubmitValues(null);
        formik.setSubmitting(false); // Reset submit state si cancela
    };

    const handleError = (error: any, message: string) => {
        console.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Por favor ingrese el código del cerdo')
            .test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (initialData) return true
                if (!value) return false
                if (!configContext) return true
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/check_code_exists/${value}`)
                    return !response.data.data
                } catch (error) {
                    console.error('Error checking farm code:', error);
                    return false;
                }
            }),
        birthdate: Yup.date()
            .max(new Date(), 'La fecha de nacimiento no puede ser futura')
            .required('Por favor ingrese la fecha de nacimiento'),
        breed: Yup.string()
            .required('Por favor seleccione la raza'),
        origin: Yup.mixed<'nacido' | 'comprado' | 'donado' | 'otro'>()
            .oneOf(['nacido', 'comprado', 'donado', 'otro'], 'Origen inválido')
            .required('Por favor seleccione el origen'),
        originDetail: Yup.string().when('origin', {
            is: 'otro',
            then: schema => schema.required('Por favor especifique el origen'),
            otherwise: schema => schema.notRequired(),
        }),
        arrivalDate: Yup.date().when('origin', {
            is: (val: string) => val !== 'nacido',
            then: schema => schema
                .max(new Date(), 'La fecha no puede ser futura')
                .required('Por favor ingrese la fecha de llegada'),
            otherwise: schema => schema.notRequired(),
        }),
        sourceFarm: Yup.string().when('origin', {
            is: (val: string) => val === 'comprado' || val === 'donado',
            then: schema => schema.required('Por favor ingrese la granja de origen'),
            otherwise: schema => schema.notRequired(),
        }),
        status: Yup.mixed<'vivo' | 'vendido' | 'sacrificado' | 'muerto' | 'descartado'>()
            .oneOf(['vivo', 'vendido', 'sacrificado', 'muerto', 'descartado'], 'Estado inválido')
            .required('Por favor seleccione el estado'),
        currentStage: Yup.mixed<'lechón' | 'destete' | 'engorda' | 'reproductor'>()
            .oneOf(['lechón', 'destete', 'engorda', 'reproductor'], 'Etapa inválida')
            .required('Por favor seleccione la etapa'),
        sex: Yup.mixed<'macho' | 'hembra'>()
            .oneOf(['macho', 'hembra'], 'Sexo inválido')
            .required('Por favor seleccione el sexo'),
        weight: Yup.number()
            .min(1, 'El peso deber ser mayor a 0')
            .max(300, 'El peso no puede ser mayor a 500')
            .required('Por favor ingrese el peso'),
        observations: Yup.string().notRequired(),
        discarded: Yup.boolean(),
        discardReason: Yup.string().when('discarded', {
            is: true,
            then: schema => schema.required('Por favor indique el motivo de descarte'),
        }),
        discardDestination: Yup.string().when('discarded', {
            is: true,
            then: schema => schema.required('Por favor indique el destino del animal'),
        }),
        discardDeathCause: Yup.string().when('discardReason', {
            is: 'muerto',
            then: schema => schema.required('Por favor indique la causa probable de muerte'),
            otherwise: schema => schema.notRequired(),
        }),
        discardResponsible: Yup.string().when('discardReason', {
            is: 'muerto',
            then: schema => schema.required('Por favor indique el responsable del reporte'),
            otherwise: schema => schema.notRequired(),
        }),
        initialFeedings: Yup.array().of(
            Yup.object().shape({
                category: Yup.string().required('Categoría requerida'),
                name: Yup.string().required('Nombre requerido'),
                dailyAmount: Yup.number()
                    .typeError('Debe ser un número')
                    .min(0, 'Debe ser mayor o igual a 0')
                    .required('Cantidad requerida'),
                unit: Yup.string().required('Unidad requerida'),
                observations: Yup.string()
            })
        ),
        initialMedications: Yup.array().of(
            Yup.object().shape({
                type: Yup.string()
                    .oneOf(['medicamento', 'vacuna', 'antibiótico', 'desparasitante', 'otro'])
                    .required('Tipo es obligatorio'),
                name: Yup.string().required('Nombre es obligatorio'),
                dose: Yup.number()
                    .typeError('Dosis debe ser un número')
                    .min(0, 'Dosis debe ser mayor o igual a 0')
                    .required('Dosis es obligatoria'),
                unit: Yup.string().required('Unidad es obligatoria'),
                route: Yup.string()
                    .oneOf(['oral', 'intramuscular', 'subcutánea', 'tópica', 'intravenosa'])
                    .required('Vía de administración es obligatoria'),
                applicationDate: Yup.date()
                    .nullable()
                    .required('Fecha de aplicación es obligatoria'),
                observations: Yup.string().notRequired(),
            })
        ),
    });

    const formik = useFormik<PigData>({
        initialValues: initialData || {
            _id: '',
            code: '',
            farmId: '',
            breed: '',
            birthdate: null,
            origin: 'nacido',
            originDetail: '',
            sourceFarm: '',
            arrivalDate: null,
            status: 'vivo',
            currentStage: 'lechón',
            sex: 'macho',
            weight: 0,
            observations: '',
            historyChanges: [],
            discarded: false,
            discardReason: '',
            discardDestination: '',
            discardDeathCause: '',
            discardResponsible: userLogged._id || '',
            initialFeedings: [],
            initialMedications: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: handleFormSubmit,
    });

    useEffect(() => {
        if (formik.values.discarded) {
            formik.setFieldValue('status', 'descartado');
        } else {
            formik.setFieldValue('status', 'vivo');
        }
    }, [formik.values.discarded, formik.values.discardReason]);

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-pigData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-pigData-tab"
                                disabled
                            >
                                Información de cerdo
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-feeding-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-feeding-tab"
                                disabled
                            >
                                Alimentación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-medication-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-medication-tab"
                                disabled
                            >
                                Medicación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 4,
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
                    <TabPane id='step-pigData-tab' tabId={1}>
                        <div className="d-flex gap-3">
                            {/* Código */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="code" className="form-label">Código</Label>
                                <Input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                />
                                {formik.touched.code && formik.errors.code && (
                                    <FormFeedback>{formik.errors.code}</FormFeedback>
                                )}
                            </div>

                            {/* Fecha de nacimiento */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="birthdate" className="form-label">Fecha de nacimiento</Label>
                                <DatePicker
                                    id="birthdate"
                                    className={`form-control ${formik.touched.birthdate && formik.errors.birthdate ? 'is-invalid' : ''}`}
                                    value={formik.values.birthdate ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('birthdate', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.birthdate && formik.errors.birthdate && (
                                    <FormFeedback className="d-block">{formik.errors.birthdate as string}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-3">

                            <div className="mt-4 w-50">
                                <Label htmlFor="breedInput" className="form-label">Raza</Label>
                                <Input
                                    type="select"
                                    id="breedInput"
                                    name="breed"
                                    value={formik.values.breed}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.breed && !!formik.errors.breed}
                                >
                                    <option value="">Seleccione una raza</option>
                                    <option value="Yorkshire">Yorkshire</option>
                                    <option value="Landrace">Landrace</option>
                                    <option value="Duroc">Duroc</option>
                                    <option value="Hampshire">Hampshire</option>
                                    <option value="Pietrain">Pietrain</option>
                                    <option value="Berkshire">Berkshire</option>
                                    <option value="Large White">Large White</option>
                                    <option value="Chester White">Chester White</option>
                                    <option value="Poland China">Poland China</option>
                                    <option value="Tamworth">Tamworth</option>
                                </Input>
                                {formik.touched.breed && formik.errors.breed && (
                                    <FormFeedback>{formik.errors.breed}</FormFeedback>
                                )}
                            </div>


                            <div className="mt-4 w-50">
                                <Label htmlFor="currentStage" className="form-label">Etapa actual</Label>
                                <Input
                                    type="select"
                                    id="currentStage"
                                    name="currentStage"
                                    value={formik.values.currentStage}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.currentStage && !!formik.errors.currentStage}
                                >
                                    <option value="lechón">Lechón</option>
                                    <option value="destete">Destete</option>
                                    <option value="engorda">Engorda</option>
                                    <option value="reproductor">Reproductor</option>
                                </Input>
                                {formik.touched.currentStage && formik.errors.currentStage && (
                                    <FormFeedback>{formik.errors.currentStage}</FormFeedback>
                                )}
                            </div>

                        </div>


                        {/* Origen */}
                        <div className="mt-4">
                            <Label htmlFor="origin" className="form-label">Origen</Label>
                            <Input
                                type="select"
                                id="origin"
                                name="origin"
                                value={formik.values.origin}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.origin && !!formik.errors.origin}
                            >
                                <option value="nacido">Nacido en la granja</option>
                                <option value="comprado">Comprado</option>
                                <option value="donado">Donado</option>
                                <option value="otro">Otro</option>
                            </Input>
                            {formik.touched.origin && formik.errors.origin && (
                                <FormFeedback>{formik.errors.origin}</FormFeedback>
                            )}
                        </div>

                        {/* Detalle del origen */}
                        {formik.values.origin === 'otro' && (
                            <div className="mt-4">
                                <Label htmlFor="originDetail" className="form-label">Detalle del origen</Label>
                                <Input
                                    type="text"
                                    id="originDetail"
                                    name="originDetail"
                                    value={formik.values.originDetail}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.originDetail && !!formik.errors.originDetail}
                                />
                                {formik.touched.originDetail && formik.errors.originDetail && (
                                    <FormFeedback>{formik.errors.originDetail as string}</FormFeedback>
                                )}
                            </div>
                        )}

                        {/* Fecha de llegada */}
                        {formik.values.origin !== 'nacido' && (
                            <div className="mt-4">
                                <Label htmlFor="arrivalDate" className="form-label">Fecha de llegada</Label>
                                <DatePicker
                                    id="arrivalDate"
                                    className={`form-control ${formik.touched.arrivalDate && formik.errors.arrivalDate ? 'is-invalid' : ''}`}
                                    value={formik.values.arrivalDate ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('arrivalDate', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.arrivalDate && formik.errors.arrivalDate && (
                                    <FormFeedback className="d-block">{formik.errors.arrivalDate as string}</FormFeedback>
                                )}
                            </div>
                        )}

                        {/* Granja de origen */}
                        {(formik.values.origin === 'comprado' || formik.values.origin === 'donado') && (
                            <div className="mt-4">
                                <Label htmlFor="sourceFarm" className="form-label">Granja de origen</Label>
                                <Input
                                    type="text"
                                    id="sourceFarm"
                                    name="sourceFarm"
                                    value={formik.values.sourceFarm}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.sourceFarm && !!formik.errors.sourceFarm}
                                />
                                {formik.touched.sourceFarm && formik.errors.sourceFarm && (
                                    <FormFeedback>{formik.errors.sourceFarm as string}</FormFeedback>
                                )}
                            </div>
                        )}


                        <div className="d-flex gap-3">
                            <div className="mt-4 w-50">
                                <Label htmlFor="sex" className="form-label">Sexo</Label>
                                <Input
                                    type="select"
                                    id="sex"
                                    name="sex"
                                    value={formik.values.sex}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.sex && !!formik.errors.sex}
                                >
                                    <option value="macho">Macho</option>
                                    <option value="hembra">Hembra</option>
                                </Input>
                                {formik.touched.sex && formik.errors.sex && (
                                    <FormFeedback>{formik.errors.sex}</FormFeedback>
                                )}
                            </div>

                            {/* Peso */}
                            <div className="mt-4 w-50">
                                <Label htmlFor="weight" className="form-label">Peso (kg)</Label>
                                <Input
                                    type="number"
                                    id="weight"
                                    name="weight"
                                    value={formik.values.weight}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.weight && !!formik.errors.weight}
                                />
                                {formik.touched.weight && formik.errors.weight && (
                                    <FormFeedback>{formik.errors.weight}</FormFeedback>
                                )}
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">Caracteristicas fisicas</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                value={formik.values.observations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </div>

                        {/* Descartado */}
                        <div className="mt-4 form-check">
                            <Input
                                type="checkbox"
                                id="discarded"
                                name="discarded"
                                checked={formik.values.discarded}
                                onChange={formik.handleChange}
                                className="form-check-input"
                            />
                            <Label htmlFor="discarded" className="form-check-label">¿Descartado?</Label>
                        </div>

                        {/* Si descartado, mostrar campos */}
                        {formik.values.discarded && (
                            <>
                                <div className="mt-4">
                                    <Label htmlFor="discardReason" className="form-label">Motivo del descarte</Label>
                                    <Input
                                        type="select"
                                        id="discardReason"
                                        name="discardReason"
                                        value={formik.values.discardReason || ''}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.discardReason && !!formik.errors.discardReason}
                                    >
                                        <option value="">Seleccione un motivo</option>
                                        <option value="enfermo">Enfermo</option>
                                        <option value="lesionado">Lesionado</option>
                                        <option value="muerto">Muerto</option>
                                        <option value="error_registro">Error de registro</option>
                                        <option value="otro">Otro</option>
                                    </Input>
                                    {formik.touched.discardReason && formik.errors.discardReason && (
                                        <FormFeedback>{formik.errors.discardReason}</FormFeedback>
                                    )}
                                </div>

                                <div className="mt-4">
                                    <Label htmlFor="discardDestination" className="form-label">Destino del animal</Label>
                                    <Input
                                        type="select"
                                        id="discardDestination"
                                        name="discardDestination"
                                        value={formik.values.discardDestination || ''}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.discardDestination && !!formik.errors.discardDestination}
                                    >
                                        <option value="">Seleccione un destino</option>
                                        <option value="incineracion">Incineración</option>
                                        <option value="devolucion">Devolución</option>
                                        <option value="otro">Otro</option>
                                    </Input>
                                    {formik.touched.discardDestination && formik.errors.discardDestination && (
                                        <FormFeedback>{formik.errors.discardDestination}</FormFeedback>
                                    )}
                                </div>

                                {formik.values.discarded && formik.values.discardReason === 'muerto' && (
                                    <>
                                        <div className="mt-4">
                                            <Label htmlFor="discardDeathCause">Causa probable de muerte</Label>
                                            <Input
                                                type="text"
                                                id="discardDeathCause"
                                                name="discardDeathCause"
                                                value={formik.values.discardDeathCause}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.discardDeathCause && !!formik.errors.discardDeathCause}
                                            />
                                            {formik.touched.discardDeathCause && formik.errors.discardDeathCause && (
                                                <FormFeedback>{formik.errors.discardDeathCause}</FormFeedback>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <Label htmlFor="discardResponsible">Responsable del reporte</Label>
                                            <Input
                                                type="text"
                                                id="discardResponsible"
                                                name="discardResponsible"
                                                value={`${userLogged.username} - ${userLogged.name} ${userLogged.lastname}`}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => {
                                    formik.validateForm().then(() => {
                                        if (validateGeneralInfo(formik.values)) {
                                            toggleArrowTab(activeStep + 1);
                                        } else {
                                            showIncompleteFieldsAlert('Hay campos requeridos sin completar. Revise el formulario.');
                                        }
                                    });
                                }}
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-feeding-tab" tabId={2}>
                        {/* Botón para mostrar/ocultar formulario (se mantiene igual) */}
                        <Button
                            color={showFeedingForm ? "danger" : "primary"}
                            className="mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                            onClick={() => setShowFeedingForm(!showFeedingForm)}
                        >
                            {showFeedingForm ? (
                                <>
                                    <i className="ri-close-circle-line fs-16"></i>
                                    Cancelar
                                </>
                            ) : (
                                <>
                                    <i className="ri-add-circle-line fs-16"></i>
                                    Agregar nueva alimentación
                                </>
                            )}
                        </Button>

                        {/* Formulario colapsable - Diseño mejorado */}
                        {showFeedingForm && (
                            <div className="border p-4 rounded mb-4 bg-light">
                                {alertConfig.visible && (
                                    <Alert color={alertConfig.color} className="p-3">
                                        {alertConfig.message}
                                    </Alert>
                                )}

                                <h5 className="mb-3 text-primary">Nueva entrada de alimentación</h5>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <Label for="category" className="form-label fw-semibold">Categoría</Label>
                                        <Input
                                            type="select"
                                            id="category"
                                            name="category"
                                            value={feedingForm.category}
                                            onChange={handleFeedingInputChange}
                                            className="form-select"
                                        >
                                            <option value="">Seleccione categoría</option>
                                            <option value="alimento">Alimento</option>
                                            <option value="suplemento">Suplemento</option>
                                            <option value="vitamina">Vitamina</option>
                                            <option value="otro">Otro</option>
                                        </Input>
                                    </div>

                                    <div className="col-md-6">
                                        <Label for="name" className="form-label fw-semibold">Nombre</Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={feedingForm.name}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            placeholder="Ej: Concentrado, Vitaminas, etc."
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <Label for="dailyAmount" className="form-label fw-semibold">Cantidad diaria</Label>
                                        <Input
                                            type="number"
                                            id="dailyAmount"
                                            name="dailyAmount"
                                            value={feedingForm.dailyAmount}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <Label for="unit" className="form-label fw-semibold">Unidad</Label>
                                        <Input
                                            type="text"
                                            id="unit"
                                            name="unit"
                                            value={feedingForm.unit}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            placeholder="Ej: kg, ml, g"
                                        />
                                    </div>

                                    <div className="col-12">
                                        <Label for="observations" className="form-label fw-semibold">Observaciones</Label>
                                        <Input
                                            type="textarea"
                                            id="observations"
                                            name="observations"
                                            value={feedingForm.observations}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            rows="3"
                                            placeholder="Notas adicionales sobre la alimentación"
                                        />
                                    </div>

                                    <div className="col-12 text-end">
                                        <Button color="success" className="px-4" onClick={handleAddFeedingEntry}>
                                            <i className="ri-save-line me-2"></i> Guardar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de entradas - Diseño mejorado */}
                        <div className="mt-4">
                            <h5 className="mb-3 text-primary">Registro de Alimentación</h5>

                            {formik.values.initialFeedings && formik.values.initialFeedings.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-nowrap align-middle mb-0 fs-5">
                                        <thead>
                                            <tr className="table-active">
                                                <th scope="col" style={{ width: '15%' }}>Categoría</th>
                                                <th scope="col" style={{ width: '25%' }}>Nombre</th>
                                                <th scope="col" style={{ width: '15%' }}>Cantidad</th>
                                                <th scope="col" style={{ width: '30%' }}>Observaciones</th>
                                                <th scope="col" style={{ width: '15%' }} className="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formik.values.initialFeedings.map((feed, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <span className={`badge ${feed.category === 'alimento' ? 'bg-success' :
                                                            feed.category === 'suplemento' ? 'bg-info' :
                                                                feed.category === 'vitamina' ? 'bg-warning' :
                                                                    'bg-secondary'}`}>
                                                            {feed.category}
                                                        </span>
                                                    </td>
                                                    <td><strong>{feed.name}</strong></td>
                                                    <td>{feed.dailyAmount} <small className="text-muted">{feed.unit}</small></td>
                                                    <td>
                                                        {feed.observations || <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleRemoveFeedingEntry(index)}
                                                        >
                                                            <i className="ri-delete-bin-line align-bottom"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info mb-0">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <i className="ri-information-line display-5"></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5 className="alert-heading">No hay registros</h5>
                                            <p className="mb-0">Agrega una nueva alimentación usando el botón superior</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones de navegación (se mantienen igual) */}
                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab ms-auto farm-secondary-button"
                                onClick={() => toggleArrowTab(activeStep + 1)}
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-medication-tab' tabId={3}>
                        <>
                            <Button
                                color={showMedicationForm ? "danger" : "primary"}
                                className="mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                onClick={() => setShowMedicationForm(!showMedicationForm)}
                            >
                                {showMedicationForm ? (
                                    <>
                                        <i className="ri-close-circle-line fs-16"></i>
                                        Cancelar
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-add-circle-line fs-16"></i>
                                        Agregar nueva medicación
                                    </>
                                )}
                            </Button>

                            {showMedicationForm && (
                                <div className="border p-4 rounded mb-4 bg-light">
                                    <h5 className="mb-3 text-primary">Nueva entrada de medicación</h5>

                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <Label htmlFor="type" className="form-label fw-semibold">Tipo</Label>
                                            <Input
                                                type="select"
                                                id="type"
                                                name="type"
                                                value={medicationForm.type}
                                                onChange={handleMedicationInputChange}
                                                className="form-select"
                                            >
                                                <option value="">Seleccione tipo</option>
                                                <option value="medicamento">Medicamento</option>
                                                <option value="vacuna">Vacuna</option>
                                                <option value="antibiótico">Antibiótico</option>
                                                <option value="desparasitante">Desparasitante</option>
                                                <option value="otro">Otro</option>
                                            </Input>
                                        </div>

                                        <div className="col-md-4">
                                            <Label htmlFor="name" className="form-label fw-semibold">Nombre</Label>
                                            <Input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={medicationForm.name}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                placeholder="Ej: Ivermectina, Vacuna Aujeszky..."
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Label htmlFor="applicationDate" className="form-label fw-semibold">Fecha de aplicación</Label>
                                            <DatePicker
                                                id="applicationDate"
                                                className="form-control"
                                                value={medicationForm.applicationDate ?? undefined}
                                                onChange={handleMedicationDateChange}
                                                options={{ dateFormat: 'd/m/Y' }}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Label htmlFor="dose" className="form-label fw-semibold">Dosis</Label>
                                            <Input
                                                type="number"
                                                id="dose"
                                                name="dose"
                                                value={medicationForm.dose}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Label htmlFor="unit" className="form-label fw-semibold">Unidad</Label>
                                            <Input
                                                type="text"
                                                id="unit"
                                                name="unit"
                                                value={medicationForm.unit}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                placeholder="Ej: ml, mg, UI"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Label htmlFor="route" className="form-label fw-semibold">Vía de administración</Label>
                                            <Input
                                                type="select"
                                                id="route"
                                                name="route"
                                                value={medicationForm.route}
                                                onChange={handleMedicationInputChange}
                                                className="form-select"
                                            >
                                                <option value="">Seleccione vía</option>
                                                <option value="oral">Oral</option>
                                                <option value="intramuscular">Intramuscular</option>
                                                <option value="subcutánea">Subcutánea</option>
                                                <option value="tópica">Tópica</option>
                                                <option value="intravenosa">Intravenosa</option>
                                            </Input>
                                        </div>


                                        <div className="col-md-12">
                                            <Label htmlFor="observations" className="form-label fw-semibold">Observaciones</Label>
                                            <Input
                                                type="textarea"
                                                id="observations"
                                                name="observations"
                                                value={medicationForm.observations}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                rows={3}
                                                placeholder="Notas adicionales"
                                            />
                                        </div>

                                        <div className="col-12 text-end">
                                            <Button color="success" className="px-4" onClick={handleAddMedicationEntry}>
                                                <i className="ri-save-line me-2"></i> Guardar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabla de entradas */}
                            <div className="mt-4">
                                <h5 className="mb-3 text-primary">Registro de Medicación</h5>

                                {formik.values.initialMedications && formik.values.initialMedications.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-nowrap align-middle mb-0 fs-5">
                                            <thead>
                                                <tr className="table-active">
                                                    <th style={{ width: '12%' }}>Tipo</th>
                                                    <th style={{ width: '25%' }}>Nombre</th>
                                                    <th style={{ width: '10%' }}>Dosis</th>
                                                    <th style={{ width: '10%' }}>Unidad</th>
                                                    <th style={{ width: '15%' }}>Vía</th>
                                                    <th style={{ width: '15%' }}>Fecha</th>
                                                    <th style={{ width: '20%' }}>Observaciones</th>
                                                    <th className="text-end" style={{ width: '8%' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formik.values.initialMedications.map((med, i) => (
                                                    <tr key={i}>
                                                        <td>{med.type}</td>
                                                        <td><strong>{med.name}</strong></td>
                                                        <td>{med.dose}</td>
                                                        <td>{med.unit}</td>
                                                        <td>{med.route}</td>
                                                        <td>{med.applicationDate ? new Date(med.applicationDate).toLocaleDateString() : '-'}</td>
                                                        <td>{med.observations || <span className="text-muted">-</span>}</td>
                                                        <td className="text-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleRemoveMedicationEntry(i)}
                                                            >
                                                                <i className="ri-delete-bin-line align-bottom"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info mb-0">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <i className="ri-information-line display-5"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="alert-heading">No hay registros</h5>
                                                <p className="mb-0">Agrega una nueva medicación usando el botón superior</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                        <div className="d-flex mt-4">

                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep + 1);
                                }}

                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>

                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={4}>
                        <div className="summary-container fs-5">
                            <h3 className="mb-4 text-primary fw-bold">
                                <i className="ri-file-list-2-line me-2"></i>
                                Resumen del Registro
                            </h3>

                            {/* Sección de Información General - Versión final */}
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-light">
                                    <h4 className="card-title mb-0 fw-semibold">
                                        <i className="ri-information-line me-2"></i>
                                        Información General
                                    </h4>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {/* Columna 1 */}
                                        <div className="col-md-4">
                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Código:</p>
                                                <p className="text-muted">{formik.values.code || 'No ingresado'}</p>
                                            </div>

                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Raza:</p>
                                                <p className="text-muted">{formik.values.breed || 'No ingresada'}</p>
                                            </div>

                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Etapa actual:</p>
                                                <p className="text-muted">{formik.values.currentStage || 'No ingresada'}</p>
                                            </div>
                                        </div>

                                        {/* Columna 2 */}
                                        <div className="col-md-4">
                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Fecha nacimiento:</p>
                                                <p className="text-muted">
                                                    {formik.values.birthdate ? new Date(formik.values.birthdate).toLocaleDateString() : 'No ingresada'}
                                                </p>
                                            </div>

                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Origen:</p>
                                                <p className="text-muted">{formik.values.origin || 'No ingresado'}</p>
                                            </div>

                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Peso:</p>
                                                <p className="text-muted">{formik.values.weight ? `${formik.values.weight} kg` : 'No ingresado'}</p>
                                            </div>
                                        </div>

                                        {/* Columna 3 */}
                                        <div className="col-md-4">
                                            <div className="border-bottom pb-2 mb-2">
                                                <p className="fw-semibold mb-1">Sexo:</p>
                                                <p className="text-muted">{formik.values.sex || 'No ingresado'}</p>
                                            </div>

                                            {formik.values.origin !== 'nacido' && (
                                                <div className="border-bottom pb-2 mb-2">
                                                    <p className="fw-semibold mb-1">Fecha llegada:</p>
                                                    <p className="text-muted">
                                                        {formik.values.arrivalDate ? new Date(formik.values.arrivalDate).toLocaleDateString() : 'No ingresada'}
                                                    </p>
                                                </div>
                                            )}

                                            {(formik.values.origin === 'comprado' || formik.values.origin === 'donado') && (
                                                <div className="border-bottom pb-2 mb-2">
                                                    <p className="fw-semibold mb-1">Granja origen:</p>
                                                    <p className="text-muted">{formik.values.sourceFarm || 'No ingresada'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalle de origen cuando es "otro" - Ahora en sección separada */}
                                    {formik.values.origin === 'otro' && formik.values.originDetail && (
                                        <div className="mt-3 bg-light p-3 rounded">
                                            <p className="fw-semibold mb-1">Detalle del origen:</p>
                                            <p className="text-muted mb-0">{formik.values.originDetail}</p>
                                        </div>
                                    )}

                                    {formik.values.observations && (
                                        <div className="mt-3 bg-light p-3 rounded">
                                            <p className="fw-semibold mb-1">Características físicas:</p>
                                            <p className="text-muted mb-0">{formik.values.observations}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección de Descarte - Versión final */}
                            {formik.values.discarded && (
                                <div className="card mb-4 border-0 shadow-sm">
                                    <div className="card-header bg-warning bg-opacity-10">
                                        <h4 className="card-title mb-0 fw-semibold text-warning">
                                            <i className="ri-alert-line me-2"></i>
                                            Información de Descarte
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="d-flex mb-3">
                                                    <div style={{ width: '140px' }} className="fw-semibold">Motivo:</div>
                                                    <div>{formik.values.discardReason}</div>
                                                </div>

                                                <div className="d-flex mb-3">
                                                    <div style={{ width: '140px' }} className="fw-semibold">Destino:</div>
                                                    <div>{formik.values.discardDestination}</div>
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                {formik.values.discardReason === 'muerto' && (
                                                    <>
                                                        <div className="d-flex mb-3">
                                                            <div style={{ width: '140px' }} className="fw-semibold">Causa muerte:</div>
                                                            <div>{formik.values.discardDeathCause}</div>
                                                        </div>

                                                        <div className="d-flex mb-3">
                                                            <div style={{ width: '140px' }} className="fw-semibold">Responsable:</div>
                                                            <div>{userLogged.name} {userLogged.lastname}</div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sección de Alimentación */}
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-light">
                                    <h4 className="card-title mb-0 fw-semibold">
                                        <i className="ri-restaurant-line me-2"></i>
                                        Alimentación
                                    </h4>
                                </div>
                                <div className="card-body">
                                    {formik.values.initialFeedings.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Categoría</th>
                                                        <th>Nombre</th>
                                                        <th>Cantidad</th>
                                                        <th>Unidad</th>
                                                        <th>Observaciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formik.values.initialFeedings.map((feed, index) => (
                                                        <tr key={index}>
                                                            <td>{feed.category}</td>
                                                            <td>{feed.name}</td>
                                                            <td>{feed.dailyAmount}</td>
                                                            <td>{feed.unit}</td>
                                                            <td>{feed.observations || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info mb-0">
                                            No se han registrado datos de alimentación
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección de Medicación */}
                            <div className="card mb-4 border-0 shadow-sm">
                                <div className="card-header bg-light">
                                    <h4 className="card-title mb-0 fw-semibold">
                                        <i className="ri-medicine-bottle-line me-2"></i>
                                        Medicación
                                    </h4>
                                </div>
                                <div className="card-body">
                                    {formik.values.initialMedications.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Tipo</th>
                                                        <th>Nombre</th>
                                                        <th>Dosis</th>
                                                        <th>Fecha</th>
                                                        <th>Vía</th>
                                                        <th>Observaciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formik.values.initialMedications.map((med, index) => (
                                                        <tr key={index}>
                                                            <td>{med.type}</td>
                                                            <td>{med.name}</td>
                                                            <td>{med.dose} {med.unit}</td>
                                                            <td>{med.applicationDate ? new Date(med.applicationDate).toLocaleDateString() : '-'}</td>
                                                            <td>{med.route}</td>
                                                            <td>{med.observations || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info mb-0">
                                            No se han registrado datos de medicación
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones de navegación */}
                            <div className="d-flex mt-4">
                                <Button
                                    className="btn btn-light btn-label previestab farm-secondary-button"
                                    onClick={() => toggleArrowTab(activeStep - 1)}
                                >
                                    <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
                                    Atrás
                                </Button>

                                <Button
                                    type="submit"
                                    className="farm-primary-button ms-auto"
                                    disabled={formik.isSubmitting}
                                >
                                    {formik.isSubmitting ? (
                                        <>
                                            <Spinner className="me-2" size="sm" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line me-2"></i>
                                            Confirmar Registro
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabPane>

                </TabContent>
            </form>



            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Cancelar registro</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>
            <Modal isOpen={confirmDiscardModalOpen} centered toggle={cancelDiscardModal} backdrop="static" keyboard={false}>
                <ModalHeader toggle={cancelDiscardModal} className="text-white d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                    Confirmar Descarte
                </ModalHeader>
                <ModalBody className="text-center">
                    <p className="fs-5 mb-3">Estás por descartar el cerdo <strong>{pendingSubmitValues?.code}</strong>.</p>
                    <p className="mb-3 fs-5">Por favor verifica que la información de descarte sea correcta:</p>

                    <ul className="list-group text-start mx-auto fs-5" style={{ maxWidth: '350px' }}>
                        <li className="list-group-item">
                            <strong>Motivo:</strong> {pendingSubmitValues?.discardReason}
                        </li>
                        <li className="list-group-item">
                            <strong>Destino:</strong> {pendingSubmitValues?.discardDestination}
                        </li>
                        {pendingSubmitValues?.discardDeathCause && (
                            <li className="list-group-item">
                                <strong>Causa de muerte:</strong> {pendingSubmitValues.discardDeathCause}
                            </li>
                        )}
                        {pendingSubmitValues?.discardResponsible && (
                            <li className="list-group-item">
                                <strong>Responsable:</strong> {userLogged.name} {userLogged.lastname}
                            </li>
                        )}
                    </ul>
                </ModalBody>
                <ModalFooter className="justify-content-end">
                    <Button color="secondary" onClick={cancelDiscardModal} className="me-1 px-4">
                        Cancelar
                    </Button>
                    <Button color="success" onClick={confirmDiscardSubmit} className="px-4">
                        Confirmar
                    </Button>
                </ModalFooter>
            </Modal>

            {incompleteFieldsAlert.visible && (
                <Alert color="danger" className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    <div className="d-flex align-items-center">
                        <i className="ri-error-warning-fill me-2 fs-4"></i>
                        <div>
                            <h5 className="alert-heading mb-1">Campos incompletos</h5>
                            <p className="mb-0">{incompleteFieldsAlert.message}</p>
                        </div>
                    </div>
                </Alert>
            )}
        </>
    );
};

export default PigForm;