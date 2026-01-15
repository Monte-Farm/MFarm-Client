import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaInfo, FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import LitterDetails from "pages/Lactation/LitterDetails";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import SimpleBar from "simplebar-react";
import ObjectDetails from "../Details/ObjectDetails";
import SelectableCustomTable from "../Tables/SelectableTable";
import CompleteOrder from "pages/Orders/CompleteOrder";
import { setLocale } from "yup";
import AlertMessage from "../Shared/AlertMesagge";

interface WeanLitterFormProps {
    litterId: string;
    onSave: () => void;
}

const WeanLitterForm: React.FC<WeanLitterFormProps> = ({ litterId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
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
            header: 'Etapa',
            accessor: 'currentStage',
            render: (value, obj) => {
                let color = "secondary";
                let label = obj.stage;

                switch (obj.stage) {
                    case "piglet":
                        color = "info";
                        label = "Lechón";
                        break;
                    case "weaning":
                        color = "warning";
                        label = "Destete";
                        break;
                    case "fattening":
                        color = "primary";
                        label = "Engorda";
                        break;
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
    ]

    const pigletsColumns: Column<any>[] = [
        {
            header: 'Lechón',
            accessor: '',
            type: 'text',
            render: (_, row,) => <span className="text-black">Lechón #{pigletsArray.indexOf(row) + 1}</span>
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
        { header: 'Peso', accessor: 'weight', type: 'text' },
    ]

    const litterAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value, object) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'active':
                        color = 'warning';
                        label = 'Lactando';
                        break;
                    case 'weaned':
                        color = 'success';
                        label = 'Destetada';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;

            }
        },
    ]

    const groupAttributes: Attribute[] = [
        { key: 'code', label: 'Codigo', type: 'text' },
        { key: 'name', label: 'nombre', type: 'text' },
        {
            key: 'area',
            label: 'Area',
            type: 'text',
            render: (value, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (value) {
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
            console.error('Error fetching data:', { error });
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
                    feedings: [],
                    feedingPackagesHistory: [],
                    medications: [],
                    medicationPackagesHistory: [],
                    vaccinationPlansHistory: [],
                    healthEvents: [],
                }

                const groupResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/group/create_group`, groupData)
            } else if (!newGroup && selectedCompatibleGroup) {
                const transferedResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/transfer_all_pigs/${selectedCompatibleGroup._id}/${userLogged._id}`, pigletsIds);
            }


            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Camada destetada`
            });

            toggleModal('success')
        } catch (error) {
            console.error('Error weaning the litter: ', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkSelectedGroup = () => {
        if (newGroup) toggleArrowTab(activeStep + 1);

        if (!selectedCompatibleGroup && !newGroup) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor seleccione un grupo para integrar a la camada' });
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
            feedingsPackagesHistory: [],
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
            feedingsPackagesHistory: [],
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
                            id="step-groupIntegration-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-groupIntegration-tab"
                            disabled
                        >
                            Integracion a grupo
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
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>
                    <Label>
                        <h5>Peso de los lechones al destetar</h5>
                    </Label>
                    <div className="mt-3">
                        <SimpleBar style={{ maxHeight: 400, paddingRight: 10 }}>
                            {pigletsArray.map((piglet, index) => (
                                <div key={index} className="border rounded p-3 mb-2">
                                    <p className="fw-bold">Lechón #{index + 1}</p>

                                    <div className="d-flex gap-3">
                                        <div className="w-50">
                                            <label className="form-label">Sexo</label>
                                            <select
                                                className="form-select"
                                                value={piglet.sex}
                                                onChange={(e) => {
                                                    const newArray = [...pigletsArray];
                                                    newArray[index].sex = e.target.value as 'male' | 'female';
                                                    setPigletsArray(newArray);
                                                }}
                                                disabled
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="male">Macho</option>
                                                <option value="female">Hembra</option>
                                            </select>
                                        </div>

                                        <div className="w-50">
                                            <label className="form-label">Peso (kg)</label>
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

                    <div className="mt-4 d-flex">
                        <Button className="ms-auto" onClick={() => setActiveStep(activeStep + 1)}>
                            Siguiente
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
                                        No hay grupos compatibles
                                    </div>
                                    <div className="small">
                                        Se creará un nuevo grupo al continuar con el destete
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
                                                Crear nuevo grupo
                                            </div>
                                            <div className="small text-muted">
                                                La camada no se mezclará con grupos existentes
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
                            Atrás
                        </Button>

                        <Button className="ms-auto" onClick={() => checkSelectedGroup()}>
                            Siguiente
                            < i className="ri-arrow-right-line ms-2" />
                        </Button>

                    </div>
                </TabPane>

                <TabPane tabId={3}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="d'flex flex-column w-50">
                            <Card className="w-100">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Información de la camada</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    <ObjectDetails attributes={litterAttributes} object={litter} />
                                </CardBody>
                            </Card>

                            <Card className="w-100 m-0">
                                <CardHeader className="d-flex justify-content-between align-items-center bg-light fs-5">
                                    <span className="text-black">Grupo destino</span>
                                </CardHeader>
                                <CardBody className="flex-fill">
                                    {newGroup && newGroup === true ? (
                                        <div className="alert alert-info d-flex flex-column align-items-center text-center gap-2">
                                            <FaInfo size={22} />

                                            <div>
                                                <div className="fw-semibold">
                                                    Nuevo grupo
                                                </div>
                                                <div className="small">
                                                    Se creará un nuevo grupo al destetar a la camada
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
                                    <span className="text-black">Peso de los lechones</span>
                                </CardHeader>
                                <CardBody className='flex-fill p-0'>
                                    <SimpleBar style={{ maxHeight: 300 }}>
                                        <CustomTable
                                            columns={pigletsColumns}
                                            data={pigletsArray}
                                            showPagination={false}
                                            showSearchAndFilter={false}
                                        />
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

                        <Button className="ms-auto btn-success" onClick={() => handleWeanLitter()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    Destetar camada
                                </div>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>


            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>Destetar camada</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75" />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">¿Deseas destetar esta camada?</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        Al confirmar el destete, la camada cambiará su estado y se dará por
                        finalizada la etapa de lactancia.
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>Asegúrate de que toda la información esté correcta antes de continuar.</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button class Name="" color="success" onClick={() => handleWeanLitter()}>
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

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Camada destetada con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al destetar a la camada, intentelo mas tarde"} />
        </>
    );
};

export default WeanLitterForm;
