import { useContext, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Form, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { ConfigContext } from "App";
import { PERIOD_CLOSING_URLS } from "helpers/period_closing_urls";
import { ClosingKpis, PeriodClosingByPeriod, PrecheckItem, PrecheckResponse, PrecheckStatus } from "common/data_interfaces";
import { closePeriod, fetchClosingPrecheckAnnual } from "slices/periodClosing/thunk";
import { formatCurrency } from "utils/closingFormatters";
import { darkenHex } from "utils/colorUtils";

interface CloseYearModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: string;
}

const statusIcon = (status: PrecheckStatus) => {
    switch (status) {
        case "ok":
            return <i className="ri-checkbox-circle-line fs-5 text-success" />;
        case "warning":
            return <i className="ri-error-warning-line fs-5 text-warning" />;
        case "error":
            return <i className="ri-close-circle-line fs-5 text-danger" />;
    }
};

const CloseYearModal = ({ isOpen, onClose, onSuccess, farmId }: CloseYearModalProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<any>();
    const configContext = useContext(ConfigContext);
    const submitting = useSelector((state: any) => state.PeriodClosing.submitting);
    const precheck: PrecheckResponse | null = useSelector((state: any) => state.PeriodClosing.precheck);
    const loadingPrecheck: boolean = useSelector((state: any) => state.PeriodClosing.loadingPrecheck);
    const precheckError: string | null = useSelector((state: any) => state.PeriodClosing.precheckError);
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;

    const [apiError, setApiError] = useState<string | null>(null);
    const [preview, setPreview] = useState<ClosingKpis | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [existingClosing, setExistingClosing] = useState<PeriodClosingByPeriod | null>(null);

    const today = new Date();
    const defaultYear = today.getFullYear() - 1;

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            year: defaultYear,
            notes: "",
        },
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
        onClose();
    };

    const currentYear = today.getFullYear();
    const yearOptions: number[] = [];
    for (let y = currentYear - 1; y >= currentYear - 6; y--) yearOptions.push(y);
    const yearSelectOptions = yearOptions.map((y) => ({ value: y, label: String(y) }));

    const selYear = Number(formik.values.year);
    const MONTHS = t("finance.periodClosing.months", { returnObjects: true }) as string[];
    const periodStart = `1 de ${MONTHS[0]} de ${selYear}`;
    const periodEnd = `31 de ${MONTHS[11]} de ${selYear}`;
    const startIso = `${selYear}-01-01`;
    const endIso = `${selYear}-12-31`;

    const yearEnded = new Date(selYear, 11, 31) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    useEffect(() => {
        if (!isOpen || !configContext || !farmId) return;

        let cancelled = false;
        const load = async () => {
            setLoadingPreview(true);
            setPreview(null);
            setExistingClosing(null);
            try {
                const [previewRes, byPeriodRes] = await Promise.all([
                    configContext.axiosHelper.get(
                        `${configContext.apiUrl}/reports/finance/operations-closing/${farmId}?start_date=${startIso}&end_date=${endIso}`
                    ),
                    configContext.axiosHelper.get(
                        `${configContext.apiUrl}${PERIOD_CLOSING_URLS.byPeriod(farmId)}?period_type=annual&year=${selYear}`
                    ),
                ]);
                if (cancelled) return;
                setPreview(previewRes.data?.data?.kpis || null);
                setExistingClosing(byPeriodRes.data?.data || null);
            } catch {
                if (!cancelled) {
                    setPreview(null);
                    setExistingClosing(null);
                }
            } finally {
                if (!cancelled) setLoadingPreview(false);
            }
        };
        load();
        dispatch(fetchClosingPrecheckAnnual(farmId, selYear));
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selYear, farmId]);

    const blockedByExisting = !!existingClosing && existingClosing.status === "closed";
    const precheckOk = precheck?.canClose === true;

    const canSubmit =
        !!farmId &&
        yearEnded &&
        !blockedByExisting &&
        !loadingPreview &&
        !loadingPrecheck &&
        !submitting &&
        precheckOk;

    const ChecklistItemRow = ({ item }: { item: PrecheckItem }) => (
        <div className="d-flex align-items-start gap-2 py-2 border-bottom">
            <div>{statusIcon(item.status)}</div>
            <div className="flex-grow-1">
                <div className="fw-semibold">{item.label}</div>
                <small className="text-muted">{item.detail}</small>
            </div>
            {item.actionUrl && item.status !== "ok" && (
                <Link to={item.actionUrl} className="btn btn-sm btn-light">
                    {t("finance.periodClosing.modal.shared.goResolve")}
                </Link>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} toggle={handleClose} backdrop="static" keyboard={false} centered size="lg">
            <ModalHeader toggle={handleClose}>
                <i className="ri-calendar-2-line me-2 text-primary" />
                {t("finance.periodClosing.modal.closeYear.header")}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
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
                            Del <strong>{periodStart}</strong> al <strong>{periodEnd}</strong>
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

                    <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="text-muted small fw-semibold">
                                <i className="ri-checkbox-multiple-line me-1 text-muted" />{t("finance.periodClosing.modal.shared.precheck.title")}
                            </div>
                            {precheck && (
                                <div className="small">
                                    <span className="text-success">{precheck.summary.ok} {t("finance.periodClosing.modal.shared.precheck.ok")}</span>
                                    {precheck.summary.warning > 0 && <> · <span className="text-warning">{precheck.summary.warning} {t("finance.periodClosing.modal.shared.precheck.warnings")}</span></>}
                                    {precheck.summary.error > 0 && <> · <span className="text-danger">{precheck.summary.error} {t("finance.periodClosing.modal.shared.precheck.errors")}</span></>}
                                </div>
                            )}
                        </div>
                        {loadingPrecheck ? (
                            <div className="text-center py-3 border rounded bg-light">
                                <Spinner size="sm" className="me-2" />
                                <span className="text-muted">{t("finance.periodClosing.modal.closeYear.precheck.loading")}</span>
                            </div>
                        ) : precheck ? (
                            <div className="border rounded px-3">
                                {precheck.items.map((item) => (
                                    <ChecklistItemRow key={item.key} item={item} />
                                ))}
                            </div>
                        ) : precheckError ? (
                            <Alert color="warning" className="d-flex align-items-start mb-0">
                                <i className="ri-error-warning-line me-2 fs-5 text-warning mt-1" />
                                <div>
                                    <div className="fw-semibold mb-1">{t("finance.periodClosing.modal.closeYear.precheck.errorTitle")}</div>
                                    <small>{precheckError}</small>
                                </div>
                            </Alert>
                        ) : (
                            <div className="text-center py-3 border rounded bg-light text-muted small">
                                {t("finance.periodClosing.modal.shared.precheck.fallback")}
                            </div>
                        )}
                    </div>

                    <div className="mb-3">
                        <div className="text-muted small fw-semibold mb-2">
                            <i className="ri-eye-line me-1 text-muted" />{t("finance.periodClosing.modal.closeYear.preview.title")}
                        </div>
                        {loadingPreview ? (
                            <div className="text-center py-4 border rounded bg-light">
                                <Spinner size="sm" className="me-2" />
                                <span className="text-muted">{t("finance.periodClosing.modal.closeYear.preview.loading")}</span>
                            </div>
                        ) : preview ? (
                            <div className="row g-2">
                                <div className="col-md-6">
                                    <div className="border rounded p-2" style={{ backgroundColor: bg("#E8F5E9") }}>
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.income")}</div>
                                        <div className="fw-bold fs-5 text-success">{formatCurrency(preview.totalIncome)}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="border rounded p-2" style={{ backgroundColor: bg("#FFEBEE") }}>
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.costs")}</div>
                                        <div className="fw-bold fs-5 text-danger">{formatCurrency(preview.totalCosts)}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="border rounded p-2" style={{ backgroundColor: bg("#FFF8E1") }}>
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.operatingResult")}</div>
                                        <div className={`fw-bold fs-5 ${preview.operatingResult >= 0 ? "text-success" : "text-danger"}`}>
                                            {formatCurrency(preview.operatingResult)}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="border rounded p-2" style={{ backgroundColor: bg("#E0F7FA") }}>
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.operatingMargin")}</div>
                                        <div className="fw-bold fs-5 text-info">{(preview.operatingMargin || 0).toFixed(1)}%</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="border rounded p-2">
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.pigsSold")}</div>
                                        <div className="fw-bold fs-5">{preview.totalPigsSold || 0}</div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="border rounded p-2">
                                        <div className="text-muted small">{t("finance.periodClosing.modal.shared.preview.kgSold")}</div>
                                        <div className="fw-bold fs-5">{(preview.totalKgSold || 0).toFixed(0)} kg</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-3 border rounded bg-light text-muted small">
                                {t("finance.periodClosing.modal.shared.preview.noData")}
                            </div>
                        )}
                    </div>

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
                    <Button type="submit" color="primary" disabled={!canSubmit}>
                        {submitting
                            ? (<><i className="ri-loader-4-line ri-spin me-1" />{t("finance.periodClosing.modal.closeYear.button.submitting")}</>)
                            : (<><i className="ri-calendar-2-line me-1" />{t("finance.periodClosing.modal.closeYear.button.submit")}</>)}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default CloseYearModal;
