import { getLoggedinUser } from 'helpers/api_helper';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap';
import * as Yup from 'yup'
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import SelectTable from './SelectTable';
import { OrderData } from 'common/data_interfaces';
import { ConfigContext } from 'App';

interface OrderFormProps {
    initialData?: OrderData;
    onSubmit: (data: OrderData) => Promise<void>
    onCancel: () => void;
}


const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, onCancel }) => {

    const history = useNavigate()
    const [modals, setModals] = useState({ createWarehouse: false, cancel: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderOrigin, setOrderOrigin] = useState<string>('')
    const [orderDestiny, setOrderDestiny] = useState<string>('')
    const configContext = useContext(ConfigContext)
    const [products, setProducts] = useState([])

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
            date: "",
            user: "",
            productsRequested: [],
            status: 'pending',
            orderOrigin: "AG001",
            orderDestiny: "",
            productsDelivered: []
        },
        enableReinitialize: true,
        validateOnBlur: false,
        validateOnChange: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                setSubmitting(true);
                await onSubmit(values);
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        showAlert('danger', message);
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleProductSelect = (selectedProducts: Array<{ id: string; quantity: number; price: number }>) => {
        formik.setFieldValue("productsRequested", selectedProducts);
    };

    const handleFetchWarehouseProducts = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/AG001`);
            const products = response.data.data;

            const productsWithExistences = products.filter((obj: any) => obj.quantity !== 0);

            setProducts(productsWithExistences);
        } catch (error) {
            console.error(error);
            history("/auth-500");
        }
    };


    const fetchOrderOrigin = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${formik.values.orderOrigin}`);
            const orderOrigin = response.data.data.name;

            setOrderOrigin(orderOrigin);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el origen de la orden');
        }
    };


    const fetchOrderDestiny = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${configContext.userLogged.assigment}`);
            const orderDestiny = response.data.data;

            setOrderDestiny(orderDestiny.name);
            formik.setFieldValue('orderDestiny', orderDestiny.id);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el destino de la orden');
        }
    };


    const fetchNextId = async () => {
        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/order_next_id`);
            const nextId = response.data.data;
            formik.setFieldValue('id', nextId);
        } catch (error) {
            console.error('Ha ocurrido un error al obtener el id');
        }
    };

    useEffect(() => {
        handleFetchWarehouseProducts();
        fetchOrderOrigin();
        fetchOrderDestiny();
        fetchNextId();

        const today = new Date().toLocaleDateString('es-ES')
        formik.setFieldValue('date', today)

        if (configContext?.userLogged) {
            formik.setFieldValue('user', configContext.userLogged.username)
        }
    }, [])


    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
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

                        <Flatpickr
                            id="dateInput"
                            className="form-control"
                            value={formik.values.date}
                            options={{
                                dateFormat: "d-m-Y",
                                defaultDate: formik.values.date,
                            }}
                            onChange={(date) => {
                                const formattedDate = date[0].toLocaleDateString("es-ES");
                                formik.setFieldValue("date", formattedDate);
                            }}
                        />
                        {formik.touched.date && formik.errors.date && <FormFeedback className="d-block">{formik.errors.date}</FormFeedback>}

                    </div>
                </div>

                <div className="mt-4">
                    <Label htmlFor="userInput" className="form-label">¿Quién hace el pedido?</Label>
                    <Input
                        type="text"
                        id="userInput"
                        name="userDisplay"
                        value={`${configContext?.userLogged?.name} ${configContext?.userLogged?.lastname}` || ''}
                        disabled
                    />
                    <Input type="hidden" name="user" value={formik.values.user} />
                    {formik.touched.user && formik.errors.user && (
                        <FormFeedback>{formik.errors.user}</FormFeedback>
                    )}
                </div>

                <div className='d-flex gap-3 mt-4'>
                    <div className='w-50'>
                        <Label>Pedido desde:</Label>
                        <Input
                            type="text"
                            id="orderOriginInput"
                            name="orderOrigin"
                            value={orderOrigin || ''}
                            disabled
                        />
                        <Input type="hidden" name="orderOrigin" value={formik.values.orderOrigin} />
                        {formik.touched.orderOrigin && formik.errors.orderOrigin && (
                            <FormFeedback>{formik.errors.orderOrigin}</FormFeedback>
                        )}
                    </div>

                    <div className='position-relative mt-3'>
                        <i className=' ri-arrow-right-line position-absolute top-50 start-50 translate-middle'></i>
                    </div>

                    <div className='w-50'>
                        <Label>Pedido para:</Label>
                        <Input
                            type="text"
                            id="orderDestinyInput"
                            name="orderDestiny"
                            value={orderDestiny || ''}
                            disabled
                        />
                        <Input type="hidden" name="orderDestiny" value={formik.values.orderDestiny} />
                        {formik.touched.orderDestiny && formik.errors.orderDestiny && (
                            <FormFeedback>{formik.errors.orderDestiny}</FormFeedback>
                        )}
                    </div>
                </div>


                {/* Productos */}
                <div className="d-flex mt-5">
                    <h5 className="me-auto">Productos</h5>
                </div>
                <div className="border"></div>

                <div className="mt-3 border border-0">
                    <SelectTable data={products} onProductSelect={handleProductSelect} showStock={true}></SelectTable>
                </div>

                <div className='d-flex justify-content-end mt-4 gap-2'>
                    <Button className='farm-secondary-button' disabled={formik.isSubmitting} onClick={() => toggleModal('cancel')}>
                        Cancelar
                    </Button>

                    <Button className='farm-primary-button' type='submit' disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner /> : "Guardar"}
                    </Button>
                </div>
            </form>

            {/* Modal de Cancelar */}
            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={onCancel}>Sí, cancelar</Button>
                    <Button color="success" onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            {/* Alerta */}
            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </>
    )
}

export default OrderForm