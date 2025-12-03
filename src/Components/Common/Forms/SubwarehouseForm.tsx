import { ConfigContext } from 'App';
import { Attribute, SubwarehouseData } from 'common/data_interfaces';
import { useFormik } from 'formik';
import { getLoggedinUser } from 'helpers/api_helper';
import { useContext, useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup';
import SuccessModal from '../Shared/SuccessModal';
import LoadingAnimation from '../Shared/LoadingAnimation';
import ErrorModal from '../Shared/ErrorModal';
import classnames from "classnames";
import SelectableTable from '../Tables/SelectableTable';
import { Column } from 'common/data/data_types';
import { roleLabels } from 'common/role_labels';
import { userRoles } from 'common/user_roles';
import AlertMessage from '../Shared/AlertMesagge';
import ObjectDetails from '../Details/ObjectDetails';
import defaultImageProfila from '../../../assets/images/default-profile-mage.jpg'

interface SubwarehouseFormProps {
    onSave: () => void;
    onCancel: () => void;
    isCodeDisabled?: boolean
}

const roleLabelsMap: Record<string, string> = Object.fromEntries(
    userRoles.map(r => [r.value, r.label])
);

const roleColorsMap: Record<string, string> = {
    Superadmin: "danger",
    farm_manager: "primary",
    warehouse_manager: "warning",
    subwarehouse_manager: "secondary",
    general_worker: "success",
    reproduction_technician: "info",
    veterinarian: "dark",
};


const SubwarehouseForm: React.FC<SubwarehouseFormProps> = ({ onSave, onCancel, isCodeDisabled }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false, cancel: false });
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [selectedUser, setSelectedUser] = useState<any>()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const usersColumns: Column<any>[] = [
        { header: 'Usuario', accessor: 'username', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        { header: 'Apellido', accessor: 'lastname', isFilterable: true, type: 'text' },
        {
            header: 'Rol',
            accessor: 'role',
            isFilterable: true,
            render: (value: string | string[] | undefined) => {
                const roles = Array.isArray(value)
                    ? value
                    : value
                        ? [value]
                        : [];

                if (!roles.length) return <span className="text-muted">—</span>;

                return (
                    <div className="d-flex flex-wrap gap-2">
                        {roles.map((r: string) => {
                            const label = roleLabelsMap[r] || r;
                            const color = roleColorsMap[r] || "secondary";

                            return (
                                <Badge key={r} color={color} pill>
                                    {label}
                                </Badge>
                            );
                        })}
                    </div>
                );
            },
        },
        {
            header: 'Estado',
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
    ];

    const userAttributes: Attribute[] = [
        { key: 'username', label: 'Usuario', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'lastname', label: 'Apellido', type: 'text' },
        {
            key: 'role',
            label: 'Rol',
            type: 'text',
            render: (value: string | string[] | undefined) => {
                const roles = Array.isArray(value)
                    ? value
                    : value
                        ? [value]
                        : [];

                if (!roles.length) return <span className="text-muted">—</span>;

                return (
                    <div className="d-flex flex-wrap gap-2">
                        {roles.map((r: string) => {
                            const label = roleLabelsMap[r] || r;
                            const color = roleColorsMap[r] || "secondary";

                            return (
                                <Badge key={r} color={color} pill>
                                    {label}
                                </Badge>
                            );
                        })}
                    </div>
                );
            },
        },
    ]

    const subwarehouseAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'Nombre', type: 'text' },
        { key: 'location', label: 'Ubicacion', type: 'text' },

    ]

    const validationSchema = Yup.object({
        code: Yup.string()
            .required('Por favor, ingrese el código')
            .test('unique_id', 'Este identificador ya existe, por favor ingrese otro', async (value) => {
                if (!value) return false
                try {
                    const response = await configContext?.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_id_exists/${value}`);
                    return !response?.data.data
                } catch (error) {
                    console.error(`Error al verificar el id: ${error}`)
                    return false
                }
            }),
        name: Yup.string().required('Por favor, ingrese el nombre'),
        location: Yup.string().required('Por favor, ingrese la ubicación'),
        manager: Yup.string().required('Por favor, seleccione el responsable')
    })

    const formik = useFormik<any>({
        initialValues: {
            code: '',
            name: '',
            location: '',
            manager: '',
            status: true,
            products: [],
            incomes: [],
            outcomes: [],
            isSubwarehouse: true,
            farm: userLogged.farm_assigned
        },
        enableReinitialize: true,
        validateOnChange: false,
        validateOnBlur: true,
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext || !userLogged) return;
            try {
                setSubmitting(true);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/warehouse/create_warehouse`, formik.values);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Subalmacen ${formik.values.code} creado`
                });

                toggleModal('success')
            } catch (error) {
                console.error(`Error saving data: ${error}`)
                toggleModal('error')
            } finally {
                setSubmitting(false)
            }
        }
    })

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true)
            const [nextIdResponse, usersResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_next_id`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/subwarehouse_manager`),
            ])

            formik.setFieldValue('code', nextIdResponse.data.data);
            const filteredUsers = usersResponse.data.data.filter((u: any) => u.assigment === null);
            const usersWithId = filteredUsers.map((b: any) => ({ ...b, id: b._id }));
            setUsers(usersWithId);
        } catch (error) {
            console.error('Error fetching data: ', { error })
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    const changeSelectedUser = (user: any) => {
        if (user) {
            setSelectedUser(user)
            formik.setFieldValue('manager', user._id)
        }
    }

    const checkSelectedManager = () => {
        if (!selectedUser || formik.values.manager === '') {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor seleccione un usuario' })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    const checkSubwarehouseData = async () => {
        formik.setTouched({
            code: true,
            name: true,
            location: true
        })

        try {
            await validationSchema.validate(formik.values, { abortEarly: false });
            toggleArrowTab(activeStep + 1);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos' })
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}>

                <div className="step-arrow-nav mb-4">
                    <Nav className="nav-pills custom-nav nav-justified">
                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-managerselect-tab"
                                className={classnames({
                                    active: activeStep === 1,
                                    done: activeStep > 1,
                                })}
                                onClick={() => toggleArrowTab(1)}
                                aria-selected={activeStep === 1}
                                aria-controls="step-managerselect-tab"
                            >
                                Selección de encargado
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-subwarehouseData-tab"
                                className={classnames({
                                    active: activeStep === 2,
                                    done: activeStep > 2,
                                })}
                                onClick={() => toggleArrowTab(2)}
                                aria-selected={activeStep === 2}
                                aria-controls="step-subwarehouseData-tab"
                            >
                                Información del subalmacen
                            </NavLink>
                        </NavItem>

                        <NavItem>
                            <NavLink
                                href='#'
                                id="step-summary-tab"
                                className={classnames({
                                    active: activeStep === 3,
                                    done: activeStep > 3,
                                })}
                                onClick={() => toggleArrowTab(3)}
                                aria-selected={activeStep === 3}
                                aria-controls="step-summary-tab"
                            >
                                Resumen
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-managerselect-tab" tabId={1}>
                        <SelectableTable data={users} columns={usersColumns} selectionMode="single" showPagination={true} rowsPerPage={6} onSelect={(rows) => changeSelectedUser(rows?.[0] ?? null)} />
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSelectedManager()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-subwarehouseData-tab" tabId={2}>
                        <div className="mt-4">
                            <Label htmlFor="idInput" className="form-label">Identificador</Label>
                            <Input
                                type="text"
                                id="idInput"
                                className="form-control"
                                name="id"
                                value={formik.values.code}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.code && !!formik.errors.code}
                                disabled={isCodeDisabled}
                            />
                            {formik.touched.code && formik.errors.code && (
                                <FormFeedback>{formik.errors.code as string}</FormFeedback>
                            )}
                        </div>

                        <div className='mt-4'>
                            <Label htmlFor='nameInput' className='form-input'>Nombre</Label>
                            <Input
                                type='text'
                                id='nameInput'
                                className='form-control'
                                name='name'
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.name && !!formik.errors.name}
                            />
                            {formik.touched.name && formik.errors.name && (
                                <FormFeedback>{formik.errors.name as string}</FormFeedback>
                            )}
                        </div>

                        <div className='mt-4'>
                            <Label htmlFor='locationInput' className='form-input'>Ubicación</Label>
                            <Input
                                type='text'
                                id='locationInput'
                                className='form-control'
                                name='location'
                                value={formik.values.location}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                invalid={formik.touched.location && !!formik.errors.location}
                            />
                            {formik.touched.location && formik.errors.location && (
                                <FormFeedback>{formik.errors.location as string}</FormFeedback>
                            )}
                        </div>

                        <div className="d-flex justify-content-end mt-4 gap-2">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>

                            <Button className="ms-auto" onClick={() => checkSubwarehouseData()}>
                                Siguiente
                                <i className="ri-arrow-right-line" />
                            </Button>

                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className='d-flex gap-3'>
                            <Card className="w-50">
                                <CardHeader>
                                    <h5>Información del subalmacen</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={subwarehouseAttributes} object={formik.values || {}} />
                                </CardBody>
                            </Card>

                            <Card className="w-50">
                                <CardHeader>
                                    <h5>Información del encargado</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={userAttributes} object={selectedUser || {}} showImage={true} imageSrc={selectedUser?.profile_image || defaultImageProfila}></ObjectDetails>
                                </CardBody>
                            </Card>
                        </div>


                        <div className="d-flex justify-content-between mt-4 gap-2">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                Atrás
                            </Button>
                            <Button className='farm-primary-button' type="submit" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner></Spinner> : "Registrar Subalmacén"}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>Confirmación de Cancelación</ModalHeader>
                <ModalBody>
                    ¿Estás seguro de que deseas cancelar? Los datos no se guardarán.
                </ModalBody>
                <ModalFooter>
                    <Button className='farm-secondary-button' onClick={onCancel}>
                        Sí, cancelar
                    </Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>
                        No, continuar
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} message={'Subalmacen creado con exito'} onClose={() => onSave()} />
            <ErrorModal isOpen={modals.error} message={'El servicio no esta disponible, intentelo mas tarde'} onClose={() => toggleModal('error', false)} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} autoClose={3000} absolutePosition={false} />
        </>
    )
}

export default SubwarehouseForm;