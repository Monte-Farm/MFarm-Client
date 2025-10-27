import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { GroupData, UserData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import PigDetailsModal from "Components/Common/DetailsPigModal";
import GroupForm from "Components/Common/GroupForm";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";

const ViewGroups = () => {
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, });
    const [groups, setGroups] = useState<GroupData[]>([])

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const groupsColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        {
            header: 'Área',
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.area) {
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba / Levante inicial";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena / Aislamiento";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital / Enfermería";
                        break;
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: 'Fecha de creación', accessor: 'creation_date', type: 'date', isFilterable: true },
        { header: 'No. de cerdos', accessor: 'pigCount', type: 'text', isFilterable: true },
        { header: 'No. de hembras', accessor: 'femaleCount', type: 'text', isFilterable: true },
        { header: 'No. de machos', accessor: 'maleCount', type: 'text', isFilterable: true },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon">
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ]

    const fetchGroups = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true)
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_farm/${userLogged.farm_assigned}`)
            setGroups(groupResponse.data.data)
        } catch (error) {
            console.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intenelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGroups();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Grupos"} pageTitle={"Grupos"} />

                <Card>
                    <CardHeader className="d-flex">
                        <Button className="ms-auto" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Nuevo grupo
                        </Button>
                    </CardHeader>
                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {groups.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable
                                    columns={groupsColumns}
                                    data={groups}
                                    showPagination={true}
                                    rowsPerPage={7}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay muestras disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>


            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("create")}>Crear grupo</ModalHeader>
                <ModalBody>
                    <GroupForm onSave={() => { toggleModal('create') }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

        </div>
    )
}

export default ViewGroups;