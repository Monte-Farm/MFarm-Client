import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import InseminationForm from "Components/Common/InseminationForm";
import { Column } from "common/data/data_types";
import DiagnosisForm from "Components/Common/DiagnoseForm";
import HeatForm from "Components/Common/HeatForm";
import InseminationFilters from "Components/Common/InseminationFilters";

const ViewInseminations = () => {
    document.title = "Ver inseminaciones | Management System"
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext);

    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, diagnosis: false, heat: false });
    const [inseminations, setInseminations] = useState<any[]>([])
    const [possiblesPregnancies, setPossiblesPregnancies] = useState<any[]>([])
    const [possiblesPregnanciesCount, setPossiblesPregnanciesCount] = useState<number>(0)
    const [selectedInsemination, setSelectedInsemination] = useState({})
    const [filteredInseminations, setFilteredInseminations] = useState<any[]>([]);
    const [activeKpi, setActiveKpi] = useState<string | null>(null);

    const inseminationsColumns: Column<any>[] = [
        {
            header: "Cerda",
            accessor: "sow",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.sow.code || "Sin código",
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
                    <Button id={`heat-button-${row._id}`} className="farm-warning-button btn-icon" onClick={() => openHeatModal(row)} disabled={row.status === 'completed' || row.status === 'failed'}>
                        <i className="bx bx-heart align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`heat-button-${row._id}`}>
                        Registrar celo
                    </UncontrolledTooltip>


                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => openDiagnoseModal(row)} disabled={row.status === 'completed' || row.status === 'failed'} >
                        <i className="bx bx-dna align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        Registrar diagnóstico
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon">
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const openDiagnoseModal = (row: any) => {
        setSelectedInsemination(row);
        toggleModal('diagnosis');
    }

    const openHeatModal = (row: any) => {
        setSelectedInsemination(row);
        toggleModal('heat');
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color, message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const onSaveInsemination = () => { toggleModal('create'); fetchInseminations(); }
    const onSaveDiagnosis = () => { fetchInseminations(); toggleModal('diagnosis'); }
    const onSaveHeat = () => { fetchInseminations(); toggleModal('heat'); }

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

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchInseminations(),
                    fetchPossiblePregnancies()
                ]);
                setActiveKpi('all');
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Inseminaciones"} pageTitle={"Gestación"} />

                <div className="d-flex gap-3 flex-wrap">
                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'all' ? 'border-primary border-1' : ''}`}
                        onClick={() => { setActiveKpi('all'); setFilteredInseminations(inseminations); }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Total inseminaciones</h5>
                            <h2 className="fw-bold">{inseminations.length}</h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm  ${activeKpi === 'possible' ? 'border-1 border-info' : 'border-0'}`}
                        onClick={() => { setActiveKpi('possible'); setFilteredInseminations(possiblesPregnancies); }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Posibles preñez</h5>
                            <h2 className="fw-bold text-info">{possiblesPregnanciesCount}</h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'pregnant' ? 'border-success border-1' : ''}`}
                        onClick={() => { setActiveKpi('pregnant'); setFilteredInseminations(inseminations.filter(ins => ins.result === "pregnant")); }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Preñadas</h5>
                            <h2 className="fw-bold text-success">{inseminations.filter(ins => ins.result === "pregnant").length}</h2>
                        </CardBody>
                    </Card>

                    <Card
                        className={`flex-fill text-center shadow-sm ${activeKpi === 'failed' ? 'border-danger border-1' : ''}`}
                        onClick={() => { setActiveKpi('failed'); setFilteredInseminations(inseminations.filter(ins => ins.status === "failed")); }}
                    >
                        <CardBody>
                            <h5 className="text-muted">Fallidas</h5>
                            <h2 className="fw-bold text-danger">{inseminations.filter(ins => ins.status === "failed").length}</h2>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill text-center shadow-sm border-0">
                        <CardBody>
                            <h5 className="text-muted">Tasa de preñez</h5>
                            <h2 className="fw-bold text-primary">
                                {inseminations.length > 0
                                    ? `${((inseminations.filter(ins => ins.result === "pregnant").length / inseminations.length) * 100).toFixed(2)}%`
                                    : "0%"}
                            </h2>
                        </CardBody>
                    </Card>
                </div>

                <Card style={{height: '71vh'}}>
                    <CardHeader className="d-flex">
                        <h4>Inseminaciones</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Registrar inseminación
                        </Button>
                    </CardHeader>

                    <CardBody>
                        <InseminationFilters
                            inseminations={inseminations}
                            setFilteredInseminations={setFilteredInseminations}
                        />
                        <CustomTable columns={inseminationsColumns} data={filteredInseminations} showPagination={false} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva muestra</ModalHeader>
                <ModalBody>
                    <InseminationForm onSave={onSaveInsemination} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>Registrar diagnóstico</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={selectedInsemination} onSave={onSaveDiagnosis} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("heat")}>Registrar celo</ModalHeader>
                <ModalBody>
                    {selectedInsemination && <HeatForm insemination={selectedInsemination} onSave={onSaveHeat} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert
                    color={alertConfig.color}
                    className="position-fixed bottom-0 start-50 translate-middle-x d-flex align-items-center gap-2 shadow rounded-3 p-3"
                    style={{ minWidth: "350px", maxWidth: "90%", zIndex: 1050 }}
                >
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}
                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>
                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}
        </div>
    )
}

export default ViewInseminations;