import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import PigForm from "Components/Common/PigForm"
import { useContext, useEffect, useState, useRef } from "react"
import {
    Alert, Button, Card, CardBody, CardHeader, Container,
    Modal, ModalBody, ModalHeader, Input, Popover, PopoverHeader,
    PopoverBody, Row, Col, FormGroup, Label, Badge,
    Spinner
} from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'
import { getLoggedinUser } from "helpers/api_helper"
import PigCards from "Components/Common/PigCards"
import Select from "react-select"
import { FiFilter, FiX, FiSearch, FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi"
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useNavigate } from "react-router-dom"
import PDFViewer from "Components/Common/PDFViewer"
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import CustomTable from "Components/Common/CustomTable"
import { Column } from "common/data/data_types"

const ViewPigs = () => {
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false });
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
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
    const [selectedPig, setSelectedPig] = useState<PigData | null>(null)

    const pigColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text' },
        { header: 'Raza', accessor: 'breed', type: 'text' },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'macho' ? "info" : "danger"}>
                    {value === 'macho' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso actual', accessor: 'weight', type: 'number' },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: true,
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'vivo':
                        color = 'success';
                        label = 'Vivo';
                        break;
                    case 'descartado':
                        color = 'warning';
                        label = 'Descartado';
                        break;
                    case 'muerto':
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
                    <Button className="farm-secondary-button btn-icon" onClick={() => handleUpdatePigSelection(row)} disabled={row.status === 'vivo' ? false : true}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    <Button className="farm-primary-button btn-icon" onClick={() => handlePigSelection(row._id)}>
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

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const fetchPigs = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_all_by_farm/${userLogged.farm_assigned}`)
            setPigs(response.data.data)
            setFilteredPigs(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al recuperar los datos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const handlePrintReport = async () => {
        if (!configContext) return;

        setGeneratingReport(true);
        try {
            const pigIds = filteredPigs.map(pig => pig._id);

            const response = await configContext.axiosHelper.postBlob(
                `${configContext.apiUrl}/reports/generate_multiple_pig_report/`,
                pigIds,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handlePigSelection = (pigId: string) => {
        navigate(`/pigs/pig_details/${pigId}`);
    };

    const handleUpdatePigSelection = (pig: PigData) => {
        setSelectedPig(pig)
        toggleModal('update')
    }

    const onSavePig = () => {
        toggleModal('create')
        showAlert('success', 'Cerdo registrado con éxito')
        fetchPigs();
    }

    const onUpdatePig = () => {
        toggleModal('update')
        showAlert('success', 'Datos actualizados con éxito')
        fetchPigs();
    }


    useEffect(() => {
        fetchPigs()
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
        { value: "vivo", label: "Vivo" },
        { value: "vendido", label: "Vendido" },
        { value: "sacrificado", label: "Sacrificado" },
        { value: "muerto", label: "Muerto" },
        { value: "descartado", label: "Descartado" },

    ]

    const stageOptions = [
        { value: "", label: "Todas" },
        { value: "lechón", label: "Lechón" },
        { value: "destete", label: "Destete" },
        { value: "engorda", label: "Engorda" },
        { value: "reproductor", label: "Reproductor" }
    ]

    const originOptions = [
        { value: "", label: "Todos" },
        { value: "nacido", label: "Nacido" },
        { value: "comprado", label: "Comprado" },
        { value: "donado", label: "Donado" },
        { value: "otro", label: "Otro" }
    ]

    const sexOptions = [
        { value: "", label: "Todos" },
        { value: "macho", label: "Macho" },
        { value: "hembra", label: "Hembra" }
    ]

    const breedOptions = [
        { value: "", label: "Todas" },
        ...predefinedBreeds.map(breed => ({ value: breed, label: breed }))
    ]

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
                <BreadCrumb title={"Ver Cerdos"} pageTitle={"Cerdos"} />

                <Card style={{ minHeight: "calc(100vh - 220px)" }}>
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
                                    className="form-control ps-5 fs-5"
                                />
                            </div>

                            <Button
                                innerRef={filterBtnRef}
                                color="light"
                                onClick={togglePopover}
                                className="d-flex align-items-center position-relative fs-5"
                            >
                                <FiFilter className="me-2" />
                                Filtros
                                {activeFilterCount > 0 && (
                                    <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            <Popover
                                placement="bottom-end"
                                isOpen={popoverOpen}
                                target={filterBtnRef}
                                toggle={togglePopover}
                                trigger="legacy"
                                className="filter-popover"
                                style={{ minWidth: "450px" }}
                            >
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

                            <Button className="h-50 farm-primary-button ms-auto fs-5" onClick={handlePrintReport} disabled={generatingReport}>
                                {generatingReport ? (
                                    <>
                                        <Spinner size="sm" /> Generando...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-download-line me-2"></i>
                                        Exportar datos
                                    </>
                                )}
                            </Button>

                            <Button
                                className="farm-primary-button fs-5"
                                onClick={() => toggleModal('create')}
                            >
                                <i className="ri-add-line me-2" />
                                Registrar cerdo
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={pigs.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {pigs.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    Esta inseminación aun no tiene resultado
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={pigColumns} data={filteredPigs} showSearchAndFilter={false} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>


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

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Registro de cerdo</ModalHeader>
                <ModalBody>
                    <PigForm onSave={onSavePig} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Edición de cerdo</ModalHeader>
                <ModalBody>
                    <PigForm initialData={selectedPig || undefined} onSave={onUpdatePig} onCancel={() => toggleModal('update')} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ViewPigs