import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import FeedPreparationDetails from "Components/Common/Details/FeedPreparationDetails";
import FeedPreparationForm from "Components/Common/Forms/FeedPreparationForm";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEED_PREPARATION_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { useTranslation } from "react-i18next";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewFeedPreparations = () => {
    const { t } = useTranslation();
    document.title = t('feeding.preparation.pageTitle') + ' | System Management';
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [loading, setLoading] = useState<boolean>(true);
    const [preparations, setPreparations] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ create: false, details: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [selectedPreparation, setSelectedPreparation] = useState<any>(null);

    const toggleModal = (m: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [m]: state ?? !prev[m] }));
    };

    const columns: Column<any>[] = [
        { header: t('feeding.preparation.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        {
            header: t('feeding.preparation.column.recipe'), accessor: 'recipe.name', isFilterable: true,
            render: (_, row) => <span>{row.recipe?.code} — {row.recipe?.name}</span>
        },
        { header: t('feeding.preparation.column.date'), accessor: 'preparationDate', type: 'date', isFilterable: true },
        {
            header: t('feeding.preparation.column.mixPrepared'), accessor: 'batchSize', type: 'number', bgColor: '#e3f2fd',
            render: (_, row) => <span className="fw-medium">{(row.batchSize ?? 0).toFixed(2)}</span>
        },
        {
            header: t('feeding.preparation.column.produced'), accessor: 'actualYield', type: 'number', bgColor: '#e8f5e9',
            render: (_, row) => <span className="fw-medium">{(row.actualYield ?? 0).toFixed(2)}</span>
        },
        {
            header: t('feeding.preparation.column.waste'), accessor: 'shrinkagePercentage',
            render: (_, row) => (
                <Badge color={(row.shrinkagePercentage ?? 0) > 5 ? 'warning' : 'success'}>
                    {(row.shrinkagePercentage ?? 0).toFixed(2)}%
                </Badge>
            )
        },
        {
            header: t('feeding.preparation.column.totalCost'), accessor: 'totalCost', type: 'number', bgColor: '#f3e5f5',
            render: (_, row) => <span className="fw-semibold">${(row.totalCost ?? 0).toFixed(2)}</span>
        },
        {
            header: t('feeding.preparation.column.costPerKg'), accessor: 'costPerKg', type: 'number', bgColor: '#e0f7fa',
            render: (_, row) => <span className="fw-medium">${(row.costPerKg ?? 0).toFixed(2)}</span>
        },
        {
            header: t('feeding.preparation.column.responsible'), accessor: 'responsible.name',
            render: (_, row) => <span>{row.responsible?.name} {row.responsible?.lastname}</span>
        },
        {
            header: t('feeding.preparation.column.actions'), accessor: 'action',
            render: (_, row) => (
                <Button className="farm-primary-button btn-icon" title={t('feeding.package.action.viewDetails')} onClick={() => { setSelectedPreparation(row); toggleModal('details'); }}>
                    <i className="ri-eye-fill align-middle"></i>
                </Button>
            ),
        },
    ];

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/feed_preparations/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
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
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEED_PREPARATION_URLS.findByFarm(userLogged.farm_assigned)}`);
            setPreparations(response.data.data || []);
        } catch (error) {
            logger.error('Error fetching preparations:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('feeding.preparation.breadcrumb')} pageTitle={t('menu.feeding')} />
                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex gap-2 justify-content-end">
                            <Button color="primary" onClick={() => toggleModal('dateRange')} disabled={pdfLoading}>
                                {pdfLoading
                                    ? <><Spinner className="me-2" size="sm" />Generando...</>
                                    : <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                }
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />{t('feeding.preparation.create')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={preparations.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : ""}>
                        {preparations.length === 0 ? (
                            <><FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} /><span className="fs-5 text-muted">{t('feeding.preparation.noRecords')}</span></>
                        ) : (
                            <CustomTable columns={columns} data={preparations} showPagination rowsPerPage={10} fontSize={14} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('feeding.preparation.createModal')}</ModalHeader>
                <ModalBody><FeedPreparationForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create', false)} /></ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("details")}>{t('feeding.preparation.detailModal')}</ModalHeader>
                <ModalBody>{selectedPreparation?._id && <FeedPreparationDetails preparationId={selectedPreparation._id} />}</ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('feeding.preparation.dateRangeModal')}</ModalHeader>
                <ReportDateRangeSelector onGenerate={handleGeneratePDF} onCancel={() => toggleModal("dateRange")} loading={pdfLoading} generateButtonText={t('common.button.exportPdf')} />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('feeding.preparation.reportModal')}</ModalHeader>
                <ModalBody>{fileURL && <PDFViewer fileUrl={fileURL} />}</ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default ViewFeedPreparations;
