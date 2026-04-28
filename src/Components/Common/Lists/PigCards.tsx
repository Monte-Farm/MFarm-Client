import React from "react";
import { Badge, Button, Card, CardBody, CardImg, CardSubtitle, CardText } from "reactstrap";
import defaultPigImage from "../../assets/images/pig-default.png";
import { PigData } from "common/data_interfaces";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { useTranslation } from "react-i18next";

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

const stageBadgeColors: Record<string, string> = {
    piglet: "warning",
    weaning: "primary",
    fattening: "success",
    breeder: "dark",
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
    const { t } = useTranslation();

    return (
        <SimpleBar style={{ height: "100%", overflowY: "auto" }} className={className}>
            <div className="d-flex flex-wrap gap-4 p-3">
                {pigs.length > 0 ? (
                    pigs.map((pig, index) => (
                        <Card key={index} className="pig-card" onClick={() => onPigSelect(pig._id)}>
                            <div className="pig-card-header">
                                <CardImg
                                    top
                                    src={defaultPigImage}
                                    alt="Pig image"
                                    className="pig-card-img"
                                    onError={(e) => { (e.target as HTMLImageElement).src = defaultPigImage; }}
                                />
                                <div className="pig-card-actions">
                                    {showDetailsButton && onDetailsClick && (
                                        <Button size="sm" className="pig-action-btn" onClick={() => onDetailsClick(pig)}>
                                            <i className="ri-eye-fill" />
                                        </Button>
                                    )}
                                    {showEditButton && onEditClick && (
                                        <Button size="sm" className="pig-action-btn" onClick={() => onEditClick(pig)}>
                                            <i className="ri-pencil-fill" />
                                        </Button>
                                    )}
                                    {showDeleteButton && onDeleteClick && (
                                        <Button size="sm" className="pig-action-btn" onClick={() => onDeleteClick(pig)}>
                                            <i className="ri-delete-bin-fill" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <CardBody className="pig-card-body">
                                <CardText className="pig-card-title text-truncate">{pig.code}</CardText>
                                <CardSubtitle className="pig-card-subtitle">
                                    <div><strong>{t('pigs.field.breed')}:</strong> {pig.breed}</div>
                                    <div><strong>{t('pigs.field.sex')}:</strong> {t(`pigs.sex.${pig.sex}Short`, { defaultValue: pig.sex })}</div>
                                </CardSubtitle>
                                <CardText className="pig-card-text">
                                    <div><strong>{t('common.field.weight')}:</strong> {pig.weight} kg</div>
                                    <div className="d-flex gap-1 mt-2">
                                        <Badge className="fs-6" color={pig.status === "alive" ? "success" : "secondary"}>
                                            {t(`pigs.status.${pig.status}`, { defaultValue: pig.status })}
                                        </Badge>
                                        <Badge className="fs-6" color={stageBadgeColors[pig.currentStage] || "info"}>
                                            {t(`pigs.stage.${pig.currentStage}`, { defaultValue: pig.currentStage })}
                                        </Badge>
                                        {pig.discard && (
                                            <Badge className="fs-6" color="danger">
                                                {t('pigs.status.discarded')}
                                            </Badge>
                                        )}
                                    </div>
                                </CardText>
                            </CardBody>
                        </Card>
                    ))
                ) : (
                    <div className="w-100 text-center py-5">
                        {t('pigs.page.noPigs')}
                    </div>
                )}
            </div>
        </SimpleBar>
    );
};

export default PigCards;
