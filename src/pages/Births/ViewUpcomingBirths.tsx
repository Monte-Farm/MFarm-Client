import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/AlertMesagge";
import BirthForm from "Components/Common/BirthForm";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, ButtonGroup, Card, CardBody, CardHeader, CardSubtitle, Container, Input, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import PregnancyDetails from "Components/Common/PregnancyDetails";
import AbortionForm from "Components/Common/AbortionForm";

const ViewUpcomingBirths = () => {
    document.title = 'Proximos partos | Management system';
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const navigate = useNavigate();
    const [alertConfig, setAlertConfig] = useState({ visible: false, mesagge: '', color: '' })
    const [modals, setModals] = useState({ birth: false, selectedBirth: false, pregnancyDetails: false, abortion: false })
    const [upcomingBirths, setUpcomingBirths] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedBirth, setSelectedBirth] = useState<any>({})
    const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
    const [calendarData, setCalendarData] = useState<any[]>([])
    const [selectedPregnancyId, setSelectedPregnancyId] = useState<string>('')
    const [selectedPregnancyAbort, setSelectedPregnancyAbort] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const upcomingBirthsColumns: Column<any>[] = [
        {
            header: 'Cerda',
            accessor: 'sow',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Button className="text-underline fs-5" color="link" onClick={() => navigate(`/pigs/pig_details/${row.sow._id}`)}>
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: 'Fecha de inseminación', accessor: 'start_date', type: 'date', isFilterable: true },
        {
            header: "Estado de embarazo",
            accessor: "farrowing_status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Pendiente";
                switch (row.farrowing_status) {
                    case "pregnant": color = "success"; text = "Gestando"; break;
                    case "close_to_farrow": color = "warning"; text = "Proxima a parir"; break;
                    case "farrowing_pending": color = "info"; text = "Parto pendiente"; break;
                    case "overdue_farrowing": color = "danger"; text = "Parto atrasado"; break;
                    case "farrowed": color = "dark"; text = "Parida"; break;
                    case "abortion": color = "dark"; text = "Aborto"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: 'Fecha estimada de parto', accessor: 'estimated_farrowing_date', type: 'date', isFilterable: true },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`abort-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => { setSelectedPregnancyAbort(row); toggleModal('abortion') }} disabled={row.farrowing_status === 'farrowed'}>
                        <i className="bx bxs-skull align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`abort-button-${row._id}`}>
                        Registrar perdida
                    </UncontrolledTooltip>

                    <Button id={`birth-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => { setSelectedBirth(row); toggleModal('selectedBirth') }} disabled={row.farrowing_status === 'farrowed' || row.farrowing_status === 'pregnant' || row.farrowing_status === 'abortion'}>
                        <i className="bx bx-dna align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`birth-button-${row._id}`}>
                        Registrar parto
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => { setSelectedPregnancyId(row._id); toggleModal('pregnancyDetails') }} >
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
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const upcomingBirthsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_upcoming_births/${userLogged.farm_assigned}`)
            const upcomingBirthData = upcomingBirthsResponse.data.data;
            setUpcomingBirths(upcomingBirthData);

            const mappedData = upcomingBirthData.map((birth: any) => {
                let bgColor = "#e5e7eb";
                let textColor = "#000000";

                switch (birth.farrowing_status) {
                    case "pregnant":
                        bgColor = "#bbf7d0";
                        textColor = "#065f46";
                        break;
                    case "close_to_farrow":
                        bgColor = "#fef9c3";
                        textColor = "#854d0e";
                        break;
                    case "farrowing_pending":
                        bgColor = "#bfdbfe";
                        textColor = "#1e3a8a";
                        break;
                    case "overdue_farrowing":
                        bgColor = "#fecaca";
                        textColor = "#7f1d1d";
                        break;
                    case "farrowed":
                    case "abortion":
                        bgColor = "#9ca3af";
                        textColor = "#ffffff";
                        break;
                }

                return {
                    id: birth._id,
                    title: `Cerda ${birth.sow?.code || ""}`,
                    date: birth.estimated_farrowing_date,
                    backgroundColor: bgColor,
                    textColor: textColor
                };
            });
            setCalendarData(mappedData)

        } catch (error) {
            console.error(`Error fetching data: ${error}`)
            setAlertConfig({ visible: true, mesagge: 'Error al obtener los datos, intentelo mas tarde', color: 'danger' });
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
                <BreadCrumb title={"Proximos partos"} pageTitle={"Reproducción"} />

                <Card style={{ height: '85vh' }}>
                    <CardHeader className="d-flex justify-content-between">

                        <ButtonGroup className="mt-4 mt-sm-0">
                            <Button color={viewMode === "calendar" ? "primary" : "secondary"} className="btn-icon material-shadow-none fs-5" onClick={() => setViewMode("calendar")}>
                                <i className="ri-calendar-line" />
                            </Button>

                            <Button color={viewMode === "list" ? "primary" : "secondary"} className="btn-icon material-shadow-none fs-5" onClick={() => setViewMode("list")}>
                                <i className="ri-file-list-line" />
                            </Button>
                        </ButtonGroup>

                        <Button className="ms-auto" onClick={() => toggleModal('birth')}>
                            <i className="ri-add-line me-2" />
                            Registrar parto
                        </Button>
                    </CardHeader>

                    <CardBody>
                        {viewMode === "list" ? (
                            <CustomTable
                                columns={upcomingBirthsColumns}
                                data={upcomingBirths}
                                showPagination={false}
                            />
                        ) : (
                            <div className="h-100">
                                <FullCalendar
                                    plugins={[dayGridPlugin]}
                                    initialView="dayGridMonth"
                                    height="100%"
                                    locale="es"
                                    buttonText={{ today: "Hoy" }}
                                    events={calendarData}
                                    dayMaxEvents={true}
                                    eventDisplay="block"
                                    eventClick={(info: any) => { setSelectedPregnancyId(info.event.id); toggleModal('pregnancyDetails') }}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal isOpen={modals.birth} size="xl" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal('birth')}> Registrar parto </ModalHeader>
                <ModalBody>
                    <BirthForm pregnancy={undefined} onSave={() => { toggleModal('birth'); fetchData(); }} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>


            <Modal isOpen={modals.selectedBirth} size="xl" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal('selectedBirth')}> Registrar parto </ModalHeader>
                <ModalBody>
                    <BirthForm pregnancy={selectedBirth} onSave={() => { toggleModal('selectedBirth'); fetchData(); }} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.pregnancyDetails} toggle={() => { toggleModal("pregnancyDetails"); fetchData(); }} centered>
                <ModalHeader toggle={() => { toggleModal("pregnancyDetails"); fetchData(); }}>Detalles de embarazo</ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedPregnancyId} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => { toggleModal("abortion"); fetchData(); }} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("abortion")}>Registrar perdida</ModalHeader>
                <ModalBody>
                    <AbortionForm pregnancy={selectedPregnancyAbort} onSave={() => { toggleModal('abortion'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.mesagge} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}

        </div>
    )
}

export default ViewUpcomingBirths;