import { ConfigContext } from "App";
import { SemenSample } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiInbox } from "react-icons/fi";
import { Badge, Button, Card, CardBody, CardHeader, Container, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, UncontrolledTooltip } from "reactstrap";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Column } from "common/data/data_types";
import PigDetailsModal from "Components/Common/Details/DetailsPigModal";
import { useNavigate } from "react-router-dom";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import KPI from "Components/Common/Graphics/Kpi";
import DiscardSampleForm from "Components/Common/Forms/DiscardSampleForm";
import SemenSampleForm from "Components/Common/Forms/SemenSampleForm";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";

const ViewSamples = () => {
    document.title = 'Ver génetica liquida | Management System'
    const userLoggged = getLoggedinUser();
    const configContext = useContext(ConfigContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, discard: false, pigDetails: false, bulkDiscard: false, bulkDiscardForm: false });
    const [samples, setSamples] = useState<SemenSample[]>([])
    const [selectedSample, setSelectedSample] = useState({})
    const [selectedSamples, setSelectedSamples] = useState<SemenSample[]>([])
    const [filteredSamples, setFilteredSamples] = useState<SemenSample[]>([]);
    const [selectedPig, setSelectedPig] = useState<any>({})
    const navigate = useNavigate();

    const samplesColumns: Column<any>[] = [
        {
            header: 'Lote',
            accessor: 'extraction_id',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.extraction_id.batch || "Sin lote"
        },
        {
            header: 'Verraco',
            accessor: 'boar',
            render: (_, row) => (
                <Button
                    className="text-underline fs-5"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        openPigDetailsModal(row)
                    }}
                >
                    {row.extraction_id?.boar?.code} ↗
                </Button>
            )
        },
        {
            header: 'Dosis totales',
            accessor: 'total_doses',
            type: 'number',
            isFilterable: true,
        },
        {
            header: 'Dosis disponibles',
            accessor: 'available_doses',
            type: 'number',
            isFilterable: true,
        },
        { header: 'Fecha de expiracion', accessor: 'expiration_date', type: 'date', isFilterable: false },
        { header: 'Método de conservación', accessor: 'conservation_method', type: 'text', isFilterable: true },
        {
            header: 'Responsable',
            accessor: 'technician',
            type: 'text',
            isFilterable: true,
            render: (_, row) => row.technician ? `${row.technician.name} ${row.technician.lastname}` : "Sin responsable"
        },
        {
            header: "Estado del lote",
            accessor: "lot_status",
            type: "text",
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.lot_status) {
                    case "available":
                        color = "success";
                        text = "Disponible";
                        break;
                    case "near_expiration":
                        color = "warning";
                        text = "A punto de expirar";
                        break;
                    case "expired":
                        color = "dark";
                        text = "Expirado";
                        break;
                    case "out_of_stock":
                        color = "dark";
                        text = "Sin dosis";
                        break;
                    case "discarded":
                        color = "dark";
                        text = "Descartado";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button id={`discard-button-${row._id}`} className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); openDiscardModal(row); }} disabled={row.lot_status === 'discarded' || row.lot_status === 'expired' || row.lot_status === 'out_of_stock'}>
                        <i className="ri-forbid-line align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`discard-button-${row._id}`}>
                        Descartar lote
                    </UncontrolledTooltip>

                    <Button id={`details-button-${row._id}`} className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/laboratory/samples/sample_details/${row._id}`); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                    <UncontrolledTooltip target={`details-button-${row._id}`}>
                        Ver detalles
                    </UncontrolledTooltip>
                </div>
            ),
        },
    ];

    const handleSelectionChange = (selected: any[]) => {
        setSelectedSamples(selected as SemenSample[]);
    };

    const hasDiscardableSamples = selectedSamples.some(s =>
        s.lot_status !== 'discarded' &&
        s.lot_status !== 'expired' &&
        s.lot_status !== 'out_of_stock'
    );

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const openPigDetailsModal = (data: any) => {
        setSelectedPig(data.extraction_id?.boar?._id);
        toggleModal('pigDetails')
    }

    const openDiscardModal = (row: any) => {
        setSelectedSample(row);
        toggleModal('discard');
    };

    const onDiscardedSample = () => {
        toggleModal('discard')
        fetchSemenSamples();
    }

    const fetchSemenSamples = async () => {
        if (!configContext || !userLoggged) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_farm/${userLoggged.farm_assigned}`)
            const samplesWithId = response.data.data.map((sample: any) => ({ ...sample, id: sample._id }));
            setSamples(samplesWithId)
            setFilteredSamples(samplesWithId)
        } catch (error) {
            console.error('Error fetching the data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const bulkDiscardValidationSchema = Yup.object({
        discard_reason: Yup.string().required("Por favor ingrese el motivo del descarte"),
        discard_date: Yup.date().required("La fecha es obligatoria"),
    });

    const bulkDiscardFormik = useFormik({
        initialValues: {
            discard_reason: "",
            discard_date: null as Date | null,
            discarded_by: userLoggged?._id || "",
        },
        enableReinitialize: true,
        validationSchema: bulkDiscardValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            const discardableSampleIds = selectedSamples
                .filter(s => s.lot_status !== 'discarded' && s.lot_status !== 'expired' && s.lot_status !== 'out_of_stock')
                .map(s => s._id);

            try {
                setSubmitting(true);
                await configContext.axiosHelper.put(`${configContext.apiUrl}/semen_sample/discard_sample_lots`, {
                    sampleIds: discardableSampleIds,
                    discard_reason: values.discard_reason,
                    discard_date: values.discard_date,
                    discarded_by: values.discarded_by
                });
                setAlertConfig({ visible: true, color: 'success', message: `${discardableSampleIds.length} lotes descartados con éxito` });
                fetchSemenSamples();
                setSelectedSamples([]);
            } catch (error) {
                console.error('Error bulk discarding samples:', error);
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al descartar los lotes, intentelo más tarde' });
            } finally {
                setSubmitting(false);
                bulkDiscardFormik.resetForm();
                toggleModal('bulkDiscardForm');
            }
        },
    });

    const handleOpenBulkDiscardForm = () => {
        bulkDiscardFormik.values.discard_date = new Date();
        toggleModal('bulkDiscardForm');
    };

    const onSaveSample = () => {
        toggleModal('create')
        fetchSemenSamples()
    }

    useEffect(() => {
        fetchSemenSamples();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Lotes"} pageTitle={"Génetica liquida"} />

                <div className="d-flex gap-3 flex-wrap">
                    <KPI
                        title="Lotes totales"
                        value={samples.length}
                        icon={FiCheckCircle}
                        bgColor="#e6f7e6"
                        iconColor="#28a745"
                    />

                    <KPI
                        title="Próximos a expirar"
                        value={samples.filter(s => s.lot_status === "near_expiration").length}
                        icon={FiAlertCircle}
                        bgColor="#fff4e6"
                        iconColor="#fd7e14"
                    />

                    <KPI
                        title="Disponibles"
                        value={samples.filter(s => s.lot_status === "available").length}
                        icon={FiCheckCircle}
                        bgColor="#e6f0ff"
                        iconColor="#0d6efd"
                    />

                    <KPI
                        title="Expirados"
                        value={samples.filter(s => s.lot_status === "expired").length}
                        icon={FiXCircle}
                        bgColor="#ffe6e6"
                        iconColor="#dc3545"
                    />

                    <KPI
                        title="Descartados"
                        value={samples.filter(s => s.lot_status === "discarded").length}
                        icon={FiXCircle}
                        bgColor="#f0f0f0"
                        iconColor="#6c757d"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            {selectedSamples.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedSamples.length} {selectedSamples.length === 1 ? 'lote seleccionado' : 'lotes seleccionados'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasDiscardableSamples}
                                            title={!hasDiscardableSamples ? "No hay lotes disponibles para descartar" : undefined}
                                            onClick={handleOpenBulkDiscardForm}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            Descartar Seleccionados
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
                                Agregar muestra
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {filteredSamples && filteredSamples.length > 0 ? (
                            <div style={{ flex: 1 }}>
                                <SelectableCustomTable
                                    columns={samplesColumns}
                                    data={filteredSamples}
                                    showPagination={true}
                                    rowsPerPage={7}
                                    onSelect={handleSelectionChange}
                                    selectionOnlyOnCheckbox={true}
                                />
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#888", }}>
                                <div>
                                    <FiInbox size={48} style={{ marginBottom: 10 }} />
                                    <div>No hay muestras disponibles</div>
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

            </Container>

            <Modal size="xl" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nueva muestra</ModalHeader>
                <ModalBody>
                    <SemenSampleForm onSave={() => onSaveSample()} onCancel={() => { }} />
                </ModalBody>
            </Modal>


            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPig} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.discard} toggle={() => toggleModal("discard")} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("discard")}>Descartar lote</ModalHeader>
                <ModalBody>
                    <DiscardSampleForm sample={selectedSample} onSave={() => onDiscardedSample()} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            {/* Modal Bulk Discard Form */}
            <Modal isOpen={modals.bulkDiscardForm} toggle={() => toggleModal("bulkDiscardForm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkDiscardForm")}>
                    Descartar {selectedSamples.filter(s => s.lot_status !== 'discarded' && s.lot_status !== 'expired' && s.lot_status !== 'out_of_stock').length} Lotes
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkDiscardFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                Esta acción marcará los lotes seleccionados como descartados y no podrán ser utilizados.
                            </small>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="discard_reason" className="form-label">Razón del descarte</Label>
                            <Input
                                type="text"
                                id="discard_reason"
                                name="discard_reason"
                                value={bulkDiscardFormik.values.discard_reason}
                                onChange={bulkDiscardFormik.handleChange}
                                onBlur={bulkDiscardFormik.handleBlur}
                                invalid={bulkDiscardFormik.touched.discard_reason && !!bulkDiscardFormik.errors.discard_reason}
                            />
                            {bulkDiscardFormik.touched.discard_reason && bulkDiscardFormik.errors.discard_reason && (
                                <FormFeedback>{bulkDiscardFormik.errors.discard_reason}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_date" className="form-label">Fecha del descarte</Label>
                                <DatePicker
                                    id="discard_date"
                                    className={`form-control ${bulkDiscardFormik.touched.discard_date && bulkDiscardFormik.errors.discard_date ? 'is-invalid' : ''}`}
                                    value={bulkDiscardFormik.values.discard_date ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkDiscardFormik.setFieldValue('discard_date', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkDiscardFormik.touched.discard_date && bulkDiscardFormik.errors.discard_date && (
                                    <FormFeedback className="d-block">{bulkDiscardFormik.errors.discard_date as string}</FormFeedback>
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
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDiscardForm", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => bulkDiscardFormik.handleSubmit()} disabled={bulkDiscardFormik.isSubmitting}>
                        {bulkDiscardFormik.isSubmitting ? <Spinner size="sm" /> : 'Confirmar Descarte'}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewSamples