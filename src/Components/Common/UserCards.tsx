import React from "react";
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardImg,
    CardSubtitle,
    CardText,
} from "reactstrap";
import { Column, ColumnType } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import defaultProfile from '../../assets/images/default-profile-mage.jpg';

interface UserCardProps<T> {
    columns: Column<T>[];
    data: T[];
    onDetailsClick?: (row: T) => void;
    onEditClick?: (row: T) => void;
    onDeleteClick?: (row: T) => void;
    onCardClick?: (row: T) => void;
    imageAccessor?: keyof T;
    className?: string;
}

const UserCards = <T extends Record<string, any>>({
    columns,
    data,
    onDetailsClick,
    onEditClick,
    onDeleteClick,
    onCardClick,
    imageAccessor,
    className = "",
}: UserCardProps<T>) => {

    const mainColumns = columns.filter(col => col.accessor !== 'action');
    const titleColumn = mainColumns[0] || { accessor: '', header: '' };
    const subtitleColumns = mainColumns.slice(1, 3);
    const bodyColumns = mainColumns.slice(3);

    return (
        <SimpleBar style={{ height: '100%', overflowY: 'auto' }} className={className}>
            <div className="d-flex flex-wrap gap-4 p-3">
                {data.length > 0 ? (
                    data.map((item, index) => (
                        <Card
                            key={index}
                            className="user-card"
                            onClick={() => onCardClick?.(item)}
                        >
                            <div className="user-card-header">
                                {imageAccessor && item[imageAccessor] ? (
                                    <CardImg
                                        top
                                        src={item[imageAccessor] || defaultProfile}
                                        alt="User image"
                                        className="user-card-img"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultProfile;
                                        }}
                                    />
                                ) : (
                                    <CardImg
                                        top
                                        src={defaultProfile}
                                        alt="User image"
                                        className="user-card-img"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = defaultProfile;
                                        }}
                                    />
                                )}

                                <div className="user-card-actions">
                                    {onDetailsClick && (
                                        <Button
                                            color="primary"
                                            size="md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDetailsClick(item);
                                            }}
                                            className="action-btn"
                                        >
                                            <i className="ri-eye-fill" />
                                        </Button>
                                    )}

                                    {onEditClick && (
                                        <Button
                                            color="secondary"
                                            size="md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditClick(item);
                                            }}
                                            className="action-btn"
                                            disabled={item.status === false}
                                        >
                                            <i className="ri-pencil-fill" />
                                        </Button>
                                    )}

                                    {onDeleteClick && (
                                        <Button
                                            color="danger"
                                            size="md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteClick(item);
                                            }}
                                            className="action-btn"
                                            disabled={item.status === false}
                                        >
                                            <i className="ri-forbid-line" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <CardBody>
                                <CardText className="text-truncate fs-5 fw-bold">
                                    {item[titleColumn.accessor]}
                                </CardText>

                                {subtitleColumns.length > 0 && (
                                    <CardSubtitle className="mb-2 mt-2 fs-5">
                                        {subtitleColumns.map((col, i) => (
                                            <div key={i} className="text-truncate">
                                                <strong>{col.header}: </strong>
                                                {col.render
                                                    ? col.render(item[col.accessor], item)
                                                    : item[col.accessor]
                                                }
                                            </div>
                                        ))}
                                    </CardSubtitle>
                                )}

                                {bodyColumns.length > 0 && (
                                    <CardText>
                                        {bodyColumns.map((col, i) => (
                                            <div key={i} className="mb-1 fs-5">
                                                <strong>{col.header}: </strong>
                                                {col.render
                                                    ? col.render(item[col.accessor], item)
                                                    : col.type === ('status' as ColumnType) ? (
                                                        <Badge color={item[col.accessor] ? "success" : "danger"}>
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
                        No se encontraron usuarios
                    </div>
                )}
            </div>
        </SimpleBar>
    );
};

export default UserCards;