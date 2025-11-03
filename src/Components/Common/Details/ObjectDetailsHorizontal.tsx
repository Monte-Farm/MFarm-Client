import React from "react";
import { Badge, Label } from "reactstrap";
import moment from "moment";
import { Attribute } from "common/data_interfaces";


interface ProductDetailsProps {
    attributes: Attribute[];
    object: Record<string, any>;
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : undefined, obj);
};

const formatValue = (value: any, type?: string): string | JSX.Element => {
    if (value === undefined || value === null) return "No disponible";

    switch (type) {
        case "currency":
            return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
        case "percentage":
            return `${value}%`;
        case "status":
            if (typeof value === "boolean") {
                return <Badge className="fs-5" color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>;
            } else if (value === "pending") {
                return <Badge className="fs-5" color="warning">Pendiente</Badge>;
            } else if (value === "completed") {
                return <Badge className="fs-5" color="success">Completado</Badge>;
            }
            return "No disponible";
        case "date":
            return moment(value).format("DD/MM/YYYY");
        case "datetime":
            return moment(value).format("DD/MM/YYYY HH:mm");
        case "boolean":
            return value ? "Sí" : "No";
        case "uppercase":
            return String(value).toUpperCase();
        case "lowercase":
            return String(value).toLowerCase();
        case "phone":
            return String(value).replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
        default:
            return value;
    }
};

const ObjectDetailsHorizontal: React.FC<ProductDetailsProps> = ({ attributes, object }) => {
    return (
        <div className="table-card table-responsive">
            <div className="d-flex gap-4">
                {attributes.map(({ key, label, type }) => {
                    const value = getNestedValue(object, key);

                    return (
                        <div className="p-3 d-flex-column gap-2" key={key}>
                            <Label className="fw-light fs-5 me-2">{label}:</Label>
                            <Label className="fs-5">{formatValue(value, type)}</Label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ObjectDetailsHorizontal;
