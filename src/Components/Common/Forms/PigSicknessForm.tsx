import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, medicationPackagesEntry, PigData, SicknessHistory, VaccinationPlanEntry } from "common/data_interfaces";
import * as Yup from 'yup';
import classnames from "classnames";
import { useFormik } from "formik";
import { HttpStatusCode } from "axios";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import PigDetails from "pages/Pigs/PigDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";
import noImageUrl from '../../../assets/images/no-image.png'
import SicknessSymptomsSelector from "../Shared/SicknessSymptomsSelector";
import SicknessSymptomsSummary from "../Shared/SicknessSymptomsSummary";

interface PigSicknessFormProps {
    pigId: string
    onSave: () => void
}

const PigSicknessForm: React.FC<PigSicknessFormProps> = ({ pigId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [missingItems, setMissingItems] = useState([]);
    const [pigDetails, setPigDetails] = useState<any>({})
    const [treatmentSelected, setTreatmentSelected] = useState<any[]>([]);
    const [treatmentErrors, setTreatmentErrors] = useState<Record<string, any>>({});
    const [products, setProducts] = useState<any[]>([])

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const PigAttributes: Attribute[] = [
        { key: "code", label: "Código", type: "text" },
        { key: "birthdate", label: "Fecha de nacimiento", type: "date" },
        { key: "breed", label: "Raza", type: "text" },
        {
            key: "origin",
            label: "Origen",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = 'Nacido en la granja';
                        break;

                    case 'purchased':
                        color = 'warning';
                        label = 'Comprado';
                        break;

                    case 'donated':
                        color = 'info';
                        label = 'Donado';
                        break;

                    case 'other':
                        color = 'dark';
                        label = 'Otro';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'sex',
            label: 'Sexo',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        {
            key: 'currentStage',
            label: 'Etapa',
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
        { key: "weight", label: "Peso actual", type: "text" },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

    const selectedMedicationsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Dosis",
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: "Administracion",
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "oral":
                        color = "info";
                        label = "Oral";
                        break;
                    case "intramuscular":
                        color = "primary";
                        label = "Intramuscular";
                        break;
                    case "subcutaneous":
                        color = "primary";
                        label = "Subcutánea";
                        break;
                    case "intravenous":
                        color = "primary";
                        label = "Intravenosa";
                        break;
                    case "intranasal":
                        color = "primary";
                        label = "Intranasal";
                        break;
                    case "topical":
                        color = "primary";
                        label = "Tópica";
                        break;
                    case "rectal":
                        color = "primary";
                        label = "Rectal";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Inicio', accessor: 'startDate', type: 'date', },
        { header: 'Fin', accessor: 'endDate', type: 'date', },
    ]

    const columns: Column<any>[] = [
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
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "vaccines":
                        color = "info";
                        label = "Vacunas";
                        break;
                    case "medications":
                        color = "primary";
                        label = "Medicamentos";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Dosis",
            accessor: "dose",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(f => f.medication === row._id);
                const realValue = selected?.dose ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.dose === 0 ? "" : (selected?.dose ?? "")}
                            invalid={treatmentErrors[row._id]?.dose}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setTreatmentSelected(prev =>
                                    prev.map(f => f.medication === row._id ? { ...f, dose: newValue } : f)
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
                const realValue = selected?.administration_route ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={treatmentErrors[row._id]?.administration_route}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setTreatmentSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administration_route: newValue } : m)
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
        {
            header: "Fecha de inicio",
            accessor: "startDate",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.startDate ?? null;
                return (
                    <DatePicker
                        id="startDate"
                        className={`form-control ${treatmentErrors[row._id]?.startDate ? 'is-invalid' : ''}`}
                        value={realValue ?? undefined}
                        onChange={(date: Date[]) => {
                            if (date[0]) {
                                setTreatmentSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, startDate: date[0] } : m)
                                );
                            }
                        }}
                        options={{ dateFormat: 'd/m/Y' }}
                        disabled={!isSelected}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Seleccione"
                    />
                );
            }
        },
        {
            header: "Fecha de fin",
            accessor: "endDate",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = treatmentSelected.find(m => m.medication === row._id);
                const realValue = selected?.endDate ?? null;
                return (
                    <DatePicker
                        id="endDate"
                        className={`form-control ${treatmentErrors[row._id]?.endDate ? 'is-invalid' : ''}`}
                        value={realValue ?? undefined}
                        onChange={(date: Date[]) => {
                            if (date[0]) {
                                setTreatmentSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, endDate: date[0] } : m)
                                );
                            }
                        }}
                        options={{ dateFormat: 'd/m/Y' }}
                        disabled={!isSelected}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Seleccione"
                    />
                );
            }
        },
    ];

    const sicknessAttributes: Attribute[] = [
        { key: 'name', label: 'Enfermedad', type: 'text' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "suspected":
                        color = "info";
                        label = "Sospecha";
                        break;
                    case "confirmed":
                        color = "success";
                        label = "Confirmada";
                        break;
                    case "recovered":
                        color = "primary";
                        label = "Recuperada";
                        break;
                    case "chronic":
                        color = "warning";
                        label = "Cronica";
                        break;
                    case "dead":
                        color = "black";
                        label = "Muerte";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'severity',
            label: 'Severidad',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "low":
                        color = "success";
                        label = "Baja";
                        break;
                    case "medium":
                        color = "warning";
                        label = "Media";
                        break;
                    case "high":
                        color = "danger";
                        label = "Alta";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'observations', label: 'Observaciones', type: 'text' },

    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [pigResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pigId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
            ])
            const pigData = pigResponse.data.data;
            setPigDetails(pigData)

            const productsWithId = productsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setProducts(productsWithId)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const validationSchema = Yup.object({
        name: Yup.string().required('El nombre de la enfermedad es obligatoria'),
        status: Yup.string().required('El estado de la enfermedad es obligatorio'),
        startDate: Yup.date().required('La fecha de inicio de la enfermedad es obligatoria'),
        severity: Yup.string().required('La severidad de la informacion es obligatoria'),
    })

    const treatmentValidation = Yup.object({
        medication: Yup.string().required(),
        dose: Yup.number().moreThan(0, "Cantidad inválida").required("Cantidad requerida"),
        administration_route: Yup.string().required("Vía requerida").notOneOf([""], "Debe seleccionar una vía"),
        startDate: Yup.date().required('Fecha requerida'),
        endDate: Yup.date().required('Fecha requerida'),
    });

    const formik = useFormik<SicknessHistory>({
        initialValues: {
            name: "",
            status: "",
            startDate: null,
            endDate: null,
            symptoms: [],
            severity: '',
            detectedBy: userLogged._id,
            treatment: [],
            observations: '',
            is_active: true
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                values.treatment = treatmentSelected;

                const pigUpdates = await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/register_sickness/${pigId}`, values)
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Plan de vacunacion asignado al cerdo ${pigDetails?.code}`
                });

                toggleModal('success', true)
            } catch (error: any) {
                console.error('Error saving the information: ', { error })
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock');
                    return;
                }
                toggleModal('error')
            }
        }
    })

    const checkSicknessData = async () => {
        formik.setTouched({
            name: true,
            status: true,
            startDate: true,
            severity: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos' })
        }
    }

    const checkSymptomsData = () => {
        if (formik.values.symptoms?.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 sintoma' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }


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
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de los tratamientos seleccionados' })
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            Informacion de enfermedad
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            disabled
                        >
                            Sintomas
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
                            })}
                            aria-selected={activeStep === 3}
                            disabled
                        >
                            Tratamiento
                        </NavLink>
                    </NavItem>


                    <NavItem>
                        <NavLink
                            className={classnames({
                                active: activeStep === 4,
                                done: activeStep > 4,
                            })}
                            aria-selected={activeStep === 4}
                            disabled
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="w-100">
                            <Label className="form-label">Enfermedad</Label>
                            <Input
                                type="text"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </div>

                        <div className="w-100">
                            <Label htmlFor="severityInput" className="form-label">Severidad</Label>
                            <Input
                                type="select"
                                id="severityInput"
                                name="severity"
                                value={formik.values.severity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.severity && !!formik.errors.severity}
                            >
                                <option value="">Seleccione un estado</option>
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                            </Input>
                            {formik.touched.severity && formik.errors.severity && (
                                <FormFeedback>{formik.errors.severity}</FormFeedback>
                            )}
                        </div>

                        <div className="w-100">
                            <Label htmlFor="startDate" className="form-label">Fecha de inicio</Label>
                            <DatePicker
                                id="startDate"
                                className={`form-control ${formik.touched.startDate && formik.errors.startDate ? 'is-invalid' : ''}`}
                                value={formik.values.startDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('startDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.startDate && formik.errors.startDate && (
                                <FormFeedback className="d-block">{formik.errors.startDate as string}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-3 mt-4">
                        <div className="w-50">
                            <Label htmlFor="statusInput" className="form-label">Estado</Label>
                            <Input
                                type="select"
                                id="statusInput"
                                name="status"
                                value={formik.values.status}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.status && !!formik.errors.status}
                            >
                                <option value="">Seleccione un estado</option>
                                <option value="suspected">Sospecha</option>
                                <option value="confirmed">Confirmada</option>
                                <option value="recovered">Recuperada</option>
                                <option value="chronic">Cronica</option>
                                <option value="dead">Muerta</option>
                            </Input>
                            {formik.touched.status && formik.errors.status && (
                                <FormFeedback>{formik.errors.status}</FormFeedback>
                            )}
                        </div>

                        <div className="w-50">
                            <Label htmlFor="endDate" className="form-label">Fecha de termino</Label>
                            <DatePicker
                                id="endDate"
                                className={`form-control ${formik.touched.endDate && formik.errors.endDate ? 'is-invalid' : ''}`}
                                value={formik.values.endDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('endDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.endDate && formik.errors.endDate && (
                                <FormFeedback className="d-block">{formik.errors.endDate as string}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-3 mt-4">
                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">Detectada por</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>

                        <div className="w-50">
                            <Label className="form-label">Observaciones</Label>
                            <Input
                                type="text"
                                name="observations"
                                value={formik.values.observations}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.observations && !!formik.errors.observations}
                            />
                            {formik.touched.observations && formik.errors.observations && (
                                <FormFeedback>{formik.errors.observations}</FormFeedback>
                            )}
                        </div>
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkSicknessData()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="mb-3">
                        <h5 className="mb-1">Síntomas observados</h5>
                        <small className="text-muted">
                            Seleccione todos los síntomas observados en el cerdo
                        </small>
                    </div>

                    <SicknessSymptomsSelector value={formik.values.symptoms ?? []} onChange={(symptoms) => formik.setFieldValue("symptoms", symptoms)} />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            Anterior
                        </Button>

                        <Button className="btn" onClick={() => checkSymptomsData()}>
                            Siguiente
                            <i className="ms-2 ri-arrow-right-line" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => {
                            setTreatmentSelected(prev => {
                                const newRows = rows.map(r => {
                                    const existing = prev.find(p => p.medication === r._id);
                                    if (existing) return existing;

                                    return {
                                        medication: r._id,
                                        dose: 0,
                                        unit_measurement: r.unit_measurement,
                                        administration_route: "",
                                        startDate: null,
                                        endDate: null
                                    };
                                });
                                return newRows;
                            });
                        }}
                    />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="me-2 ri-arrow-left-line" />
                            Anterior
                        </Button>

                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedTreatments();
                                if (!ok) return;
                                toggleArrowTab(activeStep + 1);
                            }}
                        >
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={4}>
                    <div className="d-flex gap-3 align-items-stretch" style={{ minHeight: "60vh" }}>
                        <div style={{ minWidth: 320 }}>
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    Información del cerdo
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={PigAttributes}
                                        object={pigDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex flex-column flex-grow-1 gap-3">
                            <div className="d-flex gap-3 align-items-stretch" style={{ flex: 1 }}>
                                <Card className="shadow-sm w-50 h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        Información de enfermedad
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails
                                            attributes={sicknessAttributes}
                                            object={formik.values}
                                        />
                                    </CardBody>
                                </Card>

                                <Card className="shadow-sm w-50 h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        Síntomas
                                    </CardHeader>

                                    <CardBody className="d-flex flex-column">
                                        {formik.values.symptoms && formik.values.symptoms.length > 0 ? (
                                            <SicknessSymptomsSummary symptoms={formik.values.symptoms} />
                                        ) : (
                                            <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                                <i className="fa-solid fa-circle-info" />
                                                No se registraron síntomas
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>

                            <div style={{ flex: 1 }}>
                                <Card className="shadow-sm h-100">
                                    <CardHeader className="bg-light fw-bold fs-5">
                                        Tratamiento
                                    </CardHeader>

                                    <CardBody className="d-flex flex-column p-0">
                                        {treatmentSelected.length > 0 ? (
                                            <CustomTable
                                                columns={selectedMedicationsColumns}
                                                data={treatmentSelected.map(ms => ({
                                                    ...products.find(p => p._id === ms.medication),
                                                    ...ms
                                                }))}
                                                showSearchAndFilter={false}
                                                rowsPerPage={4}
                                                showPagination={true}
                                            />
                                        ) : (
                                            <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                                <i className="fa-solid fa-pills" />
                                                No se asignó tratamiento
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button
                            className="btn-danger"
                            onClick={() => toggleArrowTab(activeStep - 1)}
                        >
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>

                        <Button
                            className="ms-auto btn-success"
                            onClick={() => formik.handleSubmit()}
                            disabled={formik.isSubmitting}
                        >
                            {formik.isSubmitting ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <i className="ri-check-line me-2" />
                                    Asignar
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>


            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error, intentelo mas tarde"} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Plan de vacunacion asignado correctamente"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default PigSicknessForm;