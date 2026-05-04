import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { darkenHex } from 'utils/colorUtils';
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
import { getEffectiveUser } from "helpers/impersonation_helper";
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

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSave, onCancel }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();
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

    const selectedProductColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', isFilterable: false, type: 'text' },
        { header: t('warehouse.orderDetails.col.product', { defaultValue: 'Producto' }), accessor: 'productName', isFilterable: false, type: 'text' },
        {
            header: t('warehouse.orderDetails.col.requested', { defaultValue: 'Cantidad Solicitada' }),
            accessor: 'quantity',
            isFilterable: false,
            type: 'number',
            bgColor: '#e3f2fd',
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        {
            header: t('warehouse.orderDetails.col.avgPrice', { defaultValue: 'Precio Promedio' }),
            accessor: 'price',
            isFilterable: false,
            type: 'currency',
            bgColor: '#f3e5f5'
        },
        {
            header: t('common.field.totalPrice', { defaultValue: 'Precio Total' }),
            accessor: 'totalPrice',
            isFilterable: false,
            type: 'currency',
            bgColor: '#e8f5e8'
        },
        {
            header: t('warehouse.orderDetails.col.observations', { defaultValue: 'Observaciones' }),
            accessor: 'observations',
            isFilterable: false,
            type: 'text',
            bgColor: '#fff3e0',
            render: (_, row) => row.observations === '' ? <span className="text-muted">{t('warehouse.orderDetails.col.noObservations', { defaultValue: 'Sin observaciones' })}</span> : <span>{row.observations}</span>
        },
    ];

    const productColumns: Column<any>[] = [
        {
            header: t('common.field.code'),
            accessor: 'id',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row?.product?.id}</span>
        },
        {
            header: t('warehouse.orderDetails.col.product', { defaultValue: 'Producto' }),
            accessor: 'name',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{row?.product?.name}</span>
        },
        {
            header: t('warehouse.orderDetails.col.availableQty', { defaultValue: 'Cantidad disponible' }),
            accessor: 'quantity',
            isFilterable: true,
            type: 'number',
            render: (value, row) => <span>{row?.quantity} {row?.product?.unit_measurement}</span>
        },
        {
            header: t('warehouse.orderDetails.col.requested', { defaultValue: 'Cantidad solicitada' }),
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
            header: t('warehouse.orderDetails.col.observations', { defaultValue: 'Observaciones' }),
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
                        placeholder={t('warehouse.orderDetails.col.observationsPlaceholder', { defaultValue: 'Observaciones...' })}
                    />
                );
            },
        },
        {
            header: t('warehouse.orderDetails.col.avgPrice', { defaultValue: 'Precio promedio' }),
            accessor: 'averagePrice',
            isFilterable: true,
            type: 'currency',
        },
        {
            header: t('warehouse.purchaseOrders.col.category', { defaultValue: 'Categoría' }),
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value, row) => {
                let color = "secondary";
                const category = row?.product?.category;

                switch (category) {
                    case "nutrition": color = "info"; break;
                    case "medications": color = "warning"; break;
                    case "vaccines": color = "primary"; break;
                    case "vitamins":
                    case "minerals":
                    case "supplies":
                    case "hygiene_cleaning":
                    case "equipment_tools":
                    case "spare_parts":
                    case "office_supplies":
                    case "others":
                        color = "success"; break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${category}`, { defaultValue: category })}</Badge>;
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
        { key: 'id', label: t('warehouse.orders.col.orderNumber', { defaultValue: 'No. de Pedido' }), type: 'text' },
        { key: 'date', label: t('warehouse.orders.col.orderDate', { defaultValue: 'Fecha de pedido' }), type: 'date' },
        {
            key: 'user',
            label: t('warehouse.orders.col.orderedBy', { defaultValue: 'Pedido por' }),
            type: 'text',
            render: (value) => <span>{userLogged.name} {userLogged.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: t('warehouse.orders.col.orderFor', { defaultValue: 'Pedido para' }),
            type: 'text',
            render: (value) => <span>{orderOrigin}</span>
        },
        {
            key: 'orderDestiny',
            label: t('warehouse.orders.col.orderTo', { defaultValue: 'Pedido hacia' }),
            type: 'text',
            render: (value) => <span>{orderDestiny}</span>
        },
    ]

    const validationSchema = Yup.object({
        id: Yup.string()
            .required(t('warehouse.orderDetails.validation.idRequired', { defaultValue: 'Por favor, ingrese el ID' }))
            .test('unique_id', t('warehouse.orderDetails.validation.idExists', { defaultValue: 'Este identificador ya existe, por favor ingrese otro' }), async (value) => {
                if (!value) return false
                try {
                    const result = await configContext?.axiosHelper.get(`${configContext.apiUrl}/orders/order_id_exists/${value}`)
                    return !result?.data.data
                } catch (error) {
                    console.error(`Error al validar el ID: ${error}`)
                    return false
                }
            }),
        date: Yup.string().required(t('warehouse.orderDetails.validation.dateRequired', { defaultValue: 'Por favor, ingrese la fecha' })),
        user: Yup.string().required(t('warehouse.orderDetails.validation.userRequired', { defaultValue: 'Por favor, seleccione el tipo de salida' })),
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
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.orderDetails.validation.fillAll', { defaultValue: 'Por favor ingrese todos los datos' }) })
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
                                {t('warehouse.orderDetails.step.orderInfo', { defaultValue: 'Información de pedido' })}
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
                                {t('warehouse.orderDetails.step.productSelection', { defaultValue: 'Selección de productos' })}
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
                                {t('warehouse.orderDetails.step.summary', { defaultValue: 'Resumen' })}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id='step-orderData-tab' tabId={1}>
                        <div className='d-flex gap-3'>
                            <div className="w-50">
                                <Label htmlFor="idInput" className="form-label">{t('warehouse.orders.col.orderNumber', { defaultValue: 'Identificador' })}</Label>
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
                                <Label htmlFor="dateInput" className="form-label">{t('common.field.date')}</Label>
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
                        <Card className="mt-4" style={{ backgroundColor: bg('#f8f9fa'), border: '1px solid #dee2e6' }}>
                            <CardBody>
                                <h6 className="mb-3 text-muted">{t('warehouse.orderDetails.attr.orderInfo', { defaultValue: 'Información del Pedido' })}</h6>

                                <div className="mb-3">
                                    <div className="d-flex align-items-center">
                                        <i className="ri-user-line fs-18 text-primary me-2"></i>
                                        <div>
                                            <small className="text-muted d-block">{t('warehouse.orders.col.orderedBy', { defaultValue: 'Solicitado por' })}</small>
                                            <span className="fw-medium">{userLogged?.name} {userLogged?.lastname}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center">
                                            <i className="ri-store-2-line fs-18 text-success me-2"></i>
                                            <div>
                                                <small className="text-muted d-block">{t('warehouse.orderDetails.attr.originWarehouse', { defaultValue: 'Almacén de origen' })}</small>
                                                <span className="fw-medium">{orderOrigin || t('common.status.loading', { defaultValue: 'Cargando...' })}</span>
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
                                                <small className="text-muted d-block">{t('warehouse.orderDetails.attr.destWarehouse', { defaultValue: 'Subalmacén destino' })}</small>
                                                <span className="fw-medium">{orderDestiny || t('common.status.loading', { defaultValue: 'Cargando...' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        <div className="d-flex mt-4">
                            <Button className="btn btn-success btn-label right ms-auto nexttab nexttab ms-auto farm-secondary-button" onClick={() => checkOrderData()}>
                                <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                {t('common.button.next', { defaultValue: 'Siguiente' })}
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
                                    {t('common.button.back', { defaultValue: 'Atras' })}
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
                                    {t('common.button.next', { defaultValue: 'Siguiente' })}
                                </Button>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane id='step-summary-tab' tabId={3}>
                        <div className='d-flex gap-3 w-100'>
                            <Card className=''>
                                <CardHeader style={{ backgroundColor: bg('#f0f4f8') }}>
                                    <h5>{t('warehouse.orderDetails.attr.orderInfo', { defaultValue: 'Información del pedido' })}</h5>
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
                                <CardHeader style={{ backgroundColor: bg('#e8f5e8') }}>
                                    <h5>{t('warehouse.orderDetails.attr.selectedProducts', { defaultValue: 'Productos seleccionados' })}</h5>
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
                                {t('common.button.back', { defaultValue: 'Atras' })}
                            </Button>

                            <Button className='farm-primary-button ms-auto' type='submit' disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner /> : t('common.button.save')}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form >


            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>{t('common.button.confirm')}</ModalHeader>
                <ModalBody>{t('warehouse.orderDetails.confirm.cancel', { defaultValue: '¿Estás seguro de que deseas cancelar? Los datos no se guardarán.' })}</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>{t('warehouse.orderDetails.confirm.yes', { defaultValue: 'Sí, cancelar' })}</Button>
                    <Button color="success" onClick={() => toggleModal('cancel', false)}>{t('warehouse.orderDetails.confirm.no', { defaultValue: 'No, continuar' })}</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('warehouse.orderDetails.success.created', { defaultValue: 'Pedido creado con exito' })} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('warehouse.orderDetails.error.service', { defaultValue: 'El servicio no esta disponible, intentelo mas tarde' })} />
        </>
    )
}

export default OrderForm
