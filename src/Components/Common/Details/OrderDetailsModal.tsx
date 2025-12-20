import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute } from "common/data_interfaces";
import { Card, CardHeader, CardBody, Badge, Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import ObjectDetails from "./ObjectDetails";
import { Column } from "common/data/data_types";
import CustomTable from "../Tables/CustomTable";
import PDFViewer from "../Shared/PDFViewer";
import AlertMessage from "../Shared/AlertMesagge";

interface OrderDetailsProps {
    orderId: string
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState({ viewPDF: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [fileURL, setFileURL] = useState<string>('')
    const [orderDetails, setOrderDetails] = useState<any>({});
    const [products, setProducts] = useState<any[]>([])

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const orderAttributes: Attribute[] = [
        { key: 'id', label: 'No. de Pedido', type: 'text' },
        { key: 'date', label: 'Fecha de pedido', type: 'date' },
        {
            key: 'user',
            label: 'Pedido por',
            type: 'text',
            render: (_) => <span>{orderDetails.user.name} {orderDetails.user.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: 'Pedido para',
            type: 'text',
            render: (_) => <span>{orderDetails.orderOrigin.name}</span>
        },
        {
            key: 'orderDestiny',
            label: 'Pedido hacia',
            type: 'text',
            render: (_) => <span>{orderDetails.orderDestiny.name}</span>
        },
        {
            key: 'status',
            label: 'Estado',
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'completed':
                        color = 'success';
                        label = 'Completado';
                        break;
                    case 'pending':
                        color = 'warning';
                        label = 'Pendiente';
                        break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const productsColumns: Column<any>[] = [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Solicitado',
            accessor: 'quantityRequested',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.quantityRequested} {row.unit_measurement}</span>
        },
        {
            header: 'Entregado',
            accessor: 'quantityDelivered',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.quantityDelivered}</span>
        },
        { header: 'Precio', accessor: 'price', isFilterable: true, type: 'text' },
        { header: 'Observaciones', accessor: 'observations', isFilterable: true, type: 'text' },

    ];

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [orderResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find_id/${orderId}`),
            ])
            const orderDetailsResponse = orderResponse.data.data;
            setOrderDetails(orderDetailsResponse)

            const productsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, orderDetailsResponse.productsRequested)
            const productsData = productsResponse.data.data;

            const combinedProducts = productsData.map((product: any) => {
                const delivered = (orderDetails.productsDelivered || []).find(
                    (d: any) => d.id === product.id
                );

                return {
                    id: product.id,
                    name: product.name,
                    quantityRequested: product.quantity,
                    quantityDelivered:
                        orderDetailsResponse.status === "pending"
                            ? "N/D"
                            : delivered?.quantity ?? 0,
                    unit_measurement: product.unit_measurement,
                    price: product.price,
                    observations: product.observations,
                    category: product.category,
                    description: product.description,
                    image: product.image
                };
            });

            setProducts(combinedProducts);
        } catch (error) {
            console.error('Error fetching data', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false);
        }
    };

    const handlePrintOrder = async () => {
        if (!configContext) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/reports/generate_order_report/${orderId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            console.error('Error generating report:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al generar el reporte, intentelo mas tarde' })
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <>
            <div className="d-flex gap-2 mb-4">
                <Button className="farm-primary-button" onClick={handlePrintOrder}>
                    <i className="ri-download-line me-2"></i>
                    Descargar Reporte
                </Button>
            </div>
            <div className="d-flex gap-3">
                <Card>
                    <CardHeader className='bg-light'>
                        <h5>Informacion del pedido</h5>
                    </CardHeader>
                    <CardBody className="pt-4">
                        <ObjectDetails attributes={orderAttributes} object={orderDetails} />
                    </CardBody>
                </Card>

                <Card className="w-100">
                    <CardHeader className='bg-light'>
                        <h5>Productos del pedido</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Pedido de almacen </ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default OrderDetails;