import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getEffectiveUser } from "helpers/impersonation_helper";
import PregnancyDetails from "Components/Common/Details/PregnancyDetails";
import { useContext, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, UncontrolledTooltip, Spinner } from "reactstrap";
import BirthDetails from "Components/Common/Details/BirthDetailsModal";
import CustomTable from "Components/Common/Tables/CustomTable";
import KPI from "Components/Common/Graphics/Kpi";
import { FaBaby, FaBabyCarriage, FaBiohazard, FaClipboardList, FaClock, FaExclamationTriangle, FaHeartbeat, FaPiggyBank, FaSkullCrossbones } from "react-icons/fa";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import { ResponsiveBar } from "@nivo/bar";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const BIRTH_TYPE_COLORS: Record<string, string> = {
    normal: 'success', cesarean: 'primary', abortive: 'danger',
    dystocia: 'warning', induced: 'info',
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewBirths = () => {
    const { t } = useTranslation();
    document.title = `${t("birth.breadcrumb.title")} | ${t("systemName")}`;
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser()
    const navigate = useNavigate();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [births, setBirths] = useState<any[]>([]);
    const [modals, setModals] = useState({ pregnancyDetails: false, birthDetails: false, dateRange: false, viewPDF: false })
    const [selectedBirth, setSelectedBirth] = useState<any>({})
    const [birthStats, setBirthStats] = useState<any>({})
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const BirthsColumns: Column<any>[] = [
        {
            header: t('birth.column.sow'),
            accessor: "sow",
            type: "text",
            bgColor: '#E8F5E9',
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
        { header: t('birth.column.birthDate'), accessor: 'birth_date', type: 'date', isFilterable: true, bgColor: '#E3F2FD' },
        {
            header: t('birth.column.birthType'),
            accessor: 'birth_type',
            type: 'text',
            isFilterable: true,
            bgColor: '#F3E5F5',
            render: (value: string) => {
                const color = BIRTH_TYPE_COLORS[value] || 'secondary';
                const label = t(`birth.type.${value}`, { defaultValue: t('birth.type.unspecified') });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('birth.column.assisted'),
            accessor: 'assisted',
            type: 'text',
            isFilterable: true,
            bgColor: '#FFF3E0',
            render: (_, obj) => (
                <Badge color={obj.assisted ? 'success' : 'warning'}>
                    {obj.assisted ? t('birth.assisted.yes') : t('birth.assisted.no')}
                </Badge>
            )
        },
        {
            header: t('birth.column.responsible'),
            accessor: 'responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => <span className="text-black">{row.responsible.name} {row.responsible.lastname}</span>
        },
        {
            header: t('birth.column.pregnancy'),
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
                    {t('birth.column.pregnancyLink')}
                </Button>
            )
        },
        {
            header: t('birth.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={() => { setSelectedBirth(row); toggleModal('birthDetails') }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`}>
                        {t('birth.action.viewDetails')}
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
            logger.error('Error fetching data:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('birth.error.load') })
        } finally {
            setLoading(false)
        }
    }

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);

            const response = await configContext.axiosHelper.getBlob(
                appendLangParam(`${configContext.apiUrl}/reports/farrowed-births?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`)
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('birth.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('birth.breadcrumb.title')} pageTitle={t('birth.breadcrumb.parent')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI title={t('birth.kpi.total')} value={birthStats?.operationalKpis?.[0]?.totalBirths ?? 0} icon={FaPiggyBank} bgColor="#e8f0fe" iconColor="#0d6efd" />
                    <KPI title={t('birth.kpi.mortalityRate')} value={`${(birthStats?.operationalKpis?.[0]?.mortalityRate.toFixed(2) ?? 0)}%`} icon={FaSkullCrossbones} bgColor="#fdecea" iconColor="#dc3545" />
                    <KPI title={t('birth.kpi.stillbornRate')} value={`${(birthStats?.operationalKpis?.[0]?.stillbornRate.toFixed(2) ?? 0)}%`} icon={FaBabyCarriage} bgColor="#fff3cd" iconColor="#ff8800" />
                    <KPI title={t('birth.kpi.mummiesRate')} value={`${(birthStats?.operationalKpis?.[0]?.mummiesRate.toFixed(2) ?? 0)}%`} icon={FaBiohazard} bgColor="#f8d7da" iconColor="#b02a37" />
                    <KPI title={t('birth.kpi.stillbornAndMummies')} value={((birthStats?.birthStats?.[0]?.totalStillborn ?? 0) + (birthStats?.birthStats?.[0]?.totalMummies ?? 0))} icon={FaExclamationTriangle} bgColor="#f3e5f5" iconColor="#9c27b0" />
                    <KPI title={t('birth.kpi.avgBornAlive')} value={birthStats?.operationalKpis?.[0]?.avgBornAlivePerBirth.toFixed(2) ?? 0} icon={FaBaby} bgColor="#e6f7e6" iconColor="#28a745" />
                </div>

                <div className="d-flex gap-3">
                    <BasicBarChart
                        title={t('birth.chart.bySow')}
                        data={birthStats?.reproductiveStatsBySow?.map((sow: any) => ({
                            cerda: sow.sowCode,
                            [t('birth.chart.bornAlive')]: sow.avgBornAlive,
                            [t('birth.chart.stillborn')]: sow.avgStillborn,
                            [t('birth.chart.mummies')]: sow.avgMummies,
                        })) ?? []}
                        indexBy="cerda"
                        keys={[t('birth.chart.bornAlive'), t('birth.chart.stillborn'), t('birth.chart.mummies')]}
                        xLegend={t('birth.chart.sow')}
                        yLegend={t('birth.chart.avgPerBirth')}
                    />

                    <BasicPieChart
                        title={t('birth.chart.byType')}
                        data={
                            (birthStats?.statsByBirthType ?? []).map((item: any) => ({
                                id: t(`birth.type.${item.birthType}`, { defaultValue: item.birthType }),
                                value: item.totalBirths,
                            }))
                        }
                    />
                </div>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5>{t('birth.card.registered')}</h5>
                        <Button
                            color="primary"
                            onClick={() => toggleModal("dateRange")}
                            disabled={pdfLoading}
                        >
                            {pdfLoading ? (
                                <>
                                    <Spinner className="me-2" size='sm' />
                                    {t('birth.action.generating')}
                                </>
                            ) : (
                                <>
                                    <i className="ri-file-pdf-line me-2"></i>
                                    {t('birth.action.exportPdf')}
                                </>
                            )}
                        </Button>
                    </CardHeader>
                    <CardBody className={births.length === 0 ? 'd-flex justify-content-center align-items-center' : ''}>
                        {births.length === 0 ? (
                            <>
                                <FiAlertCircle className="text-muted" size={22} />
                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                    {t('birth.empty.noBirths')}
                                </span>
                            </>
                        ) : (
                            <CustomTable columns={BirthsColumns} data={births} showSearchAndFilter={false} showPagination={true} rowsPerPage={7} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal isOpen={modals.pregnancyDetails} toggle={() => toggleModal('pregnancyDetails')} size="xl" centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('pregnancyDetails')}>
                    <h5>{t('birth.modal.pregnancyDetails')}</h5>
                </ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedBirth.pregnancy} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.birthDetails} toggle={() => toggleModal('birthDetails')} size="xl" centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('birthDetails')}>
                    <h5>{t('birth.modal.birthDetails')}</h5>
                </ModalHeader>
                <ModalBody>
                    <BirthDetails birthId={selectedBirth._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('birth.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('birth.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('birth.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

        </div>
    )
}

export default ViewBirths;
