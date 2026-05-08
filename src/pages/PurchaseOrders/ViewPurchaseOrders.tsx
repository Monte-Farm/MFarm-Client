import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { Column } from "common/data/data_types";
import PurchaseOrderForm from "Components/Common/Forms/PurchaseOrderForm";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getEffectiveUser } from "helpers/impersonation_helper";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import PurchaseOrderDetails from "Components/Common/Details/PurchaseOrderDetails";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewPurchaseOrders = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.purchaseOrders.pageTitle', { defaultValue: 'Ver Ordenes de compra' }) + ' | ' + t('warehouse.purchaseOrders.breadcrumb', { defaultValue: 'Ordenes de compra' });

    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ createPurchaseOrder: false, purchaseOrderDetails: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
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
        { header: t('warehouse.purchaseOrders.col.orderNumber', { defaultValue: 'No. de Orden' }), accessor: "code", isFilterable: true, type: 'text' },
        { header: t('common.field.date', { defaultValue: 'Fecha' }), accessor: "date", isFilterable: true, type: 'date' },
        {
            header: t('warehouse.purchaseOrders.col.products', { defaultValue: 'Productos' }),
            accessor: 'products',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row.products.length}</span>
        },
        {
            header: t('warehouse.suppliers.col.supplier', { defaultValue: 'Proveedor' }),
            accessor: 'supplier',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span className="text-black">{row.supplier.name}</span>
        },
        {
            header: t('common.field.status', { defaultValue: 'Estado' }),
            accessor: 'status',
            isFilterable: false,
            type: 'text',
            render: (_, row) => (
                <span
                    className={`badge ${row.status ? 'bg-warning text-dark' : 'bg-success'}`}
                >
                    {t(`warehouse.purchaseOrders.status.${row.status ? 'not_entered' : 'entered'}`, { defaultValue: row.status ? 'No ingresada' : 'Ingresada' })}
                </span>
            )
        },
        {
            header: t('common.field.actions', { defaultValue: 'Acciones' }),
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
            logger.error('Error fetching main warehouse ID:', error);
        }
    }

    const fetchPurchaseOrdersData = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_warehouse/${mainWarehouseId}`);
            setPurchaseOrders(response.data.data);
        } catch (error) {
            logger.error('El servicio no esta disponible, intentelo mas tarde', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.purchaseOrders.error.fetch', { defaultValue: 'Ha ocurrido un error al obtener los datos intentelo, mas tarde' }) })
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/purchase_orders/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.purchaseOrders.error.generatePdf', { defaultValue: 'Error al generar el PDF, intentelo más tarde' }) });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchPurchaseStatistics = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/purchase_statistics/${mainWarehouseId}`);
            setPurchaseStatistics(response.data.data.statistics);
        } catch (error) {
            logger.error('Error fetching purchase statistics:', error);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
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
                <BreadCrumb title={t('warehouse.purchaseOrders.pageTitle', { defaultValue: 'Ver Ordenes de Compra' })} pageTitle={t('warehouse.purchaseOrders.breadcrumb', { defaultValue: 'Ordenes de Compra' })} />

                {/* KPIs Section */}
                <div className="row g-3 mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.purchaseOrders.kpi.total', { defaultValue: 'Total de Órdenes del Mes' })}
                            value={purchaseStatistics.totalOrders}
                            icon={<i className="ri-file-list-3-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.purchaseOrders.kpi.totalProducts', { defaultValue: 'Total de Unidades Solicitados' })}
                            value={purchaseStatistics.totalProductsRequested}
                            icon={<i className="ri-shopping-bag-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.purchaseOrders.kpi.pending', { defaultValue: 'Órdenes Pendientes' })}
                            value={purchaseStatistics.pendingOrders}
                            icon={<i className="ri-time-line fs-20 text-warning"></i>}
                            iconBgColor="#FFF3E0"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.purchaseOrders.kpi.avgProducts', { defaultValue: 'Promedio de Unidades por Orden' })}
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
                            <h4 className="m-2">{t('warehouse.purchaseOrders.breadcrumb', { defaultValue: 'Órdenes de Compra' })}</h4>
                            <div className="d-flex gap-2">
                                <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                    {pdfLoading ? (
                                        <><Spinner className="me-2" size="sm" />{t('common.button.generating', { defaultValue: 'Generando...' })}</>
                                    ) : (
                                        <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf', { defaultValue: 'Exportar PDF' })}</>
                                    )}
                                </Button>
                                <Button className="farm-primary-button" onClick={() => toggleModal('createPurchaseOrder')}>
                                    <i className="ri-add-line pe-2" />
                                    {t('warehouse.purchaseOrders.button.new')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className={purchaseOrders.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {purchaseOrders.length === 0 ? (
                            <>
                                <i className="ri-file-list-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.purchaseOrders.empty')}</span>
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

            <Modal size="xl" isOpen={modals.createPurchaseOrder} toggle={() => toggleModal("createPurchaseOrder")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("createPurchaseOrder")}>{t('warehouse.purchaseOrders.modal.new')}</ModalHeader>
                <ModalBody>
                    <PurchaseOrderForm onSave={() => { toggleModal('createPurchaseOrder'); fetchPurchaseOrdersData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.purchaseOrderDetails} toggle={() => toggleModal("purchaseOrderDetails")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("purchaseOrderDetails")}>{t('warehouse.purchaseOrders.modal.details')}</ModalHeader>
                <ModalBody>
                    <PurchaseOrderDetails purchaseId={selectedPurchaseOrder} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('warehouse.purchaseOrders.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('warehouse.purchaseOrders.modal.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.purchaseOrders.modal.report', { defaultValue: 'Reporte de Órdenes de Compra' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}


export default ViewPurchaseOrders
