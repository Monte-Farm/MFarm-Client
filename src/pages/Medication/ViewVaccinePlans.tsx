import { ConfigContext } from "App"
import { Column } from "common/data/data_types"
import MedicationPackageDetails from "Components/Common/Details/MedicationPackageDetails"
import VaccinationPlanDetails from "Components/Common/Details/VaccinationPlanDetails"
import MedicationPackageForm from "Components/Common/Forms/MedicationPackageForm"
import VaccinationPlanForm from "Components/Common/Forms/VaccinationPlanForm"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import CustomTable from "Components/Common/Tables/CustomTable"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react"
import { FiInbox } from "react-icons/fi"
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"

const ViewVaccinationPlans = () => {
    document.title = 'Ver planes de vacunacion | System Management'
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false });
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const vaccinationPlansColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Responsable de creacion',
            accessor: 'creation_responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (<span>{row.creation_responsible.name} {row.creation_responsible.lastname}</span>)
        },
        {
            header: 'Etapa',
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = "General";
                        break;
                    case "piglet":
                        color = "info";
                        text = "Lechon";
                        break;
                    case "weaning":
                        color = "info";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "primary";
                        text = "Reproductor";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'Estado', accessor: 'is_active', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    {/* <Button className="farm-secondary-button btn-icon">
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button> */}
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedVaccinationPlan(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [vaccinationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_farm/${userLogged.farm_assigned}`),
            ])
            setVaccinationPlans(vaccinationResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver planes de vacunacion"} pageTitle={"Medicacion"} />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                Crear plan de vacunacion
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={vaccinationPlans.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {vaccinationPlans.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} />
                                <span className="fs-5 text-muted">Aún no hay planes de vacunacion registrados</span>
                            </>
                        ) : (
                            <CustomTable columns={vaccinationPlansColumns} data={vaccinationPlans} showPagination={true} rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>


            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nuevo plan de vacunacion</ModalHeader>
                <ModalBody>
                    <VaccinationPlanForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => { toggleModal("details"); fetchData() }}>Detalles de plan de vacunacion</ModalHeader>
                <ModalBody>
                    <VaccinationPlanDetails vaccinationPlanId={selectedVaccinationPlan?._id} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewVaccinationPlans;