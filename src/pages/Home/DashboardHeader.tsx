import React, { useState } from "react";
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

const formatDateLabel = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    userName,
    roleLabel,
    startDate,
    endDate,
    onDateChange,
}) => {
    const [pickerOpen, setPickerOpen] = useState(false);

    const todayLabel = new Date().toLocaleDateString("es-MX", {
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
                            <h4 className="mb-1 fw-bold" style={{ color: "#111827" }}>
                                {getGreeting()}, {userName}
                            </h4>
                            <div className="text-muted" style={{ fontSize: "14px", textTransform: "capitalize" }}>
                                {todayLabel}
                                <span className="mx-2">•</span>
                                <span className="fw-semibold" style={{ color: "#405189" }}>{roleLabel}</span>
                            </div>
                        </div>
                        <Button
                            color="white"
                            className="d-flex align-items-center gap-2 shadow-sm"
                            onClick={() => setPickerOpen(true)}
                            style={{ border: "1.5px solid #dee2e6", borderRadius: "8px", padding: "8px 16px" }}
                        >
                            <i className="ri-calendar-line" style={{ color: "#405189", fontSize: "16px" }}></i>
                            <span style={{ fontSize: "13px" }}>
                                <span className="fw-semibold" style={{ color: "#333" }}>{formatDateLabel(startDate)}</span>
                                <span style={{ color: "#999", margin: "0 6px" }}>—</span>
                                <span className="fw-semibold" style={{ color: "#333" }}>{formatDateLabel(endDate)}</span>
                            </span>
                            <i className="ri-arrow-down-s-line" style={{ color: "#666" }}></i>
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Modal isOpen={pickerOpen} toggle={() => setPickerOpen(false)} centered>
                <ModalHeader toggle={() => setPickerOpen(false)}>
                    <i className="ri-calendar-line me-2"></i>
                    Seleccionar Rango de Fechas
                </ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={(s, e) => { onDateChange(s, e); setPickerOpen(false); }}
                    onCancel={() => setPickerOpen(false)}
                    generateButtonText="Aplicar"
                />
            </Modal>
        </>
    );
};

export default DashboardHeader;
