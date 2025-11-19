import { ConfigContext } from "App"
import { useFormik } from "formik"
import { getLoggedinUser } from "helpers/api_helper"
import { useContext, useEffect, useState } from "react"
import * as Yup from 'yup';
import classnames from "classnames";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import SelectableTable from "../Tables/SelectableTable";
import { use } from "i18next";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Column } from "common/data/data_types";
import PigDetailsModal from "../Details/DetailsPigModal";
import AlertMessage from "../Shared/AlertMesagge";
import DatePicker from "react-flatpickr";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import ObjectDetails from "../Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";

interface DiscardPigFormProps {
    pig?: any
    onSave: () => void
    onCancel: () => void
}

const DiscardPigForm: React.FC<DiscardPigFormProps> = ({ pig, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser()
    const [modals, setModals] = useState({ pigDetails: false, success: false, error: false })
    const [selectedPig, setSelectedPig] = useState<any>()
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [loading, setLoading] = useState<boolean>(false);
    const [pigs, setPigs] = useState<any[]>([])
    const [detailsSelectedPig, setDetailsSelectedPigs] = useState<string>('')

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) {
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
                        setDetailsSelectedPigs(row._id)
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

    const pigsAttributes: Attribute[] = [
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
        { key: "weight", label: "Peso actual", type: "text" },
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
        { key: "observations", label: "Observaciones", type: "text" },
    ];

    const discardAttributes: Attribute[] = [
        {
            key: "reason",
            label: "Razón",
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "lameness":
                        color = "warning";
                        label = "Cojeras";
                        break;
                    case "poor_body_condition":
                        color = "warning";
                        label = "Condición corporal deficiente";
                        break;
                    case "reproductive_failure":
                        color = "danger";
                        label = "Falla reproductiva";
                        break;
                    case "low_milk_production":
                        color = "info";
                        label = "Baja producción de leche";
                        break;
                    case "disease":
                        color = "danger";
                        label = "Enfermedad";
                        break;
                    case "injury":
                        color = "warning";
                        label = "Lesión";
                        break;
                    case "aggressive_behavior":
                        color = "primary";
                        label = "Comportamiento agresivo";
                        break;
                    case "old_age":
                        color = "secondary";
                        label = "Edad avanzada";
                        break;
                    case "death":
                        color = "dark";
                        label = "Muerte";
                        break;
                    case "poor_growth":
                        color = "info";
                        label = "Bajo crecimiento / rendimiento";
                        break;
                    case "hernias":
                        color = "warning";
                        label = "Hernias";
                        break;
                    case "prolapse":
                        color = "danger";
                        label = "Prolapso";
                        break;
                    case "non_ambulatory":
                        color = "danger";
                        label = "No puede caminar";
                        break;
                    case "respiratory_failure":
                        color = "danger";
                        label = "Problemas respiratorios severos";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: "destination",
            label: "Destino",
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "slaughterhouse":
                        color = "primary";
                        label = "Rastro";
                        break;
                    case "on_farm_euthanasia":
                        color = "danger";
                        label = "Eutanasia en granja";
                        break;
                    case "sale":
                        color = "success";
                        label = "Venta";
                        break;
                    case "research":
                        color = "info";
                        label = "Investigación";
                        break;
                    case "rendering":
                        color = "secondary";
                        label = "Procesadora / despojos";
                        break;
                    case "composting":
                        color = "warning";
                        label = "Compostaje";
                        break;
                    case "burial":
                        color = "dark";
                        label = "Enterrado";
                        break;
                    case "incineration":
                        color = "danger";
                        label = "Incineración";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "date", label: "Fecha", type: "date" },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

    const validationSchema = Yup.object({
        reason: Yup.string().required('Seleccione la razon del descarte'),
        destination: Yup.string().required('Seleccione el destino del cerdo descartado'),
        date: Yup.date().required('Por favor ingrese la fecha del parto'),
    })

    const formik = useFormik({
        initialValues: {
            reason: '',
            destination: '',
            date: null,
            responsible: userLogged._id,
            observations: '',
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: true,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return
            try {
                setSubmitting(true)

                const discardResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/discard_pig/${selectedPig._id}`, values)
                if (discardResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Cerdo: ${selectedPig.code} descartado`
                    });
                    toggleModal('success')
                }
            } catch (error) {
                console.error('An error has ocurred', { error })
                toggleModal('error')
            } finally {
                setSubmitting(false)
            }
        }
    })

    const fetchPigs = async () => {
        if (!configContext || !userLogged) return
        try {
            setLoading(true);
            const pigResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_available_by_farm/${userLogged.farm_assigned}`)
            const pigsWithId = pigResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setPigs(pigsWithId)
        } catch (error) {
            console.error('Error fetching data: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const checkSelectedPig = () => {
        if (selectedPig) {
            toggleArrowTab(activeStep + 1)
        } else {
            setAlertConfig({ visible: true, color: 'danger', message: 'Seleccione un cerdo antes de continuar' })
        }
    }

    const checkDiscardData = async () => {
        setAlertConfig({ ...alertConfig, visible: false })

        formik.setTouched({
            reason: true,
            destination: true,
            date: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(3);
        } catch (err) {

        }
    };

    useEffect(() => {
        fetchPigs();
        formik.setFieldValue('date', new Date())
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => {
                e.preventDefault();
                formik.handleSubmit();
            }}>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        {!pig && (
                            <NavItem>
                                <NavLink
                                    href='#'
                                    id="step-pigSelect-tab"
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                    onClick={() => toggleArrowTab(1)}
                                    aria-selected={activeStep === 1}
                                    aria-controls="step-pigSelect-tab"
                                >
                                    Selección de cerdo
                                </NavLink>
                            </NavItem>
                        )}

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-discardInfo-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-discardInfo-tab"
                            >
                                Información de descarte
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
                                Camada
                            </NavLink>
                        </NavItem>

                    </Nav>
                </div>


                <TabContent activeTab={activeStep}>
                    <TabPane id="step-pigSelect-tab" tabId={1}>
                        <SelectableTable data={pigs} columns={pigsColumns} selectionMode="single" showPagination={true} rowsPerPage={7} onSelect={(rows) => setSelectedPig(rows?.[0])} />

                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSelectedPig()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-discardInfo-tab" tabId={2}>
                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_reason" className="form-label">Razón del descarte</Label>
                                <Input
                                    type="select"
                                    id="discard_reason"
                                    name="reason"
                                    value={formik.values.reason}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.reason && !!formik.errors.reason}
                                >
                                    <option value="">Selecciona una razón</option>
                                    <option value="lameness">Cojeras</option>
                                    <option value="poor_body_condition">Condición corporal deficiente</option>
                                    <option value="reproductive_failure">Falla reproductiva</option>
                                    <option value="low_milk_production">Baja producción de leche</option>
                                    <option value="disease">Enfermedad</option>
                                    <option value="injury">Lesión</option>
                                    <option value="aggressive_behavior">Comportamiento agresivo</option>
                                    <option value="old_age">Edad avanzada</option>
                                    <option value="death">Muerte</option>
                                    <option value="poor_growth">Bajo crecimiento / rendimiento</option>
                                    <option value="hernias">Hernias</option>
                                    <option value="prolapse">Prolapso</option>
                                    <option value="non_ambulatory">No puede caminar</option>
                                    <option value="respiratory_failure">Problemas respiratorios severos</option>
                                </Input>

                                {formik.touched.reason && formik.errors.reason && (
                                    <FormFeedback>{formik.errors.reason}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="destination" className="form-label">Destino del cerdo</Label>
                                <Input
                                    type="select"
                                    id="destination"
                                    name="destination"
                                    value={formik.values.destination}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.destination && !!formik.errors.destination}
                                >
                                    <option value="">Selecciona un destino</option>
                                    <option value="slaughterhouse">Rastro</option>
                                    <option value="on_farm_euthanasia">Eutanasia en granja</option>
                                    <option value="sale">Venta</option>
                                    <option value="research">Investigación</option>
                                    <option value="rendering">Procesadora / despojos</option>
                                    <option value="composting">Compostaje</option>
                                    <option value="burial">Enterrado</option>
                                    <option value="incineration">Incineración</option>
                                </Input>

                                {formik.touched.destination && formik.errors.destination && (
                                    <FormFeedback>{formik.errors.destination}</FormFeedback>
                                )}
                            </div>
                        </div>


                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="discard_date" className="form-label">Fecha del descarte</Label>
                                <DatePicker
                                    id="discard_date"
                                    className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                    value={formik.values.date ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) formik.setFieldValue('date', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.date && formik.errors.date && (
                                    <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="responsible" className="form-label">Responsable del descarte</Label>
                                <Input
                                    type="text"
                                    id="responsible"
                                    name="responsible"
                                    value={`${userLogged?.name} ${userLogged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-100">
                                <Label htmlFor="observations" className="form-label">Observaciones</Label>
                                <Input
                                    type="text"
                                    id="observations"
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

                        <div className="mt-4 d-flex">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atras
                            </Button>

                            <Button className="ms-auto" type="button" onClick={() => checkDiscardData()}>
                                Siguiente
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>

                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <Card className="mb-4 shadow-sm bg-light">
                            <CardBody className="d-flex justify-content-between align-items-center">
                                <span className="text-black fs-5">
                                    <strong>Responsable del registro: </strong>
                                    {userLogged.name}{" "}
                                    {userLogged.lastname}
                                </span>
                            </CardBody>
                        </Card>

                        <div className="d-flex gap-3 align-items-stretch">
                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5">
                                    Información del descarte
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={discardAttributes} object={formik.values} />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm w-50">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    Información del cerdo
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={pigsAttributes} object={pig ? pig : selectedPig} />
                                </CardBody>
                            </Card>
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

            <Modal isOpen={modals.pigDetails} toggle={() => toggleModal('pigDetails')} size="lg" centered className="border-0">
                <ModalHeader toggle={() => toggleModal('pigDetails')} className="border-0 pb-0">
                    <h4 className="modal-title text-primary fw-bold">Detalles de la extracción</h4>
                </ModalHeader>
                <ModalBody className="p-4">
                    <PigDetailsModal pigId={detailsSelectedPig} showAllDetailsButton={false} />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Cerdo descartado con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error al descartar el cerdo, intentelo mas tarde"} />

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default DiscardPigForm