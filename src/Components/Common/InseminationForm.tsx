import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { InseminationData, PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, CardHeader, CardText, CardTitle, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import SelectableTable from "./SelectableTable";
import { FiXCircle } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import SimpleBar from "simplebar-react";
import SuccessModal from "./SuccessModal";
import { HttpStatusCode } from "axios";
import PigDetailsModal from "./DetailsPigModal";


interface InseminationFormProps {
    initialData?: InseminationData;
    onSave: () => void;
    onCancel: () => void;
}

const InseminationForm: React.FC<InseminationFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertSowEmpty, setAlertSowEmpty] = useState<boolean>(false)
    const [alertInseminationDataEmpty, setAlertInseminationDataEmpty] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [sows, setSows] = useState<PigData[]>([])
    const [doses, setDoses] = useState<any[]>([])
    const [modalOpen, setModalOpen] = useState(false);
    const [extractionData, setExtractionData] = useState<any>(null);
    const [selectedDoses, setSelectedDoses] = useState<any[]>([]);
    const [alertDosesIncomplete, setAlertDosesIncomplete] = useState(false);
    const [pigDetailsmodalOpen, setPigDetailsModalOpen] = useState(false);
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");

    const sowsColumns: Column<any>[] = [
        {
            header: 'Codigo',
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIdSelectedPig(row._id);
                        togglePigDetailsModal();
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        { header: 'Peso actual', accessor: 'weight', type: 'number', isFilterable: true },
        { header: 'Etapa actual', accessor: 'currentStage', type: 'text', isFilterable: true },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
    ]

    const dosesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        {
            header: 'Genetica liquida',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.semen_volume} ${row.unit_measurement}` || 0
        },
        {
            header: 'Volumen diluyente',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.diluent_volume} ${row.unit_measurement}` || 0
        },
        {
            header: 'Volumen total',
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.total_volume} ${row.unit_measurement}` || 0
        },
        { header: 'Verraco', accessor: 'boar_code', type: 'text', isFilterable: true },
        {
            header: 'Detalles de extracción',
            accessor: 'action',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        fetchExtractionDetails(row.extraction_id, row.semen_sample_id);
                    }}
                >
                    Ver detalles ↗
                </Button>
            )
        }
    ]


    const toggleModal = () => setModalOpen(!modalOpen);
    const togglePigDetailsModal = () => setPigDetailsModalOpen(!pigDetailsmodalOpen);


    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 2000);
    }

    const handleError = (error: any, message: string) => {
        console.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const inseminationValidationSchema = Yup.object({
        date: Yup.date().required('Por favor ingrese la fecha de la inseminación'),
    });

    const formik = useFormik<InseminationData>({
        initialValues: initialData || {
            sow: '',
            date: null,
            responsible: userLogged._id || "",
            status: 'active',
            notes: '',
            doses: [],
            heats: [],
        },
        enableReinitialize: true,
        validationSchema: inseminationValidationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/insemination/create`, values);
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Inseminacion registrada`
                    });
                    setSuccessModalOpen(true)
                }
            } catch (err: any) {

            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkSowSelected = () => {
        if (formik.values.sow === "") {
            setAlertSowEmpty(true)
            setTimeout(() => {
                setAlertSowEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(2)
    }

    const checkInseminationData = async () => {
        if (selectedDoses.length === 0) {
            setAlertInseminationDataEmpty(true)
            setTimeout(() => {
                setAlertInseminationDataEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(3)
    };

    const validateAndSaveDoses = () => {
        const incomplete = selectedDoses.some(dose => !dose.time);

        if (incomplete) {
            setAlertDosesIncomplete(true);
            setTimeout(() => setAlertDosesIncomplete(false), 4000);
            return;
        }

        const formattedDoses = selectedDoses.map((dose, index) => ({
            dose: dose._id,
            order: index + 1,
            time: dose.time,
            notes: dose.notes,
        }));

        formik.setFieldValue('doses', formattedDoses);

        toggleArrowTab(activeStep + 1);
    };


    const fetchSows = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_sows_not_inseminated/${userLogged.farm_assigned}`)
            const sowsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setSows(sowsWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los verracos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchDoses = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_doses_available/${userLogged.farm_assigned}`)
            const dosesWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setDoses(dosesWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los verracos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchExtractionDetails = async (extractionId: string, sampleId: string) => {
        if (!configContext || !userLogged) return;

        try {
            const [extractionRes, sampleRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_id/${extractionId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_id/${sampleId}`),
            ]);

            setExtractionData({
                extraction: extractionRes.data.data,
                sample: sampleRes.data.data,
            });

            toggleModal();
        } catch (error) {
            console.error("Error fetching details", error);
        }
    };

    useEffect(() => {
        fetchSows();
        fetchDoses();
        formik.setFieldValue('date', new Date())
    }, [])

    return (
        <>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                }}
            >
                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-sowselect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-sowselect-tab"
                            >
                                Selección de cerda
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-inseminationinfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-inseminationinfo-tab"
                            >
                                Información de la inseminación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-doses-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-doses-tab"
                            >
                                Datos de dosis
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 4,
                                    done: activeStep > 4,
                                })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                aria-controls="step-summary-tab"
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-sowselect-tab" tabId={1}>
                        <SelectableTable data={sows} columns={sowsColumns} selectionMode="single" showPagination={true} rowsPerPage={15} onSelect={(rows) => formik.setFieldValue('sow', rows[0]?._id)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSowSelected()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alertSowEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, seleccione una cerda</span>

                                <Button close onClick={() => setAlertSowEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-inseminationinfo-tab" tabId={2}>
                        <div className="d-flex gap-2">
                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">Fecha de inseminación</Label>
                                <DatePicker
                                    id="date"
                                    className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                    value={formik.values.date ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('date', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.date && formik.errors.date && (
                                    <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="notes" className="form-label">Notas</Label>
                                <Input
                                    type="text"
                                    id="notes"
                                    name="notes"
                                    value={formik.values.notes}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.notes && !!formik.errors.notes}
                                    placeholder="Ej: Extraccion parcial"
                                />
                                {formik.touched.notes && formik.errors.notes && (
                                    <FormFeedback>{formik.errors.notes}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 border-top border-3 pt-3">
                            <Label className="form-label">Dosis de semen</Label>
                            <SelectableTable
                                data={doses}
                                columns={dosesColumns}
                                selectionMode="multiple"
                                showPagination={true}
                                rowsPerPage={7}
                                onSelect={(rows) => {
                                    setSelectedDoses(rows);
                                }}
                            />
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={() => checkInseminationData()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertInseminationDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, seleccione al menos una dosis</span>

                                <Button close onClick={() => setAlertSowEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-doses-tab" tabId={3}>
                        <DragDropContext
                            onDragEnd={(result: DropResult) => {
                                if (!result.destination) return;
                                const items = Array.from(selectedDoses);
                                const [reordered] = items.splice(result.source.index, 1);
                                items.splice(result.destination.index, 0, reordered);
                                setSelectedDoses(items);
                            }}
                        >
                            <Droppable droppableId="dosesList">
                                {(provided) => (
                                    <SimpleBar style={{ maxHeight: 700 }} {...provided.droppableProps}>
                                        <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {selectedDoses.map((dose, index) => (
                                                <Draggable
                                                    key={dose._id || index}
                                                    draggableId={dose._id || index.toString()}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >
                                                            <Card className="mb-2 shadow-sm">
                                                                <CardHeader className="bg-primary text-white d-flex justify-content-between align-items-center">
                                                                    <span className="fs-5">Dosis: {dose.code}</span>
                                                                    <span className="badge bg-light text-dark fs-5">Orden {index + 1}</span>
                                                                </CardHeader>
                                                                <CardBody className="d-flex flex-column gap-3">
                                                                    <div className="d-flex gap-2">
                                                                        <div className="w-50">
                                                                            <Label>Fecha y hora de aplicación</Label>
                                                                            <DatePicker
                                                                                className="form-control"
                                                                                value={dose.time ?? undefined}
                                                                                onChange={(date: Date[]) => {
                                                                                    const updated = [...selectedDoses];
                                                                                    updated[index].time = date[0];
                                                                                    setSelectedDoses(updated);
                                                                                }}
                                                                                options={{ enableTime: true, dateFormat: 'd/m/Y H:i' }}
                                                                            />
                                                                        </div>
                                                                        <div className="w-50">
                                                                            <Label>Notas</Label>
                                                                            <Input
                                                                                type="text"
                                                                                value={dose.notes ?? ''}
                                                                                onChange={(e) => {
                                                                                    const updated = [...selectedDoses];
                                                                                    updated[index].notes = e.target.value;
                                                                                    setSelectedDoses(updated);
                                                                                }}
                                                                                placeholder="Opcional"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </CardBody>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </SimpleBar>
                                )}
                            </Droppable>
                        </DragDropContext>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={validateAndSaveDoses}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertDosesIncomplete && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor complete todos los campos de las dosis</span>
                                <Button close onClick={() => setAlertDosesIncomplete(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={4}>
                        <div className="row g-4 mt-4">

                            {/* Datos de la cerda */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        Datos de la cerda
                                    </div>
                                    <div className="card-body">
                                        {(() => {
                                            const selectedSow = sows.find(s => s._id === formik.values.sow);
                                            if (!selectedSow) return <p className="text-muted text-center">No se seleccionó ninguna cerda</p>;
                                            return (
                                                <ul className="list-group list-group-flush fs-5">
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Código:</strong></span>
                                                        <span className="text-black">{selectedSow.code}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Raza:</strong></span>
                                                        <span className="text-black">{selectedSow.breed}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Peso actual:</strong></span>
                                                        <span className="text-black">{selectedSow.weight} kg</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Etapa actual:</strong></span>
                                                        <span className="text-black">{selectedSow.currentStage}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Fecha de nacimiento:</strong></span>
                                                        <span className="text-black">{selectedSow.birthdate ? new Date(selectedSow.birthdate).toLocaleDateString() : "-"}</span>
                                                    </li>
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Información de la inseminación */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        Información de la inseminación
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush fs-5">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Fecha:</strong></span>
                                                <span className="text-black">{formik.values.date ? new Date(formik.values.date).toLocaleDateString() : "-"}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Responsable:</strong></span>
                                                <span className="text-black">{userLogged.name} {userLogged.lastname}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Notas:</strong></span>
                                                <span className="text-black">{formik.values.notes || "Sin notas"}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Fecha de preñez (tentativa)</strong></span>
                                                <span className="text-black">
                                                    {formik.values.date ? new Date(new Date(formik.values.date).getTime() + 115 * 24 * 60 * 60 * 1000).toLocaleDateString() : "Sin fecha"}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Dosis */}
                            <div className="col-12">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-info text-white fs-5 d-flex align-items-center justify-content-center">
                                        Dosis
                                    </div>
                                    <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                                        {formik.values.doses.length === 0 ? (
                                            <p className="text-muted text-center fs-5">No se han agregado dosis</p>
                                        ) : (
                                            <ul className="list-group list-group-flush fs-5">
                                                {formik.values.doses.map((dose, idx) => {

                                                    const doseInfo = selectedDoses.find(d => d._id === dose.dose);
                                                    const displayCode = doseInfo?.code || dose.dose;

                                                    return (
                                                        <li key={idx} className="list-group-item d-flex justify-content-between">
                                                            <span className="text-black"><strong>{displayCode}</strong></span>
                                                            <span className="text-black">
                                                                {dose.time ? new Date(dose.time).toLocaleString() : "-"} | {dose.notes || "Sin notas"}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto btn-success" type="submit" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <i className="ri-check-line me-2" />
                                        Registrar
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" centered className="border-0">
                <ModalHeader toggle={toggleModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">Detalles de la extracción</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    {extractionData ? (
                        <Row className="d-flex align-items-stretch g-3">
                            {/* Información de la extracción */}
                            <Col md={6} className="d-flex">
                                <div className="card shadow-sm border-0 rounded-3 w-100 h-100 d-flex flex-column">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        Datos de la extracción
                                    </div>
                                    <div className="card-body p-0 d-flex flex-column flex-grow-1">
                                        <ul className="list-group list-group-flush flex-grow-1">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Fecha:</strong> <span className="text-black">{new Date(extractionData.extraction.date).toLocaleString()}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Técnico:</strong> <span className="text-black">{extractionData.extraction.technician.name} {extractionData.extraction.technician.lastname}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Verraco:</strong> <span className="text-black">{extractionData.extraction.boar.code} ({extractionData.extraction.boar.breed})</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Ubicación:</strong> <span className="text-black">{extractionData.extraction.extraction_location}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Lote:</strong> <span className="text-black">{extractionData.extraction.batch}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Volumen total:</strong> <span className="text-black">{extractionData.extraction.volume} {extractionData.extraction.unit_measurement}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Notas:</strong> <span className="text-black">{extractionData.extraction.notes || 'N/A'}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Apariencia:</strong> <span className="text-black">{extractionData.extraction.appearance}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>

                            {/* Información de la muestra */}
                            <Col md={6} className="d-flex">
                                <div className="card shadow-sm border-0 rounded-3 w-100 h-100 d-flex flex-column">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        Información de la muestra
                                    </div>
                                    <div className="card-body p-0 d-flex flex-column flex-grow-1">
                                        <ul className="list-group list-group-flush flex-grow-1">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Diluyente:</strong> <span className="text-black">{extractionData.sample.diluent.type} (Lote {extractionData.sample.diluent.lot})</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Concentración (millones):</strong> <span className="text-black">{extractionData.sample.concentration_million}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Motilidad (%):</strong> <span className="text-black">{extractionData.sample.motility_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Vitalidad (%):</strong> <span className="text-black">{extractionData.sample.vitality_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Anomalías (%):</strong> <span className="text-black">{extractionData.sample.abnormal_percent}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>pH:</strong> <span className="text-black">{extractionData.sample.pH}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Temperatura (°C):</strong> <span className="text-black">{extractionData.sample.temperature}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Método de conservación:</strong> <span className="text-black">{extractionData.sample.conservation_method}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <strong>Fecha de expiración:</strong> <span className="text-black">{new Date(extractionData.sample.expiration_date).toLocaleDateString()}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    ) : (
                        <div className="text-center py-5 d-flex flex-column align-items-center">
                            <Spinner color="primary" className="mb-3" />
                            <p className="text-muted mb-0">Cargando información...</p>
                        </div>
                    )}
                </ModalBody>
            </Modal>

            <Modal isOpen={pigDetailsmodalOpen} toggle={togglePigDetailsModal} size="lg" centered className="border-0">
                <ModalHeader toggle={togglePigDetailsModal} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">Detalles de la cerda</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Inseminación registrada con éxito"} />

        </>
    )
}

export default InseminationForm;