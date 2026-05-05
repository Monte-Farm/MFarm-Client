import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { SupplierData } from "common/data_interfaces";
import SupplierForm from "Components/Common/Forms/SupplierForm";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import PurchaseOrderDetails from "./PurchaseOrderDetails";
import PDFViewer from "../Shared/PDFViewer";

interface SupplierDetailsModalProps {
    supplierId: string;
}

const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ supplierId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext)
    const [supplierDetails, setSupplierDetails] = useState<SupplierData | undefined>(undefined);
    const [supplierPurchaseOrders, setSupplierPurchaseOrders] = useState<any[]>();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ update: false, delete: false, updateSuccess: false, updateError: false, deleteSuccess: false, deleteError: false, purchaseOrderDetails: false, viewPDF: false });
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<string>('');
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const purchaseOrderColumns: Column<any>[] = [
        { header: t('warehouse.orders.col.orderNumber', { defaultValue: 'No. de Orden' }), accessor: "code", isFilterable: true, type: 'text' },
        { header: t('common.field.date'), accessor: "date", isFilterable: true, type: 'date' },
        {
            header: t('warehouse.suppliers.col.products', { defaultValue: 'Productos' }),
            accessor: 'products',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row.products.length}</span>
        },
        {
            header: t('common.field.status'),
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
            header: t('common.field.actions'),
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedPurchaseOrder(row._id); toggleModal('purchaseOrderDetails') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div >
            )
        }
    ];


    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleGetSupplierDetails = async () => {
        if (!configContext) return;

        try {
            setLoading(true)
            const supplierResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/find_supplier_id/${supplierId}`);
            setSupplierDetails(supplierResponse.data.data);

            const purchaseOrderResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/purchase_orders/find_purchase_order_supplier/${supplierId}`);
            setSupplierPurchaseOrders(purchaseOrderResponse.data.data);
        } catch (error) {
            logger.error("Error fetching data:", { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.fetch', { defaultValue: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' }) })
        } finally {
            setLoading(false)
        }
    };

    const handleUpdateSupplier = async (supplierData: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${supplierData.id}`, supplierData);
            toggleModal('updateSuccess')
        } catch (error) {
            toggleModal('updateError')
        } finally {
            toggleModal("update", false);
        }
    };

    const handleDeleteSupplier = async (supplierData: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierData.id}`);
            toggleModal('deleteSuccess')
        } catch (error) {
            toggleModal('deleteError')
        } finally {
            toggleModal("delete", false);
        }
    };

    const handleGenerateReport = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/suppliers/${supplierId}`);
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating report:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.fetch', { defaultValue: 'Error al generar el PDF, intentelo más tarde' }) });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        handleGetSupplierDetails();
    }, []);


    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    const totalOrders = supplierPurchaseOrders?.length || 0;
    const pendingOrders = supplierPurchaseOrders?.filter(o => o.status === true).length || 0;
    const completedOrders = totalOrders - pendingOrders;

    return (
        <div>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                <Button
                    color="primary"
                    onClick={handleGenerateReport}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('common.button.generating', { defaultValue: 'Generando PDF' })}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            {t('common.button.exportPdf', { defaultValue: 'Ver PDF' })}
                        </>
                    )}
                </Button>

                <Button className="farm-secondary-button" onClick={() => toggleModal("delete")} disabled={!supplierDetails?.status}>
                    <i className="ri-delete-bin-line me-3"></i>{t('warehouse.suppliers.action.deactivate', { defaultValue: 'Desactivar Proveedor' })}
                </Button>
                <Button className="farm-primary-button" onClick={() => toggleModal("update")}>
                    <i className="ri-pencil-line me-3"></i>{t('warehouse.suppliers.action.modify', { defaultValue: 'Modificar Proveedor' })}
                </Button>
            </div>

            {/* Stat cards */}
            <Row className="mb-3">
                <Col md={4}>
                    <Card className="card-animate border-0 shadow-sm">
                        <CardBody className="d-flex align-items-center gap-3">
                            <div className="avatar-sm flex-shrink-0">
                                <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-4">
                                    <i className="ri-shopping-cart-line"></i>
                                </span>
                            </div>
                            <div>
                                <p className="text-muted mb-1 fs-6">{t('warehouse.suppliers.stat.totalOrders', { defaultValue: 'Total Ordenes' })}</p>
                                <h4 className="mb-0">{totalOrders}</h4>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="card-animate border-0 shadow-sm">
                        <CardBody className="d-flex align-items-center gap-3">
                            <div className="avatar-sm flex-shrink-0">
                                <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-4">
                                    <i className="ri-time-line"></i>
                                </span>
                            </div>
                            <div>
                                <p className="text-muted mb-1 fs-6">{t('warehouse.common.orderStatus.pending', { defaultValue: 'Pendientes' })}</p>
                                <h4 className="mb-0">{pendingOrders}</h4>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="card-animate border-0 shadow-sm">
                        <CardBody className="d-flex align-items-center gap-3">
                            <div className="avatar-sm flex-shrink-0">
                                <span className="avatar-title bg-success-subtle text-success rounded-circle fs-4">
                                    <i className="ri-check-double-line"></i>
                                </span>
                            </div>
                            <div>
                                <p className="text-muted mb-1 fs-6">{t('warehouse.suppliers.stat.entered', { defaultValue: 'Ingresadas' })}</p>
                                <h4 className="mb-0">{completedOrders}</h4>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Información del proveedor */}
            <h6 className="text-muted text-uppercase mb-3">{t('warehouse.suppliers.section.supplierInfo', { defaultValue: 'Información del proveedor' })}</h6>
            <Card className="border shadow-sm mb-3">
                <CardBody className="p-0">
                    <Row className="g-0">
                        {[
                            { label: t('common.field.name'), value: supplierDetails?.name || "—", icon: "ri-user-3-line" },
                            { label: t('warehouse.supplierForm.field.phone', { defaultValue: 'Teléfono' }), value: supplierDetails?.phone_number || "—", icon: "ri-phone-line" },
                            { label: t('warehouse.supplierForm.field.email', { defaultValue: 'Email' }), value: supplierDetails?.email || "—", icon: "ri-mail-line" },
                            { label: t('warehouse.supplierForm.field.address', { defaultValue: 'Dirección' }), value: supplierDetails?.address || "—", icon: "ri-map-pin-line" },
                        ].map((item, i) => (
                            <Col xs={12} sm={6} lg={3} key={i} className={i < 3 ? "border-end" : ""}>
                                <div className="p-3">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <i className={`${item.icon} text-muted`}></i>
                                        <span className="text-muted" style={{ fontSize: "13px" }}>{item.label}</span>
                                    </div>
                                    <span className="fw-semibold">{item.value}</span>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </CardBody>
            </Card>

            <Card className="border shadow-sm mb-4">
                <CardBody className="p-0">
                    <Row className="g-0">
                        {[
                            { label: t('warehouse.suppliers.attr.supplierType', { defaultValue: 'Categoría' }), value: t(`warehouse.common.supplierType.${supplierDetails?.supplier_type || ''}`, { defaultValue: supplierDetails?.supplier_type || '' }), icon: "ri-price-tag-3-line", badgeColor: "info" },
                            { label: t('warehouse.supplierForm.field.rnc', { defaultValue: 'RNC' }), value: supplierDetails?.rnc || "—", icon: "ri-file-text-line" },
                            { label: t('common.field.status'), value: supplierDetails?.status ? t('common.status.active') : t('common.status.inactive'), icon: "ri-checkbox-circle-line", badgeColor: supplierDetails?.status ? "success" : "danger" },
                        ].map((item: any, i: number) => (
                            <Col xs={12} sm={6} lg={4} key={i} className={i < 2 ? "border-end" : ""}>
                                <div className="p-3">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <i className={`${item.icon} text-muted`}></i>
                                        <span className="text-muted" style={{ fontSize: "13px" }}>{item.label}</span>
                                    </div>
                                    {item.badgeColor ? (
                                        <Badge color={item.badgeColor}>{item.value}</Badge>
                                    ) : (
                                        <span className="fw-semibold">{item.value}</span>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                </CardBody>
            </Card>

            {/* Ordenes de compra */}
            <h6 className="text-muted text-uppercase mb-3">
                {t('warehouse.suppliers.section.purchaseOrders', { defaultValue: 'Ordenes de compra' })} ({totalOrders})
            </h6>
            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    {supplierPurchaseOrders && supplierPurchaseOrders.length > 0 ? (
                        <CustomTable columns={purchaseOrderColumns} data={supplierPurchaseOrders} fontSize={13} showSearchAndFilter={false} rowClickable={false} rowsPerPage={5} showPagination={true} />
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center text-muted py-5">
                            <i className="ri-shopping-cart-line mb-2" style={{ fontSize: '2.5rem' }}></i>
                            <span className="fs-6 fst-italic">{t('warehouse.suppliers.emptyPurchaseOrders', { defaultValue: 'Sin ordenes de compra registradas' })}</span>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modales */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>{t('warehouse.suppliers.action.modify', { defaultValue: 'Modificar Proveedor' })}</ModalHeader>
                <ModalBody>
                    <SupplierForm initialData={supplierDetails} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>{t('warehouse.suppliers.action.deactivate', { defaultValue: 'Desactivar Proveedor' })}</ModalHeader>
                <ModalBody>{t('warehouse.suppliers.confirm.deactivate', { defaultValue: '¿Desea desactivar este proveedor?' })}</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => toggleModal("delete", false)}>{t('common.button.cancel')}</Button>
                    <Button color="success" onClick={() => handleDeleteSupplier(supplierDetails!)}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.updateSuccess} onClose={() => { toggleModal('updateSuccess'); handleGetSupplierDetails(); }} message={t('warehouse.suppliers.success.updated', { defaultValue: 'Proveedor actualizado con exito' })} />
            <SuccessModal isOpen={modals.deleteSuccess} onClose={() => { toggleModal('deleteSuccess'); handleGetSupplierDetails(); }} message={t('warehouse.suppliers.success.deactivated', { defaultValue: 'Proveedor desactivado con exito' })} />
            <ErrorModal isOpen={modals.updateError} onClose={() => { toggleModal('updateError') }} message={t('warehouse.suppliers.error.update', { defaultValue: 'Ha ocurrido un error al actualizar el proveedor, intentelo mas tarde' })} />
            <ErrorModal isOpen={modals.deleteError} onClose={() => { toggleModal('deleteError') }} message={t('warehouse.suppliers.error.deactivate', { defaultValue: 'Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde' })} />

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.suppliers.modal.report', { defaultValue: 'Reporte de Proveedor' })}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.purchaseOrderDetails} toggle={() => toggleModal("purchaseOrderDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("purchaseOrderDetails")}>{t('warehouse.purchaseOrders.modal.details', { defaultValue: 'Detalles de orden de compra' })}</ModalHeader>
                <ModalBody>
                    <PurchaseOrderDetails purchaseId={selectedPurchaseOrder} />
                </ModalBody>
            </Modal>
        </div>
    );
};

export default SupplierDetailsModal;
