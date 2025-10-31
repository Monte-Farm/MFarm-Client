import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import PregnancyDetails from "Components/Common/Details/PregnancyDetails";
import { useContext, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import BirthDetails from "Components/Common/Details/BirthDetailsModal";
import CustomTable from "Components/Common/Tables/CustomTable";

const ViewBirths = () => {
    document.title = 'Partos registrados | Management System'
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [births, setBirths] = useState<any[]>([]);
    const [modals, setModals] = useState({ pregnancyDetails: false, birthDetails: false })
    const [selectedBirth, setSelectedBirth] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const BirthsColumns: Column<any>[] = [
        {
            header: "Cerda",
            accessor: "sow",
            type: "text",
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pigs/pig_details/${row.sow._id}`)
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: 'Fecha de parto', accessor: 'birth_date', type: 'date', isFilterable: true },
        {
            header: 'Tipo de parto',
            accessor: 'birth_type',
            type: 'text',
            isFilterable: true,
            render: (value: string) => {
                let color = '';
                let label = '';

                switch (value) {
                    case 'normal':
                        color = 'success';
                        label = 'Normal';
                        break;
                    case 'cesarean':
                        color = 'primary';
                        label = 'Cesárea';
                        break;
                    case 'abortive':
                        color = 'danger';
                        label = 'Abortivo';
                        break;
                    case 'dystocia':
                        color = 'warning';
                        label = 'Distócico';
                        break;
                    case 'induced':
                        color = 'info';
                        label = 'Inducido';
                        break;
                    default:
                        color = 'secondary';
                        label = 'Sin especificar';
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: 'Asistido',
            accessor:
                'assisted',
            type: 'text',
            isFilterable: true,
            render: (_, obj) => (
                <Badge color={obj.assisted ? 'success' : 'warning'}>{obj.assisted ? 'Si' : 'No'}</Badge>
            )
        },
        {
            header: 'Responsable',
            accessor: 'responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => <span className="text-black">{row.responsible.name} {row.responsible.lastname}</span>

        },
        {
            header: "Embarazo",
            accessor: "pregnancy",
            type: "text",
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBirth(row);
                        toggleModal('pregnancyDetails');
                    }}
                >
                    Embarazo ↗
                </Button>
            )
        },
        {
            header: "Camada",
            accessor: "litter",
            type: "text",
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    Camada ↗
                </Button>
            )
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => { setSelectedBirth(row); toggleModal('birthDetails') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const birthsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/births/find_by_farm/${userLogged.farm_assigned}`)
            setBirths(birthsResponse.data.data)
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Partos registrados"} pageTitle={"Partos"} />

                <Card style={{ height: '77vh' }}>
                    <CardHeader className="d-flex">
                        <h5>Partos registrados</h5>
                    </CardHeader>
                    <CardBody className={births.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {births.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    Aun no se han regsitrado partos
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={BirthsColumns} data={births} showSearchAndFilter={false} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal isOpen={modals.pregnancyDetails} toggle={() => toggleModal('pregnancyDetails')} size="xl" centered>
                <ModalHeader toggle={() => toggleModal('pregnancyDetails')}>
                    <h5>Detalles de embarazo</h5>
                </ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedBirth.pregnancy} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.birthDetails} toggle={() => toggleModal('birthDetails')} size="xl" modalClassName="modal-xxl"  contentClassName="modal-tall" centered>
                <ModalHeader toggle={() => toggleModal('birthDetails')}>
                    <h5>Detalles de parto</h5>
                </ModalHeader>
                <ModalBody>
                    <BirthDetails birthId={selectedBirth._id} />
                </ModalBody>
            </Modal>

        </div>
    )
}

export default ViewBirths;