import { ConfigContext } from "App";
import { Attribute, FeedingPackage, MedicationPackage, ProductData } from "common/data_interfaces";
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
import LoadingAnimation from "../Shared/LoadingAnimation";

interface FeedingPackageFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const FeedingPackageForm: React.FC<FeedingPackageFormProps> = ({ onSave, onCancel }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [products, setProducts] = useState<any[]>([])
    const [feedingsSelected, setFeedingsSelected] = useState<any[]>([])
    const [feedingErrors, setFeedingErrors] = useState<Record<string, any>>({});
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
                    case "nutrition":
                        color = "info";
                        label = "Nutricion";
                        break;
                    case "vitamins":
                        color = "primary";
                        label = "Vitaminas";
                        break;
                    case "minerals":
                        color = "primary";
                        label = "Minerales";
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
                const selected = feedingsSelected.find(f => f.feeding === row._id);
                const realValue = selected?.quantity ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantity === 0 ? "" : (selected?.quantity ?? "")}
                            invalid={feedingErrors[row._id]?.quantity}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setFeedingsSelected(prev =>
                                    prev.map(f => f.feeding === row._id ? { ...f, quantity: newValue } : f)
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
    ];

    const selectedFeedingsColumns: Column<any>[] = [
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
    ]

    const feedingAttributes: Attribute[] = [
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
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/feeding_package/check_code_exists/${value}`);
                return !response.data.codeExists
            } catch (error) {
                console.error('Error validating unique code: ', error);
                return false;
            }
        }),
        name: Yup.string().required('El nombre es obligatorio'),
        stage: Yup.string().required('El area de destino es obligatoria'),
    })

    const feedingValidation = Yup.object({
        feeding: Yup.string().required(),
        quantity: Yup.number()
            .moreThan(0, "Cantidad inválida")
            .required("Cantidad requerida"),
    });

    const formik = useFormik<FeedingPackage>({
        initialValues: {
            code: '',
            name: '',
            description: '',
            farm: userLogged.farm_assigned || '',
            creation_date: null,
            creation_responsible: userLogged._id || '',
            is_active: true,
            stage: '',
            feedings: [],
            periodicity: '',
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
                    feedings: feedingsSelected
                }
                const feedingResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/feeding_package/create`, values)

                if (feedingResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Paquete de alimentacion ${values.code} creado`
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
                configContext.axiosHelper.get(`${configContext.apiUrl}/feeding_package/next_feeding_code`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_feeding_products`),
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

    const checkFeedingData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            creation_date: true,
            stage: true,
            periodicity: true,
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos' })
        }
    }

    const validateSelectedFeedings = async () => {
        const errors: Record<string, any> = {};

        if (feedingsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 medicamento' })
            return false;
        }

        for (const fed of feedingsSelected) {
            try {
                await feedingValidation.validate(fed, { abortEarly: false });
            } catch (err: any) {
                const fedErrors: any = {};

                err.inner.forEach((e: any) => {
                    fedErrors[e.path] = true;
                });

                errors[fed.feeding] = fedErrors;
            }
        }

        setFeedingErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de los alimentos seleccionadas' })
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date())
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-feedingPackageData-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-feedingPackageData-tab"
                            disabled
                        >
                            Información del paquete de alimentacion
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-selecFeeding-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-selecFeeding-tab"
                            disabled
                        >
                            Seleccion de alimentos
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
                <TabPane id="step-feedingPackageData-tab" tabId={1}>
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

                    <div className="d-flex gap-3">
                        <div className="mt-4 w-100">
                            <Label htmlFor="periodicity" className="form-label">
                                Periodicidad de alimentación / suplementación
                            </Label>
                            <Input
                                type="select"
                                id="periodicity"
                                name="periodicity"
                                value={formik.values.periodicity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.periodicity && !!formik.errors.periodicity}
                            >
                                <option value="">Seleccione una periodicidad</option>
                                <option value="once_day">1 vez al día</option>
                                <option value="twice_day">2 veces al día</option>
                                <option value="three_times_day">3 veces al día</option>
                                <option value="ad_libitum">Ad libitum (libre acceso)</option>
                                <option value="weekly">1 vez a la semana</option>
                                <option value="biweekly">Cada 15 días</option>
                                <option value="monthly">Mensual</option>
                                <option value="specific_days">Días específicos</option>
                                <option value="by_event">Por evento productivo</option>
                            </Input>

                            {formik.touched.periodicity && formik.errors.periodicity && (
                                <FormFeedback>{formik.errors.periodicity}</FormFeedback>
                            )}
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
                        <Button className="btn btn-primary ms-auto" onClick={() => checkFeedingData()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-selecFeeding-tab" tabId={2}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => {
                            setFeedingsSelected(prev => {
                                const newRows = rows.map(r => {
                                    const existing = prev.find(p => p.feeding === r._id);
                                    if (existing) return existing;

                                    return {
                                        feeding: r._id,
                                        quantity: 0,
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
                                const ok = await validateSelectedFeedings();
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
                                <h5>Informacion del paquete de alimentacion</h5>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={feedingAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card className="w-100">
                            <CardHeader>
                                <h5>Alimentos seleccionados</h5>
                            </CardHeader>
                            <CardBody className="p-0">
                                <CustomTable
                                    columns={selectedFeedingsColumns}
                                    data={feedingsSelected.map(ms => ({
                                        ...products.find(p => p._id === ms.feeding),
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

export default FeedingPackageForm;