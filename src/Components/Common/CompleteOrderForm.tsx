import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap';
import * as Yup from 'yup'
import Flatpickr from 'react-flatpickr';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { OrderData } from 'common/data_interfaces';
import OrderTable from './OrderTable';
import { ConfigContext } from 'App';
import ObjectDetailsHorizontal from './ObjectDetailsHorizontal';

interface OrderFormProps {
    initialData?: OrderData;
    onSubmit: (data: OrderData) => Promise<void>
    onCancel: () => void;
}

const orderAttributes = [
    { key: 'id', label: 'No. de Pedido' },
    { key: 'date', label: 'Fecha de Pedido' },
    { key: 'user', label: 'Usuario' },
    { key: 'orderDestiny', label: 'Almacén' },
]

const validationSchema = Yup.object({
    id: Yup.string().required('Por favor, ingrese el ID'),
    date: Yup.string().required('Por favor, ingrese la fecha'),
    user: Yup.string().required('Por favor, seleccione el tipo de salida'),
})

const CompleteOrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const history = useNavigate()

    const [modals, setModals] = useState({ createWarehouse: false, cancel: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderDisplay, setOrderDisplay] = useState<OrderData | undefined>(undefined)
    const [products, setProducts] = useState([])
    const configContext = useContext(ConfigContext);

    const formik = useFormik({
        initialValues: initialData || {
            id: "",
            date: "",
            user: "",
            productsRequested: [],
            status: 'completed',
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

    const handleFetchOrderProducts = async () => {
        try {
            if (!configContext || !initialData) return;

            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, initialData.productsRequested);

            const products = response.data.data;
            formik.setFieldValue('productsDelivered', initialData.productsRequested)
            setProducts(products);
        } catch (error) {
            console.error(error);
            history("/auth-500");
        }
    };

    const fetchDisplayInfo = async () => {
        if (!initialData || !configContext) return;

        try {
            const [userResponse, destinyResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_id/${initialData.user}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${initialData.orderDestiny}`)
            ])

            setOrderDisplay({
                ...initialData,
                user: `${userResponse.data.data.name} ${userResponse.data.data.lastname}`,
                orderDestiny: destinyResponse.data.data.name
            })
        } catch (error) {
            console.error('Error al obtener los detalles del pedido', error);
        }
    }


    useEffect(() => {
        fetchDisplayInfo();
        handleFetchOrderProducts();
    }, [initialData])


    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>
                <div className=''>

                    <h5 className="me-auto">Detalles del Pedido</h5>
                    <div className="border"></div>
                    <div className='mt-3 w-100 h-100 rounded border bg-secondary-subtle pt-3 pb-2 ps-3'>
                        {orderDisplay && <ObjectDetailsHorizontal attributes={orderAttributes} object={orderDisplay} />}
                    </div>
                </div>


                {/* Productos */}
                <div className="d-flex mt-4">
                    <h5 className="me-auto">Productos solicitados</h5>
                </div>
                <div className="border"></div>

                <div className="mt-4">
                    <h5>Productos solicitados</h5>
                    <OrderTable
                        data={products}
                        productsDelivered={formik.values.productsDelivered}
                        onProductEdit={(updatedProducts) => formik.setFieldValue("productsDelivered", updatedProducts)}
                    />

                </div>

                <div className='d-flex justify-content-end mt-5 gap-2'>
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
                    <Button className='farm-secondary-button' onClick={onCancel}>Sí, cancelar</Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
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

export default CompleteOrderForm