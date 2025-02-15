import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SupplierForm from "Components/Common/SupplierForm";
import { SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'

const Suppliers = () => {
    document.title = 'Ver Proveedores | Almacén'
    const history = useNavigate();
    const configContext = useContext(ConfigContext)

    const [suppliersData, setSuppliersData] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | undefined>(undefined);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, delete: false, activate: false });
    const [loading, setLoading] = useState<boolean>(false)

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const supplierColumn = [
        { header: 'Código', accessor: 'id', isFilterable: true },
        { header: 'Proveedor', accessor: 'name', isFilterable: true },
        { header: 'Categoría', accessor: 'supplier_type', isFilterable: true, },
        { header: 'Telefono', accessor: 'phone_number' },
        { header: 'Dirección', accessor: 'address' },
        {
            header: "Estado", accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleSupplierDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => handleModalUpdateSupplier(row)}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    {row.status === true ? (
                        <Button className="farm-secondary-button btn-icon" disabled={!row.status} onClick={() => handleModalDeactivateSupplier(row)}>
                            <i className="ri-forbid-line align-middle" />
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleModalActivateSupplier(row)}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}

                </div>
            )
        }
    ]


    const fetchSuppliersData = async () => {
        setLoading(true)

        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/supplier`);
            setSuppliersData(response.data.data);
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };



    const handleSupplierDetails = (row: any) => {
        const id_supplier = row.id
        history(`/warehouse/suppliers/supplier_details/${id_supplier}`);
    }


    const handleModalUpdateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('update')
    }


    const handleModalDeactivateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('delete')
    }

    const handleModalActivateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('activate')
    }

    const handleCreateSupplier = async (data: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, data);
            showAlert('success', 'Proveedor registrado con éxito');
            fetchSuppliersData();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al registrar al proveedor, intentelo más tarde');
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateSupplier = async (data: SupplierData) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${data.id}`, data);
            fetchSuppliersData();
            showAlert('success', 'El proveedor ha sido actualizado con éxito');
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al actualizar al proveedor, intentelo más tarde');
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeactivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierId}`);
            fetchSuppliersData();
            showAlert('success', 'El proveedor se ha desactivado con éxito');
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al desactivar al proveedor, intentelo más tarde');
        } finally {
            toggleModal('delete', false);
        }
    };


    const handleActivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_supplier/${supplierId}`, {});
            fetchSuppliersData();
            showAlert('success', 'El proveedor se ha desactivado con éxito');
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al desactivar al proveedor, intentelo más tarde');
        } finally {
            toggleModal('activate', false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchSuppliersData();

        return () => {
            document.body.style.overflow = '';
        };
    }, [])


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
                <BreadCrumb pageTitle="Ver Proveedores" title="Proveedores" ></BreadCrumb>

                <Card className="rounded" style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Proveedores</h4>

                            <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-3" />
                                Agregar Proveedor
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        <CustomTable columns={supplierColumn} data={suppliersData} showSearchAndFilter={true} showPagination={false} />
                    </CardBody>
                </Card>

                {/* Modal Create */}
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('create')}>Nuevo Proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal('create', false)} isCodeDisabled={false}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Actualizar Proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierForm initialData={selectedSupplier} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal('update', false)} isCodeDisabled={true}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                    <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
                    <ModalBody>
                        {`¿Estás seguro de que deseas desactivar al proveedor "${selectedSupplier?.name}"?`}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleDeactivateSupplier(selectedSupplier.id);
                            }
                        }}
                        >
                            Eliminar
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Activate */}
                <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("activate")}>Activar Producto</ModalHeader>
                    <ModalBody>¿Desea activar el producto {selectedSupplier?.name}?</ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleActivateSupplier(selectedSupplier.id)
                            }
                        }}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

            </Container>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}


export default Suppliers;