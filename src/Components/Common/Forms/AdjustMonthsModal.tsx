import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader } from "reactstrap";
import { CapitalAsset } from "common/data_interfaces";
import { adjustCapitalAsset } from "slices/capitalAssets/thunk";
import { preventEnterSubmit } from "utils/formUtils";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface AdjustMonthsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: CapitalAsset;
}

const AdjustMonthsModal: React.FC<AdjustMonthsModalProps> = ({ isOpen, onClose, onSuccess, asset }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const submitting = useSelector((state: any) => state.CapitalAssets.submitting);
    const [modals, setModals] = useState({ success: false, error: false });
    const [apiError, setApiError] = useState<string | null>(null);

    const toggleModal = (key: keyof typeof modals, val?: boolean) => {
        setModals((prev) => ({ ...prev, [key]: val ?? !prev[key] }));
    };

    const remainingBalance = asset.remainingBalance ?? (asset.acquisitionCost - (asset.totalCharged ?? 0));
    const currentRemainingMonths = asset.remainingMonths ?? (asset.totalMonths - asset.monthsCharged);

    const validationSchema = Yup.object({
        newRemainingMonths: Yup.number()
            .integer()
            .min(1, t("capitalAssets.adjust.validation.newMonthsMin"))
            .required(t("capitalAssets.adjust.validation.newMonthsRequired")),
        reason: Yup.string(),
    });

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            newRemainingMonths: currentRemainingMonths as number | "",
            reason: "",
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            setApiError(null);
            try {
                await dispatch(adjustCapitalAsset(asset._id, {
                    newRemainingMonths: Number(values.newRemainingMonths),
                    reason: values.reason || undefined,
                }));
                toggleModal("success");
            } catch (err: any) {
                setApiError(err?.response?.data?.message || t("capitalAssets.adjust.error"));
                toggleModal("error");
            }
        },
    });

    const newMonthlyPreview = useMemo(() => {
        const months = Number(formik.values.newRemainingMonths);
        if (months >= 1 && remainingBalance > 0) {
            return Math.round((remainingBalance / months) * 100) / 100;
        }
        return null;
    }, [formik.values.newRemainingMonths, remainingBalance]);

    useEffect(() => {
        if (!isOpen) formik.resetForm();
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <Modal isOpen={isOpen} toggle={onClose} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={onClose}>{t("capitalAssets.adjust.title")}</ModalHeader>
                <ModalBody>
                    {/* Current state summary */}
                    <Alert color="info" className="mb-3">
                        <div className="fw-semibold mb-2">{t("capitalAssets.adjust.currentState.header")}</div>
                        <div className="d-flex justify-content-between">
                            <span className="text-muted small">{t("capitalAssets.adjust.currentState.remainingBalance")}</span>
                            <span className="fw-bold">${remainingBalance.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span className="text-muted small">{t("capitalAssets.adjust.currentState.currentMonthly")}</span>
                            <span className="fw-bold">${asset.currentMonthlyAmount.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span className="text-muted small">{t("capitalAssets.adjust.currentState.monthsRemaining")}</span>
                            <span className="fw-bold">{currentRemainingMonths}</span>
                        </div>
                    </Alert>

                    <form
                        onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}
                        onKeyDown={preventEnterSubmit}
                    >
                        {/* New remaining months */}
                        <div className="mb-3">
                            <Label className="form-label">{t("capitalAssets.adjust.field.newMonths")}</Label>
                            <Input
                                type="number"
                                name="newRemainingMonths"
                                min={1}
                                step={1}
                                value={formik.values.newRemainingMonths}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.newRemainingMonths && !!formik.errors.newRemainingMonths}
                            />
                            {formik.touched.newRemainingMonths && formik.errors.newRemainingMonths && (
                                <FormFeedback>{formik.errors.newRemainingMonths as string}</FormFeedback>
                            )}
                        </div>

                        {/* New monthly preview */}
                        {newMonthlyPreview !== null && (
                            <div className="bg-light rounded p-3 mb-3 d-flex justify-content-between align-items-center">
                                <span className="text-muted">{t("capitalAssets.adjust.preview.label")}</span>
                                <span className="fs-5 fw-bold text-primary">${newMonthlyPreview.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="mb-3">
                            <Label className="form-label">{t("capitalAssets.adjust.field.reason")}</Label>
                            <Input
                                type="textarea"
                                name="reason"
                                rows={2}
                                value={formik.values.reason}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                            />
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <Button type="button" className="farm-secondary-button" onClick={onClose} disabled={submitting}>
                                {t("common.button.cancel")}
                            </Button>
                            <Button type="submit" className="farm-primary-button" disabled={submitting}>
                                {submitting ? t("common.button.saving") : t("common.button.confirm")}
                            </Button>
                        </div>
                    </form>
                </ModalBody>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={() => { toggleModal("success", false); onSuccess(); onClose(); }}
                message={t("capitalAssets.adjust.success")}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal("error", false)}
                message={apiError || t("capitalAssets.adjust.error")}
            />
        </>
    );
};

export default AdjustMonthsModal;
