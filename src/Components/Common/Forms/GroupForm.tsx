import { ConfigContext } from "App";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import { Column } from "common/data/data_types";
import DatePicker from "react-flatpickr";
import { HttpStatusCode } from "axios";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import PigDetailsModal from "../Details/DetailsPigModal";
import SuccessModal from "../Shared/SuccessModal";
import LoadingAnimation from "../Shared/LoadingAnimation";
import CustomTable from "../Tables/CustomTable";
import SelectableTable from "../Tables/SelectableTable";

interface GroupFormProps {
    initialData?: GroupData;
    onSave: () => void;
    onCancel: () => void;
}

const areaLabels: Record<string, string> = {
    gestation: "Gestación",
    farrowing: "Paridera",
    maternity: "Maternidad",
    weaning: "Destete",
    nursery: "Preceba / Levante inicial",
    fattening: "Ceba / Engorda",
    replacement: "Reemplazo / Recría",
    boars: "Área de verracos",
    quarantine: "Cuarentena / Aislamiento",
    hospital: "Hospital / Enfermería",
    shipping: "Corrales de venta / embarque",
};

const GroupForm: React.FC<GroupFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [pigs, setPigs] = useState<PigData[]>([]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigManualSelection, setPigManualSelection] = useState<boolean>(false);
    const [selectedPigs, setSelectecPigs] = useState<any[]>([])
    const [modals, setModals] = useState({ pigDetails: false, success: false });
    const [selectedPig, setSelectedPig] = useState<any>({})

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
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

    const pigsColumns: Column<any>[] = [
        {
            header: 'Codigo',
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPig(row._id)
                        toggleModal('pigDetails')
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
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

    const groupAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        {
            key: 'responsible',
            label: 'Responsable',
            type: 'text',
            render: (_, row) => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'area',
            label: 'Área',
            type: 'text',
            render: (_, row) => <span>{areaLabels[row.area] || row.area}</span>
        },
        { key: 'observations', label: 'Observaciones', type: 'text' },
    ];

    const pigsAttributes: Attribute[] = [
        { key: 'maleCount', label: 'Machos', type: 'text' },
        { key: 'femaleCount', label: 'Hembras', type: 'text' },
        { key: 'pigCount', label: 'Total', type: 'text' },
    ];

    const selectedPigColumns: Column<any>[] = [
        {
            header: 'Codigo',
            accessor: 'code',
            render: (_, row) => (
                <Button
                    className="text-underline"
                    color="link"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPig(row._id)
                        toggleModal('pigDetails')
                    }}
                >
                    {row.code} ↗
                </Button>
            )
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Peso actual', accessor: 'weight', type: 'number', isFilterable: true },
    ]

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
            maleCount: 0,
            femaleCount: 0,
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
                const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, values)
                if (response.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Grupo de cerdos ${values.code} registrados en area ${values.area}`
                    });
                }
                toggleModal('success')
            } catch (error) {
                console.error('Error saving the information: ', { error })
                setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al guardar los datos, intentelo mas tarde' })
            }
        }
    })

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)

            const [codeResponse, pigsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_all_by_farm/${userLogged.farm_assigned}`)
            ])

            formik.setFieldValue('code', codeResponse.data.data)
            const pigsWithId = pigsResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setPigs(pigsWithId)
        } catch (error) {
            console.error('Error fetching information: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const checkGroupData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            creation_date: true,
            responsible: true,
            area: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos' })
        }
    }

    const checkSelectionPig = () => {
        if (pigManualSelection && formik.values.pigsInGroup?.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Seleccione al menos 1 cerdo' })
            return;
        }
        toggleArrowTab(3);
    };

    const updateSelectedPigs = (pigs: any[]) => {
        if (pigManualSelection) {
            setSelectecPigs(pigs)
            formik.setFieldValue('pigsInGroup', pigs.map((pig) => pig._id))
            formik.setFieldValue('femaleCount', pigs.filter((pig) => pig.sex === 'hembra').length)
            formik.setFieldValue('maleCount', pigs.filter((pig) => pig.sex === 'macho').length)
            formik.setFieldValue('pigCount', pigs.length)
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date())
    }, [])

    useEffect(() => {
        if (!pigManualSelection) {
            formik.setFieldValue('pigCount', formik.values.maleCount + formik.values.femaleCount)
        }
    }, [formik.values.maleCount, formik.values.femaleCount])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

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
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
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
                                <Label htmlFor="creation_date" className="form-label">Fecha de registro *</Label>
                                <DatePicker
                                    id="creation_date"
                                    className={`form-control ${formik.touched.creation_date && formik.errors.creation_date ? 'is-invalid' : ''}`}
                                    value={formik.values.creation_date ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('date', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.creation_date && formik.errors.creation_date && (
                                    <FormFeedback className="d-block">{formik.errors.creation_date as string}</FormFeedback>
                                )}
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
                                <option value="gestation">Gestación</option>
                                <option value="farrowing">Paridera</option>
                                <option value="maternity">Maternidad</option>
                                <option value="weaning">Destete</option>
                                <option value="nursery">Preceba / Levante inicial</option>
                                <option value="fattening">Ceba / Engorda</option>
                                <option value="replacement">Reemplazo / Recría</option>
                                <option value="boars">Área de verracos</option>
                                <option value="quarantine">Cuarentena / Aislamiento</option>
                                <option value="hospital">Hospital / Enfermería</option>
                                <option value="shipping">Corrales de venta / embarque</option>
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
                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-primary ms-auto" onClick={() => checkGroupData()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-pigs-tab" tabId={2}>

                        <div className="d-flex gap-3">
                            <div className="mt-4 w-100">
                                <Label htmlFor="femaleCount" className="form-label">Cerdos hembra</Label>
                                <Input
                                    type="number"
                                    value={formik.values.femaleCount}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    name="femaleCount"
                                    id="femaleCount"
                                    invalid={formik.touched.femaleCount && !!formik.errors.femaleCount}
                                    disabled={pigManualSelection}
                                />
                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="maleCount" className="form-label">Cerdos macho</Label>
                                <Input
                                    type="number"
                                    value={formik.values.maleCount}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    name="maleCount"
                                    id="maleCount"
                                    invalid={formik.touched.maleCount && !!formik.errors.maleCount}
                                    disabled={pigManualSelection}
                                />

                            </div>

                            <div className="mt-4 w-100">
                                <Label htmlFor="pigCount" className="form-label">Número de cerdos en el grupo *</Label>
                                <Input
                                    type="number"
                                    value={formik.values.pigCount}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    name="pigCount"
                                    id="pigCount"
                                    invalid={formik.touched.pigCount && !!formik.errors.pigCount}
                                    disabled
                                />

                            </div>
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
                                        formik.setFieldValue("maleCount", 0);
                                        formik.setFieldValue("femaleCount", 0);
                                        formik.setFieldValue("pigsInGroup", []);

                                    }
                                }}
                            />
                            <Label className="form-check-label" for="check-count">Seleccionar cerdos</Label>
                        </div>

                        <fieldset disabled={!pigManualSelection}>
                            <div className={`mt-4 ${!pigManualSelection ? "opacity-50" : ""}`}>

                                <h5 className="border-bottom border-2 pb-2">Cerdos disponibles</h5>

                                {pigs.length === 0 ? (
                                    <div className="text-center text-muted mt-4">
                                        <p className="fs-5">No hay cerdos disponibles para agregar al grupo.</p>
                                    </div>
                                ) : (
                                    <SelectableTable columns={pigsColumns} data={pigs} selectionMode="multiple" onSelect={(pigs) => updateSelectedPigs(pigs)} resetSelectionTrigger={!pigManualSelection} />
                                )}

                            </div>
                        </fieldset>

                        <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />

                        <div className="d-flex justify-content-between mt-4">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-primary" onClick={() => checkSelectionPig()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-1" />
                            </Button>

                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className="d-flex gap-3">
                            <Card className="w-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Información de grupo</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={groupAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="w-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Cerdos del grupo</h5>
                                </CardHeader>
                                <CardBody className={`${(formik.values.pigsInGroup?.length ?? 0) === 0 ? '' : 'p-0'}`}>
                                    {(formik.values.pigsInGroup?.length ?? 0) === 0 ? (
                                        <ObjectDetails attributes={pigsAttributes} object={formik.values} />
                                    ) : (
                                        <CustomTable columns={selectedPigColumns} data={selectedPigs} showSearchAndFilter={false} showPagination={false} />
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex justify-content-between">
                            <Button className="btn btn-secondary" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-1"></i>
                                Anterior
                            </Button>

                            <Button className="btn btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar
                                        <i className="ri-check-line ms-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal size="lg" isOpen={modals.pigDetails} toggle={() => toggleModal("pigDetails")} centered>
                <ModalHeader toggle={() => toggleModal("pigDetails")}>Detalles del verraco</ModalHeader>
                <ModalBody>
                    <PigDetailsModal pigId={selectedPig} showAllDetailsButton={true} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Grupo creado con éxito"} />
        </>
    )
}

export default GroupForm;