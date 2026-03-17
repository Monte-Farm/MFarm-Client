import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { PigData } from "common/data_interfaces";
import DiscardPigForm from "Components/Common/Forms/DiscardPigForm";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import KPI from "Components/Common/Graphics/Kpi";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaMars, FaVenus } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiTrendingDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import PigFilters from "Components/Common/Filters/PigFilters";
import { usePigFilters } from "hooks/usePigFilters";

const DiscardedPigs = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ discard: false, });
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigs, setPigs] = useState<PigData[]>([])
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>()
    
    const {
        searchTerm,
        setSearchTerm,
        filters,
        filteredPigs,
        popoverOpen,
        handleFilterChange,
        handleWeightRangeChange,
        clearFilters,
        togglePopover
    } = usePigFilters(pigs);

    const pigColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text' },
        { header: 'Raza', accessor: 'breed', type: 'text' },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        {
            header: 'Etapa',
            accessor: 'currentStage',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "piglet":
                        color = "info";
                        label = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        label = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        label = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        label = "Reproductor";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Peso', accessor: 'weight', type: 'number' },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: true,
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'alive':
                        color = 'success';
                        label = 'Vivo';
                        break;
                    case 'discarded':
                        color = 'warning';
                        label = 'Descartado';
                        break;
                    case 'dead':
                        color = 'danger';
                        label = 'Muerto';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => navigate(`/pigs/pig_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const predefinedBreeds = [
        "Yorkshire",
        "Landrace",
        "Duroc",
        "Hampshire",
        "Pietrain",
        "Berkshire",
        "Large White",
        "Chester White",
        "Poland China",
        "Tamworth"
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const [pigsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_discarded_by_farm/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_discarded_stats/${userLogged.farm_assigned}`),
            ])

            setPigs(pigsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            console.error('Error fetching pigs: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
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
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Cerdos descartados"} pageTitle={"Cerdos"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title="Cerdos descartados" value={stats?.general[0]?.totalDiscarded ?? 0} icon={FiTrash2} bgColor="#fdecea" iconColor="#d93025" />
                    <KPI title="Porcentaje de cerdos descartados" value={`${stats?.general[0]?.discardRate ?? 0} %`} icon={FiTrendingDown} bgColor="#fff4e5" iconColor="#f5a623" />
                </div>

                <div className="d-flex gap-3">
                    <BasicPieChart title={"Cerdos descartados por sexo"}
                        data={stats?.bySex?.map((s: { _id: any; count: any }) => ({
                            id: s._id === 'male' ? 'Macho' : 'Hembra',
                            value: s.count,
                        })) ?? []}
                    />

                    <BasicPieChart
                        title={"Cerdos descartados por etapa"}
                        data={
                            stats.byStage?.map((s: { _id: any; count: any }) => ({
                                id: (() => {
                                    switch (s._id) {
                                        case "piglet": return "Lechón";
                                        case "weaning": return "Destete";
                                        case "fattening": return "Engorda";
                                        case "breeder": return "Reproductor";
                                        default: return s._id;
                                    }
                                })(),
                                value: s.count,
                            })) ?? []
                        }
                    />

                    <BasicBarChart title={"Razon de descarte de cerdos"}
                        indexBy="stage"
                        keys={["cantidad"]}
                        xLegend="Etapa"
                        yLegend="Cantidad"
                        data={stats.byReason.map((s: { _id: any; count: any }) => ({
                            stage: (() => {
                                switch (s._id) {
                                    case "lameness": return "Cojeras";
                                    case "poor_body_condition": return "Condición corporal deficiente";
                                    case "reproductive_failure": return "Falla reproductiva";
                                    case "low_milk_production": return "Baja producción de leche";
                                    case "disease": return "Enfermedad";
                                    case "injury": return "Lesión";
                                    case "aggressive_behavior": return "Comportamiento agresivo";
                                    case "old_age": return "Edad avanzada";
                                    case "death": return "Muerte";
                                    case "poor_growth": return "Bajo crecimiento / rendimiento";
                                    case "hernias": return "Hernias";
                                    case "prolapse": return "Prolapso";
                                    case "non_ambulatory": return "No puede caminar";
                                    case "respiratory_failure": return "Problemas respiratorios severos";
                                    default: return s._id;
                                }
                            })(),
                            cantidad: s.count
                        }))}
                    />

                    <BasicBarChart title={"Destino de cerdos descartados"}
                        indexBy="destination"
                        keys={["cantidad"]}
                        xLegend="Destino"
                        yLegend="Cantidad"
                        data={stats.byDestination.map((s: { _id: any; count: any }) => ({
                            destination: (() => {
                                switch (s._id) {
                                    case "slaughterhouse": return "Rastro";
                                    case "on_farm_euthanasia": return "Eutanasia en granja";
                                    case "sale": return "Venta";
                                    case "research": return "Investigación";
                                    case "rendering": return "Procesadora / despojos";
                                    case "composting": return "Compostaje";
                                    case "burial": return "Enterrado";
                                    case "incineration": return "Incineración";
                                    default: return s._id;
                                }
                            })(),
                            cantidad: s.count
                        }))}
                    />
                </div>


                <Card>
                    <CardHeader>
                        <div className="d-flex flex-wrap align-items-center gap-3">
                            <PigFilters
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onWeightRangeChange={handleWeightRangeChange}
                                onClearFilters={clearFilters}
                                popoverOpen={popoverOpen}
                                onTogglePopover={togglePopover}
                                predefinedBreeds={predefinedBreeds}
                            />

                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal('discard')}>
                                <i className="ri-add-line me-2" />
                                Descartar cerdo
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={pigs.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {pigs.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    No hay cerdos descartados
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={pigColumns} data={filteredPigs} showSearchAndFilter={false} rowsPerPage={7} showPagination={true} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.discard} toggle={() => toggleModal("discard")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("discard")}>Descartar cerdo</ModalHeader>
                <ModalBody>
                    <DiscardPigForm onSave={() => { toggleModal('discard'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default DiscardedPigs