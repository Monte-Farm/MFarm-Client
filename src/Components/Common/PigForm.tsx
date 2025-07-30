import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import * as Yup from 'yup';

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
        status: Yup.mixed<'vivo' | 'vendido' | 'sacrificado' | 'muerto'>()
            .oneOf(['vivo', 'vendido', 'sacrificado', 'muerto'], 'Estado inválido')
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
            discardResponsible: userLogged._id || ''
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: handleFormSubmit,
    });

    useEffect(() => {
        if (formik.values.discarded && formik.values.discardReason === 'muerto') {
            formik.setFieldValue('status', 'muerto');
        } else if (formik.values.discarded) {
            formik.setFieldValue('status', 'descartado');
        } else {
            formik.setFieldValue('status', 'vivo');
        }
    }, [formik.values.discarded, formik.values.discardReason]);

    return (
        <>
            <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>

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

                {/* Botones */}
                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <Button type="button" className="farm-secondary-button" disabled={formik.isSubmitting} onClick={() => setCancelModalOpen(true)}>Cancelar</Button>
                    <Button type="submit" className="farm-primary-button" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <>
                                <Spinner className="me-3" size="sm" />
                                Guardando
                            </>
                        ) : (
                            <>
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="p-3">
                    {alertConfig.message}
                </Alert>
            )}

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

        </>
    );
};

export default PigForm;