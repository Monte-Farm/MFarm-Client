import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader } from "reactstrap";
import { CapitalAsset, AssetCategory } from "common/data_interfaces";
import { updateCapitalAsset } from "slices/capitalAssets/thunk";
import { preventEnterSubmit } from "utils/formUtils";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

const CATEGORIES: AssetCategory[] = [
    'construction', 'machinery', 'vehicle', 'equipment', 'technology', 'land', 'other'
];

interface CapitalAssetEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: CapitalAsset;
}

const CapitalAssetEditModal: React.FC<CapitalAssetEditModalProps> = ({ isOpen, onClose, onSuccess, asset }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
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
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: asset.name,
            description: asset.description || "",
            category: asset.category,
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            setApiError(null);
            try {
                await dispatch(updateCapitalAsset(asset._id, {
                    name: values.name,
                    description: values.description || undefined,
                    category: values.category as AssetCategory,
                }));
                toggleModal("success");
            } catch (err: any) {
                setApiError(err?.response?.data?.message || t("capitalAssets.edit.error"));
                toggleModal("error");
            }
        },
    });

    useEffect(() => {
        if (!isOpen) formik.resetForm();
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Modal isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={onClose}>{t("capitalAssets.edit.title")}</ModalHeader>
                <ModalBody>
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

                        <div className="d-flex justify-content-end gap-2">
                            <Button type="button" className="farm-secondary-button" onClick={onClose} disabled={submitting}>
                                {t("common.button.cancel")}
                            </Button>
                            <Button type="submit" className="farm-primary-button" disabled={submitting}>
                                {submitting ? t("common.button.saving") : t("common.button.save")}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => { toggleModal("success", false); onSuccess(); onClose(); }}
                message={t("capitalAssets.edit.success")}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error", false)}
                message={apiError || t("capitalAssets.edit.error")}
            />
        </>
    );
};

export default CapitalAssetEditModal;
