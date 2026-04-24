import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import classnames from "classnames";
import { Column } from "common/data/data_types";
import SelectableCustomTable from "../Tables/SelectableTable";
import { FaInfo } from "react-icons/fa";

interface BulkWeanLittersModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLitters: any[];
    onSuccess: () => void;
}

const BulkWeanLittersModal: React.FC<BulkWeanLittersModalProps> = ({
    isOpen,
    onClose,
    selectedLitters,
    onSuccess
}) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [litterWeights, setLitterWeights] = useState<{ [litterId: string]: string }>({});
    const [compatibleGroups, setCompatibleGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [createNewGroup, setCreateNewGroup] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 2) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const groupsColumns: Column<any>[] = [
        { header: 'Código', accessor: 'code', type: 'text', isFilterable: true },
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
                    case "weaning": color = "success"; text = "Destete"; break;
                    case "nursery": color = "warning"; text = "Preceba / Levante inicial"; break;
                    case "fattening": color = "dark"; text = "Ceba / Engorda"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            header: 'Etapa',
            accessor: 'stage',
            render: (_, row) => {
                let color = "secondary";
                let label = row.stage;

                switch (row.stage) {
                    case "weaning": color = "warning"; label = "Destete"; break;
                    case "fattening": color = "primary"; label = "Engorda"; break;
                    case "breeder": color = "success"; label = "Reproductor"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Cerdos', accessor: 'pigCount', type: 'text', isFilterable: true },
        { header: 'Machos', accessor: 'maleCount', type: 'text', isFilterable: true },
        { header: 'Hembras', accessor: 'femaleCount', type: 'text', isFilterable: true },
    ];

    const fetchCompatibleGroups = async () => {
        if (!configContext || !userLogged) return;

        try {
            // Buscar grupos compatibles basados en la fecha de nacimiento más antigua
            const oldestBirthDate = selectedLitters.reduce((oldest, litter) => {
                const litterDate = new Date(litter.birthDate);
                return !oldest || litterDate < oldest ? litterDate : oldest;
            }, null as Date | null);

            if (oldestBirthDate) {
                const groupsResponse = await configContext.axiosHelper.get(
                    `${configContext.apiUrl}/group/find_compatible_wean_groups/${userLogged.farm_assigned}/${oldestBirthDate.toISOString()}`
                );
                const groupsWithId = groupsResponse.data.data.map((g: any) => ({ ...g, id: g._id }));
                setCompatibleGroups(groupsWithId);

                if (groupsWithId.length === 0) {
                    setCreateNewGroup(true);
                }
            }
        } catch (error) {
            console.error('Error fetching compatible groups:', error);
        }
    };

    const handleWeanLitters = async () => {
        if (!configContext || !userLogged) return;

        // Filtrar solo camadas listas para destetar
        const readyLitters = selectedLitters.filter(litter =>
            litter.status === 'ready_to_wean' || litter.status === 'wean_overdue'
        );

        // Validar que todas las camadas listas tengan peso
        const missingWeights = readyLitters.filter(litter => !litterWeights[litter._id] || Number(litterWeights[litter._id]) <= 0);
        if (missingWeights.length > 0) {
            setErrorMessage('Por favor, ingresa el peso total para todas las camadas');
            return;
        }

        // Validar selección de grupo
        if (!createNewGroup && !selectedGroup) {
            setErrorMessage('Por favor, selecciona un grupo destino o marca "Crear nuevo grupo"');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage('');

            // Array para acumular todos los IDs de lechones
            const allPigletsIds: string[] = [];
            let totalMales = 0;
            let totalFemales = 0;
            let totalWeight = 0;

            // Paso 1: Destetar cada camada individualmente
            for (const litter of readyLitters) {
                const litterWeight = Number(litterWeights[litter._id]);
                const pigletCount = litter.currentMale + litter.currentFemale;
                const avgWeightPerPiglet = litterWeight / pigletCount;

                // Crear array de lechones con peso promedio
                const pigletsArray = [];

                // Lechones machos
                for (let i = 0; i < litter.currentMale; i++) {
                    pigletsArray.push({
                        _id: '',
                        code: '',
                        farmId: litter.farm,
                        birthdate: litter.birthDate,
                        breed: litter.mother?.breed || '',
                        origin: 'born',
                        status: 'alive',
                        currentStage: 'piglet',
                        sex: 'male',
                        weight: avgWeightPerPiglet,
                        historyChanges: [],
                        feedAdministrationHistory: [],
                        medications: [],
                        medicationPackagesHistory: [],
                        vaccinationPlansHistory: [],
                        sicknessHistory: [],
                        reproduction: [],
                        registration_date: new Date(),
                        registered_by: userLogged._id
                    });
                }

                // Lechones hembras
                for (let i = 0; i < litter.currentFemale; i++) {
                    pigletsArray.push({
                        _id: '',
                        code: '',
                        farmId: litter.farm,
                        birthdate: litter.birthDate,
                        breed: litter.mother?.breed || '',
                        origin: 'born',
                        status: 'alive',
                        currentStage: 'piglet',
                        sex: 'female',
                        weight: avgWeightPerPiglet,
                        historyChanges: [],
                        feedAdministrationHistory: [],
                        medications: [],
                        medicationPackagesHistory: [],
                        vaccinationPlansHistory: [],
                        sicknessHistory: [],
                        reproduction: [],
                        registration_date: new Date(),
                        registered_by: userLogged._id
                    });
                }

                // Destetar la camada (endpoint individual existente)
                const weanedLitter = await configContext.axiosHelper.put(
                    `${configContext.apiUrl}/litter/wean_litter/${litter._id}`,
                    pigletsArray
                );
                const pigletsIds = weanedLitter.data.data;

                // Acumular IDs y totales
                allPigletsIds.push(...pigletsIds);
                totalMales += litter.currentMale;
                totalFemales += litter.currentFemale;
                totalWeight += litterWeight;
            }

            const totalPiglets = totalMales + totalFemales;
            const avgWeight = totalWeight / totalPiglets;

            // Paso 2: Crear grupo nuevo o transferir a grupo existente
            if (createNewGroup) {
                // Obtener siguiente código de grupo
                const nextGroupCodeResponse = await configContext.axiosHelper.get(
                    `${configContext.apiUrl}/group/next_group_code`
                );
                const nextCode = nextGroupCodeResponse.data.data;

                // Crear grupo nuevo con todos los lechones
                const groupData = {
                    code: nextCode,
                    name: nextCode,
                    farm: userLogged.farm_assigned,
                    area: 'weaning',
                    creationDate: new Date(),
                    stage: 'weaning',
                    status: 'weaning',
                    groupMode: 'linked',
                    pigsInGroup: allPigletsIds,
                    pigCount: totalPiglets,
                    maleCount: totalMales,
                    femaleCount: totalFemales,
                    avgWeight: avgWeight,
                    responsible: userLogged._id,
                    observations: '',
                    observationsHistory: [],
                    groupHistory: [],
                    feedAdministrationHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                    healthEvents: [],
                    isActive: true,
                    litterIds: readyLitters.map(litter => litter._id)
                };

                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, groupData);
            } else if (!createNewGroup && selectedGroup) {
                await configContext.axiosHelper.put(
                    `${configContext.apiUrl}/group/transfer_all_pigs/${selectedGroup._id}/${userLogged._id}`,
                    {
                        pigIds: allPigletsIds,
                        litterIds: readyLitters.map(litter => litter._id)
                    }
                );
            }

            // Paso 3: Registrar en historial
            await configContext.axiosHelper.create(
                `${configContext.apiUrl}/user/add_user_history/${userLogged._id}`,
                {
                    event: `${readyLitters.length} camadas destetadas en grupo`
                }
            );

            toggleModal('success', true);
        } catch (error: any) {
            console.error('Error weaning litters:', error);
            toggleModal('error', true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        resetForm();
    };

    const handleClose = () => {
        onClose();
        resetForm();
    };

    const resetForm = () => {
        setActiveStep(1);
        setPassedarrowSteps([1]);
        setLitterWeights({});
        setSelectedGroup(null);
        setCreateNewGroup(false);
        setErrorMessage('');
    };

    const handleWeightChange = (litterId: string, value: string) => {
        setLitterWeights(prev => ({ ...prev, [litterId]: value }));
    };

    const calculateTotals = () => {
        // Filtrar solo camadas listas para destetar
        const readyLitters = selectedLitters.filter(litter =>
            litter.status === 'ready_to_wean' || litter.status === 'wean_overdue'
        );

        const totalPiglets = readyLitters.reduce((sum, litter) => sum + litter.currentMale + litter.currentFemale, 0);
        const totalWeight = Object.values(litterWeights).reduce((sum, weight) => sum + (Number(weight) || 0), 0);
        const avgWeight = totalPiglets > 0 ? totalWeight / totalPiglets : 0;

        return { totalPiglets, totalWeight, avgWeight };
    };

    const checkWeightsBeforeNext = () => {
        const readyLitters = selectedLitters.filter(litter =>
            litter.status === 'ready_to_wean' || litter.status === 'wean_overdue'
        );
        const missingWeights = readyLitters.filter(litter => !litterWeights[litter._id] || Number(litterWeights[litter._id]) <= 0);
        if (missingWeights.length > 0) {
            setErrorMessage('Por favor, ingresa el peso total para todas las camadas antes de continuar');
            return;
        }
        setErrorMessage('');
        toggleArrowTab(2);
    };

    useEffect(() => {
        if (isOpen) {
            fetchCompatibleGroups();
            // Inicializar pesos solo para camadas listas para destetar
            const initialWeights: { [key: string]: string } = {};
            selectedLitters
                .filter(litter => litter.status === 'ready_to_wean' || litter.status === 'wean_overdue')
                .forEach(litter => {
                    initialWeights[litter._id] = '';
                });
            setLitterWeights(initialWeights);
        }
    }, [isOpen]);

    const readyLitters = selectedLitters.filter(l => l.status === 'ready_to_wean' || l.status === 'wean_overdue');
    const { totalPiglets, totalWeight, avgWeight } = calculateTotals();

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    Destetar {readyLitters.length} Camadas
                </ModalHeader>
                <ModalBody>
                    <div className="step-arrow-nav mb-4">
                        <Nav className="nav-pills custom-nav nav-justified">
                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeStep === 1,
                                        done: activeStep > 1,
                                    })}
                                >
                                    Peso de las camadas
                                </NavLink>
                            </NavItem>

                            <NavItem>
                                <NavLink
                                    className={classnames({
                                        active: activeStep === 2,
                                        done: activeStep > 2,
                                    })}
                                >
                                    Grupo destino
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </div>

                    <TabContent activeTab={activeStep}>
                        <TabPane tabId={1}>
                            <div className="mb-3">
                                <Label className="form-label fw-semibold">Ingresa el peso total de cada camada:</Label>

                                <div className="border rounded p-3 mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {readyLitters.map((litter, index) => (
                                        <div key={litter._id} className="row align-items-center mb-3 pb-3 border-bottom">
                                            <div className="col-4">
                                                <strong>{litter.code}</strong>
                                                <div className="small text-muted">
                                                    {litter.currentMale + litter.currentFemale} lechones
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="d-flex gap-2">
                                                    <Badge color="info">{litter.currentMale} ♂</Badge>
                                                    <Badge color="danger">{litter.currentFemale} ♀</Badge>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="input-group input-group-sm">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={litterWeights[litter._id] || ''}
                                                        onChange={(e) => handleWeightChange(litter._id, e.target.value)}
                                                        invalid={!!errorMessage && (!litterWeights[litter._id] || Number(litterWeights[litter._id]) <= 0)}
                                                    />
                                                    <span className="input-group-text">kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {errorMessage && activeStep === 1 && (
                                    <div className="alert alert-danger mb-3">{errorMessage}</div>
                                )}

                                <Card className="border-primary">
                                    <CardHeader className="bg-primary-subtle">
                                        <strong>📊 Resumen</strong>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <div className="text-muted small">Total lechones</div>
                                                <h4 className="mb-0 text-primary">{totalPiglets}</h4>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-muted small">Peso total</div>
                                                <h4 className="mb-0 text-success">{totalWeight.toFixed(2)} kg</h4>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-muted small">Peso promedio</div>
                                                <h4 className="mb-0 text-info">{avgWeight.toFixed(2)} kg</h4>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="d-flex justify-content-end mt-4">
                                <Button className="farm-primary-button" onClick={checkWeightsBeforeNext}>
                                    Siguiente
                                    <i className="ri-arrow-right-line ms-1" />
                                </Button>
                            </div>
                        </TabPane>

                        <TabPane tabId={2}>
                            <div className="mb-3">
                                <Label className="form-label fw-semibold">Selecciona el grupo destino:</Label>

                                {compatibleGroups.length === 0 ? (
                                    <div className="alert alert-info d-flex align-items-center gap-2">
                                        <FaInfo size={22} />
                                        <div>
                                            <div className="fw-semibold">No hay grupos compatibles</div>
                                            <div className="small">Se creará un nuevo grupo automáticamente al destetar las camadas</div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`card border-2 mb-3 ${createNewGroup ? "border-primary bg-primary-subtle" : "border-secondary-subtle"}`}
                                            role="button"
                                            onClick={() => {
                                                setCreateNewGroup(!createNewGroup);
                                                if (!createNewGroup) setSelectedGroup(null);
                                            }}>
                                            <div className="card-body d-flex align-items-center gap-3">
                                                <Input
                                                    className="form-check-input mt-0"
                                                    type="checkbox"
                                                    checked={createNewGroup}
                                                    readOnly
                                                />
                                                <FaInfo className="text-primary" size={20} />
                                                <div>
                                                    <div className="fw-semibold">Crear nuevo grupo</div>
                                                    <div className="small text-muted">
                                                        Todas las camadas irán a un grupo nuevo
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <SelectableCustomTable
                                            columns={groupsColumns}
                                            data={compatibleGroups}
                                            selectionMode="single"
                                            onSelect={(rows) => {
                                                setSelectedGroup(rows[0]);
                                                if (rows[0]) setCreateNewGroup(false);
                                            }}
                                            disabled={createNewGroup}
                                            showSearchAndFilter={false}
                                            showPagination={true}
                                            rowsPerPage={5}
                                        />
                                    </>
                                )}

                                {errorMessage && activeStep === 2 && (
                                    <div className="alert alert-danger mt-3">{errorMessage}</div>
                                )}

                                {!createNewGroup && selectedGroup && (
                                    <div className="alert alert-success mt-3">
                                        <strong>Grupo seleccionado:</strong> {selectedGroup.code} - {selectedGroup.name}
                                    </div>
                                )}

                                {createNewGroup && (
                                    <div className="alert alert-info mt-3">
                                        <FaInfo className="me-2" />
                                        Se creará un nuevo grupo con todas las camadas destetadas
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-between mt-4">
                                <Button color="danger" onClick={() => toggleArrowTab(1)}>
                                    <i className="ri-arrow-left-line me-1" />
                                    Atrás
                                </Button>
                                <Button
                                    color="success"
                                    onClick={handleWeanLitters}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <i className="ri-check-line me-1" />
                                            Destetar Camadas
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabPane>
                    </TabContent>
                </ModalBody>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message={`${readyLitters.length} camadas han sido destetadas exitosamente.`}
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message="Ha ocurrido un error al destetar las camadas. Por favor, inténtelo más tarde."
            />
        </>
    );
};

export default BulkWeanLittersModal;
