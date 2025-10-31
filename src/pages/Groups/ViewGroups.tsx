import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { GroupData, UserData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import GroupDetails from "Components/Common/Details/GroupDetails";
import GroupForm from "Components/Common/Forms/GroupForm";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
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
    const [modals, setModals] = useState({ create: false, groupDetails: false, moveGroup: false, asign: false, withdraw: false });
    const [groups, setGroups] = useState<GroupData[]>([])
    const [selectedGroup, setSelectedGroup] = useState<any>({})

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
                    <Button id={`move-button-${row._id}`} className="btn-icon btn-warning" onClick={() => { setSelectedGroup(row); toggleModal('asign'); }}>
                        <i className="ri-arrow-left-right-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`move-button-${row._id}`}>
                        Trasladar cerdos
                    </UncontrolledTooltip>

                    <Button id={`withdraw-button-${row._id}`} className="btn-icon btn-danger" onClick={() => { setSelectedGroup(row); toggleModal('withdraw'); }}>
                        <i className="ri-upload-2-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`withdraw-button-${row._id}`}>
                        Retirar cerdo
                    </UncontrolledTooltip>

                    < Button id={`asign-button-${row._id}`} className="btn-icon btn-primary" onClick={() => { setSelectedGroup(row); toggleModal('asign'); }}>
                        <i className="ri-download-2-line align-middle"></i>
                    </Button >
                    <UncontrolledTooltip target={`asign-button-${row._id}`}>
                        Ingresar cerdo
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="btn-icon btn-success" onClick={() => { setSelectedGroup(row); toggleModal('groupDetails'); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div >
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

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("create")}>Crear grupo</ModalHeader>
                <ModalBody>
                    <GroupForm onSave={() => { toggleModal('create') }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.moveGroup} toggle={() => toggleModal("moveGroup")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("moveGroup")}>Trasladar cerdos</ModalHeader>
                <ModalBody>

                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.asign} toggle={() => toggleModal("asign")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("asign")}>Ingresar cerdos</ModalHeader>
                <ModalBody>

                </ModalBody>
            </Modal>


            <Modal size="xl" isOpen={modals.withdraw} toggle={() => toggleModal("withdraw")} centered backdrop={'static'} keyboard={false}>
                <ModalHeader toggle={() => toggleModal("withdraw")}>Retirar cerdos</ModalHeader>
                <ModalBody>

                </ModalBody>
            </Modal>


            <Modal size="xl" isOpen={modals.groupDetails} toggle={() => toggleModal("groupDetails")} centered modalClassName="modal-xxl" contentClassName="modal-tall" >
                <ModalHeader toggle={() => toggleModal("groupDetails")}>Detalles de grupo</ModalHeader>
                <ModalBody>
                    <GroupDetails groupId={selectedGroup?._id} />
                </ModalBody>
            </Modal>

        </div>
    )
}

export default ViewGroups;