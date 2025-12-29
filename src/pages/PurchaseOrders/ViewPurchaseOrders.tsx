import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { Column } from "common/data/data_types";
import PurchaseOrderForm from "Components/Common/Forms/PurchaseOrderForm";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getLoggedinUser } from "helpers/api_helper";
import CustomTable from "Components/Common/Tables/CustomTable";
import PurchaseOrderDetails from "Components/Common/Details/PurchaseOrderDetails";

const ViewPurchaseOrders = () => {
    document.title = 'Ver Ordenes de compra | Ordenes de compra';
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();

    const history = useNavigate()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [modals, setModals] = useState({ createPurchaseOrder: false, purchaseOrderDetails: false });
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [loading, setLoading] = useState(true);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<string>('')

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columnsTable: Column<any>[] = [
        { header: "No. de Orden", accessor: "code", isFilterable: true, type: 'text' },
        { header: "Fecha", accessor: "date", isFilterable: true, type: 'date' },
        { header: 'Total de Orden', accessor: 'totalPrice', isFilterable: true, type: 'currency' },
        {
            header: 'Proveedor',
            accessor: 'supplier',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span className="text-black">{row.supplier.name}</span>
        },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: false,
            type: 'text',
            render: (_, row) => (
                <span
                    className={`badge ${row.status ? 'bg-warning text-dark' : 'bg-success'}`}
                >
                    {row.status ? 'No ingresada' : 'Ingresada'}
                </span>
            )
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedPurchaseOrder(row._id); toggleModal('purchaseOrderDetails') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            setMainWarehouseId(response.data.data)
        } catch (error) {
            console.error('Error fetching main warehouse ID:', error);
        }
    }

    const fetchPurchaseOrdersData = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_warehouse/${mainWarehouseId}`);
            setPurchaseOrders(response.data.data);
        } catch (error) {
            console.error('El servicio no esta disponible, intentelo mas tarde', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos intentelo, mas tarde' })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    useEffect(() => {
        fetchPurchaseOrdersData();
    }, [mainWarehouseId]);

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Ordenes de Compra"} pageTitle={"Ordenes de Compra"} />

                <Card className="rounded" style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex justify-content-between">
                            <h4 className="m-2">Órdenes de Compra</h4>
                            <Button className="h-50 farm-primary-button" onClick={() => toggleModal('createPurchaseOrder')}>
                                <i className="ri-add-line pe-2" />
                                Nueva Orden de Compra
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={purchaseOrders.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"} style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        {purchaseOrders.length === 0 ? (
                            <>
                                <i className="ri-file-list-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay órdenes de compra registradas</span>
                            </>
                        ) : (
                            <CustomTable
                                columns={columnsTable}
                                data={purchaseOrders}
                                showSearchAndFilter={true}
                                rowClickable={false}
                                showPagination={false}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createPurchaseOrder} toggle={() => toggleModal("createPurchaseOrder")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createPurchaseOrder")}>Nueva orden de compra</ModalHeader>
                <ModalBody>
                    <PurchaseOrderForm onSave={() => { toggleModal('createPurchaseOrder'); fetchPurchaseOrdersData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.purchaseOrderDetails} toggle={() => toggleModal("purchaseOrderDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("purchaseOrderDetails")}>Detalles de orden de compra</ModalHeader>
                <ModalBody>
                    <PurchaseOrderDetails purchaseId={selectedPurchaseOrder} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}


export default ViewPurchaseOrders