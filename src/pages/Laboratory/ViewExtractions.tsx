import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getEffectiveUser } from "helpers/impersonation_helper"
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip, Spinner } from "reactstrap"
import { FiCheckCircle, FiAlertCircle, FiInfo, FiInbox } from "react-icons/fi";
import { ExtractionData } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BoarVolumeRadar from "Components/Common/Graphics/BoarVolumeRadar";
import ExtractionForm from "Components/Common/Forms/ExtractionForm";
import ExtractionDetails from "Components/Common/Details/ExtractionDetails";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import SemenSampleForm from "Components/Common/Forms/SemenSampleForm";
import { useTranslation } from "react-i18next";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewExtractions = () => {
    const { t } = useTranslation();
    document.title = t('laboratory.extraction.pageTitle')
    const userLoggged = getEffectiveUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [extractions, setExtractions] = useState<ExtractionData[] | null>(null)
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, pigDetails: false, extractionDetails: false, dateRange: false, registerSample: false });
    const [stats, setStats] = useState<any>({})
    const [selectedExtraction, setSelectedExtraction] = useState<any>({})
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string>('');

    const extractionsColumns: Column<any>[] = [
        { header: t('laboratory.extraction.column.batch'), accessor: 'batch', type: 'text', isFilterable: true },
        { header: t('laboratory.extraction.column.date'), accessor: 'date', type: 'date', isFilterable: false },
        {
            header: t('laboratory.extraction.column.boar'),
            accessor: 'boar',
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExtraction(row);
                        toggleModal('extractionDetails')
                    }}
                >
                    {row.boar?.code} ↗
                </Button>
            )
        },
        {
            header: t('laboratory.extraction.column.technician'),
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : t('laboratory.extraction.noResponsible')
        },
        { header: t('laboratory.extraction.column.location'), accessor: 'extraction_location', type: 'text', isFilterable: true },
        {
            header: t('laboratory.extraction.column.sampleRegistered'),
            accessor: 'is_sample_registered',
            type: 'text',
            isFilterable: true,
            render: (_, obj) => (
                <Badge color={obj.is_sample_registered ? 'success' : 'warning'}>{obj.is_sample_registered ? t('common.yes') : t('common.no')}</Badge>
            )
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button
                        id={`register-sample-button-${row._id}`}
                        className="farm-secondary-button btn-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExtraction(row);
                            toggleModal('registerSample')
                        }}
                        disabled={row.is_sample_registered}
                    >
                        <i className="ri-test-tube-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`register-sample-button-${row._id}`}>
                        {row.is_sample_registered ? t('laboratory.extraction.tooltip.alreadyRegistered') : t('laboratory.extraction.tooltip.registerSample')}
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedExtraction(row); toggleModal('extractionDetails') }} >
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        {t('common.button.viewDetails')}
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);

            const response = await configContext.axiosHelper.getBlob(
                appendLangParam(`${configContext.apiUrl}/reports/extractions/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLoggged.farm_assigned}`)
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.extraction.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLoggged) return;
        try {
            setLoading(true);
            const [extractionsResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_farm/${userLoggged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/stadistics/${userLoggged.farm_assigned}`)
            ])

            setExtractions(extractionsResponse.data.data)
            setStats(statsResponse.data.data)
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.extraction.error.fetchData') })
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('laboratory.extraction.breadcrumb.title')} pageTitle={t('laboratory.extraction.breadcrumb.parent')} />

                <div className="d-flex flex-wrap gap-3">
                    {stats.extractionsByDay && (
                        <KPI
                            title={t('laboratory.extraction.kpi.totalExtractions')}
                            value={stats.extractionsByDay.reduce((sum: number, e: any) => sum + e.count, 0)}
                            icon={FiAlertCircle}
                            bgColor="#e6f0ff"
                            iconColor="#0d6efd"
                        />
                    )}

                    {stats.volumeByDay && (
                        <KPI
                            title={t('laboratory.extraction.kpi.totalVolume')}
                            value={`${stats.volumeByDay.reduce((sum: number, v: any) => sum + v.totalVolume, 0)} ml`}
                            icon={FiInfo}
                            bgColor="#fff4e6"
                            iconColor="#ffc107"
                        />
                    )}

                    {stats.volumeByDay && stats.extractionsByDay && (
                        <KPI
                            title={t('laboratory.extraction.kpi.avgVolume')}
                            value={(() => {
                                const totalVol = stats.volumeByDay.reduce((sum: number, v: any) => sum + v.totalVolume, 0);
                                const totalExt = stats.extractionsByDay.reduce((sum: number, e: any) => sum + e.count, 0);
                                return totalExt > 0 ? `${(totalVol / totalExt).toFixed(1)} ml` : "0 ml";
                            })()}
                            icon={FiInfo}
                            bgColor="#eaf9ff"
                            iconColor="#0dcaf0"
                        />
                    )}

                    {stats.volumeByDay && stats.volumeByDay.length > 0 && (() => {
                        const maxDay = stats.volumeByDay.reduce((prev: any, curr: any) => curr.totalVolume > prev.totalVolume ? curr : prev);
                        return (
                            <KPI
                                title={t('laboratory.extraction.kpi.maxVolumeDay')}
                                value={`${maxDay.totalVolume} ml`}
                                subtext={maxDay._id}
                                icon={FiInfo}
                                bgColor="#f3e6ff"
                                iconColor="#6f42c1"
                            />
                        );
                    })()}

                    {stats.volumeByDay && stats.volumeByDay.length > 0 && (() => {
                        const minDay = stats.volumeByDay.reduce((prev: any, curr: any) => curr.totalVolume < prev.totalVolume ? curr : prev);
                        return (
                            <KPI
                                title={t('laboratory.extraction.kpi.minVolumeDay')}
                                value={`${minDay.totalVolume} ml`}
                                subtext={minDay._id}
                                icon={FiInfo}
                                bgColor="#ffe6e6"
                                iconColor="#dc3545"
                            />
                        );
                    })()}
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard
                        stats={stats}
                        type="volume"
                        title={t('laboratory.extraction.chart.volume')}
                        yLabel={t('laboratory.extraction.chart.volumeLabel')}
                        color="#ffc107"
                    />

                    <LineChartCard
                        stats={stats}
                        type="extractions"
                        title={t('laboratory.extraction.chart.extractions')}
                        yLabel={t('laboratory.extraction.chart.extractionsLabel')}
                        color="#198754"
                    />

                    <BoarVolumeRadar data={stats.volumeStatsByBoar} />
                </div>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h4>{t('laboratory.extraction.breadcrumb.parent')}</h4>
                        <div className="d-flex gap-2">
                            <Button
                                color="secondary"
                                className="btn-pdf"
                                onClick={() => toggleModal('dateRange')}
                                disabled={pdfLoading}
                            >
                                {pdfLoading ? (
                                    <>
                                        <Spinner className="me-2" size='sm' />
                                        {t('common.button.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        {t('common.button.exportPdf')}
                                    </>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                {t('laboratory.extraction.action.new')}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {extractions && extractions.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <CustomTable columns={extractionsColumns} data={extractions} showPagination={true} rowsPerPage={7} />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>{t('laboratory.extraction.empty')}</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('laboratory.extraction.modal.create')}</ModalHeader>
                <ModalBody>
                    <ExtractionForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>{t('laboratory.extraction.modal.pigDetails')}</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedExtraction.boar?._id} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.extractionDetails} toggle={() => toggleModal("extractionDetails")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("extractionDetails")}>{t('laboratory.extraction.modal.extractionDetails')}</ModalHeader>
                <ModalBody>
                    <ExtractionDetails extractionId={selectedExtraction?._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('laboratory.extraction.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('laboratory.extraction.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('laboratory.extraction.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.registerSample} toggle={() => toggleModal("registerSample")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("registerSample")}>{t('laboratory.extraction.modal.registerSample')}</ModalHeader>
                <ModalBody>
                    <SemenSampleForm
                        preselectedExtraction={selectedExtraction}
                        onSave={() => { toggleModal('registerSample'); fetchData(); }}
                        onCancel={() => toggleModal('registerSample')}
                    />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}
        </div>
    )
}

export default ViewExtractions
