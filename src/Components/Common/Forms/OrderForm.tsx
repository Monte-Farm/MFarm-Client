import { useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Attribute, OrderData, ProductData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import classnames from "classnames";
import ObjectDetailsHorizontal from '../Details/ObjectDetailsHorizontal';
import { Column } from 'common/data/data_types';
import DatePicker from 'react-flatpickr';
import SelectableTable from '../Tables/SelectableTable';
import SelectableCustomTable from '../Tables/SelectableTable';
import CustomTable from '../Tables/CustomTable';
import { getLoggedinUser } from 'helpers/api_helper';
import LoadingAnimation from '../Shared/LoadingAnimation';
import AlertMessage from '../Shared/AlertMesagge';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';
import ObjectDetails from '../Details/ObjectDetails';


interface OrderFormProps {
    initialData?: OrderData;
    onSave: () => void;
    onCancel: () => void;
}

const selectedProductColumns: Column<any>[] = [
    { header: 'Código', accessor: 'code', isFilterable: false, type: 'text' },
    { header: 'Producto', accessor: 'productName', isFilterable: false, type: 'text' },
    { 
        header: 'Cantidad Solicitada', 
        accessor: 'quantity', 
        isFilterable: false, 
        type: 'number', 
        bgColor: '#e3f2fd',
        render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
    },
    { 
        header: 'Precio Promedio', 
        accessor: 'price', 
        isFilterable: false, 
        type: 'currency', 
        bgColor: '#f3e5f5' 
    },
    { 
        header: 'Precio Total', 
        accessor: 'totalPrice', 
        isFilterable: false, 
        type: 'currency', 
        bgColor: '#e8f5e8' 
    },
    {
        header: 'Observaciones',
        accessor: 'observations',
        isFilterable: false,
        type: 'text',
        bgColor: '#fff3e0',
        render: (_, row) => row.observations === '' ? <span className="text-muted">Sin observaciones</span> : <span>{row.observations}</span>
    },
]

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext)
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false, success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderOrigin, setOrderOrigin] = useState<string>('')
    const [orderDestiny, setOrderDestiny] = useState<string>('')
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])
    const [productErrors, setProductErrors] = useState<Record<string, any>>({})
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
            header: "Cantidad solicitada",
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
            header: "Observaciones",
            accessor: "observations",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = selectedProducts.find((p: any) => p.id === row.id);

                return (
                    <Input
                        type="text"
                        disabled={!isSelected}
                        value={selected?.observations ?? ""}
                        onChange={(e) => {
                            const updatedProducts = selectedProducts.map((p: any) =>
                                p.id === row.id ? { ...p, observations: e.target.value } : p
                            );
                            setSelectedProducts(updatedProducts);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Observaciones..."
                    />
                );
            },
        },
        {
            header: 'Precio promedio',
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
        },
        {
            header: 'Categoría',
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value, row) => {
                let color = "secondary";
                let label = row?.product?.category;

                switch (row?.product?.category) {
                    case "nutrition":
                        color = "info";
                        label = "Nutrición";
                        break;
                    case "medications":
                        color = "warning";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
                        break;
                    case "vitamins":
                        color = "success";
                        label = "Vitaminas";
                        break;
                    case "minerals":
                        color = "success";
                        label = "Minerales";
                        break;
                    case "supplies":
                        color = "success";
                        label = "Insumos";
                        break;
                    case "hygiene_cleaning":
                        color = "success";
                        label = "Higiene y desinfección";
                        break;
                    case "equipment_tools":
                        color = "success";
                        label = "Equipamiento y herramientas";
                        break;
                    case "spare_parts":
                        color = "success";
                        label = "Refacciones y repuestos";
                        break;
                    case "office_supplies":
                        color = "success";
                        label = "Material de oficina";
                        break;
                    case "others":
                        color = "success";
                        label = "Otros";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
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

    const orderAttributes: Attribute[] = [
        { key: 'id', label: 'No. de Pedido', type: 'text' },
        { key: 'date', label: 'Fecha de pedido', type: 'date' },
        {
            key: 'user',
            label: 'Pedido por',
            type: 'text',
            render: (value) => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: 'Pedido para',
            type: 'text',
            render: (value) => <span>{orderOrigin}</span>
        },
        {
            key: 'orderDestiny',
            label: 'Pedido hacia',
            type: 'text',
            render: (value) => <span>{orderDestiny}</span>
        },
    ]

    const validationSchema = Yup.object({
        id: Yup.string()
            .required('Por favor, ingrese el ID')
            .test('unique_id', 'Este identificador ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/orders/order_id_exists/${value}`)
                    return !result?.data.data
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`)
                    return false
                }
            }),
        date: Yup.string().required('Por favor, ingrese la fecha'),
        user: Yup.string().required('Por favor, seleccione el tipo de salida'),
    })

    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            date: null,
            user: userLogged._id,
            productsRequested: [],
            status: 'pending',
            orderOrigin: "",
            orderDestiny: "",
            productsDelivered: []
        },
        enableReinitialize: true,
        validateOnBlur: false,
        validateOnChange: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!configContext || !userLogged) return
                setSubmitting(true);

                await configContext.axiosHelper.create(`${configContext.apiUrl}/orders/create_order`, values);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Pedido ${values.id} creado`
                });

                toggleModal('success')
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
                toggleModal('error');
            } finally {
                setSubmitting(false);
            }
        },
    });


    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)

            const [nextIdResponse, farmResponse, orderDestinyResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/orders/order_next_id`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${userLogged.farm_assigned}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${userLogged.assigment}`),
            ])

            formik.setFieldValue('id', nextIdResponse.data.data);
            const main_warehouse = farmResponse.data.data.main_warehouse;

            setOrderDestiny(orderDestinyResponse.data.data.name);
            formik.setFieldValue('orderDestiny', orderDestinyResponse.data.data._id);

            const [orderOriginResponse, productsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${main_warehouse}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${main_warehouse}`),
            ])

            const productsWithExistences = productsResponse.data.data.filter((obj: any) => obj.quantity !== 0);
            setProducts(productsWithExistences);

            setOrderOrigin(orderOriginResponse.data.data.name);
            formik.setFieldValue('orderOrigin', orderOriginResponse.data.data._id);
        } catch (error) {
            console.error('Error fetching data:', { error });
            toggleModal('error');
        } finally {
            setLoading(false)
        }
    }

    const checkOrderData = async () => {
        formik.setTouched({
            id: true,
            date: true,
        });

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(2);
        } catch (err) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor ingrese todos los datos' })
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('date', new Date())
    }, [])

    useEffect(() => {
        const productsWithTotal = selectedProducts.map(product => ({
            ...product,
            totalPrice: product.quantity * product.price
        }));
        formik.setFieldValue('productsRequested', productsWithTotal);
    }, [selectedProducts]);

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
                                id="step-orderData-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-orderData-tab"
                                disabled
                            >
                                Información de pedido
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
                    <TabPane id='step-orderData-tab' tabId={1}>
                        <div className='d-flex gap-3'>
                            <div className="w-50">
                                <Label htmlFor="idInput" className="form-label">Identificador</Label>
                                <Input
                                    type="text"
                                    id="idInput"
                                    name="id"
                                    value={formik.values.id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    invalid={formik.touched.id && !!formik.errors.id}
                                />
                                {formik.touched.id && formik.errors.id && <FormFeedback>{formik.errors.id}</FormFeedback>}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="dateInput" className="form-label">Fecha</Label>
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

                        {/* Información del Pedido */}
                        <Card className="mt-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                            <CardBody>
                                <h6 className="mb-3 text-muted">Información del Pedido</h6>
                                
                                <div className="mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="ri-user-line fs-18 text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">Solicitado por</small>
                                            <span className="fw-medium">{userLogged?.name} {userLogged?.lastname}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center">
                                            <i className="ri-store-2-line fs-18 text-success me-2"></i>
                                            <div>
                                                <small className="text-muted d-block">Almacén de origen</small>
                                                <span className="fw-medium">{orderOrigin || 'Cargando...'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center">
                                        <i className="ri-arrow-right-line fs-20 text-muted"></i>
                                    </div>

                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center">
                                            <i className="ri-building-line fs-18 text-info me-2"></i>
                                            <div>
                                                <small className="text-muted d-block">Subalmacén destino</small>
                                                <span className="fw-medium">{orderDestiny || 'Cargando...'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <div className="d-flex mt-4">
                            <Button className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button" onClick={() => checkOrderData()}>
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
                                                    observations: '',
                                                };
                                            });
                                            return newRows;
                                        });
                                    }}
                                />
                            </div>

                            <div className="d-flex mt-4">
                                <Button className="btn btn-light btn-label previestab farm-secondary-button" onClick={() => toggleArrowTab(activeStep - 1)}>
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
                                    <h5>Información del pedido</h5>
                                </CardHeader>
                                <CardBody className="pt-4">
                                    <ObjectDetails 
                                        attributes={orderAttributes} 
                                        object={{
                                            ...formik.values,
                                            orderOrigin: orderOrigin,
                                            orderDestiny: orderDestiny
                                        }} 
                                    />
                                </CardBody>
                            </Card>

                            <Card className='w-100'>
                                <CardHeader style={{ backgroundColor: '#e8f5e8' }}>
                                    <h5>Productos seleccionados</h5>
                                </CardHeader>
                                <CardBody className="border border-0 d-flex flex-column flex-grow-1 p-0">
                                    <CustomTable 
                                        columns={selectedProductColumns} 
                                        data={selectedProducts.map(product => ({
                                            ...product,
                                            productName: (products as any[]).find(p => p.id === product.id)?.product?.name || 'N/A',
                                            code: (products as any[]).find(p => p.id === product.id)?.product?.id || 'N/A',
                                            unit_measurement: (products as any[]).find(p => p.id === product.id)?.product?.unit_measurement || '',
                                            totalPrice: product.quantity * product.price
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

                            <Button className='farm-primary-button ms-auto' type='submit' disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner /> : "Guardar"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form >


            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={'Pedido creado con exito'} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={'El servicio no esta disponible, intentelo mas tarde'} />
        </>
    )
}

export default OrderForm