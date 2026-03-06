import React from "react";
import { Badge } from "reactstrap";

interface Attribute {
    key: string;
    label: string;
    type?: string;
    render?: (value: any, object: Record<string, any>) => React.ReactNode; // 👈 agregado
}

interface ObjectDetailsProps {
    attributes: Attribute[];
    object: Record<string, any>;
    showImage?: boolean;
    imageSrc?: string;
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const ObjectDetails: React.FC<ObjectDetailsProps> = ({
    attributes,
    object,
    showImage = true,
    imageSrc,
}) => {
    return (
        <div className="table-card table-responsive">
            {showImage && imageSrc && (
                <div className="mb-3 text-center">
                    <img
                        src={imageSrc}
                        alt="Detalle del objeto"
                        className="rounded-top"
                        style={{
                            maxHeight: "250px",
                            maxWidth: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
            )}

            <table className="table">
                <tbody>
                    {attributes.map(({ key, label, type, render }) => {
                        let value = getNestedValue(object, key);

                        if (typeof value === "string" && value.trim() === "") {
                            value = "-";
                        }

                        return (
                            <tr key={key}>
                                <td className="fw-medium fs-5">{label}</td>
                                <td className="fs-5">
                                    {render ? (
                                        render(value, object)
                                    ) : type === "status" ? (
                                        value === true ||
                                            value === "activo" ||
                                            value === "vivo" ? (
                                            <Badge color="success">Activo</Badge>
                                        ) : value === false ||
                                            value === "inactivo" ||
                                            value === "muerto" ? (
                                            <Badge color="danger">Inactivo</Badge>
                                        ) : (
                                            <Badge color="secondary">
                                                {value ?? "No disponible"}
                                            </Badge>
                                        )
                                    ) : type === "date" && value && value !== "-" ? (
                                        new Date(value).toLocaleDateString("es-MX", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
                                    ) : type === "currency" && value !== undefined && value !== null ? (
                                        new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(value)
                                    ) : type === "percentage" && value !== undefined && value !== null ? (
                                        `${(value).toFixed(2)}%`
                                    ) : (
                                        value ?? "-"
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ObjectDetails;