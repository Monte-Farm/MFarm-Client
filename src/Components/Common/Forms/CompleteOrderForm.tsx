import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup'
import { useFormik } from 'formik';
import { Attribute, OrderData } from 'common/data_interfaces';
import { ConfigContext } from 'App';
import ObjectDetailsHorizontal from '../Details/ObjectDetailsHorizontal';
import OrderTable from '../Tables/OrderTable';
import LoadingAnimation from '../Shared/LoadingAnimation';
import ObjectDetails from '../Details/ObjectDetails';
import CustomTable from '../Tables/CustomTable';
import AlertMessage from '../Shared/AlertMesagge';
import classnames from "classnames";
import DatePicker from 'react-flatpickr';
import { getLoggedinUser } from 'helpers/api_helper';
import SuccessModal from '../Shared/SuccessModal';
import ErrorModal from '../Shared/ErrorModal';

interface OrderFormProps {
    orderId: string;
    onSave: () => void;
    onCancel: () => void;
}

const CompleteOrderForm: React.FC<OrderFormProps> = ({ orderId, onSave, onCancel }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ cancel: false, success: false, error: false });
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [orderDetails, setOrderDetails] = useState<any>({})
    const [productsRequested, setProductsRequested] = useState([])
    const [loading, setLoading] = useState<boolean>(true);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const orderAttributes: Attribute[] = [
        { key: 'id', label: 'No. de Pedido', type: 'text' },
        { key: 'date', label: 'Fecha de pedido', type: 'date' },
        {
            key: 'user',
            label: 'Pedido por',
            type: 'text',
            render: (value, object) => <span>{object?.user?.name} {object?.user?.lastname}</span>
        },
        {
            key: 'orderOrigin',
            label: 'Pedido para',
            type: 'text',
            render: (value, object) => <span>{object?.orderOrigin?.name}</span>
        },
        {
            key: 'orderDestiny',
            label: 'Pedido hacia',
            type: 'text',
            render: (value, object) => <span>{object?.orderDestiny?.name}</span>
        },
    ]

    const formik = useFormik({
        initialValues: {
            date: null,
            user: userLogged?._id,
            productsDelivered: []
        },
        enableReinitialize: true,
        validateOnBlur: false,
        validateOnChange: true,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                if (!configContext || !userLogged) return
                setSubmitting(true);

                const completedOrder = await configContext.axiosHelper.create(`${configContext.apiUrl}/orders/complete_order/${orderId}`, values)
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Pedido ${orderDetails.code} completado`
                });

                toggleModal('success');
            } catch (error) {
                console.error("Error al enviar el formulario:", error);
                toggleModal('error');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fetchData = async () => {
        if (!configContext || !userLogged) return

        try {
            setLoading(true)

            const orderResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/orders/find_id/${orderId}`);
            const orderDetailsResponse = orderResponse.data.data;
            setOrderDetails(orderDetailsResponse)

            const productsResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array/`, orderDetailsResponse.productsRequested);
            setProductsRequested(productsResponse.data.data);
        } catch (error) {
            console.error('Error fetching data:', { error })
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('date', new Date())
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                <div className='d-flex gap-3 mb-4'>
                    <div className="w-50">
                        <Label htmlFor="userInput" className="form-label">Responsable</Label>
                        <Input
                            type="text"
                            id="userInput"
                            name="userDisplay"
                            value={`${userLogged?.name} ${userLogged?.lastname}` || ''}
                            disabled
                        />
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

                <Label htmlFor="dateInput" className="form-label">Productos entregados</Label>
                <OrderTable data={productsRequested} onProductEdit={(updatedProducts) => formik.setFieldValue('productsDelivered', updatedProducts)} />

                <div className="d-flex mt-4 gap-2 justify-content-end">
                    <Button className='btn-danger' type='button' onClick={() => toggleModal('cancel')}>
                        Cancelar
                    </Button>

                    <Button className='btn-success' type='submit' disabled={formik.isSubmitting}>
                        {formik.isSubmitting ? <Spinner />
                            : (
                                <>
                                    <i className='ri-check-line me-2' />
                                    Completar
                                </>
                            )
                        }
                    </Button>
                </div>
            </form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación</ModalHeader>
                <ModalBody>¿Estás seguro de que deseas cancelar? Los datos no se guardarán.</ModalBody>
                <ModalFooter>
                    <Button className='farm-secondary-button' onClick={onCancel}>Sí, cancelar</Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>No, continuar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={'Pedido completado con exito'} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={'El servicio no esta disponible, intentelo mas tarde'} />
        </>
    )
}

export default CompleteOrderForm