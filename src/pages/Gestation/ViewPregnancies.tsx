import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Container, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, UncontrolledTooltip, Spinner } from "reactstrap"
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import PregnancyDetails from "../../Components/Common/Details/PregnancyDetails";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { FiInbox } from "react-icons/fi";
import KPI from "Components/Common/Graphics/Kpi";
import { FaBaby, FaChartBar, FaChartLine, FaCheckCircle, FaClipboardList, FaClock, FaExclamationTriangle, FaHeartbeat } from "react-icons/fa";
import { transformPregnancyStatsForChart } from "Components/Hooks/transformPregnancyStats";
import { ResponsiveLine } from "@nivo/line";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import AbortionForm from "Components/Common/Forms/AbortionForm";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
    pregnant: 'success', close_to_farrow: 'warning', farrowing_pending: 'info',
    overdue_farrowing: 'danger', farrowed: 'dark', abortion: 'dark',
};

type PeriodKey = "day" | "week" | "month" | "year";
const ViewPregnancies = () => {
    document.title = "Ver embarazos | Management System"
    const { t } = useTranslation();
    const userLoggged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, abortion: false, pigDetails: false, pregnancyDetails: false, bulkAbortion: false, reportPDF: false });
    const [pregnancies, setPregnancies] = useState<any[]>([])
    const [selectedPregnancy, setSelectedPregnancy] = useState<any>({})
    const [selectedPregnancies, setSelectedPregnancies] = useState<any[]>([])
    const [selectedPigId, setSelectedPigId] = useState<any>({})
    const [pregnancyStats, setPregnancyStats] = useState<any>({})
    const [fileURL, setFileURL] = useState<string>('')
    const [pdfLoading, setPdfLoading] = useState(false);

    const inseminationsColumns: Column<any>[] = [
        {
            header: t('pregnancy.column.sow'),
            accessor: "sow",
            type: "text",
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPigId(row?.sow?._id);
                        toggleModal('pigDetails');
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: t('pregnancy.column.inseminationDate'), accessor: "start_date", type: "date", isFilterable: false },
        {
            header: t('pregnancy.column.status'),
            accessor: "farrowing_status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                const color = STATUS_COLORS[row.farrowing_status] || 'secondary';
                const text = t(`pregnancy.status.${row.farrowing_status}`, { defaultValue: t('pregnancy.status.pending') });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('pregnancy.column.estimatedFarrowing'),
            accessor: "estimated_farrowing_date",
            type: "date",
            render: (_, row) => row.estimated_farrowing_date ? new Date(row.estimated_farrowing_date).toLocaleDateString() : "N/A",
        },
        {
            header: t('pregnancy.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedPregnancy(row); toggleModal('abortion'); }} disabled={row.farrowing_status === 'farrowed' || row.abortions.length !== 0}>
                        <i className="bx bxs-skull align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        {t('pregnancy.action.registerLoss')}
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedPregnancy(row); toggleModal('pregnancyDetails'); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`}>
                        {t('pregnancy.action.viewDetails')}
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSelectionChange = (selected: any[]) => {
        setSelectedPregnancies(selected);
    };

    const hasValidPregnancies = selectedPregnancies.some(preg =>
        preg.farrowing_status !== 'farrowed' && preg.abortions.length === 0
    );

    const bulkAbortionValidationSchema = Yup.object({
        probable_cause: Yup.string().required('La causa probable es obligatoria'),
        date: Yup.date().required('La fecha es obligatoria'),
    });

    const bulkAbortionFormik = useFormik({
        initialValues: {
            probable_cause: '',
            date: null as Date | null,
            notes: '',
            responsible: userLoggged?._id || '',
        },
        enableReinitialize: true,
        validationSchema: bulkAbortionValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            const validPregnancyIds = selectedPregnancies
                .filter(preg => preg.farrowing_status !== 'farrowed' && preg.abortions.length === 0)
                .map(preg => preg._id);

            try {
                setSubmitting(true);

                await configContext.axiosHelper.create(`${configContext.apiUrl}/pregnancies/register_bulk_abortion`, {
                    pregnancyIds: validPregnancyIds,
                    probable_cause: values.probable_cause,
                    date: values.date,
                    notes: values.notes,
                    responsible: values.responsible
                });

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLoggged._id}`, {
                    event: `Pérdida masiva de ${validPregnancyIds.length} embarazos registrada`
                });

                setAlertConfig({ visible: true, color: 'success', message: t('pregnancy.success.bulkLoss', { count: validPregnancyIds.length }) });
                fetchData();
                setSelectedPregnancies([]);
                bulkAbortionFormik.resetForm();
            } catch (error) {
                logger.error('Error bulk registering abortion:', error);
                setAlertConfig({ visible: true, color: 'danger', message: t('pregnancy.error.bulkLoss') });
            } finally {
                setSubmitting(false);
                toggleModal('bulkAbortion');
            }
        },
    });

    const handleOpenBulkAbortionForm = () => {
        bulkAbortionFormik.setFieldValue('date', new Date());
        toggleModal('bulkAbortion');
    };

    const handleGenerateReport = async () => {
        if (!configContext || !userLoggged) return;

        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/active_pregnancies/${userLoggged.farm_assigned}`);

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            toggleModal('reportPDF');
        } catch (error) {
            logger.error('Error generating pregnancies report:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('pregnancy.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const [pregnanciesResponse, statsResponse] = await Promise.all([
                await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_by_farm/${userLoggged.farm_assigned}`),
                await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/get_stats/${userLoggged.farm_assigned}`)
            ])

            const pregnanciesWithId = pregnanciesResponse.data.data.map((preg: any) => ({ ...preg, id: preg._id }));
            setPregnancies(pregnanciesWithId)
            setPregnancyStats(statsResponse.data.data)
        } catch (error) {
            logger.error('An error has ocurred:', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('pregnancy.error.load') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('pregnancy.breadcrumb.title')} pageTitle={t('pregnancy.breadcrumb.parent')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title={t('pregnancy.kpi.total')}
                        value={pregnancyStats?.generalStats?.[0]?.totalPregnancies ?? 0}
                        icon={FaClipboardList}
                        bgColor="#e8f4fd"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title={t('pregnancy.kpi.active')}
                        value={pregnancyStats?.generalStats?.[0]?.activePregnancies ?? 0}
                        icon={FaHeartbeat}
                        bgColor="#fff3cd"
                        iconColor="#ffc107"
                    />

                    <KPI
                        title={t('pregnancy.kpi.successfulBirths')}
                        value={pregnancyStats?.generalStats?.[0]?.farrowedCount ?? 0}
                        icon={FaBaby}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title={t('pregnancy.kpi.abortions')}
                        value={pregnancyStats?.generalStats?.[0]?.abortionCount ?? 0}
                        icon={FaExclamationTriangle}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />

                    <KPI
                        title={t('pregnancy.kpi.avgGestationDays')}
                        value={Math.round(pregnancyStats?.generalStats?.[0]?.avgGestationDays ?? 0)}
                        icon={FaClock}
                        bgColor="#f3e8fd"
                        iconColor="#6f42c1"
                    />

                    <KPI
                        title={t('pregnancy.kpi.successRate')}
                        value={`${((pregnancyStats?.generalStats?.[0]?.successRate ?? 0) * 100).toFixed(2)}%`}
                        icon={FaChartLine}
                        bgColor="#e8f7fc"
                        iconColor="#0dcaf0"
                    />

                    <KPI
                        title={t('pregnancy.kpi.abortionRate')}
                        value={`${((pregnancyStats?.generalStats?.[0]?.abortionRate ?? 0) * 100).toFixed(2)}%`}
                        icon={FaChartBar}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard stats={pregnancyStats} type={"pregnancies"} title={t('pregnancy.chart.byPeriod')} yLabel={""} />
                    <LineChartCard stats={pregnancyStats} type={"farrowings"} title={t('pregnancy.chart.farrowingsByPeriod')} yLabel={""} />
                    <LineChartCard stats={pregnancyStats} type={"abortions"} title={t('pregnancy.chart.abortionsByPeriod')} yLabel={""} />
                </div>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {selectedPregnancies.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedPregnancies.length} {selectedPregnancies.length === 1 ? t('pregnancy.selected.singular') : t('pregnancy.selected.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-danger-button btn-sm"
                                            disabled={!hasValidPregnancies}
                                            title={!hasValidPregnancies ? t('pregnancy.bulk.noValidPregnancies') : undefined}
                                            onClick={handleOpenBulkAbortionForm}
                                        >
                                            <i className="bx bxs-skull me-1"></i>
                                            {t('pregnancy.action.registerLoss')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button
                            color="primary"
                            onClick={handleGenerateReport}
                            disabled={pdfLoading}
                        >
                            {pdfLoading ? (
                                <>
                                    <Spinner className="me-2" size='sm' />
                                    {t('pregnancy.action.generating')}
                                </>
                            ) : (
                                <>
                                    <i className="ri-file-pdf-line me-2"></i>
                                    {t('pregnancy.action.exportPdf')}
                                </>
                            )}
                        </Button>
                    </CardHeader>

                    <CardBody className="p-0">
                        {pregnancies && pregnancies.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <SelectableCustomTable
                                    columns={inseminationsColumns}
                                    data={pregnancies}
                                    showPagination={true}
                                    showSearchAndFilter={false}
                                    rowsPerPage={7}
                                    onSelect={handleSelectionChange}
                                    selectionOnlyOnCheckbox={true}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>{t('pregnancy.empty.noPregnancies')}</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>{t('pregnancy.modal.pigDetails')}</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPigId} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => toggleModal("abortion")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("abortion")}>{t('pregnancy.modal.registerLoss')}</ModalHeader>
                <ModalBody>
                    <AbortionForm pregnancy={selectedPregnancy} onSave={() => { fetchData(); toggleModal('abortion'); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.bulkAbortion} toggle={() => toggleModal("bulkAbortion")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkAbortion")}>
                    {t('pregnancy.modal.bulkLoss', { count: selectedPregnancies.filter(preg => preg.farrowing_status !== 'farrowed' && preg.abortions.length === 0).length })}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkAbortionFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                {t('pregnancy.bulk.lossInfo')}
                            </small>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="probable_cause" className="form-label">{t('pregnancy.field.probableCause')}</Label>
                            <Input
                                type="text"
                                id="probable_cause"
                                name="probable_cause"
                                value={bulkAbortionFormik.values.probable_cause}
                                onChange={bulkAbortionFormik.handleChange}
                                onBlur={bulkAbortionFormik.handleBlur}
                                invalid={bulkAbortionFormik.touched.probable_cause && !!bulkAbortionFormik.errors.probable_cause}
                                placeholder={t('pregnancy.placeholder.probableCause')}
                            />
                            {bulkAbortionFormik.touched.probable_cause && bulkAbortionFormik.errors.probable_cause && (
                                <FormFeedback>{bulkAbortionFormik.errors.probable_cause}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">{t('pregnancy.field.date')}</Label>
                                <DatePicker
                                    id="date"
                                    className={`form-control ${bulkAbortionFormik.touched.date && bulkAbortionFormik.errors.date ? 'is-invalid' : ''}`}
                                    value={bulkAbortionFormik.values.date ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkAbortionFormik.setFieldValue('date', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkAbortionFormik.touched.date && bulkAbortionFormik.errors.date && (
                                    <FormFeedback className="d-block">{bulkAbortionFormik.errors.date as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">{t('pregnancy.field.responsible')}</Label>
                                <Input
                                    type="text"
                                    id="responsible"
                                    name="responsible"
                                    value={`${userLoggged?.name} ${userLoggged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="notes" className="form-label">{t('pregnancy.field.notes')}</Label>
                            <Input
                                type="text"
                                id="notes"
                                name="notes"
                                value={bulkAbortionFormik.values.notes}
                                onChange={bulkAbortionFormik.handleChange}
                                onBlur={bulkAbortionFormik.handleBlur}
                                invalid={bulkAbortionFormik.touched.notes && !!bulkAbortionFormik.errors.notes}
                                placeholder={t('pregnancy.placeholder.notes')}
                            />
                            {bulkAbortionFormik.touched.notes && bulkAbortionFormik.errors.notes && (
                                <FormFeedback>{bulkAbortionFormik.errors.notes}</FormFeedback>
                            )}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkAbortion", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-danger-button" onClick={() => bulkAbortionFormik.handleSubmit()} disabled={bulkAbortionFormik.isSubmitting}>
                        {bulkAbortionFormik.isSubmitting ? <Spinner size="sm" /> : t('pregnancy.action.confirmLoss')}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.pregnancyDetails} toggle={() => { toggleModal("pregnancyDetails"); fetchData() }} centered>
                <ModalHeader toggle={() => { toggleModal("pregnancyDetails"); fetchData() }}>{t('pregnancy.modal.pregnancyDetails')}</ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedPregnancy._id} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.reportPDF} toggle={() => toggleModal("reportPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("reportPDF")}>{t('pregnancy.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewPregnancies
