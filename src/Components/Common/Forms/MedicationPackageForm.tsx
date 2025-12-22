import { ConfigContext } from "App";
import { Attribute, MedicationPackage, ProductData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import SelectTable from "../Tables/SelectTable";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png'
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import SuccessModal from "../Shared/SuccessModal";
import { HttpStatusCode } from "axios";

interface MedicationPackageFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const MedicationPackageForm: React.FC<MedicationPackageFormProps> = ({ onSave, onCancel }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [products, setProducts] = useState<any[]>([])
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([])
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [modals, setModals] = useState({ success: false, error: false });

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
                    case "medications":
                        color = "info";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Cantidad",
            accessor: "quantity",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.quantity ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantity === 0 ? "" : (selected?.quantity ?? "")}
                            invalid={medicationErrors[row._id]?.quantity}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setMedicationsSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, quantity: newValue } : m)
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
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.administration_route ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={medicationErrors[row._id]?.administration_route}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
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
    ];

    const selectedMedicationsColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        // {
        //     header: 'Categoria',
        //     accessor: 'category',
        //     render: (value: string) => {
        //         let color = "secondary";
        //         let label = value;

        //         switch (value) {
        //             case "medications":
        //                 color = "info";
        //                 label = "Medicamentos";
        //                 break;
        //             case "vaccines":
        //                 color = "primary";
        //                 label = "Vacunas";
        //                 break;
        //         }

        //         return <Badge color={color}>{label}</Badge>;
        //     },
        // },
        { header: "Unidad M.", accessor: "unit_measurement", type: "text", isFilterable: true },
        { header: "Cantidad", accessor: "quantity", type: "text", isFilterable: true },
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

    const medicationAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'creation_date', label: 'Fecha de creacion', type: 'date' },
        {
            key: 'stage',
            label: 'Etapa',
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
            key: 'creation_responsible',
            label: 'Responsable de registo',
            type: 'text',
            render: (_, obj) => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },

    ]

    const validationSchema = Yup.object({
        code: Yup.string().required('El código es obligatorio').test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
            if (!value) return false;
            if (!configContext) return true;
            try {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/check_code_exists/${value}`);
                return !response.data.codeExists
            } catch (error) {
                console.error('Error validating unique code: ', error);
                return false;
            }
        }),
        name: Yup.string().required('El nombre es obligatorio'),
        stage: Yup.string().required('La etapa es obligatoria'),
    })

    const medicationValidation = Yup.object({
        medication: Yup.string().required(),
        quantity: Yup.number()
            .moreThan(0, "Cantidad inválida")
            .required("Cantidad requerida"),
        administration_route: Yup.string()
            .required("Vía requerida")
            .notOneOf([""], "Debe seleccionar una vía"),
    });

    const formik = useFormik<MedicationPackage>({
        initialValues: {
            code: '',
            name: '',
            description: '',
            farm: userLogged.farm_assigned || '',
            creation_date: null,
            creation_responsible: userLogged._id || '',
            is_active: true,
            stage: '',
            medications: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const values = {
                    ...formik.values,
                    medications: medicationsSelected
                }
                const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/create`, values)

                if (medicationResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Paquete de medicación ${values.code} creado`
                    });

                    toggleModal('success', true)
                }
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

            const [codeResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/next_medication_code`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`),
            ])

            formik.setFieldValue('code', codeResponse.data.data)
            const productsWithId = productsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setProducts(productsWithId)
        } catch (error) {
            console.error('Error fetching information: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const checkMedicationData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            creation_date: true,
            stage: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos' })
        }
    }

    const validateSelectedMedications = async () => {
        const errors: Record<string, any> = {};

        if (medicationsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 medicamento' })
            return false;
        }

        for (const med of medicationsSelected) {
            try {
                await medicationValidation.validate(med, { abortEarly: false });
            } catch (err: any) {
                const medErrors: any = {};

                err.inner.forEach((e: any) => {
                    medErrors[e.path] = true;
                });

                errors[med.medication] = medErrors;
            }
        }

        setMedicationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de las medicaciones seleccionadas' })
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date())
    }, [])

    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-medicationPackageData-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-medicationPackageData-tab"
                            disabled
                        >
                            Información del paquete de medicación
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-selecMedication-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-selecMedication-tab"
                            disabled
                        >
                            Seleccion de medicacion
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
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
                <TabPane id="step-medicationPackageData-tab" tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="code" className="form-label">Código</Label>
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

                        <div className="mt-4 w-50">
                            <Label htmlFor="name" className="form-label">Nombre del paquete</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                                placeholder="Ej: Paquete inicial"
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 w-100">
                        <Label htmlFor="stage" className="form-label">Etapa</Label>
                        <Input
                            type="select"
                            id="stage"
                            name="stage"
                            value={formik.values.stage}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.stage && !!formik.errors.stage}
                        >
                            <option value="">Seleccione una etapa</option>
                            <option value="general">General</option>
                            <option value="piglet">Lechón</option>
                            <option value="weaning">Destete</option>
                            <option value="fattening">Engorda</option>
                            <option value="breeder">Reproductor</option>
                        </Input>
                        {formik.touched.stage && formik.errors.stage && (
                            <FormFeedback>{formik.errors.stage}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex gap-3">
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

                    <div className="mt-4">
                        <Label htmlFor="description" className="form-label">Descripción</Label>
                        <Input
                            type="text"
                            id="description"
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.description && !!formik.errors.description}
                            placeholder="Observaciones sobre el grupo"
                        />
                        {formik.touched.description && formik.errors.description && (
                            <FormFeedback>{formik.errors.description}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkMedicationData()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-selecMedication-tab" tabId={2}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => {
                            setMedicationsSelected(prev => {
                                const newRows = rows.map(r => {
                                    const existing = prev.find(p => p.medication === r._id);
                                    if (existing) return existing;

                                    return {
                                        medication: r._id,
                                        quantity: 0,
                                        administration_route: "",
                                    };
                                });
                                return newRows;
                            });
                        }}
                    />

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>


                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedMedications();
                                if (!ok) return;
                                toggleArrowTab(3);
                            }}
                        >
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={3}>
                    <div className="d-flex gap-3">
                        <Card className="">
                            <CardHeader>
                                <h5>Informacion del paquete de medicacion</h5>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={medicationAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card className="w-100">
                            <CardHeader>
                                <h5>Medicamentos seleccionados</h5>
                            </CardHeader>
                            <CardBody className="p-0">
                                <CustomTable
                                    columns={selectedMedicationsColumns}
                                    data={medicationsSelected.map(ms => ({
                                        ...products.find(p => p._id === ms.medication),
                                        ...ms
                                    }))}
                                    showSearchAndFilter={false}
                                />
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

            <SuccessModal isOpen={modals.success} onClose={onSave} message={"Paquete de medicamentos registrado con exito"} />
            <SuccessModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al registrar el paquete de medicamentos, intentelo mas tarde"} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
        </form>
    )
}

export default MedicationPackageForm