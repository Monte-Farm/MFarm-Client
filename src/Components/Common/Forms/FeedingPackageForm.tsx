import { ConfigContext } from "App";
import { Attribute, FeedingPackage } from "common/data_interfaces";
import { useFormik } from "formik";
import { getLoggedinUser } from "helpers/api_helper";
import { FEEDING_PACKAGE_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Progress, Spinner, TabContent, TabPane } from "reactstrap";
import * as Yup from "yup";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import AlertMessage from "../Shared/AlertMesagge";
import { Column } from "common/data/data_types";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png';
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { HttpStatusCode } from "axios";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { PRODUCT_TYPES } from "common/enums/products.enums";

interface FeedingPackageFormProps {
    onSave: () => void;
    onCancel: () => void;
    feedingPackageId?: string;
}

interface SelectedFeeding {
    feeding: string;
    percentage: number;
    percentageInput?: string;
}

const RAW_INGREDIENT_CATEGORIES = ['nutrition', 'vitamins', 'minerals'];

const FeedingPackageForm: React.FC<FeedingPackageFormProps> = ({ onSave, onCancel, feedingPackageId }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const isEditMode = Boolean(feedingPackageId);

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(true);
    const [products, setProducts] = useState<any[]>([]);
    const [feedingsSelected, setFeedingsSelected] = useState<SelectedFeeding[]>([]);
    const [percentageErrors, setPercentageErrors] = useState<Record<string, boolean>>({});
    const [modals, setModals] = useState({ success: false, error: false });
    const [preselectedRows, setPreselectedRows] = useState<any[]>([]);

    const totalPercentage = feedingsSelected.reduce((acc, f) => acc + (Number(f.percentage) || 0), 0);
    const sumIs100 = Math.abs(totalPercentage - 100) < 0.01;

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab && tab >= 1 && tab <= 3) {
            setActiveStep(tab);
            setPassedarrowSteps([...passedarrowSteps, tab]);
        }
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const ingredientColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Producto" style={{ height: "70px" }} />
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
                    case "nutrition": color = "info"; label = "Nutricion"; break;
                    case "vitamins": color = "primary"; label = "Vitaminas"; break;
                    case "minerals": color = "primary"; label = "Minerales"; break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Precio Promedio",
            accessor: "averagePrice",
            render: (_value, row) => (
                <span>${(row.averagePrice ?? 0).toFixed(2)} / {row.unit_measurement}</span>
            ),
        },
        {
            header: "Porcentaje (%)",
            accessor: "percentage",
            render: (_, row, isSelected) => {
                const selected = feedingsSelected.find(f => f.feeding === row.id || f.feeding === row._id);
                return (
                    <div className="input-group" style={{ maxWidth: 140 }}>
                        <Input
                            type="text"
                            inputMode="decimal"
                            disabled={!isSelected}
                            value={selected?.percentageInput ?? ""}
                            invalid={percentageErrors[row.id]}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
                                const parsed = raw === "" || raw === "." ? 0 : Number(raw);
                                setFeedingsSelected(prev =>
                                    prev.map(f => f.feeding === row.id ? { ...f, percentage: parsed, percentageInput: raw } : f)
                                );
                            }}
                            onBlur={() => {
                                setFeedingsSelected(prev =>
                                    prev.map(f => {
                                        if (f.feeding !== row.id) return f;
                                        const normalized = f.percentage > 0 ? String(f.percentage) : "";
                                        return { ...f, percentageInput: normalized };
                                    })
                                );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0.00"
                        />
                        <span className="input-group-text">%</span>
                    </div>
                );
            },
        },
    ];

    const summaryColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Producto" style={{ height: "70px" }} />
            ),
        },
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Porcentaje",
            accessor: "percentage",
            render: (_, row) => <Badge color="success">{row.percentage}%</Badge>
        },
        {
            header: "Aporte estimado por kg de mezcla",
            accessor: "perKg",
            render: (_, row) => (
                <span>{((row.percentage ?? 0) / 100).toFixed(3)} kg / kg de mezcla</span>
            )
        },
    ];

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
                    case "general": color = "info"; text = "General"; break;
                    case "piglet": color = "info"; text = "Lechón"; break;
                    case "weaning": color = "warning"; text = "Destete"; break;
                    case "fattening": color = "primary"; text = "Engorda"; break;
                    case "breeder": color = "success"; text = "Reproductor"; break;
                }
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'expectedYield',
            label: 'Rendimiento esperado',
            render: (_, row) => <span>{row.expectedYield ?? 100}%</span>
        },
        {
            key: 'creation_responsible',
            label: 'Responsable',
            type: 'text',
            render: () => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },
    ];

    const validationSchema = Yup.object({
        code: Yup.string().required('El código es obligatorio')
            .test('unique_code', 'Este codigo ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false;
                if (!configContext) return true;
                if (isEditMode) return true; // No revalidar code en edición
                try {
                    const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.checkCodeExists(value)}`);
                    return !response.data.codeExists;
                } catch (error) {
                    console.error('Error validating unique code: ', error);
                    return false;
                }
            }),
        name: Yup.string().required('El nombre es obligatorio'),
        stage: Yup.string().required('La etapa es obligatoria'),
        expectedYield: Yup.number()
            .typeError('Debe ser un número')
            .min(1, 'Mínimo 1%')
            .max(100, 'Máximo 100%')
            .required('El rendimiento esperado es obligatorio'),
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
            expectedYield: 100,
            feedings: [],
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            if (!configContext) return;
            try {
                const payload = {
                    ...values,
                    feedings: feedingsSelected.map(f => ({
                        feeding: f.feeding,
                        percentage: f.percentage,
                    })),
                };

                const url = isEditMode
                    ? `${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.update(feedingPackageId!)}`
                    : `${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.create}`;

                const response = isEditMode
                    ? await configContext.axiosHelper.put(url, payload)
                    : await configContext.axiosHelper.create(url, payload);

                const okStatus = isEditMode ? HttpStatusCode.Ok : HttpStatusCode.Created;
                if (response.status === okStatus) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Receta de alimentación ${payload.code} ${isEditMode ? 'actualizada' : 'creada'}`,
                    });
                    toggleModal('success', true);
                }
            } catch (error) {
                console.error('Error saving the information: ', error);
                toggleModal('error', true);
            }
        }
    });

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);

            const productsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/feeding_products/${userLogged.farm_assigned}`);
            const allProducts = productsResponse.data.data || [];
            // Filtro: solo materia prima de categorías de alimento.
            const rawIngredients = allProducts.filter((p: any) => {
                const isRaw = !p.type || p.type === PRODUCT_TYPES.RAW;
                const isFeedCategory = RAW_INGREDIENT_CATEGORIES.includes(p.category);
                return isRaw && isFeedCategory;
            });
            setProducts(rawIngredients);

            if (isEditMode) {
                const recipeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.findById(feedingPackageId!)}`);
                const recipe = recipeResponse.data.data;
                formik.setValues({
                    code: recipe.code,
                    name: recipe.name,
                    description: recipe.description || '',
                    farm: typeof recipe.farm === 'string' ? recipe.farm : recipe.farm?._id || userLogged.farm_assigned,
                    creation_date: recipe.creation_date ? new Date(recipe.creation_date) : new Date(),
                    creation_responsible: typeof recipe.creation_responsible === 'string' ? recipe.creation_responsible : recipe.creation_responsible?._id,
                    is_active: recipe.is_active,
                    stage: recipe.stage,
                    expectedYield: recipe.expectedYield ?? 100,
                    feedings: [],
                });
                // Normalizamos el feeding al mismo identificador que usa la tabla (`id` del producto).
                const initialSelected: SelectedFeeding[] = (recipe.feedings || [])
                    .map((f: any) => {
                        const rawRef = f.feeding?._id || f.feeding?.id || f.feeding;
                        const matched = rawIngredients.find((p: any) =>
                            p.id === rawRef || p._id === rawRef || p.id === f.feeding?.id
                        );
                        if (!matched) return null;
                        const pct = f.percentage ?? 0;
                        return {
                            feeding: matched.id,
                            percentage: pct,
                            percentageInput: pct > 0 ? String(pct) : "",
                        };
                    })
                    .filter((s: SelectedFeeding | null): s is SelectedFeeding => s !== null);
                setFeedingsSelected(initialSelected);
                const preselected = rawIngredients.filter((p: any) =>
                    initialSelected.some(s => s.feeding === p.id)
                );
                setPreselectedRows(preselected);
            } else {
                const codeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_PACKAGE_URLS.nextCode}`);
                formik.setFieldValue('code', codeResponse.data.data);
                formik.setFieldValue('creation_date', new Date());
            }
        } catch (error) {
            console.error('Error fetching information: ', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos' });
        } finally {
            setLoading(false);
        }
    };

    const checkBasicData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            creation_date: true,
            stage: true,
            expectedYield: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, complete todos los campos obligatorios' });
        }
    };

    const validateSelectedFeedings = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (feedingsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Seleccione al menos 1 ingrediente' });
            return false;
        }

        for (const f of feedingsSelected) {
            if (!f.percentage || f.percentage <= 0) {
                errors[f.feeding] = true;
            }
        }

        setPercentageErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Todos los ingredientes deben tener un porcentaje mayor a 0' });
            return false;
        }

        if (!sumIs100) {
            setAlertConfig({ visible: true, color: 'danger', message: `La suma de porcentajes debe ser exactamente 100%. Actualmente: ${totalPercentage.toFixed(2)}%` });
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return <LoadingAnimation absolutePosition={false} />;
    }

    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }}>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink href="#" className={classnames({ active: activeStep === 1, done: activeStep > 1 })} disabled>
                            Información de la receta
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href="#" className={classnames({ active: activeStep === 2, done: activeStep > 2 })} disabled>
                            Ingredientes y porcentajes
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href="#" className={classnames({ active: activeStep === 3, done: activeStep > 3 })} disabled>
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                {/* STEP 1 — Información básica */}
                <TabPane tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="code" className="form-label">Código</Label>
                            <Input
                                type="text" id="code" name="code"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.code && !!formik.errors.code}
                                disabled={isEditMode}
                                placeholder="Ej: REC-001"
                            />
                            {formik.touched.code && formik.errors.code && (<FormFeedback>{formik.errors.code}</FormFeedback>)}
                        </div>

                        <div className="mt-4 w-50">
                            <Label htmlFor="name" className="form-label">Nombre de la receta</Label>
                            <Input
                                type="text" id="name" name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                                placeholder="Ej: Receta inicio lechón"
                            />
                            {formik.touched.name && formik.errors.name && (<FormFeedback>{formik.errors.name}</FormFeedback>)}
                        </div>
                    </div>

                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="stage" className="form-label">Etapa</Label>
                            <Input
                                type="select" id="stage" name="stage"
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
                            {formik.touched.stage && formik.errors.stage && (<FormFeedback>{formik.errors.stage}</FormFeedback>)}
                        </div>

                        <div className="mt-4 w-50">
                            <Label htmlFor="expectedYield" className="form-label">
                                Rendimiento esperado (%) <i className="ri-information-line text-muted" title="Porcentaje esperado de kg producidos respecto a kg cargados"></i>
                            </Label>
                            <div className="input-group">
                                <Input
                                    type="number"
                                    id="expectedYield"
                                    name="expectedYield"
                                    min={1}
                                    max={100}
                                    step="0.01"
                                    value={formik.values.expectedYield}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.expectedYield && !!formik.errors.expectedYield}
                                />
                                <span className="input-group-text">%</span>
                            </div>
                            {formik.touched.expectedYield && formik.errors.expectedYield && (
                                <div className="text-danger small mt-1">{formik.errors.expectedYield as string}</div>
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
                                    if (date[0]) formik.setFieldValue('creation_date', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                        </div>

                        <div className="mt-4 w-50">
                            <Label htmlFor="user" className="form-label">Responsable del registro *</Label>
                            <Input type="text" id="user" value={`${userLogged.name} ${userLogged.lastname}`} disabled />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="description" className="form-label">Descripción</Label>
                        <Input
                            type="text" id="description" name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Observaciones sobre la receta"
                        />
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button color="secondary" outline onClick={onCancel}>Cancelar</Button>
                        <Button className="btn btn-primary" onClick={() => checkBasicData()}>
                            Siguiente <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                {/* STEP 2 — Ingredientes con porcentajes */}
                <TabPane tabId={2}>
                    <Card className="mb-3 border-0 bg-light">
                        <CardBody className="py-3 px-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="ri-pie-chart-line fs-4 text-primary" />
                                    <span className="fw-semibold">Suma de porcentajes</span>
                                </div>
                                <span className={`fs-4 fw-bold ${sumIs100 ? 'text-success' : 'text-danger'}`}>
                                    {totalPercentage.toFixed(2)}% / 100%
                                </span>
                            </div>
                            <Progress
                                value={Math.min(totalPercentage, 100)}
                                color={sumIs100 ? 'success' : totalPercentage > 100 ? 'danger' : 'warning'}
                                style={{ height: '12px' }}
                            />
                            {!sumIs100 && (
                                <div className="d-flex align-items-center gap-1 mt-2">
                                    <i className="ri-information-line text-warning" />
                                    <small className="text-muted">
                                        {totalPercentage > 100
                                            ? `Excede en ${(totalPercentage - 100).toFixed(2)}%. Reduzca algún ingrediente.`
                                            : `Faltan ${(100 - totalPercentage).toFixed(2)}% por asignar.`}
                                    </small>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <SelectableCustomTable
                        columns={ingredientColumns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        initialSelectedIds={preselectedRows.map((r: any) => r.id || r._id)}
                        onSelect={(rows) => {
                            setFeedingsSelected(prev => {
                                return rows.map(r => {
                                    const rowId = r.id || (r as any)._id;
                                    const existing = prev.find(p => p.feeding === rowId || p.feeding === r.id || p.feeding === (r as any)._id);
                                    if (existing) return { ...existing, feeding: rowId };
                                    return { feeding: rowId, percentage: 0, percentageInput: "" };
                                });
                            });
                        }}
                    />

                    <div className="d-flex justify-content-between mt-3">
                        <Button color="danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" /> Atrás
                        </Button>
                        <Button color="primary" onClick={() => { if (validateSelectedFeedings()) toggleArrowTab(3); }}>
                            Siguiente <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                {/* STEP 3 — Resumen */}
                <TabPane tabId={3}>
                    <div className="d-flex gap-3">
                        <Card className="border-primary border-opacity-25" style={{ minWidth: '320px' }}>
                            <CardHeader className="bg-primary bg-opacity-10">
                                <h5 className="mb-0 text-primary">
                                    <i className="ri-file-list-3-line me-2" /> Información de la receta
                                </h5>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={feedingAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card className="w-100 border-success border-opacity-25">
                            <CardHeader className="bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 text-success">
                                    <i className="ri-leaf-line me-2" /> Ingredientes
                                </h5>
                                <Badge color="success" className="fs-6">Total: {totalPercentage.toFixed(2)}%</Badge>
                            </CardHeader>
                            <CardBody className="p-0">
                                <CustomTable
                                    columns={summaryColumns}
                                    data={feedingsSelected.map(f => ({
                                        ...products.find(p => p.id === f.feeding),
                                        ...f,
                                    }))}
                                    showSearchAndFilter={false}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button color="danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" /> Atrás
                        </Button>
                        <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting || !sumIs100}>
                            {formik.isSubmitting ? <Spinner size='sm' /> : (
                                <><i className="ri-check-line me-2" />{isEditMode ? 'Guardar cambios' : 'Registrar receta'}</>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal
                isOpen={modals.success}
                onClose={onSave}
                message={isEditMode ? "Receta actualizada con éxito" : "Receta registrada con éxito"}
            />
            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message={`Ha ocurrido un error al ${isEditMode ? 'actualizar' : 'registrar'} la receta`}
            />
            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                absolutePosition={false}
                autoClose={3000}
            />
        </form>
    );
};

export default FeedingPackageForm;
