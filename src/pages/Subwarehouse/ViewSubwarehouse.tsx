import { ConfigContext } from "App";
import { SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import SubwarehouseForm from "Components/Common/SubwarehouseForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'


const ViewSubwarehouse = () => {
    document.title = "Ver Subalmacénes"
    const history = useNavigate();
    const warehouseId = 'AG001'
    const configContext = useContext(ConfigContext)

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false });
    const [warehouses, setWarehouses] = useState([])
    const [selectedSubwarehouse, setSelectedSubwarehouse] = useState<SubwarehouseData>()
    const [loading, setLoading] = useState<boolean>(false);


    const columns = [
        { header: 'Código', accessor: 'id', isFilterable: true },
        { header: 'Nombre', accessor: 'name', isFilterable: true },
        { header: 'Responsable', accessor: 'manager', isFilterable: true },
        { header: 'Ubicación', accessor: 'location', isFilterable: true },
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
                    <Button className="farm-primary-button btn-icon" onClick={() => toggleModalDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => toggleModalUpdate(row)}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    <Button className="farm-secondary-button btn-icon" disabled={!row.status} onClick={() => toggleModalDelete(row)}>
                        <i className="ri-delete-bin-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

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

    const toggleModalDetails = (data: SubwarehouseData) => {
        history(`/subwarehouse/subwarehouse_details/${data.id}`);
    }

    const toggleModalUpdate = (row: any) => {
        setSelectedSubwarehouse(row)
        toggleModal('update')
    }

    const toggleModalDelete = (row: any) => {
        setSelectedSubwarehouse(row)
        toggleModal('delete')
    }


    const handleFetchSubwarehouses = async () => {
        setLoading(true)

        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/`);
            const warehouses = response.data.data;
            setWarehouses(warehouses.filter(function (obj: any) {
                return obj.id !== warehouseId;
            }));
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };


    const handleCreateSubwarehouse = async (data: SubwarehouseData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/warehouse/create_warehouse`, data);
            showAlert('success', 'Subalmacén agregado con éxito');
            handleFetchSubwarehouses();
        } catch (error) {
            handleError(error, 'Ha ocurrido un error agregando el subalmacén, intentelo más tarde');
        } finally {
            toggleModal('create', false);
        }
    };


    const handleUpdateSubwarehouse = async (data: SubwarehouseData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/warehouse/update_warehouse/${data.id}`, data);
            showAlert('success', 'Subalmacén actualizado con éxito');
            handleFetchSubwarehouses();
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeleteSubwarehouse = async (subwarehouse_id: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/warehouse/delete_warehouse/${subwarehouse_id}`);
            showAlert('success', 'Subalmacén desactivado con éxito');
            handleFetchSubwarehouses();
        } catch (error) {
            handleError(error, 'El servicio no esta disponible, intentelo más tarde');
        } finally {
            toggleModal('delete', false);
        }
    };

    useEffect(() => {
        if (!configContext?.userLogged) return;

        if (configContext.userLogged.role === 'Encargado de subalmacen') {
            history(`/subwarehouse/subwarehouse_details/${configContext.userLogged.assigment}`);
        } else {
            handleFetchSubwarehouses();
        }
    }, [configContext?.userLogged]);

    
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
                <BreadCrumb title={"Subalmacénes"} pageTitle={"Ver Subalmacénes"}></BreadCrumb>


                <Card style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Agregar Subalmacén
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={warehouses}></CustomTable>
                    </CardBody>
                </Card>

                {/* Modal Create */}
                <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("create")}>Agregar Subalmacén</ModalHeader>
                    <ModalBody>
                        <SubwarehouseForm onSubmit={handleCreateSubwarehouse} onCancel={() => toggleModal("create", false)} />
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("update")}>Modificar Subalmacén</ModalHeader>
                    <ModalBody>
                        <SubwarehouseForm initialData={selectedSubwarehouse} onSubmit={handleUpdateSubwarehouse} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                    </ModalBody>
                </Modal>

                {/* Modal Delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Proveedor</ModalHeader>
                    <ModalBody>¿Desea desactivar el subalmacén {selectedSubwarehouse?.id}?</ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSubwarehouse) {
                                handleDeleteSubwarehouse(selectedSubwarehouse.id)
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

export default ViewSubwarehouse;