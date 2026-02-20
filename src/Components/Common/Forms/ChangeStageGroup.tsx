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
        actual: "Crecimiento / Ceba",
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
                    case "":
                        color = "grow_overdue";
                        text = "Retradado en crecimiento";
                        break;
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
        } else if (['ready_to_exit', 'exit_overdue'].includes(group.status)) {
            return {
                area: 'exit',
                stage: 'exit',
                status: 'exit',
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

            // 1. guardar pesajes individuales
            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_bulk`, weighings);

            // 2. guardar promedio grupo
            await configContext.axiosHelper.create(`${configContext.apiUrl}/weighing/create_group_average/${groupId}`, {
                avgWeight,
                pigsCount: pigsArray.length,
                weighedAt: new Date(),
                registeredBy: userLogged._id
            });

            // 3. actualizar peso actual de cerdos
            await configContext.axiosHelper.put(`${configContext.apiUrl}/pig/update_many_pig_weights`, newWeights);

            // 4. cambiar etapa del grupo
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
                        <p className="text-muted small">Actualiza el pesaje individual para el seguimiento del grupo.</p>
                    </div>

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
                                                <div
                                                    className={`bg-${accentColor} bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center`}
                                                    style={{ width: '48px', height: '48px' }}
                                                >
                                                    {/* Quitamos la opacidad al texto del icono para que resalte */}
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

                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </SimpleBar>

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
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d'flex flex-column w-50">
                            <Card className="w-100">
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
                                <CardBody className='flex-fill p-0'>
                                    <SimpleBar style={{ maxHeight: 400 }}>
                                        <CustomTable columns={pigletsColumns} data={pigsArray} showPagination={false} showSearchAndFilter={false} />
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
