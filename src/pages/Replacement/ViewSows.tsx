import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState, useRef } from "react"
import {
    Button, Card, CardBody, CardHeader, Container,
    Modal, ModalBody, ModalHeader, Input, Popover, PopoverHeader,
    PopoverBody, Row, Col, FormGroup, Label, Badge,
    Spinner
} from "reactstrap"
import { getEffectiveUser } from "helpers/impersonation_helper"
import Select from "react-select"
import { FiFilter, FiX, FiSearch, FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import Slider from 'rc-slider'
import { useNavigate } from "react-router-dom"
import { Column } from "common/data/data_types"
import CustomTable from "Components/Common/Tables/CustomTable"
import PDFViewer from "Components/Common/Shared/PDFViewer"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import { FaVenus } from "react-icons/fa"
import KPI from "Components/Common/Graphics/Kpi"
import { useTranslation } from "react-i18next"

const STAGE_COLORS: Record<string, string> = {
    piglet: 'info', weaning: 'warning', fattening: 'primary', breeder: 'success',
};
const STATUS_COLORS: Record<string, string> = {
    alive: 'success', discarded: 'warning', dead: 'danger',
};

const ViewSows = () => {
    const { t } = useTranslation();
    const [modals, setModals] = useState({ selectCreationMode: false, createSingle: false, createBatch: false, update: false, viewPDF: false });
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigs, setPigs] = useState<PigData[]>([])
    const [stats, setStats] = useState<any>()
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

    const predefinedBreeds = [
        "Yorkshire", "Landrace", "Duroc", "Hampshire", "Pietrain",
        "Berkshire", "Large White", "Chester White", "Poland China", "Tamworth"
    ]

    const togglePopover = () => setPopoverOpen(!popoverOpen)

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const pigColumns: Column<any>[] = [
        { header: t('replacement.column.code'), accessor: 'code', type: 'text' },
        { header: t('replacement.column.breed'), accessor: 'breed', type: 'text' },
        { header: t('replacement.column.birthdate'), accessor: 'birthdate', type: 'date' },
        {
            header: t('replacement.column.sex'),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ " + t('common.sex.male') : "♀ " + t('common.sex.female')}
                </Badge>
            ),
        },
        {
            header: t('replacement.column.stage'),
            accessor: 'currentStage',
            render: (value: string) => {
                const color = STAGE_COLORS[value] || 'secondary';
                const label = t(`replacement.stage.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('replacement.column.weight'), accessor: 'weight', type: 'number' },
        {
            header: t('replacement.column.status'),
            accessor: 'status',
            isFilterable: true,
            render: (value: string) => {
                const color = STATUS_COLORS[value] || 'secondary';
                const label = t(`replacement.status.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('replacement.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-secondary-button btn-icon" onClick={() => { setSelectedPig(row); toggleModal('update') }} disabled={row.status === 'vivo' ? false : true}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    <Button className="farm-primary-button btn-icon" onClick={() => navigate(`/pigs/pig_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const statusOptions = [
        { value: "", label: t('replacement.filter.statusAll') },
        { value: "alive", label: t('replacement.filter.statusAlive') },
        { value: "sold", label: t('replacement.filter.statusSold') },
        { value: "slaughtered", label: t('replacement.filter.statusSlaughtered') },
        { value: "dead", label: t('replacement.filter.statusDead') },
        { value: "discarded", label: t('replacement.filter.statusDiscarded') },
    ]

    const stageOptions = [
        { value: "", label: t('replacement.filter.stageAll') },
        { value: "piglet", label: t('replacement.filter.stagePiglet') },
        { value: "weaning", label: t('replacement.filter.stageWeaning') },
        { value: "fattening", label: t('replacement.filter.stageFattening') },
        { value: "breeder", label: t('replacement.filter.stageBreeder') },
    ]

    const originOptions = [
        { value: "", label: t('replacement.filter.originAll') },
        { value: "born", label: t('replacement.filter.originBorn') },
        { value: "purchased", label: t('replacement.filter.originPurchased') },
        { value: "donated", label: t('replacement.filter.originDonated') },
        { value: "other", label: t('replacement.filter.originOther') },
    ]

    const sexOptions = [
        { value: "", label: t('replacement.filter.sexAll') },
        { value: "male", label: t('replacement.filter.sexMale') },
        { value: "female", label: t('replacement.filter.sexFemale') },
    ]

    const breedOptions = [
        { value: "", label: t('replacement.filter.breedAll') },
        ...predefinedBreeds.map(breed => ({ value: breed, label: breed }))
    ]

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const [pigsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_sows/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_breeder_stats/${userLogged.farm_assigned}?sex=female`),
            ])

            setPigs(pigsResponse.data.data)
            setFilteredPigs(pigsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            logger.error('Error fetching pigs: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('replacement.error.load') })
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
            logger.error('Error generating report: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('replacement.error.pdf') })
        } finally {
            setGeneratingReport(false);
        }
    };

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

        if (filters.status) result = result.filter(pig => pig.status === filters.status)
        if (filters.currentStage) result = result.filter(pig => pig.currentStage === filters.currentStage)
        if (filters.origin) result = result.filter(pig => pig.origin === filters.origin)
        if (filters.sex) result = result.filter(pig => pig.sex === filters.sex)
        if (filters.breed) result = result.filter(pig => pig.breed === filters.breed)
        if (filters.weightRange) {
            result = result.filter(pig =>
                Number(pig.weight) >= filters.weightRange[0] &&
                Number(pig.weight) <= filters.weightRange[1]
            )
        }

        setFilteredPigs(result)
    }

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    const handleWeightRangeChange = (value: number | number[]) => {
        if (Array.isArray(value)) {
            setFilters(prev => ({ ...prev, weightRange: value as [number, number] }))
        }
    }

    const clearFilters = () => {
        setSearchTerm("")
        setFilters({ status: "", currentStage: "", origin: "", sex: "", breed: "", weightRange: [0, 500] })
        setPopoverOpen(false)
    }

    const activeFilterCount = Object.values(filters).filter(v =>
        v !== "" && !(Array.isArray(v) && v[0] === 0 && v[1] === 500)
    ).length

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('replacement.breadcrumb.sowTitle')} pageTitle={t('replacement.breadcrumb.sowParent')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title={t('replacement.kpi.totalSows')}
                        value={stats?.generalStats[0]?.totalAlive ?? 0}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title={t('replacement.kpi.avgFemaleWeight')}
                        icon={FaVenus}
                        bgColor="#fde8f2"
                        iconColor="#d63384"
                        value={stats?.avgWeightBySex?.find((p: { _id: string }) => p._id === 'female')?.avgWeight ?? 0}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex flex-wrap align-items-center gap-3">
                            <div className="position-relative flex-grow-1" style={{ maxWidth: "400px" }}>
                                <FiSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                                <Input
                                    type="text"
                                    placeholder={t('replacement.filter.search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-control ps-5"
                                />
                            </div>

                            <Button innerRef={filterBtnRef} color="light" onClick={togglePopover} className="d-flex align-items-center position-relative">
                                <FiFilter className="me-2" />
                                {t('replacement.filter.filters')}
                                {activeFilterCount > 0 && (
                                    <Badge color="primary" pill className="position-absolute top-0 start-100 translate-middle">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>

                            <Popover placement="bottom-end" isOpen={popoverOpen} target={filterBtnRef} toggle={togglePopover} trigger="legacy" className="filter-popover" style={{ minWidth: "450px" }}>
                                <PopoverHeader className="d-flex justify-content-between align-items-center popover-header">
                                    <span className="text-black">{t('replacement.filter.filterTitle')}</span>
                                    <Button close onClick={togglePopover} />
                                </PopoverHeader>
                                <PopoverBody className="popover-body">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>{t('replacement.filter.status')}</Label>
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
                                                <Label>{t('replacement.filter.stage')}</Label>
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
                                                <Label>{t('replacement.filter.origin')}</Label>
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
                                                <Label>{t('replacement.filter.sex')}</Label>
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
                                                <Label>{t('replacement.filter.breed')}</Label>
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
                                                    {t('replacement.filter.weight')}: {filters.weightRange[0]} - {filters.weightRange[1]}
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
                                        <Button color="link" onClick={clearFilters} className="text-danger">
                                            <FiX className="me-1" /> {t('replacement.filter.clearAll')}
                                        </Button>
                                        <Button color="primary" onClick={togglePopover} size="sm">
                                            {t('replacement.filter.apply')}
                                        </Button>
                                    </div>
                                </PopoverBody>
                            </Popover>

                            <Button className="h-50 farm-primary-button ms-auto" onClick={handlePrintReport} disabled={generatingReport}>
                                {generatingReport ? (
                                    <>
                                        <Spinner size="sm" /> {t('replacement.action.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-download-line me-2"></i>
                                        {t('replacement.action.exportData')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={pigs.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {pigs.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    {t('replacement.empty.noSows')}
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={pigColumns} data={filteredPigs} showSearchAndFilter={false} rowsPerPage={7} showPagination={true} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('replacement.modal.sowReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSows
