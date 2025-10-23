import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SupplierForm from "Components/Common/SupplierForm";
import { SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import AlertMessage from "Components/Common/AlertMesagge";

const Suppliers = () => {
    document.title = 'Ver Proveedores | Almacén'
    const history = useNavigate();
    const configContext = useContext(ConfigContext)

    const [suppliersData, setSuppliersData] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | undefined>(undefined);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, delete: false, activate: false });
    const [loading, setLoading] = useState<boolean>(false)

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const supplierColumn: Column<any>[] = [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Proveedor', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Categoría', accessor: 'supplier_type', isFilterable: true, type: 'text' },
        { header: 'Telefono', accessor: 'phone_number', type: 'text' },
        { header: 'Dirección', accessor: 'address', type: 'text' },
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
            console.error('Error fetching suppliers data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos de los proveedores.' });
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
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor registrado con éxito' })
            fetchSuppliersData();
        } catch (error) {
            console.error('Error creating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear al proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateSupplier = async (data: SupplierData) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${data.id}`, data);
            fetchSuppliersData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor actualizado con éxito' })
        } catch (error) {
            console.error('Error updating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeactivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierId}`);
            fetchSuppliersData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor desactivado con éxito' })
        } catch (error) {
            console.error('Error deactivating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('delete', false);
        }
    };


    const handleActivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_supplier/${supplierId}`, {});
            fetchSuppliersData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor sactivado con éxito' })
        } catch (error) {
            console.error('Error activating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('activate', false);
        }
    };

    useEffect(() => {
        fetchSuppliersData();
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
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

                    <CardBody
                        className={
                            suppliersData.length === 0
                                ? "d-flex flex-column justify-content-center align-items-center text-center"
                                : "d-flex flex-column flex-grow-1"
                        }
                        style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}
                    >
                        {suppliersData.length === 0 ? (
                            <>
                                <i className="ri-truck-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay proveedores registrados</span>
                            </>
                        ) : (
                            <CustomTable
                                columns={supplierColumn}
                                data={suppliersData}
                                showSearchAndFilter={true}
                                showPagination={false}
                            />
                        )}
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

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}


export default Suppliers;