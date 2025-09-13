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
            feedings: [],
            medications: [],
            reproduction: []
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                if (!configContext) throw new Error('El servicio no está disponible, inténtelo más tarde');
                values.farmId = userLogged.farm_assigned;

                if (initialData) {
                    const response = await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update/${initialData._id}/${userLogged._id}`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Actualización de datos del cerdo ${values.code}`
                    });
                } else {
                    const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de cerdo ${values.code}`
                    });
                }

                onSave();
            } catch (error) {
                handleError(error, 'Ha ocurrido un error al guardar los datos, inténtelo más tarde');
            }
        }
    });

    useEffect(() => {
        formik.setFieldValue('birthdate', new Date())
    }, [])

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
                            placeholder="Ej: C001"
                            disabled={initialData ? true : false}
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

                    <div className="mt-4 w-100">
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


                    <div className="mt-4 w-100">
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

                    {/* Origen */}
                    <div className="mt-4 w-100">
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
                        placeholder="Ej: Marca de nacimiento"
                    />
                </div>

                <div className="d-flex mt-4 gap-2 justify-content-end">
                    <Button className="farm-secondary-button" onClick={() => setCancelModalOpen(true)}>
                        Cancelar
                    </Button>
                    <Button className="farm-primary-button" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <div>
                                Registrar
                            </div>
                        )}
                    </Button>
                </div>

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
        </>
    );
};

export default PigForm;