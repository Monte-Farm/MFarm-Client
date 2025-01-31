import React from "react";
import { Badge } from "reactstrap";

interface Attribute {
    key: string;
    label: string;
}

interface ProductDetailsProps {
    attributes: Attribute[]; // Array de atributos a mostrar
    object: Record<string, any>; // Objeto con los datos del producto
    showImage?: boolean; // Propiedad para decidir si se muestra la imagen
    imageSrc?: string; // URL o ruta de la imagen a mostrar
}

// Función para obtener valores anidados a partir de un path
const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

const ObjectDetails: React.FC<ProductDetailsProps> = ({ attributes, object, showImage = true, imageSrc }) => {
    return (
        <React.Fragment>
            <div className="table-card table-responsive">
                {showImage && imageSrc && (
                    <div className="mb-3 text-center">
                        <img
                            src={imageSrc}
                            alt="Detalle del objeto"
                            className="rounded-top"
                            style={{ maxHeight: "250px" }}
                        />
                    </div>
                )}

                <table className="table">
                    <tbody>
                        {attributes.map(({ key, label }) => (
                            <tr key={key}>
                                <td className="fw-medium fs-5">{label}</td>
                                <td className="fs-5">
                                    {key === "status" ? (
                                        typeof object[key] === "boolean" ? (
                                            object[key] ? (
                                                <Badge color="success">Activo</Badge>
                                            ) : (
                                                <Badge color="danger">Inactivo</Badge>
                                            )
                                        ) : object[key] === "pending" ? (
                                            <Badge color="warning">Pendiente</Badge>
                                        ) : object[key] === "completed" ? (
                                            <Badge color="primary">Completado</Badge>
                                        ) : (
                                            "No disponible"
                                        )
                                    ) : (
                                        getNestedValue(object, key) || "No disponible"
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </React.Fragment>
    );
};

export default ObjectDetails;