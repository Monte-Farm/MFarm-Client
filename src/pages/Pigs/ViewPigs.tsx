import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState } from "react"
import {
    Button, Card, CardBody, CardHeader, Container,
    Modal, ModalBody, ModalHeader, Badge,
    Spinner
} from "reactstrap"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { Column } from "common/data/data_types"
import CustomTable from "Components/Common/Tables/CustomTable"
import PDFViewer from "Components/Common/Shared/PDFViewer"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import { FaKeyboard, FaListUl, FaMars, FaVenus } from "react-icons/fa"
import SinglePigForm from "Components/Common/Forms/SinglePigForm"
import BatchPigForm from "Components/Common/Forms/BatchPigForm"
import PigEditForm from "Components/Common/Forms/PigEditForm"
import KPI from "Components/Common/Graphics/Kpi"
import BasicPieChart from "Components/Common/Graphics/BasicPieChart"
import PigFilters from "Components/Common/Filters/PigFilters"
import { usePigFilters } from "hooks/usePigFilters"
import { useTranslation } from "react-i18next"

const stageColorMap: Record<string, string> = {
    piglet: "info",
    weaning: "warning",
    fattening: "primary",
    breeder: "success",
    gestation: "info",
};

const statusColorMap: Record<string, string> = {
    alive: "success",
    discarded: "warning",
    dead: "danger",
};

const ViewPigs = () => {
    const { t } = useTranslation();
    const [modals, setModals] = useState({ selectCreationMode: false, createSingle: false, createBatch: false, update: false, viewPDF: false });
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigs, setPigs] = useState<PigData[]>([])
    const [stats, setStats] = useState<any>()
    const [fileURL, setFileURL] = useState<string>('')
    const [generatingReport, setGeneratingReport] = useState(false);
    const navigate = useNavigate();
    const [selectedPig, setSelectedPig] = useState<PigData | null>(null)

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
        { header: t('pigs.field.code'), accessor: 'code', type: 'text' },
        { header: t('pigs.field.breed'), accessor: 'breed', type: 'text' },
        { header: t('pigs.field.birthDateShort'), accessor: 'birthdate', type: 'date' },
        {
            header: t('pigs.field.sex'),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? t('pigs.sex.male') : t('pigs.sex.female')}
                </Badge>
            ),
        },
        {
            header: t('pigs.field.stage'),
            accessor: 'currentStage',
            render: (value: string) => (
                <Badge color={stageColorMap[value] || "secondary"}>
                    {t(`pigs.stage.${value}`, { defaultValue: value })}
                </Badge>
            ),
        },
        { header: t('pigs.field.currentWeight'), accessor: 'weight', type: 'number' },
        {
            header: t('pigs.field.status'),
            accessor: 'status',
            isFilterable: true,
            render: (value: string) => (
                <Badge color={statusColorMap[value] || "secondary"}>
                    {t(`pigs.status.${value}`, { defaultValue: value })}
                </Badge>
            ),
        },
        {
            header: t('common.field.actions'),
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

    const predefinedBreeds = [
        "Yorkshire", "Landrace", "Duroc", "Hampshire", "Pietrain",
        "Berkshire", "Large White", "Chester White", "Poland China", "Tamworth"
    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const [pigsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_breeders_by_farm/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_breeder_stats/${userLogged.farm_assigned}`),
            ])
            setPigs(pigsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            logger.error('Error fetching pigs: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('pigs.page.noPigs') })
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
            setAlertConfig({ visible: true, color: 'danger', message: t('pigs.page.noPigs') })
        } finally {
            setGeneratingReport(false);
        }
    };

    useEffect(() => { fetchData() }, [])

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('pigs.page.viewTitle')} pageTitle={t('menu.pigs')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title={t('pigs.page.totalPigs')} value={stats?.generalStats[0]?.totalAlive ?? 0} icon={FiCheckCircle} bgColor="#e6f7e6" iconColor="#28a745" />
                    <KPI title={t('pigs.page.avgWeightMale')} icon={FaMars} bgColor="#e8f0fa" iconColor="#1a4d8f" value={stats?.avgWeightBySex?.find((p: { _id: string }) => p._id === 'male')?.avgWeight.toFixed(2) ?? 0} />
                    <KPI title={t('pigs.page.avgWeightFemale')} icon={FaVenus} bgColor="#fde8f2" iconColor="#d63384" value={stats?.avgWeightBySex?.find((p: { _id: string }) => p._id === 'female')?.avgWeight ?? 0} />
                </div>

                <div className="d-flex gap-3">
                    <BasicPieChart
                        title={t('pigs.page.byGender')}
                        data={stats?.pigsBySex?.map((s: { _id: any; count: any }) => ({
                            id: s._id === 'male' ? t('pigs.sex.maleShort') : t('pigs.sex.femaleShort'),
                            value: s.count,
                        })) ?? []}
                    />
                    <BasicPieChart
                        title={t('pigs.page.byBreed')}
                        data={stats?.pigsByBreed?.map((s: { _id: any; count: any }) => ({ id: s._id, value: s.count })) ?? []}
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
                            <Button className="h-50 farm-primary-button ms-auto" onClick={handlePrintReport} disabled={generatingReport}>
                                {generatingReport ? <><Spinner size="sm" /> Generando...</> : <><i className="ri-download-line me-2"></i>{t('pigs.action.exportData')}</>}
                            </Button>
                            <Button className="h-50 farm-primary-button" onClick={() => toggleModal('selectCreationMode')}>
                                <i className="ri ri-add-line me-2" />{t('pigs.action.register')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={pigs.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {pigs.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">{t('pigs.page.noPigs')}</span>
                            </>
                        ) : (
                            <CustomTable columns={pigColumns} data={filteredPigs} showSearchAndFilter={false} rowsPerPage={7} showPagination={true} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('pigs.report.inventory')}</ModalHeader>
                <ModalBody>{fileURL && <PDFViewer fileUrl={fileURL} />}</ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.selectCreationMode} toggle={() => toggleModal("selectCreationMode")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("selectCreationMode")}>{t('pigs.action.selectMode')}</ModalHeader>
                <ModalBody>
                    <div className="text-center py-5">
                        <h5 className="mb-4 text-muted">{t('pigs.action.selectModeQuestion')}</h5>
                        <div className="d-flex justify-content-center gap-4">
                            <Button color="secondary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => { toggleModal('selectCreationMode'); toggleModal('createSingle') }}>
                                <FaKeyboard size={32} className="mb-2" />
                                <span>{t('pigs.action.registerSingle')}</span>
                            </Button>
                            <Button color="primary" size="lg" className="d-flex flex-column align-items-center p-4" onClick={() => { toggleModal('selectCreationMode'); toggleModal('createBatch') }}>
                                <FaListUl size={32} className="mb-2" />
                                <span>{t('pigs.action.registerBatch')}</span>
                            </Button>
                        </div>
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.createSingle} toggle={() => toggleModal("createSingle")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createSingle")}>{t('pigs.action.registerSingle')}</ModalHeader>
                <ModalBody><SinglePigForm onSave={() => { toggleModal('createSingle'); fetchData(); }} onCancel={() => toggleModal('createSingle')} /></ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.createBatch} toggle={() => toggleModal("createBatch")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("createBatch")}>{t('pigs.action.registerBatch')}</ModalHeader>
                <ModalBody><BatchPigForm onSave={() => { toggleModal('createBatch'); fetchData(); }} onCancel={() => { }} /></ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>{t('pigs.action.editPig')}</ModalHeader>
                <ModalBody>
                    {selectedPig && <PigEditForm pigData={selectedPig} onSave={() => { toggleModal('update'); fetchData() }} onCancel={() => toggleModal('update')} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewPigs
