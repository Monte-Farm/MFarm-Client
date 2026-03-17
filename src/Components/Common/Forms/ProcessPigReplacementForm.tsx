import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaInfo, FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import ObjectDetails from "../Details/ObjectDetails";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";

interface ProcessPigReplacementFormProps {
    groupId: string;
    onSave: () => void;
}

const ProcessPigReplacementForm: React.FC<ProcessPigReplacementFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [group, setGroup] = useState<any>();
    const [pigsArray, setPigsArray] = useState<any[]>([]);
    const [allPigs, setAllPigs] = useState<any[]>([]);
    const [selectedPigs, setSelectedPigs] = useState<any[]>([]);
    const [compatibleReplacementGroups, setCompatibleReplacementGroups] = useState<any[]>([]);
    const [newReplacementGroup, setNewReplacementGroup] = useState<boolean>(false);
    const [selectedReplacementCompatibleGroup, setSelectedReplacementCompatibleGroup] = useState<any | null>(null);
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalGroupWeight, setTotalGroupWeight] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const groupsColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        {
            header: 'Área',
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.area) {
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'Etapa',
            accessor: 'currentStage',
            render: (value, obj) => {
                let color = "secondary";
                let label = obj.stage;

                switch (obj.stage) {
                    case "breeder":
                        color = "success";
                        label = "Reproductor";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Fecha de creación', accessor: 'creationDate', type: 'date', isFilterable: true },
        { header: 'No. de hembras', accessor: 'femaleCount', type: 'text', isFilterable: true },
        { header: 'No. de machos', accessor: 'maleCount', type: 'text', isFilterable: true },
    ];

    const groupAttributes: Attribute[] = [
        { key: "code", label: "Codigo", type: "text" },
        { key: "name", label: "Nombre", type: "text" },
        {
            key: "area",
            label: "Area",
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row?.area) {
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row?.status) {
                    case "growing":
                        color = "success";
                        text = "En crecimiento y ceba";
                        break;
                    case "ready_to_exit":
                        color = "warning";
                        text = "Listo para salida";
                        break;
                    case "exit_overdue":
                        color = "dark";
                        text = "Retrasado para salida";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: "creationDate", label: "Fecha de creacion", type: "date" },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

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

            const replacementGroupsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_compatible_replacement_groups/${userLogged.farm_assigned}/${groupDetails.creationDate}`);

            const replacementGroupsData = replacementGroupsResponse.data.data;
            const replacementGroupsWithId = replacementGroupsData.map((b: any) => ({ ...b, id: b._id }));

            setCompatibleReplacementGroups(replacementGroupsWithId);
            replacementGroupsData.length === 0 ? setNewReplacementGroup(true) : setNewReplacementGroup(false);
        } catch (error) {
            console.error('Error fetching data:', { error });
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
        return selectedPigs.map(pig => ({
            pigId: pig._id,
            newWeight: Number(pig.newWeight),
        }));
    };

    const calculateAverage = () => {
        const total = selectedPigs.reduce((sum, p) => sum + Number(p.newWeight), 0);
        return total / selectedPigs.length;
    };

    const processReplacementGroup = async () => {
        if (!configContext) return;
        try {
            const replacementSows = selectedPigs.filter((s: any) => s.sex === 'female');
            const sowsReplacementIds = replacementSows.map(s => s._id);

            if (newReplacementGroup) {
                const nextGroupCodeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
                const nextCode = nextGroupCodeResponse.data.data;

                const avgWeight = replacementSows.length > 0 ?
                    replacementSows.reduce((sum, s) => sum + Number(s.newWeight), 0) / replacementSows.length : 0;

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
                    feedings: [],
                    feedingPackagesHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                    healthEvents: [],
                    isActive: true,
                };

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, sowsReplacementGroupData);
                const groupData = groupResponse.data.data;

                const groupWithdrawResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, {
                    responsible: userLogged._id,
                    femaleCount: replacementSows.length,
                    maleCount: 0,
                    date: new Date(),
                    withdrawReason: 'Cerdas de reemplazo',
                    pigsSelected: sowsReplacementIds.map(id => ({ _id: id }))
                });


                await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupData._id}`, {
                    avgWeight: avgWeight,
                    pigsCount: replacementSows.length,
                    weighedAt: new Date(),
                    registeredBy: userLogged._id
                });

                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`, {
                    pigsIds: sowsReplacementIds,
                    newStage: 'breeder',
                    userId: userLogged._id,
                });
            } else if (!newReplacementGroup && selectedReplacementCompatibleGroup) {
                await configContext.axiosHelper.put(`${configContext.apiUrl}/group/transfer_all_pigs/${selectedReplacementCompatibleGroup._id}/${userLogged._id}`, sowsReplacementIds);
                const groupWithdrawResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, {
                    responsible: userLogged._id,
                    femaleCount: replacementSows.length,
                    maleCount: 0,
                    date: new Date(),
                    withdrawReason: 'Cerdas de reemplazo',
                    pigsSelected: sowsReplacementIds.map(id => ({ _id: id }))
                });
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`, {
                    pigsIds: sowsReplacementIds,
                    newStage: 'breeder',
                    userId: userLogged._id,
                });
            }
        } catch (error) {
            console.error('Error processing replacement group:', { error });
            throw error;
        }
    };

    const processReplacementBoars = async () => {
        if (!configContext) return;
        try {
            const replacementBoars = selectedPigs.filter((s: any) => s.sex === 'male');
            const boarsReplacementIds = replacementBoars.map(s => s._id);

            if (replacementBoars.length !== 0) {
                await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`, {
                    pigsIds: boarsReplacementIds,
                    newStage: 'breeder',
                    userId: userLogged._id,
                });
            }
        } catch (error) {
            console.error('Error processing replacement boars:', { error });
            throw error;
        }
    };

    const handleProcessReplacement = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const weighings = buildWeighings();
            const newWeights = buildPigUpdates();
            const avgWeight = calculateAverage();

            await processReplacementGroup();
            await processReplacementBoars();

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight,
                pigsCount: selectedPigs.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id
            });

            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, newWeights);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Procesamiento de reemplazo del grupo ${group.code} registrado`
            });
            toggleModal('success');
        } catch (err) {
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkSelectedReplacementGroup = () => {
        if (newReplacementGroup) {
            toggleArrowTab(activeStep + 1);
            return;
        }

        if (!selectedReplacementCompatibleGroup && !newReplacementGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor seleccione un grupo para integrar a las cerdas de reemplazo' });
        } else {
            toggleArrowTab(activeStep + 1);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, []);

    useEffect(() => {
        if (!useIndividualWeight && totalGroupWeight && selectedPigs.length > 0) {
            const totalWeight = Number(totalGroupWeight);
            const averageWeight = totalWeight / selectedPigs.length;

            const updatedPigs = selectedPigs.map(pig => ({
                ...pig,
                newWeight: averageWeight
            }));

            setSelectedPigs(updatedPigs);
        }
    }, [totalGroupWeight, useIndividualWeight]);

    const handlePigSelection = (pigs: any[]) => {
        const pigsWithWeight = pigs.map(pig => ({
            ...pig,
            newWeight: ''
        }));
        setSelectedPigs(pigsWithWeight);
        setPigsArray(pigsWithWeight);
    };

    if (loading) {
        return <LoadingAnimation absolutePosition={false} />;
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-selection-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-selection-tab"
                            disabled
                        >
                            Selección de cerdos
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-weight-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-weight-tab"
                            disabled
                        >
                            Peso de cerdos
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
                            Integración a grupo de reemplazo
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
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Selección de Cerdos para Reemplazo</h5>
                        <p className="text-muted small">Selecciona los cerdos que serán destinados a reemplazo reproductivo.</p>
                    </div>

                    <SelectableCustomTable
                        columns={[
                            {
                                header: 'Cerdo',
                                accessor: 'code',
                                type: 'text',
                                render: (_, row) => {
                                    const index = allPigs.findIndex(p => p._id === row._id);
                                    return <span className="text-black">#{index + 1}</span>;
                                }
                            },
                            {
                                header: 'Sexo',
                                accessor: 'sex',
                                render: (value: string) => (
                                    <Badge color={value === 'male' ? "info" : "danger"}>
                                        {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                                    </Badge>
                                ),
                            },
                            { header: 'Peso actual', accessor: 'weight', type: 'text' },
                        ]}
                        data={allPigs}
                        selectionMode="multiple"
                        onSelect={handlePigSelection}
                        showSearchAndFilter={false}
                    />

                    <div className="mt-4 pt-2 border-top d-flex align-items-center justify-content-between">
                        <span className="text-muted small">
                            Cerdos seleccionados: <strong>{selectedPigs.length}</strong> de <strong>{allPigs.length}</strong>
                        </span>
                        <Button
                            className="ms-auto shadow-sm px-4"
                            color="primary"
                            onClick={() => setActiveStep(activeStep + 1)}
                            disabled={selectedPigs.length === 0}
                        >
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Registro de Peso</h5>
                        <p className="text-muted small">Actualiza el pesaje de los cerdos seleccionados para reemplazo.</p>
                    </div>

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
                                    Ingresar peso individual de cada cerdo
                                </div>
                                <div className="small text-muted">
                                    {useIndividualWeight
                                        ? "Ingresa el peso de cada cerdo individualmente"
                                        : "Ingresa el peso total del grupo y se asignará el peso promedio a cada cerdo"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!useIndividualWeight && (
                        <div className="card border-secondary-subtle mb-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Peso total del grupo (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            value={totalGroupWeight}
                                            onChange={(e) => setTotalGroupWeight(e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mt-4">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="ri-calculator-line text-primary"></i>
                                                <span className="text-muted">Peso promedio por cerdo:</span>
                                                <span className="fw-bold text-primary">
                                                    {totalGroupWeight && selectedPigs.length > 0
                                                        ? (Number(totalGroupWeight) / selectedPigs.length).toFixed(2)
                                                        : '0.00'
                                                    } kg
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <i className="ri-group-line text-info"></i>
                                                <span className="text-muted">Total de cerdos:</span>
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
                                    <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ transition: 'transform 0.2s', borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                        <div className="card-body p-3">
                                            <div className="row align-items-center">
                                                <div className="col-auto">
                                                    <div className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                                                        <i className={`ri-${isMale ? 'men-line' : 'women-line'} fs-4 text-${accentColor}`}></i>
                                                    </div>
                                                </div>

                                                <div className="col">
                                                    <h6 className="mb-0 fw-bold text-dark">Cerdo {pig.code}</h6>
                                                    <span className={`badge bg-${accentColor} bg-opacity-25 text-${accentColor} text-uppercase px-2`} style={{ fontSize: '0.65rem', fontWeight: '700' }}>
                                                        {isMale ? 'Macho' : 'Hembra'}
                                                    </span>
                                                </div>

                                                <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                    <small className="text-muted">
                                                        Actual: {pig.weight} kg
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
                                                            value={selectedPigs[index].newWeight}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const newArray = [...selectedPigs];
                                                                newArray[index].newWeight = value === '' ? '' : Number(value);
                                                                setSelectedPigs(newArray);
                                                            }}
                                                            onFocus={() => {
                                                                if (selectedPigs[index].newWeight === 0) {
                                                                    const newArray = [...selectedPigs];
                                                                    newArray[index].newWeight = '';
                                                                    setSelectedPigs(newArray);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (selectedPigs[index].newWeight === '') {
                                                                    const newArray = [...selectedPigs];
                                                                    newArray[index].newWeight = 0;
                                                                    setSelectedPigs(newArray);
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
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>
                        <span className="text-muted small">
                            Total registros: <strong>{selectedPigs.length}</strong>
                        </span>
                        <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => setActiveStep(activeStep + 1)}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div>
                        {compatibleReplacementGroups && compatibleReplacementGroups.length === 0 ? (
                            <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                <FaInfo size={22} />

                                <div>
                                    <div className="fw-semibold">
                                        No hay grupos de reemplazo compatibles
                                    </div>
                                    <div className="small">
                                        Se creará un nuevo grupo de reemplazo
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
                                                Crear nuevo grupo de reemplazo
                                            </div>
                                            <div className="small text-muted">
                                                Las cerdas no se mezclarán con grupos existentes
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SelectableCustomTable
                                    columns={groupsColumns}
                                    data={compatibleReplacementGroups}
                                    selectionMode="single"
                                    onSelect={(rows) => setSelectedReplacementCompatibleGroup(rows[0])}
                                    disabled={newReplacementGroup}
                                    showSearchAndFilter={false}
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>

                        <Button className="ms-auto" onClick={() => checkSelectedReplacementGroup()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={4}>
                    <div className="d-flex gap-3 align-items-stretch">

                        <Card className="w-100 m-0">
                            <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                <span className="text-black">Grupo de reemplazo destino</span>
                            </CardHeader>
                            <CardBody className="flex-fill">
                                {newReplacementGroup && newReplacementGroup === true ? (
                                    <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                        <FaInfo size={22} />

                                        <div>
                                            <div className="fw-semibold">
                                                Nuevo grupo de reemplazo
                                            </div>
                                            <div className="small">
                                                Se creará un nuevo grupo de reemplazo al procesar
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <ObjectDetails attributes={groupAttributes} object={selectedReplacementCompatibleGroup} />
                                )}
                            </CardBody>
                        </Card>

                        <div className="d-flex flex-column w-50 gap-3">
                            <Card className="w-100 h-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Peso de los cerdos</span>
                                </CardHeader>
                                <CardBody className='p-3'>
                                    <div className="row g-2 mb-3">
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-parent-line fs-5 text-primary me-1"></i>
                                                    <span className="text-muted fw-semibold">Total</span>
                                                </div>
                                                <h4 className="mb-0 text-primary fw-bold">{selectedPigs.length}</h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                                    <span className="text-muted fw-semibold">Peso Promedio</span>
                                                </div>
                                                <h4 className="mb-0 text-success fw-bold">
                                                    {selectedPigs.length > 0
                                                        ? (selectedPigs.reduce((acc, p) => acc + Number(p.newWeight), 0) / selectedPigs.length).toFixed(2)
                                                        : '0.00'
                                                    } kg
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-muted fw-semibold mb-2">Detalles de cerdos:</div>

                                    <SimpleBar style={{ maxHeight: '300px' }}>
                                        <table className="table table-hover table-sm">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="text-center">#</th>
                                                    <th className="text-center">Sexo</th>
                                                    <th className="text-center">Peso</th>
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
                            Atrás
                        </Button>

                        <Button className="ms-auto btn-success" disabled={isSubmitting} onClick={() => toggleModal('confirm')}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    Procesar reemplazo
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>Procesar reemplazo</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">¿Deseas procesar el reemplazo de este grupo?</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        Al confirmar, los cerdos serán transferidos al grupo de reemplazo.
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>Asegúrate de que toda la información esté correcta antes de continuar.</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button color="success" onClick={() => handleProcessReplacement()}>
                        {isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <>
                                <i className="ri ri-check-line me-2" />
                                Confirmar
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Reemplazo procesado con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al procesar el reemplazo, inténtelo más tarde"} />
        </>
    );
};

export default ProcessPigReplacementForm;
