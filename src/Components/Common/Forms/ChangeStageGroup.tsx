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
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import ObjectDetails from "../Details/ObjectDetails";
import SelectableCustomTable from "../Tables/SelectableTable";
import AlertMessage from "../Shared/AlertMesagge";

interface WeanLitterFormProps {
    groupId: string;
    onSave: () => void;
}

const statusData = {
    weaning: {
        proximo: "Crecimiento",
        actual: "Destete",
        color: "primary",
        icon: "ri-arrow-up-circle-line"
    },
    fattening: {
        proximo: "Salida",
        actual: "Crecimiento y Ceba",
        color: "warning",
        icon: "ri-truck-line"
    }
};

const ChangeStageGroup: React.FC<WeanLitterFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });

    const [group, setGroup] = useState<any>()
    const [pigsArray, setPigsArray] = useState<any[]>([]);
    const currentInfo = statusData[group?.stage as keyof typeof statusData] || statusData.weaning;
    const [useIndividualWeight, setUseIndividualWeight] = useState<boolean>(false);
    const [totalGroupWeight, setTotalGroupWeight] = useState<string>('');

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

    const pigletsColumns: Column<any>[] = [
        {
            header: 'Cerdo',
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">Cerdo {row.code}</span>
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
        { header: 'Peso', accessor: 'newWeight', type: 'text' },
    ]

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

                switch (row.area) {
                    case "gestation":
                        color = "info";
                        text = "Gestación";
                        break;
                    case "farrowing":
                        color = "primary";
                        text = "Paridera";
                        break;
                    case "maternity":
                        color = "primary";
                        text = "Maternidad";
                        break;
                    case "weaning":
                        color = "success";
                        text = "Destete";
                        break;
                    case "nursery":
                        color = "warning";
                        text = "Preceba / Levante inicial";
                        break;
                    case "fattening":
                        color = "dark";
                        text = "Ceba / Engorda";
                        break;
                    case "replacement":
                        color = "secondary";
                        text = "Reemplazo / Recría";
                        break;
                    case "boars":
                        color = "info";
                        text = "Área de verracos";
                        break;
                    case "quarantine":
                        color = "danger";
                        text = "Cuarentena / Aislamiento";
                        break;
                    case "hospital":
                        color = "danger";
                        text = "Hospital / Enfermería";
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

                switch (row.status) {
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
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            const groupDetails = groupResponse.data.data
            setGroup(groupDetails)

            const filteredPigs = groupDetails.pigsInGroup.filter((p: any) => p.status === 'alive')
            setPigsArray(
                filteredPigs.map((pig: PigData) => ({
                    ...pig,
                    newWeight: ''
                }))
            );

        } catch (error) {
            console.error('Error fetching data:', { error });
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

    const calculateAverage = () => {
        const total = pigsArray.reduce((sum, p) => sum + Number(p.newWeight), 0);
        return total / pigsArray.length;
    };

    const buildPigUpdates = () => {
        return pigsArray.map(pig => ({
            pigId: pig._id,
            newWeight: Number(pig.newWeight),
        }));
    };

    const buildNewStage = () => {
        if (['ready_to_grow', 'grow_overdue'].includes(group.status)) {
            return {
                area: 'fattening',
                stage: 'fattening',
                status: 'growing',
                userId: userLogged._id
            }
        } else if (['ready_for_sale'].includes(group.status)) {
            return {
                area: 'shipping',
                stage: 'sale',
                status: 'sale',
                userId: userLogged._id
            }
        }
    }

    const handleConfirm = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);

            const weighings = buildWeighings();
            const avgWeight = calculateAverage();
            const newWeights = buildPigUpdates();
            const newStage = buildNewStage();

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight,
                pigsCount: pigsArray.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id
            });

            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, newWeights);

            await configContext.axiosHelper.put(`${configContext.apiUrl}/group/change_stage/${groupId}`, newStage);

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

    useEffect(() => {
        fetchGroup();
    }, [])

    // Calcular peso promedio cuando se usa peso total
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
    }, [totalGroupWeight, useIndividualWeight, pigsArray.length]);

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
                            Peso de lechones
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
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <div className="mb-4">
                        <h5 className="fw-bold mb-1 text-dark">Registro de Peso</h5>
                        <p className="text-muted small">Actualiza el pesaje para el seguimiento del grupo.</p>
                    </div>

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

                    {/* Modo: Peso total del grupo */}
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

                    {/* Modo: Peso individual */}
                    {useIndividualWeight && (
                        <SimpleBar style={{ maxHeight: 450, paddingRight: 12 }}>
                            {pigsArray.map((pig, index) => {
                                const isMale = pig.sex === 'male';
                                const accentColor = isMale ? 'primary' : 'danger';

                                return (
                                    <div key={index} className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ transition: 'transform 0.2s', borderLeft: `5px solid var(--bs-${accentColor})` }}>
                                        <div className="card-body p-3">
                                            <div className="row align-items-center">

                                                {/* Info del Cerdo */}
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

                                                {/* Input de Peso */}
                                                <div className="col-sm-5 col-12 mt-3 mt-sm-0">
                                                    <small className="text-muted">
                                                        Actual: {pig.weight} kg
                                                    </small>

                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light border-end-0 text-muted small">
                                                            <i className="ri-scales-3-line"></i>
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
                    <div className="mb-4">
                        <Card className="border-0 shadow-sm">
                            <CardBody className="p-4">

                                <div className="text-center mb-4">
                                    <h5 className="fw-bold text-dark mb-1">
                                        Cambio de etapa
                                    </h5>
                                    <span className="text-muted small">
                                        El grupo pasará a la siguiente fase productiva
                                    </span>
                                </div>

                                <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap">

                                    {/* Etapa actual */}
                                    <div className="text-center d-flex flex-column justify-content-center align-items-center">
                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-2 border" style={{ width: 70, height: 70 }}>
                                            <i className={`ri-information-line fs-2 text-secondary`} />
                                        </div>
                                        <div className="fw-semibold text-muted small">
                                            Actual
                                        </div>
                                        <div className="fw-bold text-dark">
                                            {currentInfo.actual}
                                        </div>
                                    </div>

                                    {/* Flecha */}
                                    <div className="d-flex align-items-center">
                                        <i className="ri-arrow-right-line fs-2 text-muted" />
                                    </div>

                                    {/* Próxima etapa */}
                                    <div className="text-center text-center d-flex flex-column justify-content-center align-items-center">
                                        <div className={`bg-${currentInfo.color} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mb-2`} style={{ width: 70, height: 70 }}>
                                            <i className={`${currentInfo.icon} fs-2 text-${currentInfo.color}`} />
                                        </div>
                                        <div className="fw-semibold text-muted small">
                                            Próxima
                                        </div>
                                        <div className={`fw-bold text-${currentInfo.color}`}>
                                            {currentInfo.proximo}
                                        </div>
                                    </div>

                                </div>

                            </CardBody>
                        </Card>
                    </div>

                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d'flex flex-column w-50">
                            <Card className="w-100 h-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información del grupo</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={groupAttributes} object={group} />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-50">
                            <Card className="w-100 h-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Peso de los cerdos</span>
                                </CardHeader>
                                <CardBody className='p-3'>
                                    {/* Estadísticas principales */}
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

                                    {/* Tabla de cerdos con scroll */}
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
                                                        <td className="text-center">{parseFloat(String(pig.newWeight)).toFixed(2)}kg</td>
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
                                    Confirmar
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>


            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered className="border-0">
                <ModalHeader toggle={() => toggleModal("confirm")} className="border-bottom-0 pb-0">
                    <span className="fw-bold text-muted">Confirmación de Cambio</span>
                </ModalHeader>

                <ModalBody className="px-4 pb-4">
                    <div className="d-flex justify-content-center mb-4 mt-2">
                        <div className={`bg-${currentInfo.color} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '80px', height: '80px' }}>
                            <i className={`${currentInfo.icon} fs-1 text-${currentInfo.color}`}></i>
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <h4 className="fw-bold mb-2">¿Deseas cambiar a {currentInfo.proximo}?</h4>
                        <p className="text-muted fs-6 px-3">
                            Al confirmar, el grupo cambiará su estado a <strong className="text-dark">{currentInfo.proximo}</strong> y se dará por finalizada la etapa de <strong className="text-dark">{currentInfo.actual}</strong>.
                        </p>
                    </div>

                    <div className="rounded-3 p-3 bg-light border d-flex align-items-center gap-3">
                        <i className="ri-information-fill fs-3 text-warning"></i>
                        <div className="small text-secondary">
                            <strong>Verifica los datos:</strong> Asegúrate de que toda la información ingresada sea correcta antes de realizar este cambio.
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="border-top-0 d-flex gap-2 pb-4">
                    <Button color="light" className="px-4 fw-semibold text-muted border" onClick={() => toggleModal("confirm")} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button color="success" className="px-4 shadow-sm fw-bold" disabled={isSubmitting} onClick={() => handleConfirm()}>
                        {isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <>
                                <i className="ri-check-line me-2" />
                                Confirmar Cambio
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Cambio de etapa realizado con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al cambiar la etapa del grupo, intentelo mas tarde"} />
        </>
    );
};

export default ChangeStageGroup;
