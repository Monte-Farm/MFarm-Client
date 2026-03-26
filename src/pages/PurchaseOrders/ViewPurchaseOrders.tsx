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
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import PurchaseOrderDetails from "Components/Common/Details/PurchaseOrderDetails";

const ViewPurchaseOrders = () => {
    document.title = 'Ver Ordenes de compra | Ordenes de compra';
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [modals, setModals] = useState({ createPurchaseOrder: false, purchaseOrderDetails: false });
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [loading, setLoading] = useState(true);
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<string>('')
    const [purchaseStatistics, setPurchaseStatistics] = useState({
        totalOrders: 24,
        totalProductsRequested: 156,
        pendingOrders: 8,
        averageProductsPerOrder: 6.5
    })

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columnsTable: Column<any>[] = [
        { header: "No. de Orden", accessor: "code", isFilterable: true, type: 'text' },
        { header: "Fecha", accessor: "date", isFilterable: true, type: 'date' },
        {
            header: 'Productos',
            accessor: 'products',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row.products.length}</span>
        },
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

    const fetchPurchaseStatistics = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/purchase_statistics/${mainWarehouseId}`);
            setPurchaseStatistics(response.data.data.statistics);
        } catch (error) {
            console.error('Error fetching purchase statistics:', error);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    useEffect(() => {
        fetchPurchaseOrdersData();
        fetchPurchaseStatistics();
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

                {/* KPIs Section */}
                <div className="row">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Órdenes del Mes"
                            value={purchaseStatistics.totalOrders}
                            icon={<i className="ri-file-list-3-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Unidades Solicitados"
                            value={purchaseStatistics.totalProductsRequested}
                            icon={<i className="ri-shopping-bag-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Órdenes Pendientes"
                            value={purchaseStatistics.pendingOrders}
                            icon={<i className="ri-time-line fs-20 text-warning"></i>}
                            iconBgColor="#FFF3E0"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Promedio de Unidades por Orden"
                            value={purchaseStatistics.averageProductsPerOrder}
                            decimals={1}
                            icon={<i className="ri-bar-chart-box-line fs-20 text-success"></i>}
                            iconBgColor="#F3E5F5"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                </div>

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex justify-content-between">
                            <h4 className="m-2">Órdenes de Compra</h4>
                            <Button className="h-50 farm-primary-button" onClick={() => toggleModal('createPurchaseOrder')}>
                                <i className="ri-add-line pe-2" />
                                Nueva Orden de Compra
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={purchaseOrders.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
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
                                showPagination={true}
                                rowsPerPage={10}
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