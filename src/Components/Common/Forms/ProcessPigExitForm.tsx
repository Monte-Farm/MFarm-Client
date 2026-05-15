import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { FaInfo, FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import ObjectDetails from "../Details/ObjectDetails";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";
import { useTranslation } from "react-i18next";

interface ProcessPigExitFormProps {
    groupId: string;
    onSave: () => void;
}

const ProcessPigExitForm: React.FC<ProcessPigExitFormProps> = ({ groupId, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [group, setGroup] = useState<any>()
    const [pigsArray, setPigsArray] = useState<any[]>([]);
    const [compatibleReplacementGroups, setCompatibleReplacementGroups] = useState<any[]>([]);
    const [compatibleSalesGroups, setCompatibleSalesGroups] = useState<any[]>([]);
    const [newReplacementGroup, setNewReplacementGroup] = useState<boolean>(false);
    const [newSalesGroup, setNewSalesGroup] = useState<boolean>(false);
    const [selectedReplacementCompatibleGroup, setSelecteReplacementCompatibleGroup] = useState<any | null>(null)
    const [selectedSaleCompatibleGroup, setSelectesSaleCompatibleGroup] = useState<any | null>(null)

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const groupsColumns: Column<any>[] = [
        { header: t('groups.column.code'), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('groups.column.name'), accessor: 'name', type: 'text', isFilterable: true },
        {
            header: t('groups.column.area'),
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = t("groups.area.unknown");

                switch (row.area) {
                    case "gestation":
                        color = "info";
                        text = t("groups.area.gestation");
                        break;
                    case "farrowing":
                        color = "primary";
                        text = t("groups.area.farrowing");
                        break;
                    case "maternity":
                        color = "primary";
                        text = t("groups.area.maternity");
                        break;
                    case "weaning":
                        color = "success";
                        text = t("groups.area.weaning");
                        break;
                    case "nursery":
                        color = "warning";
                        text = t("groups.area.nursery");
                        break;
                    case "fattening":
                        color = "dark";
                        text = t("groups.area.fattening");
                        break;
                    case "replacement":
                        color = "secondary";
                        text = t("groups.area.replacement");
                        break;
                    case "boars":
                        color = "info";
                        text = t("groups.area.boars");
                        break;
                    case "quarantine":
                        color = "danger";
                        text = t("groups.area.quarantine");
                        break;
                    case "hospital":
                        color = "danger";
                        text = t("groups.area.hospital");
                        break;
                    case "shipping":
                        color = "secondary";
                        text = t("groups.area.shipping");
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('groups.column.stage'),
            accessor: 'currentStage',
            render: (value, obj) => {
                let color = "secondary";
                let label = obj.stage;

                switch (obj.stage) {
                    case "piglet":
                        color = "info";
                        label = t("groups.stage.piglet");
                        break;
                    case "weaning":
                        color = "warning";
                        label = t("groups.stage.weaning");
                        break;
                    case "fattening":
                        color = "primary";
                        label = t("groups.stage.fattening");
                        break;
                    case "breeder":
                        color = "success";
                        label = t("groups.stage.breeder");
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('groups.column.creationDate'), accessor: 'creationDate', type: 'date', isFilterable: true },
        { header: t('groups.column.femaleCount'), accessor: 'femaleCount', type: 'text', isFilterable: true },
        { header: t('groups.column.maleCount'), accessor: 'maleCount', type: 'text', isFilterable: true },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: t('pigs.field.code'),
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">Cerdo {row.code}</span>
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
        { header: t('common.field.weight'), accessor: 'weight', type: 'text' },
    ]

    const groupAttributes: Attribute[] = [
        { key: "code", label: t("common.field.code"), type: "text" },
        { key: "name", label: t("common.field.name"), type: "text" },
        {
            key: "area",
            label: t("groups.column.area"),
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = t("groups.area.unknown");

                switch (row?.area) {
                    case "gestation":
                        color = "info";
                        text = t("groups.area.gestation");
                        break;
                    case "farrowing":
                        color = "primary";
                        text = t("groups.area.farrowing");
                        break;
                    case "maternity":
                        color = "primary";
                        text = t("groups.area.maternity");
                        break;
                    case "weaning":
                        color = "success";
                        text = t("groups.area.weaning");
                        break;
                    case "nursery":
                        color = "warning";
                        text = t("groups.area.nursery");
                        break;
                    case "fattening":
                        color = "dark";
                        text = t("groups.area.fattening");
                        break;
                    case "replacement":
                        color = "secondary";
                        text = t("groups.area.replacement");
                        break;
                    case "boars":
                        color = "info";
                        text = t("groups.area.boars");
                        break;
                    case "quarantine":
                        color = "danger";
                        text = t("groups.area.quarantine");
                        break;
                    case "hospital":
                        color = "danger";
                        text = t("groups.area.hospital");
                        break;
                    case "shipping":
                        color = "secondary";
                        text = t("groups.area.shipping");
                        break;
                    case "exit":
                        color = "secondary";
                        text = t("groups.area.exit");
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: "status",
            label: t("common.field.status"),
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = t("groups.area.unknown");

                switch (row?.status) {
                    case "weaning":
                        color = "info";
                        text = t("groups.status.weaning");
                        break;
                    case "ready_to_grow":
                        color = "primary";
                        text = t("groups.status.ready_to_grow");
                        break;
                    case "grow_overdue":
                        color = "warning";
                        text = t("groups.status.grow_overdue");
                        break;
                    case "growing":
                        color = "success";
                        text = t("groups.status.growing");
                        break;
                    case "replacement":
                        color = "secondary";
                        text = t("groups.status.replacement");
                        break;
                    case "ready_for_sale":
                        color = "success";
                        text = t("groups.status.ready_for_sale");
                        break;
                    case "sale":
                        color = "success";
                        text = t("groups.status.sale");
                        break;
                    case "sold":
                        color = "success";
                        text = t("groups.status.sold");
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: "creationDate", label: t("groups.column.creationDate"), type: "date" },
        { key: "observations", label: t("common.field.observations"), type: "text" },
    ];


    const fetchGroup = async () => {
        if (!configContext || !groupId) return;
        try {
            setLoading(true);
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            const groupDetails = groupResponse.data.data

            const filteredPigs = groupDetails.pigsInGroup.filter((p: any) => p.status === 'alive')
            setPigsArray(
                filteredPigs.map((pig: PigData) => ({
                    ...pig,
                    newWeight: '',
                    destination: ''
                }))
            );

            setGroup(groupDetails)

            const replacementGroupsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_compatible_replacement_groups/${userLogged.farm_assigned}/${groupDetails.creationDate}`)
            const saleGroupsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_compatible_sale_groups/${userLogged.farm_assigned}/${groupDetails.creationDate}`)

            const replacementGroupsData = replacementGroupsResponse.data.data;
            const saleGroupsData = saleGroupsResponse.data.data;

            const replacementGroupsWithId = replacementGroupsData.map((b: any) => ({ ...b, id: b._id }));
            const saleGroupsWithId = saleGroupsData.map((b: any) => ({ ...b, id: b._id }));

            setCompatibleReplacementGroups(replacementGroupsWithId);
            setCompatibleSalesGroups(saleGroupsWithId);

            replacementGroupsData.length === 0 ? setNewReplacementGroup(true) : setNewReplacementGroup(false)
            saleGroupsData.length === 0 ? setNewSalesGroup(true) : setNewSalesGroup(false)
        } catch (error) {
            logger.error('Error fetching data:', { error });
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    const buildWeighings = () => {
        return pigsArray.map(pig => ({
            pigId: pig._id,
            groupId: groupId,
            weight: Number(pig.newWeight),
            weighedAt: new Date(),
            isGroupAverage: false,
            registeredBy: userLogged._id
        }));
    };

    const buildPigUpdates = () => {
        return pigsArray.map(pig => ({
            pigId: pig._id,
            newWeight: Number(pig.newWeight),
        }));
    };

    const calculateAverage = (pigs: any[]) => {
        const total = pigs.reduce((sum, p) => sum + Number(p.newWeight), 0);
        return total / pigs.length;
    };


    const processReplacementGroup = async () => {
        if (!configContext) return;
        try {
            if (newReplacementGroup) {
                const nextGroupCodeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
                const nextCode = nextGroupCodeResponse.data.data;

                const replacementSows = pigsArray.filter((s: any) => s.sex === 'female' && s.destination === 'replacement');
                const sowsReplacementIds = replacementSows.map(s => s._id)
                const avgWeight = calculateAverage(replacementSows)

                const sowsReplacementGroupData: GroupData = {
                    code: nextCode,
                    name: nextCode,
                    farm: userLogged.farm_assigned,
                    area: 'replacement',
                    creationDate: new Date(),
                    stage: "breeder",
                    status: 'replacement',
                    groupMode: "linked",
                    pigsInGroup: replacementSows.map(s => s._id),
                    pigCount: replacementSows.length,
                    maleCount: 0,
                    femaleCount: replacementSows.length,
                    avgWeight: avgWeight,
                    responsible: userLogged?._id,
                    observations: "",
                    observationsHistory: [],
                    groupHistory: [],
                    feedAdministrationHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                    healthEvents: [],
                    isActive: true,
                }

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, sowsReplacementGroupData)
                const groupData = groupResponse.data.data;

                await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupData._id}`, {
                    avgWeight: avgWeight,
                    pigsCount: replacementSows.length,
                    weighedAt: new Date(),
                    registeredBy: userLogged._id
                });

                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`,
                    {
                        pigsIds: sowsReplacementIds,
                        newStage: 'breeder',
                        userId: userLogged._id,
                    }
                )
            } else if (!newReplacementGroup && selectedReplacementCompatibleGroup) {
                const sowsReplacement = pigsArray.filter((s: any) => s.sex === 'female' && s.destination === 'replacement');
                const sowsReplacementIds = sowsReplacement.map(s => s._id)
                const transferedResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/transfer_all_pigs/${selectedReplacementCompatibleGroup._id}/${userLogged._id}`, sowsReplacementIds);
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`,
                    {
                        pigIds: sowsReplacementIds,
                        newStage: 'breeder',
                        userId: userLogged._id,
                    }
                )
            }
        } catch (error) {
            logger.error('Error processing replacement group:', { error })
            throw error;
        }
    }

    const processSaleGroup = async () => {
        if (!configContext) return;
        try {
            if (newSalesGroup) {
                const nextGroupCodeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
                const nextCode = nextGroupCodeResponse.data.data;

                const salePigs = pigsArray.filter((s: any) => s.destination === 'sale');
                const avgWeight = calculateAverage(salePigs)

                const salePigsGroupData: GroupData = {
                    code: nextCode,
                    name: nextCode,
                    farm: userLogged.farm_assigned,
                    area: 'sale',
                    creationDate: new Date(),
                    stage: "sale",
                    status: 'sale',
                    groupMode: "linked",
                    pigsInGroup: salePigs.map(s => s._id),
                    pigCount: salePigs.length,
                    maleCount: salePigs.filter((p: any) => p.sex === 'male').length,
                    femaleCount: salePigs.filter((p: any) => p.sex === 'female').length,
                    avgWeight: avgWeight,
                    responsible: userLogged?._id,
                    observations: "",
                    observationsHistory: [],
                    groupHistory: [],
                    feedAdministrationHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                    healthEvents: [],
                    isActive: true,
                }

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, salePigsGroupData)
                const groupData = groupResponse.data.data;

                await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupData._id}`, {
                    avgWeight: avgWeight,
                    pigsCount: salePigs.length,
                    weighedAt: new Date(),
                    registeredBy: userLogged._id
                });

                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`,
                    {
                        pigsIds: salePigs,
                        newStage: 'sale',
                        userId: userLogged._id,
                    }
                )
            } else if (!newSalesGroup && selectedSaleCompatibleGroup) {
                const salePigs = pigsArray.filter((s: any) => s.destination === 'sale');
                const salePigsIds = salePigs.map(s => s._id)

                const transferedResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/transfer_all_pigs/${selectedSaleCompatibleGroup._id}/${userLogged._id}`, salePigsIds);
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`,
                    {
                        pigIds: salePigs,
                        newStage: 'sale',
                        userId: userLogged._id,
                    }
                )
            }
        } catch (error) {
            logger.error('Error processing replacement group:', { error })
            throw error
        }
    }

    const processReplacementBoars = async () => {
        if (!configContext) return;
        try {
            const replacementBoars = pigsArray.filter((s: any) => s.sex === 'male' && s.destination === 'replacement');
            const boarsReplacementIds = replacementBoars.map(s => s._id)

            if (replacementBoars.length !== 0) {
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`,
                    {
                        pigsIds: boarsReplacementIds,
                        newStage: 'breeder',
                        userId: userLogged._id,
                    }
                )
            }
        } catch (error) {
            logger.error('Error processing replacement group:', { error })
            throw error;
        }
    }

    const handleProcessExit = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const weighings = buildWeighings();
            const newWeights = buildPigUpdates();

            await processReplacementGroup();
            await processSaleGroup();
            await processReplacementBoars();

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, newWeights);

            await configContext.axiosHelper.put(`${configContext.apiUrl}/group/change_stage/${groupId}`, {
                area: 'exit',
                stage: 'exit',
                status: 'exit_processed',
                userId: userLogged._id
            });

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Cambio de etapa al grupo ${group.code} registrado`
            });
            toggleModal('success');
        } catch (err) {
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkSelectedReplacementGroup = () => {
        if (newReplacementGroup) toggleArrowTab(activeStep + 1);

        if (!selectedReplacementCompatibleGroup && !newReplacementGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: t('pigs.exit.validation.selectReplacementGroup') });
        } else {
            toggleArrowTab(activeStep + 1)
        }
    }

    const checkSelectedSaleGroup = () => {
        if (newSalesGroup) toggleArrowTab(activeStep + 1);

        if (!selectedSaleCompatibleGroup && !newSalesGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: t('pigs.exit.validation.selectSaleGroup') });
        } else {
            toggleArrowTab(activeStep + 1)
        }
    }

    useEffect(() => {
        fetchGroup();
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
                            {t('pigs.exit.step.weightDestination')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-groupIntegration-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-groupIntegration-tab"
                            disabled
                        >
                            {t('pigs.exit.step.replacementGroup')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-groupIntegration-tab"
                            className={classnames({
                                active: activeStep === 3,
                                done: activeStep > 3,
                            })}
                            aria-selected={activeStep === 3}
                            aria-controls="step-groupIntegration-tab"
                            disabled
                        >
                            {t('pigs.exit.step.saleGroup')}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 4,
                                done: activeStep > 4,
                            })}
                            aria-selected={activeStep === 4}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('pigs.exit.step.summary')}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <Label>
                        <h5>{t('pigs.exit.field.pigWeight')}</h5>
                    </Label>
                    <div className="mt-3">
                        <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                            {pigsArray.map((pig, index) => {
                                const isMale = pig.sex === 'male';
                                const accentColor = isMale ? 'primary' : 'danger';

                                return (
                                    <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ transition: 'transform 0.2s', borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                        <div className="card-body p-3">
                                            <div className="row align-items-center">

                                                {/* Info del Cerdo - Ajustado para mayor contraste */}
                                                <div className="col-auto">
                                                    <div className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                                                        <i className={`ri-${isMale ? 'men-line' : 'women-line'} fs-4 text-${accentColor}`}></i>
                                                    </div>
                                                </div>

                                                <div className="col">
                                                    <h6 className="mb-0 fw-bold text-dark">Cerdo {pig.code}</h6>
                                                    <span className={`badge bg-${accentColor} bg-opacity-25 text-${accentColor} text-uppercase px-2`} style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                                                        {isMale ? t('common.sex.male') : t('common.sex.female')}
                                                    </span>
                                                </div>


                                                {/* Input de Peso */}
                                                <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                    <small className="text-muted">
                                                        {t('pigs.exit.field.current')} {pig.weight} kg
                                                    </small>

                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted small">
                                                            <i className="ri-scales-3-line text-black"></i>
                                                        </span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="form-control border-start-0 bg-light fw-semibold text-end"
                                                            placeholder="0.00"
                                                            value={pigsArray[index].newWeight}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const newArray = [...pigsArray];
                                                                newArray[index].newWeight = value === '' ? '' : Number(value);
                                                                setPigsArray(newArray);
                                                            }}
                                                            onFocus={() => {
                                                                if (pigsArray[index].weight === 0) {
                                                                    const newArray = [...pigsArray];
                                                                    newArray[index].newWeight = '';
                                                                    setPigsArray(newArray);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (pigsArray[index].weight === '') {
                                                                    const newArray = [...pigsArray];
                                                                    newArray[index].newWeight = 0;
                                                                    setPigsArray(newArray);
                                                                }
                                                            }}
                                                        />
                                                        <span className="input-group-text bg-light fw-bold text-muted">kg</span>
                                                    </div>
                                                </div>

                                                <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                    <small className="text-muted">
                                                        {t('pigs.exit.field.destination')}
                                                    </small>

                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted small">
                                                            <i className="ri-route-line text-black" ></i>
                                                        </span>

                                                        <select
                                                            className="form-select border-start-0 bg-light fw-semibold"
                                                            value={pigsArray[index].destination || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const newArray = [...pigsArray];
                                                                newArray[index].destination = value;
                                                                setPigsArray(newArray);
                                                            }}
                                                        >
                                                            <option value="" disabled>{t('pigs.exit.destination.select')}</option>
                                                            <option value="sale">{t('pigs.exit.destination.sale')}</option>
                                                            <option value="replacement">{t('pigs.exit.destination.replacement')}</option>
                                                            {/* <option value="slaughter">Sacrificio</option> */}
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </SimpleBar>

                        <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                            <span className="text-muted small">
                                {t('pigs.exit.field.totalRecords')} <strong>{pigsArray.length}</strong>
                            </span>
                            <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => setActiveStep(activeStep + 1)}>
                                {t('common.button.next')}
                                <i className="ri-arrow-right-line ms-2" />
                            </Button>
                        </div>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div>
                        {compatibleReplacementGroups && compatibleReplacementGroups.length === 0 ? (
                            <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                <FaInfo size={22} />

                                <div>
                                    <div className="fw-semibold">
                                        {t('pigs.exit.replacement.noCompatible')}
                                    </div>
                                    <div className="small">
                                        {t('pigs.exit.replacement.willCreate')}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-3">
                                <div className={`card border-2 ${newReplacementGroup ? "border-primary bg-primary-subtle" : "border-secondary-subtle"}`} role="button" onClick={() => setNewReplacementGroup(!newReplacementGroup)}>
                                    <div className="card-body d-flex align-items-center gap-3">
                                        <Input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            checked={newReplacementGroup}
                                            readOnly
                                        />

                                        <FaInfo className="text-primary" size={20} />

                                        <div>
                                            <div className="fw-semibold">
                                                {t('pigs.exit.replacement.createNew')}
                                            </div>
                                            <div className="small text-muted">
                                                {t('pigs.exit.replacement.noMix')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SelectableCustomTable
                                    columns={groupsColumns}
                                    data={compatibleReplacementGroups}
                                    selectionMode="single"
                                    onSelect={(rows) => setSelecteReplacementCompatibleGroup(rows[0])}
                                    disabled={newReplacementGroup}
                                    showSearchAndFilter={false}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button className="ms-auto" onClick={() => checkSelectedReplacementGroup()}>
                            {t('common.button.next')}
                            < i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div>
                        {compatibleSalesGroups && compatibleSalesGroups.length === 0 ? (
                            <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                <FaInfo size={22} />

                                <div>
                                    <div className="fw-semibold">
                                        {t('pigs.exit.sale.noCompatible')}
                                    </div>
                                    <div className="small">
                                        {t('pigs.exit.sale.willCreate')}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-3">
                                <div className={`card border-2 ${newSalesGroup ? "border-primary bg-primary-subtle" : "border-secondary-subtle"}`} role="button" onClick={() => setNewSalesGroup(!newSalesGroup)}>
                                    <div className="card-body d-flex align-items-center gap-3">
                                        <Input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            checked={newSalesGroup}
                                            readOnly
                                        />

                                        <FaInfo className="text-primary" size={20} />

                                        <div>
                                            <div className="fw-semibold">
                                                {t('pigs.exit.sale.createNew')}
                                            </div>
                                            <div className="small text-muted">
                                                {t('pigs.exit.sale.noMix')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SelectableCustomTable
                                    columns={groupsColumns}
                                    data={compatibleSalesGroups}
                                    selectionMode="single"
                                    onSelect={(rows) => setSelectesSaleCompatibleGroup(rows[0])}
                                    disabled={newSalesGroup}
                                    showSearchAndFilter={false}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button className="ms-auto" onClick={() => checkSelectedSaleGroup()}>
                            {t('common.button.next')}
                            < i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={4}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d-flex flex-column w-50">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('pigs.exit.summary.groupInfo')}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={groupAttributes} object={group} />
                                </CardBody>
                            </Card>

                            <Card className="w-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('pigs.exit.summary.saleGroupDest')}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    {newReplacementGroup && newReplacementGroup === true ? (
                                        <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                            <FaInfo size={22} />

                                            <div>
                                                <div className="fw-semibold">
                                                    {t('pigs.exit.summary.newSaleGroup')}
                                                </div>
                                                <div className="small">
                                                    {t('pigs.exit.summary.willCreateSale')}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ObjectDetails attributes={groupAttributes} object={selectedSaleCompatibleGroup} />
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="d-flex flex-column w-50 gap-3">
                            <Card className="w-100 h-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('pigs.exit.summary.pigWeight')}</span>
                                </CardHeader>
                                <CardBody className='flex-fill p-0'>
                                    <SimpleBar style={{ maxHeight: 400 }}>
                                        <CustomTable
                                            columns={pigletsColumns}
                                            data={pigsArray}
                                            showPagination={false}
                                            showSearchAndFilter={false}
                                            rowsPerPage={4}
                                        />
                                    </SimpleBar>
                                </CardBody>
                            </Card>

                            <Card className="w-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('pigs.exit.summary.replacementGroupDest')}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    {newReplacementGroup && newReplacementGroup === true ? (
                                        <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                            <FaInfo size={22} />

                                            <div>
                                                <div className="fw-semibold">
                                                    {t('pigs.exit.summary.newReplacementGroup')}
                                                </div>
                                                <div className="small">
                                                    {t('pigs.exit.summary.willCreateReplacement')}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ObjectDetails attributes={groupAttributes} object={selectedReplacementCompatibleGroup} />
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back')}
                        </Button>

                        <Button className="ms-auto btn-success" disabled={isSubmitting} onClick={() => toggleModal('confirm')}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    {t('pigs.exit.button.process')}
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>


            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>{t('pigs.exit.confirm.title')}</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">{t('pigs.exit.confirm.question')}</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        {t('pigs.exit.confirm.body')}
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>{t('pigs.exit.confirm.warning')}</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button class Name="" color="success" onClick={() => handleProcessExit()}>
                        {isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <>
                                <i className="ri ri-check-line me-2" />
                                {t('pigs.exit.button.confirm')}
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('pigs.exit.success')} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('pigs.exit.error')} />
        </>
    );
};

export default ProcessPigExitForm;
