import { ConfigContext } from "App";
import { SupplierData } from "common/data_interfaces";
import SupplierForm from "Components/Common/Forms/SupplierForm";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from "reactstrap";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import PurchaseOrderDetails from "./PurchaseOrderDetails";
import { getSupplierTypeLabel } from "common/enums/suppliers.enums";
import PDFViewer from "../Shared/PDFViewer";

interface SupplierDetailsModalProps {
    supplierId: string;
}

const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ supplierId }) => {
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
            header: 'Acciones',
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
            console.error("Error fetching data:", { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
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
            console.error('Error generating report:', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
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
                            Generando PDF
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            Ver PDF
                        </>
                    )}
                </Button>

                <Button className="farm-secondary-button" onClick={() => toggleModal("delete")} disabled={!supplierDetails?.status}>
                    <i className="ri-delete-bin-line me-3"></i>Desactivar Proveedor
                </Button>
                <Button className="farm-primary-button" onClick={() => toggleModal("update")}>
                    <i className="ri-pencil-line me-3"></i>Modificar Proveedor
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
                                <p className="text-muted mb-1 fs-6">Total Ordenes</p>
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
                                <p className="text-muted mb-1 fs-6">Pendientes</p>
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
                                <p className="text-muted mb-1 fs-6">Ingresadas</p>
                                <h4 className="mb-0">{completedOrders}</h4>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Información del proveedor */}
            <h6 className="text-muted text-uppercase mb-3">Información del proveedor</h6>
            <Card className="border shadow-sm mb-3">
                <CardBody className="p-0">
                    <Row className="g-0">
                        {[
                            { label: "Nombre", value: supplierDetails?.name || "—", icon: "ri-user-3-line" },
                            { label: "Teléfono", value: supplierDetails?.phone_number || "—", icon: "ri-phone-line" },
                            { label: "Correo", value: supplierDetails?.email || "—", icon: "ri-mail-line" },
                            { label: "Dirección", value: supplierDetails?.address || "—", icon: "ri-map-pin-line" },
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
                            { label: "Categoría", value: getSupplierTypeLabel(supplierDetails?.supplier_type || ""), icon: "ri-price-tag-3-line", badgeColor: "info" },
                            { label: "RNC", value: supplierDetails?.rnc || "—", icon: "ri-file-text-line" },
                            { label: "Estado", value: supplierDetails?.status ? "Activo" : "Inactivo", icon: "ri-checkbox-circle-line", badgeColor: supplierDetails?.status ? "success" : "danger" },
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
                Ordenes de compra ({totalOrders})
            </h6>
            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    {supplierPurchaseOrders && supplierPurchaseOrders.length > 0 ? (
                        <CustomTable columns={purchaseOrderColumns} data={supplierPurchaseOrders} fontSize={13} showSearchAndFilter={false} rowClickable={false} rowsPerPage={5} showPagination={true} />
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center text-muted py-5">
                            <i className="ri-shopping-cart-line mb-2" style={{ fontSize: '2.5rem' }}></i>
                            <span className="fs-6 fst-italic">Sin ordenes de compra registradas</span>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Modales */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Modificar Proveedor</ModalHeader>
                <ModalBody>
                    <SupplierForm initialData={supplierDetails} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Proveedor</ModalHeader>
                <ModalBody>¿Desea desactivar este proveedor?</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                    <Button color="success" onClick={() => handleDeleteSupplier(supplierDetails!)}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.updateSuccess} onClose={() => { toggleModal('updateSuccess'); handleGetSupplierDetails(); }} message={"Proveedor actualizado con exito"} />
            <SuccessModal isOpen={modals.deleteSuccess} onClose={() => { toggleModal('deleteSuccess'); handleGetSupplierDetails(); }} message={"Proveedor desactivado con exito"} />
            <ErrorModal isOpen={modals.updateError} onClose={() => { toggleModal('updateError') }} message={"Ha ocurrido un error al actualizar el proveedor, intentelo mas tarde"} />
            <ErrorModal isOpen={modals.deleteError} onClose={() => { toggleModal('deleteError') }} message={"Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde"} />

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Proveedor</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.purchaseOrderDetails} toggle={() => toggleModal("purchaseOrderDetails")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("purchaseOrderDetails")}>Detalles de orden de compra</ModalHeader>
                <ModalBody>
                    <PurchaseOrderDetails purchaseId={selectedPurchaseOrder} />
                </ModalBody>
            </Modal>
        </div>
    );
};

export default SupplierDetailsModal;
