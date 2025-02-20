import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import { useNavigate } from "react-router-dom";

const ViewPurchaseOrders = () => {
    document.title = 'Ver Ordenes de compra | Ordenes de compra';
    const history = useNavigate()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const configContext = useContext(ConfigContext)
    const warehouseId = 'AG001';

    const columnsTable = [
        { header: "No. de Orden", accessor: "id", isFilterable: true },
        { header: "Fecha", accessor: "date", isFilterable: true },
        { header: 'Total de Orden', accessor: 'totalPrice', isFilterable: true },
        { header: 'Proveedor', accessor: 'supplier', isFilterable: true },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon">
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const fetchPurchaseOrdersData = async () => {
        setLoading(true);
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_warehouse/${warehouseId}`);

            setPurchaseOrders(response.data.data);
        } catch (error) {
            handleError(error, "El servicio no está disponible, inténtelo más tarde");
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchPurchaseOrdersData();

        return () => {
            document.body.style.overflow = '';
        };
    }, []);


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Ordenes de Compra"} pageTitle={"Ordenes de Compra"} />

                <Card className="rounded" style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex justify-content-between">
                            <h4 className="m-2">Ordenes de Compra</h4>
                            <Button className="h-50 farm-primary-button" onClick={() => history('/purchase_orders/create_purchase_order')}>
                                <i className="ri-add-line pe-2" />
                                Nueva Orden de Compra
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        <CustomTable columns={columnsTable} data={purchaseOrders} showSearchAndFilter={true} rowClickable={false} showPagination={false} />
                    </CardBody>

                </Card>
            </Container>
        </div>
    )
}


export default ViewPurchaseOrders