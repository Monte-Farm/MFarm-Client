import { useTranslation } from "react-i18next";
import { Spinner } from "reactstrap";
import { ClosingKpis } from "common/data_interfaces";
import { formatCurrency } from "utils/closingFormatters";

interface KpiPreviewSectionProps {
    preview: ClosingKpis | null;
    loadingPreview: boolean;
    bg: (color: string) => string;
    title: string;
    loadingText: string;
}

const KpiPreviewSection = ({ preview, loadingPreview, bg, title, loadingText }: KpiPreviewSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className="mb-3">
            <div className="text-muted small fw-semibold mb-2">
                <i className="ri-eye-line me-1 text-muted" />{title}
            </div>
            {loadingPreview ? (
                <div className="text-center py-4 border rounded bg-light">
                    <Spinner size="sm" className="me-2" />
                    <span className="text-muted">{loadingText}</span>
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
    );
};

export default KpiPreviewSection;
