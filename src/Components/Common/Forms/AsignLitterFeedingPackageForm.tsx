import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, FeedingPackagesEntry, GroupData, GroupFeedingPackagesHistory, GroupFeedings, Litter, PigData } from "common/data_interfaces";
import * as Yup from 'yup';
import classnames from "classnames";
import { useFormik } from "formik";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";

interface AsignLitterFeedingPackageFormProps {
    litterId: string
    onSave: () => void
}

const AsignLitterFeedingPackageForm: React.FC<AsignLitterFeedingPackageFormProps> = ({ litterId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ feedingPackageDetails: false, success: false, error: false });
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [litterDetails, setLitterDetails] = useState<Litter>()
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<any>();
    const [feedingPackagesItems, setFeedingPackagesItems] = useState<any[]>();
    const [active, setActive] = useState<any>();

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

    const feedingPackagesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Etapa',
            accessor: 'stage',
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

    const litterAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
        { key: 'currentMale', label: 'Macho', type: 'text' },
        { key: 'currentFemale', label: 'Hembra', type: 'text' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value, object) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'active':
                        color = 'warning';
                        label = 'Lactando';
                        break;
                    case 'weaned':
                        color = 'success';
                        label = 'Destetada';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;

            }
        },
        {
            key: 'responsible',
            label: 'Registrado por',
            type: 'text',
            render: (value, object) => <span>{object.responsible?.name} {object.responsible?.lastname}</span>
        },
    ]

    const selectedFeedingsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "id", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Promedio por cerdo",
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.avgPerPig} {row.unit_measurement}</span>,
            bgColor: "#e3f2fd"
        },
        {
            header: "Cantidad total",
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalQuantity} {row.unit_measurement}</span>,
            bgColor: "#e8f5e8"
        },
    ]

    const feedingsPackagesAttributes: Attribute[] = [
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
        {
            key: 'periodicity',
            label: 'Periodicidad',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.periodicity) {
                    case "once_day":
                        color = "info";
                        text = "1 vez al día";
                        break;
                    case "twice_day":
                        color = "primary";
                        text = "2 veces al día";
                        break;
                    case "three_times_day":
                        color = "warning";
                        text = "3 veces al día";
                        break;
                    case "ad_libitum":
                        color = "success";
                        text = "Libre acceso";
                        break;
                    case "weekly":
                        color = "secondary";
                        text = "1 vez a la semana";
                        break;
                    case "biweekly":
                        color = "warning";
                        text = "Cada 15 días";
                        break;
                    case "monthly":
                        color = "dark";
                        text = "Mensual";
                        break;
                    case "specific_days":
                        color = "primary";
                        text = "Días específicos";
                        break;
                    case "by_event":
                        color = "danger";
                        text = "Por evento productivo";
                        break;
                    default:
                        color = "light";
                        text = "No definido";
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            const litterData = litterResponse.data.data;
            setLitterDetails(litterData)

            const feedingResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/feeding_package/find_by_stage/${userLogged.farm_assigned}/piglet`)
            const packagesWithId = feedingResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setFeedingPackages(packagesWithId)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const fetchFeedingItems = async (feedings: any[]) => {
        if (!configContext || !userLogged || !feedings) return;
        try {
            const feedingsIds = feedings.map(f => f.feeding)
            const feedingResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, feedingsIds)

            const products = feedingResponse.data.data;

            const combined = feedings.map(fed => {
                const product = products.find((p: any) => p._id === fed.feeding);
                const formikProduct = formik.values.feedings.find((p: any) => p.feeding === fed.feeding);
                return { ...product, ...fed, totalQuantity: formikProduct?.totalQuantity, avgPerPig: formikProduct?.avgPerPig };
            });
            setFeedingPackagesItems(combined)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }


    const validationSchema = Yup.object({
        applicationDate: Yup.date().required('La fecha de aplicacion es obligatoria'),
        appliedBy: Yup.string().required('El area de destino es obligatoria'),
    })

    const formik = useFormik<GroupFeedingPackagesHistory>({
        initialValues: {
            packageId: '',
            name: '',
            feedings: [],
            applicationDate: null,
            appliedBy: userLogged._id,
            periodicity: '',
            observations: '',
            isActive: true,
            stage: ''
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const feedingResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/feeding_package/asign_litter_feeding_package/${userLogged.farm_assigned}/${litterId}`, values)

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de alimentacion asignado a la camada ${litterDetails?.code}`
                });

                toggleModal('success', true)
            } catch (error: any) {
                console.error('Error saving the information: ', { error })
                toggleModal('error')
            }
        }
    })

    const checkFeedingPackageData = async () => {
        if (formik.values.packageId === '') {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione un paquete de alimentacion' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('applicationDate', new Date())
    }, [])

    useEffect(() => {
        if (selectedFeedingPackage) {
            const feedingsFull = selectedFeedingPackage.feedings.map((f: any) => ({
                feeding: f.feeding,
                totalQuantity: Number(f.quantity * (litterDetails?.piglets.length ?? 0)),
                avgPerPig: Number((f.quantity * (litterDetails?.piglets.length ?? 0)) / (litterDetails?.piglets.length ?? 0))
            }))

            formik.setFieldValue('packageId', selectedFeedingPackage._id)
            formik.setFieldValue('name', selectedFeedingPackage.name)
            formik.setFieldValue('stage', selectedFeedingPackage.stage)
            formik.setFieldValue('periodicity', selectedFeedingPackage.periodicity)
            formik.setFieldValue('feedings', feedingsFull)

        }
    }, [selectedFeedingPackage])

    useEffect(() => {
        if (!formik.values.feedings?.length) return;

        fetchFeedingItems(selectedFeedingPackage.feedings);
    }, [formik.values.feedings])

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
                            Selección de paquete de alimentacion
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
                <TabPane id="step-packageSelect-tab" tabId={1}>
                    <div className="d-flex gap-2 mt-4">
                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">Fecha de asignacion</Label>
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
                            <Label htmlFor="user" className="form-label">Responsable de asignacion</Label>
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
                        <Label htmlFor="observations" className="form-label">Seleccion de paquete de medicacion</Label>

                        <SelectableCustomTable
                            columns={feedingPackagesColumns}
                            data={feedingPackages}
                            showPagination={true}
                            rowsPerPage={6}
                            selectionMode="single"
                            showSearchAndFilter={false}
                            onSelect={(rows) => setSelectedFeedingPackage(rows[0])}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkFeedingPackageData()}>
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
                                    Información del grupo
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={litterAttributes}
                                        object={litterDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100">
                            <Card className="shadow-sm mb-3">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    Información del paquete de alimentacion
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={feedingsPackagesAttributes}
                                        object={selectedFeedingPackage ?? {}}
                                    />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Alimentos</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedFeedingsColumns}
                                        data={feedingPackagesItems || []}
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
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Paquete de alimentacion asignado correctamente"} />
        </>
    )
}

export default AsignLitterFeedingPackageForm;