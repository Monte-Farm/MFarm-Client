import { ConfigContext } from "App";
import { SubwarehouseData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import SubwarehouseForm from "Components/Common/Forms/SubwarehouseForm";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";


const ViewSubwarehouse = () => {
    document.title = "Ver Subalmacénes | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false });
    const [warehouses, setWarehouses] = useState([])
    const [selectedSubwarehouse, setSelectedSubwarehouse] = useState<SubwarehouseData>()
    const [loading, setLoading] = useState<boolean>(false);
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columns: Column<any>[] = [
        { header: 'Código', accessor: 'code', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Responsable', accessor: 'manager', isFilterable: true, type: 'text' },
        { header: 'Ubicación', accessor: 'location', isFilterable: true, type: 'text' },
        {
            header: "Estado",
            accessor: "status",
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
                    <Button className="farm-primary-button btn-icon" onClick={() => history(`/subwarehouse/subwarehouse_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => { setSelectedSubwarehouse(row); toggleModal('update'); }}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            setMainWarehouseId(response.data.data)
        } catch (error) {
            console.error('Error fetching main warehouse ID:', error);
        }
    }

    const handleFetchSubwarehouses = async () => {
        setLoading(true)

        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/`);
            const warehouses = response.data.data;
            setWarehouses(warehouses.filter(function (obj: any) {
                return obj._id !== mainWarehouseId;
            }));
        } catch (error) {
            console.error('Error fetching subwarehouses:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos de los subalmacenes.' });
        } finally {
            setLoading(false)
        }
    };

    const handleCreateSubwarehouse = async (data: SubwarehouseData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/warehouse/create_warehouse`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Subalmacén creado con éxito' });
            handleFetchSubwarehouses();
        } catch (error) {
            console.error('Error creating subwarehouse:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear el subalmacen, intentelo mas tarde' });
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateSubwarehouse = async (data: any) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/warehouse/update_warehouse/${data._id}`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Subalmacén actualizado con éxito' });
            handleFetchSubwarehouses();
        } catch (error) {
            console.error('Error updating subwarehouse:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el subalmacen, intentelo mas tarde' });
        } finally {
            toggleModal('update', false);
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    useEffect(() => {
        if (!userLogged) return;

        if (userLogged.role === 'subwarehouse_manager') {
            history(`/subwarehouse/subwarehouse_details/${userLogged.assigment}`);
        } else {
            handleFetchSubwarehouses();
        }
    }, [mainWarehouseId]);


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Subalmacénes"} pageTitle={"Ver Subalmacénes"}></BreadCrumb>


                <Card style={{ minHeight: "calc(100vh - 220px)" }}>
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Agregar Subalmacén
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={warehouses.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {warehouses.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={warehouses} showPagination={false} />
                        )}
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

            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSubwarehouse;