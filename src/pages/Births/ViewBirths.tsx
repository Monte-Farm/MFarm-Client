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
import KPI from "Components/Common/Graphics/Kpi";
import { FaBaby, FaBabyCarriage, FaBiohazard, FaClipboardList, FaClock, FaExclamationTriangle, FaHeartbeat, FaPiggyBank, FaSkullCrossbones } from "react-icons/fa";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import { ResponsiveBar } from "@nivo/bar";

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
    const [birthStats, setBirthStats] = useState<any>({})

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
                        navigate(`/groups/group_details/${row.litter}`)
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
            const [birthsResponse, statsResponse] = await Promise.all([
                await configContext.axiosHelper.get(`${configContext.apiUrl}/births/find_by_farm/${userLogged.farm_assigned}`),
                await configContext.axiosHelper.get(`${configContext.apiUrl}/births/get_stats/${userLogged.farm_assigned}`)
            ])
            setBirths(birthsResponse.data.data)
            setBirthStats(statsResponse.data.data)
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

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title="Partos totales"
                        value={birthStats?.operationalKpis?.[0]?.totalBirths ?? 0}
                        icon={FaPiggyBank}
                        bgColor="#e8f0fe"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title="Tasa de mortalidad"
                        value={birthStats?.operationalKpis?.[0]?.mortalityRate.toFixed(2) ?? 0}
                        icon={FaSkullCrossbones}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />

                    <KPI
                        title="Tasa de nacidos muertos"
                        value={birthStats?.operationalKpis?.[0]?.stillbornRate ?? 0}
                        icon={FaBabyCarriage}
                        bgColor="#fff3cd"
                        iconColor="#ff8800"
                    />

                    <KPI
                        title="Tasa de momias"
                        value={birthStats?.operationalKpis?.[0]?.mummiesRate ?? 0}
                        icon={FaBiohazard}
                        bgColor="#f8d7da"
                        iconColor="#b02a37"
                    />

                    <KPI
                        title="Promedio de nacidos vivos"
                        value={birthStats?.operationalKpis?.[0]?.avgBornAlivePerBirth.toFixed(2) ?? 0}
                        icon={FaBaby}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />
                </div>

                <div className="d-flex gap-3">
                    <BasicBarChart
                        title="Resultados por cerda"
                        data={birthStats?.reproductiveStatsBySow?.map((sow: any) => ({
                            cerda: sow.sowCode,
                            "Nacidos vivos": sow.avgBornAlive,
                            "Nacidos muertos": sow.avgStillborn,
                            "Momias": sow.avgMummies,
                        })) ?? []}
                        indexBy="cerda"
                        keys={["Nacidos vivos", "Nacidos muertos", "Momias"]}
                        xLegend="Cerda"
                        yLegend="Promedio por parto"
                    />

                    <BasicBarChart
                        title="Promedio de resultados por lote"
                        data={birthStats?.litterStats?.map((litter: any) => ({
                            lote: litter.litterCode,
                            "Nacidos vivos": litter.avgBornAlive,
                            "Nacidos muertos": litter.avgStillborn,
                            "Momias": litter.avgMummies,
                        })) ?? []}
                        indexBy="lote"
                        keys={["Nacidos vivos", "Nacidos muertos", "Momias"]}
                        xLegend="Camada"
                        yLegend="Promedio por parto"
                    />
                </div>


                <Card>
                    <CardHeader className="d-flex">
                        <h5>Partos registrados</h5>
                    </CardHeader>
                    <CardBody className={births.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {births.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    Aun no se han registrado partos
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={BirthsColumns} data={births} showSearchAndFilter={false} showPagination={true} rowsPerPage={7} />
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

            <Modal isOpen={modals.birthDetails} toggle={() => toggleModal('birthDetails')} size="xl" modalClassName="modal-xxl" contentClassName="modal-tall" centered>
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