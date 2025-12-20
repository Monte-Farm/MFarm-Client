import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import { Column } from "common/data/data_types"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import { getLoggedinUser } from "helpers/api_helper"
import IncomeForm from "Components/Common/Forms/IncomeForm"
import CustomTable from "Components/Common/Tables/CustomTable"
import IncomeDetails from "Components/Common/Details/IncomeDetailsModal"


const ViewIncomes = () => {
    document.title = 'Ver Entradas | Almacén'
    const navigate = useNavigate()
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incomes, setIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ createIncome: false, details: false });
    const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
    const [selectedIncome, setSelectedIncome] = useState<any>({});

    const columns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        {
            header: 'Proveedor',
            accessor: 'originName',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row.origin.id.name}</span>
        },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: 'Tipo de entrada',
            accessor: 'incomeType',
            isFilterable: true,
            type: 'text',
            render: (_, row) => {
                let color = 'secondary';
                let text = 'N/A';

                switch (row.incomeType) {
                    case "purchase": color = "success"; text = "Compra"; break;
                    case "donacion": color = "warning"; text = "Donacion"; break;
                    case "internal_transfer": color = "info"; text = "Transferencia interna"; break;
                    case "own_production": color = "secondary"; text = "Producción"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: 'Precio Total', accessor: 'totalPrice', type: 'currency' },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchWarehouseId = async () => {
        if (!configContext || !userLogged) return;
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
            setMainWarehouseId(response.data.data)
        } catch (error) {
            console.error('Error fetching main warehouse ID:', error);
        }
    }

    const handleFetchIncomes = async () => {
        if (!configContext || !mainWarehouseId) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${mainWarehouseId}`);
            const incomesData = response.data.data;
            setIncomes(incomesData);
        } catch (error) {
            console.error('Error fetching data: ', { error })
            setAlertConfig({ visible: false, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        fetchWarehouseId();
    }, []);

    useEffect(() => {
        handleFetchIncomes();
    }, [mainWarehouseId])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Entradas"} pageTitle={"Entradas"} />

                <Card style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Entradas</h4>
                            <Button className="farm-primary-button" onClick={() => toggleModal('createIncome')}>
                                <i className="ri-add-line me-3" />
                                Nueva Entrada
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={incomes.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {incomes.length === 0 ? (
                            <>
                                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={incomes} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.createIncome} toggle={() => toggleModal("createIncome")} backdrop='static' modalClassName="modal-xxl" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createIncome")}>Nueva entrada</ModalHeader>
                <ModalBody>
                    <IncomeForm onSave={() => { toggleModal('createIncome'); handleFetchIncomes() }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' modalClassName="modal-xxl" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}>Detalles de entrada</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome?._id} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewIncomes;