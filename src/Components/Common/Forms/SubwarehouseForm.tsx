import { logger } from 'utils/logger';
import { preventEnterSubmit } from 'utils/formUtils';
import { ConfigContext } from 'App';
import { Attribute, SubwarehouseData } from 'common/data_interfaces';
import { useFormik } from 'formik';
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from 'reactstrap';
import * as Yup from 'yup';
import SuccessModal from '../Shared/SuccessModal';
import LoadingAnimation from '../Shared/LoadingAnimation';
import ErrorModal from '../Shared/ErrorModal';
import classnames from "classnames";
import SelectableTable from '../Tables/SelectableTable';
import { Column } from 'common/data/data_types';
import { useTranslation } from 'react-i18next';
import AlertMessage from '../Shared/AlertMesagge';
import ObjectDetails from '../Details/ObjectDetails';
import defaultImageProfila from '../../../assets/images/default-profile-mage.jpg'
import { subwarehouseTypes } from 'common/subawarehouse_types'
import UserForm from './UserForm';

interface SubwarehouseFormProps {
    onSave: () => void;
    onCancel: () => void;
    isCodeDisabled?: boolean
}

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
    const userLogged = getEffectiveUser();
    const { t } = useTranslation();
    const [modals, setModals] = useState({ success: false, error: false, cancel: false, createUser: false });
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
        { header: t('users.column.username'), accessor: 'username', isFilterable: true, type: 'text' },
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: 'text' },
        { header: t('users.column.lastname'), accessor: 'lastname', isFilterable: true, type: 'text' },
        {
            header: t('users.column.role'),
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
                            const label = t(`roles.${r}`, { defaultValue: r });
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
            header: t('common.field.status'),
            accessor: 'status',
            isFilterable: true,
            render: (value: boolean) => (
                <Badge color={value ? 'success' : 'danger'}>
                    {value ? t('common.status.active') : t('common.status.inactive')}
                </Badge>
            ),
        },
    ];

    const userAttributes: Attribute[] = [
        { key: 'username', label: t('users.column.username'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        { key: 'lastname', label: t('users.column.lastname'), type: 'text' },
        {
            key: 'role',
            label: t('users.column.role'),
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
                            const label = t(`roles.${r}`, { defaultValue: r });
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
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        {
            key: 'type',
            label: t('warehouse.subwarehouse.typeLabel'),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "medical":
                        color = "info";
                        label = t("warehouse.common.subwarehouseType.medical");
                        break;
                    case "feed":
                        color = "success";
                        label = t("warehouse.common.subwarehouseType.feed");
                        break;
                    case "cleaning":
                        color = "primary";
                        label = t("warehouse.common.subwarehouseType.cleaning");
                        break;
                    case "supplies":
                        color = "warning";
                        label = t("warehouse.common.subwarehouseType.supplies");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
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
                    logger.error(`Error al verificar el id: ${error}`)
                    return false
                }
            }),
        name: Yup.string().required('Por favor, ingrese el nombre'),
        manager: Yup.string().required('Por favor, seleccione el responsable'),
        type: Yup.string().required('Por favor, seleccione el tipo de subalmacen')
    })

    const formik = useFormik<SubwarehouseData>({
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
            farm: userLogged.farm_assigned,
            type: ''
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
                logger.error(`Error saving data: ${error}`)
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
            logger.error('Error fetching data: ', { error })
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        if (!configContext) return;
        try {
            const usersResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_role/subwarehouse_manager`);
            const filteredUsers = usersResponse.data.data.filter((u: any) => u.assigment === null);
            setUsers(filteredUsers.map((b: any) => ({ ...b, id: b._id })));
        } catch (error) {
            logger.error('Error fetching users: ', { error });
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
            type: true
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
            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} onKeyDown={preventEnterSubmit}>

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
                                {t("warehouse.subwarehouse.stepSelectManager")}
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
                                {t("warehouse.subwarehouse.stepSubwarehouseData")}
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
                                {t("warehouse.subwarehouse.stepSummary")}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeStep}>
                    <TabPane id="step-managerselect-tab" tabId={1}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label className="form-label mb-0">{t('warehouse.subwarehouse.selectManager', { defaultValue: 'Seleccionar encargado' })}</Label>
                            <Button size="sm" className="farm-secondary-button" type="button" onClick={() => toggleModal('createUser', true)}>
                                <i className="ri-user-add-line me-1"></i>{t('warehouse.subwarehouse.addUserBtn', { defaultValue: 'Registrar usuario' })}
                            </Button>
                        </div>
                        {users.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="ri-user-line" style={{ fontSize: '3rem' }}></i>
                                <p className="mt-3 mb-0">{t('warehouse.subwarehouse.noUsers', { defaultValue: 'No hay usuarios registrados como encargados de subalmacén' })}</p>
                            </div>
                        ) : (
                            <SelectableTable data={users} columns={usersColumns} selectionMode="single" showPagination={true} rowsPerPage={6} onSelect={(rows) => changeSelectedUser(rows?.[0] ?? null)} />
                        )}
                        <div className="mt-4 d-flex">
                            <Button className="ms-auto" onClick={() => checkSelectedManager()}>
                                {t("common.button.next")}
                                <i className="ri-arrow-right-line" />
                            </Button>
                        </div>
                    </TabPane>

                    <TabPane id="step-subwarehouseData-tab" tabId={2}>
                        <div className="mt-4">
                            <Label htmlFor="idInput" className="form-label">{t("warehouse.subwarehouse.fieldIdentifier")}</Label>
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
                            <Label htmlFor='nameInput' className='form-input'>{t('warehouse.subwarehouse.fieldName')}</Label>
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

                        <div className="mt-4">
                            <Label className="form-label fw-bold">{t("warehouse.subwarehouse.fieldType")}</Label>

                            <div className="role-selector-container d-flex flex-wrap gap-3">
                                {subwarehouseTypes.map((type) => {
                                    const checked = formik.values.type === type.value;

                                    return (
                                        <label key={type.value} className={`role-card ${checked ? "selected" : ""}`}>
                                            <input
                                                type="radio"
                                                name="type"
                                                value={type.value}
                                                checked={checked}
                                                onChange={() => {
                                                    formik.setFieldValue("type", type.value);
                                                }}
                                            />
                                            <i className="ri-checkbox-circle-fill role-check-icon"></i>
                                            <span>{type.label}</span>
                                        </label>
                                    );
                                })}
                            </div>

                            {formik.touched.type && formik.errors.type && (
                                <FormFeedback className="d-block mt-2">{formik.errors.type}</FormFeedback>
                            )}
                        </div>


                        <div className="d-flex justify-content-end mt-4 gap-2">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t("common.button.back")}
                            </Button>

                            <Button className="ms-auto" onClick={() => checkSubwarehouseData()}>
                                {t("common.button.next")}
                                <i className="ri-arrow-right-line" />
                            </Button>

                        </div>
                    </TabPane>

                    <TabPane id="step-summary-tab" tabId={3}>
                        <div className='d-flex gap-3'>
                            <Card className="w-50">
                                <CardHeader>
                                    <h5>{t("warehouse.subwarehouse.infoSubwarehouse")}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={subwarehouseAttributes} object={formik.values || {}} />
                                </CardBody>
                            </Card>

                            <Card className="w-50">
                                <CardHeader>
                                    <h5>{t("warehouse.subwarehouse.infoManager")}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={userAttributes} object={selectedUser || {}} showImage={true} imageSrc={selectedUser?.profile_image || defaultImageProfila}></ObjectDetails>
                                </CardBody>
                            </Card>
                        </div>


                        <div className="d-flex justify-content-between mt-4 gap-2">
                            <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                                <i className="ri-arrow-left-line me-2" />
                                {t("common.button.back")}
                            </Button>
                            <Button className='farm-primary-button' type="submit" disabled={formik.isSubmitting}>
                                {formik.isSubmitting ? <Spinner></Spinner> : t("warehouse.subwarehouse.registerBtn")}
                            </Button>
                        </div>
                    </TabPane>
                </TabContent>
            </form>

            <Modal isOpen={modals.cancel} centered toggle={() => toggleModal('cancel', false)}>
                <ModalHeader>{t("warehouse.subwarehouse.cancelTitle")}</ModalHeader>
                <ModalBody>
                    {t("warehouse.subwarehouse.cancelBody")}
                </ModalBody>
                <ModalFooter>
                    <Button className='btn-cancel' onClick={onCancel}>
                        {t("warehouse.subwarehouse.cancelYes")}
                    </Button>
                    <Button className='farm-primary-button' onClick={() => toggleModal('cancel', false)}>
                        {t("warehouse.subwarehouse.cancelNo")}
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal size="lg" isOpen={modals.createUser} toggle={() => toggleModal('createUser', false)} backdrop="static" keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal('createUser', false)}>
                    {t('warehouse.subwarehouse.addUserBtn', { defaultValue: 'Registrar usuario' })}
                </ModalHeader>
                <ModalBody>
                    <UserForm
                        defaultRole="subwarehouse_manager"
                        currentUserRole={userLogged.role}
                        onSave={() => { toggleModal('createUser', false); fetchUsers(); }}
                        onCancel={() => toggleModal('createUser', false)}
                    />
                </ModalBody>
            </Modal>

            <SuccessModal isOpen={modals.success} message={t('warehouse.subwarehouse.successCreate')} onClose={() => onSave()} />
            <ErrorModal isOpen={modals.error} message={t('warehouse.subwarehouse.errorService')} onClose={() => toggleModal('error', false)} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} autoClose={3000} absolutePosition={false} />
        </>
    )
}

export default SubwarehouseForm;