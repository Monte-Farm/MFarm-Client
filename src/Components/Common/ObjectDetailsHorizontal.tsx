import React from "react";
import { Badge, Label } from "reactstrap";

interface Attribute {
    key: string;
    label: string;
}

interface ProductDetailsProps {
    attributes: Attribute[];
    object: Record<string, any>;
}

const getNestedValue = (obj: Record<string, any>, path: string): any => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

const ObjectDetailsHorizontal: React.FC<ProductDetailsProps> = ({ attributes, object }) => {
    return (
        <React.Fragment>
            <div className="table-card table-responsive">

                <div className="d-flex gap-4">
                    {attributes.map(({ key, label }) => (
                        <div className="p-3 d-flex-column gap-2" key={key}>
                            <Label className="fw-light fs-5 me-2">{label}:</Label>
                            
                            {key === "status" ? (
                                typeof object[key] === "boolean" ? (
                                    object[key] ? (
                                        <Badge className="fs-5" color="success">Activo</Badge>
                                    ) : (
                                        <Badge className="fs-5"  color="danger">Inactivo</Badge>
                                    )
                                ) : object[key] === "pending" ? (
                                    <Badge className="fs-5" color="warning">Pendiente</Badge>
                                ) : object[key] === "completed" ? (
                                    <Badge className="fs-5" color="success">Completado</Badge>
                                ) : (
                                    "No disponible"
                                )
                            ) : (
                                <Label className="fs-5">{getNestedValue(object, key) || 'No disponible'}</Label>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        </React.Fragment>
    );
};

export default ObjectDetailsHorizontal;
