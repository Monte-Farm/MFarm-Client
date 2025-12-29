import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiPlayCircle, FiActivity, FiInbox } from "react-icons/fi";
import { Column } from "common/data/data_types";
import InseminationFilters from "Components/Common/Tables/InseminationFilters";
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import DiagnosisForm from "Components/Common/Forms/DiagnoseForm";
import HeatForm from "Components/Common/Forms/HeatForm";
import InseminationForm from "Components/Common/Forms/InseminationForm";
import CustomTable from "Components/Common/Tables/CustomTable";

const ViewInseminations = () => {
    document.title = "Ver inseminaciones | Management System"
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, diagnosis: false, heat: false, pigDetails: false });
    const [inseminations, setInseminations] = useState<any[]>([])
    const [possiblesPregnancies, setPossiblesPregnancies] = useState<any[]>([])
    const [possiblesPregnanciesCount, setPossiblesPregnanciesCount] = useState<number>(0)
    const [selectedInsemination, setSelectedInsemination] = useState({})
    const [filteredInseminations, setFilteredInseminations] = useState<any[]>([]);
    const [selectedPigId, setSelectedPigId] = useState<string>('')
    const [inseminationsStats, setInseminationsStats] = useState<any>({})

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
                        setSelectedPigId(row.sow?._id);
                        toggleModal('pigDetails')
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        {
            header: "Dosis admin.",
            accessor: "doses",
            type: "number",
            isFilterable: true,
            render: (_, row) => row.doses.length || 0,
        },
        { header: "Fecha de inseminación", accessor: "date", type: "date", isFilterable: false },
        {
            header: "F. de parto (tentativa)",
            accessor: "date",
            type: "date",
            isFilterable: false,
            render: (_, row) => {
                const showDate =
                    row.status === "active" ||
                    (row.status === "completed" && row.result === "pregnant");

                return (
                    <span>
                        {showDate
                            ? new Date(new Date(row.date).getTime() + 115 * 24 * 60 * 60 * 1000)
                                .toLocaleDateString("es-MX")
                            : "N/A"}
                    </span>
                );
            },
        },
        {
            header: "Responsable",
            accessor: "responsible",
            type: "text",
            isFilterable: true,
            render: (_, row) =>
                row.responsible ? `${row.responsible.name} ${row.responsible.lastname}` : "Sin responsable",
        },
        {
            header: "Estado",
            accessor: "status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";
                switch (row.status) {
                    case "completed": color = "success"; text = "Completada"; break;
                    case "active": color = "warning"; text = "Activa"; break;
                    case "failed": color = "danger"; text = "Fallida"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Resultado",
            accessor: "result",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Pendiente";
                switch (row.result) {
                    case "pregnant": color = "success"; text = "Preñada"; break;
                    case "empty": color = "warning"; text = "Vacía"; break;
                    case "doubtful": color = "info"; text = "Dudosa"; break;
                    case "resorption": color = "danger"; text = "Reabsorción"; break;
                    case "abortion": color = "dark"; text = "Aborto"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`heat-button-${row._id}`} className="farm-warning-button btn-icon" onClick={() => { setSelectedInsemination(row); toggleModal('heat'); }} disabled={row.status === 'completed' || row.status === 'failed'}>
                        <i className="bx bx-heart align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`heat-button-${row._id}`}>
                        Registrar celo
                    </UncontrolledTooltip>


                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => { setSelectedInsemination(row); toggleModal('diagnosis'); }} disabled={row.status === 'completed' || row.status === 'failed'} >
                        <i className="bx bx-dna align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        Registrar diagnóstico
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => navigate(`/gestation/insemination_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`} >
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchInseminations = async () => {
        if (!configContext || !userLoggged) return;
        const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_by_farm/${userLoggged.farm_assigned}`);
        setInseminations(response.data.data);
        setFilteredInseminations(response.data.data);
    };

    const fetchPossiblePregnancies = async () => {
        if (!configContext || !userLoggged) return;
        const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_possibles_pregnancies/${userLoggged.farm_assigned}`);
        const data = response.data.data;
        setPossiblesPregnancies(data.inseminations);
        setPossiblesPregnanciesCount(data.count);
    };

    const fetchInseminationsStats = async () => {
        if (!configContext || !userLoggged) return;
        const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/get_stats/${userLoggged.farm_assigned}`);
        const data = response.data.data;
        setInseminationsStats(data)
    };


    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchInseminations(),
                    fetchPossiblePregnancies(),
                    fetchInseminationsStats()
                ]);
            } catch (error) {
                console.error(error);
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un erorr al obtener los datos, intentelo de nuevo' })
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Inseminaciones"} pageTitle={"Gestación"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title="Total inseminaciones"
                        value={inseminationsStats?.inseminationStats?.[0]?.total ?? 0}
                        icon={FiActivity}
                        bgColor="#e8f4fd"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title="Inseminaciones activas"
                        value={inseminationsStats?.inseminationStats?.[0]?.active ?? 0}
                        icon={FiPlayCircle}
                        bgColor="#fff8e1"
                        iconColor="#f6c000"
                    />

                    <KPI
                        title="Inseminaciones completadas"
                        value={inseminationsStats?.inseminationStats?.[0]?.completed ?? 0}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title="Inseminaciones fallidas"
                        value={inseminationsStats?.inseminationStats?.[0]?.failed ?? 0}
                        icon={FiXCircle}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard stats={inseminationsStats} type={"volume"} title={"Insemimaciones por periodo"} yLabel={"Inseminaciones"} />

                    <BasicBarChart
                        title="Inseminaciones por cerda"
                        data={(inseminationsStats?.inseminationsBySow ?? []).map((item: any) => ({
                            sowCode: item.sowCode,
                            count: item.count
                        }))}
                        indexBy="sowCode"
                        keys={["count"]}
                        xLegend="Cerda"
                        yLegend="Número de inseminaciones"
                    />

                    <BasicPieChart
                        title="Resultados de inseminaciones"
                        data={[
                            { id: 'Preñadas', value: inseminationsStats?.resultsStats?.[0]?.pregnant ?? 0 },
                            { id: 'Vacías', value: inseminationsStats?.resultsStats?.[0]?.empty ?? 0 },
                            { id: 'Abortos', value: inseminationsStats?.resultsStats?.[0]?.abortion ?? 0 },
                            { id: 'Reabsorciones', value: inseminationsStats?.resultsStats?.[0]?.resorption ?? 0 },
                            { id: 'Dudosas / Sin diagnóstico', value: inseminationsStats?.resultsStats?.[0]?.doubtfulOrMissing ?? 0 }
                        ]}
                    />

                </div>

                <Card style={{}}>
                    <CardHeader className="d-flex">
                        <h4>Inseminaciones</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal("create")}>
                            <i className="ri-add-line me-2" />
                            Registrar inseminación
                        </Button>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {filteredInseminations && filteredInseminations.length > 0 ? (
                            <>
                                <InseminationFilters
                                    inseminations={inseminations}
                                    setFilteredInseminations={setFilteredInseminations}
                                />

                                <div style={{ flex: 1 }}>
                                    <CustomTable
                                        columns={inseminationsColumns}
                                        data={filteredInseminations}
                                        showPagination={true}
                                        showSearchAndFilter={false}
                                        rowsPerPage={6}
                                    />
                                </div>
                            </>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                    color: "#888",
                                }}
                            >
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay inseminaciones disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva inseminación</ModalHeader>
                <ModalBody>
                    <InseminationForm onSave={() => { toggleModal('create'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>Registrar diagnóstico</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={selectedInsemination} onSave={() => { toggleModal('diagnosis'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("heat")}>Registrar celo</ModalHeader>
                <ModalBody>
                    {selectedInsemination && <HeatForm insemination={selectedInsemination} onSave={() => { toggleModal('heat'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPigId} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewInseminations;