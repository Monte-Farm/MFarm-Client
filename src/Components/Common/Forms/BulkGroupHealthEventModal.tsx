import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import SicknessSymptomsSelector from "../Shared/SicknessSymptomsSelector";
import SicknessSymptomsSummary from "../Shared/SicknessSymptomsSummary";
import SelectableCustomTable from "../Tables/SelectableTable";
import CustomTable from "../Tables/CustomTable";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import MissingStockModal from "../Shared/MissingStockModal";
import AlertMessage from "../Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import noImageUrl from '../../../assets/images/no-image.png';

interface BulkGroupHealthEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroups: any[];
    onSuccess: () => void;
}

interface GroupEventConfig {
    groupId: string;
    groupCode: string;
    groupName: string;
    totalPigs: number;
    eventType: 'total' | 'partial' | '';
    affectedCount: number;
}

const BulkGroupHealthEventModal: React.FC<BulkGroupHealthEventModalProps> = ({
    isOpen,
    onClose,
    selectedGroups,
    onSuccess
}) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [missingItems, setMissingItems] = useState([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [products, setProducts] = useState<any[]>([]);
    const [treatmentSelected, setTreatmentSelected] = useState<any[]>([]);
    const [treatmentErrors, setTreatmentErrors] = useState<Record<string, any>>({});
    const [groupConfigs, setGroupConfigs] = useState<GroupEventConfig[]>([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const selectedMedicationsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Dosis por cerdo",
            accessor: "dose",
            type: "text",
            render: (_, row) => <span>{row.quantityPerPig} {row.unit_measurement}</span>
        },
        {
            header: "Administracion",
            accessor: "administrationRoute",
            type: "text",
            render: (value: string) => {
                const routeLabels: Record<string, { color: string; label: string }> = {
                    oral: { color: "info", label: "Oral" },
                    intramuscular: { color: "primary", label: "Intramuscular" },
                    subcutaneous: { color: "primary", label: "Subcutánea" },
                    intravenous: { color: "primary", label: "Intravenosa" },
                    intranasal: { color: "primary", label: "Intranasal" },
                    topical: { color: "primary", label: "Tópica" },
                    rectal: { color: "primary", label: "Rectal" },
                };
                const route = routeLabels[value] || { color: "secondary", label: value };
                return <Badge color={route.color}>{route.label}</Badge>;
            },
        },
    ];

    const productsColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: 'Categoria',
            accessor: 'category',
            render: (value: string) => {
                const categoryLabels: Record<string, { color: string; label: string }> = {
                    vaccines: { color: "info", label: "Vacunas" },
                    medications: { color: "primary", label: "Medicamentos" },
                };
                const category = categoryLabels[value] || { color: "secondary", label: value };
                return <Badge color={category.color}>{category.label}</Badge>;
            },
        },
        {
            header: "Dosis por cerdo",
            accessor: "dose",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(f => f.medication === row._id);
                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantityPerPig === 0 ? "" : (selected?.quantityPerPig ?? "")}
                            invalid={treatmentErrors[row._id]?.quantityPerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setTreatmentSelected(prev =>
                                    prev.map(f => f.medication === row._id ? { ...f, quantityPerPig: newValue } : f)
                                );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="unit-addon"
                        />
                        <span className="input-group-text" id="unit-addon">{row.unit_measurement}</span>
                    </div>
                );
            },
        },
        {
            header: "Vía de administración",
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={selected?.administrationRoute ?? ""}
                        invalid={treatmentErrors[row._id]?.administrationRoute}
                        onChange={(e) => {
                            setTreatmentSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administrationRoute: e.target.value } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Seleccione...</option>
                        <option value="oral">Oral</option>
                        <option value="intramuscular">Intramuscular</option>
                        <option value="subcutaneous">Subcutánea</option>
                        <option value="intravenous">Intravenosa</option>
                        <option value="intranasal">Intranasal</option>
                        <option value="topical">Tópica</option>
                        <option value="rectal">Rectal</option>
                    </Input>
                );
            }
        },
    ];

    const validationSchema = Yup.object({
        name: Yup.string().required('El nombre del evento es obligatorio'),
        status: Yup.string().required('El estado es obligatorio'),
        startDate: Yup.date().required('La fecha de inicio es obligatoria'),
        endDate: Yup.date().when('status', {
            is: 'resolved',
            then: (schema) => schema.required('La fecha de término es obligatoria cuando el evento está resuelto'),
            otherwise: (schema) => schema.nullable()
        }),
        severity: Yup.string().required('La severidad es obligatoria'),
    });

    const treatmentValidation = Yup.object({
        medication: Yup.string().required(),
        quantityPerPig: Yup.number().moreThan(0, "Cantidad inválida").required("Cantidad requerida"),
        administrationRoute: Yup.string().required("Vía requerida").notOneOf([""], "Debe seleccionar una vía"),
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            status: '',
            startDate: null as Date | null,
            endDate: null as Date | null,
            severity: '',
            symptoms: [] as string[],
            observations: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return;

            // Validar que todos los grupos tengan configuración
            const missingConfig = groupConfigs.filter(g => !g.eventType || g.affectedCount === 0);
            if (missingConfig.length > 0) {
                setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, configure el tipo y número de afectados para todos los grupos' });
                return;
            }

            try {
                setSubmitting(true);

                // Registrar evento en cada grupo
                for (const groupConfig of groupConfigs) {
                    const eventData = {
                        name: values.name,
                        status: values.status,
                        startDate: values.startDate,
                        endDate: values.endDate,
                        scope: {
                            type: groupConfig.eventType,
                            affectedCount: groupConfig.affectedCount
                        },
                        severity: values.severity,
                        symptoms: values.symptoms,
                        treatments: treatmentSelected,
                        observations: values.observations,
                        isActive: true,
                        detectedBy: userLogged._id,
                    };

                    await configContext.axiosHelper.put(
                        `${configContext.apiUrl}/group/register_health_event/${groupConfig.groupId}`,
                        eventData
                    );
                }

                // Registrar en historial
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                    {
                        event: `Evento sanitario "${values.name}" registrado en ${groupConfigs.length} grupos`
                    }
                );

                toggleModal('success', true);
            } catch (error: any) {
                console.error('Error registering bulk health events:', error);
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock', true);
                    return;
                }
                toggleModal('error', true);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const checkEventData = async () => {
        formik.setTouched({
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            severity: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, complete todos los campos obligatorios' });
        }
    };

    const validateSelectedTreatments = async () => {
        const errors: Record<string, any> = {};

        for (const treat of treatmentSelected) {
            try {
                await treatmentValidation.validate(treat, { abortEarly: false });
            } catch (err: any) {
                const treatErrors: any = {};
                err.inner.forEach((e: any) => {
                    treatErrors[e.path] = true;
                });
                errors[treat.medication] = treatErrors;
            }
        }

        setTreatmentErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de los tratamientos seleccionados' });
            return false;
        }

        return true;
    };

    const handleGroupConfigChange = (groupId: string, field: 'eventType' | 'affectedCount', value: any) => {
        setGroupConfigs(prev => prev.map(g => {
            if (g.groupId === groupId) {
                const updated = { ...g, [field]: value };
                // Si es tipo total, auto-completar con total de cerdos
                if (field === 'eventType' && value === 'total') {
                    updated.affectedCount = g.totalPigs;
                } else if (field === 'eventType' && value === 'partial') {
                    updated.affectedCount = 0;
                }
                return updated;
            }
            return g;
        }));
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        formik.resetForm();
        setTreatmentSelected([]);
        setGroupConfigs([]);
        setActiveStep(1);
        setPassedarrowSteps([1]);
    };

    const handleClose = () => {
        onClose();
        formik.resetForm();
        setTreatmentSelected([]);
        setGroupConfigs([]);
        setActiveStep(1);
        setPassedarrowSteps([1]);
        setAlertConfig({ visible: false, color: '', message: '' });
    };

    const fetchProducts = async () => {
        if (!configContext || !userLogged) return;
        try {
            const productsResponse = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/product/find_medication_products`
            );
            const productsWithId = productsResponse.data.data.map((p: any) => ({ ...p, code: p.id, id: p._id }));
            setProducts(productsWithId);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
            formik.setFieldValue('startDate', new Date());

            // Inicializar configuración de grupos
            const configs = selectedGroups.map(g => ({
                groupId: g._id,
                groupCode: g.code,
                groupName: g.name,
                totalPigs: g.pigCount,
                eventType: '' as 'total' | 'partial' | '',
                affectedCount: 0,
            }));
            setGroupConfigs(configs);
        }
    }, [isOpen, selectedGroups]);

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="xl" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    Registrar Evento Sanitario a {selectedGroups.length} Grupos
                </ModalHeader>
                <ModalBody>
                    <div className="step-arrow-nav mb-4">
                        <Nav className="nav-pills custom-nav nav-justified">
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    disabled
                                >
                                    Información y Síntomas
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeStep === 2,
                                        done: activeStep > 2,
                                    })}
                                    disabled
                                >
                                    Tratamiento
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeStep === 3,
                                        done: activeStep > 3,
                                    })}
                                    disabled
                                >
                                    Configuración y Resumen
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </div>

                    <TabContent activeTab={activeStep}>
                        {/* PASO 1: Información del Evento y Síntomas */}
                        <TabPane tabId={1}>
                            <div className="mb-3">
                                <h5 className="mb-1">Información del evento sanitario</h5>
                                <small className="text-muted">
                                    Esta información se aplicará a todos los grupos seleccionados
                                </small>
                            </div>

                            <Card className="shadow-sm mb-4">
                                <CardBody>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <Label className="form-label fw-semibold">
                                                Nombre del evento <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="text"
                                                name="name"
                                                placeholder="Ej: Gripe porcina, Diarrea, etc."
                                                value={formik.values.name}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.name && !!formik.errors.name}
                                            />
                                            {formik.touched.name && formik.errors.name && (
                                                <FormFeedback>{formik.errors.name}</FormFeedback>
                                            )}
                                        </div>

                                        <div className="col-md-3">
                                            <Label className="form-label fw-semibold">
                                                Severidad <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="select"
                                                name="severity"
                                                value={formik.values.severity}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.severity && !!formik.errors.severity}
                                            >
                                                <option value="">Seleccione...</option>
                                                <option value="low">Baja</option>
                                                <option value="medium">Media</option>
                                                <option value="high">Alta</option>
                                            </Input>
                                            {formik.touched.severity && formik.errors.severity && (
                                                <FormFeedback>{formik.errors.severity}</FormFeedback>
                                            )}
                                        </div>

                                        <div className="col-md-3">
                                            <Label className="form-label fw-semibold">
                                                Fecha de inicio <span className="text-danger">*</span>
                                            </Label>
                                            <DatePicker
                                                className={`form-control ${formik.touched.startDate && formik.errors.startDate ? 'is-invalid' : ''}`}
                                                value={formik.values.startDate ?? undefined}
                                                onChange={(date: Date[]) => {
                                                    if (date[0]) formik.setFieldValue('startDate', date[0]);
                                                }}
                                                options={{ dateFormat: 'd/m/Y' }}
                                                placeholder="Seleccione fecha"
                                            />
                                            {formik.touched.startDate && formik.errors.startDate && (
                                                <FormFeedback className="d-block">{formik.errors.startDate as string}</FormFeedback>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row g-3 mt-2">
                                        <div className="col-md-6">
                                            <Label className="form-label fw-semibold">
                                                Estado <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="select"
                                                name="status"
                                                value={formik.values.status}
                                                onChange={(e) => {
                                                    formik.handleChange(e);
                                                    if (e.target.value !== 'resolved') {
                                                        formik.setFieldValue('endDate', null);
                                                    }
                                                }}
                                                onBlur={formik.handleBlur}
                                                invalid={formik.touched.status && !!formik.errors.status}
                                            >
                                                <option value="">Seleccione...</option>
                                                <option value="active">Activo</option>
                                                <option value="controlled">Controlado</option>
                                                <option value="resolved">Resuelto</option>
                                            </Input>
                                            {formik.touched.status && formik.errors.status && (
                                                <FormFeedback>{formik.errors.status}</FormFeedback>
                                            )}
                                        </div>

                                        {formik.values.status === 'resolved' && (
                                            <div className="col-md-6">
                                                <Label className="form-label fw-semibold">
                                                    Fecha de término <span className="text-danger">*</span>
                                                </Label>
                                                <DatePicker
                                                    className={`form-control ${formik.touched.endDate && formik.errors.endDate ? 'is-invalid' : ''}`}
                                                    value={formik.values.endDate ?? undefined}
                                                    onChange={(date: Date[]) => {
                                                        if (date[0]) formik.setFieldValue('endDate', date[0]);
                                                    }}
                                                    options={{ dateFormat: 'd/m/Y' }}
                                                    placeholder="Seleccione fecha"
                                                />
                                                {formik.touched.endDate && formik.errors.endDate && (
                                                    <FormFeedback className="d-block">{formik.errors.endDate as string}</FormFeedback>
                                                )}
                                            </div>
                                        )}

                                        <div className="col-md-12">
                                            <Label className="form-label fw-semibold">Observaciones</Label>
                                            <Input
                                                type="textarea"
                                                name="observations"
                                                rows={2}
                                                placeholder="Información adicional sobre el evento..."
                                                value={formik.values.observations}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>

                            <div className="mb-3">
                                <h5 className="mb-1">Síntomas observados (Opcional)</h5>
                                <small className="text-muted">
                                    Seleccione todos los síntomas observados
                                </small>
                            </div>

                            <SicknessSymptomsSelector
                                value={formik.values.symptoms}
                                onChange={(symptoms) => formik.setFieldValue("symptoms", symptoms)}
                            />

                            <div className="d-flex justify-content-end mt-4">
                                <Button className="farm-primary-button" onClick={checkEventData}>
                                    Siguiente
                                    <i className="ri-arrow-right-line ms-1" />
                                </Button>
                            </div>
                        </TabPane>

                        {/* PASO 2: Tratamiento */}
                        <TabPane tabId={2}>
                            <div className="mb-3">
                                <h5 className="mb-1">Tratamiento (Opcional)</h5>
                                <small className="text-muted">
                                    Seleccione los medicamentos a aplicar. Si no se requiere tratamiento, puede continuar sin seleccionar ninguno.
                                </small>
                            </div>

                            <SelectableCustomTable
                                columns={productsColumns}
                                data={products}
                                showPagination={true}
                                rowsPerPage={6}
                                selectionOnlyOnCheckbox={false}
                                onSelect={(rows) => {
                                    setTreatmentSelected(prev => {
                                        const newRows = rows.map(r => {
                                            const existing = prev.find(p => p.medication === r._id);
                                            if (existing) return existing;

                                            return {
                                                medication: r._id,
                                                quantityPerPig: 0,
                                                administrationRoute: "",
                                                appliedBy: userLogged._id,
                                            };
                                        });
                                        return newRows;
                                    });
                                }}
                            />

                            <div className="d-flex justify-content-between mt-4">
                                <Button color="secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                    <i className="ri-arrow-left-line me-1" />
                                    Anterior
                                </Button>

                                <Button
                                    className="farm-primary-button"
                                    onClick={async () => {
                                        if (treatmentSelected.length > 0) {
                                            const ok = await validateSelectedTreatments();
                                            if (!ok) return;
                                        }
                                        toggleArrowTab(activeStep + 1);
                                    }}
                                >
                                    Siguiente
                                    <i className="ri-arrow-right-line ms-1" />
                                </Button>
                            </div>
                        </TabPane>

                        {/* PASO 3: Configuración por Grupo y Resumen */}
                        <TabPane tabId={3}>
                            <div className="mb-3">
                                <h5 className="mb-1">Configuración por grupo</h5>
                                <small className="text-muted">
                                    Configure el alcance del evento para cada grupo
                                </small>
                            </div>

                            <div className="mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {groupConfigs.map((group, index) => (
                                    <Card key={group.groupId} className="mb-3 border-primary border-opacity-25">
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0 fw-bold">
                                                    <i className="ri-folder-3-line text-primary me-2"></i>
                                                    {group.groupCode} - {group.groupName}
                                                </h6>
                                                <Badge color="light" className="text-dark border px-3 py-2">
                                                    <i className="ri-group-line me-1"></i>
                                                    <strong>{group.totalPigs}</strong> cerdos
                                                </Badge>
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <Label className="form-label fw-semibold">
                                                        Tipo de evento <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="select"
                                                        value={group.eventType}
                                                        onChange={(e) => handleGroupConfigChange(group.groupId, 'eventType', e.target.value)}
                                                    >
                                                        <option value="">Seleccione...</option>
                                                        <option value="partial">Parcial (algunos cerdos)</option>
                                                        <option value="total">Total (todo el grupo)</option>
                                                    </Input>
                                                </div>

                                                <div className="col-md-6">
                                                    <Label className="form-label fw-semibold">
                                                        Cerdos afectados <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={group.affectedCount === 0 ? '' : group.affectedCount}
                                                        onChange={(e) => {
                                                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                            const finalValue = value > group.totalPigs ? group.totalPigs : value;
                                                            handleGroupConfigChange(group.groupId, 'affectedCount', finalValue);
                                                        }}
                                                        disabled={group.eventType === 'total'}
                                                        min={1}
                                                        max={group.totalPigs}
                                                        placeholder="Número de cerdos"
                                                    />
                                                    {group.eventType === 'total' && (
                                                        <small className="text-muted d-block mt-1">
                                                            <i className="ri-information-line" /> Se asignará a todos los cerdos del grupo
                                                        </small>
                                                    )}
                                                    {group.eventType === 'partial' && (
                                                        <small className="text-muted d-block mt-1">
                                                            <i className="ri-information-line" /> Máximo: {group.totalPigs} cerdos
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>

                            <div className="mb-3">
                                <h5 className="mb-1">Resumen del evento</h5>
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <Card className="h-100">
                                        <CardBody>
                                            <h6 className="fw-bold mb-3">Información General</h6>
                                            <div className="mb-2">
                                                <strong>Evento:</strong> {formik.values.name}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Severidad:</strong>{' '}
                                                <Badge color={
                                                    formik.values.severity === 'high' ? 'danger' :
                                                        formik.values.severity === 'medium' ? 'warning' : 'success'
                                                }>
                                                    {formik.values.severity === 'high' ? 'Alta' :
                                                        formik.values.severity === 'medium' ? 'Media' : 'Baja'}
                                                </Badge>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Estado:</strong>{' '}
                                                <Badge color={
                                                    formik.values.status === 'resolved' ? 'success' :
                                                        formik.values.status === 'controlled' ? 'warning' : 'danger'
                                                }>
                                                    {formik.values.status === 'resolved' ? 'Resuelto' :
                                                        formik.values.status === 'controlled' ? 'Controlado' : 'Activo'}
                                                </Badge>
                                            </div>
                                            <div className="mb-2">
                                                <strong>Grupos afectados:</strong> {groupConfigs.length}
                                            </div>
                                            <div className="mb-2">
                                                <strong>Total cerdos afectados:</strong>{' '}
                                                {groupConfigs.reduce((sum, g) => sum + g.affectedCount, 0)}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </div>

                                <div className="col-md-6">
                                    <Card className="h-100">
                                        <CardBody>
                                            <h6 className="fw-bold mb-3">Síntomas y Tratamiento</h6>
                                            {formik.values.symptoms && formik.values.symptoms.length > 0 ? (
                                                <div className="mb-3">
                                                    <strong>Síntomas:</strong>
                                                    <SicknessSymptomsSummary symptoms={formik.values.symptoms} />
                                                </div>
                                            ) : (
                                                <div className="text-muted fst-italic mb-3">
                                                    <i className="ri-information-line me-1"></i>
                                                    No se registraron síntomas
                                                </div>
                                            )}

                                            {treatmentSelected.length > 0 ? (
                                                <div>
                                                    <strong>Tratamientos:</strong> {treatmentSelected.length} medicamentos
                                                </div>
                                            ) : (
                                                <div className="text-muted fst-italic">
                                                    <i className="ri-information-line me-1"></i>
                                                    No se asignó tratamiento
                                                </div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>
                            </div>

                            {treatmentSelected.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="fw-bold mb-2">Detalle de Tratamientos</h6>
                                    <CustomTable
                                        columns={selectedMedicationsColumns}
                                        data={treatmentSelected.map(ms => ({
                                            ...products.find(p => p._id === ms.medication),
                                            ...ms
                                        }))}
                                        showSearchAndFilter={false}
                                        rowsPerPage={5}
                                        showPagination={true}
                                    />
                                </div>
                            )}

                            <div className="d-flex justify-content-between mt-4">
                                <Button color="secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                    <i className="ri-arrow-left-line me-1" />
                                    Anterior
                                </Button>

                                <Button
                                    color="success"
                                    onClick={() => formik.handleSubmit()}
                                    disabled={formik.isSubmitting}
                                >
                                    {formik.isSubmitting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <i className="ri-check-line me-1" />
                                            Registrar Evento en {groupConfigs.length} Grupos
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabPane>
                    </TabContent>

                    <AlertMessage
                        color={alertConfig.color}
                        message={alertConfig.message}
                        visible={alertConfig.visible}
                        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                        absolutePosition={false}
                        autoClose={3000}
                    />
                </ModalBody>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message={`El evento sanitario "${formik.values.name}" ha sido registrado exitosamente en ${groupConfigs.length} grupos.`}
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message="Ha ocurrido un error al registrar el evento sanitario. Por favor, inténtelo más tarde."
            />

            <MissingStockModal
                isOpen={modals.missingStock}
                onClose={() => toggleModal('missingStock', false)}
                missingItems={missingItems}
            />
        </>
    );
};

export default BulkGroupHealthEventModal;
