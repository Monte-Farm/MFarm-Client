import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { getLoggedinUser } from "helpers/api_helper";
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
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import ReportDateRangeSelector from "Components/Common/Shared/ReportDateRangeSelector";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const ViewInseminations = () => {
    document.title = "Ver inseminaciones | Management System"
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, viewPDF: false, diagnosis: false, heat: false, pigDetails: false, dateRange: false, bulkHeat: false, bulkDiagnosis: false });
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
            header: "Cerda",
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
            header: "Dosis admin.",
            accessor: "doses",
            type: "number",
            isFilterable: true,
            render: (_, row) => row.doses.length || 0,
        },
        { header: "Fecha de inseminación", accessor: "date", type: "date", isFilterable: false },
        {
            header: "F. de parto (tentativa)",
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
            header: "Responsable",
            accessor: "responsible",
            type: "text",
            isFilterable: true,
            render: (_, row) =>
                row.responsible ? `${row.responsible.name} ${row.responsible.lastname}` : "Sin responsable",
        },
        {
            header: "Estado",
            accessor: "status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";
                switch (row.status) {
                    case "completed": color = "success"; text = "Completada"; break;
                    case "active": color = "warning"; text = "Activa"; break;
                    case "failed": color = "danger"; text = "Fallida"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Resultado",
            accessor: "result",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Pendiente";
                switch (row.result) {
                    case "pregnant": color = "success"; text = "Preñada"; break;
                    case "empty": color = "warning"; text = "Vacía"; break;
                    case "doubtful": color = "info"; text = "Dudosa"; break;
                    case "resorption": color = "danger"; text = "Reabsorción"; break;
                    case "abortion": color = "dark"; text = "Aborto"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`heat-button-${row._id}`} className="farm-warning-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedInsemination(row); toggleModal('heat'); }} disabled={row.status === 'completed' || row.status === 'failed'}>
                        <i className="bx bx-heart align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`heat-button-${row._id}`}>
                        Registrar celo
                    </UncontrolledTooltip>


                    <Button id={`diagnose-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedInsemination(row); toggleModal('diagnosis'); }} disabled={row.status === 'completed' || row.status === 'failed'} >
                        <i className="bx bx-dna align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`diagnose-button-${row._id}`}>
                        Registrar diagnóstico
                    </UncontrolledTooltip>

                    <Button id={`view-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/gestation/insemination_details/${row._id}`); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`view-button-${row._id}`} >
                        Ver detalles
                    </UncontrolledTooltip>
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
                setAlertConfig({ visible: true, color: 'success', message: `Celo registrado en ${activeInseminationIds.length} inseminaciones con éxito` });
                loadData();
                setSelectedInseminations([]);
                bulkHeatFormik.resetForm();
            } catch (error) {
                console.error('Error bulk registering heat:', error);
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al registrar el celo masivo, intentelo más tarde' });
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
                
                // 1. Registrar diagnóstico masivo
                await configContext.axiosHelper.create(`${configContext.apiUrl}/insemination/diagnose_bulk`, {
                    inseminationIds: activeInseminationIds,
                    result: values.result,
                    diagnosisDate: values.diagnosisDate,
                    diagnose_notes: values.diagnose_notes,
                    diagnose_responsible: values.diagnose_responsible
                });

                // 2. Si el resultado es 'pregnant', crear pregnancies para cada inseminación
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

                // 3. Actualizar el stage de las cerdas a 'gestation'
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

                // 4. Registrar en el historial del usuario
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLoggged._id}`, {
                    event: `Diagnóstico masivo de ${activeInseminationIds.length} inseminaciones registrado`
                });

                setAlertConfig({ visible: true, color: 'success', message: `Diagnóstico registrado en ${activeInseminationIds.length} inseminaciones con éxito` });
                loadData();
                setSelectedInseminations([]);
                bulkDiagnosisFormik.resetForm();
            } catch (error) {
                console.error('Error bulk diagnosing:', error);
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al registrar el diagnóstico masivo, intentelo más tarde' });
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
                `${configContext.apiUrl}/reports/inseminations/range?start_date=${startDate}&end_date=${endDate}&farm_id=${userLoggged.farm_assigned}`
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);

            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            console.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' });
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
            console.error(error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un erorr al obtener los datos, intentelo de nuevo' })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Ver Inseminaciones"} pageTitle={"Gestación"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title="Total inseminaciones"
                        value={inseminationsStats?.inseminationStats?.[0]?.total ?? 0}
                        icon={FiActivity}
                        bgColor="#e8f4fd"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title="Inseminaciones activas"
                        value={inseminationsStats?.inseminationStats?.[0]?.active ?? 0}
                        icon={FiPlayCircle}
                        bgColor="#fff8e1"
                        iconColor="#f6c000"
                    />

                    <KPI
                        title="Inseminaciones completadas"
                        value={inseminationsStats?.inseminationStats?.[0]?.completed ?? 0}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title="Inseminaciones fallidas"
                        value={inseminationsStats?.inseminationStats?.[0]?.failed ?? 0}
                        icon={FiXCircle}
                        bgColor="#fdecea"
                        iconColor="#dc3545"
                    />
                </div>

                <div className="d-flex gap-3">
                    <LineChartCard stats={inseminationsStats} type={"volume"} title={"Insemimaciones por periodo"} yLabel={"Inseminaciones"} />

                    <BasicBarChart
                        title="Inseminaciones por cerda"
                        data={(inseminationsStats?.inseminationsBySow ?? []).map((item: any) => ({
                            sowCode: item.sowCode,
                            count: item.count
                        }))}
                        indexBy="sowCode"
                        keys={["count"]}
                        xLegend="Cerda"
                        yLegend="Número de inseminaciones"
                    />

                    <BasicPieChart
                        title="Resultados de inseminaciones"
                        data={[
                            { id: 'Preñadas', value: inseminationsStats?.resultsStats?.[0]?.pregnant ?? 0 },
                            { id: 'Vacías', value: inseminationsStats?.resultsStats?.[0]?.empty ?? 0 },
                            { id: 'Abortos', value: inseminationsStats?.resultsStats?.[0]?.abortion ?? 0 },
                            { id: 'Reabsorciones', value: inseminationsStats?.resultsStats?.[0]?.resorption ?? 0 },
                            { id: 'Dudosas / Sin diagnóstico', value: inseminationsStats?.resultsStats?.[0]?.doubtfulOrMissing ?? 0 }
                        ]}
                    />

                </div>

                <Card style={{}}>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3 flex-grow-1">
                            {selectedInseminations.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedInseminations.length} {selectedInseminations.length === 1 ? 'inseminación seleccionada' : 'inseminaciones seleccionadas'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-warning-button btn-sm"
                                            disabled={!hasActiveInseminations}
                                            title={!hasActiveInseminations ? "No hay inseminaciones activas para registrar celo" : undefined}
                                            onClick={handleOpenBulkHeatForm}
                                        >
                                            <i className="bx bx-heart me-1"></i>
                                            Registrar Celo
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm ms-2"
                                            disabled={!hasActiveInseminations}
                                            title={!hasActiveInseminations ? "No hay inseminaciones activas para registrar diagnóstico" : undefined}
                                            onClick={handleOpenBulkDiagnosisForm}
                                        >
                                            <i className="bx bx-dna me-1"></i>
                                            Registrar Diagnóstico
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
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-pdf-line me-2"></i>
                                        Exportar PDF
                                    </>
                                )}
                            </Button>
                            <Button className="farm-primary-button" onClick={() => toggleModal("create")}>
                                <i className="ri-add-line me-2" />
                                Registrar inseminación
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
                                    <div>No hay inseminaciones disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva inseminación</ModalHeader>
                <ModalBody>
                    <InseminationForm onSave={() => { toggleModal('create'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('create')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>Registrar diagnóstico</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={selectedInsemination} onSave={() => { toggleModal('diagnosis'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("heat")}>Registrar celo</ModalHeader>
                <ModalBody>
                    {selectedInsemination && <HeatForm insemination={selectedInsemination} onSave={() => { toggleModal('heat'); fetchInseminations(); fetchInseminationsStats(); }} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            {/* Modal Bulk Heat Form */}
            <Modal isOpen={modals.bulkHeat} toggle={() => toggleModal("bulkHeat")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkHeat")}>
                    Registrar Celo en {selectedInseminations.filter(ins => ins.status !== 'completed' && ins.status !== 'failed').length} Inseminaciones
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkHeatFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                Esta acción registrará el celo en las inseminaciones activas seleccionadas.
                            </small>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="heatDetected" className="form-label">Celo detectado</Label>
                            <Input
                                type="select"
                                id="heatDetected"
                                name="heatDetected"
                                value={bulkHeatFormik.values.heatDetected ? "true" : "false"}
                                onChange={(e) => bulkHeatFormik.setFieldValue("heatDetected", e.target.value === "true")}
                                onBlur={bulkHeatFormik.handleBlur}
                                invalid={bulkHeatFormik.touched.heatDetected && !!bulkHeatFormik.errors.heatDetected}
                            >
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </Input>
                            {bulkHeatFormik.touched.heatDetected && bulkHeatFormik.errors.heatDetected && (
                                <FormFeedback>{bulkHeatFormik.errors.heatDetected}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">Fecha del registro</Label>
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
                                <Label htmlFor="responsible" className="form-label">Responsable</Label>
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
                            <Label htmlFor="notes" className="form-label">Notas</Label>
                            <Input
                                type="text"
                                id="notes"
                                name="notes"
                                value={bulkHeatFormik.values.notes}
                                onChange={bulkHeatFormik.handleChange}
                                onBlur={bulkHeatFormik.handleBlur}
                                invalid={bulkHeatFormik.touched.notes && !!bulkHeatFormik.errors.notes}
                                placeholder="Ej: Celo leve, comportamiento dudoso"
                            />
                            {bulkHeatFormik.touched.notes && bulkHeatFormik.errors.notes && (
                                <FormFeedback>{bulkHeatFormik.errors.notes}</FormFeedback>
                            )}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkHeat", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => bulkHeatFormik.handleSubmit()} disabled={bulkHeatFormik.isSubmitting}>
                        {bulkHeatFormik.isSubmitting ? <Spinner size="sm" /> : 'Confirmar Registro'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Modal Bulk Diagnosis Form */}
            <Modal isOpen={modals.bulkDiagnosis} toggle={() => toggleModal("bulkDiagnosis")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkDiagnosis")}>
                    Registrar Diagnóstico en {selectedInseminations.filter(ins => ins.status !== 'completed' && ins.status !== 'failed').length} Inseminaciones
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkDiagnosisFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                Esta acción registrará el diagnóstico en las inseminaciones activas seleccionadas.
                            </small>
                            {bulkDiagnosisFormik.values.result === 'pregnant' && (
                                <div className="alert alert-info mt-2 d-flex align-items-center gap-2">
                                    <FiInfo size={20} />
                                    <small>
                                        Se crearán automáticamente registros de embarazo para las inseminaciones diagnosticadas como preñadas.
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="result" className="form-label">Diagnóstico</Label>
                            <Input
                                type="select"
                                name="result"
                                value={bulkDiagnosisFormik.values.result}
                                onChange={bulkDiagnosisFormik.handleChange}
                                onBlur={bulkDiagnosisFormik.handleBlur}
                                invalid={bulkDiagnosisFormik.touched.result && !!bulkDiagnosisFormik.errors.result}
                            >
                                <option value="pregnant">Preñada</option>
                                <option value="empty">Vacía</option>
                                <option value="doubtful">Dudosa</option>
                                <option value="resorption">Reabsorción</option>
                                <option value="abortion">Aborto</option>
                            </Input>
                            {bulkDiagnosisFormik.touched.result && bulkDiagnosisFormik.errors.result && (
                                <FormFeedback>{bulkDiagnosisFormik.errors.result}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="diagnosisDate" className="form-label">Fecha de diagnóstico</Label>
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
                                <Label htmlFor="responsible" className="form-label">Responsable</Label>
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
                            <Label htmlFor="diagnose_notes" className="form-label">Notas</Label>
                            <Input
                                type="text"
                                id="diagnose_notes"
                                name="diagnose_notes"
                                value={bulkDiagnosisFormik.values.diagnose_notes}
                                onChange={bulkDiagnosisFormik.handleChange}
                                onBlur={bulkDiagnosisFormik.handleBlur}
                                invalid={bulkDiagnosisFormik.touched.diagnose_notes && !!bulkDiagnosisFormik.errors.diagnose_notes}
                                placeholder="Ej: Diagnóstico masivo por ultrasonido"
                            />
                            {bulkDiagnosisFormik.touched.diagnose_notes && bulkDiagnosisFormik.errors.diagnose_notes && (
                                <FormFeedback>{bulkDiagnosisFormik.errors.diagnose_notes}</FormFeedback>
                            )}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDiagnosis", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => bulkDiagnosisFormik.handleSubmit()} disabled={bulkDiagnosisFormik.isSubmitting}>
                        {bulkDiagnosisFormik.isSubmitting ? <Spinner size="sm" /> : 'Confirmar Diagnóstico'}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPigId} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            {/* Modal para seleccionar rango de fechas */}
            <Modal size="md" isOpen={modals.dateRange} toggle={() => toggleModal("dateRange")} centered>
                <ModalHeader toggle={() => toggleModal("dateRange")}>Seleccionar rango de fechas</ModalHeader>
                <ReportDateRangeSelector
                    onGenerate={handleGeneratePDF}
                    onCancel={() => toggleModal("dateRange")}
                    loading={pdfLoading}
                    generateButtonText="Generar PDF"
                />
            </Modal>

            {/* Modal PDF */}
            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de inseminaciones</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewInseminations;