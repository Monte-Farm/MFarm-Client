import { ConfigContext } from "App";
import { ExtractionData, PigData, UserData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import * as Yup from 'yup';
import { Alert, Badge, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import { Column } from "common/data/data_types";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import { HttpStatusCode } from "axios";
import SuccessModal from "../Shared/SuccessModal";
import PigDetailsModal from "../Details/DetailsPigModal";
import SelectableTable from "../Tables/SelectableTable";


interface ExtractionFormProps {
    initialData?: ExtractionData;
    onSave: () => void;
    onCancel: () => void;
}

const ExtractionForm: React.FC<ExtractionFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [boars, setBoars] = useState<PigData[]>([])
    const [users, setUsers] = useState<UserData[]>([])
    const [alertBoarEmpty, setAlertBoarEmpty] = useState<boolean>(false)
    const [alertExtractionDataEmpty, setAlertExtractionDataEmpty] = useState<boolean>(false)
    const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false)
    const [modalOpen, setModalOpen] = useState(false);
    const [idSelectedPig, setIdSelectedPig] = useState<string>("");

    const boarsColumns: Column<any>[] = [
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
                        toggleModal();
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        { header: 'Peso actual', accessor: 'weight', type: 'number', isFilterable: true },
        {
            header: 'Etapa',
            accessor: 'currentStage',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "piglet":
                        color = "info";
                        label = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        label = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        label = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        label = "Reproductor";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
    ]

    const toggleModal = () => setModalOpen(!modalOpen);

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const handleError = (error: any, message: string) => {
        console.error(`${message}: ${error}`)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const validationSchema = Yup.object({
        batch: Yup.string().required('Por favor ingrese el lote'),
        date: Yup.date().required('Por favor ingrese la fecha de la extracción'),
        technician: Yup.string().required('Por favor, seleccione al tecnico'),
        farm: Yup.string().required('Por favor, seleccione la granja'),
        extraction_location: Yup.string().required('Por favor, ingrese la ubicación de la extracción'),
        notes: Yup.string(),
        unit_measurement: Yup.string().required('Por favor, ingrese la unidad de medida de la muestra'),
        appearance: Yup.string().required('Por favor, ingrese la apariencia de la muestra'),
        volume: Yup.number().min(0, "El volumen no puede ser menor a 0").required('Por favor, ingrese el volumen')
    })

    const formik = useFormik<ExtractionData>({
        initialValues: initialData || {
            date: null,
            technician: userLogged._id || "",
            farm: userLogged.farm_assigned || "",
            boar: "",
            extraction_location: "",
            batch: "",
            notes: "",
            is_sample_registered: false,
            volume: 0,
            unit_measurement: '',
            appearance: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/extraction/create`, values);
                if (response.status === HttpStatusCode.Created) {
                    const item = {
                        date: values.date,
                        type: 'extraction',
                        responsible: values.technician,
                        description: 'Extraccion de semen',
                        eventRef: response.data.data._id,
                        eventModel: 'extractions'
                    }

                    await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/add_reproduction_item/${values.boar}`, item)

                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Extracción del verraco ${values.boar} registrada`
                    });
                    setSuccessModalOpen(true)
                }
            } catch (err: any) {
                if (err.response && err.response.status === HttpStatusCode.BadRequest) {
                    handleError(err, `El lote ${values.batch} ya existe, por favor ingrese otro`)
                } else {
                    handleError(err, "Ha ocurrido un error al registrar los datos, inténtelo más tarde");
                }
            } finally {
                setSubmitting(false);
            }
        }
    })

    const checkBoarSelected = () => {
        if (formik.values.boar === "") {
            setAlertBoarEmpty(true)
            setTimeout(() => {
                setAlertBoarEmpty(false)
            }, 4000);
            return
        }
        toggleArrowTab(2)
    }

    const checkExtractionData = async () => {
        formik.setTouched({
            batch: true,
            date: true,
            extraction_location: true,
            technician: true,
            farm: true,
            volume: true,
            unit_measurement: true,
            appearance: true
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err) {
            setAlertExtractionDataEmpty(true);
            setTimeout(() => setAlertExtractionDataEmpty(false), 4000);
        }
    };

    const fetchBoars = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_boars/${userLogged.farm_assigned}`)
            const boarsWithId = response.data.data.map((b: any) => ({ ...b, id: b._id }));
            setBoars(boarsWithId)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los verracos, intentelo mas tarde')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_all_by_farm/${userLogged.farm_assigned}`)
            setUsers(response.data.data)
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los usuarios, intentelo mas tarde');
        } finally {
            setLoading(false)
        }

    }

    const fetchNextBatch = async () => {
        if (!configContext) return
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/next_batch`);
            const nextBatch = response.data.data;
            formik.setFieldValue("batch", nextBatch);
        } catch (error) {
            console.error("Error al obtener el siguiente lote:", error);
        }
    }

    useEffect(() => {
        fetchBoars();
        fetchUsers();
        fetchNextBatch()
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
                                id="step-boarselect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-boarselect-tab"
                            >
                                Selección de verraco
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-extractioninfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-extractioninfo-tab"
                            >
                                Información de la extracción
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-summary-tab"
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-boarselect-tab" tabId={1}>
                        <SelectableTable data={boars} columns={boarsColumns} selectionMode="single" showPagination={true} rowsPerPage={6} onSelect={(rows) => formik.setFieldValue('boar', rows[0]?._id)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkBoarSelected()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                        {alertBoarEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, seleccione un verraco</span>

                                <Button close onClick={() => setAlertBoarEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-extractioninfo-tab" tabId={2}>
                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="batch" className="form-label">Lote</Label>
                                <Input
                                    type="text"
                                    id="batch"
                                    name="batch"
                                    value={formik.values.batch}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.batch && !!formik.errors.batch}
                                    placeholder="Ej: L-0001"
                                    disabled={initialData ? true : false}
                                />
                                {formik.touched.batch && formik.errors.batch && (
                                    <FormFeedback>{formik.errors.batch}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="date" className="form-label">Fecha de extracción</Label>
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
                        </div>

                        <div className="d-flex gap-3">
                            <div className="mt-4 w-100">
                                <Label htmlFor="volume" className="form-label">Volumen</Label>
                                <Input
                                    type="number"
                                    id="volume"
                                    name="volume"
                                    value={formik.values.volume}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.volume && !!formik.errors.volume}
                                    placeholder="Ej: 100"
                                />
                                {formik.touched.volume && formik.errors.volume && (
                                    <FormFeedback>{formik.errors.volume}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="unit_measurement" className="form-label">Unidad de medida</Label>
                                <Input
                                    type="text"
                                    id="unit_measurement"
                                    name="unit_measurement"
                                    value={formik.values.unit_measurement}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.unit_measurement && !!formik.errors.unit_measurement}
                                    placeholder="Ej: ml"
                                />
                                {formik.touched.unit_measurement && formik.errors.unit_measurement && (
                                    <FormFeedback>{formik.errors.unit_measurement}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="appearance" className="form-label">Apariencia de la extracción</Label>
                                <Input
                                    type="text"
                                    id="appearance"
                                    name="appearance"
                                    value={formik.values.appearance}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.appearance && !!formik.errors.appearance}
                                    placeholder="Ej: apariencia normal"
                                />
                                {formik.touched.appearance && formik.errors.appearance && (
                                    <FormFeedback>{formik.errors.appearance}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <div className="mt-4 w-50">
                                <Label htmlFor="extraction_location" className="form-label">Ubicación de extracción</Label>
                                <Input
                                    type="text"
                                    id="extraction_location"
                                    name="extraction_location"
                                    value={formik.values.extraction_location}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.extraction_location && !!formik.errors.extraction_location}
                                    placeholder="Ej: Laboratorio"
                                />
                                {formik.touched.extraction_location && formik.errors.extraction_location && (
                                    <FormFeedback>{formik.errors.extraction_location}</FormFeedback>
                                )}
                            </div>

                            <div className="mt-4 w-50">
                                <Label htmlFor="technician" className="form-label">
                                    Responsable de la extracción
                                </Label>
                                <Input
                                    type="select"
                                    id="technician"
                                    name="technician"
                                    value={formik.values.technician}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.technician && !!formik.errors.technician}
                                >
                                    <option value="">Seleccione un responsable</option>
                                    {users.map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} {user.lastname}
                                        </option>
                                    ))}
                                </Input>
                                {formik.touched.technician && formik.errors.technician && (
                                    <FormFeedback>{formik.errors.technician}</FormFeedback>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="notes" className="form-label">Notas</Label>
                            <Input
                                type="textarea"
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

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" onClick={() => checkExtractionData()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                        {alertExtractionDataEmpty && (
                            <Alert color='danger' className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-3">
                                <FiXCircle size={22} />
                                <span className="flex-grow-1 text-black">Por favor, llene todos los datos requeridos</span>
                                <Button close onClick={() => setAlertExtractionDataEmpty(false)} />
                            </Alert>
                        )}
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className="row g-4 mt-4">
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-primary text-white fs-5 d-flex align-items-center justify-content-center">
                                        Datos del verraco
                                    </div>
                                    <div className="card-body">
                                        {(() => {
                                            const selectedBoar = boars.find(b => b._id === formik.values.boar);
                                            if (!selectedBoar) {
                                                return <p className="text-muted text-center">No se seleccionó un verraco</p>;
                                            }
                                            return (
                                                <ul className="list-group list-group-flush fs-5">
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Código:</strong></span>
                                                        <span className="text-black">{selectedBoar.code}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Raza:</strong></span>
                                                        <span className="text-black">{selectedBoar.breed}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Peso:</strong></span>
                                                        <span className="text-black">{selectedBoar.weight} kg</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Etapa:</strong></span>
                                                        <span className="text-black">{selectedBoar.currentStage}</span>
                                                    </li>
                                                    <li className="list-group-item d-flex justify-content-between">
                                                        <span className="text-black"><strong>Fecha de Nac.:</strong></span>
                                                        <span className="text-black">{selectedBoar.birthdate ? new Date(selectedBoar.birthdate).toLocaleDateString() : "Sin fecha"}</span>
                                                    </li>
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>


                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 rounded-3 h-100">
                                    <div className="card-header bg-success text-white fs-5 d-flex align-items-center justify-content-center">
                                        Información de la extracción
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush fs-5">
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Lote:</strong></span>
                                                <span className="text-black">{formik.values.batch}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Fecha:</strong></span>
                                                <span className="text-black">{formik.values.date ? new Date(formik.values.date).toLocaleDateString() : ""}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Ubicación:</strong></span>
                                                <span className="text-black">{formik.values.extraction_location}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Técnico:</strong></span>
                                                <span className="text-black">{`${userLogged.name} ${userLogged.lastname}`}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Volumen:</strong></span>
                                                <span className="text-black">{formik.values.volume} {formik.values.unit_measurement}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Apariencia:</strong></span>
                                                <span className="text-black">{formik.values.appearance}</span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between">
                                                <span className="text-black"><strong>Notas:</strong></span>
                                                <span className="text-black">{formik.values.notes || "Sin notas"}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <div>
                                        <Spinner size='sm' />
                                    </div>
                                ) : (
                                    <div>
                                        <i className="ri-check-line me-2" />
                                        Registrar
                                    </div>
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
                    <PigDetailsModal pigId={idSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="d-flex align-items-center gap-2 shadow rounded-3 p-3 mt-4">
                    {alertConfig.color === "success" && <FiCheckCircle size={22} />}
                    {alertConfig.color === "danger" && <FiXCircle size={22} />}
                    {alertConfig.color === "warning" && <FiAlertCircle size={22} />}
                    {alertConfig.color === "info" && <FiInfo size={22} />}

                    <span className="flex-grow-1 text-black">{alertConfig.message}</span>

                    <Button close onClick={() => setAlertConfig({ ...alertConfig, visible: false })} />
                </Alert>
            )}

            <SuccessModal isOpen={successModalOpen} onClose={onSave} message={"Extracción registrada con éxito"} />
        </>
    )
}

export default ExtractionForm