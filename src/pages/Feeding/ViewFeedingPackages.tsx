import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import FeedingPackageDetails from "Components/Common/Details/FeedingPackageDetails";
import FeedingPackageForm from "Components/Common/Forms/FeedingPackageForm";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { FiInbox } from "react-icons/fi";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { useTranslation } from "react-i18next";

const stageColorMap: Record<string, string> = {
    general: "info", piglet: "info", weaning: "warning", fattening: "primary", breeder: "success",
};

const ViewFeedingPackages = () => {
    const { t } = useTranslation();
    document.title = t('feeding.package.pageTitle') + ' | System Management';
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ create: false, details: false, update: false, dateRange: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const feedingPackagesColumns: Column<any>[] = [
        { header: t('feeding.package.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('feeding.package.column.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('feeding.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: t('feeding.package.column.createdBy'),
            accessor: 'creation_responsible',
            type: 'text',
            isFilterable: true,
            render: (_, row) => <span>{row.creation_responsible.name} {row.creation_responsible.lastname}</span>
        },
        {
            header: t('feeding.package.column.stage'),
            accessor: 'stage',
            type: 'text',
            render: (_, row) => (
                <Badge color={stageColorMap[row.stage] || "secondary"}>
                    {t(`feeding.stage.${row.stage}`, { defaultValue: t('feeding.stage.unknown') })}
                </Badge>
            ),
        },
        {
            header: t('feeding.package.column.status'),
            accessor: 'is_active',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>
                    {value ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
        },
        {
            header: t('feeding.package.column.actions'),
            accessor: "action",
            render: (_value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" title={t('feeding.package.action.viewDetails')} onClick={() => { setSelectedFeedingPackage(row); toggleModal('details'); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <Button color="warning" className="btn-icon" title={t('feeding.package.action.edit')} onClick={() => { setSelectedFeedingPackage(row); toggleModal('update'); }}>
                        <i className="ri-pencil-line align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/feeding_packages/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
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
            const feedingResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findByFarm(userLogged.farm_assigned)}`);
            setFeedingPackages(feedingResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('feeding.package.breadcrumb')} pageTitle={t('menu.feeding')} />
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
                                <i className="ri-add-line me-2" />{t('feeding.package.create')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={feedingPackages.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {feedingPackages.length === 0 ? (
                            <><FiInbox className="text-muted" size={48} style={{ marginBottom: 10 }} /><span className="fs-5 text-muted">{t('feeding.package.noRecords')}</span></>
                        ) : (
                            <CustomTable columns={feedingPackagesColumns} data={feedingPackages} showPagination rowsPerPage={10} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>{t('feeding.package.createModal')}</ModalHeader>
                <ModalBody><FeedingPackageForm onSave={() => { toggleModal('create'); fetchData(); }} onCancel={() => toggleModal('create', false)} /></ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>{t('feeding.package.editModal')}</ModalHeader>
                <ModalBody>
                    {selectedFeedingPackage?._id && (
                        <FeedingPackageForm feedingPackageId={selectedFeedingPackage._id} onSave={() => { toggleModal('update'); fetchData(); }} onCancel={() => toggleModal('update', false)} />
                    )}
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => { toggleModal("details"); fetchData(); }}>{t('feeding.package.detailsModal')}</ModalHeader>
                <ModalBody><FeedingPackageDetails feedingPackageId={selectedFeedingPackage?._id} /></ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('feeding.package.dateRangeModal')}</ModalHeader>
                <ReportDateRangeSelector onGenerate={handleGeneratePDF} onCancel={() => toggleModal("dateRange")} loading={pdfLoading} generateButtonText={t('common.button.exportPdf')} />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('feeding.package.reportModal')}</ModalHeader>
                <ModalBody>{fileURL && <PDFViewer fileUrl={fileURL} />}</ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default ViewFeedingPackages;
