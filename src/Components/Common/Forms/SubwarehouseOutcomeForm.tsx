import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Attribute, OutcomeData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from '../Details/ObjectDetailsHorizontal';
import { Column } from 'common/data/data_types';
import DatePicker from "react-flatpickr";
import CustomTable from '../Tables/CustomTable';
import SelectableTable from '../Tables/SelectableTable';
import SelectableCustomTable from '../Tables/SelectableTable';
import { SubwarehouseData } from 'common/data_interfaces';
import { getLoggedinUser } from 'helpers/api_helper';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';
import AlertMessage from '../Shared/AlertMesagge';
import LoadingAnimation from '../Shared/LoadingAnimation';
import { OUTCOME_TYPES, getOutcomeTypeLabel } from 'common/enums/outcomes.enums';
import ObjectDetails from '../Details/ObjectDetails';

interface OutcomeFormProps {
    initialData?: OutcomeData;
    onSave: () => void;
    onCancel: () => void;
}

const getOutcomeAttributes = (values: any, selectedSubwarehouse: SubwarehouseData | null): Attribute[] => {
    const attributes: Attribute[] = [
        { key: 'code', label: 'Identificador' },
        { key: 'date', label: 'Fecha', type: 'date' },
        { key: 'outcomeType', label: 'Motivo de salida' },
        { key: 'description', label: 'Descripción' },
        { key: 'totalPrice', label: 'Valor total', type: 'currency' },
    ];

    if (values.outcomeType === OUTCOME_TYPES.TRANSFER && selectedSubwarehouse) {
        attributes.splice(3, 0,
            { key: 'warehouseDestinyName', label: 'Subalmacén de destino' }
        );
    }

    return attributes;
};

const subwarehouseColumns: Column<any>[] = [
    { header: 'Código', accessor: 'code', isFilterable: true, type: 'text' },
    { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
    {
        header: 'Responsable',
        accessor: 'manager',
        isFilterable: true,
        type: 'text',
        render: (value, row) => <span>{row?.manager?.name} {row?.manager?.lastname}</span>
    },
]

const selectedProductColumns: Column<any>[] = [
    { header: 'Código', accessor: 'code', isFilterable: false, type: 'text' },
    { header: 'Producto', accessor: 'productName', isFilterable: false, type: 'text' },
    { header: 'Cantidad', accessor: 'quantity', isFilterable: false, type: 'number', bgColor: '#e3f2fd' },
    { header: 'Precio Unitario', accessor: 'price', isFilterable: false, type: 'currency', bgColor: '#f3e5f5' },
    { header: 'Subtotal', accessor: 'subtotal', isFilterable: false, type: 'currency', bgColor: '#e8f5e8' },
];


const SubwarehouseOutcomeForm: React.FC<OutcomeFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false, success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])
    const [productErrors, setProductErrors] = useState<Record<string, any>>({})
    const [subwarehouses, setSubwarehouses] = useState<any[]>([])
    const [selectedSubwarehouse, setSelectedSubwarehouse] = useState<SubwarehouseData | null>(null)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(true);

    const productColumns: Column<any>[] = [
        {
            header: 'Código',
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row?.product?.id}</span>
        },
        {
            header: 'Producto',
            accessor: 'name',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row?.product?.name}</span>
        },
        {
            header: 'Cantidad disponible',
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (value, row) => <span>{row?.quantity} {row?.product?.unit_measurement}</span>
        },
        {
            header: "Cantidad",
            accessor: "quantity",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = selectedProducts.find((p: any) => p.id === row.id);
                const maxQuantity = row?.quantity || 0;

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantity === 0 ? "" : (selected?.quantity ?? "")}
                            invalid={productErrors[row._id]?.quantity}
                            max={maxQuantity}
                            onChange={(e) => {
                                const newValue = Math.min(Number(e.target.value), maxQuantity);
                                const updatedProducts = selectedProducts.map((p: any) =>
                                    p.id === row.id ? { ...p, quantity: newValue } : p
                                );
                                setSelectedProducts(updatedProducts);

                                if (newValue > 0) {
                                    setProductErrors((prev: any) => {
                                        const newErrors = { ...prev };
                                        if (newErrors[row._id]) {
                                            delete newErrors[row._id].quantity;
                                            if (Object.keys(newErrors[row._id]).length === 0) {
                                                delete newErrors[row._id];
                                            }
                                        }
                                        return newErrors;
                                    });
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="unit-addon"
                        />
                        <span className="input-group-text" id="unit-addon">{row?.product?.unit_measurement}</span>
                    </div>
                );
            },
        },
        {
            header: 'Precio promedio',
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
        },
    ];

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 3) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Por favor, ingrese el ID')
            .test('unique_id', 'Este identificador ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_id_exists/${value}`)
                    return !result?.data.data
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`)
                    return false
                }
            }),
        date: Yup.date().required('Por favor, ingrese la fecha'),
        outcomeType: Yup.string().required('Por favor, seleccione el tipo de salida'),
        description: Yup.string().required('Por favor, ingrese la descripción de la salida')
    })

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleSubwarehouseSelect = (selectedSubwarehouses: any[]) => {
        const selected = selectedSubwarehouses[0];
        if (selected) {
            setSelectedSubwarehouse(selected);
            formik.setFieldValue("warehouseDestiny", selected._id);
        } else {
            setSelectedSubwarehouse(null);
            formik.setFieldValue("warehouseDestiny", "");
        }
    };

    const formik = useFormik({
        initialValues: initialData || {
            code: "",
            date: null,
            products: [],
            totalPrice: 0,
            outcomeType: "",
            status: true,
            warehouseDestiny: "",
            warehouseOrigin: userLogged?.assigment,
            description: ""
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            if (!configContext || !userLogged) return;
            try {
                setSubmitting(true);
                try {
                    let createIncome: boolean = false;
                    if (values.outcomeType === OUTCOME_TYPES.TRANSFER) createIncome = true;

                    await configContext.axiosHelper.create(`${configContext.apiUrl}/outcomes/create_outcome/${createIncome}/${values.outcomeType}`, values);
                    await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                        event: `Registro de salida de inventario ${values.code}`
                    });

                    toggleModal('success')
                } catch (error) {
                    console.error(error, 'Ha ocurrido un error creando la salida')
                    toggleModal('error')
                }
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });


    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const [productsResponse, nextCodeResponse, subwarehousesResponse] = await Promise.all([
                configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${configContext.userLogged.assigment}`),
                configContext?.axiosHelper.get(`${configContext.apiUrl}/outcomes/outcome_next_id`),
                configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_farm_subwarehouses/${userLogged.farm_assigned}`),
            ])

            formik.setFieldValue('code', nextCodeResponse.data.data);
            const productsWithExistences = productsResponse.data.data.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);

            // Filtrar subalmacenes para excluir el actual
            const allSubwarehouses = subwarehousesResponse.data.data;
            const filteredSubwarehouses = allSubwarehouses.filter((s: any) => s._id !== userLogged.assigment);
            const subwarehousesWithId = filteredSubwarehouses.map((s: any) => ({ ...s, id: s._id }));
            setSubwarehouses(subwarehousesWithId);
        } catch (error) {
            console.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('date', new Date());
    }, [])

    useEffect(() => {
        formik.setFieldValue('products', selectedProducts);

        const totalPrice = selectedProducts.reduce((total, product) => {
            return total + (product.quantity * product.price);
        }, 0);

        formik.setFieldValue('totalPrice', totalPrice);
    }, [selectedProducts]);

    useEffect(() => {
        const subwarehouse = subwarehouses.find((s) => s.id === formik.values.warehouseDestiny) || null;
        setSelectedSubwarehouse(subwarehouse)
    }, [formik.values.warehouseDestiny, subwarehouses])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className='form-steps'>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-outcomeData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-outcomeData-tab"
                                disabled
                            >
                                Información de salida
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href="#"
                                id="step-products-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-products-tab"
                                disabled
                            >
                                Selección de productos
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
                    <TabPane id='step-outcomeData-tab' tabId={1}>
                        <div className='d-flex gap-3'>
                            <div className="w-50">
                                <Label htmlFor="codeInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="codeInput"
                                    name="code"
                                    value={formik.values.code}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.code && !!formik.errors.code}
                                />
                                {formik.touched.code && formik.errors.code && <FormFeedback>{formik.errors.code}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="date" className="form-label">Fecha de extracción</Label>
                                <DatePicker
                                    id="date"
                                    className={`form-control ${formik.touched.date && formik.errors.date ? 'is-invalid' : ''}`}
                                    value={formik.values.date ?? undefined}
                                    onChange={(date: Date[]) => {
                                        if (date[0]) formik.setFieldValue('date', date[0]);
                                    }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {formik.touched.date && formik.errors.date && (
                                    <FormFeedback className="d-block">{formik.errors.date as string}</FormFeedback>
                                )}
                            </div>
                        </div>

                        {/* Tipo de salida */}
                        <div className='mt-4'>
                            <Label htmlFor='outcomeTypeInput' className='form-label'>Motivo de Salida</Label>
                            <Input
                                type='select'
                                id='outcomeTypeInput'
                                name='outcomeType'
                                value={formik.values.outcomeType}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.outcomeType && !!formik.errors.outcomeType}
                            >
                                <option value=''>Seleccione un motivo</option>
                                {Object.values(OUTCOME_TYPES).filter(type => type !== OUTCOME_TYPES.SALE).map((type) => (
                                    <option key={type} value={type}>
                                        {getOutcomeTypeLabel(type)}
                                    </option>
                                ))}
                            </Input>
                            {formik.touched.outcomeType && formik.errors.outcomeType && (
                                <FormFeedback>{formik.errors.outcomeType}</FormFeedback>
                            )}
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="descriptionInput" className="form-label">Descripción</Label>
                            <Input
                                type="text"
                                id="descriptionInput"
                                name="description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.description && !!formik.errors.description}
                            />
                            {formik.touched.description && formik.errors.description && <FormFeedback>{formik.errors.description}</FormFeedback>}
                        </div>

                        {formik.values.outcomeType === OUTCOME_TYPES.TRANSFER && (
                            <div>
                                <div className="mt-3">
                                    <Label className="form-label">Subalmacén de destino</Label>
                                    <div className="mt-2 border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(40vh - 100px)', overflowY: 'hidden' }}>
                                        <SelectableTable
                                            data={subwarehouses}
                                            columns={subwarehouseColumns}
                                            selectionMode="single"
                                            showPagination={true}
                                            onSelect={handleSubwarehouseSelect}
                                            rowsPerPage={6}
                                            showSearchAndFilter={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="d-flex mt-4">
                            <Button
                                className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep + 1);
                                }}
                                disabled={
                                    !formik.values.code ||
                                    !formik.values.date ||
                                    !formik.values.outcomeType ||
                                    (formik.values.outcomeType === OUTCOME_TYPES.TRANSFER && !formik.values.warehouseDestiny) ||
                                    !formik.values.description
                                }
                            >
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                Siguiente
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id='step-products-tab' tabId={2}>
                        <div>
                            <div className="mt-3 border border-0 d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(70vh - 100px)', overflowY: 'hidden' }}>
                                <SelectableCustomTable
                                    columns={productColumns}
                                    data={products}
                                    showPagination={true}
                                    rowsPerPage={6}
                                    onSelect={(rows) => {
                                        setSelectedProducts(prev => {
                                            const newRows = rows.map(r => {
                                                const existing = prev.find(p => p.id === r.id);
                                                if (existing) return existing;

                                                return {
                                                    id: r.id,
                                                    quantity: 0,
                                                    price: r.averagePrice || 0,
                                                };
                                            });
                                            return newRows;
                                        });
                                    }}
                                />
                            </div>

                            <div className="d-flex mt-4">
                                <Button
                                    className="btn btn-light btn-label previestab farm-secondary-button"
                                    onClick={() => {
                                        toggleArrowTab(activeStep - 1);
                                    }}
                                >
                                    <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                    Atras
                                </Button>

                                <Button
                                    className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button"
                                    onClick={() => toggleArrowTab(activeStep + 1)}
                                    disabled={
                                        selectedProducts.length === 0 ||
                                        selectedProducts.some(product => !product.quantity || product.quantity <= 0)
                                    }
                                >
                                    <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={3}>
                        <div className='d-flex gap-3 w-100'>
                            <Card className=''>
                                <CardHeader style={{ backgroundColor: '#f0f4f8' }}>
                                    <h5>Información de salida</h5>
                                </CardHeader>
                                <CardBody className="pt-4">
                                    <ObjectDetails
                                        attributes={getOutcomeAttributes(formik.values, selectedSubwarehouse)}
                                        object={{
                                            ...formik.values,
                                            outcomeType: getOutcomeTypeLabel(formik.values.outcomeType),
                                            warehouseDestinyName: selectedSubwarehouse?.name,
                                            warehouseDestinyManager: selectedSubwarehouse?.manager || null
                                        }}
                                    />
                                </CardBody>
                            </Card>

                            <Card className='w-100'>
                                <CardHeader style={{ backgroundColor: '#e8f5e8' }}>
                                    <h5>Productos Seleccionados</h5>
                                </CardHeader>
                                <CardBody className="border border-0 d-flex flex-column flex-grow-1 p-0">
                                    <CustomTable
                                        columns={selectedProductColumns}
                                        data={selectedProducts.map(product => ({
                                            ...product,
                                            productName: (products as any[]).find(p => p.id === product.id)?.product?.name || 'N/A',
                                            code: (products as any[]).find(p => p.id === product.id)?.product?.id || 'N/A',
                                            subtotal: product.quantity * product.price
                                        }))}
                                        showSearchAndFilter={false}
                                        showPagination={false}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className='d-flex mt-4 gap-2'>
                            <Button
                                className="btn btn-light btn-label previestab farm-secondary-button"
                                onClick={() => {
                                    toggleArrowTab(activeStep - 1);
                                }}
                            >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                Atras
                            </Button>

                            <Button className='farm-primary-button ms-auto' type='submit' onClick={() => formik.handleSubmit()} disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner /> : "Guardar"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            {/* Modal de Cancelar */}
            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button className='farm-secondary-button' onClick={onCancel}>Sí, cancelar</Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Salida creada exitosamente"}></SuccessModal>
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message="Ha ocurrido un error creando la salida, intentelo mas tarde" />
        </>
    )
}

export default SubwarehouseOutcomeForm;