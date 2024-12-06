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

const ObjectDetails: React.FC<ProductDetailsProps> = ({ attributes, object, showImage = true, imageSrc }) => {
    return (
        <React.Fragment>
            <div className="table-card table-responsive">
                {showImage && imageSrc && (
                    <div className="mb-3 text-center">
                        <img
                            src={imageSrc}
                            alt="Detalle del objeto"
                            className="img-fluid rounded-top"
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
                                        object[key] === true ? (
                                            <Badge color="success">Activo</Badge>
                                        ) : object[key] === false ? (
                                            <Badge color="danger">Inactivo</Badge>
                                        ) : (
                                            "No disponible"
                                        )
                                    ) : (
                                        object[key] || "No disponible"
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
