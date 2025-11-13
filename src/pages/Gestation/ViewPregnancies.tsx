import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap"
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import PregnancyDetails from "../../Components/Common/Details/PregnancyDetails";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { FiInbox } from "react-icons/fi";
import KPI from "Components/Common/Graphics/Kpi";
import { IconBaseProps } from "react-icons";
import { FaBaby, FaChartBar, FaChartLine, FaCheckCircle, FaClipboardList, FaClock, FaExclamationTriangle, FaHeartbeat } from "react-icons/fa";
import { transformPregnancyStatsForChart } from "Components/Hooks/transformPregnancyStats";
import { ResponsiveLine } from "@nivo/line";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import AbortionForm from "Components/Common/Forms/AbortionForm";
import CustomTable from "Components/Common/Tables/CustomTable";

type PeriodKey = "day" | "week" | "month" | "year";
const ViewPregnancies = () => {
    document.title = "Ver embarazos | Management System"
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, abortion: false, pigDetails: false, pregnancyDetails: false });
    const [pregnancies, setPregnancies] = useState<any[]>([])
    const [selectedPregnancy, setSelectedPregnancy] = useState<any>({})
    const [selectedPigId, setSelectedPigId] = useState<any>({})
    const [pregnancyStats, setPregnancyStats] = useState<any>({})

    const inseminationsColumns: Column<any>[] = [
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
                        setSelectedPigId(row?.sow?._id)
                        toggleModal('pigDetails')
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: "Fecha de inseminación", accessor: "start_date", type: "date", isFilterable: false },
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
        {
            header: "Fecha prevista de parto",
            accessor: "estimated_farrowing_date",
            type: "date",
            render: (_, row) => row.estimated_farrowing_date ? new Date(row.estimated_farrowing_date).toLocaleDateString() : "N/A",
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => { setSelectedPregnancy(row); toggleModal('abortion'); }} disabled={row.farrowing_status === 'farrowed' || row.abortions.length !== 0}>
                        <i className="bx bxs-skull align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        Registrar perdida
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => { setSelectedPregnancy(row); toggleModal('pregnancyDetails') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const [pregnanciesResponse, statsResponse] = await Promise.all([
                await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_by_farm/${userLoggged.farm_assigned}`),
                await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/get_stats/${userLoggged.farm_assigned}`)
            ])

            setPregnancies(pregnanciesResponse.data.data)
            setPregnancyStats(statsResponse.data.data)
        } catch (error) {
            console.error('An error has ocurred:', { error })
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
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver embarazos"} pageTitle={"Gestación"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title={"Embarazos totales"}
                        value={pregnancyStats?.generalStats?.[0]?.totalPregnancies ?? 0}
                        icon={FaClipboardList}
                        bgColor="#e8f4fd"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title={"Embarazos activos"}
                        value={pregnancyStats?.generalStats?.[0]?.activePregnancies ?? 0}
                        icon={FaHeartbeat}
                        bgColor="#fff3cd"
                        iconColor="#ffc107"
                    />

                    <KPI
                        title={"Partos exitosos"}
                        value={pregnancyStats?.generalStats?.[0]?.farrowedCount ?? 0}
                        icon={FaBaby}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title={"Abortos registrados"}
                        value={pregnancyStats?.generalStats?.[0]?.abortionCount ?? 0}
                        icon={FaExclamationTriangle}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />

                    <KPI
                        title={"Promedio días de gestación"}
                        value={Math.round(pregnancyStats?.generalStats?.[0]?.avgGestationDays ?? 0)}
                        icon={FaClock}
                        bgColor="#f3e8fd"
                        iconColor="#6f42c1"
                    />

                    <KPI
                        title={"Tasa de éxito"}
                        value={`${((pregnancyStats?.generalStats?.[0]?.successRate ?? 0) * 100).toFixed(2)}%`}
                        icon={FaChartLine}
                        bgColor="#e8f7fc"
                        iconColor="#0dcaf0"
                    />

                    <KPI
                        title={"Tasa de aborto"}
                        value={`${((pregnancyStats?.generalStats?.[0]?.abortionRate ?? 0) * 100).toFixed(2)}%`}
                        icon={FaChartBar}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard stats={pregnancyStats} type={"pregnancies"} title={"Embarazos por periodo"} yLabel={""} />
                    <LineChartCard stats={pregnancyStats} type={"farrowings"} title={"Partos por periodo"} yLabel={""} />
                    <LineChartCard stats={pregnancyStats} type={"abortions"} title={"Abortos por periodo"} yLabel={""} />
                </div>

                <Card>
                    <CardHeader className="d-flex">
                        <h4>Embarazos activos</h4>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {pregnancies && pregnancies.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable
                                    columns={inseminationsColumns}
                                    data={pregnancies}
                                    showPagination={true}
                                    showSearchAndFilter={false}
                                    rowsPerPage={7}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay embarazos registrados</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPigId} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => toggleModal("abortion")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("abortion")}>Registrar perdida</ModalHeader>
                <ModalBody>
                    <AbortionForm pregnancy={selectedPregnancy} onSave={() => { fetchData(); toggleModal('abortion'); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.pregnancyDetails} toggle={() => { toggleModal("pregnancyDetails"); fetchData() }} centered>
                <ModalHeader toggle={() => { toggleModal("pregnancyDetails"); fetchData() }}>Detalles de embarazo</ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedPregnancy._id} />
                </ModalBody>
            </Modal>


            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewPregnancies