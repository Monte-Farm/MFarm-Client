import React from "react";
import { Card, CardBody } from "reactstrap";

interface Props {
    message?: string;
}

const NoGlobalReportPlaceholder: React.FC<Props> = ({ message }) => {
    return (
        <Card className="border-0 shadow-sm">
            <CardBody className="py-5 text-center text-muted">
                <i className="ri-building-4-line" style={{ fontSize: '48px', opacity: 0.3 }} />
                <p className="mt-3 mb-0">
                    {message || "Selecciona una granja específica en el selector superior para ver este reporte."}
                </p>
            </CardBody>
        </Card>
    );
};

export default NoGlobalReportPlaceholder;
