import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/BreadCrumb"
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import InseminationFilters from "Components/Common/InseminationFilters";
import CustomTable from "Components/Common/CustomTable";
import AbortionForm from "Components/Common/AbortionForm";


const ViewPregnancies = () => {
    document.title = "Ver embarazos | Management System"
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, abortion: false });
    const [pregnancies, setPregnancies] = useState<any[]>([])
    const [selectedPregnancie, setSelectedPregnancie] = useState({})

    const inseminationsColumns: Column<any>[] = [
        {
            header: "Cerda",
            accessor: "sow",
            type: "text",
            isFilterable: true,
            render: (_, row) => row.sow.code || "Sin código",
        },
        { header: "Fecha de inseminación", accessor: "date", type: "date", isFilterable: false },
        {
            header: "Estado",
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
            header: "Fecha prevista de parto",
            accessor: "estimated_farrowing_date",
            type: "date",
            render: (_, row) =>
                row.estimated_farrowing_date
                    ? new Date(row.estimated_farrowing_date).toLocaleDateString()
                    : "N/A",
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={() => openAbortionModal(row)}>
                        <i className="bx bxs-skull align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        Registrar perdida
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

    const openAbortionModal = (row: any) => {
        setSelectedPregnancie(row);
        toggleModal('abortion');
    }

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

    const onSaveAbortion = () => {
        fetchPregnancies();
        toggleModal('abortion');
    }


    const fetchPregnancies = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_pregnancies/${userLoggged.farm_assigned}`)
            setPregnancies(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPregnancies();
    }, [])

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
                <BreadCrumb title={"Ver embarazos"} pageTitle={"Gestación"} />

                <div className="d-flex gap-3 flex-wrap">
                    <Card className="flex-fill text-center shadow-sm border-0">
                        <CardBody>
                            <h5 className="text-muted">Total embarazos</h5>
                            <h2 className="fw-bold">{pregnancies.length}</h2>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill text-center shadow-sm border-0">
                        <CardBody>
                            <h5 className="text-muted">Embarazos activos</h5>
                            <h2 className="fw-bold text-success">
                                {pregnancies.filter(p => p.result === "pregnant").length}
                            </h2>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill text-center shadow-sm border-0">
                        <CardBody>
                            <h5 className="text-muted">Perdidas</h5>
                            <h2 className="fw-bold text-dark">
                                {pregnancies.filter(p => p.result === "abortion").length}
                            </h2>
                        </CardBody>
                    </Card>

                    <Card className="flex-fill text-center shadow-sm border-0">
                        <CardBody>
                            <h5 className="text-muted">Tasa de preñez</h5>
                            <h2 className="fw-bold text-primary">
                                {pregnancies.length > 0
                                    ? `${((pregnancies.filter(p => p.result === "pregnant").length / pregnancies.length) * 100).toFixed(2)}%`
                                    : "0%"}
                            </h2>
                        </CardBody>
                    </Card>
                </div>

                <Card style={{height: '71vh'}}>
                    <CardHeader className="d-flex">
                        <h4>Embarazos</h4>
                        <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                            <i className="ri-add-line me-2" />
                            Registrar inseminación
                        </Button>
                    </CardHeader>

                    <CardBody>

                        <CustomTable columns={inseminationsColumns} data={pregnancies} showPagination={false} showSearchAndFilter={false} />
                    </CardBody>
                </Card>
            </Container>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => toggleModal("abortion")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("abortion")}>Registrar perdida</ModalHeader>
                <ModalBody>
                    <AbortionForm insemination={selectedPregnancie} onSave={() => onSaveAbortion()} onCancel={function (): void {
                        throw new Error("Function not implemented.");
                    }} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewPregnancies