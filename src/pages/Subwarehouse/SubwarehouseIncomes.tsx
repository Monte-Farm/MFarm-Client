import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Card, CardHeader, CardBody, Row, Col, Modal, ModalHeader, ModalBody } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import IncomeDetails from "Components/Common/Details/IncomeDetailsModal";

const SubwarehouseIncomes = () => {
    document.title = "Entradas de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ details: false });
    const [selectedIncome, setSelectedIncome] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const incomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true, type: 'date' },
        {
            header: 'Origen',
            accessor: 'originName',
            isFilterable: true,
            type: 'text',
            render: (_, row) => <span>{row?.origin?.originType}</span>
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedIncome(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleFetchWarehouseIncomes = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${userLogged.assigment}`);
            setSubwarehouseIncomes(response.data.data);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener las entradas, intentelo mas tarde' })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetchWarehouseIncomes();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Entradas"} pageTitle={"Subalmacén"} />


                <div className="">
                    <Card className="rounded">
                        <CardHeader>
                            <h4>Entradas</h4>
                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1">
                            <CustomTable columns={incomesColumns} data={subwarehouseIncomes} rowsPerPage={10} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>

            </Container>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} centered>
                <ModalHeader toggle={() => toggleModal('details')}>Detalles de entrada</ModalHeader>
                <ModalBody>
                    <IncomeDetails incomeId={selectedIncome._id} />
                </ModalBody>
            </Modal>

        </div>
    )

}

export default SubwarehouseIncomes;