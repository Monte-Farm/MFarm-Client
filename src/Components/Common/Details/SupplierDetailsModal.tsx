import { ConfigContext } from "App";
import { Attribute, SupplierData } from "common/data_interfaces";
import SupplierForm from "Components/Common/Forms/SupplierForm";
import { useContext, useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import AlertMessage from "../Shared/AlertMesagge";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import PurchaseOrderDetails from "./PurchaseOrderDetails";

interface SupplierDetailsModalProps {
    supplierId: string;
}

const SupplierDetailsModal: React.FC<SupplierDetailsModalProps> = ({ supplierId }) => {
    const configContext = useContext(ConfigContext)
    const [supplierDetails, setSupplierDetails] = useState<SupplierData | undefined>(undefined);
    const [supplierPurchaseOrders, setSupplierPurchaseOrders] = useState<any[]>();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ update: false, delete: false, updateSuccess: false, updateError: false, deleteSuccess: false, deleteError: false, purchaseOrderDetails: false });
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<string>('');

    const supplierAttributes: Attribute[] = [
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'phone_number', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Correo', type: 'text' },
        { key: 'address', label: 'Dirección', type: 'text' },
        { key: 'supplier_type', label: 'Categoría', type: 'text' },
        { key: 'rnc', label: 'RNC', type: 'text' },
        { key: 'status', label: 'Estado', type: 'status' }
    ];

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

    useEffect(() => {
        handleGetSupplierDetails();
    }, []);


    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    return (
        <div>
            <div className="d-flex gap-2 mb-3 justify-content-end">
                <Button className="farm-secondary-button" onClick={() => toggleModal("delete")} disabled={!supplierDetails?.status}>
                    <i className="ri-delete-bin-line me-3"></i>Desactivar Proveedor
                </Button>
                <Button className="farm-primary-button" onClick={() => toggleModal("update")}>
                    <i className="ri-pencil-line me-3"></i>Modificar Proveedor
                </Button>

            </div>

            <div className="d-flex gap-3 w-100">

                <Card className="h-100 w-100">
                    <CardHeader className='bg-gradient bg-primary-subtle'>
                        <h4 className="mb-0 text-primary">Información del proveedor</h4>
                    </CardHeader>
                    <CardBody style={{ overflowX: 'auto' }}>
                        <ObjectDetails attributes={supplierAttributes} object={supplierDetails || {}} />
                    </CardBody>
                </Card>


                <Card className="h-100 w-100">
                    <CardHeader className='bg-gradient bg-info-subtle'>
                        <h4 className="mb-0 text-info">Ordenes de compra</h4>
                    </CardHeader>
                    <CardBody className="p-0">
                        {supplierPurchaseOrders && (
                            <CustomTable columns={purchaseOrderColumns} data={supplierPurchaseOrders} showSearchAndFilter={false} rowClickable={false} rowsPerPage={5} showPagination={true} />
                        )}
                    </CardBody>
                </Card>
            </div>

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
