
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, GroupData, GroupMedicationPackagesHistory, medicationPackagesEntry, PigData } from "common/data_interfaces";
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
import MissingStockModal from "../Shared/MissingStockModal";

interface AsignGroupMedicationPackageFormProps {
    groupId: string
    onSave: () => void
}

const AsignGroupMedicationPackageForm: React.FC<AsignGroupMedicationPackageFormProps> = ({ groupId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ medicationPackageDetails: false, success: false, error: false, missingStock: false, subwarehouseError: false });
    const [medicationsPackages, setMedicationsPackages] = useState<any[]>([]);
    const [groupDetails, setGroupDetails] = useState<GroupData>()
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>();
    const [medicationPackagesItems, setMedicationsPackagesItems] = useState<any[]>();
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

    const medicationPackagesColumns: Column<any>[] = [
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

    const selectedMedicationsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "id", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Dosis por cerdo",
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        {
            header: "Dosis total",
            accessor: "totalDose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span>
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

    const medicationPackagesAttributes: Attribute[] = [
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

    const groupAttributes: Attribute[] = [
        { label: 'Codigo', key: 'code', type: 'text' },
        { label: 'Nombre', key: 'name', type: 'text' },
        {
            label: 'Area',
            key: 'area',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (object.area) {
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba / Levante inicial";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena / Aislamiento";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital / Enfermería";
                        break;
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            label: 'Etapa',
            key: 'stage',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";
                let label = object.stage;

                switch (object.stage) {
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
        { label: 'Cerdos', key: 'pigCount', type: 'text' },
        { label: 'Fecha de creacion', key: 'creationDate', type: 'date' },
        { label: 'Observaciones', key: 'observations', type: 'text' },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            const groupData = groupResponse.data.data;
            setGroupDetails(groupData);

            const medicationResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/${groupData.stage}`)
            const packagesWithId = medicationResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setMedicationsPackages(packagesWithId);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const fetchMedicationsItems = async (medications: any[]) => {
        if (!configContext || !userLogged || !medications) return;
        try {
            const medicationsIds = medications.map(m => m.medication)
            const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, medicationsIds)

            const products = medicationResponse.data.data;
            const combined = medications.map(med => {
                const product = products.find((p: any) => p._id === med.medication);
                const productFormik = formik.values.medications.find((p: any) => p.medication === med.medication)
                return { ...product, ...med, totalDose: productFormik?.totalDose };
            });
            setMedicationsPackagesItems(combined)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    const validationSchema = Yup.object({
        applicationDate: Yup.date().required('La fecha de aplicacion es obligatoria'),
        appliedBy: Yup.string().required('El area de destino es obligatoria'),
    })

    const formik = useFormik<GroupMedicationPackagesHistory>({
        initialValues: {
            packageId: '',
            name: '',
            stage: '',
            medications: [],
            applicationDate: null,
            appliedBy: userLogged._id,
            observations: '',
            isActive: true,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_group_medication_package/${userLogged.farm_assigned}/${groupId}`, values)
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicación asignado al grupo ${groupDetails?.code}`
                });

                toggleModal('success', true)
            } catch (error: any) {
                console.error('Error saving the information: ', { error })
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock');
                    return;
                }

                if (error.response?.status === 400 && !error.response?.data?.missing) {
                    toggleModal('subwarehouseError');
                    return;
                }
                toggleModal('error')
            }
        }
    })

    const checkMedicationPackageData = async () => {
        if (formik.values.packageId === '') {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione un paquete de medicacion' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('applicationDate', new Date())
    }, [])

    useEffect(() => {
        if (selectedMedicationPackage) {
            const medicationsFull = selectedMedicationPackage.medications.map((m: any) => ({
                medication: m.medication,
                administrationRoute: m.administration_route,
                dosePerPig: m.quantity,
                totalDose: Number(m.quantity * (groupDetails?.pigCount ?? 0))
            }))

            formik.setFieldValue('packageId', selectedMedicationPackage._id)
            formik.setFieldValue('name', selectedMedicationPackage.name)
            formik.setFieldValue('stage', selectedMedicationPackage.stage)
            formik.setFieldValue('medications', medicationsFull)

            fetchMedicationsItems(selectedMedicationPackage.medications)
        }
    }, [selectedMedicationPackage])

    useEffect(() => {
        if (!formik.values.medications?.length) return;

        fetchMedicationsItems(selectedMedicationPackage.medications);
    }, [formik.values.medications]);


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
                            Selección de paquete de medicamentos
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
                        <Label htmlFor="observations" className="form-label">Seleccion de paquete de medicacion</Label>

                        <SelectableCustomTable
                            columns={medicationPackagesColumns}
                            data={medicationsPackages}
                            showPagination={true}
                            rowsPerPage={6}
                            selectionMode="single"
                            showSearchAndFilter={false}
                            onSelect={(rows) => setSelectedMedicationPackage(rows[0])}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkMedicationPackageData()}>
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
                                        attributes={groupAttributes}
                                        object={groupDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100">
                            <Card className="shadow-sm mb-3">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    Información de paquete de medicamentos
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={medicationPackagesAttributes}
                                        object={selectedMedicationPackage ?? {}}
                                    />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Medicamentos</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedMedicationsColumns}
                                        data={medicationPackagesItems || []}
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
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Paquete de medicacion asignado correctamente"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <ErrorModal isOpen={modals.subwarehouseError} onClose={() => toggleModal('subwarehouseError')} message={"No existe un subalmacen medico, pongase en contacto con el encargado de almacen"} />

        </>
    )
}

export default AsignGroupMedicationPackageForm;