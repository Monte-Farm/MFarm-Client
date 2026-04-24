import { ConfigContext } from "App";
import { Attribute } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import { FEED_PREPARATION_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader } from "reactstrap";
import AlertMessage from "../Shared/AlertMesagge";
import LoadingAnimation from "../Shared/LoadingAnimation";
import CustomTable from "../Tables/CustomTable";
import ObjectDetails from "./ObjectDetails";

interface FeedPreparationDetailsProps {
    preparationId: string;
}

const FeedPreparationDetails: React.FC<FeedPreparationDetailsProps> = ({ preparationId }) => {
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(true);
    const [preparation, setPreparation] = useState<any>({});
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });

    const headerAttributes: Attribute[] = [
        { key: 'code', label: 'Código', type: 'text' },
        { key: 'preparationDate', label: 'Fecha de preparación', type: 'date' },
        {
            key: 'recipe', label: 'Receta',
            render: (_, row) => <span>{row.recipe?.code} — {row.recipe?.name}</span>
        },
        {
            key: 'preparedProduct', label: 'Producto generado',
            render: (_, row) => <span>{row.preparedProduct?.name}</span>
        },
        {
            key: 'responsible', label: 'Responsable',
            render: (_, row) => <span>{row.responsible?.name} {row.responsible?.lastname}</span>
        },
        { key: 'notes', label: 'Notas', type: 'text' },
    ];

    const ingredientColumns: Column<any>[] = [
        {
            header: "Ingrediente", accessor: "product.name",
            type: "text",
            render: (_, row) => <span className="fw-semibold">{row.product?.name}</span>,
        },
        {
            header: "Cantidad usada", accessor: "quantity",
            type: "currency",
            bgColor: '#e3f2fd',
            render: (_, row) => <span className="fw-medium">{(row.quantity ?? 0).toFixed(2)} {row.product?.unit_measurement || 'kg'}</span>
        },
        {
            header: "Precio unitario", accessor: "unitPrice",
            type: "currency",
            bgColor: '#f3e5f5',
            render: (_, row) => <span>${(row.unitPrice ?? 0).toFixed(2)}</span>
        },
        {
            header: "Subtotal", accessor: "subtotal",
            type: "currency",
            bgColor: '#e8f5e9',
            render: (_, row) => <span className="fw-semibold">${(row.subtotal ?? 0).toFixed(2)}</span>
        },
    ];

    const fetchData = async () => {
        if (!configContext || !preparationId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEED_PREPARATION_URLS.findById(preparationId)}`);
            setPreparation(response.data.data);
        } catch (error) {
            console.error('Error fetching preparation:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al cargar la preparación' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preparationId]);

    if (loading) return <LoadingAnimation absolutePosition={false} />;

    return (
        <>
            <div className="d-flex gap-3 align-items-start">
                <Card className="border-primary border-opacity-25 flex-shrink-0" style={{ width: '340px' }}>
                    <CardHeader className="bg-primary bg-opacity-10">
                        <h5 className="mb-0 text-primary">
                            <i className="ri-flask-line me-2" /> Información de la preparación
                        </h5>
                    </CardHeader>
                    <CardBody>
                        <ObjectDetails attributes={headerAttributes} object={preparation} />
                    </CardBody>
                </Card>

                <div className="flex-fill d-flex flex-column gap-3">
                    {/* KPIs */}
                    <Card className="border-success border-opacity-25">
                        <CardBody>
                            <div className="row text-center">
                                <div className="col">
                                    <div className="text-muted small">Mezcla preparada</div>
                                    <div className="fs-5 fw-bold">{(preparation.batchSize ?? 0).toFixed(2)} kg</div>
                                </div>
                                <div className="col border-start">
                                    <div className="text-muted small">Producido</div>
                                    <div className="fs-5 fw-bold text-success">{(preparation.actualYield ?? 0).toFixed(2)} kg</div>
                                </div>
                                <div className="col border-start">
                                    <div className="text-muted small">Merma</div>
                                    <div className="fs-5 fw-bold text-warning">
                                        {(preparation.shrinkage ?? 0).toFixed(2)} kg
                                        <span className="ms-1 small">({(preparation.shrinkagePercentage ?? 0).toFixed(2)}%)</span>
                                    </div>
                                </div>
                                <div className="col border-start">
                                    <div className="text-muted small">Costo total</div>
                                    <div className="fs-5 fw-bold text-primary">${(preparation.totalCost ?? 0).toFixed(2)}</div>
                                </div>
                                <div className="col border-start">
                                    <div className="text-muted small">Costo / kg</div>
                                    <div className="fs-5 fw-bold text-primary">${(preparation.costPerKg ?? 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Ingredientes */}
                    <Card className="border-success border-opacity-25">
                        <CardHeader className="bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 text-success">
                                <i className="ri-leaf-line me-2" /> Ingredientes consumidos
                            </h5>
                            <Badge color="success">{(preparation.ingredientsUsed || []).length} ingrediente(s)</Badge>
                        </CardHeader>
                        <CardBody className="p-0">
                            <CustomTable
                                columns={ingredientColumns}
                                data={preparation.ingredientsUsed || []}
                                showSearchAndFilter={false}
                                showPagination={false}
                                fontSize={14}
                            />
                        </CardBody>
                    </Card>
                </div>
            </div>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    );
};

export default FeedPreparationDetails;
