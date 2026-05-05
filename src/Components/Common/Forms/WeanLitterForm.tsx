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

interface WeanLitterFormProps {
    litterId: string;
    onSave: () => void;
}

const WeanLitterForm: React.FC<WeanLitterFormProps> = ({ litterId, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [litter, setLitter] = useState<any>()
    const [pigletsArray, setPigletsArray] = useState<PigData[]>([]);
    const [compatibleGroups, setCompatibleGroups] = useState<any[]>([]);
    const [newGroup, setNewGroup] = useState<boolean>(false);
    const [selectedCompatibleGroup, setSelectecCompatibleGroup] = useState<any | null>(null)
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalLitterWeight, setTotalLitterWeight] = useState<string>('');

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
        { header: t('groups.column.code', { defaultValue: 'Codigo' }), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('groups.column.name', { defaultValue: 'Nombre' }), accessor: 'name', type: 'text', isFilterable: true },
        {
            header: t('groups.column.area', { defaultValue: 'Área' }),
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                const color = {
                    gestation: 'info', farrowing: 'primary', maternity: 'primary', weaning: 'success',
                    nursery: 'warning', fattening: 'dark', replacement: 'secondary', boars: 'info',
                    quarantine: 'danger', hospital: 'danger', shipping: 'secondary'
                }[row.area as string] || 'secondary';
                const text = t(`groups.area.${row.area}`, { defaultValue: row.area });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: t('groups.column.stage', { defaultValue: 'Etapa' }),
            accessor: 'currentStage',
            render: (value, obj) => {
                const color = obj.stage === 'piglet' ? 'info' : obj.stage === 'weaning' ? 'warning' : obj.stage === 'fattening' ? 'primary' : obj.stage === 'breeder' ? 'success' : 'secondary';
                const label = t(`pigs.stage.${obj.stage}`, { defaultValue: obj.stage });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('groups.column.creationDate', { defaultValue: 'Fecha de creación' }), accessor: 'creationDate', type: 'date', isFilterable: true },
        { header: t('groups.column.femaleCount', { defaultValue: 'No. de hembras' }), accessor: 'femaleCount', type: 'text', isFilterable: true },
        { header: t('groups.column.maleCount', { defaultValue: 'No. de machos' }), accessor: 'maleCount', type: 'text', isFilterable: true },
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: t('litter.pigletColumn.sex', { defaultValue: 'Lechón' }),
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">{t('litter.wean.pigletNumber', { number: pigletsArray.indexOf(row) + 1, defaultValue: `Lechón #${pigletsArray.indexOf(row) + 1}` })}</span>
        },
        {
            header: t('litter.pigletColumn.sex', { defaultValue: 'Sexo' }),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {t(`common.sex.${value}`, { defaultValue: value === 'male' ? '♂ Macho' : '♀ Hembra' })}
                </Badge>
            ),
        },
        {
            header: t('litter.pigletColumn.weight', { defaultValue: 'Peso' }),
            accessor: 'weight',
            type: 'text',
            render: (value: string) => `${parseFloat(value).toFixed(2)} kg`
        },
    ]

    const litterAttributes: Attribute[] = [
        { key: 'code', label: t('litter.attr.code', { defaultValue: 'Codigo' }), type: 'text' },
        { key: 'birthDate', label: t('litter.attr.birthDate', { defaultValue: 'Fecha de nacimiento' }), type: 'date' },
        {
            key: 'status',
            label: t('common.field.status', { defaultValue: 'Estado' }),
            type: 'text',
            render: (value, object) => {
                const color = value === 'active' ? 'warning' : value === 'weaned' ? 'success' : value === 'ready_to_wean' ? 'success' : 'secondary';
                const label = t(`litter.status.${value}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            }
        },
    ]

    const groupAttributes: Attribute[] = [
        { key: 'code', label: t('groups.column.code', { defaultValue: 'Codigo' }), type: 'text' },
        { key: 'name', label: t('groups.column.name', { defaultValue: 'nombre' }), type: 'text' },
        {
            key: 'area',
            label: t('groups.column.area', { defaultValue: 'Area' }),
            type: 'text',
            render: (value, row) => {
                const color = {
                    gestation: 'info', farrowing: 'primary', maternity: 'primary', weaning: 'success',
                    nursery: 'warning', fattening: 'dark', replacement: 'secondary', boars: 'info',
                    quarantine: 'danger', hospital: 'danger', shipping: 'secondary'
                }[value as string] || 'secondary';
                const text = t(`groups.area.${value}`, { defaultValue: value });
                return <Badge color={color}>{text}</Badge>;
            },
        },
    ]

    const fetchLitter = async () => {
        if (!configContext || !litterId) return;
        try {
            setLoading(true);
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            const litterDetails = litterResponse.data.data
            setLitter(litterDetails)

            const groupsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_compatible_wean_groups/${userLogged.farm_assigned}/${litterDetails.birthDate}`)
            const groupsData = groupsResponse.data.data;
            if (groupsData.length === 0) setNewGroup(true)

            const groupsWithId = groupsResponse.data.data.map((b: any) => ({ ...b, id: b._id }));
            setCompatibleGroups(groupsWithId);
        } catch (error) {
            logger.error('Error fetching data:', { error });
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    const handleWeanLitter = async () => {
        if (!configContext || !userLogged) return
        try {
            setIsSubmitting(true)
            const weanedLitter = await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/wean_litter/${litterId}`, pigletsArray)
            const pigletsIds = weanedLitter.data.data;

            if (newGroup) {
                const nextGroupCodeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
                const nextCode = nextGroupCodeResponse.data.data;
                const groupData: GroupData = {
                    code: nextCode,
                    name: nextCode,
                    farm: userLogged.farm_assigned,
                    area: 'weaning',
                    creationDate: new Date(),
                    stage: "weaning",
                    status: 'weaning',
                    groupMode: "linked",
                    pigsInGroup: pigletsIds,
                    pigCount: litter?.currentMale + litter?.currentFemale,
                    maleCount: litter?.currentMale,
                    femaleCount: litter?.currentFemale,
                    avgWeight: pigletsArray.reduce((sum, p) => Number(sum) + Number(p.weight), 0) / pigletsArray.length,
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
                    litterIds: [litterId]
                }

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, groupData)
            } else if (!newGroup && selectedCompatibleGroup) {
                await configContext.axiosHelper.put(
                    `${configContext.apiUrl}/group/transfer_all_pigs/${selectedCompatibleGroup._id}/${userLogged._id}`,
                    {
                        pigIds: pigletsIds,
                        litterIds: [litterId]
                    }
                );
            }


            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Camada destetada`
            });

            toggleModal('success')
        } catch (error) {
            logger.error('Error weaning the litter: ', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkSelectedGroup = () => {
        if (newGroup) toggleArrowTab(activeStep + 1);

        if (!selectedCompatibleGroup && !newGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: t('litter.wean.selectGroupAlert', { defaultValue: 'Por favor seleccione un grupo para integrar a la camada' }) });
        } else {
            toggleArrowTab(activeStep + 1)
        }

    }

    useEffect(() => {
        fetchLitter();
    }, [])

    useEffect(() => {
        if (!litter?.piglets || litter.piglets?.length === 0) return;
        const malePiglets: PigData[] = Array.from({ length: Number(litter.currentMale) }, () => ({
            _id: '',
            code: '',
            farmId: litter.farm,
            birthdate: litter.birthDate,
            breed: litter.mother.breed,
            origin: 'born',
            status: 'alive',
            currentStage: 'piglet',
            sex: 'male',
            weight: '',
            historyChanges: [],
            feedings: [],
            feedAdministrationHistory: [],
            medications: [],
            medicationPackagesHistory: [],
            vaccinationPlansHistory: [],
            sicknessHistory: [],
            reproduction: [],
            registration_date: new Date(),
            registered_by: userLogged._id
        }));

        const femalePiglets: PigData[] = Array.from({ length: Number(litter.currentFemale) }, () => ({
            _id: '',
            code: '',
            farmId: litter.farm,
            birthdate: litter.birthDate,
            breed: litter.mother.breed,
            origin: 'born',
            status: 'alive',
            currentStage: 'piglet',
            sex: 'female',
            weight: '',
            historyChanges: [],
            feedings: [],
            feedAdministrationHistory: [],
            medications: [],
            medicationPackagesHistory: [],
            vaccinationPlansHistory: [],
            sicknessHistory: [],
            reproduction: [],
            registration_date: new Date(),
            registered_by: userLogged._id
        }));

        setPigletsArray([...malePiglets, ...femalePiglets])
    }, [litter])

    // Calcular peso promedio cuando se usa peso total
    useEffect(() => {
        if (!useIndividualWeight && totalLitterWeight && pigletsArray.length > 0) {
            const totalWeight = Number(totalLitterWeight);
            const averageWeight = totalWeight / pigletsArray.length;

            const updatedPiglets = pigletsArray.map(piglet => ({
                ...piglet,
                weight: averageWeight
            }));

            setPigletsArray(updatedPiglets);
        }
    }, [totalLitterWeight, useIndividualWeight, pigletsArray.length]);

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
                            {t('litter.wean.step1', { defaultValue: 'Peso de las camadas' })}
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
                            {t('litter.wean.groupIntegration', { defaultValue: 'Integracion a grupo' })}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 23,
                                done: activeStep > 3,
                            })}
                            aria-selected={activeStep === 3}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('litter.wean.step2', { defaultValue: 'Grupo destino' })}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <Label>
                        <h5>{t('litter.wean.pigletWeightsTitle', { defaultValue: 'Peso de los lechones al destetar' })}</h5>
                    </Label>

                    {/* Toggle para modo de peso */}
                    <div className="card border-2 border-primary bg-primary-subtle mb-3" role="button" onClick={() => setUseIndividualWeight(!useIndividualWeight)}>
                        <div className="card-body d-flex align-items-center gap-3">
                            <Input
                                className="form-check-input mt-0"
                                type="checkbox"
                                checked={useIndividualWeight}
                                readOnly
                            />
                            <FaQuestionCircle className="text-primary" size={20} />
                            <div>
                                <div className="fw-semibold">
                                    {t('litter.wean.switchIndividualWeight', { defaultValue: 'Ingresar peso individual de cada lechón' })}
                                </div>
                                <div className="small text-muted">
                                    {useIndividualWeight
                                        ? t('litter.wean.switchIndividualHint', { defaultValue: 'Ingresa el peso de cada lechón individualmente' })
                                        : t('litter.wean.switchTotalHint', { defaultValue: 'Ingresa el peso total de la camada y se asignará el peso promedio a cada lechón' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modo: Peso total de la camada */}
                    {!useIndividualWeight && (
                        <div className="card border-secondary-subtle mb-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">{t('litter.wean.enterWeight', { defaultValue: 'Ingresa el peso total de cada camada:' })}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={totalLitterWeight}
                                            onChange={(e) => setTotalLitterWeight(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mt-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri-calculator-line text-primary"></i>
                                                <span className="text-muted">{t('litter.wean.avgWeightPerPiglet', { defaultValue: 'Peso promedio por lechón:' })}</span>
                                                <span className="fw-bold text-primary">
                                                    {totalLitterWeight && pigletsArray.length > 0
                                                        ? (Number(totalLitterWeight) / pigletsArray.length).toFixed(2)
                                                        : '0.00'
                                                    } kg
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <i className="ri-group-line text-info"></i>
                                                <span className="text-muted">{t('litter.wean.totalPigletsLabel', { defaultValue: 'Total de lechones:' })}</span>
                                                <span className="fw-bold text-info">{pigletsArray.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modo: Peso individual */}
                    {useIndividualWeight && (
                        <div className="mt-3">
                            <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>
                                {pigletsArray.map((piglet, index) => (
                                    <div key={index} className="border rounded p-3 mb-2">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <p className="fw-bold mb-0">{t('litter.wean.pigletNumber', { number: index + 1, defaultValue: `Lechón #${index + 1}` })}</p>
                                            <Badge color={piglet.sex === 'male' ? "info" : "danger"}>
                                                {t(`common.sex.${piglet.sex}`, { defaultValue: piglet.sex === 'male' ? '♂ Macho' : '♀ Hembra' })}
                                            </Badge>
                                        </div>

                                        <div className="row">
                                            <div className="col-12">
                                                <label className="form-label">{t('litter.wean.weightKg', { defaultValue: 'Peso (kg)' })}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={pigletsArray[index].weight}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        const newArray = [...pigletsArray];

                                                        if (value === '') {
                                                            newArray[index].weight = '';
                                                        } else {
                                                            newArray[index].weight = Number(value);
                                                        }

                                                        setPigletsArray(newArray);
                                                    }}
                                                    onFocus={() => {
                                                        const newArray = [...pigletsArray];

                                                        if (newArray[index].weight === 0) {
                                                            newArray[index].weight = '';
                                                            setPigletsArray(newArray);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        const newArray = [...pigletsArray];

                                                        if (newArray[index].weight === '') {
                                                            newArray[index].weight = 0;
                                                            setPigletsArray(newArray);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </SimpleBar>
                        </div>
                    )}

                    <div className="mt-4 d-flex">
                        <Button className="ms-auto" onClick={() => setActiveStep(activeStep + 1)}>
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            < i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div>
                        {compatibleGroups && compatibleGroups.length === 0 ? (
                            <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                <FaInfo size={22} />

                                <div>
                                    <div className="fw-semibold">
                                        {t('litter.wean.noCompatibleGroups', { defaultValue: 'No hay grupos compatibles' })}
                                    </div>
                                    <div className="small">
                                        {t('litter.wean.noCompatibleGroupsHint', { defaultValue: 'Se creará un nuevo grupo al continuar con el destete' })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-3">
                                <div className={`card border-2 ${newGroup ? "border-primary bg-primary-subtle" : "border-secondary-subtle"}`} role="button" onClick={() => setNewGroup(!newGroup)}>
                                    <div className="card-body d-flex align-items-center gap-3">
                                        <Input
                                            className="form-check-input mt-0"
                                            type="checkbox"
                                            checked={newGroup}
                                            readOnly
                                        />

                                        <FaInfo className="text-primary" size={20} />

                                        <div>
                                            <div className="fw-semibold">
                                                {t('litter.wean.createNewGroup', { defaultValue: 'Crear nuevo grupo' })}
                                            </div>
                                            <div className="small text-muted">
                                                {t('litter.wean.dontMixGroups', { defaultValue: 'La camada no se mezclará con grupos existentes' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                < SelectableCustomTable
                                    columns={groupsColumns}
                                    data={compatibleGroups}
                                    selectionMode="single"
                                    onSelect={(rows) => setSelectecCompatibleGroup(rows[0])}
                                    disabled={newGroup}
                                    showSearchAndFilter={false}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Volver' })}
                        </Button>

                        <Button className="ms-auto" onClick={() => checkSelectedGroup()}>
                            {t('common.button.next', { defaultValue: 'Siguiente' })}
                            < i className="ri-arrow-right-line ms-2" />
                        </Button>

                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d'flex flex-column w-50">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('litter.wean.litterInfo', { defaultValue: 'Información de la camada' })}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={litterAttributes} object={litter} />
                                </CardBody>
                            </Card>

                            <Card className="w-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('litter.wean.targetGroup', { defaultValue: 'Grupo destino' })}</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    {newGroup && newGroup === true ? (
                                        <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                            <FaInfo size={22} />

                                            <div>
                                                <div className="fw-semibold">
                                                    {t('litter.wean.newGroupTitle', { defaultValue: 'Nuevo grupo' })}
                                                </div>
                                                <div className="small">
                                                    {t('litter.wean.newGroupHint', { defaultValue: 'Se creará un nuevo grupo al destetar a la camada' })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <ObjectDetails attributes={groupAttributes} object={selectedCompatibleGroup} />
                                    )}
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-50">
                            <Card className="w-100 h-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">{t('litter.wean.pigletWeights', { defaultValue: 'Peso de los lechones' })}</span>
                                </CardHeader>
                                <CardBody className='p-3'>
                                    {/* Estadísticas principales */}
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center bg-light">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-parent-line fs-5 text-primary me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('litter.wean.totalPiglets', { defaultValue: 'Total lechones' })}</span>
                                                </div>
                                                <h4 className="mb-0 text-primary fw-bold">{pigletsArray.length}</h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center bg-light">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('litter.wean.avgWeight', { defaultValue: 'Peso promedio' })}</span>
                                                </div>
                                                <h4 className="mb-0 text-success fw-bold">
                                                    {pigletsArray.length > 0
                                                        ? (pigletsArray.reduce((acc, p) => acc + Number(p.weight), 0) / pigletsArray.length).toFixed(2)
                                                        : '0.00'
                                                    } kg
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-men-line fs-5 text-info me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('litter.kpi.males', { defaultValue: 'Machos' })}</span>
                                                </div>
                                                <h4 className="mb-0 text-info fw-bold">
                                                    {pigletsArray.filter(p => p.sex === 'male').length}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-women-line fs-5 text-danger me-1"></i>
                                                    <span className="text-muted fw-semibold">{t('litter.kpi.females', { defaultValue: 'Hembras' })}</span>
                                                </div>
                                                <h4 className="mb-0 text-danger fw-bold">
                                                    {pigletsArray.filter(p => p.sex === 'female').length}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabla detallada compacta */}
                                    <div>
                                        <span className="text-muted fw-semibold d-block mb-2">{t('litter.wean.individualDetails', { defaultValue: 'Detalles individuales:' })}</span>
                                    </div>

                                    <SimpleBar style={{ maxHeight: 200 }}>
                                        <table className="table table-sm table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-center">#</th>
                                                    <th className="text-center">{t('litter.pigletColumn.sex', { defaultValue: 'Sexo' })}</th>
                                                    <th className="text-center">{t('litter.pigletColumn.weight', { defaultValue: 'Peso' })}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pigletsArray.map((piglet, index) => (
                                                    <tr key={index}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td className="text-center">
                                                            <Badge color={piglet.sex === 'male' ? "info" : "danger"} style={{ fontSize: '0.7rem' }}>
                                                                {piglet.sex === 'male' ? "♂" : "♀"}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-center">{parseFloat(String(piglet.weight)).toFixed(2)}kg</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </div>

                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Volver' })}
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => handleWeanLitter()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    {t('litter.wean.weanLitterButton', { defaultValue: 'Destetar camada' })}
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>


            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>{t('litter.wean.confirmTitle', { defaultValue: 'Destetar camada' })}</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">{t('litter.wean.confirmQuestion', { defaultValue: '¿Deseas destetar esta camada?' })}</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        {t('litter.wean.confirmInfo', { defaultValue: 'Al confirmar el destete, la camada cambiará su estado y se dará por finalizada la etapa de lactancia.' })}
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>{t('litter.wean.confirmWarning', { defaultValue: 'Asegúrate de que toda la información esté correcta antes de continuar.' })}</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button color="success" onClick={() => handleWeanLitter()}>
                        {isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <>
                                <i className="ri ri-check-line me-2" />
                                {t('litter.wean.confirmButton', { defaultValue: 'Confirmar' })}
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('litter.wean.success', { defaultValue: 'Camada destetada con éxito' })} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={t('litter.wean.error', { defaultValue: 'Ha ocurrido un error al destetar a la camada, intentelo mas tarde' })} />
        </>
    );
};

export default WeanLitterForm;
