import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { PERIOD_CLOSING_URLS } from "helpers/period_closing_urls";
import { APIClient } from "helpers/api_helper";
import { ClosingKpis, PeriodClosingByPeriod, PrecheckResponse } from "common/data_interfaces";
import { closePeriod } from "slices/periodClosing/thunk";
import { darkenHex } from "utils/colorUtils";
import { isTablet } from "./closingModalUtils";
import { preventEnterSubmit } from 'utils/formUtils';
import PrecheckSection from "./PrecheckSection";
import KpiPreviewSection from "./KpiPreviewSection";
import ForceCloseModal from "./ForceCloseModal";

const api = new APIClient();

interface CloseYearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: string;
}

const CloseYearModal = ({ isOpen, onClose, onSuccess, farmId }: CloseYearModalProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const submitting = useSelector((state: any) => state.PeriodClosing.submitting);
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const [precheck, setPrecheck] = useState<PrecheckResponse | null>(null);
    const [loadingPrecheck, setLoadingPrecheck] = useState(false);
    const [precheckError, setPrecheckError] = useState<string | null>(null);
    const bg = (color: string) => isDark ? darkenHex(color) : color;

    const userLogged = getEffectiveUser();
    const userRoles: string[] = Array.isArray(userLogged?.role) ? userLogged.role : (userLogged?.role ? [userLogged.role] : []);
    const canUserForce = userRoles.includes("Superadmin") || userRoles.includes("farm_manager");

    const [tabletMode, setTabletMode] = useState(isTablet);
    const [apiError, setApiError] = useState<string | null>(null);
    const [preview, setPreview] = useState<ClosingKpis | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [existingClosing, setExistingClosing] = useState<PeriodClosingByPeriod | null>(null);
    const [showForceModal, setShowForceModal] = useState(false);

    const today = new Date();
    const defaultYear = today.getFullYear() - 1;

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: { year: defaultYear, notes: "" },
        validationSchema: Yup.object({
            year: Yup.number().required(t("finance.periodClosing.modal.shared.validation.yearRequired")).min(2000).max(2100),
            notes: Yup.string().max(500, t("finance.periodClosing.modal.shared.validation.maxNotes")),
        }),
        onSubmit: async (values) => {
            setApiError(null);
            try {
                await dispatch(closePeriod(farmId, {
                    period_type: "annual",
                    year: Number(values.year),
                    notes: values.notes?.trim() || undefined,
                }));
                formik.resetForm();
                onSuccess();
            } catch (err: any) {
                setApiError(err?.response?.data?.message || "Error al cerrar el año");
            }
        },
    });

    const handleClose = () => {
        if (submitting) return;
        formik.resetForm();
        setApiError(null);
        setPreview(null);
        setExistingClosing(null);
        setPrecheck(null);
        setPrecheckError(null);
        setShowForceModal(false);
        onClose();
    };

    const currentYear = today.getFullYear();
    const yearOptions: number[] = [];
    for (let y = currentYear - 1; y >= currentYear - 6; y--) yearOptions.push(y);
    const yearSelectOptions = yearOptions.map((y) => ({ value: y, label: String(y) }));

    const selYear = Number(formik.values.year);
    const MONTHS = t("finance.periodClosing.months", { returnObjects: true }) as string[];
    const periodStart = t("finance.periodClosing.modal.shared.closingDateFormat", { day: 1, month: MONTHS[0], year: selYear });
    const periodEnd = t("finance.periodClosing.modal.shared.closingDateFormat", { day: 31, month: MONTHS[11], year: selYear });
    const startIso = `${selYear}-01-01`;
    const endIso = `${selYear}-12-31`;

    const yearEnded = new Date(selYear, 11, 31) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    useEffect(() => {
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!isOpen || !farmId) return;

        let cancelled = false;
        const load = async () => {
            setLoadingPreview(true);
            setLoadingPrecheck(true);
            setPreview(null);
            setExistingClosing(null);
            setPrecheck(null);
            setPrecheckError(null);
            const [previewRes, byPeriodRes, precheckRes] = await Promise.allSettled([
                api.get(PERIOD_CLOSING_URLS.closingPreview(farmId), { start_date: startIso, end_date: endIso }),
                api.get(PERIOD_CLOSING_URLS.byPeriod(farmId), { period_type: 'annual', year: selYear }),
                api.get(PERIOD_CLOSING_URLS.precheck(farmId), { period_type: 'annual', year: selYear }),
            ]);
            if (cancelled) return;
            setLoadingPreview(false);
            setLoadingPrecheck(false);
            setPreview(previewRes.status === 'fulfilled' ? previewRes.value.data?.data?.kpis || null : null);
            setExistingClosing(byPeriodRes.status === 'fulfilled' ? byPeriodRes.value.data?.data || null : null);
            if (precheckRes.status === 'fulfilled') {
                setPrecheck(precheckRes.value.data?.data ?? precheckRes.value.data ?? null);
            } else {
                setPrecheckError(precheckRes.reason?.response?.data?.message || 'No se pudo cargar el checklist de verificación.');
            }
        };
        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selYear, farmId]);

    const blockedByExisting = !!existingClosing && existingClosing.status === "closed";
    const precheckOk = precheck?.canClose === true;
    const precheckCanForce = precheck?.canForceClose === true;

    const canSubmit =
        !!farmId && yearEnded && !blockedByExisting &&
        !loadingPreview && !loadingPrecheck && !submitting && precheckOk;

    const canOfferForce =
        !!farmId && yearEnded && !blockedByExisting &&
        !loadingPreview && !loadingPrecheck && !submitting &&
        !precheckOk && precheckCanForce && canUserForce;

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} backdrop="static" keyboard={false} centered size="lg" fullscreen={tabletMode}>
                <ModalHeader toggle={handleClose}>
                    <i className="ri-calendar-2-line me-2 text-primary" />
                    {t("finance.periodClosing.modal.closeYear.header")}
                </ModalHeader>
                <Form onSubmit={formik.handleSubmit} onKeyDown={preventEnterSubmit}>
                    <ModalBody>
                        {!farmId && (
                            <Alert color="warning" className="d-flex align-items-center mb-3">
                                <i className="ri-store-3-line me-2 fs-5 text-warning" />
                                <div>{t("finance.periodClosing.modal.closePeriod.noFarmSelected")}</div>
                            </Alert>
                        )}
                        <Alert color="info" className="d-flex align-items-start mb-3">
                            <i className="ri-information-line me-2 fs-5 mt-1 text-info" />
                            <div>
                                <div className="fw-semibold mb-1">{t("finance.periodClosing.modal.closeYear.infoTitle")}</div>
                                <small>{t("finance.periodClosing.modal.closeYear.infoBody")}</small>
                            </div>
                        </Alert>

                        <FormGroup className="mb-3">
                            <Label for="year">{t("finance.periodClosing.modal.closeYear.field.year")}</Label>
                            <Select
                                inputId="year"
                                options={yearSelectOptions}
                                value={yearSelectOptions.find((o) => o.value === selYear)}
                                onChange={(opt: any) => formik.setFieldValue("year", opt?.value)}
                                onBlur={() => formik.setFieldTouched("year", true)}
                                classNamePrefix="select"
                            />
                        </FormGroup>

                        <div className="border rounded p-3 mb-3 bg-light">
                            <div className="text-muted small mb-1">
                                <i className="ri-calendar-line me-1 text-muted" />{t("finance.periodClosing.modal.shared.periodLabel")}
                            </div>
                            <div className="fw-semibold fs-5 mb-1">{t("finance.periodClosing.modal.closeYear.yearLabel", { val: selYear })}</div>
                            <div className="text-muted small">
                                <Trans
                                    i18nKey="finance.periodClosing.modal.shared.periodRangeFull"
                                    values={{ start: periodStart, end: periodEnd }}
                                    components={{ 1: <strong /> }}
                                />
                            </div>
                        </div>

                        {!yearEnded && (
                            <Alert color="warning" className="d-flex align-items-center">
                                <i className="ri-error-warning-line me-2 fs-5 text-warning" />
                                <div>{t("finance.periodClosing.modal.closeYear.validation.yearNotEnded")}</div>
                            </Alert>
                        )}
                        {blockedByExisting && (
                            <Alert color="warning" className="d-flex align-items-center">
                                <i className="ri-lock-line me-2 fs-5 text-warning" />
                                <div>{t("finance.periodClosing.modal.closeYear.validation.hasActiveClosure")}</div>
                            </Alert>
                        )}
                        {existingClosing?.status === "reopened" && (
                            <Alert color="info" className="d-flex align-items-center">
                                <i className="ri-history-line me-2 fs-5 text-info" />
                                <div>{t("finance.periodClosing.modal.closeYear.validation.hasReopenedClosure")}</div>
                            </Alert>
                        )}

                        <PrecheckSection
                            precheck={precheck}
                            loadingPrecheck={loadingPrecheck}
                            precheckError={precheckError}
                            loadingText={t("finance.periodClosing.modal.closeYear.precheck.loading")}
                            errorTitle={t("finance.periodClosing.modal.closeYear.precheck.errorTitle")}
                        />

                        <KpiPreviewSection
                            preview={preview}
                            loadingPreview={loadingPreview}
                            bg={bg}
                            title={t("finance.periodClosing.modal.closeYear.preview.title")}
                            loadingText={t("finance.periodClosing.modal.closeYear.preview.loading")}
                        />

                        <FormGroup>
                            <Label for="notes">
                                {t("finance.periodClosing.modal.closeYear.field.notes")} <span className="text-muted">{t("finance.periodClosing.modal.closeYear.field.notesOptional")}</span>
                            </Label>
                            <Input
                                type="textarea"
                                id="notes"
                                name="notes"
                                rows={2}
                                maxLength={500}
                                placeholder={t("finance.periodClosing.modal.closeYear.field.notesPlaceholder")}
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={!!(formik.touched.notes && formik.errors.notes)}
                            />
                            <div className="d-flex justify-content-between">
                                {formik.touched.notes && formik.errors.notes ? (
                                    <FormFeedback className="d-block">{formik.errors.notes as string}</FormFeedback>
                                ) : <span />}
                                <small className="text-muted">{formik.values.notes.length}/500</small>
                            </div>
                        </FormGroup>

                        {submitting && (
                            <Alert color="info" className="d-flex align-items-start mb-0">
                                <Spinner size="sm" className="me-2 mt-1" />
                                <div>
                                    <div className="fw-semibold">{t("finance.periodClosing.modal.closeYear.submitting.title")}</div>
                                    <small>
                                        <Trans
                                            i18nKey="finance.periodClosing.modal.closeYear.submitting.body"
                                            values={{ val: 60 }}
                                            components={{ 1: <strong /> }}
                                        />
                                    </small>
                                </div>
                            </Alert>
                        )}
                        {apiError && <Alert color="danger" className="mb-0">{apiError}</Alert>}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={handleClose} disabled={submitting}>{t("common.button.cancel")}</Button>
                        {canOfferForce && (
                            <Button color="warning" onClick={() => setShowForceModal(true)} disabled={submitting}>
                                <i className="ri-alert-line me-1" />{t("finance.periodClosing.modal.closePeriod.button.force")}
                            </Button>
                        )}
                        <Button type="submit" color="primary" disabled={!canSubmit}>
                            {submitting
                                ? (<><i className="ri-loader-4-line ri-spin me-1" />{t("finance.periodClosing.modal.closeYear.button.submitting")}</>)
                                : (<><i className="ri-calendar-2-line me-1" />{t("finance.periodClosing.modal.closeYear.button.submit")}</>)}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            <ForceCloseModal
                isOpen={showForceModal}
                onClose={() => setShowForceModal(false)}
                onForced={async (reason) => {
                    setApiError(null);
                    try {
                        await dispatch(closePeriod(farmId, {
                            period_type: "annual",
                            year: selYear,
                            notes: formik.values.notes?.trim() || undefined,
                            force: true,
                            forceReason: reason.trim(),
                        }));
                        setShowForceModal(false);
                        formik.resetForm();
                        onSuccess();
                    } catch (err: any) {
                        setApiError(err?.response?.data?.message || "Error al cerrar el año");
                        setShowForceModal(false);
                    }
                }}
                periodLabel={t("finance.periodClosing.modal.closeYear.yearLabel", { val: selYear })}
                blockingLabels={
                    precheck?.items
                        .filter((i) => precheck.blockingErrors.includes(i.key))
                        .map((i) => i.label) || []
                }
                submitting={submitting}
            />
        </>
    );
};

export default CloseYearModal;
