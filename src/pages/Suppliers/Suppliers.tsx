import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { APIClient } from "helpers/api_helper";
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { SupplierData } from "./SupplierDetails";
import { size } from "lodash";
import SupplierForm from "Components/Common/SupplierForm";



const Suppliers = () => {
    document.title = 'View Suppliers | Warehouse'
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate();


    const [suppliersData, setSuppliersData] = useState([]);
    const [isError, setIsError] = useState<boolean>(false);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | undefined>(undefined);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, delete: false });

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
        {
            header: 'Código',
            accessor: 'id',
            isFilterable: true
        },
        {
            header: 'Proveedor',
            accessor: 'name',
            isFilterable: true
        },
        {
            header: 'Categoría',
            accessor: 'supplier_type',
            isFilterable: true,
            options: [
                { label: 'Alimentos', value: 'Alimentos' },
                { label: 'Medicamentos', value: 'Medicamentos' },
                { label: 'Suministros', value: 'Suministros' },
                { label: 'Equipamiento', value: 'Equipamientos' }
            ]
        },
        {
            header: 'Telefono',
            accessor: 'phone_number'
        },
        {
            header: 'Dirección',
            accessor: 'address'
        },
        {
            header: "Estado",
            accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
            isFilterable: true,
            options: [
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' }
            ]
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-secondary btn-icon" onClick={() => handleSupplierDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    <Button className="btn-secondary btn-icon" disabled={!row.status} onClick={() => handleModalUpdateSupplier(row)}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    <Button className="btn-danger btn-icon" disabled={!row.status} onClick={() => handleModalDeactivateSupplier(row)}>
                        <i className="ri-delete-bin-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const fetchSuppliersData = async () => {
        await axiosHelper.get(`${apiUrl}/supplier`)
            .then((response) => {
                setSuppliersData(response.data.data);
            })
            .catch((error) => {
                handleError(error, 'El servicio no esta disponible, intentelo más tarde')
            })
    }


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

    const handleCreateSupplier = async (data: SupplierData) => {
        await axiosHelper.create(`${apiUrl}/supplier/create_supplier`, data)
            .then(() => {
                showAlert('success', 'Proveedor registrado con éxito')
                fetchSuppliersData()
                toggleModal('create', false)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al registrar al proveedor, intentelo más tarde');
            })
    }

    const handleUpdateSupplier = async (data: SupplierData) => {
        await axiosHelper.put(`${apiUrl}/supplier/update_supplier/${data.id}`, data)
            .then((response) => {
                fetchSuppliersData();
                toggleModal('update', false);
                showAlert('success', 'El proveedor ha sido actualizado con éxito')
            })
            .catch((error) => {
                toggleModal('update', false)
                handleError(error, 'Ha ocurrido un error al actualizar al proveedor, intentelo más tarde')
            })
    }

    const handleDeactivateSupplier = async (supplierId: string) => {
        await axiosHelper.delete(`${apiUrl}/supplier/delete_supplier/${supplierId}`)
            .then(() => {
                fetchSuppliersData();
                toggleModal('delete', false);
                showAlert('success', 'El proveedor se ha desactivado con éxito')
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al desactivar al proveedor, intentelo más tarde')
                toggleModal('delete', false)
            })
    }

    useEffect(() => {
        fetchSuppliersData();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb pageTitle="Suppliers" title="View Suppliers" ></BreadCrumb>

                <Card className="rounded" style={{height: '75vh'}}>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Proveedores</h4>

                            <Button color="success" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-3" />
                                Agregar Proveedor
                            </Button>
                        </div>

                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={supplierColumn} data={suppliersData} showSearchAndFilter={true} defaultFilterField='name' />
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
                        <Button color="danger" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                        <Button color="success" onClick={() => {
                            if (selectedSupplier) {
                                handleDeactivateSupplier(selectedSupplier.id);
                            }
                        }}
                        >
                            Eliminar
                        </Button>
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