import { ConfigContext } from "App"
import { Column } from "common/data/data_types"
import MedicationPackageDetails from "Components/Common/Details/MedicationPackageDetails"
import MedicationPackageForm from "Components/Common/Forms/MedicationPackageForm"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import CustomTable from "Components/Common/Tables/CustomTable"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react"
import { FiInbox } from "react-icons/fi"
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"

const ViewMedicationPackages = () => {
    document.title = 'Ver paquetes de medicación | System Management'
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [medicationsPackages, setMedicationsPackages] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false });
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const medicationPackagesColumns: Column<any>[] = [
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
                        text = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
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
                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedMedicationPackage(row); toggleModal('details') }}>
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
            const [medicationResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_farm/${userLogged.farm_assigned}`),
            ])

            setMedicationsPackages(medicationResponse.data.data);

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
                <BreadCrumb title={"Ver paquetes de medicación"} pageTitle={"Medicacion"} />

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                Crear paquete de medicación
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={medicationsPackages.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {medicationsPackages.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} />
                                <span className="fs-5 text-muted">Aún no hay paquetes de medicacion registrados</span>
                            </>
                        ) : (
                            <CustomTable columns={medicationPackagesColumns} data={medicationsPackages} showPagination={true} rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>


            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nuevo paquete de medicación</ModalHeader>
                <ModalBody>
                    <MedicationPackageForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => { toggleModal("details"); fetchData() }}>Detalles de paquete de medicación</ModalHeader>
                <ModalBody>
                    <MedicationPackageDetails medicationPackageId={selectedMedicationPackage?._id} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewMedicationPackages;