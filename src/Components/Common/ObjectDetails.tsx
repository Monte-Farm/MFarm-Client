import React from "react";
import { Badge } from "reactstrap";

interface Attribute {
    key: string;
    label: string;
    type?: string;
}

interface ProductDetailsProps {
    attributes: Attribute[];
    object: Record<string, any>;
    showImage?: boolean;
    imageSrc?: string;
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const ObjectDetails: React.FC<ProductDetailsProps> = ({
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
                        style={{ maxHeight: "250px", maxWidth: "100%", objectFit: "contain" }}
                    />
                </div>
            )}

            <table className="table">
                <tbody>
                    {attributes.map(({ key, label, type }) => {
                        let value = getNestedValue(object, key);

                        // Si es string vacío => "-"
                        if (typeof value === "string" && value.trim() === "") {
                            value = "-";
                        }

                        return (
                            <tr key={key}>
                                <td className="fw-medium fs-5">{label}</td>
                                <td className="fs-5">
                                    {type === "status" ? (
                                        value === true || value === "activo" || value === "vivo" ? (
                                            <Badge color="success">Activo</Badge>
                                        ) : value === false || value === "inactivo" || value === "muerto" ? (
                                            <Badge color="danger">Inactivo</Badge>
                                        ) : (
                                            <Badge color="secondary">{value ?? "No disponible"}</Badge>
                                        )
                                    ) : type === "date" && value && value !== "-" ? (
                                        new Date(value).toLocaleDateString("es-MX", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })
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