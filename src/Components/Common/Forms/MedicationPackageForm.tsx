import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from "App";
import { Attribute, MedicationPackage, ProductData } from "common/data_interfaces";
import { useFormik } from "formik";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [products, setProducts] = useState<any[]>([])
    const [subwarehouses, setSubwarehouses] = useState<any[]>([])
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([])
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [modals, setModals] = useState({ success: false, error: false });

    const MEDICATION_CATEGORIES = ['medications', 'vaccines', 'vitamins', 'minerals'];

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
            header: t('feeding.package.form.column.image'), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="" style={{ height: "70px" }} />
            ),
        },
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('feeding.package.form.column.category'),
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                const label = t(`feeding.productCategory.${value}`, { defaultValue: value });

                switch (value) {
                    case "medications": color = "info"; break;
                    case "vaccines": color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: t('feeding.package.form.column.avgPrice'),
            accessor: "averagePrice",
            render: (_, row) => (
                <span>${(row.averagePrice ?? 0).toFixed(2)} / {row.unit_measurement}</span>
            ),
        },
        {
            header: t('medication.package.form.column.dosePerHead'),
            accessor: "quantity",
            type: "number",
            render: (_, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row.id);

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantity === 0 ? "" : (selected?.quantity ?? "")}
                            invalid={medicationErrors[row.id]?.quantity}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                setMedicationsSelected(prev =>
                                    prev.map(m => m.medication === row.id ? { ...m, quantity: newValue } : m)
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
            header: t('medical.medication.field.route'),
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row.id);
                const realValue = selected?.administration_route ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={medicationErrors[row.id]?.administration_route}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
                                prev.map(m => m.medication === row.id ? { ...m, administration_route: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t('form.pig.placeholder.selectOption')}</option>
                        <option value="oral">{t('medical.medication.route.oral')}</option>
                        <option value="intramuscular">{t('medical.medication.route.intramuscular')}</option>
                        <option value="subcutaneous">{t('medical.medication.route.subcutaneous')}</option>
                        <option value="intravenous">{t('medical.medication.route.intravenous')}</option>
                        <option value="intranasal">{t('medical.medication.route.intranasal')}</option>
                        <option value="topical">{t('medical.medication.route.topical')}</option>
                        <option value="rectal">{t('medical.medication.route.rectal')}</option>
                    </Input>
                );
            }
        },
    ];

    const selectedMedicationsColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medication.package.form.column.doseShort'),
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_: any, row: any) => (
                <span>{row.quantity} {row.unit_measurement}</span>
            ),
        },
        {
            header: t('feeding.package.form.column.avgPrice'),
            accessor: "averagePrice",
            render: (_: any, row: any) => (
                <span>${(row.averagePrice ?? 0).toFixed(2)} / {row.unit_measurement}</span>
            ),
        },
        {
            header: t('medication.package.form.column.costPerHead'),
            accessor: "costPerPig",
            render: (_: any, row: any) => {
                const cost = (row.quantity ?? 0) * (row.averagePrice ?? 0);
                return <span>${cost.toFixed(2)}</span>;
            },
        },
        {
            header: t('medical.medication.field.route'),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.medication.route.${value}`, { defaultValue: value });

                switch (value) {
                    case "oral": color = "info"; break;
                    case "intramuscular": color = "primary"; break;
                    case "subcutaneous": color = "primary"; break;
                    case "intravenous": color = "primary"; break;
                    case "intranasal": color = "primary"; break;
                    case "topical": color = "primary"; break;
                    case "rectal": color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const medicationAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        { key: 'creation_date', label: t('medication.package.column.createdAt'), type: 'date' },
        {
            key: 'stage',
            label: t('common.field.stage'),
            type: 'text',
            render: (_, row) => {
                let color = "secondary";
                const text = t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') });

                switch (row.stage) {
                    case "general": color = "info"; break;
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: 'creation_responsible',
            label: t('medication.package.detail.responsible'),
            type: 'text',
            render: (_, obj) => (<span className="text-black">{userLogged.name} {userLogged.lastname}</span>)
        },

    ]

    const validationSchema = useMemo(() => Yup.object({
        code: Yup.string().required(t('medication.package.form.validation.codeRequired')).test('unique_code', t('form.validation.codeExists'), async (value) => {
            if (!value) return false;
            if (!configContext) return true;
            try {
                const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/check_code_exists/${value}`);
                return !response.data.codeExists
            } catch (error) {
                logger.error('Error validating unique code: ', error);
                return false;
            }
        }),
        name: Yup.string().required(t('medication.package.form.validation.nameRequired')),
        stage: Yup.string().required(t('medication.package.form.validation.stageRequired')),
    }), [t]);

    const medicationValidation = useMemo(() => Yup.object({
        medication: Yup.string().required(),
        quantity: Yup.number()
            .moreThan(0, t('form.validation.positive'))
            .required(t('form.validation.required')),
        administration_route: Yup.string()
            .required(t('form.validation.required'))
            .notOneOf([""], t('form.validation.required')),
    }), [t]);

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
                    medications: medicationsSelected.map(ms => {
                        const product = products.find(p => p._id === ms.medication);
                        return {
                            ...ms,
                            averagePrice: ms.averagePrice ?? product?.averagePrice ?? 0,
                        };
                    })
                }
                const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/create`, values)

                if (medicationResponse.status === HttpStatusCode.Created) {
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Paquete de medicación ${values.code} creado`
                    });

                    toggleModal('success', true)
                }
            } catch (error) {
                logger.error('Error saving the information: ', { error })
                setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.error.save') })
            }
        }
    })

    const fetchData = async () => {
        if (!configContext) return
        try {
            setLoading(true)

            const [codeResponse, subwarehousesResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/next_medication_code`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ])

            formik.setFieldValue('code', codeResponse.data.data)
            setSubwarehouses(subwarehousesResponse.data.data || [])
        } catch (error) {
            logger.error('Error fetching information: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.loadError') })
        } finally {
            setLoading(false)
        }
    }

    const loadInventory = async (warehouseId: string) => {
        if (!configContext || !warehouseId) return;
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`);
            const inventory = response.data.data || [];
            const flattened = inventory
                .filter((item: any) => item.product && MEDICATION_CATEGORIES.includes(item.product.category))
                .map((item: any) => ({
                    ...item.product,
                    code: item.product.id,
                    id: item.product._id,
                    averagePrice: item.averagePrice ?? 0,
                    quantity_in_stock: item.quantity,
                }));
            setProducts(flattened);
        } catch (error) {
            logger.error('Error loading inventory: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.loadError') })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectWarehouse = (warehouseId: string) => {
        if (warehouseId === selectedWarehouseId) return;
        setSelectedWarehouseId(warehouseId);
        setMedicationsSelected([]);
        setMedicationErrors({});
        setProducts([]);
        if (warehouseId) loadInventory(warehouseId);
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
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.fillAllData') })
        }
    }

    const validateSelectedMedications = async () => {
        const errors: Record<string, any> = {};

        if (medicationsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.selectAtLeastOne') })
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
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.fillMedicationData') })
            return false;
        }

        return true;
    };

    useEffect(() => {
        fetchData();
        formik.setFieldValue('creation_date', new Date())
    }, [])

    return (
        <form onSubmit={e => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-warehouse-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-warehouse-tab"
                            disabled
                        >
                            {t('medication.package.form.step.warehouse')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-medicationPackageData-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-medicationPackageData-tab"
                            disabled
                        >
                            {t('medication.package.form.step.info')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-selecMedication-tab"
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
                            })}
                            onClick={() => toggleArrowTab(3)}
                            aria-selected={activeStep === 3}
                            aria-controls="step-selecMedication-tab"
                            disabled
                        >
                            {t('medication.package.form.step.medications')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href="#"
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 4,
                                done: activeStep > 4,
                            })}
                            onClick={() => toggleArrowTab(4)}
                            aria-selected={activeStep === 4}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('medication.package.form.step.summary')}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-warehouse-tab" tabId={1}>
                    <div className="mt-4">
                        <Label htmlFor="warehouse" className="form-label">{t('medication.package.form.field.warehouse')}</Label>
                        <Input
                            type="select"
                            id="warehouse"
                            name="warehouse"
                            value={selectedWarehouseId}
                            onChange={(e) => handleSelectWarehouse(e.target.value)}
                        >
                            <option value="">{t('medication.package.form.field.warehousePlaceholder')}</option>
                            {subwarehouses.map((w: any) => (
                                <option key={w._id} value={w._id}>
                                    {w.id ? `${w.id} - ${w.name}` : w.name}
                                </option>
                            ))}
                        </Input>
                        {selectedWarehouseId && !loading && products.length === 0 && (
                            <div className="mt-3 d-flex align-items-center gap-2 text-warning">
                                <i className="ri-error-warning-line" />
                                <small>{t('medication.package.form.noProductsInWarehouse')}</small>
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={() => {
                                if (!selectedWarehouseId) {
                                    setAlertConfig({ visible: true, color: 'danger', message: t('medication.package.form.validation.warehouseRequired') });
                                    return;
                                }
                                toggleArrowTab(activeStep + 1);
                            }}
                        >
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-medicationPackageData-tab" tabId={2}>
                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="code" className="form-label">{t('common.field.code')}</Label>
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
                            <Label htmlFor="name" className="form-label">{t('medication.package.form.field.name')}</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                                placeholder={t('medication.package.form.field.namePlaceholder')}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name}</FormFeedback>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 w-100">
                        <Label htmlFor="stage" className="form-label">{t('common.field.stage')}</Label>
                        <Input
                            type="select"
                            id="stage"
                            name="stage"
                            value={formik.values.stage}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.stage && !!formik.errors.stage}
                        >
                            <option value="">{t('feeding.package.form.field.stageSelect')}</option>
                            <option value="general">{t('feeding.stage.general')}</option>
                            <option value="piglet">{t('feeding.stage.piglet')}</option>
                            <option value="weaning">{t('feeding.stage.weaning')}</option>
                            <option value="fattening">{t('feeding.stage.fattening')}</option>
                            <option value="breeder">{t('feeding.stage.breeder')}</option>
                        </Input>
                        {formik.touched.stage && formik.errors.stage && (
                            <FormFeedback>{formik.errors.stage}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex gap-3">
                        <div className="mt-4 w-50">
                            <Label htmlFor="creation_date" className="form-label">{t('feeding.package.form.field.registrationDate')}</Label>
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
                            <Label htmlFor="user" className="form-label">{t('feeding.package.form.field.responsible')}</Label>
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
                        <Label htmlFor="description" className="form-label">{t('feeding.package.form.field.description')}</Label>
                        <Input
                            type="text"
                            id="description"
                            name="description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.description && !!formik.errors.description}
                            placeholder={t('medication.package.form.field.descriptionPlaceholder')}
                        />
                        {formik.touched.description && formik.errors.description && (
                            <FormFeedback>{formik.errors.description}</FormFeedback>
                        )}
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>
                        <Button className="btn btn-primary ms-auto" onClick={() => checkMedicationData()}>
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-selecMedication-tab" tabId={3}>
                    <SelectableCustomTable
                        columns={columns}
                        data={products}
                        showPagination={true}
                        rowsPerPage={6}
                        onSelect={(rows) => {
                            setMedicationsSelected(prev => {
                                const newRows = rows.map(r => {
                                    const existing = prev.find(p => p.medication === r.id);
                                    if (existing) return existing;

                                    return {
                                        medication: r.id,
                                        quantity: 0,
                                        administration_route: "",
                                        averagePrice: r.averagePrice ?? 0,
                                    };
                                });
                                return newRows;
                            });
                        }}
                    />

                    <Card className="mt-3 border-0 bg-light">
                        <CardBody className="py-3 px-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2 text-muted">
                                    <i className="ri-money-dollar-circle-line fs-4 text-primary" />
                                    <span className="fw-semibold">{t('medication.package.form.cost.title')}</span>
                                    {medicationsSelected.length === 0 && (
                                        <small className="text-muted">(seleccione productos y llene las cantidades)</small>
                                    )}
                                </div>
                                <span className="fs-4 fw-bold text-primary">
                                    ${medicationsSelected.reduce((total, ms) => {
                                        const product = products.find(p => p._id === ms.medication);
                                        return total + (ms.quantity ?? 0) * (ms.averagePrice ?? product?.averagePrice ?? 0);
                                    }, 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-2">
                                <i className="ri-information-line text-warning" />
                                <small className="text-muted">{t('medication.package.form.cost.note')}</small>
                            </div>
                        </CardBody>
                    </Card>

                    <div className="d-flex justify-content-between mt-3">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedMedications();
                                if (!ok) return;
                                toggleArrowTab(4);
                            }}
                        >
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={4}>
                    <div className="d-flex gap-3">
                        <Card className="border-primary border-opacity-25">
                            <CardHeader className="bg-primary bg-opacity-10">
                                <h5 className="mb-0 text-primary">
                                    <i className="ri-file-list-3-line me-2" />
                                    {t('medication.package.info.card')}
                                </h5>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={medicationAttributes} object={formik.values} />
                            </CardBody>
                        </Card>

                        <Card className="w-100 border-success border-opacity-25">
                            <CardHeader className="bg-success bg-opacity-10">
                                <h5 className="mb-0 text-success">
                                    <i className="ri-medicine-bottle-line me-2" />
                                    {t('medication.package.form.medicationsSelectedCard')}
                                </h5>
                            </CardHeader>
                            <CardBody className="p-0">
                                <CustomTable
                                    columns={selectedMedicationsColumns}
                                    data={medicationsSelected.map(ms => ({
                                        ...products.find(p => p.id === ms.medication),
                                        ...ms
                                    }))}
                                    showSearchAndFilter={false}
                                />
                                <div className="px-4 py-3 bg-success bg-opacity-10 border-top">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-money-dollar-circle-line fs-4 text-success" />
                                            <span className="fw-semibold text-success fs-6">{t('medication.package.form.cost.title')}</span>
                                        </div>
                                        <span className="fs-4 fw-bold text-success">
                                            ${medicationsSelected.reduce((total, ms) => {
                                                const product = products.find(p => p._id === ms.medication);
                                                return total + (ms.quantity ?? 0) * (ms.averagePrice ?? product?.averagePrice ?? 0);
                                            }, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-1 mt-1">
                                        <i className="ri-information-line text-warning" />
                                        <small className="text-muted">{t('medication.package.form.cost.noteWithDate', { date: new Date().toLocaleDateString('es-MX') })}</small>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                            {formik.isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    {t('form.pig.action.register')}
                                </div>
                            )}

                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('medication.package.success.saved')} />
            <SuccessModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('medication.package.error.save')} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
        </form>
    )
}

export default MedicationPackageForm