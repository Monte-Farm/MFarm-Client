import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, ButtonGroup, Card, CardBody, CardHeader, CardSubtitle, Container, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, UncontrolledTooltip, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import PregnancyDetails from "Components/Common/Details/PregnancyDetails";
import AbortionForm from "Components/Common/Forms/AbortionForm";
import BirthForm from "Components/Common/Forms/BirthForm";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import { useTranslation } from "react-i18next";

const PREGNANCY_STATUS_COLORS: Record<string, string> = {
    pregnant: 'success', close_to_farrow: 'warning', farrowing_pending: 'info',
    overdue_farrowing: 'danger', farrowed: 'dark', abortion: 'dark',
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewUpcomingBirths = () => {
    const { t } = useTranslation();
    document.title = `${t("birth.breadcrumb.upcomingTitle")} | ${t("systemName")}`;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const navigate = useNavigate();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [alertConfig, setAlertConfig] = useState({ visible: false, mesagge: '', color: '' })
    const [modals, setModals] = useState({ birth: false, selectedBirth: false, pregnancyDetails: false, abortion: false, viewPDF: false, dateRange: false, bulkAbortion: false })
    const [upcomingBirths, setUpcomingBirths] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedBirth, setSelectedBirth] = useState<any>({})
    const [selectedBirths, setSelectedBirths] = useState<any[]>([])
    const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
    const [calendarData, setCalendarData] = useState<any[]>([])
    const [selectedPregnancyId, setSelectedPregnancyId] = useState<string>('')
    const [selectedPregnancyAbort, setSelectedPregnancyAbort] = useState<any>({})
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSelectionChange = (selected: any[]) => {
        setSelectedBirths(selected);
    };

    const hasValidPregnancies = selectedBirths.some(preg =>
        preg.farrowing_status !== 'farrowed'
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
            responsible: userLogged?._id || '',
        },
        enableReinitialize: true,
        validationSchema: bulkAbortionValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            const validPregnancyIds = selectedBirths
                .filter(preg => preg.farrowing_status !== 'farrowed')
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

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Pérdida masiva de ${validPregnancyIds.length} embarazos registrada`
                });

                setAlertConfig({ visible: true, color: 'success', mesagge: t('birth.success.bulkLoss', { count: validPregnancyIds.length }) });
                fetchData();
                setSelectedBirths([]);
                bulkAbortionFormik.resetForm();
            } catch (error) {
                logger.error('Error bulk registering abortion:', error);
                setAlertConfig({ visible: true, color: 'danger', mesagge: t('birth.error.bulkLoss') });
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

    const upcomingBirthsColumns: Column<any>[] = [
        {
            header: t('birth.column.sow'),
            accessor: 'sow',
            type: 'text',
            isFilterable: true,
            render: (_, row) => (
                <Button className="text-underline" color="link" onClick={(e) => { e.stopPropagation(); navigate(`/pigs/pig_details/${row.sow._id}`); }}>
                    {row.sow?.code} ↗
                </Button>
            )
        },
        { header: t('birth.column.inseminationDate'), accessor: 'start_date', type: 'date', isFilterable: true },
        {
            header: t('birth.column.status'),
            accessor: "farrowing_status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                const color = PREGNANCY_STATUS_COLORS[row.farrowing_status] || 'secondary';
                const text = t(`pregnancy.status.${row.farrowing_status}`, { defaultValue: t('pregnancy.status.pending') });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { header: t('birth.column.estimatedFarrowing'), accessor: 'estimated_farrowing_date', type: 'date', isFilterable: true },
        {
            header: t('birth.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`abort-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedPregnancyAbort(row); toggleModal('abortion'); }} disabled={row.farrowing_status === 'farrowed'}>
                        <i className="bx bxs-skull align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`abort-button-${row._id}`}>
                        {t('birth.action.registerLoss')}
                    </UncontrolledTooltip>

                    <Button id={`birth-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedBirth(row); toggleModal('selectedBirth'); }} disabled={row.farrowing_status === 'farrowed' || row.farrowing_status === 'pregnant' || row.farrowing_status === 'abortion'}>
                        <i className="ri-parent-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`birth-button-${row._id}`}>
                        {t('birth.action.registerBirth')}
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedPregnancyId(row._id); toggleModal('pregnancyDetails'); }} >
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
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const upcomingBirthsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pregnancies/find_upcoming_births/${userLogged.farm_assigned}`)
            const upcomingBirthData = upcomingBirthsResponse.data.data;
            const upcomingBirthsWithId = upcomingBirthData.map((birth: any) => ({ ...birth, id: birth._id }));
            setUpcomingBirths(upcomingBirthsWithId);

            const mappedData = upcomingBirthData.map((birth: any) => {
                let bgColor = "#e5e7eb";
                let textColor = "#000000";
                let borderColor = "#d1d5db";
                let statusLabel = "";

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const farrowingDate = new Date(birth.estimated_farrowing_date);
                farrowingDate.setHours(0, 0, 0, 0);
                const daysRemaining = Math.ceil((farrowingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                switch (birth.farrowing_status) {
                    case "pregnant":
                        bgColor = "#bbf7d0"; textColor = "#065f46"; borderColor = "#22c55e";
                        statusLabel = t('pregnancy.status.pregnant'); break;
                    case "close_to_farrow":
                        bgColor = "#fef9c3"; textColor = "#854d0e"; borderColor = "#eab308";
                        statusLabel = t('pregnancy.status.close_to_farrow'); break;
                    case "farrowing_pending":
                        bgColor = "#bfdbfe"; textColor = "#1e3a8a"; borderColor = "#3b82f6";
                        statusLabel = t('pregnancy.status.farrowing_pending'); break;
                    case "overdue_farrowing":
                        bgColor = "#fecaca"; textColor = "#7f1d1d"; borderColor = "#ef4444";
                        statusLabel = t('pregnancy.status.overdue_farrowing'); break;
                    case "farrowed":
                        bgColor = "#d1d5db"; textColor = "#374151"; borderColor = "#6b7280";
                        statusLabel = t('pregnancy.status.farrowed'); break;
                    case "abortion":
                        bgColor = "#9ca3af"; textColor = "#ffffff"; borderColor = "#4b5563";
                        statusLabel = t('pregnancy.status.abortion'); break;
                }

                let title = birth.sow?.code || "S/C";

                if (birth.farrowing_status !== "farrowed" && birth.farrowing_status !== "abortion") {
                    if (daysRemaining > 0) {
                        title += ` | ${daysRemaining}d`;
                    } else if (daysRemaining === 0) {
                        title += ` | HOY`;
                    } else {
                        title += ` | -${Math.abs(daysRemaining)}d`;
                    }
                }

                return {
                    id: birth._id,
                    title: title,
                    date: birth.estimated_farrowing_date,
                    backgroundColor: bgColor,
                    textColor: textColor,
                    borderColor: borderColor,
                    classNames: ['calendar-event-custom'],
                    extendedProps: {
                        sowCode: birth.sow?.code,
                        status: statusLabel,
                        daysRemaining: daysRemaining
                    }
                };
            });
            setCalendarData(mappedData)

        } catch (error) {
            logger.error(`Error fetching data: ${error}`)
            setAlertConfig({ visible: true, mesagge: t('birth.error.load'), color: 'danger' });
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
                `${configContext.apiUrl}/reports/upcoming-births/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLogged.farm_assigned}`
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', mesagge: t('birth.error.pdf') });
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
                <BreadCrumb title={t('birth.breadcrumb.upcomingTitle')} pageTitle={t('birth.breadcrumb.upcomingParent')} />

                <Card style={{ height: '85vh' }}>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <ButtonGroup>
                                <Button color={viewMode === "calendar" ? "primary" : "secondary"} className="btn-icon material-shadow-none fs-5" onClick={() => setViewMode("calendar")}>
                                    <i className="ri-calendar-line" />
                                </Button>

                                <Button color={viewMode === "list" ? "primary" : "secondary"} className="btn-icon material-shadow-none fs-5" onClick={() => setViewMode("list")}>
                                    <i className="ri-file-list-line" />
                                </Button>
                            </ButtonGroup>

                            {selectedBirths.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedBirths.length} {selectedBirths.length === 1 ? t('birth.selected.singular') : t('birth.selected.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-danger-button btn-sm"
                                            disabled={!hasValidPregnancies}
                                            title={!hasValidPregnancies ? t('birth.bulk.noValidPregnancies') : undefined}
                                            onClick={handleOpenBulkAbortionForm}
                                        >
                                            <i className="bx bxs-skull me-1"></i>
                                            {t('birth.action.registerLoss')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                        {t('birth.action.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        {t('birth.action.exportPdf')}
                                    </>
                                )}
                            </Button>

                            <Button onClick={() => toggleModal('birth')}>
                                <i className="ri-add-line me-2" />
                                {t('birth.action.registerBirth')}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody>
                        {viewMode === "list" ? (
                            <SelectableCustomTable
                                columns={upcomingBirthsColumns}
                                data={upcomingBirths}
                                showPagination={false}
                                onSelect={handleSelectionChange}
                                selectionOnlyOnCheckbox={true}
                            />
                        ) : (
                            <div className="h-100">
                                <FullCalendar
                                    plugins={[dayGridPlugin]}
                                    initialView="dayGridMonth"
                                    height="100%"
                                    locale="es"
                                    buttonText={{ today: "Hoy" }}
                                    events={calendarData}
                                    dayMaxEvents={true}
                                    eventDisplay="block"
                                    eventClick={(info: any) => { setSelectedPregnancyId(info.event.id); toggleModal('pregnancyDetails') }}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal isOpen={modals.birth} size="xl" backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('birth')}>{t('birth.modal.registerBirth')}</ModalHeader>
                <ModalBody>
                    <BirthForm pregnancy={undefined} onSave={() => { toggleModal('birth'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.selectedBirth} size="xl" backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal('selectedBirth')}>{t('birth.modal.registerBirth')}</ModalHeader>
                <ModalBody>
                    <BirthForm pregnancy={selectedBirth} onSave={() => { toggleModal('selectedBirth'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.pregnancyDetails} toggle={() => { toggleModal("pregnancyDetails"); fetchData(); }} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => { toggleModal("pregnancyDetails"); fetchData(); }}>{t('birth.modal.pregnancyDetails')}</ModalHeader>
                <ModalBody>
                    <PregnancyDetails pregnancyId={selectedPregnancyId} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortion} toggle={() => { toggleModal("abortion"); fetchData(); }} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("abortion")}>{t('pregnancy.modal.registerLoss')}</ModalHeader>
                <ModalBody>
                    <AbortionForm pregnancy={selectedPregnancyAbort} onSave={() => { toggleModal('abortion'); fetchData(); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.bulkAbortion} toggle={() => toggleModal("bulkAbortion")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("bulkAbortion")}>
                    {t('birth.bulk.lossModal', { count: selectedBirths.filter(preg => preg.farrowing_status !== 'farrowed').length })}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkAbortionFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                {t('birth.bulk.lossInfo')}
                            </small>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="probable_cause" className="form-label">{t('birth.field.probableCause')}</Label>
                            <Input
                                type="text"
                                id="probable_cause"
                                name="probable_cause"
                                value={bulkAbortionFormik.values.probable_cause}
                                onChange={bulkAbortionFormik.handleChange}
                                onBlur={bulkAbortionFormik.handleBlur}
                                invalid={bulkAbortionFormik.touched.probable_cause && !!bulkAbortionFormik.errors.probable_cause}
                                placeholder={t('birth.placeholder.probableCause')}
                            />
                            {bulkAbortionFormik.touched.probable_cause && bulkAbortionFormik.errors.probable_cause && (
                                <FormFeedback>{bulkAbortionFormik.errors.probable_cause}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">{t('birth.field.date')}</Label>
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
                                <Label htmlFor="responsible" className="form-label">{t('birth.field.responsible')}</Label>
                                <Input
                                    type="text"
                                    id="responsible"
                                    name="responsible"
                                    value={`${userLogged?.name} ${userLogged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="notes" className="form-label">{t('birth.field.notes')}</Label>
                            <Input
                                type="text"
                                id="notes"
                                name="notes"
                                value={bulkAbortionFormik.values.notes}
                                onChange={bulkAbortionFormik.handleChange}
                                onBlur={bulkAbortionFormik.handleBlur}
                                invalid={bulkAbortionFormik.touched.notes && !!bulkAbortionFormik.errors.notes}
                                placeholder={t('birth.placeholder.notes')}
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
                        {bulkAbortionFormik.isSubmitting ? <Spinner size="sm" /> : t('birth.bulk.confirmLoss')}
                    </Button>
                </ModalFooter>
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
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('birth.modal.upcomingReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.mesagge} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}

        </div>
    )
}

export default ViewUpcomingBirths;
