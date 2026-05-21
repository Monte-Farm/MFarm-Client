import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Badge, Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import SimpleBar from "simplebar-react";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";

interface ProcessPigReplacementFormProps {
    groupId: string;
    onSave: () => void;
}

const ProcessPigReplacementForm: React.FC<ProcessPigReplacementFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const { t } = useTranslation();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [group, setGroup] = useState<any>();
    const [allPigs, setAllPigs] = useState<any[]>([]);
    const [selectedPigs, setSelectedPigs] = useState<any[]>([]);
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalGroupWeight, setTotalGroupWeight] = useState<string>('');
    const [earTagsMap, setEarTagsMap] = useState<Record<number, string>>({});

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            const modifiedSteps = [...passedarrowSteps, tab];
            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const fetchGroup = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`);
            const groupDetails = groupResponse.data.data;
            const filteredPigs = groupDetails.pigsInGroup.filter((p: any) => p.status === 'alive');
            const pigsWithId = filteredPigs.map((b: any) => ({ ...b, id: b._id }));
            setAllPigs(pigsWithId);
            setGroup(groupDetails);
        } catch (error) {
            logger.error('Error fetching data:', { error });
            toggleModal('error');
        } finally {
            setLoading(false);
        }
    };

    const buildWeighings = () => {
        return selectedPigs.map(pig => ({
            pigId: pig._id,
            groupId: groupId,
            weight: Number(pig.newWeight),
            weighedAt: new Date(),
            isGroupAverage: !useIndividualWeight,
            registeredBy: userLogged._id
        }));
    };

    const buildPigUpdates = () => {
        return selectedPigs.map((pig, index) => ({
            pigId: pig._id,
            newWeight: Number(pig.newWeight),
            earTag: earTagsMap[index] || undefined,
        }));
    };

    const calculateAverage = () => {
        const total = selectedPigs.reduce((sum, p) => sum + Number(p.newWeight), 0);
        return total / selectedPigs.length;
    };

    const handleProcessReplacement = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const allIds = selectedPigs.map(p => p._id);
            const femaleCount = selectedPigs.filter(p => p.sex === 'female').length;
            const maleCount = selectedPigs.filter(p => p.sex === 'male').length;

            // Retirar todos los cerdos del grupo de crecimiento
            await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, {
                responsible: userLogged._id,
                femaleCount,
                maleCount,
                date: new Date(),
                withdrawReason: t('groups.form.processReplacement.withdrawReason'),
                pigsSelected: allIds.map(id => ({ _id: id }))
            });

            // Cambiar etapa a breeder para todos
            await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`, {
                pigsIds: allIds,
                newStage: 'breeder',
                userId: userLogged._id,
            });

            // Registrar pesajes individuales
            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, buildWeighings());

            // Registrar pesaje promedio del grupo de origen
            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight: calculateAverage(),
                pigsCount: selectedPigs.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id
            });

            // Actualizar pesos y aretes
            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, buildPigUpdates());

            // Desactivar flag de reemplazo del grupo
            await configContext.axiosHelper.put(`${configContext.apiUrl}/group/update_replacement_flag/${groupId}`, {
                isReady: false,
                userId: userLogged._id
            });

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Procesamiento de reemplazo del grupo ${group.code} registrado`
            });

            toggleModal('success');
        } catch (err) {
            logger.error('Error processing replacement:', { err });
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, []);

    useEffect(() => {
        if (!useIndividualWeight && totalGroupWeight && selectedPigs.length > 0) {
            const averageWeight = Number(totalGroupWeight) / selectedPigs.length;
            setSelectedPigs(prev => prev.map(pig => ({ ...pig, newWeight: averageWeight })));
        }
    }, [totalGroupWeight, useIndividualWeight]);

    const handlePigSelection = (pigs: any[]) => {
        const pigsWithWeight = pigs.map(pig => ({ ...pig, newWeight: '' }));
        setSelectedPigs(pigsWithWeight);
    };

    if (loading) {
        return <LoadingAnimation absolutePosition={false} />;
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink href='#' className={classnames({ active: activeStep === 1, done: activeStep > 1 })} disabled>
                            {t("groups.form.processReplacement.step.pigSelection")}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href='#' className={classnames({ active: activeStep === 2, done: activeStep > 2 })} disabled>
                            {t("groups.form.processReplacement.step.pigWeight")}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href='#' className={classnames({ active: activeStep === 3, done: activeStep > 3 })} disabled>
                            {t("groups.form.processReplacement.step.earTag")}
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink href='#' className={classnames({ active: activeStep === 4, done: activeStep > 4 })} disabled>
                            {t("groups.form.processReplacement.step.summary")}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                {/* Paso 1: Selección de cerdos */}
                <TabPane tabId={1}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">{t("groups.form.processReplacement.selectPigsTitle")}</h5>
                        <p className="text-muted small">{t("groups.form.processReplacement.selectPigsHint")}</p>
                    </div>

                    <SelectableCustomTable
                        columns={[
                            {
                                header: t('pigs.field.code'),
                                accessor: 'code',
                                type: 'text',
                                render: (_, row) => {
                                    const index = allPigs.findIndex(p => p._id === row._id);
                                    return <span className="text-black">#{index + 1}</span>;
                                }
                            },
                            {
                                header: t('common.field.sex'),
                                accessor: 'sex',
                                render: (value: string) => (
                                    <Badge color={value === 'male' ? "info" : "danger"}>
                                        {value === 'male' ? t("common.sex.male") : t("common.sex.female")}
                                    </Badge>
                                ),
                            },
                            { header: t("common.field.weightCurrent"), accessor: 'weight', type: 'text' },
                        ]}
                        data={allPigs}
                        selectionMode="multiple"
                        onSelect={handlePigSelection}
                        showSearchAndFilter={false}
                    />

                    <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                        <span className="text-muted small">
                            {t("groups.form.processReplacement.pigsSelected")} <strong>{selectedPigs.length}</strong> de <strong>{allPigs.length}</strong>
                        </span>
                        <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => toggleArrowTab(2)} disabled={selectedPigs.length === 0}>
                            {t("groups.form.processReplacement.next")}
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* Paso 2: Pesaje */}
                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">{t("groups.form.processReplacement.weightTitle")}</h5>
                        <p className="text-muted small">{t("groups.form.processReplacement.weightHint")}</p>
                    </div>

                    <div className="card border-2 border-primary bg-primary-subtle mb-3" role="button" onClick={() => setUseIndividualWeight(!useIndividualWeight)}>
                        <div className="card-body d-flex align-items-center gap-3">
                            <input className="form-check-input mt-0" type="checkbox" checked={useIndividualWeight} readOnly />
                            <FaQuestionCircle className="text-primary" size={20} />
                            <div>
                                <div className="fw-semibold">{t("groups.form.processReplacement.weightIndividual")}</div>
                                <div className="small text-muted">
                                    {useIndividualWeight
                                        ? t("groups.form.processReplacement.weightIndividualHint")
                                        : t("groups.form.processReplacement.weightTotalHint")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!useIndividualWeight && (
                        <div className="card border-secondary-subtle mb-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">{t("groups.form.processReplacement.totalWeight")}</label>
                                        <input type="number" step="0.01" className="form-control" value={totalGroupWeight} onChange={(e) => setTotalGroupWeight(e.target.value)} placeholder="0.00" />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mt-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri-calculator-line text-primary"></i>
                                                <span className="text-muted">{t("groups.form.processReplacement.avgWeightPerPig")}</span>
                                                <span className="fw-bold text-primary">
                                                    {totalGroupWeight && selectedPigs.length > 0
                                                        ? (Number(totalGroupWeight) / selectedPigs.length).toFixed(2)
                                                        : '0.00'} kg
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <i className="ri-group-line text-info"></i>
                                                <span className="text-muted">{t("groups.form.processReplacement.totalPigs")}</span>
                                                <span className="fw-bold text-info">{selectedPigs.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {useIndividualWeight && (
                        <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                            {selectedPigs.map((pig, index) => {
                                const isMale = pig.sex === 'male';
                                const accentColor = isMale ? 'primary' : 'danger';
                                return (
                                    <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                        <div className="card-body p-3">
                                            <div className="row align-items-center">
                                                <div className="col-auto">
                                                    <div className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                                                        <i className={`ri-${isMale ? 'men-line' : 'women-line'} fs-4 text-${accentColor}`}></i>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <h6 className="mb-0 fw-bold text-dark">{t("groups.form.processReplacement.pigLabel")} {pig.code}</h6>
                                                    <span className={`badge bg-${accentColor} bg-opacity-25 text-${accentColor} text-uppercase px-2`} style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                                                        {isMale ? t("common.sex.maleShort") : t("common.sex.femaleShort")}
                                                    </span>
                                                </div>
                                                <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                    <small className="text-muted">{t("groups.form.processReplacement.currentWeight")}: {pig.weight} kg</small>
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted small">
                                                            <i className="ri-scales-3-line text-black"></i>
                                                        </span>
                                                        <input
                                                            type="number" step="0.01"
                                                            className="form-control border-start-0 bg-light fw-semibold text-end"
                                                            placeholder="0.00"
                                                            value={selectedPigs[index].newWeight}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                const arr = [...selectedPigs];
                                                                arr[index].newWeight = v === '' ? '' : Number(v);
                                                                setSelectedPigs(arr);
                                                            }}
                                                            onFocus={() => {
                                                                if (selectedPigs[index].newWeight === 0) {
                                                                    const arr = [...selectedPigs]; arr[index].newWeight = ''; setSelectedPigs(arr);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (selectedPigs[index].newWeight === '') {
                                                                    const arr = [...selectedPigs]; arr[index].newWeight = 0; setSelectedPigs(arr);
                                                                }
                                                            }}
                                                        />
                                                        <span className="input-group-text bg-light fw-bold text-muted">kg</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </SimpleBar>
                    )}

                    <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(1)}>
                            <i className="ri-arrow-left-line me-2" />{t("groups.form.processReplacement.back")}
                        </Button>
                        <span className="text-muted small">{t("groups.form.processReplacement.totalRecords")}: <strong>{selectedPigs.length}</strong></span>
                        <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => toggleArrowTab(3)}>
                            {t("groups.form.processReplacement.next")}<i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* Paso 3: Aretes */}
                <TabPane tabId={3}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">{t("groups.form.processReplacement.earTagTitle")}</h5>
                        <p className="text-muted small">{t("groups.form.processReplacement.earTagHint")}</p>
                    </div>

                    <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                        {selectedPigs.map((pig, index) => {
                            const isMale = pig.sex === 'male';
                            const accentColor = isMale ? 'primary' : 'danger';
                            return (
                                <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                    <div className="card-body p-3">
                                        <div className="row align-items-center">
                                            <div className="col-auto">
                                                <div className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                                                    <i className={`ri-${isMale ? 'men-line' : 'women-line'} fs-4 text-${accentColor}`}></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h6 className="mb-0 fw-bold text-dark">{t("groups.form.processReplacement.pigLabel")} {pig.code}</h6>
                                                <span className={`badge bg-${accentColor} bg-opacity-25 text-${accentColor} text-uppercase px-2`} style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                                                    {isMale ? t("common.sex.maleShort") : t("common.sex.femaleShort")}
                                                </span>
                                            </div>
                                            <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                <label className="form-label small text-muted mb-1">{t("pigs.field.earTag")}</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder={t("pigs.field.earTagPlaceholder")}
                                                    value={earTagsMap[index] ?? ''}
                                                    onChange={(e) => setEarTagsMap(prev => ({ ...prev, [index]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </SimpleBar>

                    <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(2)}>
                            <i className="ri-arrow-left-line me-2" />{t("groups.form.processReplacement.back")}
                        </Button>
                        <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => toggleArrowTab(4)}>
                            {t("groups.form.processReplacement.next")}<i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                {/* Paso 4: Resumen */}
                <TabPane tabId={4}>
                    <Card className="m-0 shadow-sm">
                        <CardHeader className="bg-light fs-5">
                            <span className="text-black">{t("groups.form.processReplacement.summaryTitle")}</span>
                        </CardHeader>
                        <CardBody className="p-3">
                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <div className="border rounded p-2 text-center">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-parent-line fs-5 text-primary me-1"></i>
                                            <span className="text-muted fw-semibold">{t("common.total")}</span>
                                        </div>
                                        <h4 className="mb-0 text-primary fw-bold">{selectedPigs.length}</h4>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="border rounded p-2 text-center">
                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                            <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                            <span className="text-muted fw-semibold">{t("groups.form.processReplacement.avgWeight")}</span>
                                        </div>
                                        <h4 className="mb-0 text-success fw-bold">
                                            {selectedPigs.length > 0
                                                ? (selectedPigs.reduce((acc, p) => acc + Number(p.newWeight), 0) / selectedPigs.length).toFixed(2)
                                                : '0.00'} kg
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            <div className="text-muted fw-semibold mb-2">{t("groups.form.processReplacement.pigDetails")}</div>
                            <SimpleBar style={{ maxHeight: '300px' }}>
                                <table className="table table-hover table-sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">#</th>
                                            <th className="text-center">{t("common.field.sex")}</th>
                                            <th className="text-center">{t("common.field.weight")}</th>
                                            <th className="text-center">{t("pigs.field.earTag")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPigs.map((pig, index) => (
                                            <tr key={index}>
                                                <td className="text-center">{index + 1}</td>
                                                <td className="text-center">
                                                    <Badge color={pig.sex === 'male' ? "info" : "danger"}>
                                                        {pig.sex === 'male' ? "♂" : "♀"}
                                                    </Badge>
                                                </td>
                                                <td className="text-center">{parseFloat(String(pig.newWeight)).toFixed(2)} kg</td>
                                                <td className="text-center">{earTagsMap[index] || <span className="text-muted">—</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </SimpleBar>
                        </CardBody>
                    </Card>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(3)}>
                            <i className="ri-arrow-left-line me-2" />{t("groups.form.processReplacement.back")}
                        </Button>
                        <Button className="ms-auto btn-success" disabled={isSubmitting} onClick={() => toggleModal('confirm')}>
                            {isSubmitting ? <Spinner size='sm' /> : <><i className="ri-check-line me-2" />{t("groups.form.processReplacement.process")}</>}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>{t("groups.modal.processReplacement")}</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>
                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">{t("groups.form.processReplacement.confirmTitle")}</h4>
                    </div>
                    <div className="text-center text-muted fs-5 mb-4">
                        {t("groups.form.processReplacement.confirmBody")}
                    </div>
                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>{t("groups.form.processReplacement.confirmWarning")}</strong>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="success" onClick={() => handleProcessReplacement()}>
                        {isSubmitting ? <Spinner size='sm' /> : <><i className="ri ri-check-line me-2" />{t("groups.form.processReplacement.confirm")}</>}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t("groups.form.processReplacement.successMsg")} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t("common.error.generic")} />
        </>
    );
};

export default ProcessPigReplacementForm;
