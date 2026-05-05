import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicLineChartCard from "Components/Common/Graphics/BasicLineChartCard";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import PigFilters, { PigFiltersState } from "Components/Common/Filters/PigFilters";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState, useMemo } from "react";
import { FaKeyboard, FaListUl } from "react-icons/fa";
import { RiScales2Line, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { GiPig } from "react-icons/gi";
import { Badge, Card, CardBody, CardHeader, Container, Row, Col, Button, Modal, ModalHeader, ModalBody, Spinner } from "reactstrap";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import SinglePigForm from "Components/Common/Forms/SinglePigForm";
import BatchPigForm from "Components/Common/Forms/BatchPigForm";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

interface PigInventory {
    id: string;
    stage: 'piglet' | 'weaning' | 'fattening' | 'breeder';
    status: 'alive' | 'dead' | 'discarded';
    currentWeight: number;
    [key: string]: any;
}

interface GeneralStats { total: number; avgWeight: number; minWeight: number; maxWeight: number; }
interface StageStats { stage: string; count: number; avgWeight?: number; }
interface PigStats { generalStats: GeneralStats[]; inventoryByStage: StageStats[]; avgWeightByStage: StageStats[]; [key: string]: any; }

const stageColorMap: Record<string, string> = {
    piglet: "#38bdf8", weaning: "#fbbf24", fattening: "#818cf8", breeder: "#34d399",
};
const stageBadgeColorMap: Record<string, string> = {
    piglet: "info", weaning: "warning", fattening: "primary", breeder: "success",
};
const statusBadgeColorMap: Record<string, string> = {
    dead: "danger", alive: "success", discarded: "warning",
};

const InventoryPigs = () => {
    document.title = 'Inventario de cerdos | Management System'
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ update: false, viewPDF: false, selectMedicationMode: false, asignSingle: false, medicationPackage: false, selectCreationMode: false, createSingle: false, createBatch: false });
    const [pigsInventory, setPigsInventory] = useState<PigInventory[]>([])
    const [pigStats, setPigStats] = useState<PigStats | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [filters, setFilters] = useState<PigFiltersState>({ status: '', currentStage: '', origin: '', sex: '', breed: '', weightRange: [0, 500] })
    const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleFilterChange = (filterName: string, value: any) => {
        setFilters(prev => ({ ...prev, [filterName]: value }))
    }

    const handleWeightRangeChange = (value: number | number[]) => {
        setFilters(prev => ({ ...prev, weightRange: value as [number, number] }))
    }

    const handleClearFilters = () => {
        setFilters({ status: '', currentStage: '', origin: '', sex: '', breed: '', weightRange: [0, 500] })
        setSearchTerm('')
    }

    const filteredPigs = useMemo(() => {
        return pigsInventory.filter(pig => {
            const matchesSearch = searchTerm === '' ||
                pig.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pig.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pig.currentWeight?.toString().includes(searchTerm)
            const matchesStatus = filters.status === '' || pig.status === filters.status
            const matchesStage = filters.currentStage === '' || pig.stage === filters.currentStage
            const matchesWeight = pig.currentWeight >= filters.weightRange[0] && pig.currentWeight <= filters.weightRange[1]
            return matchesSearch && matchesStatus && matchesStage && matchesWeight
        })
    }, [pigsInventory, searchTerm, filters])

    const pigsInventoryColumns: Column<PigInventory>[] = [
        {
            header: t('pigs.field.stage'),
            accessor: 'stage',
            render: (value: string) => (
                <Badge color={stageBadgeColorMap[value] || "secondary"}>
                    {t(`pigs.stage.${value}`, { defaultValue: value })}
                </Badge>
            ),
        },
        {
            header: t('pigs.field.status'),
            accessor: 'status',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Badge color={statusBadgeColorMap[row.status] || "secondary"}>
                    {t(`pigs.status.${row.status}`, { defaultValue: row.status })}
                </Badge>
            ),
        },
        { header: t('pigs.field.currentWeight'), accessor: 'currentWeight', type: 'number' },
    ]

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            setAlertConfig({ visible: false, color: '', message: '' })
            if (!userLogged?.farm_assigned) throw new Error('No hay una granja asignada al usuario')
            const [pigsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/find_by_farm/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig_inventory/get_inventory_pig_stats/${userLogged.farm_assigned}`)
            ])
            if (!pigsResponse.data?.data) throw new Error('No se pudieron obtener los datos del inventario')
            if (!statsResponse.data?.data) throw new Error('No se pudieron obtener las estadísticas')
            setPigsInventory(pigsResponse.data.data)
            setPigStats(statsResponse.data.data)
        } catch (error: any) {
            logger.error('Error fetching data:', error)
            const errorMessage = error.response?.status === 404
                ? t('common.status.noData')
                : error.response?.status === 403
                    ? t('common.status.noData')
                    : (error.message || t('common.status.noData'))
            setAlertConfig({ visible: true, color: error.response?.status ? 'warning' : 'danger', message: errorMessage })
        } finally {
            setLoading(false)
        }
    }

    const handleGeneratePDF = async () => {
        if (!configContext) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/pig_inventory?farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('common.button.exportPdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [])

    if (loading) return <LoadingAnimation />

    const generalStats = pigStats?.generalStats[0];
    const monthlyComparison = pigStats?.monthlyComparison?.[0];
    const trendPercent = monthlyComparison?.percentageChange ?? 0;

    const stageDonutData: DonutDataItem[] = (pigStats?.inventoryByStage ?? []).map((s: StageStats) => ({
        id: t(`pigs.stage.${s.stage}`, { defaultValue: s.stage }),
        label: t(`pigs.stage.${s.stage}`, { defaultValue: s.stage }),
        value: s.count,
        color: stageColorMap[s.stage] || "#94a3b8",
    }));

    const stageLegendItems: DonutLegendItem[] = (pigStats?.inventoryByStage ?? []).map((s: StageStats) => {
        const total = generalStats?.total || 1;
        return {
            label: t(`pigs.stage.${s.stage}`, { defaultValue: s.stage }),
            value: s.count,
            percentage: `${((s.count / total) * 100).toFixed(1)}%`,
        };
    });

    const weightBarData = (pigStats?.avgWeightByStage ?? []).map((s: StageStats) => ({
        stage: t(`pigs.stage.${s.stage}`, { defaultValue: s.stage }),
        [t('pigs.page.avgWeight')]: Number((s.avgWeight || 0).toFixed(1)),
    }));

    const inventoryByDay = pigStats?.inventoryByDay ?? [];
    const lineChartData = inventoryByDay.length > 0
        ? [{ id: t('menu.pigs'), data: inventoryByDay.map((d: any) => ({ x: d._id, y: d.count })) }]
        : [];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('pigs.page.inventoryTitle')} pageTitle={t('menu.pigs')} />

                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

                <Row className="g-3 mb-3" style={{ minHeight: "140px" }}>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard title={t('pigs.page.totalInventory')} value={generalStats?.total ?? 0} icon={<GiPig size={22} color="#2563EB" />} iconBgColor="#EFF6FF" animateValue trendPercent={trendPercent} trendLabel="vs. mes anterior" trendVariant={trendPercent >= 0 ? "success" : "danger"} className="w-100" />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard title={t('pigs.page.avgWeight')} value={generalStats?.avgWeight ?? 0} suffix=" kg" icon={<RiScales2Line size={22} color="#0284C7" />} iconBgColor="#E0F2FE" animateValue decimals={1} className="w-100" />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard title={t('pigs.page.minWeight')} value={generalStats?.minWeight ?? 0} suffix=" kg" icon={<RiArrowDownLine size={22} color="#D97706" />} iconBgColor="#FEF3C7" animateValue decimals={1} className="w-100" />
                    </Col>
                    <Col xs={12} sm={6} xl={3} className="d-flex">
                        <StatKpiCard title={t('pigs.page.maxWeight')} value={generalStats?.maxWeight ?? 0} suffix=" kg" icon={<RiArrowUpLine size={22} color="#16A34A" />} iconBgColor="#ECFDF5" animateValue decimals={1} className="w-100" />
                    </Col>
                </Row>

                <Row className="g-3 mb-3" style={{ minHeight: "420px" }}>
                    <Col xs={12} lg={4} className="d-flex">
                        <DonutChartCard title={t('pigs.page.stageDistribution')} data={stageDonutData} legendItems={stageLegendItems} height={260} className="w-100" />
                    </Col>
                    <Col xs={12} lg={4} className="d-flex">
                        <BasicBarChart
                            title={t('pigs.page.avgWeightByStage')}
                            data={weightBarData}
                            indexBy="stage"
                            keys={[t('pigs.page.avgWeight')]}
                            xLegend={t('pigs.field.stage')}
                            yLegend="Kg"
                            height={320}
                            colors={({ index }: { index: number }) => {
                                const stages = pigStats?.avgWeightByStage ?? [];
                                return stageColorMap[stages[index]?.stage] || "#94a3b8";
                            }}
                        />
                    </Col>
                    <Col xs={12} lg={4} className="d-flex">
                        <BasicLineChartCard
                            title={t('pigs.page.inventoryOverTime')}
                            data={lineChartData}
                            yLabel={t('menu.pigs')}
                            xLabel={t('common.field.date')}
                            height={320}
                            color="#6366f1"
                            enableArea
                            areaOpacity={0.15}
                            curve="monotoneX"
                            emptyMessage={t('common.status.noData')}
                        />
                    </Col>
                </Row>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('pigs.page.inventoryTitle')}</h5>
                        <div className="d-flex gap-2">
                            <Button color="primary" onClick={handleGeneratePDF} disabled={pdfLoading}>
                                {pdfLoading
                                    ? <><Spinner className="me-2" size='sm' />Generando...</>
                                    : <><i className="ri-file-pdf-line me-2"></i>{t('common.button.exportPdf')}</>
                                }
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('selectCreationMode')}>
                                <i className="ri ri-add-line me-2" />{t('pigs.action.register')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="mb-3">
                            <PigFilters
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onWeightRangeChange={handleWeightRangeChange}
                                onClearFilters={handleClearFilters}
                                popoverOpen={popoverOpen}
                                onTogglePopover={() => setPopoverOpen(!popoverOpen)}
                            />
                        </div>
                        {filteredPigs.length > 0 ? (
                            <CustomTable columns={pigsInventoryColumns} data={filteredPigs} showPagination={true} rowsPerPage={10} showSearchAndFilter={false} fontSize={13} />
                        ) : (
                            <div className="text-center py-4">
                                <h5 className="text-muted">
                                    {pigsInventory.length > 0 ? t('pigs.page.noMatch') : t('pigs.page.noInventory')}
                                </h5>
                                <p className="text-muted">
                                    {pigsInventory.length > 0 ? t('pigs.filter.clear') : t('common.status.noData')}
                                </p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

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

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('pigs.report.inventoryPigs')}</ModalHeader>
                <ModalBody>{fileURL && <PDFViewer fileUrl={fileURL} />}</ModalBody>
            </Modal>
        </div>
    )
}

export default InventoryPigs;
