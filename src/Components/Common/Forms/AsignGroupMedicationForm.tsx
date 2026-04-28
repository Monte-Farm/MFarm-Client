import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { Attribute, GroupData } from "common/data_interfaces";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png'
import * as Yup from "yup";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import MissingStockModal from "../Shared/MissingStockModal";
import SuccessModal from "../Shared/SuccessModal";

interface AsignGroupMedicationFormProps {
    groupId: string
    onSave: () => void;
}

const AsignGroupMedicationForm: React.FC<AsignGroupMedicationFormProps> = ({ groupId, onSave }) => {
    const { t } = useTranslation();
    const userLogged = getEffectiveUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [groupDetails, setGroupDetails] = useState<GroupData>()
    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [missingItems, setMissingItems] = useState([]);
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([])
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [applicationDate, setApplicationDate] = useState<Date>(new Date())
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const medicationsColumns: Column<any>[] = [
        {
            header: t('feeding.package.form.column.image'), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('feeding.package.form.column.category'),
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "medications": color = "info"; break;
                    case "vaccines": color = "primary"; break;
                }

                return <Badge color={color}>{t(`feeding.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('medication.card.medications.perHead'),
            accessor: "dosePerPig",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.dosePerPig === 0 ? "" : (selected?.dosePerPig ?? "")}
                            invalid={medicationErrors[row._id]?.dosePerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const totalDoseNew = Number(newValue * (groupDetails?.pigCount ?? 0))
                                setMedicationsSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, dosePerPig: newValue, totalDose: totalDoseNew } : m)
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
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.administrationRoute ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={medicationErrors[row._id]?.administrationRoute}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administrationRoute: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">{t('common.select.placeholder')}</option>
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
        {
            header: t('pigs.field.observations'),
            accessor: "observations",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.observations ?? "";
                return (
                    <Input
                        type="text"
                        disabled={!isSelected}
                        value={realValue}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, observations: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            }
        },
    ];

    const groupAttributes: Attribute[] = [
        { label: t('common.field.code'), key: 'code', type: 'text' },
        { label: t('common.field.name'), key: 'name', type: 'text' },
        {
            label: t('groups.column.area'),
            key: 'area',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";

                switch (object.area) {
                    case "gestation": color = "info"; break;
                    case "farrowing": color = "primary"; break;
                    case "maternity": color = "primary"; break;
                    case "weaning": color = "success"; break;
                    case "nursery": color = "warning"; break;
                    case "fattening": color = "dark"; break;
                    case "replacement": color = "secondary"; break;
                    case "boars": color = "info"; break;
                    case "quarantine": color = "danger"; break;
                    case "hospital": color = "danger"; break;
                    case "shipping": color = "secondary"; break;
                }

                return <Badge color={color}>{t(`groups.area.${object.area}`, { defaultValue: object.area })}</Badge>;
            },
        },
        {
            label: t('common.field.stage'),
            key: 'stage',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";

                switch (object.stage) {
                    case "piglet": color = "info"; break;
                    case "weaning": color = "warning"; break;
                    case "fattening": color = "primary"; break;
                    case "breeder": color = "success"; break;
                }

                return <Badge color={color}>{t(`pigs.stage.${object.stage}`, { defaultValue: object.stage })}</Badge>;
            },
        },
        { label: t('groups.column.pigCount'), key: 'pigCount', type: 'text' },
        { label: t('groups.column.creationDate'), key: 'creationDate', type: 'date' },
        { label: t('pigs.field.observations'), key: 'observations', type: 'text' },
    ]

    const selectedMedicationsColumns: Column<any>[] = [
        { header: t('common.field.code'), accessor: "code", type: "text", isFilterable: true },
        { header: t('feeding.package.form.column.product'), accessor: "name", type: "text", isFilterable: true },
        {
            header: t('medication.card.medications.perHead'),
            accessor: "dosePerPig",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dosePerPig} {row.unit_measurement}</span>
        },
        {
            header: t('medication.card.medications.totalDose'),
            accessor: "totalDose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span>
        },
        {
            header: t('feeding.package.form.column.category'),
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "medications": color = "info"; break;
                    case "vaccines": color = "primary"; break;
                }

                return <Badge color={color}>{t(`feeding.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('medical.medication.field.route'),
            accessor: "administrationRoute",
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

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            const groupData = groupResponse.data.data;
            setGroupDetails(groupData)

            const medicationsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`)
            const medicationsWithId = medicationsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setMedicationsItems(medicationsWithId)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.error.load') })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);
            const medicationsData = medicationsSelected.map(prev => ({ ...prev, applicationDate: applicationDate }))

            const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_group_medications/${userLogged.farm_assigned}/${groupId}`, medicationsData)
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Medicación asignada al grupo ${groupDetails?.code}`
            });

            toggleModal('success', true)
        } catch (error: any) {
            console.error('Error saving the information: ', { error })
            if (error.response?.status === 400 && error.response?.data?.missing) {
                setMissingItems(error.response.data.missing);
                toggleModal('missingStock');
                return;
            }
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const medicationValidation = useMemo(() => Yup.object({
        medication: Yup.string().required(),
        dosePerPig: Yup.number()
            .moreThan(0, t('form.validation.positive'))
            .required(t('form.validation.required')),
        administrationRoute: Yup.string()
            .required(t('form.validation.required'))
            .notOneOf([""], t('form.validation.required')),
    }), [t]);

    const validateSelectedMedications = async () => {
        const errors: Record<string, any> = {};

        if (medicationsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.selectAtLeastOne') })
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
            setAlertConfig({ visible: true, color: 'danger', message: t('medication.assign.validation.fillAllData') })
            return false;
        }

        return true;
    };

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
                            {t('medication.assign.step.medications')}
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
                <TabPane id="step-medicationSelect-tab" tabId={1}>
                    <div className="d-flex gap-3">
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

                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">{t('medication.assign.field.date')}</Label>
                            <DatePicker
                                id="applicationDate"
                                className={`form-control`}
                                value={applicationDate}
                                onChange={(date: Date[]) => {
                                    if (date[0]) setApplicationDate(date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                        </div>
                    </div>

                    <div className="mt-3">
                        <Label htmlFor="user" className="form-label">{t('medication.assign.field.selectMedications')}</Label>
                        <SelectableCustomTable
                            columns={medicationsColumns}
                            data={medicationsItems}
                            showPagination={true}
                            rowsPerPage={6}
                            onSelect={(rows) => {
                                setMedicationsSelected(prev => {
                                    const newRows = rows.map(r => {
                                        const existing = prev.find(p => p.medication === r._id);
                                        if (existing) return existing;

                                        return {
                                            medication: r._id,
                                            dosePerPig: 0,
                                            administrationRoute: "",
                                            applicationDate: null,
                                            appliedBy: userLogged?._id,
                                            observations: "",
                                            isActive: true,
                                            totalDose: 0,
                                        };
                                    });
                                    return newRows;
                                });
                            }}
                        />
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedMedications();
                                if (!ok) return;
                                toggleArrowTab(2);
                            }}
                        >
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
                                    {t('medication.assign.summary.groupCard')}
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={groupAttributes}
                                        object={groupDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100">
                            <Card className="shadow-sm">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>{t('medication.assign.summary.medicationsCard')}</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedMedicationsColumns}
                                        data={medicationsSelected.map(ms => ({
                                            ...medicationsItems.find(p => p._id === ms.medication),
                                            ...ms
                                        }))}
                                        showSearchAndFilter={false}
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

                        <Button className="ms-auto btn-success" onClick={() => handleSubmit()} disabled={isSubmitting}>
                            {isSubmitting ? (
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
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('medication.assign.success.medications')} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default AsignGroupMedicationForm;
