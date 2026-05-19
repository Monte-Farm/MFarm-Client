import { useTranslation } from "react-i18next";
import { Alert, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { PrecheckItem, PrecheckResponse } from "common/data_interfaces";
import { statusIcon } from "./closingModalUtils";

interface PrecheckSectionProps {
    precheck: PrecheckResponse | null;
    loadingPrecheck: boolean;
    precheckError: string | null;
    loadingText: string;
    errorTitle: string;
}

const ChecklistItemRow = ({ item }: { item: PrecheckItem }) => {
    const { t } = useTranslation();
    return (
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
};

const PrecheckSection = ({ precheck, loadingPrecheck, precheckError, loadingText, errorTitle }: PrecheckSectionProps) => {
    const { t } = useTranslation();

    return (
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
                    <span className="text-muted">{loadingText}</span>
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
                        <div className="fw-semibold mb-1">{errorTitle}</div>
                        <small>{precheckError}</small>
                    </div>
                </Alert>
            ) : (
                <div className="text-center py-3 border rounded bg-light text-muted small">
                    {t("finance.periodClosing.modal.shared.precheck.fallback")}
                </div>
            )}
        </div>
    );
};

export default PrecheckSection;
