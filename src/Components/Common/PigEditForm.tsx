import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import * as Yup from "yup";

interface PigEditFormProps {
    initialData: PigData;
    onSave: () => void;
    onCancel: () => void;
}

const PigEditForm: React.FC<PigEditFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    const handleError = (error: any, message: string) => {
        console.error(`${message}: ${error}`);
        setAlertConfig({ visible: true, color: "danger", message: message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const validationSchema = Yup.object({
        code: Yup.string().required("Código requerido"),
        birthdate: Yup.date().max(new Date(), "La fecha no puede ser futura").required("Fecha de nacimiento requerida"),
        breed: Yup.string().required("Raza requerida"),
        origin: Yup.mixed<'nacido' | 'comprado' | 'donado' | 'otro'>()
            .oneOf(["nacido", "comprado", "donado", "otro"])
            .required("Seleccione el origen"),
        originDetail: Yup.string().when("origin", {
            is: "otro",
            then: (schema) => schema.required("Especifique el origen"),
            otherwise: (schema) => schema.notRequired(),
        }),
        arrivalDate: Yup.date().when("origin", {
            is: (val: string) => val !== "nacido",
            then: (schema) => schema.max(new Date(), "Fecha no válida").required("Ingrese fecha de llegada"),
            otherwise: (schema) => schema.notRequired(),
        }),
        sourceFarm: Yup.string().when("origin", {
            is: (val: string) => val === "comprado" || val === "donado",
            then: (schema) => schema.required("Ingrese la granja de origen"),
            otherwise: (schema) => schema.notRequired(),
        }),
        sex: Yup.mixed<"macho" | "hembra">().oneOf(["macho", "hembra"]).required("Seleccione el sexo"),
        weight: Yup.number().min(0, "Peso inválido").max(300, "Peso inválido").required("Peso requerido"),
        observations: Yup.string().notRequired(),
    });

    const formik = useFormik<PigData>({
        initialValues: initialData,
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setSubmitting(true);
                if (!configContext) throw new Error("El servicio no está disponible");

                const response = await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update/${values._id}/${userLogged._id}`, values);

                if (response.status === HttpStatusCode.Ok) {
                    await configContext.axiosHelper.create(
                        `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                        { event: `Edición de cerdo ${values.code}` }
                    );
                    onSave();
                }
            } catch (error) {
                handleError(error, "Error al guardar los datos");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                {/* Código (deshabilitado) */}
                <div className="mt-4">
                    <Label htmlFor="code">Código</Label>
                    <Input type="text" id="code" name="code" value={formik.values.code} disabled />
                </div>

                {/* Fecha de nacimiento y raza */}
                <div className="d-flex gap-3">
                    <div className="mt-4 w-50">
                        <Label htmlFor="birthdate">Fecha de nacimiento</Label>
                        <DatePicker
                            id="birthdate"
                            className={`form-control ${formik.touched.birthdate && formik.errors.birthdate ? "is-invalid" : ""}`}
                            value={formik.values.birthdate ?? undefined}
                            onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue("birthdate", date[0]); }}
                            options={{ dateFormat: "d/m/Y" }}
                            disabled
                            style={{ backgroundColor: 'lightgrey' }}
                        />
                        {formik.touched.birthdate && formik.errors.birthdate && (
                            <FormFeedback className="d-block">{formik.errors.birthdate as string}</FormFeedback>
                        )}
                    </div>

                    <div className="mt-4 w-50">
                        <Label htmlFor="breed">Raza</Label>
                        <Input
                            type="select"
                            id="breed"
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
                        </Input>
                        {formik.touched.breed && formik.errors.breed && (
                            <FormFeedback>{formik.errors.breed}</FormFeedback>
                        )}
                    </div>
                </div>

                {/* Origen */}
                <div className="mt-4">
                    <Label htmlFor="origin">Origen</Label>
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

                {/* Detalle origen */}
                {formik.values.origin === "otro" && (
                    <div className="mt-4">
                        <Label htmlFor="originDetail">Detalle del origen</Label>
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

                {/* Fecha llegada */}
                {formik.values.origin !== "nacido" && (
                    <div className="mt-4">
                        <Label htmlFor="arrivalDate">Fecha de llegada</Label>
                        <DatePicker
                            id="arrivalDate"
                            className={`form-control ${formik.touched.arrivalDate && formik.errors.arrivalDate ? "is-invalid" : ""}`}
                            value={formik.values.arrivalDate ?? undefined}
                            onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue("arrivalDate", date[0]); }}
                            options={{ dateFormat: "d/m/Y" }}
                        />
                        {formik.touched.arrivalDate && formik.errors.arrivalDate && (
                            <FormFeedback className="d-block">{formik.errors.arrivalDate as string}</FormFeedback>
                        )}
                    </div>
                )}

                {/* Granja de origen */}
                {(formik.values.origin === "comprado" || formik.values.origin === "donado") && (
                    <div className="mt-4">
                        <Label htmlFor="sourceFarm">Granja de origen</Label>
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

                {/* Sexo y peso */}
                <div className="d-flex gap-3">
                    <div className="mt-4 w-50">
                        <Label htmlFor="sex">Sexo</Label>
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

                    <div className="mt-4 w-50">
                        <Label htmlFor="weight">Peso (kg)</Label>
                        <Input
                            type="number"
                            id="weight"
                            name="weight"
                            value={formik.values.weight}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.weight && !!formik.errors.weight}
                            disabled
                        />
                        {formik.touched.weight && formik.errors.weight && (
                            <FormFeedback>{formik.errors.weight}</FormFeedback>
                        )}
                    </div>
                </div>

                {/* Observaciones */}
                <div className="mt-4">
                    <Label htmlFor="observations">Observaciones</Label>
                    <Input
                        type="textarea"
                        id="observations"
                        name="observations"
                        value={formik.values.observations}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </div>

                {/* Botones */}
                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <Button type="button" className="farm-secondary-button" onClick={() => setCancelModalOpen(true)}>Cancelar</Button>
                    <Button type="submit" className="farm-primary-button">Guardar</Button>
                </div>
            </form>

            {alertConfig.visible && <Alert color={alertConfig.color} className="p-3 mt-3">{alertConfig.message}</Alert>}

            <Modal isOpen={cancelModalOpen} centered toggle={() => setCancelModalOpen(!cancelModalOpen)}>
                <ModalHeader>Cancelar edición</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los cambios no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => setCancelModalOpen(false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default PigEditForm;