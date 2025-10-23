import { ConfigContext } from "App";
import { GroupData, PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import CustomTable from "./CustomTable";
import { Column } from "common/data/data_types";
import DatePicker from "react-flatpickr";
import pigDefaultImage from '../../assets/images/pig-default.png'
import noMotherImage from '../../assets/images/no-mother.png'
import { HttpStatusCode } from "axios";

interface GroupFormProps {
    initialData?: GroupData;
    onSave: () => void;
    onCancel: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [motherPigs, setMotherPigs] = useState<PigData[]>([]);
    const [selectGroupsPigs, setSelectGroupsPigs] = useState<PigData[]>([]);
    const [selectedPigs, setSelectedPigs] = useState<PigData[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incompleteFieldsAlert, setIncompleteFieldsAlert] = useState({ visible: false, message: "" });
    const [cancelModal, setCancelModal] = useState(false);
    const [pigManualSelection, setPigManualSelection] = useState<boolean>(false);
    const [showFeedingForm, setShowFeedingForm] = useState(false);
    const [showMedicationForm, setShowMedicationForm] = useState(false);
    const [feedingForm, setFeedingForm] = useState({
        date: null,
        userId: userLogged._id || '',
        feedType: '',
        name: '',
        amount: 0,
        unit_measurement: '',
        average_p_pig: 0,
        notes: '',
        periodicity: ''
    });
    const [medicationForm, setMedicationForm] = useState({
        applicationDate: null,
        userId: userLogged._id || '',
        treatmentType: '',
        medication: '',
        dosage: 0,
        average_p_pig: 0,
        notes: '',
        periodicity: '',
        unit_measurement: '',
        application_method: ''
    });

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const showIncompleteFieldsAlert = (message: string) => {
        setIncompleteFieldsAlert({ visible: true, message: message });

        setTimeout(() => {
            setIncompleteFieldsAlert(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const handleFeedingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeedingForm(prev => ({ ...prev, [name]: value }));
    };

    function handleMedicationInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        setMedicationForm(prev => ({
            ...prev,
            [name]: name === 'dosage' ? (value === '' ? '' : Number(value)) : value,
        }));
    }

    const handleAddFeedingEntry = () => {
        if (!feedingForm.feedType || feedingForm.amount <= 0 || !feedingForm.unit_measurement || !feedingForm.name || !feedingForm.periodicity) {
            showAlert('danger', 'Por favor complete todos los campos')
            return;
        }

        const newEntry = {
            date: feedingForm.date || new Date(),
            userId: userLogged._id || '',
            feedType: feedingForm.feedType,
            name: feedingForm.name,
            amount: Number(feedingForm.amount),
            unit_measurement: feedingForm.unit_measurement,
            average_p_pig: Number((feedingForm.amount / formik.values.pigCount).toFixed(2)) || 0,
            notes: feedingForm.notes || '',
            periodicity: feedingForm.periodicity
        };

        formik.setFieldValue('feeding_history', [...(formik.values.feedings ?? []), newEntry]);
        setFeedingForm({
            date: null,
            userId: userLogged._id || '',
            feedType: '',
            name: '',
            amount: 0,
            unit_measurement: '',
            average_p_pig: 0,
            notes: '',
            periodicity: ''
        });
        setShowFeedingForm(false);
    };

    const handleRemoveFeedingEntry = (index: number) => {
        const updated = [...(formik.values.feedings ?? [])];
        updated.splice(index, 1);
        formik.setFieldValue('feeding_history', updated);
    };

    function handleAddMedicationEntry() {
        if (!medicationForm.treatmentType || !medicationForm.medication || !medicationForm.dosage || !medicationForm.unit_measurement || !medicationForm.application_method) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        const newEntry = {
            applicationDate: medicationForm.applicationDate || new Date(),
            userId: userLogged._id || '',
            treatmentType: medicationForm.treatmentType,
            medication: medicationForm.medication,
            dosage: Number(medicationForm.dosage),
            average_p_pig: Number((medicationForm.dosage / formik.values.pigCount).toFixed(2)) || 0,
            notes: medicationForm.notes || '',
            periodicity: medicationForm.periodicity || '',
            unit_measurement: medicationForm.unit_measurement || '',
            application_method: medicationForm.application_method || ''
        }

        formik.setFieldValue('medical_treatments', [
            ...(formik.values.medical_treatments || []),
            newEntry,
        ]);

        setMedicationForm({
            applicationDate: null,
            userId: userLogged._id || '',
            treatmentType: '',
            medication: '',
            dosage: 0,
            average_p_pig: 0,
            notes: '',
            periodicity: '',
            unit_measurement: '',
            application_method: ''
        });
        setShowMedicationForm(false);
    }

    function handleRemoveMedicationEntry(index: number) {
        const newArray = [...(formik.values.medical_treatments || [])];
        newArray.splice(index, 1);
        formik.setFieldValue('medical_treatments', newArray);
    }

    const validationSchema = Yup.object({
        code: Yup.string().required('El código es obligatorio')
            .test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (initialData) return true;
                if (!value) return false;
                if (!configContext) return true;
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/check_code_exists/${value}`);
                    return !response.data.codeExists
                } catch (error) {
                    console.error('Error validating unique code: ', error);
                    return false;
                }
            }),
        name: Yup.string().required('El nombre es obligatorio'),
        area: Yup.string().required('El área es obligatoria'),
        observations: Yup.string().optional().max(500, 'Las observaciones no pueden exceder los 500 caracteres'),
        pigCount: Yup.number().required('El número de cerdos es obligatorio')
            .min(0, 'El número de cerdos no puede ser negativo')
    })

    const formik = useFormik<GroupData>({
        initialValues: initialData || {
            code: '',
            name: '',
            area: '',
            group_mother: '',
            observations: '',
            creation_date: null,
            observations_history: [],
            responsible: userLogged._id || '',
            farm: userLogged.farm_assigned || '',
            group_history: [],
            pigCount: 0,
            pigsInGroup: [],
            feedings: [],
            medical_treatments: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const response = await configContext?.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, values)
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Grupo de cerdos ${values.code} registrados en area ${values.area}`
                    });
                }
                onSave();
            } catch (error) {
                handleError(error, 'Ha ocurrido un error al guardar los datos, intentelo mas tarde')
            }
        }
    })

    const validateGeneralInfo = (values: GroupData): boolean => {
        return (
            !!values.code &&
            !!values.name &&
            !!values.area &&
            !!values.responsible
        );
    };

    const handleNextSelectionPig = () => {
        if (pigManualSelection && selectedPigs.length === 0) {
            showIncompleteFieldsAlert("Debe seleccionar al menos un cerdo.");
            return;
        }
        if (!pigManualSelection && (!formik.values.pigCount || formik.values.pigCount <= 0)) {
            showIncompleteFieldsAlert("Debe ingresar el número de cerdos en el grupo.");
            return;
        }
        toggleArrowTab(3);
    };

    const fetchPigs = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_all_by_farm/${userLogged.farm_assigned}`)
            const filteredMotherPigs = response.data.data.filter((pig: PigData) => pig.status === 'vivo' && pig.sex === 'hembra');
            setMotherPigs(filteredMotherPigs)

            const filteredSelectGroupsPigs = response.data.data.filter((pig: PigData) => pig.status === 'vivo' && pig.sex !== 'hembra');
            setSelectGroupsPigs(filteredSelectGroupsPigs)
        } catch (error) {
            handleError(error, 'Error al obtener los cerdos de la granja')
        } finally {
            setLoading(false)
        }
    }

    const addPigToSelectedGroup = (pigData: PigData) => {
        if (!selectedPigs.some(pig => pig._id === pigData._id)) {
            setSelectedPigs([...selectedPigs, pigData]);
            formik.setFieldValue('pigsInGroup', [...(formik.values.pigsInGroup ?? []), pigData._id]);
            selectGroupsPigs.splice(selectGroupsPigs.findIndex(pig => pig._id === pigData._id), 1);
        }
    }

    const removePigFromSelectedGroup = (pigId: string) => {
        const pigToRemove = selectedPigs.find(p => p._id === pigId);
        if (!pigToRemove) return;

        setSelectedPigs(prev => prev.filter(p => p._id !== pigId));
        formik.setFieldValue("pigsInGroup", (formik.values.pigsInGroup ?? []).filter(id => id !== pigId));
        setSelectGroupsPigs(prev => [...prev, pigToRemove]);
    };

    useEffect(() => {
        fetchPigs();
    }, [])

    useEffect(() => {
        if (pigManualSelection) {
            formik.setFieldValue("pigCount", selectedPigs.length);
        }
    }, [pigManualSelection, selectedPigs.length]);

    return (
        <>
            <form onSubmit={e => {
                e.preventDefault();
                formik.handleSubmit();
            }}>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-groupData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-groupData-tab"
                                disabled
                            >
                                Información de grupo
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-pigs-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-pigs-tab"
                                disabled
                            >
                                Cerdos
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-feeding-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-feeding-tab"
                                disabled
                            >
                                Alimentación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-medication-tab"
                                className={classnames({
                                    active: activeStep === 4,
                                })}
                                onClick={() => toggleArrowTab(4)}
                                aria-selected={activeStep === 4}
                                aria-controls="step-medication-tab"
                                disabled
                            >
                                Medicación
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 5,
                                })}
                                onClick={() => toggleArrowTab(5)}
                                aria-selected={activeStep === 5}
                                aria-controls="step-summary-tab"
                                disabled
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-groupData-tab" tabId={1}>
                        <Row style={{ height: "65vh", overflowY: "auto" }}>
                            <Col lg={6}>
                                <h5 className="border-bottom border-2 pb-2">Datos Generales</h5>
                                {/* Codigo */}
                                <div className="mt-4">
                                    <Label htmlFor="code" className="form-label">Código *</Label>
                                    <Input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formik.values.code}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.code && !!formik.errors.code}
                                        placeholder="Ej: GRP-001"
                                    />
                                    {formik.touched.code && formik.errors.code && (
                                        <FormFeedback>{formik.errors.code}</FormFeedback>
                                    )}
                                </div>

                                {/* Nombre */}
                                <div className="mt-4">
                                    <Label htmlFor="name" className="form-label">Nombre del grupo *</Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.name && !!formik.errors.name}
                                        placeholder="Ej: Grupo de Gestación 1"
                                    />
                                    {formik.touched.name && formik.errors.name && (
                                        <FormFeedback>{formik.errors.name}</FormFeedback>
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    {/* Fecha de registro */}
                                    <div className="mt-4 w-50">
                                        <Label htmlFor="date" className="form-label">Fecha de registro *</Label>
                                        <DatePicker
                                            className="form-control"
                                            id="date"
                                            name="date"
                                            value={new Date().toLocaleDateString()}
                                            options={{ dateFormat: "d/m/Y", maxDate: "today" }}
                                            disabled
                                            style={{ opacity: 0.8, backgroundColor: "#e9ecef" }}
                                        />
                                    </div>

                                    {/* Usuario responsable */}
                                    <div className="mt-4 w-50">
                                        <Label htmlFor="user" className="form-label">Responsable del registro *</Label>
                                        <Input
                                            type="text"
                                            id="user"
                                            name="user"
                                            value={'' + userLogged.name + ' ' + userLogged.lastname}
                                            disabled
                                        />
                                    </div>
                                </div>


                                {/* Area */}
                                <div className="mt-4">
                                    <Label htmlFor="area" className="form-label">Área *</Label>
                                    <Input
                                        type="select"
                                        id="area"
                                        name="area"
                                        value={formik.values.area}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.area && !!formik.errors.area}
                                    >
                                        <option value="">Seleccione un área</option>
                                        <option value="gestacion">Gestación</option>
                                        <option value="paridera">Paridera / Maternidad</option>
                                        <option value="destete">Destete</option>
                                        <option value="preceba">Preceba / Levante inicial</option>
                                        <option value="ceba">Ceba / Engorda</option>
                                        <option value="reemplazo">Reemplazo / Recría</option>
                                        <option value="verracos">Área de verracos</option>
                                        <option value="cuarentena">Cuarentena / Aislamiento</option>
                                        <option value="hospital">Hospital / Enfermería</option>
                                        <option value="embarque">Corrales de venta / embarque</option>
                                    </Input>
                                    {formik.touched.area && formik.errors.area && (
                                        <FormFeedback>{formik.errors.area}</FormFeedback>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div className="mt-4">
                                    <Label htmlFor="observations" className="form-label">Observaciones</Label>
                                    <Input
                                        type="textarea"
                                        id="observations"
                                        name="observations"
                                        value={formik.values.observations}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        invalid={formik.touched.observations && !!formik.errors.observations}
                                        placeholder="Observaciones sobre el grupo"
                                    />
                                    {formik.touched.observations && formik.errors.observations && (
                                        <FormFeedback>{formik.errors.observations}</FormFeedback>
                                    )}
                                </div>

                            </Col>

                            <Col lg={6} className="border-start border-2">
                                <h5 className="border-bottom border-2 pb-2">Madre del grupo *</h5>

                                <div className="mt-4 d-flex flex-wrap gap-3">

                                    {/* Card: Sin madre */}
                                    <div
                                        onClick={() => formik.setFieldValue("group_mother", "")}
                                        className={`card p-3 shadow-sm cursor-pointer text-center ${!formik.values.group_mother ? "border-primary" : "border-light"
                                            }`}
                                        style={{ width: "200px" }}
                                    >
                                        <img
                                            src={noMotherImage}
                                            alt="Sin madre"
                                            className="mb-2 img-fluid"
                                            style={{ height: "120px", objectFit: "contain" }}
                                        />
                                        <h6 className="mb-0 fs-5">Este grupo no tiene madre</h6>
                                        {!formik.values.group_mother && (
                                            <span className="badge bg-primary mt-2 fs-6">Seleccionado</span>
                                        )}
                                    </div>

                                    {/* Cards de cerdas */}
                                    {motherPigs.map(pig => {
                                        const isSelected = formik.values.group_mother === pig._id;
                                        return (
                                            <div
                                                key={pig._id}
                                                onClick={() => formik.setFieldValue("group_mother", pig._id)}
                                                className={`card fs-5 p-3 shadow-sm cursor-pointer ${isSelected ? "border-primary" : "border-light"}`}
                                                style={{ width: "200px" }}
                                            >
                                                <img
                                                    src={pigDefaultImage}
                                                    alt={pig.code}
                                                    className="mb-2 img-fluid"
                                                    style={{ height: "120px", objectFit: "cover" }}
                                                />
                                                <strong className="mb-1 fs-5">{pig.code}</strong>
                                                <p className="mb-1 fs-5"><strong>Raza:</strong> {pig.breed}</p>
                                                <p className="mb-1 fs-5"><strong>Fecha Nacimiento:</strong> {pig.birthdate ? new Date(pig.birthdate).toLocaleDateString() : ''}</p>
                                                {isSelected && <span className="badge bg-primary fs-6">Seleccionada</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {formik.touched.group_mother && formik.errors.group_mother && (
                                    <FormFeedback className="d-block">{formik.errors.group_mother}</FormFeedback>
                                )}
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-danger" onClick={() => setCancelModal(true)}>
                                <i className="ri-close-circle-line me-1"></i>
                                Cancelar
                            </Button>

                            <Button className="btn btn-primary" onClick={() => {
                                formik.validateForm().then(() => {
                                    if (validateGeneralInfo(formik.values)) {
                                        toggleArrowTab(2);
                                    } else {
                                        showIncompleteFieldsAlert("Por favor, complete todos los campos obligatorios antes de continuar.");
                                    }
                                })
                            }}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-pigs-tab" tabId={2}>
                        <div className="mt-4 w-25">
                            <Label htmlFor="pigCount" className="form-label">Número de cerdos en el grupo *</Label>
                            <Input
                                type="number"
                                value={formik.values.pigCount}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                name="pigCount"
                                id="pigCount"
                                invalid={formik.touched.pigCount && !!formik.errors.pigCount}
                                disabled={pigManualSelection}
                            />

                        </div>

                        <div className="form-check mt-4">
                            <Input
                                className="form-check-input"
                                type="checkbox"
                                id="check-count"
                                checked={pigManualSelection}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setPigManualSelection(checked);
                                    if (!checked) {
                                        setSelectedPigs([]);
                                        formik.setFieldValue("pigCount", 0);
                                        formik.setFieldValue("pigsInGroup", []);
                                        fetchPigs();
                                    }
                                }}
                            />
                            <Label className="form-check-label" for="check-count">Seleccionar cerdos</Label>
                        </div>

                        <fieldset disabled={!pigManualSelection}>
                            <Row className={`mt-4 ${!pigManualSelection ? "opacity-50" : ""}`} style={{ height: "55vh", overflowY: "auto" }}>
                                <Col lg={6} className="border-end border-2">
                                    <h5 className="border-bottom border-2 pb-2">Cerdos disponibles</h5>

                                    {selectGroupsPigs.length === 0 && (
                                        <div className="text-center text-muted mt-4">
                                            <p className="fs-5">No hay cerdos disponibles para agregar al grupo.</p>
                                        </div>
                                    )}

                                    <div style={{ maxHeight: "60vh", overflowY: "auto" }} className="d-flex flex-wrap gap-3">
                                        {selectGroupsPigs.map(pig => (
                                            <div key={pig._id} className="card fs-6 p-2 shadow-sm" style={{ width: "180px" }}>
                                                <img src={pigDefaultImage} alt={pig.code} style={{ height: "100px", objectFit: "cover" }} />
                                                <strong>{pig.code}</strong>
                                                <p className="mb-1"><b>Raza:</b> {pig.breed}</p>
                                                <Button color="primary" size="sm" onClick={() => addPigToSelectedGroup(pig)}>
                                                    + Agregar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Col>

                                <Col lg={6}>
                                    <h5 className="border-bottom border-2 pb-2">Cerdos seleccionados</h5>

                                    {selectedPigs.length === 0 && (
                                        <div className="text-center text-muted mt-4">
                                            <p className="fs-5">No hay cerdos seleccionados. Seleccione cerdos disponibles para agregarlos al grupo.</p>
                                        </div>
                                    )}

                                    <div style={{ maxHeight: "60vh", overflowY: "auto" }} className="d-flex flex-wrap gap-3">
                                        {selectedPigs.map(pig => (
                                            <div key={pig._id} className="card fs-6 p-2 shadow-sm" style={{ width: "180px" }}>
                                                <img src={pigDefaultImage} alt={pig.code} style={{ height: "100px", objectFit: "cover" }} />
                                                <strong>{pig.code}</strong>
                                                <p className="mb-1"><b>Raza:</b> {pig.breed}</p>
                                                <Button color="danger" size="sm" onClick={() => removePigFromSelectedGroup(pig._id)}>
                                                    – Quitar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Col>
                            </Row>
                        </fieldset>


                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-primary" onClick={() => handleNextSelectionPig()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>

                        </div>
                    </TabPane>

                    <TabPane id="step-feeding-tab" tabId={3} style={{ height: "70vh", overflowY: "auto" }}>
                        <Button
                            color={showFeedingForm ? "danger" : "primary"}
                            className="mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                            onClick={() => setShowFeedingForm(!showFeedingForm)}
                        >
                            {showFeedingForm ? (
                                <>
                                    <i className="ri-close-circle-line fs-16"></i>
                                    Cancelar
                                </>
                            ) : (
                                <>
                                    <i className="ri-add-circle-line fs-16"></i>
                                    Agregar nueva alimentación
                                </>
                            )}
                        </Button>

                        {showFeedingForm && (
                            <div className="border p-4 rounded mb-4 bg-light">
                                {alertConfig.visible && (
                                    <Alert color={alertConfig.color} className="p-3">
                                        {alertConfig.message}
                                    </Alert>
                                )}

                                <h5 className="mb-3 text-primary">Nueva entrada de alimentación</h5>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <Label for="name" className="form-label fw-semibold">Nombre</Label>
                                        <Input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={feedingForm.name}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            placeholder="Ej: Concentrado, Vitaminas, etc."
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <Label for="feedType" className="form-label fw-semibold">Categoría</Label>
                                        <Input
                                            type="select"
                                            id="feedType"
                                            name="feedType"
                                            value={feedingForm.feedType}
                                            onChange={handleFeedingInputChange}
                                            className="form-select"
                                        >
                                            <option value="">Seleccione categoría</option>
                                            <option value="alimento">Alimento</option>
                                            <option value="suplemento">Suplemento</option>
                                            <option value="vitamina">Vitamina</option>
                                            <option value="otro">Otro</option>
                                        </Input>
                                    </div>

                                    <div className="col-md-4">
                                        <Label for="amount" className="form-label fw-semibold">Cantidad</Label>
                                        <Input
                                            type="number"
                                            id="amount"
                                            name="amount"
                                            value={feedingForm.amount}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <Label for="periodicity" className="form-label fw-semibold">Periodicidad</Label>
                                        <Input
                                            type="select"
                                            id="periodicity"
                                            name="periodicity"
                                            value={feedingForm.periodicity}
                                            onChange={handleFeedingInputChange}
                                            className="form-select"
                                        >
                                            <option value="">Seleccione periodicidad</option>
                                            <option value="diaria">Diaria</option>
                                            <option value="dos_veces_dia">Dos veces al día</option>
                                            <option value="tres_veces_dia">Tres veces al día</option>
                                            <option value="semanal">Semanal</option>
                                            <option value="cada_dos_semanas">Cada 2 semanas</option>
                                            <option value="mensual">Mensual</option>
                                            <option value="libre_acceso">Libre acceso (ad libitum)</option>
                                        </Input>
                                    </div>

                                    <div className="col-md-4">
                                        <Label for="unit_measurement" className="form-label fw-semibold">Unidad</Label>
                                        <Input
                                            type="text"
                                            id="unit_measurement"
                                            name="unit_measurement"
                                            value={feedingForm.unit_measurement}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            placeholder="Ej: kg, ml, g"
                                        />
                                    </div>



                                    <div className="col-12">
                                        <Label for="notes" className="form-label fw-semibold">Notas</Label>
                                        <Input
                                            type="textarea"
                                            id="notes"
                                            name="notes"
                                            value={feedingForm.notes}
                                            onChange={handleFeedingInputChange}
                                            className="form-control"
                                            rows="3"
                                            placeholder="Notas adicionales sobre la alimentación"
                                        />
                                    </div>

                                    <div className="col-12 text-end">
                                        <Button color="success" className="px-4" onClick={handleAddFeedingEntry}>
                                            <i className="ri-save-line me-2"></i> Guardar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <h5 className="mb-3 text-primary">Registro de Alimentación</h5>

                            {formik.values.feedings && formik.values.feedings.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-nowrap align-middle mb-0 fs-5">
                                        <thead>
                                            <tr className="table-active">
                                                <th scope="col" style={{ width: '10%' }}>Categoría</th>
                                                <th scope="col" style={{ width: '20%' }}>Nombre</th>
                                                <th scope="col" style={{ width: '15%' }}>Cantidad</th>
                                                <th scope="col" style={{ width: '10%' }}>Periodicidad</th>
                                                <th scope="col" style={{ width: '15%' }}>Promedio por cerdo</th>
                                                <th scope="col" style={{ width: '30%' }}>Observaciones</th>
                                                <th scope="col" style={{ width: '15%' }} className="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formik.values.feedings.map((feed, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <span className={`badge ${feed.feedType === 'alimento' ? 'bg-success' :
                                                            feed.feedType === 'suplemento' ? 'bg-info' :
                                                                feed.feedType === 'vitamina' ? 'bg-warning' :
                                                                    'bg-secondary'}`}>
                                                            {feed.feedType}
                                                        </span>
                                                    </td>
                                                    <td><strong>{feed.name}</strong></td>
                                                    <td>{feed.amount} <small className="text-muted">{feed.unit_measurement}</small></td>
                                                    <td>{feed.periodicity}</td>
                                                    <td>{Number(feed.average_p_pig)} <small className="text-muted">{feed.unit_measurement}</small></td>
                                                    <td>
                                                        {feed.notes || <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleRemoveFeedingEntry(index)}
                                                        >
                                                            <i className="ri-delete-bin-line align-bottom"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info mb-0">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <i className="ri-information-line display-5"></i>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h5 className="alert-heading">No hay registros</h5>
                                            <p className="mb-0">Agrega una nueva alimentación usando el botón superior</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="d-flex justify-content-between position-absolute bottom-0 start-0 end-0 px-4 mb-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-primary" onClick={() => toggleArrowTab(activeStep + 1)}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-medication-tab" tabId={4} style={{ height: "70vh", overflowY: "auto" }}>
                        <>
                            <Button
                                color={showMedicationForm ? "danger" : "primary"}
                                className="mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                onClick={() => setShowMedicationForm(!showMedicationForm)}
                            >
                                {showMedicationForm ? (
                                    <>
                                        <i className="ri-close-circle-line fs-16"></i>
                                        Cancelar
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-add-circle-line fs-16"></i>
                                        Agregar nueva medicación
                                    </>
                                )}
                            </Button>

                            {showMedicationForm && (
                                <div className="border p-4 rounded mb-4 bg-light">
                                    <h5 className="mb-3 text-primary">Nueva entrada de medicación</h5>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <Label htmlFor="treatmentType" className="form-label fw-semibold">Tipo</Label>
                                            <Input
                                                type="select"
                                                id="treatmentType"
                                                name="treatmentType"
                                                value={medicationForm.treatmentType}
                                                onChange={handleMedicationInputChange}
                                                className="form-select"
                                            >
                                                <option value="">Seleccione tipo</option>
                                                <option value="medicamento">Medicamento</option>
                                                <option value="vacuna">Vacuna</option>
                                                <option value="antibiótico">Antibiótico</option>
                                                <option value="desparasitante">Desparasitante</option>
                                                <option value="otro">Otro</option>
                                            </Input>
                                        </div>

                                        <div className="col-md-6">
                                            <Label htmlFor="medication" className="form-label fw-semibold">Nombre</Label>
                                            <Input
                                                type="text"
                                                id="medication"
                                                name="medication"
                                                value={medicationForm.medication}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                placeholder="Ej: Ivermectina, Vacuna Aujeszky..."
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <Label htmlFor="dosage" className="form-label fw-semibold">Dosis</Label>
                                            <Input
                                                type="number"
                                                id="dosage"
                                                name="dosage"
                                                value={medicationForm.dosage}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <Label htmlFor="unit_measurement" className="form-label fw-semibold">Unidad</Label>
                                            <Input
                                                type="text"
                                                id="unit_measurement"
                                                name="unit_measurement"
                                                value={medicationForm.unit_measurement}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                placeholder="Ej: ml, mg, UI"
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <Label htmlFor="application_method" className="form-label fw-semibold">Vía de administración</Label>
                                            <Input
                                                type="select"
                                                id="application_method"
                                                name="application_method"
                                                value={medicationForm.application_method}
                                                onChange={handleMedicationInputChange}
                                                className="form-select"
                                            >
                                                <option value="">Seleccione vía</option>
                                                <option value="oral">Oral</option>
                                                <option value="intramuscular">Intramuscular</option>
                                                <option value="subcutánea">Subcutánea</option>
                                                <option value="tópica">Tópica</option>
                                                <option value="intravenosa">Intravenosa</option>
                                            </Input>
                                        </div>

                                        <div className="col-md-3">
                                            <Label for="periodicity" className="form-label fw-semibold">Periodicidad</Label>
                                            <Input
                                                type="select"
                                                id="periodicity"
                                                name="periodicity"
                                                value={medicationForm.periodicity}
                                                onChange={handleMedicationInputChange}
                                                className="form-select"
                                            >
                                                <option value="">Seleccione periodicidad</option>
                                                <option value="diaria">Diaria</option>
                                                <option value="dos_veces_dia">Dos veces al día</option>
                                                <option value="tres_veces_dia">Tres veces al día</option>
                                                <option value="semanal">Semanal</option>
                                                <option value="cada_dos_semanas">Cada 2 semanas</option>
                                                <option value="mensual">Mensual</option>
                                                <option value="libre_acceso">Libre acceso (ad libitum)</option>
                                            </Input>
                                        </div>


                                        <div className="col-md-12">
                                            <Label htmlFor="notes" className="form-label fw-semibold">Notas</Label>
                                            <Input
                                                type="textarea"
                                                id="notes"
                                                name="notes"
                                                value={medicationForm.notes}
                                                onChange={handleMedicationInputChange}
                                                className="form-control"
                                                rows={3}
                                                placeholder="Notas adicionales"
                                            />
                                        </div>

                                        <div className="col-12 text-end">
                                            <Button color="success" className="px-4" onClick={handleAddMedicationEntry}>
                                                <i className="ri-save-line me-2"></i> Guardar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabla de entradas */}
                            <div className="mt-4">
                                <h5 className="mb-3 text-primary">Registro de Medicación</h5>

                                {formik.values.medical_treatments && formik.values.medical_treatments.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-nowrap align-middle mb-0 fs-5">
                                            <thead>
                                                <tr className="table-active">
                                                    <th style={{ width: '10%' }}>Tipo</th>
                                                    <th style={{ width: '20%' }}>Nombre</th>
                                                    <th style={{ width: '10%' }}>Dosis</th>
                                                    <th style={{ width: '10%' }}>Método de aplicación</th>
                                                    <th style={{ width: '10%' }}>Promedio por cerdo</th>
                                                    <th style={{ width: '20%' }}>Observaciones</th>
                                                    <th className="text-end" style={{ width: '8%' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formik.values.medical_treatments.map((med, i) => (
                                                    <tr key={i}>
                                                        <td>{med.treatmentType}</td>
                                                        <td><strong>{med.medication}</strong></td>
                                                        <td>{med.dosage} <small className="text-muted">{med.unit_measurement}</small></td>
                                                        <td>{med.application_method}</td>
                                                        <td>{med.average_p_pig} <small className="text-muted">{med.unit_measurement}</small></td>
                                                        <td>{med.notes || <span className="text-muted">-</span>}</td>
                                                        <td className="text-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleRemoveMedicationEntry(i)}
                                                            >
                                                                <i className="ri-delete-bin-line align-bottom"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="alert alert-info mb-0">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <i className="ri-information-line display-5"></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h5 className="alert-heading">No hay registros</h5>
                                                <p className="mb-0">Agrega una nueva medicación usando el botón superior</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>

                        <div className="d-flex justify-content-between position-absolute bottom-0 start-0 end-0 px-4 mb-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-primary" onClick={() => toggleArrowTab(activeStep + 1)}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={5} style={{ height: "70vh", overflowY: "auto" }}>

                        <div className="d-flex justify-content-between position-absolute bottom-0 start-0 end-0 px-4 mb-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-primary" onClick={() => formik.handleSubmit()}>
                                Guardar
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                </TabContent>

            </form>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}

            {incompleteFieldsAlert.visible && (
                <Alert color="danger" className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    <div className="d-flex align-items-center">
                        <i className="ri-error-warning-fill me-2 fs-4"></i>
                        <div>
                            <h5 className="alert-heading mb-1">Campos incompletos o invalidos</h5>
                            <p className="mb-0">{incompleteFieldsAlert.message}</p>
                        </div>
                    </div>
                </Alert>
            )}

            <Modal isOpen={cancelModal} toggle={() => setCancelModal(!cancelModal)} backdrop='static' keyboard={false} centered>
                <ModalHeader >
                    <span className="fs-5 text-black">Cancelar registro</span>
                </ModalHeader>
                <ModalBody>
                    <p className="fs-5">¿Estás seguro de que deseas cancelar el registro? Todos los cambios se perderán.</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setCancelModal(false)}>
                        No, volver
                    </Button>
                    <Button color="danger" onClick={() => {
                        setCancelModal(false);
                        onCancel();
                    }}>
                        Sí, cancelar
                    </Button>
                </ModalFooter>
            </Modal>


        </>
    )
}

export default GroupForm;