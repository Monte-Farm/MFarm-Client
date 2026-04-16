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

interface ProcessPigSaleFormProps {
    groupId: string;
    onSave: () => void;
}

const ProcessPigSaleForm: React.FC<ProcessPigSaleFormProps> = ({ groupId, onSave }) => {
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
    const [compatibleSalesGroups, setCompatibleSalesGroups] = useState<any[]>([]);
    const [newSalesGroup, setNewSalesGroup] = useState<boolean>(false);
    const [selectedSaleCompatibleGroup, setSelectedSaleCompatibleGroup] = useState<any | null>(null);
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalGroupWeight, setTotalGroupWeight] = useState<string>('');

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 3) {
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
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
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
                    case "sale":
                        color = "warning";
                        label = "Venta";
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
                    case "shipping":
                        color = "secondary";
                        text = "Corrales de venta / embarque";
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
                    case "weaning":
                        color = "info";
                        text = "En destete";
                        break;
                    case "ready_to_grow":
                        color = "primary";
                        text = "Listo para crecimiento";
                        break;
                    case "grow_overdue":
                        color = "warning";
                        text = "Retradado en crecimiento";
                        break;
                    case "growing":
                        color = "success";
                        text = "En crecimiento y ceba";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo";
                        break;
                    case "ready_for_sale":
                        color = "success";
                        text = "Listo para venta";
                        break;
                    case "sale":
                        color = "success";
                        text = "En venta";
                        break;
                    case "sold":
                        color = "success";
                        text = "Vendido";
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
            setPigsArray(
                filteredPigs.map((pig: PigData) => ({
                    ...pig,
                    newWeight: ''
                }))
            );

            setGroup(groupDetails);

            const saleGroupsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_compatible_sale_groups/${userLogged.farm_assigned}/${groupDetails.creationDate}`);

            const saleGroupsData = saleGroupsResponse.data.data;
            const saleGroupsWithId = saleGroupsData.map((b: any) => ({ ...b, id: b._id }));

            setCompatibleSalesGroups(saleGroupsWithId);
            saleGroupsData.length === 0 ? setNewSalesGroup(true) : setNewSalesGroup(false);
        } catch (error) {
            console.error('Error fetching data:', { error });
            toggleModal('error');
        } finally {
            setLoading(false);
        }
    };

    const buildWeighings = () => {
        return pigsArray.map(pig => ({
            pigId: pig._id,
            groupId: groupId,
            weight: Number(pig.newWeight),
            weighedAt: new Date(),
            isGroupAverage: !useIndividualWeight,
            registeredBy: userLogged._id
        }));
    };

    const buildPigUpdates = () => {
        return pigsArray.map(pig => ({
            pigId: pig._id,
            newWeight: Number(pig.newWeight),
        }));
    };

    const calculateAverage = () => {
        const total = pigsArray.reduce((sum, p) => sum + Number(p.newWeight), 0);
        return total / pigsArray.length;
    };

    const processSaleGroup = async () => {
        if (!configContext) return;
        try {
            const salePigs = pigsArray;
            const salePigsIds = salePigs.map(s => s._id);
            const femaleCount = salePigs.filter((p: any) => p.sex === 'female').length;
            const maleCount = salePigs.filter((p: any) => p.sex === 'male').length;
            const avgWeight = calculateAverage();

            const withdrawData = {
                responsible: userLogged._id,
                femaleCount,
                maleCount,
                date: new Date(),
                withdrawReason: 'Cerdas de reemplazo',
                pigsSelected: salePigs.map(p => ({ _id: p._id }))
            };

            if (newSalesGroup) {
                const nextGroupCodeResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/next_group_code`);
                const nextCode = nextGroupCodeResponse.data.data;

                const salePigsGroupData: GroupData = {
                    code: nextCode,
                    name: nextCode,
                    farm: userLogged.farm_assigned,
                    area: 'shipping',
                    creationDate: new Date(),
                    stage: "sale",
                    status: 'sale',
                    groupMode: "linked",
                    pigsInGroup: salePigsIds,
                    pigCount: salePigs.length,
                    maleCount,
                    femaleCount,
                    avgWeight,
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
                };

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, salePigsGroupData);
                const groupData = groupResponse.data.data;

                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, withdrawData);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupData._id}`, {
                    avgWeight,
                    pigsCount: salePigs.length,
                    weighedAt: new Date(),
                    registeredBy: userLogged._id
                });
            } else if (selectedSaleCompatibleGroup) {
                await configContext.axiosHelper.put(`${configContext.apiUrl}/group/transfer_all_pigs/${selectedSaleCompatibleGroup._id}/${userLogged._id}`, salePigsIds);
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, withdrawData);
            }

            await configContext.axiosHelper.update(`${configContext.apiUrl}/pig/update_pigs_stage`, {
                pigsIds: salePigsIds,
                newStage: 'sale',
                userId: userLogged._id,
            });

            await configContext.axiosHelper.put(`${configContext.apiUrl}/group/deactivate/${groupId}`, { responsible: userLogged._id });
        } catch (error) {
            console.error('Error processing sale group:', { error });
            throw error;
        }
    };

    const handleProcessSale = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const weighings = buildWeighings();
            const newWeights = buildPigUpdates();
            const avgWeight = calculateAverage();

            await processSaleGroup();

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight,
                pigsCount: pigsArray.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id
            });

            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, newWeights);

            await configContext.axiosHelper.put(`${configContext.apiUrl}/group/change_stage/${groupId}`, {
                area: 'shipping',
                stage: 'sale',
                status: 'sale',
                userId: userLogged._id
            });

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Procesamiento de venta del grupo ${group.code} registrado`
            });
            toggleModal('success');
        } catch (err) {
            toggleModal('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkSelectedSaleGroup = () => {
        if (newSalesGroup) {
            toggleArrowTab(activeStep + 1);
            return;
        }

        if (!selectedSaleCompatibleGroup && !newSalesGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor seleccione un grupo para integrar a los cerdos de venta' });
        } else {
            toggleArrowTab(activeStep + 1);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, []);

    useEffect(() => {
        if (!useIndividualWeight && totalGroupWeight && pigsArray.length > 0) {
            const totalWeight = Number(totalGroupWeight);
            const averageWeight = totalWeight / pigsArray.length;

            const updatedPigs = pigsArray.map(pig => ({
                ...pig,
                newWeight: averageWeight
            }));

            setPigsArray(updatedPigs);
        }
    }, [totalGroupWeight, useIndividualWeight]);

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
                            id="step-weight-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
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
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-groupIntegration-tab"
                            disabled
                        >
                            Integración a grupo de venta
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
                            aria-selected={activeStep === 3}
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
                        <h5 className="fw-bold mb-1 text-dark">Registro de Peso</h5>
                        <p className="text-muted small">Actualiza el pesaje de los cerdos para venta.</p>
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
                                                    {totalGroupWeight && pigsArray.length > 0
                                                        ? (Number(totalGroupWeight) / pigsArray.length).toFixed(2)
                                                        : '0.00'
                                                    } kg
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 mt-1">
                                                <i className="ri-group-line text-info"></i>
                                                <span className="text-muted">Total de cerdos:</span>
                                                <span className="fw-bold text-info">{pigsArray.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {useIndividualWeight && (
                        <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                            {pigsArray.map((pig, index) => {
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
                                                            value={pigsArray[index].newWeight}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const newArray = [...pigsArray];
                                                                newArray[index].newWeight = value === '' ? '' : Number(value);
                                                                setPigsArray(newArray);
                                                            }}
                                                            onFocus={() => {
                                                                if (pigsArray[index].newWeight === 0) {
                                                                    const newArray = [...pigsArray];
                                                                    newArray[index].newWeight = '';
                                                                    setPigsArray(newArray);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                if (pigsArray[index].newWeight === '') {
                                                                    const newArray = [...pigsArray];
                                                                    newArray[index].newWeight = 0;
                                                                    setPigsArray(newArray);
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
                        <span className="text-muted small">
                            Total registros: <strong>{pigsArray.length}</strong>
                        </span>
                        <Button className="ms-auto shadow-sm px-4" color="primary" onClick={() => setActiveStep(activeStep + 1)}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={2}>
                    <div>
                        {compatibleSalesGroups && compatibleSalesGroups.length === 0 ? (
                            <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                <FaInfo size={22} />

                                <div>
                                    <div className="fw-semibold">
                                        No hay grupos de venta compatibles
                                    </div>
                                    <div className="small">
                                        Se creará un nuevo grupo de venta
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
                                                Crear nuevo grupo de venta
                                            </div>
                                            <div className="small text-muted">
                                                Los cerdos no se mezclarán con grupos existentes
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <SelectableCustomTable
                                    columns={groupsColumns}
                                    data={compatibleSalesGroups}
                                    selectionMode="single"
                                    onSelect={(rows) => setSelectedSaleCompatibleGroup(rows[0])}
                                    disabled={newSalesGroup}
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

                        <Button className="ms-auto" onClick={() => checkSelectedSaleGroup()}>
                            Siguiente
                            <i className="ri-arrow-right-line ms-2" />
                        </Button>
                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d-flex flex-column w-50">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información del grupo</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={groupAttributes} object={group} />
                                </CardBody>
                            </Card>

                            <Card className="w-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Grupo de venta destino</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    {newSalesGroup && newSalesGroup === true ? (
                                        <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                            <FaInfo size={22} />

                                            <div>
                                                <div className="fw-semibold">
                                                    Nuevo grupo de venta
                                                </div>
                                                <div className="small">
                                                    Se creará un nuevo grupo de venta al procesar
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
                                                <h4 className="mb-0 text-primary fw-bold">{pigsArray.length}</h4>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="border rounded p-2 text-center">
                                                <div className="d-flex align-items-center justify-content-center mb-1">
                                                    <i className="ri-scales-3-line fs-5 text-success me-1"></i>
                                                    <span className="text-muted fw-semibold">Peso Promedio</span>
                                                </div>
                                                <h4 className="mb-0 text-success fw-bold">
                                                    {pigsArray.length > 0
                                                        ? (pigsArray.reduce((acc, p) => acc + Number(p.newWeight), 0) / pigsArray.length).toFixed(2)
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
                                                {pigsArray.map((pig, index) => (
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
                                    Procesar venta
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>Procesar venta</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">¿Deseas procesar la venta de este grupo?</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        Al confirmar, los cerdos serán transferidos al grupo de venta.
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>Asegúrate de que toda la información esté correcta antes de continuar.</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button color="success" onClick={() => handleProcessSale()}>
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

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Venta procesada con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al procesar la venta, inténtelo más tarde"} />
        </>
    );
};

export default ProcessPigSaleForm;
