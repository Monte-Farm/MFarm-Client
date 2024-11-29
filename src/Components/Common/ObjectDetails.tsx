import React from "react";
import { Badge, Col, Label, Row } from "reactstrap";
import exampleImage from '../../assets/images/auth-one-bg.jpg'

interface Attribute {
    key: string;
    label: string;
}

interface ProductDetailsProps {
    attributes: Attribute[]; // Array de atributos a mostrar
    object: Record<string, any>; // Objeto con los datos del producto
}

const ObjectDetails: React.FC<ProductDetailsProps> = ({ attributes, object }) => {
    return (
        <React.Fragment>
            <img src={exampleImage} className="img-fluid rounded" alt="Example image" />
            {attributes.map(({ key, label }) => (
                <div key={key}>
                    <div className="border" />
                    <Row className="mt-3 mb-3">
                        <Col lg={4}>
                            <Label className="g-col-6 fs-5">{label}</Label>
                        </Col>
                        <Col lg={8}>
                            {key === "status" ? (
                                object[key] === "Active" ? (
                                    <Badge color="success" className="fs-6">Activo</Badge>
                                ) : object[key] === "Unactive" ? (
                                    <Badge color="danger" className="fs-6">Inactivo</Badge>
                                ) : null
                            ) : (
                                <Label className="g-col-6 fs-5 text-body-secondary">
                                    {object[key] || "No disponible"}
                                </Label>
                            )}
                        </Col>
                    </Row>
                </div>
            ))}
        </React.Fragment>
    );
};

export default ObjectDetails;
