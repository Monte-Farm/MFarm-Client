import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, medicationPackagesEntry, PigData, VaccinationPlanEntry } from "common/data_interfaces";
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

interface IndividualVaccinationPlanFormProps {
    pigId: string
    onSave: () => void
}

const IndividualVaccinationPlanForm: React.FC<IndividualVaccinationPlanFormProps> = ({ pigId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ vaccinationDetails: false, success: false, error: false, missingStock: false });
    const [vaccinationPlans, setVaccinationPlans] = useState<any[]>([]);
    const [pigDetails, setPigDetails] = useState<PigData>()
    const [selectedVaccinationPlan, setSelectedVaccinationPlan] = useState<any>();
    const [vaccinationPlanItems, setVaccinationPlanItems] = useState<any[]>();
    const [missingItems, setMissingItems] = useState([]);

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

    const vaccinationPlanColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Etapa',
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = "General";
                        break;
                    case "piglet":
                        color = "info";
                        text = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        text = "Reproductor";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

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

    const selectedVaccinesColumns: Column<any>[] = [
        { header: "Codigo", accessor: "id", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Cantidad",
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: "Via de administracion",
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
    ]

    const vaccinationPlanAttributes: Attribute[] = [
        { label: 'Codigo', key: 'code', type: 'text' },
        { label: 'Nombre', key: 'name', type: 'text', },
        { label: 'Fecha de creacion', key: 'creation_date', type: 'date', },
        {
            label: 'Etapa',
            key: 'stage',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "general":
                        color = "info";
                        text = "General";
                        break;
                    case "piglet":
                        color = "info";
                        text = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        text = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        text = "Engorda";
                        break;
                    case "breeder":
                        color = "success";
                        text = "Reproductor";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [pigResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pigId}`),
            ])
            const pigData = pigResponse.data.data;

            const vaccinationResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/vaccination_plan/find_by_stage/${userLogged.farm_assigned}/${pigData.currentStage}`)
            const plansWithId = vaccinationResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setPigDetails(pigData)
            setVaccinationPlans(plansWithId)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const fetchVaccinationItems = async (vaccines: any[]) => {
        if (!configContext || !userLogged || !vaccines) return;
        try {
            const vaccinesIds = vaccines.map(v => v.vaccine)
            const vaccinationsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, vaccinesIds)

            const products = vaccinationsResponse.data.data;

            const combined = vaccines.map(vac => {
                const product = products.find((p: any) => p._id === vac.vaccine);
                return { ...product, ...vac };
            });
            setVaccinationPlanItems(combined)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    const validationSchema = Yup.object({
        applicationDate: Yup.date().required('La fecha de aplicacion es obligatoria'),
        appliedBy: Yup.string().required('El area de destino es obligatoria'),
    })

    const formik = useFormik<VaccinationPlanEntry>({
        initialValues: {
            planId: '',
            name: '',
            stage: '',
            vaccines: [],
            applicationDate: null,
            appliedBy: userLogged._id,
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

                const vaccinationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/vaccination_plan/asign_vaccination_plan/${userLogged.farm_assigned}/${pigId}`, values)
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

    const checkVaccinationPlanData = async () => {
        if (formik.values.planId === '') {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione un plan de vacunacion' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('applicationDate', new Date())
    }, [])

    useEffect(() => {
        if (selectedVaccinationPlan) {
            formik.setFieldValue('planId', selectedVaccinationPlan._id)
            formik.setFieldValue('name', selectedVaccinationPlan.name)
            formik.setFieldValue('stage', selectedVaccinationPlan.stage)
            formik.setFieldValue('vaccines', selectedVaccinationPlan.vaccines)

            fetchVaccinationItems(selectedVaccinationPlan.vaccines)
        }
    }, [selectedVaccinationPlan])

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
                            href='#'
                            id="step-packageSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            Selección de plan de vacunacion
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-planSelect-tab" tabId={1}>
                    <div className="d-flex gap-2 mt-4">
                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">Fecha de aplicacion</Label>
                            <DatePicker
                                id="applicationDate"
                                className={`form-control ${formik.touched.applicationDate && formik.errors.applicationDate ? 'is-invalid' : ''}`}
                                value={formik.values.applicationDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('applicationDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.applicationDate && formik.errors.applicationDate && (
                                <FormFeedback className="d-block">{formik.errors.applicationDate as string}</FormFeedback>
                            )}
                        </div>

                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">Responsable de aplicacion</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="observations" className="form-label">Observaciones</Label>
                        <Input
                            type="text"
                            id="observations"
                            name="observations"
                            value={formik.values.observations}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.observations && !!formik.errors.observations}
                            placeholder="Observaciones de la aplicacion"
                        />
                        {formik.touched.observations && formik.errors.observations && (
                            <FormFeedback>{formik.errors.observations}</FormFeedback>
                        )}
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="observations" className="form-label">Seleccion de plan de vacunacion</Label>

                        <SelectableCustomTable
                            columns={vaccinationPlanColumns}
                            data={vaccinationPlans}
                            showPagination={true}
                            rowsPerPage={6}
                            selectionMode="single"
                            showSearchAndFilter={false}
                            onSelect={(rows) => setSelectedVaccinationPlan(rows[0])}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkVaccinationPlanData()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
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

                        <div className="w-100 align-items-stretch d-flex flex-column gap-1">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    Información del plan de vacunacion
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={vaccinationPlanAttributes}
                                        object={selectedVaccinationPlan ?? {}}
                                    />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Vacunas</h5>
                                </CardHeader>
                                <CardBody className="p-0">
                                    <CustomTable
                                        columns={selectedVaccinesColumns}
                                        data={vaccinationPlanItems || []}
                                        showSearchAndFilter={false}
                                        rowsPerPage={4}
                                        showPagination={true}
                                    />
                                </CardBody>
                            </Card>
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
                                    Asignar
                                </div>
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

export default IndividualVaccinationPlanForm;