import { ConfigContext } from "App";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import React, { useContext } from "react";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label } from "reactstrap";
import * as Yup from "yup";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useState } from "react";

interface ExpenseFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const categoryOptions = [
    { value: "LABOR", label: "Sueldos y nómina" },
    { value: "UTILITY", label: "Servicios (luz, agua, gas)" },
    { value: "MAINTENANCE", label: "Mantenimiento" },
    { value: "TRANSPORT", label: "Transporte" },
    { value: "LIVESTOCK_PURCHASE", label: "Compra de ganado" },
    { value: "VETERINARY", label: "Veterinario" },
    { value: "OTHER", label: "Otro" },
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const validationSchema = Yup.object({
        date: Yup.date()
            .max(new Date(), "La fecha no puede ser futura")
            .required("Por favor ingrese la fecha"),
        category: Yup.string()
            .oneOf(categoryOptions.map((c) => c.value), "Categoría inválida")
            .required("Por favor seleccione una categoría"),
        description: Yup.string()
            .required("Por favor ingrese una descripción"),
        amount: Yup.number()
            .min(0.01, "El monto debe ser mayor a 0")
            .required("Por favor ingrese el monto"),
    });

    const formik = useFormik({
        initialValues: {
            date: new Date() as Date | null,
            category: "",
            description: "",
            amount: 0,
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;
            try {
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/finances/create_manual_entry`,
                    {
                        type: "COST",
                        category: values.category,
                        amount: values.amount,
                        date: values.date,
                        description: values.description,
                        sourceModule: "MANUAL",
                        farm: userLogged.farm_assigned,
                        createdBy: userLogged._id,
                    }
                );
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                    { event: `Registro de gasto: ${values.description}` }
                );
                toggleModal("success");
            } catch (error) {
                console.error("Error creating expense:", { error });
                toggleModal("error");
            }
        },
    });

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="d-flex gap-3">
                    <div className="w-50">
                        <Label htmlFor="date" className="form-label">Fecha</Label>
                        <DatePicker
                            id="date"
                            className={`form-control ${formik.touched.date && formik.errors.date ? "is-invalid" : ""}`}
                            value={formik.values.date ?? undefined}
                            onChange={(date: Date[]) => {
                                if (date[0]) formik.setFieldValue("date", date[0]);
                            }}
                            options={{ dateFormat: "d/m/Y" }}
                        />
                        {formik.touched.date && formik.errors.date && (
                            <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                        )}
                    </div>

                    <div className="w-50">
                        <Label htmlFor="category" className="form-label">Categoría</Label>
                        <Input
                            type="select"
                            id="category"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.category && !!formik.errors.category}
                        >
                            <option value="">Seleccione una categoría</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </Input>
                        {formik.touched.category && formik.errors.category && (
                            <FormFeedback>{formik.errors.category}</FormFeedback>
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    <Label htmlFor="description" className="form-label">Descripción</Label>
                    <Input
                        type="textarea"
                        id="description"
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.description && !!formik.errors.description}
                        placeholder="Ej: Pago de nómina quincenal"
                    />
                    {formik.touched.description && formik.errors.description && (
                        <FormFeedback>{formik.errors.description}</FormFeedback>
                    )}
                </div>

                <div className="mt-3">
                    <Label htmlFor="amount" className="form-label">Monto ($)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        id="amount"
                        name="amount"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.amount && !!formik.errors.amount}
                    />
                    {formik.touched.amount && formik.errors.amount && (
                        <FormFeedback>{formik.errors.amount}</FormFeedback>
                    )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button type="button" color="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" color="primary" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <>
                                Guardando...
                                <span className="spinner-border spinner-border-sm ms-2" />
                            </>
                        ) : (
                            <>
                                Guardar
                                <i className="ri-save-3-fill ms-2" />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <SuccessModal isOpen={modals.success} onClose={onSave} message="Gasto registrado con éxito" />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal("error", false)} message="Ha ocurrido un error al registrar el gasto, inténtelo más tarde" />
        </>
    );
};

export default ExpenseForm;
