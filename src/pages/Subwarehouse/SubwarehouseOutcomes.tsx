import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import SubwarehouseOutcomeForm from "Components/Common/Forms/SubwarehouseOutcomeForm";


const SubwarehouseOutcomes = () => {
    document.title = "Detalles de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseOutcomes, setSubwarehouseOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)
    const [modals, setModals] = useState({ create: false, });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const outcomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Motivo de Salida', accessor: 'outcomeType', isFilterable: true, type: 'text' },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => history(`/warehouse/outcomes/outcome_details/${row.id}`)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleFetchWarehouseOutcomes = async () => {
        if (!configContext || !userLogged) return;

        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${userLogged.assigment}`);
            setSubwarehouseOutcomes(response.data.data);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        handleFetchWarehouseOutcomes();
    }, [configContext])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Salidas"} pageTitle={"Subalmacén"} />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <h4>Salidas</h4>
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-3" />
                                Nueva Salida
                            </Button>
                        </div>

                    </CardHeader>
                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                        <CustomTable columns={outcomesColumns} data={subwarehouseOutcomes} rowsPerPage={10} showPagination={false} />
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Create */}
            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva salida</ModalHeader>
                <ModalBody>
                    <SubwarehouseOutcomeForm onSave={() => { toggleModal('create'); handleFetchWarehouseOutcomes(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

        </div>
    )
}

export default SubwarehouseOutcomes