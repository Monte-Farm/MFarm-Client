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
import Slider from "rc-slider";
import { useContext, useEffect, useRef, useState } from "react";
import { FaMars, FaVenus } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle, FiFilter, FiSearch, FiTrash2, FiTrendingDown, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Select from "react-select"
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Popover, PopoverBody, PopoverHeader, Row } from "reactstrap"

const DiscardedPigs = () => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ discard: false, });
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigs, setPigs] = useState<PigData[]>([])
    const [filteredPigs, setFilteredPigs] = useState<PigData[]>([])
    const [fileURL, setFileURL] = useState<string>('')
    const [generatingReport, setGeneratingReport] = useState(false);
    const [searchTerm, setSearchTerm] = useState("")
    const [filters, setFilters] = useState({
        status: "",
        currentStage: "",
        origin: "",
        sex: "",
        breed: "",
        weightRange: [0, 500] as [number, number]
    })
    const [popoverOpen, setPopoverOpen] = useState(false)
    const filterBtnRef = useRef(null)
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>()

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

    const togglePopover = () => setPopoverOpen(!popoverOpen)

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
            setFilteredPigs(pigsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            console.log('Error fetching pigs: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [searchTerm, filters, pigs])

    const applyFilters = () => {
        let result = [...pigs]

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(pig =>
                pig.code.toLowerCase().includes(term) ||
                pig.breed.toLowerCase().includes(term) ||
                (pig.observations && pig.observations.toLowerCase().includes(term))
            )
        }

        if (filters.status) {
            result = result.filter(pig => pig.status === filters.status)
        }
        if (filters.currentStage) {
            result = result.filter(pig => pig.currentStage === filters.currentStage)
        }
        if (filters.origin) {
            result = result.filter(pig => pig.origin === filters.origin)
        }
        if (filters.sex) {
            result = result.filter(pig => pig.sex === filters.sex)
        }
        if (filters.breed) {
            result = result.filter(pig => pig.breed === filters.breed)
        }
        if (filters.weightRange) {
            result = result.filter(pig =>
                pig.weight >= filters.weightRange[0] &&
                pig.weight <= filters.weightRange[1]
            )
        }

        setFilteredPigs(result)
    }

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }))
    }

    const handleWeightRangeChange = (value: number | number[]) => {
        if (Array.isArray(value)) {
            setFilters(prev => ({
                ...prev,
                weightRange: value as [number, number]
            }))
        }
    }

    const clearFilters = () => {
        setSearchTerm("")
        setFilters({
            status: "",
            currentStage: "",
            origin: "",
            sex: "",
            breed: "",
            weightRange: [0, 500]
        })
        setPopoverOpen(false)
    }

    const activeFilterCount = Object.values(filters).filter(v =>
        v !== "" && !(Array.isArray(v) && v[0] === 0 && v[1] === 500)
    ).length

    const statusOptions = [
        { value: "", label: "Todos" },
        { value: "alive", label: "Vivo" },
        { value: "sold", label: "Vendido" },
        { value: "slaughtered", label: "Sacrificado" },
        { value: "dead", label: "Muerto" },
        { value: "discarded", label: "Descartado" },
    ]

    const stageOptions = [
        { value: "", label: "Todas" },
        { value: "piglet", label: "Lechón" },
        { value: "weaning", label: "Destete" },
        { value: "fattening", label: "Engorda" },
        { value: "breeder", label: "Reproductor" }
    ]

    const originOptions = [
        { value: "", label: "Todos" },
        { value: "born", label: "Nacido" },
        { value: "purchased", label: "Comprado" },
        { value: "donated", label: "Donado" },
        { value: "other", label: "Otro" }
    ]

    const sexOptions = [
        { value: "", label: "Todos" },
        { value: "male", label: "Macho" },
        { value: "female", label: "Hembra" }
    ]

    const breedOptions = [
        { value: "", label: "Todas" },
        ...predefinedBreeds.map(breed => ({ value: breed, label: breed }))
    ]

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
                    <KPI
                        title="Cerdos descartados"
                        value={stats?.general[0]?.totalDiscarded ?? 0}
                        icon={FiTrash2}
                        bgColor="#fdecea"
                        iconColor="#d93025"
                    />

                    <KPI
                        title="Porcentaje de cerdos descartados"
                        value={`${stats?.general[0]?.discardRate} %`}
                        icon={FiTrendingDown}
                        bgColor="#fff4e5"
                        iconColor="#f5a623"
                    />
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
                            {/* Barra de búsqueda con icono */}
                            <div className="position-relative flex-grow-1" style={{ maxWidth: "400px" }}>
                                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <Input
                                    type="text"
                                    placeholder="Buscar cerdos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control ps-5"
                                />
                            </div>

                            <Button innerRef={filterBtnRef} color="light" onClick={togglePopover} className="d-flex align-items-center position-relative">
                                <FiFilter className="me-2" />
                                Filtros
                                {activeFilterCount > 0 && (
                                    <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            <Popover placement="bottom-end" isOpen={popoverOpen} target={filterBtnRef} toggle={togglePopover} trigger="legacy" className="filter-popover" style={{ minWidth: "450px" }}>
                                <PopoverHeader className="d-flex justify-content-between align-items-center popover-header">
                                    <span className="text-black">Filtrar cerdos</span>
                                    <Button close onClick={togglePopover} />
                                </PopoverHeader>
                                <PopoverBody className="popover-body">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Estado</Label>
                                                <Select
                                                    options={statusOptions}
                                                    value={statusOptions.find(opt => opt.value === filters.status)}
                                                    onChange={(opt: any) => handleFilterChange("status", opt?.value || "")}
                                                    className="react-select"
                                                    classNamePrefix="select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Etapa</Label>
                                                <Select
                                                    options={stageOptions}
                                                    value={stageOptions.find(opt => opt.value === filters.currentStage)}
                                                    onChange={(opt: any) => handleFilterChange("currentStage", opt?.value || "")}
                                                    className="react-select"
                                                    classNamePrefix="select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Origen</Label>
                                                <Select
                                                    options={originOptions}
                                                    value={originOptions.find(opt => opt.value === filters.origin)}
                                                    onChange={(opt: any) => handleFilterChange("origin", opt?.value || "")}
                                                    className="react-select"
                                                    classNamePrefix="select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Género</Label>
                                                <Select
                                                    options={sexOptions}
                                                    value={sexOptions.find(opt => opt.value === filters.sex)}
                                                    onChange={(opt: any) => handleFilterChange("sex", opt?.value || "")}
                                                    className="react-select"
                                                    classNamePrefix="select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Raza</Label>
                                                <Select
                                                    options={breedOptions}
                                                    value={breedOptions.find(opt => opt.value === filters.breed)}
                                                    onChange={(opt: any) => handleFilterChange("breed", opt?.value || "")}
                                                    className="react-select"
                                                    classNamePrefix="select"
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>
                                                    Peso (kg): {filters.weightRange[0]} - {filters.weightRange[1]}
                                                </Label>
                                                <Slider
                                                    range
                                                    min={0}
                                                    max={500}
                                                    value={filters.weightRange}
                                                    onChange={handleWeightRangeChange}
                                                    trackStyle={[{ backgroundColor: '#405189' }]}
                                                    handleStyle={[
                                                        { backgroundColor: '#405189', borderColor: '#405189' },
                                                        { backgroundColor: '#405189', borderColor: '#405189' }
                                                    ]}
                                                />
                                                <div className="d-flex justify-content-between mt-1">
                                                    <small>0 kg</small>
                                                    <small>500 kg</small>
                                                </div>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between mt-3">
                                        <Button
                                            color="link"
                                            onClick={clearFilters}
                                            className="text-danger"
                                        >
                                            <FiX className="me-1" /> Limpiar todo
                                        </Button>
                                        <Button
                                            color="primary"
                                            onClick={togglePopover}
                                            size="sm"
                                        >
                                            Aplicar filtros
                                        </Button>
                                    </div>
                                </PopoverBody>
                            </Popover>

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