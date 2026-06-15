import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { useContext, useEffect, useState } from "react"
import {
    Button, Card, CardBody, CardHeader, Container,
    Modal, ModalBody, ModalHeader, Spinner, Badge
} from "reactstrap"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import 'simplebar-react/dist/simplebar.min.css';
import { Column } from "common/data/data_types"
import SelectableCustomTable from "Components/Common/Tables/SelectableTable"
import BulkPigMedicationAssignmentModal from "Components/Common/Forms/BulkPigMedicationAssignmentModal"
import BulkFeedAdministrationModal from "Components/Common/Forms/BulkFeedAdministrationModal"
import PDFViewer from "Components/Common/Shared/PDFViewer"
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation"
import AlertMessage from "Components/Common/Shared/AlertMesagge"
import { FaVenus } from "react-icons/fa"
import KPI from "Components/Common/Graphics/Kpi"
import BasicPieChart from "Components/Common/Graphics/BasicPieChart"
import PigFilters, { PigFiltersState } from "Components/Common/Filters/PigFilters"
import { useTranslation } from "react-i18next"
import AssignEarTagForm from "Components/Common/Forms/AssignEarTagForm"
import PigEditForm from "Components/Common/Forms/PigEditForm"

const STAGE_COLORS: Record<string, string> = {
    piglet: 'info', weaning: 'warning', fattening: 'primary', breeder: 'success',
};
const STATUS_COLORS: Record<string, string> = {
    alive: 'success', discarded: 'warning', dead: 'danger',
};

const ViewSows = () => {
    const { t } = useTranslation();
    const [modals, setModals] = useState({ viewPDF: false, assignEarTag: false, update: false, bulkMedication: false, bulkFeeding: false });
    const [selectedPigs, setSelectedPigs] = useState<any[]>([]);
    const hasAlivePigs = selectedPigs.some(pig => pig.status === 'alive');
    const [selectedPig, setSelectedPig] = useState<PigData | null>(null)
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
    const [filters, setFilters] = useState<PigFiltersState>({
        status: "",
        currentStage: "",
        origin: "",
        sex: "",
        breed: "",
        weightRange: [0, 500]
    })
    const [popoverOpen, setPopoverOpen] = useState(false)
    const navigate = useNavigate();

    const predefinedBreeds = [
        "Yorkshire", "Landrace", "Duroc", "Hampshire", "Pietrain",
        "Berkshire", "Large White", "Chester White", "Poland China", "Tamworth"
    ]

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
                    {!row.earTag && row.status === 'alive' && (
                        <Button
                            className="btn-icon"
                            color="warning"
                            title={t('replacement.earTag.assignTooltip')}
                            onClick={() => { setSelectedPig(row); toggleModal('assignEarTag'); }}
                        >
                            <i className="ri-price-tag-3-line align-middle"></i>
                        </Button>
                    )}
                    <Button className="farm-secondary-button btn-icon" onClick={() => { setSelectedPig(row); toggleModal('update'); }} disabled={row.status !== 'alive'}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>
                    <Button className="farm-primary-button btn-icon" onClick={() => navigate(`/pigs/pig_details/${row._id}`)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
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

    const handleGeneratePDF = async () => {
        if (!configContext) return;

        setGeneratingReport(true);
        try {
            const response = await configContext.axiosHelper.getBlob(
                appendLangParam(`${configContext.apiUrl}/reports/breeder_pigs/${userLogged.farm_assigned}?sex=female`)
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
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
                        value={`${stats?.avgWeightBySex?.find((p: { _id: string }) => p._id === 'female')?.avgWeight ?? 0} kg`}
                    />
                </div>

                <div className="d-flex gap-3">
                    <BasicPieChart title={t('replacement.chart.byBreed')}
                        data={stats?.pigsByBreed?.map((s: { _id: any; count: any }) => ({
                            id: s._id,
                            value: s.count,
                        })) ?? []}
                    />

                    <BasicPieChart title={t('replacement.chart.byOrigin')}
                        data={stats?.pigsByOrigin?.map((s: { _id: any; count: any }) => ({
                            id: s._id === 'born' ? t('replacement.chart.born') : s._id === 'purchased' ? t('replacement.chart.purchased') : s._id,
                            value: s.count,
                        })) ?? []}
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
                                onTogglePopover={() => setPopoverOpen(!popoverOpen)}
                                predefinedBreeds={predefinedBreeds}
                            />

                            {selectedPigs.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedPigs.length} {selectedPigs.length === 1 ? t('replacement.bulk.selected.singular') : t('replacement.bulk.selected.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-primary-button btn-sm"
                                            disabled={!hasAlivePigs}
                                            title={!hasAlivePigs ? t('replacement.bulk.tooltip.noAliveMedication') : undefined}
                                            onClick={() => toggleModal('bulkMedication')}
                                        >
                                            <i className="ri-medicine-bottle-line me-1"></i>
                                            {t('replacement.bulk.assignMedication')}
                                        </Button>
                                        <Button
                                            color="info"
                                            className="btn-sm"
                                            disabled={!hasAlivePigs}
                                            title={!hasAlivePigs ? t('replacement.bulk.tooltip.noAliveFeed') : undefined}
                                            onClick={() => toggleModal('bulkFeeding')}
                                        >
                                            <i className="ri-restaurant-line me-1"></i>
                                            {t('replacement.bulk.administerFeed')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                color="secondary"
                                className="ms-auto btn-pdf"
                                onClick={handleGeneratePDF}
                                disabled={generatingReport}
                            >
                                {generatingReport ? (
                                    <>
                                        <Spinner className="me-2" size='sm' />
                                        {t('replacement.action.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        {t('replacement.action.exportPdf')}
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
                            <SelectableCustomTable
                                columns={pigColumns}
                                data={filteredPigs}
                                showSearchAndFilter={false}
                                rowsPerPage={7}
                                showPagination={true}
                                selectionMode="multiple"
                                selectionOnlyOnCheckbox={true}
                                onSelect={setSelectedPigs}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="md" isOpen={modals.assignEarTag} toggle={() => toggleModal("assignEarTag")} centered>
                <ModalHeader toggle={() => toggleModal("assignEarTag")}>{t('replacement.earTag.modalTitle')}</ModalHeader>
                <ModalBody>
                    {selectedPig && (
                        <AssignEarTagForm
                            pig={selectedPig}
                            onSave={() => { toggleModal('assignEarTag', false); fetchData(); }}
                            onCancel={() => toggleModal('assignEarTag', false)}
                        />
                    )}
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} centered>
                <ModalHeader toggle={() => toggleModal("update")}>{t('replacement.modal.editPig')}</ModalHeader>
                <ModalBody>
                    {selectedPig && (
                        <PigEditForm
                            pigData={selectedPig}
                            onSave={() => { toggleModal('update', false); fetchData(); }}
                            onCancel={() => toggleModal('update', false)}
                        />
                    )}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('replacement.modal.sowReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <BulkPigMedicationAssignmentModal
                isOpen={modals.bulkMedication}
                onClose={() => toggleModal('bulkMedication', false)}
                selectedPigs={selectedPigs}
                onSuccess={() => { setSelectedPigs([]); fetchData(); }}
            />

            <BulkFeedAdministrationModal
                isOpen={modals.bulkFeeding}
                onClose={() => toggleModal('bulkFeeding', false)}
                targetType="pig"
                selectedTargets={selectedPigs}
                onSuccess={() => { setSelectedPigs([]); fetchData(); }}
            />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSows
