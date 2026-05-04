import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Container, Modal, ModalHeader } from "reactstrap";
import BreadCrumb from "./BreadCrumb";
import PDFViewer from "./PDFViewer";
import ReportDateRangeSelector from "./ReportDateRangeSelector";

interface ReportPageLayoutProps {
    title: string;
    pageTitle: string;
    children: React.ReactNode;
    onGeneratePdf?: (startDate: string, endDate: string) => Promise<string>;
    pdfTitle?: string;
    showDateFilter?: boolean;
    startDate?: string;
    endDate?: string;
    onDateChange?: (startDate: string, endDate: string) => void;
    headerActions?: React.ReactNode;
}

const ReportPageLayout: React.FC<ReportPageLayoutProps> = ({
    title,
    pageTitle,
    children,
    onGeneratePdf,
    pdfTitle = "Reporte",
    showDateFilter = true,
    startDate,
    endDate,
    onDateChange,
    headerActions,
}) => {
    const { t } = useTranslation();
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [pdfDatePickerOpen, setPdfDatePickerOpen] = useState(false);
    const [filterDatePickerOpen, setFilterDatePickerOpen] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const shortMonths = t("common.shortMonths", { returnObjects: true }) as string[];

    const formatDateLabel = (dateStr: string): string => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${parseInt(day)} ${shortMonths[parseInt(month) - 1]} ${year}`;
    };

    const handleGeneratePdf = async (start: string, end: string) => {
        if (!onGeneratePdf) return;
        try {
            setPdfLoading(true);
            const url = await onGeneratePdf(start, end);
            setFileURL(url);
            setPdfDatePickerOpen(false);
            setPdfModalOpen(true);
        } catch {
            // Error handling is delegated to the parent
        } finally {
            setPdfLoading(false);
        }
    };

    const handleFilterDateSelect = (start: string, end: string) => {
        if (onDateChange) {
            onDateChange(start, end);
        }
        setFilterDatePickerOpen(false);
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={title} pageTitle={pageTitle} />

                <div className="d-flex align-items-center gap-2 mb-3">
                    {showDateFilter && onDateChange && (
                        <Button
                            color="light"
                            className="d-flex align-items-center gap-2 shadow-sm border"
                            onClick={() => setFilterDatePickerOpen(true)}
                            style={{ borderRadius: "8px", padding: "8px 16px" }}
                        >
                            <i className="ri-calendar-line text-primary" style={{ fontSize: "16px" }}></i>
                            {startDate && endDate ? (
                                <span style={{ fontSize: "13px" }}>
                                    <span className="fw-semibold">{formatDateLabel(startDate)}</span>
                                    <span className="text-muted" style={{ margin: "0 6px" }}>—</span>
                                    <span className="fw-semibold">{formatDateLabel(endDate)}</span>
                                </span>
                            ) : (
                                <span style={{ fontSize: "13px" }} className="text-muted">{t("shared.reportLayout.selectPeriod")}</span>
                            )}
                            <i className="ri-arrow-down-s-line text-muted"></i>
                        </Button>
                    )}

                    <div className="ms-auto d-flex gap-2">
                        {headerActions}
                        {onGeneratePdf && (
                            <Button
                                color="primary"
                                onClick={() => setPdfDatePickerOpen(true)}
                            >
                                <i className="ri-file-pdf-line me-1"></i>
                                {t("shared.reportLayout.printPdf")}
                            </Button>
                        )}
                    </div>
                </div>

                {children}
            </Container>

            <Modal isOpen={filterDatePickerOpen} toggle={() => setFilterDatePickerOpen(false)} centered>
                <ModalHeader toggle={() => setFilterDatePickerOpen(false)}>
                    <i className="ri-calendar-line me-2"></i>
                    {t("shared.reportLayout.filterModal")}
                </ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleFilterDateSelect}
                    onCancel={() => setFilterDatePickerOpen(false)}
                    generateButtonText={t("shared.dateRangeSelector.applyFilter")}
                />
            </Modal>

            <Modal isOpen={pdfDatePickerOpen} toggle={() => setPdfDatePickerOpen(false)} centered>
                <ModalHeader toggle={() => setPdfDatePickerOpen(false)}>
                    <i className="ri-file-pdf-line me-2"></i>
                    {t("shared.reportLayout.pdfModal")}
                </ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePdf}
                    onCancel={() => setPdfDatePickerOpen(false)}
                    loading={pdfLoading}
                />
            </Modal>

            <Modal size="xl" isOpen={pdfModalOpen} toggle={() => setPdfModalOpen(false)} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => setPdfModalOpen(false)}>{pdfTitle}</ModalHeader>
                {fileURL && (
                    <div style={{ padding: "1rem" }}>
                        <PDFViewer fileUrl={fileURL} />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ReportPageLayout;
