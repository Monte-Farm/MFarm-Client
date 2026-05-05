
import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Attribute, GroupMedicationPackagesHistory, LitterEvent } from "common/data_interfaces";
import * as Yup from 'yup';
import classnames from "classnames";
import { useFormik } from "formik";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import MissingStockModal from "../Shared/MissingStockModal";

interface AsignLitterMedicationPackageFormProps {
    litterId: string
    onSave: () => void
}

const AsignLitterMedicationPackageForm: React.FC<AsignLitterMedicationPackageFormProps> = ({ litterId, onSave }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ medicationPackageDetails: false, success: false, error: false, missingStock: false, subwarehouseError: false });
    const [medicationsPackages, setMedicationsPackages] = useState<any[]>([]);
    const [litterDetails, setLitterDetails] = useState<any>()
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>();
    const [medicationPackagesItems, setMedicationsPackagesItems] = useState<any[]>();
    const [missingItems, setMissingItems] = useState([]);

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

    const medicationPackagesColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('common.field.name'), accessor: 'name', type: 'text', isFilterable: true },
        { header: t('medication.package.column.createdAt'), accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: t('common.field.stage'),
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";

                switch (row.stage) {
                    case "general": color = "info"; break;
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') })}</Badge>;
            },
        },
    ]

    const selectedMedicationsColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: "id", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medication.card.medications.perHead'),
            accessor: "quantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
        },
        {
            header: t('medication.card.medications.totalDose'),
            accessor: "totalDose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span>
        },
        {
            header: t('medical.medication.field.route'),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "oral": color = "info"; break;
                    case "intramuscular":
                    case "subcutaneous":
                    case "intravenous":
                    case "intranasal":
                    case "topical":
                    case "rectal": color = "primary"; break;
                }

                return <Badge color={color}>{t(`medical.medication.route.${value}`, { defaultValue: value })}</Badge>;
            },
        },
    ]

    const medicationPackagesAttributes: Attribute[] = [
        { label: t('common.field.code'), key: 'code', type: 'text' },
        { label: t('common.field.name'), key: 'name', type: 'text', },
        { label: t('medication.package.column.createdAt'), key: 'creation_date', type: 'date', },
        {
            label: t('common.field.stage'),
            key: 'stage',
            type: 'text',
            render: (_, row) => {
                let color = "secondary";

                switch (row.stage) {
                    case "general": color = "info"; break;
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{t(`feeding.stage.${row.stage}`, { defaultValue: t('medical.medication.field.unknown') })}</Badge>;
            },
        },
    ]

    const litterAttributes: Attribute[] = [
        { key: 'code', label: t('common.field.code'), type: 'text' },
        { key: 'birthDate', label: t('pigs.field.birthDate'), type: 'date' },
        { key: 'currentMale', label: t('litter.attr.currentMale'), type: 'text' },
        { key: 'currentFemale', label: t('litter.attr.currentFemale'), type: 'text' },
        {
            key: 'status',
            label: t('common.field.status'),
            type: 'text',
            render: (value, object) => {
                let color = 'secondary';

                switch (value) {
                    case 'active': color = 'warning'; break;
                    case 'weaned': color = 'success'; break;
                }

                return <Badge color={color}>{t(`litter.status.${value}`, { defaultValue: value })}</Badge>;
            }
        },
        {
            key: 'responsible',
            label: t('litter.attr.responsible'),
            type: 'text',
            render: (value, object) => <span>{object.responsible?.name} {object.responsible?.lastname}</span>
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            const litterData = litterResponse.data.data;
            setLitterDetails(litterData);

            const medicationResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/piglet`)
            const packagesWithId = medicationResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setMedicationsPackages(packagesWithId);
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.error.load') })
        } finally {
            setLoading(false)
        }
    }

    const fetchMedicationsItems = async (medications: any[]) => {
        if (!configContext || !userLogged || !medications) return;
        try {
            const medicationsIds = medications.map(m => m.medication)
            const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_ids`, medicationsIds)

            const products = medicationResponse.data.data;
            const combined = medications.map(med => {
                const product = products.find((p: any) => p._id === med.medication);
                const productFormik = formik.values.medications.find((p: any) => p.medication === med.medication)
                return { ...product, ...med, totalDose: productFormik?.totalDose };
            });
            setMedicationsPackagesItems(combined)
        } catch (error) {
            logger.error('Error fetching data:', error);
        }
    }

    const validationSchema = useMemo(() => Yup.object({
        applicationDate: Yup.date().required(t('form.validation.required')),
        appliedBy: Yup.string().required(t('form.validation.required')),
    }), [t])

    const formik = useFormik<GroupMedicationPackagesHistory>({
        initialValues: {
            packageId: '',
            name: '',
            medications: [],
            applicationDate: null,
            appliedBy: userLogged._id,
            observations: '',
            isActive: true,
            estimatedTotal: 0,
        },
        enableReinitialize: true,
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            try {
                const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_litter_medication_package/${userLogged.farm_assigned}/${litterId}`, values)

                const litterEvent: LitterEvent = {
                    type: "GROUP_TREATMENT",
                    date: new Date(),
                    data: `Paquete de medicacion ${selectedMedicationPackage.code} asignado`,
                    registeredBy: userLogged._id
                }

                await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/add_event/${litterId}`, litterEvent)

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicación asignado a la camada ${litterDetails?.code}`
                });

                toggleModal('success', true)
            } catch (error: any) {
                logger.error('Error saving the information: ', { error })
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock');
                    return;
                }

                if (error.response?.status === 400 && !error.response?.data?.missing) {
                    toggleModal('subwarehouseError');
                    return;
                }
                toggleModal('error')
            }
        }
    })

    const checkMedicationPackageData = async () => {
        if (formik.values.packageId === '') {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.selectPackage') })
        } else {
            toggleArrowTab(activeStep + 1);
        }
    }

    useEffect(() => {
        fetchData();
        formik.setFieldValue('applicationDate', new Date())
    }, [])

    useEffect(() => {
        if (selectedMedicationPackage) {
            const medicationsFull = selectedMedicationPackage.medications.map((m: any) => ({
                medication: m.medication,
                administrationRoute: m.administration_route,
                dosePerPig: m.quantity,
                totalDose: Number(m.quantity * (litterDetails.currentFemale + litterDetails.currentMale))
            }))

            formik.setFieldValue('packageId', selectedMedicationPackage._id)
            formik.setFieldValue('name', selectedMedicationPackage.name)
            formik.setFieldValue('medications', medicationsFull)

            fetchMedicationsItems(selectedMedicationPackage.medications)
        }
    }, [selectedMedicationPackage])

    useEffect(() => {
        if (!formik.values.medications?.length) return;

        fetchMedicationsItems(selectedMedicationPackage.medications);
    }, [formik.values.medications]);


    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-packageSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            {t('medication.assign.step.package')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('medication.assign.step.summary')}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-packageSelect-tab" tabId={1}>
                    <div className="d-flex gap-2 mt-4">
                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">{t('medication.assign.field.date')}</Label>
                            <DatePicker
                                id="applicationDate"
                                className={`form-control ${formik.touched.applicationDate && formik.errors.applicationDate ? 'is-invalid' : ''}`}
                                value={formik.values.applicationDate ?? undefined}
                                onChange={(date: Date[]) => {
                                    if (date[0]) formik.setFieldValue('applicationDate', date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                            {formik.touched.applicationDate && formik.errors.applicationDate && (
                                <FormFeedback className="d-block">{formik.errors.applicationDate as string}</FormFeedback>
                            )}
                        </div>

                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">{t('medication.assign.field.responsible')}</Label>
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
                        <Label htmlFor="observations" className="form-label">{t('pigs.field.observations')}</Label>
                        <Input
                            type="text"
                            id="observations"
                            name="observations"
                            value={formik.values.observations}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.observations && !!formik.errors.observations}
                            placeholder={t('medication.assign.field.observationsPlaceholder')}
                        />
                        {formik.touched.observations && formik.errors.observations && (
                            <FormFeedback>{formik.errors.observations}</FormFeedback>
                        )}
                    </div>

                    <div className="mt-4">
                        <Label htmlFor="observations" className="form-label">{t('medication.assign.field.selectPackage')}</Label>

                        <SelectableCustomTable
                            columns={medicationPackagesColumns}
                            data={medicationsPackages}
                            showPagination={true}
                            rowsPerPage={6}
                            selectionMode="single"
                            showSearchAndFilter={false}
                            onSelect={(rows) => setSelectedMedicationPackage(rows[0])}
                        />
                    </div>


                    <div className="d-flex justify-content-between mt-4">
                        <Button className="btn btn-primary ms-auto" onClick={() => checkMedicationPackageData()}>
                            {t('common.button.next')}
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    {t('medication.assign.summary.litterCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={litterAttributes}
                                        object={litterDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100">
                            <Card className="shadow-sm mb-3">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    {t('medication.assign.summary.packageCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={medicationPackagesAttributes}
                                        object={selectedMedicationPackage ?? {}}
                                    />
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>{t('medication.assign.summary.medicationsCard')}</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedMedicationsColumns}
                                        data={medicationPackagesItems || []}
                                        showSearchAndFilter={false}
                                        rowsPerPage={4}
                                        showPagination={true}
                                    />
                                </CardBody>
                            </Card>
                        </div>
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
                                    {t('medication.assign.button.assign')}
                                </div>
                            )}

                        </Button>
                    </div>
                </TabPane>

            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('medication.assign.error.submit')} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('medication.assign.success.package')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
            <ErrorModal isOpen={modals.subwarehouseError} onClose={() => toggleModal('subwarehouseError')} message={t('medication.assign.error.noSubwarehouse')} />

        </>
    )
}

export default AsignLitterMedicationPackageForm;
