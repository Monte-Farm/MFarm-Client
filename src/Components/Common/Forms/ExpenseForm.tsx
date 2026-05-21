import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useContext } from "react";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label } from "reactstrap";
import * as Yup from "yup";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ExpenseFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ success: false, error: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const categoryOptions = [
        { value: "LABOR", label: t("finance.expense.category.LABOR") },
        { value: "UTILITY", label: t("finance.expense.category.UTILITY") },
        { value: "MAINTENANCE", label: t("finance.expense.category.MAINTENANCE") },
        { value: "REPAIR", label: t("finance.expense.category.REPAIR") },
        { value: "TRANSPORT", label: t("finance.expense.category.TRANSPORT") },
        { value: "LIVESTOCK_PURCHASE", label: t("finance.expense.category.LIVESTOCK_PURCHASE") },
        { value: "VETERINARY", label: t("finance.expense.category.VETERINARY") },
        { value: "PAYROLL", label: t("finance.expense.category.PAYROLL") },
        { value: "INSURANCE", label: t("finance.expense.category.INSURANCE") },
        { value: "TAXES_FEES", label: t("finance.expense.category.TAXES_FEES") },
        { value: "ADMINISTRATIVE", label: t("finance.expense.category.ADMINISTRATIVE") },
        { value: "FUEL", label: t("finance.expense.category.FUEL") },
        { value: "INFRASTRUCTURE", label: t("finance.expense.category.INFRASTRUCTURE") },
        { value: "OTHER", label: t("finance.expense.category.OTHER") },
    ];

    const validationSchema = Yup.object({
        date: Yup.date()
            .max(new Date(), t("finance.expense.validation.dateNotFuture"))
            .required(t("finance.expense.validation.dateRequired")),
        category: Yup.string()
            .oneOf(categoryOptions.map((c) => c.value), t("finance.expense.validation.categoryInvalid"))
            .required(t("finance.expense.validation.categoryRequired")),
        description: Yup.string()
            .required(t("finance.expense.validation.descriptionRequired")),
        amount: Yup.number()
            .min(0.01, t("finance.expense.validation.amountPositive"))
            .required(t("finance.expense.validation.amountRequired")),
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
                logger.error("Error creating expense:", { error });
                toggleModal("error");
            }
        },
    });

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className="d-flex gap-3">
                    <div className="w-50">
                        <Label htmlFor="date" className="form-label">{t("finance.expense.form.date")}</Label>
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
                        <Label htmlFor="category" className="form-label">{t("finance.expense.form.category")}</Label>
                        <Input
                            type="select"
                            id="category"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.category && !!formik.errors.category}
                        >
                            <option value="">{t("finance.expense.form.categoryPlaceholder")}</option>
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
                    <Label htmlFor="description" className="form-label">{t("finance.expense.form.description")}</Label>
                    <Input
                        type="textarea"
                        id="description"
                        name="description"
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.description && !!formik.errors.description}
                        placeholder={t("finance.expense.form.descriptionPlaceholder")}
                    />
                    {formik.touched.description && formik.errors.description && (
                        <FormFeedback>{formik.errors.description}</FormFeedback>
                    )}
                </div>

                <div className="mt-3">
                    <Label htmlFor="amount" className="form-label">{t("finance.expense.form.amount")}</Label>
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
                    <Button type="button" color="secondary" className="btn-cancel" onClick={onCancel}>
                        {t("common.button.cancel")}
                    </Button>
                    <Button type="submit" color="primary" disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? (
                            <>
                                {t("common.button.saving")}
                                <span className="spinner-border spinner-border-sm ms-2" />
                            </>
                        ) : (
                            <>
                                {t("common.button.save")}
                                <i className="ri-save-3-fill ms-2" />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t("finance.expense.success.saved")} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal("error", false)} message={t("finance.expense.error.save")} />
        </>
    );
};

export default ExpenseForm;
