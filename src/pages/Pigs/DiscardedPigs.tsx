import { logger } from 'utils/logger';
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
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { FaMars, FaVenus } from "react-icons/fa";
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiTrendingDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap"
import PigFilters from "Components/Common/Filters/PigFilters";
import { usePigFilters } from "hooks/usePigFilters";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { useTranslation } from "react-i18next";

const stageColorMap: Record<string, string> = {
    piglet: "info", weaning: "warning", fattening: "primary", breeder: "success",
};
const statusColorMap: Record<string, string> = {
    alive: "success", discarded: "warning", dead: "danger",
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const DiscardedPigs = () => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ discard: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigs, setPigs] = useState<PigData[]>([])
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>()

    const {
        searchTerm, setSearchTerm, filters, filteredPigs,
        popoverOpen, handleFilterChange, handleWeightRangeChange, clearFilters, togglePopover
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
        { header: t('common.field.weight'), accessor: 'weight', type: 'number' },
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

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/discarded_pigs/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('common.button.exportPdf') });
        } finally {
            setPdfLoading(false);
        }
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
            logger.error('Error fetching pigs: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('pigs.page.noDiscarded') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('pigs.page.discardedTitle')} pageTitle={t('menu.pigs')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title={t('pigs.page.totalDiscarded')} value={stats?.general[0]?.totalDiscarded ?? 0} icon={FiTrash2} bgColor="#fdecea" iconColor="#d93025" />
                    <KPI title={t('pigs.page.discardedPercent')} value={`${stats?.general[0]?.discardRate ?? 0} %`} icon={FiTrendingDown} bgColor="#fff4e5" iconColor="#f5a623" />
                </div>

                <div className="d-flex gap-3">
                    <BasicPieChart
                        title={t('pigs.page.discardedByGender')}
                        data={stats?.bySex?.map((s: { _id: any; count: any }) => ({
                            id: s._id === 'male' ? t('pigs.sex.maleShort') : t('pigs.sex.femaleShort'),
                            value: s.count,
                        })) ?? []}
                    />
                    <BasicPieChart
                        title={t('pigs.page.discardedByStage')}
                        data={stats.byStage?.map((s: { _id: any; count: any }) => ({
                            id: t(`pigs.stage.${s._id}`, { defaultValue: s._id }),
                            value: s.count,
                        })) ?? []}
                    />
                    <BasicBarChart
                        title={t('pigs.page.discardedByReason')}
                        indexBy="stage"
                        keys={["cantidad"]}
                        xLegend={t('pigs.field.stage')}
                        yLegend={t('pigs.filter.allStatus')}
                        data={stats.byReason.map((s: { _id: any; count: any }) => ({
                            stage: t(`pigs.discard.reason.${s._id.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())}`, { defaultValue: s._id }),
                            cantidad: s.count
                        }))}
                    />
                    <BasicBarChart
                        title={t('pigs.page.discardedByDestination')}
                        indexBy="destination"
                        keys={["cantidad"]}
                        xLegend={t('pigs.page.discardedByDestination')}
                        yLegend={t('pigs.filter.allStatus')}
                        data={stats.byDestination.map((s: { _id: any; count: any }) => ({
                            destination: t(`pigs.discard.destination.${s._id.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())}`, { defaultValue: s._id }),
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
                            <div className="d-flex gap-2 ms-auto">
                                <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                    {pdfLoading
                                        ? <><Spinner className="me-2" size="sm" />Generando...</>
                                        : <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                    }
                                </Button>
                                <Button className="farm-primary-button" onClick={() => toggleModal('discard')}>
                                    <i className="ri-add-line me-2" />{t('pigs.action.discardPig')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className={pigs.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {pigs.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">{t('pigs.page.noDiscarded')}</span>
                            </>
                        ) : (
                            <CustomTable columns={pigColumns} data={filteredPigs} showSearchAndFilter={false} rowsPerPage={7} showPagination={true} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.discard} toggle={() => toggleModal("discard")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("discard")}>{t('pigs.action.discardPig')}</ModalHeader>
                <ModalBody><DiscardPigForm onSave={() => { toggleModal('discard'); fetchData(); }} onCancel={() => { }} /></ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('pigs.report.discarded')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('common.button.exportPdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('pigs.report.discarded')}</ModalHeader>
                <ModalBody>{fileURL && <PDFViewer fileUrl={fileURL} />}</ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default DiscardedPigs
