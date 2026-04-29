import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, CardBody, Modal, ModalHeader } from "reactstrap";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import { getGreeting } from "./dashboardHelpers";

interface DashboardHeaderProps {
    userName: string;
    roleLabel: string;
    startDate: string;
    endDate: string;
    onDateChange: (start: string, end: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    userName,
    roleLabel,
    startDate,
    endDate,
    onDateChange,
}) => {
    const { t, i18n } = useTranslation();

    const dateLocaleMap: Record<string, string> = { sp: "es-MX", en: "en-US", pt: "pt-BR" };
    const dateLocale = dateLocaleMap[i18n.language] ?? "es-MX";
    const [pickerOpen, setPickerOpen] = useState(false);

    const shortMonths = t("common.shortMonths", { returnObjects: true }) as string[];
    const formatDateLabel = (dateStr: string): string => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${parseInt(day)} ${shortMonths[parseInt(month) - 1]} ${year}`;
    };

    const todayLabel = new Date().toLocaleDateString(dateLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <>
            <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: "8px" }}>
                <CardBody className="p-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                {getGreeting(t)}, {userName}
                            </h4>
                            <div className="text-muted" style={{ fontSize: "14px", textTransform: "capitalize" }}>
                                {todayLabel}
                                <span className="mx-2">•</span>
                                <span className="fw-semibold text-primary">{roleLabel}</span>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Button
                                color="light"
                                className="d-flex align-items-center gap-2 shadow-sm border"
                                onClick={() => setPickerOpen(true)}
                                style={{ borderRadius: "8px", padding: "8px 16px" }}
                            >
                                <i className="ri-calendar-line text-primary" style={{ fontSize: "16px" }}></i>
                                <span style={{ fontSize: "13px" }}>
                                    <span className="fw-semibold">{formatDateLabel(startDate)}</span>
                                    <span className="text-muted" style={{ margin: "0 6px" }}>—</span>
                                    <span className="fw-semibold">{formatDateLabel(endDate)}</span>
                                </span>
                                <i className="ri-arrow-down-s-line text-muted"></i>
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Modal isOpen={pickerOpen} toggle={() => setPickerOpen(false)} centered>
                <ModalHeader toggle={() => setPickerOpen(false)}>
                    <i className="ri-calendar-line me-2"></i>
                    {t("dashboard.header.selectDateRange")}
                </ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={(s, e) => { onDateChange(s, e); setPickerOpen(false); }}
                    onCancel={() => setPickerOpen(false)}
                    generateButtonText={t("dashboard.header.apply")}
                />
            </Modal>
        </>
    );
};

export default DashboardHeader;
