import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { PigData } from "common/data_interfaces";
import { getEffectiveUser } from "helpers/impersonation_helper";
import React, { useContext, useEffect, useState } from "react";
import DatePicker from "react-flatpickr";
import { Alert, Button, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane, FormFeedback, Badge, Card, CardHeader, CardBody } from "reactstrap";
import * as Yup from 'yup';
import classnames from "classnames";
import SimpleBar from "simplebar-react";
import { FiAlertCircle } from "react-icons/fi";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import { FaMars, FaVenus } from "react-icons/fa";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { darkenHex } from "utils/colorUtils";

interface BatchPigFormProps {
    onSave: () => void;
    onCancel: () => void;
}

const BatchPigForm: React.FC<BatchPigFormProps> = ({ onSave, onCancel }) => {
    const { t } = useTranslation();
    const isDark = useSelector((state: any) => state.Layout?.layoutModeType) === "dark";
    const bg = (color: string) => isDark ? darkenHex(color) : color;
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [sharedBatchAttributes, setSharedBatchAttributes] = useState<{
        origin: 'born' | 'purchased' | 'donated' | 'other' | '';
        originDetail?: string; sourceFarm?: string; arrivalDate?: Date | null; purchasePrice?: number;
    }>({ origin: '', originDetail: '', sourceFarm: '', arrivalDate: null, purchasePrice: 0 });
    const [pigsBatch, setPigsBatch] = useState<PigData[]>([]);
    const [pigsBatchLength, setPigsBatchLength] = useState<number | ''>(0);
    const [pigsErrors, setPigsErrors] = useState<Record<number, any>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const pigColumns: Column<any>[] = [
        { header: t('pigs.field.breed'), accessor: 'breed', type: 'text' },
        { header: t('pigs.field.birthDateShort'), accessor: 'birthdate', type: 'date' },
        {
            header: t('pigs.field.sex'),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? t('pigs.sex.male') : t('pigs.sex.female')}
                </Badge>
            ),
        },
        { header: t('pigs.field.currentWeight'), accessor: 'weight', type: 'number' },
    ];

    const pigSchema = Yup.object().shape({
        birthdate: Yup.date().typeError(t('pigs.field.birthDate')).required(t('pigs.field.birthDate')),
        breed: Yup.string().required(t('pigs.field.breed')),
        currentStage: Yup.string().oneOf(["piglet", "weaning", "fattening", "breeder"]).required(t('pigs.field.stage')),
        sex: Yup.string().oneOf(["male", "female"]).required(t('pigs.field.sex')),
        weight: Yup.number().typeError(t('common.field.weight')).min(0.01).required(t('common.field.weight')),
        observations: Yup.string().optional(),
    });

    const isBatchInfoComplete = () => {
        if (!sharedBatchAttributes?.origin || Number(pigsBatchLength) <= 0) return false;
        if (sharedBatchAttributes.origin === "other" && !sharedBatchAttributes.originDetail) return false;
        if (sharedBatchAttributes.origin !== "born" && !sharedBatchAttributes.arrivalDate) return false;
        if ((sharedBatchAttributes.origin === "purchased" || sharedBatchAttributes.origin === "donated") && !sharedBatchAttributes.sourceFarm) return false;
        if (sharedBatchAttributes.origin === "purchased" && (!sharedBatchAttributes.purchasePrice || sharedBatchAttributes.purchasePrice <= 0)) return false;
        return true;
    };

    const handleCreatePigBatch = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true);
            await configContext.axiosHelper.create(`${configContext.apiUrl}/pig/create_pig_batch`, pigsBatch);
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, { event: `Registro de cerdos por lote` });
            toggleModal('success');
        } catch (error) {
            logger.error('Error creating pig batch:', { error });
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (isBatchInfoComplete()) {
            const pigs: PigData[] = Array.from({ length: Number(pigsBatchLength) }, () => ({
                _id: '', code: '', farmId: userLogged.farm_assigned, birthdate: new Date(), breed: '',
                origin: sharedBatchAttributes.origin, originDetail: sharedBatchAttributes.originDetail,
                sourceFarm: sharedBatchAttributes.sourceFarm, arrivalDate: sharedBatchAttributes.arrivalDate,
                purchasePrice: sharedBatchAttributes.origin === 'purchased' ? sharedBatchAttributes.purchasePrice : undefined,
                status: 'alive', currentStage: '', sex: '', weight: 0, observations: '',
                historyChanges: [], feedings: [], discarded: false, medications: [],
                medicationPackagesHistory: [], vaccinationPlansHistory: [], sicknessHistory: [],
                reproduction: [], registered_by: userLogged._id, registration_date: new Date(), feedAdministrationHistory: [],
            }));
            setPigsBatch(pigs);
        }
    }, [pigsBatchLength, sharedBatchAttributes]);

    const validatePigsBatch = async () => {
        try {
            await Yup.array().of(pigSchema).validate(pigsBatch, { abortEarly: false });
            setPigsErrors({});
            return true;
        } catch (err: any) {
            if (err.inner) {
                const formattedErrors: Record<number, any> = {};
                err.inner.forEach((validationError: any) => {
                    const index = validationError.path.match(/\[(\d+)\]/)?.[1];
                    if (index === undefined) return;
                    if (!formattedErrors[index]) formattedErrors[index] = {};
                    formattedErrors[index][validationError.path.split(".").pop()] = validationError.message;
                });
                setPigsErrors(formattedErrors);
            }
            return false;
        }
    };

    const originBadgeColor: Record<string, string> = { born: "success", purchased: "info", donated: "primary", other: "secondary" };

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem><NavLink href="#" className={classnames({ active: activeStep === 1 })}>{t('form.pig.step.pigsData')}</NavLink></NavItem>
                    <NavItem><NavLink href="#" className={classnames({ active: activeStep === 2 })}>{t('form.pig.step.summary')}</NavLink></NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    {/* Información del lote */}
                    <div className="card mb-3 shadow-sm">
                        <div className="card-header fw-semibold d-flex justify-content-between align-items-center" style={{ backgroundColor: bg('#e3f2fd') }}>
                            <span><i className="ri-group-line me-2 text-primary"></i>{t('form.pig.section.batchInfo')}</span>
                            {sharedBatchAttributes.origin && (
                                <Badge color={originBadgeColor[sharedBatchAttributes.origin] || 'secondary'} className="px-3 py-2">
                                    {t(`form.pig.batch.origin${sharedBatchAttributes.origin.charAt(0).toUpperCase() + sharedBatchAttributes.origin.slice(1)}`, { defaultValue: sharedBatchAttributes.origin })}
                                </Badge>
                            )}
                        </div>
                        <div className="card-body">
                            <div className="d-flex gap-3">
                                <div className="w-50">
                                    <Label className="form-label fw-semibold">{t('form.pig.field.pigCount')}</Label>
                                    <Input type="number" value={pigsBatchLength} onChange={(e) => { const v = e.target.value; setPigsBatchLength(v === '' ? '' : Number(v)); }} onBlur={() => { if (pigsBatchLength === '') setPigsBatchLength(0); }} onFocus={() => { if (pigsBatchLength === 0) setPigsBatchLength(''); }} />
                                </div>
                                <div className="w-50">
                                    <Label className="form-label fw-semibold">{t('pigs.field.origin')}</Label>
                                    <Input type="select" value={sharedBatchAttributes.origin} onChange={(e) => setSharedBatchAttributes(p => ({ ...p, origin: e.target.value as any }))}>
                                        <option value="">{t('form.pig.placeholder.selectOption')}</option>
                                        <option value="purchased">{t('pigs.origin.purchased')}</option>
                                        <option value="donated">{t('pigs.origin.donated')}</option>
                                        <option value="other">{t('pigs.origin.other')}</option>
                                    </Input>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Datos de origen */}
                    {sharedBatchAttributes.origin !== '' && (
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-semibold" style={{ backgroundColor: bg('#e8f5e9') }}>
                                <i className="ri-map-pin-line me-2 text-success"></i>{t('form.pig.section.originData')}
                            </div>
                            <div className="card-body">
                                <div className="d-flex gap-3">
                                    {sharedBatchAttributes.origin !== 'born' && (
                                        <div className="w-50">
                                            <Label className="form-label fw-semibold">{t('pigs.field.arrivalDate')}</Label>
                                            <DatePicker className="form-control" value={sharedBatchAttributes.arrivalDate ?? undefined} onChange={(value: Date[]) => { if (value[0]) setSharedBatchAttributes(p => ({ ...p, arrivalDate: value[0] })); }} options={{ dateFormat: 'd/m/Y' }} />
                                        </div>
                                    )}
                                    {(sharedBatchAttributes.origin === 'purchased' || sharedBatchAttributes.origin === 'donated') && (
                                        <div className="w-50">
                                            <Label className="form-label fw-semibold">{t('pigs.field.originFarm')}</Label>
                                            <Input value={sharedBatchAttributes.sourceFarm} onChange={(e) => setSharedBatchAttributes(p => ({ ...p, sourceFarm: e.target.value }))} />
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex gap-3 mt-3">
                                    {sharedBatchAttributes.origin === 'other' && (
                                        <div className="w-50">
                                            <Label className="form-label fw-semibold">{t('pigs.field.originDetail')}</Label>
                                            <Input value={sharedBatchAttributes.originDetail} onChange={(e) => setSharedBatchAttributes(p => ({ ...p, originDetail: e.target.value }))} />
                                        </div>
                                    )}
                                    {sharedBatchAttributes.origin === 'purchased' && (
                                        <div className="w-50">
                                            <Label className="form-label fw-semibold">{t('form.pig.field.purchasePricePerPig')}</Label>
                                            <Input type="number" step="0.01" value={sharedBatchAttributes.purchasePrice} onChange={(e) => setSharedBatchAttributes(p => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isBatchInfoComplete() ? (
                        <div className="p-4 border rounded text-center" style={{ backgroundColor: bg('#e3f2fd') }}>
                            <FiAlertCircle size={26} className="text-primary" />
                            <p className="mt-2 mb-0 fw-semibold text-primary">{t('form.pig.action.completeBatch')}</p>
                        </div>
                    ) : pigsBatch.length > 0 && (
                        <div className="card shadow-sm">
                            <div className="card-header fw-semibold" style={{ backgroundColor: bg('#e0f2f1') }}>
                                <i className="ri-list-check-2 me-2 text-info"></i>{t('form.pig.section.individualData', { count: pigsBatch.length })} ({pigsBatch.length})
                            </div>
                            <div className="card-body p-0">
                                <SimpleBar style={{ maxHeight: 400, padding: '16px' }}>
                                    {pigsBatch.map((pig, index) => (
                                        <div key={index} className="border rounded p-3 mb-3 bg-white" style={{ borderLeft: "5px solid #0d6efd" }}>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span className="fw-bold">{t('form.pig.batch.pigNumber', { index: index + 1 })}</span>
                                                <Badge color={pig.sex === 'male' ? "info" : pig.sex === 'female' ? "danger" : "secondary"}>
                                                    {pig.sex === 'male' && (<><FaMars className="me-1" />{t('pigs.sex.maleShort')}</>)}
                                                    {pig.sex === 'female' && (<><FaVenus className="me-1" />{t('pigs.sex.femaleShort')}</>)}
                                                    {!pig.sex && t('form.pig.batch.noSex')}
                                                </Badge>
                                            </div>
                                            <div className="d-flex gap-2 mb-2">
                                                <div className="w-100">
                                                    <Label className="form-label" style={{ fontSize: '12px' }}>{t('pigs.field.birthDate')}</Label>
                                                    <DatePicker value={pig.birthdate ?? undefined} className={`form-control form-control-sm ${pigsErrors[index]?.birthdate ? "is-invalid" : ""}`} onChange={(date: Date[]) => { if (date[0]) { const newPigs = [...pigsBatch]; newPigs[index].birthdate = date[0]; setPigsBatch(newPigs); } }} options={{ dateFormat: 'd/m/Y' }} />
                                                    {pigsErrors[index]?.birthdate && <FormFeedback>{pigsErrors[index]?.birthdate}</FormFeedback>}
                                                </div>
                                                <div className="w-100">
                                                    <Label className="form-label" style={{ fontSize: '12px' }}>{t('pigs.field.breed')}</Label>
                                                    <Input type="select" bsSize="sm" className={pigsErrors[index]?.breed ? "is-invalid" : ""} value={pig.breed} onChange={(e) => { const newPigs = [...pigsBatch]; newPigs[index].breed = e.target.value; setPigsBatch(newPigs); }}>
                                                        <option value="">{t('form.pig.placeholder.select')}</option>
                                                        {["Yorkshire","Landrace","Duroc","Hampshire","Pietrain","Berkshire","Large White","Chester White","Poland China","Tamworth"].map(b => <option key={b} value={b}>{b}</option>)}
                                                    </Input>
                                                    {pigsErrors[index]?.breed && <FormFeedback>{pigsErrors[index]?.breed}</FormFeedback>}
                                                </div>
                                                <div className="w-100">
                                                    <Label className="form-label" style={{ fontSize: '12px' }}>{t('pigs.field.stage')}</Label>
                                                    <Input type="select" bsSize="sm" className={pigsErrors[index]?.currentStage ? "is-invalid" : ""} value={pig.currentStage} onChange={(e) => { const newPigs = [...pigsBatch]; newPigs[index].currentStage = e.target.value as any; setPigsBatch(newPigs); }}>
                                                        <option value="">{t('form.pig.placeholder.select')}</option>
                                                        <option value="piglet">{t('pigs.stage.piglet')}</option>
                                                        <option value="weaning">{t('pigs.stage.weaning')}</option>
                                                        <option value="fattening">{t('pigs.stage.fattening')}</option>
                                                        <option value="breeder">{t('pigs.stage.breeder')}</option>
                                                    </Input>
                                                    {pigsErrors[index]?.currentStage && <FormFeedback>{pigsErrors[index]?.currentStage}</FormFeedback>}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <div className="w-50">
                                                    <Label className="form-label" style={{ fontSize: '12px' }}>{t('pigs.field.sex')}</Label>
                                                    <Input type="select" bsSize="sm" className={pigsErrors[index]?.sex ? "is-invalid" : ""} value={pig.sex} onChange={(e) => { const newPigs = [...pigsBatch]; newPigs[index].sex = e.target.value as any; setPigsBatch(newPigs); }}>
                                                        <option value="">{t('form.pig.placeholder.select')}</option>
                                                        <option value="male">{t('pigs.sex.maleShort')}</option>
                                                        <option value="female">{t('pigs.sex.femaleShort')}</option>
                                                    </Input>
                                                    {pigsErrors[index]?.sex && <FormFeedback>{pigsErrors[index]?.sex}</FormFeedback>}
                                                </div>
                                                <div className="w-50">
                                                    <Label className="form-label" style={{ fontSize: '12px' }}>{t('form.pig.field.weightKg')}</Label>
                                                    <Input type="number" step="0.01" bsSize="sm" className={pigsErrors[index]?.weight ? "is-invalid" : ""} value={pig.weight} onChange={(e) => { const newPigs = [...pigsBatch]; newPigs[index].weight = parseFloat(e.target.value) || 0; setPigsBatch(newPigs); }} />
                                                    {pigsErrors[index]?.weight && <FormFeedback>{pigsErrors[index]?.weight}</FormFeedback>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </SimpleBar>
                            </div>
                        </div>
                    )}

                    {alertConfig.visible && <Alert color={alertConfig.color} className="mt-3 shadow-sm">{alertConfig.message}</Alert>}

                    <div className="mt-4 d-flex">
                        <Button className="ms-auto px-4 py-2 fs-6 shadow-sm" onClick={async () => {
                            if (!isBatchInfoComplete()) return;
                            const valid = await validatePigsBatch();
                            if (!valid) { setAlertConfig({ visible: true, color: "danger", message: t('form.pig.action.fixErrors') }); return; }
                            setAlertConfig({ visible: false, color: "", message: "" });
                            setActiveStep(2);
                        }}>
                            {t('form.pig.action.next')}<i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="d-flex gap-3">
                        <Card className="w-25 shadow-sm">
                            <CardHeader><h5 className="m-0">{t('form.pig.section.sharedData')}</h5></CardHeader>
                            <CardBody className="d-flex flex-column gap-3">
                                <div><span className="text-muted d-block">{t('form.pig.field.pigCount')}</span><span className="fw-bold fs-5">{pigsBatchLength}</span></div>
                                <div>
                                    <span className="text-muted d-block">{t('pigs.field.origin')}</span>
                                    <Badge color={originBadgeColor[sharedBatchAttributes.origin] || 'secondary'} className="px-3 py-2">
                                        {t(`pigs.origin.${sharedBatchAttributes.origin}`, { defaultValue: sharedBatchAttributes.origin })}
                                    </Badge>
                                </div>
                                {sharedBatchAttributes.origin === "other" && <div><span className="text-muted d-block">{t('pigs.field.originDetail')}</span><span className="fw-semibold">{sharedBatchAttributes.originDetail || "-"}</span></div>}
                                {sharedBatchAttributes.origin !== "born" && <div><span className="text-muted d-block">{t('pigs.field.arrivalDate')}</span><span className="fw-semibold">{sharedBatchAttributes.arrivalDate ? sharedBatchAttributes.arrivalDate.toLocaleDateString() : "-"}</span></div>}
                                {(sharedBatchAttributes.origin === "purchased" || sharedBatchAttributes.origin === "donated") && <div><span className="text-muted d-block">{t('pigs.field.originFarm')}</span><span className="fw-semibold">{sharedBatchAttributes.sourceFarm || "-"}</span></div>}
                                {sharedBatchAttributes.origin === "purchased" && (
                                    <>
                                        <div><span className="text-muted d-block">{t('form.pig.batch.pricePerPig')}</span><span className="fw-semibold">${sharedBatchAttributes.purchasePrice?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                                        <div><span className="text-muted d-block">{t('form.pig.batch.totalCost')}</span><span className="fw-bold fs-5 text-success">${((sharedBatchAttributes.purchasePrice || 0) * Number(pigsBatchLength)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                        <Card className="w-100 shadow-sm">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                <span className="text-black">{t('form.pig.section.pigInfo')}</span>
                            </CardHeader>
                            <CardBody className="flex-fill p-0">
                                <SimpleBar style={{ maxHeight: 400 }}>
                                    <CustomTable columns={pigColumns} data={pigsBatch} showPagination={false} showSearchAndFilter={false} />
                                </SimpleBar>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => setActiveStep(1)}>
                            <i className="ri-arrow-left-line me-2" />{t('form.pig.action.prev')}
                        </Button>
                        <Button className="ms-auto btn-success" onClick={() => handleCreatePigBatch()} disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="sm" /> : <><i className="ri-check-line me-2" />{t('form.pig.action.register')}</>}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal isOpen={modals.success} onClose={onSave} message={t('form.pig.success.pigsRegistered')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('form.pig.error.register')} />
        </>
    );
};

export default BatchPigForm;
