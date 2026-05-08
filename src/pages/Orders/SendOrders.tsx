import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import OrderForm from "Components/Common/Forms/OrderForm";
import OrderDetails from "Components/Common/Details/OrderDetailsModal";
import CompleteOrderForm from "Components/Common/Forms/CompleteOrderForm";
import { useTranslation } from "react-i18next";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const SendOrders = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.orders.pageTitle')
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [mainWarehouse, setMainWarehouse] = useState<string>('')
    const [modals, setModals] = useState({ create: false, details: false, completeOrder: false });
    const [selectedOrder, setSelectedOrder] = useState<any>({});

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columns: Column<any>[] = [
        { header: t('warehouse.orders.col.orderNumber'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('warehouse.orders.col.orderDate'), accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: t('warehouse.orders.col.orderFor'),
            accessor: 'orderOrigin',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.orderOrigin.name}</span>
        },
        {
            header: t('warehouse.orders.col.orderTo'),
            accessor: 'orderDestiny',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.orderDestiny.name}</span>
        },
        {
            header: t('warehouse.orders.col.orderedBy'),
            accessor: 'user',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.user.name} {row.user.lastname}</span>
        },
        {
            header: t('common.field.status'), accessor: 'status', isFilterable: true, render: (value: string) => (
                <Badge color={value === 'completed' ? "success" : "warning"}>
                    {t(`warehouse.orders.status.${value}`, { defaultValue: value })}
                </Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-2">
                    <div className="">
                        <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedOrder(row); toggleModal('details') }}>
                            <i className="ri-eye-fill align-middle" />
                        </Button>
                    </div>

                    {userLogged.role.includes('warehouse_manager') && (
                        <div className="">
                            <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedOrder(row); toggleModal('completeOrder') }} disabled={row.status === 'completed'}>
                                <i className=" ri-arrow-right-line align-middle" />
                            </Button>
                        </div>
                    )}
                </div>
            ),
        },

    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return

        try {
            setLoading(true)
            const farmResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${userLogged.farm_assigned}`)
            const mainWarehouse = farmResponse.data.data.main_warehouse
            setMainWarehouse(mainWarehouse)

            let query = '';
            userLogged.role.includes('warehouse_manager') ?
                query = `${configContext.apiUrl}/orders/find_by_origin/${mainWarehouse}`
                : query = `${configContext.apiUrl}/orders/find_by_destiny/${userLogged.assigment}`

            const response = await configContext.axiosHelper.get(query);
            setOrders(response.data.data);

        } catch (error) {
            logger.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.orders.error.fetch') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }


    return (
        <div className="page-content">
            <Container fluid>
                {userLogged && <BreadCrumb title={userLogged.role.includes('warehouse_manager') ? t('warehouse.orders.breadcrumb.received') : t('warehouse.orders.breadcrumb.sent')} pageTitle={t('warehouse.orders.breadcrumb.parent')} />}

                <Card>
                    {userLogged?.role.includes('subwarehouse_manager') && (
                        <CardHeader>
                            <div className="d-flex">
                                <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                    <i className="ri-add-line me-2" />
                                    {t('warehouse.orders.button.new')}
                                </Button>
                            </div>
                        </CardHeader>
                    )}
                    <CardBody className="d-flex flex-column flex-grow-1">
                        <CustomTable columns={columns} data={orders} showPagination={false} />
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('create')}>{t('warehouse.orders.modal.create')}</ModalHeader>
                <ModalBody>
                    <OrderForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('details')}>{t('warehouse.orders.modal.details')}</ModalHeader>
                <ModalBody>
                    <OrderDetails orderId={selectedOrder?._id} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.completeOrder} toggle={() => toggleModal("completeOrder")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('completeOrder')}>{t('warehouse.orders.modal.complete')}</ModalHeader>
                <ModalBody>
                    <CompleteOrderForm orderId={selectedOrder._id} onSave={() => { toggleModal('completeOrder'); fetchData(); }} onCancel={() => { toggleModal('completeOrder') }} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default SendOrders;
