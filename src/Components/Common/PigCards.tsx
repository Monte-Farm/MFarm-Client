import React from "react";
import { Badge, Button, Card, CardBody, CardImg, CardSubtitle, CardText } from "reactstrap";
import defaultPigImage from "../../assets/images/pig-default.png"; // imagen por defecto
import { PigData } from "common/data_interfaces";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface PigCardsProps {
    pigs: PigData[];
    onPigSelect: (pigId: string) => void;
    onDetailsClick?: (pig: PigData) => void;
    onEditClick?: (pig: PigData) => void;
    onDeleteClick?: (pig: PigData) => void;
    showDetailsButton?: boolean;
    showEditButton?: boolean;
    showDeleteButton?: boolean;
    className?: string;
}

const stageColors: Record<string, string> = {
    "lechón": "warning",
    "destete": "primary",
    "engorda": "success",
    "reproductor": "dark",
};


const PigCards: React.FC<PigCardsProps> = ({
    pigs,
    onDetailsClick,
    onEditClick,
    onDeleteClick,
    showDetailsButton = true,
    showEditButton = true,
    showDeleteButton = true,
    className = "",
    onPigSelect
}) => {
    return (
        <SimpleBar style={{ height: "100%", overflowY: "auto" }} className={className}>
            <div className="d-flex flex-wrap gap-4 p-3">
                {pigs.length > 0 ? (
                    pigs.map((pig, index) => (
                        <Card key={index} className="pig-card" onClick={() => onPigSelect(pig._id)} >
                            {/* Imagen y acciones */}
                            <div className="pig-card-header">
                                <CardImg
                                    top
                                    src={defaultPigImage}
                                    alt="Pig image"
                                    className="pig-card-img"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = defaultPigImage;
                                    }}
                                />
                                <div className="pig-card-actions">
                                    {showDetailsButton && onDetailsClick && (
                                        <Button
                                            size="sm"
                                            className="pig-action-btn"
                                            onClick={() => onDetailsClick(pig)}
                                        >
                                            <i className="ri-eye-fill" />
                                        </Button>
                                    )}
                                    {showEditButton && onEditClick && (
                                        <Button
                                            size="sm"
                                            className="pig-action-btn"
                                            onClick={() => onEditClick(pig)}
                                        >
                                            <i className="ri-pencil-fill" />
                                        </Button>
                                    )}
                                    {showDeleteButton && onDeleteClick && (
                                        <Button
                                            size="sm"
                                            className="pig-action-btn"
                                            onClick={() => onDeleteClick(pig)}
                                        >
                                            <i className="ri-delete-bin-fill" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Contenido */}
                            <CardBody className="pig-card-body">
                                <CardText className="pig-card-title text-truncate">{pig.code}</CardText>
                                <CardSubtitle className="pig-card-subtitle">
                                    <div><strong>Raza:</strong> {pig.breed}</div>
                                    <div><strong>Sexo:</strong> {pig.sex}</div>
                                </CardSubtitle>
                                <CardText className="pig-card-text">
                                    <div><strong>Peso:</strong> {pig.weight} kg</div>

                                    <div className="d-flex gap-1 mt-2">
                                        <Badge className="fs-6" color={pig.status === "vivo" ? "success" : "secondary"}>
                                            {pig.status}
                                        </Badge>

                                        <Badge className="fs-6" color={stageColors[pig.currentStage] || "info"}>
                                            {pig.currentStage}
                                        </Badge>
                                    </div>

                                </CardText>
                            </CardBody>
                        </Card>
                    ))
                ) : (
                    <div className="w-100 text-center py-5">
                        No se encontraron cerdos
                    </div>
                )}
            </div>
        </SimpleBar>
    );
};

export default PigCards;