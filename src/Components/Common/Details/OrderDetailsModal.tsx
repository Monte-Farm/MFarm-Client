import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
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
        { key: 'id', label: t('warehouse.orders.col.orderNumber', { defaultValue: 'No. de Pedido' }), type: 'text' },
        { key: 'date', label: t('warehouse.orders.col.orderDate', { defaultValue: 'Fecha de pedido' }), type: 'date' },
        {
            key: 'user',
            label: t('warehouse.orders.col.orderedBy', { defaultValue: 'Pedido por' }),
            type: 'text',
            render: (_) => <span>{orderDetails.user.name} {orderDetails.user.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: t('warehouse.orders.col.orderFor', { defaultValue: 'Pedido para' }),
            type: 'text',
            render: (_) => <span>{orderDetails.orderOrigin.name}</span>
        },
        {
            key: 'orderDestiny',
            label: t('warehouse.orders.col.orderTo', { defaultValue: 'Pedido hacia' }),
            type: 'text',
            render: (_) => <span>{orderDetails.orderDestiny.name}</span>
        },
        {
            key: 'status',
            label: t('common.field.status'),
            render: (value: string) => {
                let color = 'secondary';

                switch (value) {
                    case 'completed':
                        color = 'success';
                        break;
                    case 'pending':
                        color = 'warning';
                        break;
                }
                return <Badge color={color}>{t(`warehouse.orders.status.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ]

    const productsColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.orderDetails.col.requested', { defaultValue: 'Solicitado' }),
            accessor: 'quantityRequested',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.quantityRequested} {row.unit_measurement}</span>
        },
        {
            header: t('warehouse.orderDetails.col.delivered', { defaultValue: 'Entregado' }),
            accessor: 'quantityDelivered',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.quantityDelivered}</span>
        },
        { header: t('common.field.totalPrice', { defaultValue: 'Precio' }), accessor: 'price', isFilterable: true, type: 'text' },
        { header: t('warehouse.orderDetails.col.observations', { defaultValue: 'Observaciones' }), accessor: 'observations', isFilterable: true, type: 'text' },
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
            logger.error('Error fetching data', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.orders.error.fetch', { defaultValue: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' }) })
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
            logger.error('Error generating report:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.orders.error.fetch', { defaultValue: 'Ha ocurrido un error al generar el reporte, intentelo mas tarde' }) })
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
                    {t('common.button.exportPdf', { defaultValue: 'Descargar Reporte' })}
                </Button>
            </div>
            <div className="d-flex gap-3">
                <Card>
                    <CardHeader className='bg-light'>
                        <h5>{t('warehouse.orderDetails.attr.orderInfo', { defaultValue: 'Informacion del pedido' })}</h5>
                    </CardHeader>
                    <CardBody className="pt-4">
                        <ObjectDetails attributes={orderAttributes} object={orderDetails} />
                    </CardBody>
                </Card>

                <Card className="w-100">
                    <CardHeader className='bg-light'>
                        <h5>{t('warehouse.orderDetails.attr.products', { defaultValue: 'Productos del pedido' })}</h5>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable columns={productsColumns} data={products} showPagination={true} rowsPerPage={5} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </div>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.orderDetails.modal.report', { defaultValue: 'Pedido de almacen' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    )
}

export default OrderDetails;
