import React from "react";
import { Badge, Button, Card, CardBody, CardImg, CardText } from "reactstrap";
import { Column, ColumnType } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import defaultFarmImage from '../../assets/images/establo-cerdo.jpg'

interface FarmCardsProps<T> {
    columns: Column<T>[];
    data: T[];
    onDetailsClick?: (row: T) => void;
    onEditClick?: (row: T) => void;
    onDeleteClick?: (row: T) => void;
    onCardClick?: (row: T) => void;
    imageAccessor?: keyof T;
    className?: string;
}

const FarmCards = <T extends Record<string, any>>({
    columns,
    data,
    onDetailsClick,
    onEditClick,
    onDeleteClick,
    onCardClick,
    imageAccessor,
    className = "",
}: FarmCardsProps<T>) => {

    const mainColumns = columns.filter(col => col.accessor !== 'action');
    const titleColumn = mainColumns[0] || { accessor: '', header: '' };
    const subtitleColumns = mainColumns.slice(1, 3);
    const bodyColumns = mainColumns.slice(3);

    return (
        <SimpleBar style={{ height: '100%', overflowY: 'auto' }} className={className}>
            <div className="d-flex flex-wrap gap-4 p-3">
                {data.length > 0 ? (
                    data.map((item, index) => (
                        <Card key={index} className="farm-card" onClick={() => onCardClick?.(item)} style={{cursor: 'pointer'}}>
                            <div className="farm-card-header">
                                {imageAccessor && item[imageAccessor] ? (
                                    <CardImg
                                        top
                                        src={item[imageAccessor] || defaultFarmImage}
                                        alt="User image"
                                        className="user-card-img"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultFarmImage;
                                        }}
                                    />
                                ) : (
                                    <CardImg
                                        top
                                        src={defaultFarmImage}
                                        alt="User image"
                                        className="user-card-img"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultFarmImage;
                                        }}
                                    />
                                )}
                                <div className="farm-card-actions">
                                    {onDetailsClick && (
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => onDetailsClick(item)}
                                            className="farm-action-btn"
                                        >
                                            <i className="ri-eye-fill" />
                                        </Button>
                                    )}
                                    {onEditClick && (
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            onClick={() => onEditClick(item)}
                                            className="farm-action-btn"
                                            disabled={item.status === false}
                                        >
                                            <i className="ri-pencil-fill" />
                                        </Button>
                                    )}
                                    {onDeleteClick && (
                                        <Button
                                            color="danger"
                                            size="sm"
                                            onClick={() => onDeleteClick(item)}
                                            className="farm-action-btn"
                                            disabled={item.status === false}
                                        >
                                            <i className="ri-forbid-line" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <CardBody className="farm-card-body">
                                <strong className="farm-card-title">{item[titleColumn.accessor]}</strong>
                                {/* Subtítulos */}
                                {subtitleColumns.length > 0 && (
                                    <div className="farm-card-subtitle mb-2">
                                        {subtitleColumns.map((col, i) => (
                                            <div key={i}>
                                                <strong>{col.header}: </strong>
                                                {col.render
                                                    ? col.render(item[col.accessor], item)
                                                    : item[col.accessor]
                                                }
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cuerpo */}
                                {bodyColumns.length > 0 && (
                                    <CardText className="farm-card-text">
                                        {bodyColumns.map((col, i) => (
                                            <div key={i} className="mb-1">
                                                <strong>{col.header}: </strong>
                                                {col.render
                                                    ? col.render(item[col.accessor], item)
                                                    : col.type === ('status' as ColumnType) ? (
                                                        <Badge color={item[col.accessor] ? "success" : "danger"} className="farm-status-badge">
                                                            {item[col.accessor] ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    ) : item[col.accessor]
                                                }
                                            </div>
                                        ))}
                                    </CardText>
                                )}
                            </CardBody>
                        </Card>
                    ))
                ) : (
                    <div className="w-100 text-center py-5">
                        No se encontraron granjas
                    </div>
                )}
            </div>
        </SimpleBar>
    );
};

export default FarmCards;
