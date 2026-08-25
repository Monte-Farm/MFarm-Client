import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import DatePicker from "react-flatpickr";
import { Button, FormFeedback, Input, Label } from "reactstrap";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { AssetCategory } from "common/data_interfaces";
import { createCapitalAsset } from "slices/capitalAssets/thunk";
import { preventEnterSubmit } from "utils/formUtils";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { useState } from "react";

interface CapitalAssetFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const CATEGORIES: AssetCategory[] = [
    'construction', 'machinery', 'vehicle', 'equipment', 'technology', 'land', 'building', 'other'
];

const CapitalAssetForm: React.FC<CapitalAssetFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const userLogged = getEffectiveUser();
    const submitting = useSelector((state: any) => state.CapitalAssets.submitting);
    const [modals, setModals] = useState({ success: false, error: false });
    const [apiError, setApiError] = useState<string | null>(null);

    const toggleModal = (key: keyof typeof modals, val?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: val ?? !prev[key] }));
    };

    const validationSchema = Yup.object({
        name: Yup.string().required(t("capitalAssets.form.validation.nameRequired")),
        description: Yup.string(),
        category: Yup.string()
            .oneOf(CATEGORIES, t("capitalAssets.form.validation.categoryRequired"))
            .required(t("capitalAssets.form.validation.categoryRequired")),
        acquisitionDate: Yup.date()
            .nullable()
            .required(t("capitalAssets.form.validation.acquisitionDateRequired")),
        acquisitionCost: Yup.number()
            .min(0.01, t("capitalAssets.form.validation.acquisitionCostPositive"))
            .required(t("capitalAssets.form.validation.acquisitionCostRequired")),
        amortizationStartDate: Yup.date()
            .nullable()
            .required(t("capitalAssets.form.validation.amortizationStartDateRequired")),
        totalMonths: Yup.number()
            .integer()
            .min(1, t("capitalAssets.form.validation.totalMonthsMin"))
            .required(t("capitalAssets.form.validation.totalMonthsRequired")),
    });

    const formik = useFormik({
        initialValues: {
            name: "",
            description: "",
            category: "" as AssetCategory | "",
            acquisitionDate: null as Date | null,
            acquisitionCost: "" as number | "",
            amortizationStartDate: null as Date | null,
            totalMonths: "" as number | "",
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            setApiError(null);
            try {
                await dispatch(createCapitalAsset({
                    farm: userLogged.farm_assigned,
                    name: values.name,
                    description: values.description || undefined,
                    category: values.category as AssetCategory,
                    acquisitionDate: (values.acquisitionDate as Date).toISOString().split("T")[0],
                    acquisitionCost: Number(values.acquisitionCost),
                    amortizationStartDate: (values.amortizationStartDate as Date).toISOString().split("T")[0],
                    totalMonths: Number(values.totalMonths),
                }));
                toggleModal("success");
            } catch (err: any) {
                setApiError(err?.response?.data?.message || t("capitalAssets.form.error"));
                toggleModal("error");
            }
        },
    });

    const monthlyPreview = useMemo(() => {
        const cost = Number(formik.values.acquisitionCost);
        const months = Number(formik.values.totalMonths);
        if (cost > 0 && months >= 1) {
            return Math.round((cost / months) * 100) / 100;
        }
        return null;
    }, [formik.values.acquisitionCost, formik.values.totalMonths]);

    return (
        <>
            <form
                onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}
                onKeyDown={preventEnterSubmit}
            >
                {/* Name */}
                <div className="mb-3">
                    <Label className="form-label">{t("capitalAssets.form.field.name")}</Label>
                    <Input
                        type="text"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.name && !!formik.errors.name}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <FormFeedback>{formik.errors.name}</FormFeedback>
                    )}
                </div>

                {/* Description */}
                <div className="mb-3">
                    <Label className="form-label">{t("capitalAssets.form.field.description")}</Label>
                    <Input
                        type="textarea"
                        name="description"
                        rows={2}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </div>

                {/* Category */}
                <div className="mb-3">
                    <Label className="form-label">{t("capitalAssets.form.field.category")}</Label>
                    <Input
                        type="select"
                        name="category"
                        value={formik.values.category}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={formik.touched.category && !!formik.errors.category}
                    >
                        <option value="">{t("capitalAssets.filter.categoryAll")}</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {t(`capitalAssets.category.${cat}`)}
                            </option>
                        ))}
                    </Input>
                    {formik.touched.category && formik.errors.category && (
                        <FormFeedback>{formik.errors.category}</FormFeedback>
                    )}
                </div>

                {/* Acquisition date + cost */}
                <div className="d-flex gap-3 mb-3">
                    <div className="w-50">
                        <Label className="form-label">{t("capitalAssets.form.field.acquisitionDate")}</Label>
                        <DatePicker
                            className={`form-control ${formik.touched.acquisitionDate && formik.errors.acquisitionDate ? "is-invalid" : ""}`}
                            value={formik.values.acquisitionDate ?? undefined}
                            onChange={(dates: Date[]) => {
                                if (dates[0]) formik.setFieldValue("acquisitionDate", dates[0]);
                            }}
                            options={{ dateFormat: "d/m/Y" }}
                        />
                        {formik.touched.acquisitionDate && formik.errors.acquisitionDate && (
                            <FormFeedback className="d-block">{formik.errors.acquisitionDate as string}</FormFeedback>
                        )}
                    </div>

                    <div className="w-50">
                        <Label className="form-label">{t("capitalAssets.form.field.acquisitionCost")}</Label>
                        <Input
                            type="number"
                            name="acquisitionCost"
                            min={0.01}
                            step="0.01"
                            value={formik.values.acquisitionCost}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.acquisitionCost && !!formik.errors.acquisitionCost}
                        />
                        {formik.touched.acquisitionCost && formik.errors.acquisitionCost && (
                            <FormFeedback>{formik.errors.acquisitionCost as string}</FormFeedback>
                        )}
                    </div>
                </div>

                {/* Amortization start date + total months */}
                <div className="d-flex gap-3 mb-3">
                    <div className="w-50">
                        <Label className="form-label">{t("capitalAssets.form.field.amortizationStartDate")}</Label>
                        <DatePicker
                            className={`form-control ${formik.touched.amortizationStartDate && formik.errors.amortizationStartDate ? "is-invalid" : ""}`}
                            value={formik.values.amortizationStartDate ?? undefined}
                            onChange={(dates: Date[]) => {
                                if (dates[0]) formik.setFieldValue("amortizationStartDate", dates[0]);
                            }}
                            options={{ dateFormat: "d/m/Y" }}
                        />
                        {formik.touched.amortizationStartDate && formik.errors.amortizationStartDate && (
                            <FormFeedback className="d-block">{formik.errors.amortizationStartDate as string}</FormFeedback>
                        )}
                    </div>

                    <div className="w-50">
                        <Label className="form-label">{t("capitalAssets.form.field.totalMonths")}</Label>
                        <Input
                            type="number"
                            name="totalMonths"
                            min={1}
                            step={1}
                            value={formik.values.totalMonths}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.totalMonths && !!formik.errors.totalMonths}
                        />
                        {formik.touched.totalMonths && formik.errors.totalMonths && (
                            <FormFeedback>{formik.errors.totalMonths as string}</FormFeedback>
                        )}
                    </div>
                </div>

                {/* Real-time monthly preview */}
                {monthlyPreview !== null && (
                    <div className="bg-light rounded p-3 mb-3 d-flex justify-content-between align-items-center">
                        <span className="text-muted">{t("capitalAssets.form.field.monthlyPreview")}</span>
                        <span className="fs-5 fw-bold text-primary">${monthlyPreview.toFixed(2)}</span>
                    </div>
                )}

                {/* Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button type="button" className="farm-secondary-button" onClick={onCancel} disabled={submitting}>
                        {t("common.button.cancel")}
                    </Button>
                    <Button type="submit" className="farm-primary-button" disabled={submitting}>
                        {submitting ? t("common.button.saving") : t("common.button.save")}
                    </Button>
                </div>
            </form>

            <SuccessModal
                isOpen={modals.success}
                onClose={onSave}
                message={t("capitalAssets.form.success")}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error", false)}
                message={apiError || t("capitalAssets.form.error")}
            />
        </>
    );
};

export default CapitalAssetForm;
