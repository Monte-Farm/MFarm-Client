import { logger } from 'utils/logger';
import { appendLangParam } from 'helpers/reports_url_helper';
import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, UncontrolledTooltip, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiPlayCircle, FiActivity, FiInbox } from "react-icons/fi";
import { Column } from "common/data/data_types";
import InseminationFilters from "Components/Common/Tables/InseminationFilters";
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import SimpleBar from "simplebar-react";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import KPI from "Components/Common/Graphics/Kpi";
import LineChartCard from "Components/Common/Graphics/LineChartCard";
import BasicBarChart from "Components/Common/Graphics/BasicBarChart";
import BasicPieChart from "Components/Common/Graphics/BasicPieChart";
import DiagnosisForm from "Components/Common/Forms/DiagnoseForm";
import HeatForm from "Components/Common/Forms/HeatForm";
import InseminationForm from "Components/Common/Forms/InseminationForm";
import InseminationEditForm from "Components/Common/Forms/InseminationEditForm";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
    completed: 'success', active: 'warning', failed: 'danger',
};
const RESULT_COLORS: Record<string, string> = {
    pregnant: 'success', empty: 'warning', doubtful: 'info', resorption: 'danger', abortion: 'dark',
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewInseminations = () => {
    const { t } = useTranslation();
    document.title = `${t("insemination.breadcrumb.title")} | ${t("systemName")}`;
    const userLoggged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, edit: false, viewPDF: false, diagnosis: false, heat: false, pigDetails: false, dateRange: false, bulkHeat: false, bulkDiagnosis: false });
    const [inseminations, setInseminations] = useState<any[]>([])
    const [possiblesPregnancies, setPossiblesPregnancies] = useState<any[]>([])
    const [possiblesPregnanciesCount, setPossiblesPregnanciesCount] = useState<number>(0)
    const [selectedInsemination, setSelectedInsemination] = useState({})
    const [selectedInseminations, setSelectedInseminations] = useState<any[]>([])
    const [filteredInseminations, setFilteredInseminations] = useState<any[]>([]);
    const [selectedPigId, setSelectedPigId] = useState<string>('')
    const [inseminationsStats, setInseminationsStats] = useState<any>({})
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const inseminationsColumns: Column<any>[] = [
        {
            header: t('insemination.column.sow'),
            accessor: "sow",
            type: "text",
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPigId(row.sow?._id);
                        toggleModal('pigDetails')
                    }}
                >
                    {row.sow?.code} ↗
                </Button>
            )
        },
        {
            header: t('insemination.column.doses'),
            accessor: "doses",
            type: "number",
            isFilterable: true,
            render: (_, row) => row.doses.length || 0,
        },
        { header: t('insemination.column.date'), accessor: "date", type: "date", isFilterable: false },
        {
            header: t('insemination.column.estimatedFarrowing'),
            accessor: "date",
            type: "date",
            isFilterable: false,
            render: (_, row) => {
                const showDate =
                    row.status === "active" ||
                    (row.status === "completed" && row.result === "pregnant");

                return (
                    <span>
                        {showDate
                            ? new Date(new Date(row.date).getTime() + 115 * 24 * 60 * 60 * 1000)
                                .toLocaleDateString("es-MX")
                            : "N/A"}
                    </span>
                );
            },
        },
        {
            header: t('insemination.column.responsible'),
            accessor: "responsible",
            type: "text",
            isFilterable: true,
            render: (_, row) =>
                row.responsible
                    ? `${row.responsible.name} ${row.responsible.lastname}`
                    : t('insemination.column.noResponsible'),
        },
        {
            header: t('insemination.column.status'),
            accessor: "status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                const color = STATUS_COLORS[row.status] || 'secondary';
                const text = t(`insemination.status.${row.status}`, { defaultValue: t('insemination.status.unknown') });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('insemination.column.result'),
            accessor: "result",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                const color = RESULT_COLORS[row.result] || 'secondary';
                const text = t(`insemination.result.${row.result}`, { defaultValue: t('insemination.result.pending') });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('insemination.column.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`heat-button-${row._id}`} className="farm-warning-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedInsemination(row); toggleModal('heat'); }} disabled={row.status === 'completed' || row.status === 'failed'}>
                        <i className="bx bx-heart align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`heat-button-${row._id}`}>
                        {t('insemination.action.registerHeat')}
                    </UncontrolledTooltip>

                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedInsemination(row); toggleModal('diagnosis'); }} disabled={row.status === 'completed' || row.status === 'failed'} >
                        <i className="bx bx-dna align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        {t('insemination.action.registerDiagnosis')}
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/gestation/insemination_details/${row._id}`); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`} >
                        {t('insemination.action.viewDetails')}
                    </UncontrolledTooltip>

                    {row.status === 'active' && !row.diagnosis_date && (
                        <>
                            <Button id={`edit-button-${row._id}`} className="btn-icon btn-soft-warning" onClick={(e) => { e.stopPropagation(); setSelectedInsemination(row); toggleModal('edit'); }}>
                                <i className="ri-edit-line align-middle"></i>
                            </Button>
                            <UncontrolledTooltip target={`edit-button-${row._id}`}>
                                {t('insemination.action.edit')}
                            </UncontrolledTooltip>
                        </>
                    )}
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSelectionChange = (selected: any[]) => {
        setSelectedInseminations(selected);
    };

    const hasActiveInseminations = selectedInseminations.some(ins =>
        ins.status !== 'completed' && ins.status !== 'failed'
    );

    const fetchInseminations = async () => {
        if (!configContext || !userLoggged) return;
        const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_by_farm/${userLoggged.farm_assigned}`);
        const inseminationsWithId = response.data.data.map((ins: any) => ({ ...ins, id: ins._id }));
        setInseminations(inseminationsWithId);
        setFilteredInseminations(inseminationsWithId);
    };

    const fetchInseminationsStats = async () => {
        if (!configContext || !userLoggged) return;
        const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/get_stats/${userLoggged.farm_assigned}`);
        const data = response.data.data;
        setInseminationsStats(data)
    };

    const bulkHeatValidationSchema = Yup.object({
        heatDetected: Yup.boolean().required("Debe indicar si se detectó celo"),
        date: Yup.date().required("La fecha es obligatoria"),
    });

    const bulkHeatFormik = useFormik({
        initialValues: {
            heatDetected: false,
            date: null as Date | null,
            notes: "",
            responsible: userLoggged?._id || "",
        },
        enableReinitialize: true,
        validationSchema: bulkHeatValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            const activeInseminationIds = selectedInseminations
                .filter(ins => ins.status !== 'completed' && ins.status !== 'failed')
                .map(ins => ins._id);

            try {
                setSubmitting(true);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/insemination/register_bulk_heat`, {
                    inseminationIds: activeInseminationIds,
                    heatDetected: values.heatDetected,
                    date: values.date,
                    notes: values.notes,
                    responsible: values.responsible
                });
                setAlertConfig({ visible: true, color: 'success', message: t('insemination.success.bulkHeat', { count: activeInseminationIds.length }) });
                loadData();
                setSelectedInseminations([]);
                bulkHeatFormik.resetForm();
            } catch (error) {
                logger.error('Error bulk registering heat:', error);
                setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.bulkHeat') });
            } finally {
                setSubmitting(false);
                toggleModal('bulkHeat');
            }
        },
    });

    const handleOpenBulkHeatForm = () => {
        bulkHeatFormik.setFieldValue('date', new Date());
        toggleModal('bulkHeat');
    };

    const bulkDiagnosisValidationSchema = Yup.object({
        result: Yup.string()
            .oneOf(['pregnant', 'empty', 'doubtful', 'resorption', 'abortion'])
            .required('El resultado es obligatorio'),
        diagnosisDate: Yup.date().required('La fecha es obligatoria'),
    });

    const bulkDiagnosisFormik = useFormik({
        initialValues: {
            result: 'pregnant',
            diagnosisDate: null as Date | null,
            diagnose_notes: '',
            diagnose_responsible: userLoggged?._id || '',
        },
        enableReinitialize: true,
        validationSchema: bulkDiagnosisValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            const activeInseminationIds = selectedInseminations.filter(ins => ins.status !== 'completed' && ins.status !== 'failed').map(ins => ins._id);

            try {
                setSubmitting(true);

                await configContext.axiosHelper.create(`${configContext.apiUrl}/insemination/diagnose_bulk`, {
                    inseminationIds: activeInseminationIds,
                    result: values.result,
                    diagnosisDate: values.diagnosisDate,
                    diagnose_notes: values.diagnose_notes,
                    diagnose_responsible: values.diagnose_responsible
                });

                if (values.result === 'pregnant') {
                    const activeInseminations = selectedInseminations
                        .filter(ins => ins.status !== 'completed' && ins.status !== 'failed');

                    for (const insemination of activeInseminations) {
                        const estimatedFarrowingDate = new Date(insemination.date);
                        estimatedFarrowingDate.setDate(estimatedFarrowingDate.getDate() + 115);

                        await configContext.axiosHelper.create(`${configContext.apiUrl}/pregnancies/create`, {
                            sow: insemination.sow._id,
                            insemination: insemination._id,
                            start_date: insemination.date,
                            farrowing_status: 'pregnant',
                            hasFarrowed: false,
                            status_history: [],
                            abortions: [],
                            estimated_farrowing_date: estimatedFarrowingDate,
                            farrowing_date: null,
                        });
                    }
                }

                const uniqueSowIds = Array.from(new Set(
                    selectedInseminations
                        .filter(ins => ins.status !== 'completed' && ins.status !== 'failed')
                        .map(ins => ins.sow._id)
                ));

                for (const sowId of uniqueSowIds) {
                    await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update/${sowId}/${userLoggged._id}`, {
                        currentStage: 'gestation'
                    });
                }

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLoggged._id}`, {
                    event: `Diagnóstico masivo de ${activeInseminationIds.length} inseminaciones registrado`
                });

                setAlertConfig({ visible: true, color: 'success', message: t('insemination.success.bulkDiagnosis', { count: activeInseminationIds.length }) });
                loadData();
                setSelectedInseminations([]);
                bulkDiagnosisFormik.resetForm();
            } catch (error) {
                logger.error('Error bulk diagnosing:', error);
                setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.bulkDiagnosis') });
            } finally {
                setSubmitting(false);
                toggleModal('bulkDiagnosis');
            }
        },
    });

    const handleOpenBulkDiagnosisForm = () => {
        bulkDiagnosisFormik.setFieldValue('diagnosisDate', new Date());
        toggleModal('bulkDiagnosis');
    };

    const handleGeneratePDF = async (startDate: string, endDate: string) => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            toggleModal('dateRange', false);

            const response = await configContext.axiosHelper.getBlob(
                appendLangParam(`${configContext.apiUrl}/reports/inseminations/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLoggged.farm_assigned}`)
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchInseminations(),
                fetchInseminationsStats()
            ]);
        } catch (error) {
            logger.error(error);
            setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.load') })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('insemination.breadcrumb.title')} pageTitle={t('insemination.breadcrumb.parent')} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title={t('insemination.kpi.total')}
                        value={inseminationsStats?.inseminationStats?.[0]?.total ?? 0}
                        icon={FiActivity}
                        bgColor="#e8f4fd"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title={t('insemination.kpi.active')}
                        value={inseminationsStats?.inseminationStats?.[0]?.active ?? 0}
                        icon={FiPlayCircle}
                        bgColor="#fff8e1"
                        iconColor="#f6c000"
                    />

                    <KPI
                        title={t('insemination.kpi.completed')}
                        value={inseminationsStats?.inseminationStats?.[0]?.completed ?? 0}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title={t('insemination.kpi.failed')}
                        value={inseminationsStats?.inseminationStats?.[0]?.failed ?? 0}
                        icon={FiXCircle}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard stats={inseminationsStats} type={"volume"} title={t('insemination.chart.byPeriod')} yLabel={t('insemination.chart.yLabel')} />

                    <BasicBarChart
                        title={t('insemination.chart.bySow')}
                        data={(inseminationsStats?.inseminationsBySow ?? []).map((item: any) => ({
                            sowCode: item.sowCode,
                            count: item.count
                        }))}
                        indexBy="sowCode"
                        keys={["count"]}
                        xLegend={t('insemination.chart.sowLabel')}
                        yLegend={t('insemination.chart.countLabel')}
                    />

                    <BasicPieChart
                        title={t('insemination.chart.results')}
                        data={[
                            { id: t('insemination.chart.pregnant'), value: inseminationsStats?.resultsStats?.[0]?.pregnant ?? 0 },
                            { id: t('insemination.chart.empty'), value: inseminationsStats?.resultsStats?.[0]?.empty ?? 0 },
                            { id: t('insemination.chart.abortion'), value: inseminationsStats?.resultsStats?.[0]?.abortion ?? 0 },
                            { id: t('insemination.chart.resorption'), value: inseminationsStats?.resultsStats?.[0]?.resorption ?? 0 },
                            { id: t('insemination.chart.doubtful'), value: inseminationsStats?.resultsStats?.[0]?.doubtfulOrMissing ?? 0 }
                        ]}
                    />

                </div>

                <Card style={{}}>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {selectedInseminations.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedInseminations.length} {selectedInseminations.length === 1 ? t('insemination.selected.singular') : t('insemination.selected.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-warning-button btn-sm"
                                            disabled={!hasActiveInseminations}
                                            title={!hasActiveInseminations ? t('insemination.bulk.noActiveHeat') : undefined}
                                            onClick={handleOpenBulkHeatForm}
                                        >
                                            <i className="bx bx-heart me-1"></i>
                                            {t('insemination.action.registerHeat')}
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm ms-2"
                                            disabled={!hasActiveInseminations}
                                            title={!hasActiveInseminations ? t('insemination.bulk.noActiveDiagnosis') : undefined}
                                            onClick={handleOpenBulkDiagnosisForm}
                                        >
                                            <i className="bx bx-dna me-1"></i>
                                            {t('insemination.action.registerDiagnosis')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                color="primary"
                                onClick={() => toggleModal("dateRange")}
                                disabled={pdfLoading}
                            >
                                {pdfLoading ? (
                                    <>
                                        <Spinner className="me-2" size='sm' />
                                        {t('insemination.action.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        {t('insemination.action.exportPdf')}
                                    </>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal("create")}>
                                <i className="ri-add-line me-2" />
                                {t('insemination.action.registerInsemination')}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {filteredInseminations && filteredInseminations.length > 0 ? (
                            <>
                                <InseminationFilters
                                    inseminations={inseminations}
                                    setFilteredInseminations={setFilteredInseminations}
                                />

                                <div style={{ flex: 1 }}>
                                    <SelectableCustomTable
                                        columns={inseminationsColumns}
                                        data={filteredInseminations}
                                        showPagination={true}
                                        showSearchAndFilter={false}
                                        rowsPerPage={6}
                                        onSelect={handleSelectionChange}
                                        selectionOnlyOnCheckbox={true}
                                    />
                                </div>
                            </>
                        ) : (
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                    color: "#888",
                                }}
                            >
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>{t('insemination.empty.noInseminations')}</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('insemination.modal.create')}</ModalHeader>
                <ModalBody>
                    <InseminationForm onSave={() => { toggleModal('create'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>{t('insemination.modal.diagnosis')}</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={selectedInsemination} onSave={() => { toggleModal('diagnosis'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("heat")}>{t('insemination.modal.heat')}</ModalHeader>
                <ModalBody>
                    {selectedInsemination && <HeatForm insemination={selectedInsemination} onSave={() => { toggleModal('heat'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.edit} toggle={() => toggleModal("edit")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("edit")}>{t('insemination.edit.title')}</ModalHeader>
                <ModalBody>
                    {modals.edit && <InseminationEditForm inseminationData={selectedInsemination} onSave={() => { toggleModal('edit'); loadData(); }} onCancel={() => toggleModal('edit')} />}
                </ModalBody>
            </Modal>

            <Modal isOpen={modals.bulkHeat} toggle={() => toggleModal("bulkHeat")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("bulkHeat")}>
                    {t('insemination.modal.bulkHeat', { count: selectedInseminations.filter(ins => ins.status !== 'completed' && ins.status !== 'failed').length })}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkHeatFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                {t('insemination.bulk.heatInfo')}
                            </small>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="heatDetected" className="form-label">{t('insemination.field.heatDetected')}</Label>
                            <Input
                                type="select"
                                id="heatDetected"
                                name="heatDetected"
                                value={bulkHeatFormik.values.heatDetected ? "true" : "false"}
                                onChange={(e) => bulkHeatFormik.setFieldValue("heatDetected", e.target.value === "true")}
                                onBlur={bulkHeatFormik.handleBlur}
                                invalid={bulkHeatFormik.touched.heatDetected && !!bulkHeatFormik.errors.heatDetected}
                            >
                                <option value="true">{t('insemination.field.yes')}</option>
                                <option value="false">{t('insemination.field.no')}</option>
                            </Input>
                            {bulkHeatFormik.touched.heatDetected && bulkHeatFormik.errors.heatDetected && (
                                <FormFeedback>{bulkHeatFormik.errors.heatDetected}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">{t('insemination.field.date')}</Label>
                                <DatePicker
                                    id="date"
                                    className={`form-control ${bulkHeatFormik.touched.date && bulkHeatFormik.errors.date ? 'is-invalid' : ''}`}
                                    value={bulkHeatFormik.values.date ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkHeatFormik.setFieldValue('date', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkHeatFormik.touched.date && bulkHeatFormik.errors.date && (
                                    <FormFeedback className="d-block">{bulkHeatFormik.errors.date as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">{t('insemination.field.responsible')}</Label>
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
                            <Label htmlFor="notes" className="form-label">{t('insemination.field.notes')}</Label>
                            <Input
                                type="text"
                                id="notes"
                                name="notes"
                                value={bulkHeatFormik.values.notes}
                                onChange={bulkHeatFormik.handleChange}
                                onBlur={bulkHeatFormik.handleBlur}
                                invalid={bulkHeatFormik.touched.notes && !!bulkHeatFormik.errors.notes}
                                placeholder={t('insemination.placeholder.heatNotes')}
                            />
                            {bulkHeatFormik.touched.notes && bulkHeatFormik.errors.notes && (
                                <FormFeedback>{bulkHeatFormik.errors.notes}</FormFeedback>
                            )}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkHeat", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={() => bulkHeatFormik.handleSubmit()} disabled={bulkHeatFormik.isSubmitting}>
                        {bulkHeatFormik.isSubmitting ? <Spinner size="sm" /> : t('insemination.action.confirmRegister')}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={modals.bulkDiagnosis} toggle={() => toggleModal("bulkDiagnosis")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("bulkDiagnosis")}>
                    {t('insemination.modal.bulkDiagnosis', { count: selectedInseminations.filter(ins => ins.status !== 'completed' && ins.status !== 'failed').length })}
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkDiagnosisFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                {t('insemination.bulk.diagnosisInfo')}
                            </small>
                            {bulkDiagnosisFormik.values.result === 'pregnant' && (
                                <div className="alert alert-info mt-2 d-flex align-items-center gap-2">
                                    <FiInfo size={20} />
                                    <small>
                                        {t('insemination.bulk.pregnancyAlert')}
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="result" className="form-label">{t('insemination.field.diagnosis')}</Label>
                            <Input
                                type="select"
                                name="result"
                                value={bulkDiagnosisFormik.values.result}
                                onChange={bulkDiagnosisFormik.handleChange}
                                onBlur={bulkDiagnosisFormik.handleBlur}
                                invalid={bulkDiagnosisFormik.touched.result && !!bulkDiagnosisFormik.errors.result}
                            >
                                <option value="pregnant">{t('insemination.result.pregnant')}</option>
                                <option value="empty">{t('insemination.result.empty')}</option>
                                <option value="doubtful">{t('insemination.result.doubtful')}</option>
                                <option value="resorption">{t('insemination.result.resorption')}</option>
                                <option value="abortion">{t('insemination.result.abortion')}</option>
                            </Input>
                            {bulkDiagnosisFormik.touched.result && bulkDiagnosisFormik.errors.result && (
                                <FormFeedback>{bulkDiagnosisFormik.errors.result}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="diagnosisDate" className="form-label">{t('insemination.field.diagnosisDate')}</Label>
                                <DatePicker
                                    id="diagnosisDate"
                                    className={`form-control ${bulkDiagnosisFormik.touched.diagnosisDate && bulkDiagnosisFormik.errors.diagnosisDate ? 'is-invalid' : ''}`}
                                    value={bulkDiagnosisFormik.values.diagnosisDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkDiagnosisFormik.setFieldValue('diagnosisDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkDiagnosisFormik.touched.diagnosisDate && bulkDiagnosisFormik.errors.diagnosisDate && (
                                    <FormFeedback className="d-block">{bulkDiagnosisFormik.errors.diagnosisDate as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">{t('insemination.field.responsible')}</Label>
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
                            <Label htmlFor="diagnose_notes" className="form-label">{t('insemination.field.notes')}</Label>
                            <Input
                                type="text"
                                id="diagnose_notes"
                                name="diagnose_notes"
                                value={bulkDiagnosisFormik.values.diagnose_notes}
                                onChange={bulkDiagnosisFormik.handleChange}
                                onBlur={bulkDiagnosisFormik.handleBlur}
                                invalid={bulkDiagnosisFormik.touched.diagnose_notes && !!bulkDiagnosisFormik.errors.diagnose_notes}
                                placeholder={t('insemination.placeholder.diagnosisNotes')}
                            />
                            {bulkDiagnosisFormik.touched.diagnose_notes && bulkDiagnosisFormik.errors.diagnose_notes && (
                                <FormFeedback>{bulkDiagnosisFormik.errors.diagnose_notes}</FormFeedback>
                            )}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDiagnosis", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={() => bulkDiagnosisFormik.handleSubmit()} disabled={bulkDiagnosisFormik.isSubmitting}>
                        {bulkDiagnosisFormik.isSubmitting ? <Spinner size="sm" /> : t('insemination.action.confirmDiagnosis')}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>{t('insemination.modal.pigDetails')}</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPigId} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>{t('insemination.modal.dateRange')}</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText={t('insemination.action.generatePdf')}
                />
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('insemination.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewInseminations;
