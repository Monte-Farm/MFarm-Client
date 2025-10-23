import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import AlertMessage from "Components/Common/AlertMesagge";
import OutcomeForm from "Components/Common/OutcomeForm";
import { OutcomeData } from "common/data_interfaces";
import { getLoggedinUser } from "helpers/api_helper";


const ViewOutcomes = () => {
    document.title = 'Ver Salidas | Salidas'
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();

    const [outcomes, setOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(false)
    const [modals, setModals] = useState({ createOutcome: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const columns: Column<any>[] = [
        { header: 'Identificador', accessor: 'code', isFilterable: true, type: 'text' },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: 'Tipo de salida',
            accessor: 'outcomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = 'secondary';
                let text = 'N/A';

                switch (row.outcomeType) {
                    case "purchase": color = "success"; text = "Compra"; break;
                    case "donacion": color = "warning"; text = "Donacion"; break;
                    case "internal_transfer": color = "info"; text = "Transferencia interna"; break;
                    case "own_production": color = "secondary"; text = "Producción"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'Subalmacén de destino',
            accessor: 'warehouseDestiny',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.warehouseDestiny.name}</span>
        },
        {
            header: 'Acciones', accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => navigate(`/warehouse/outcomes/outcome_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle" />
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

    const handleFetchOutcomes = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true)

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${mainWarehouseId}`);
            setOutcomes(response.data.data);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrdio un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    useEffect(() => {
        handleFetchOutcomes();
    }, [mainWarehouseId])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Salidas"} pageTitle={"Salidas"} />

                <Card style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex ">
                            <h4>Salidas</h4>

                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('createOutcome')}>
                                <i className="ri-add-line me-2" />
                                Nueva Salida
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={outcomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {outcomes.length === 0 ? (
                            <>
                                <i className="ri-archive-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay salidas de inventario registradas</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={outcomes} showSearchAndFilter={true} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createOutcome} toggle={() => toggleModal("createOutcome")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createOutcome")}>Nueva salida</ModalHeader>
                <ModalBody>
                    <OutcomeForm onSave={() => { toggleModal('createOutcome'); handleFetchOutcomes(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewOutcomes;