import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import KPI from "../Graphics/Kpi";
import DatePicker from "react-flatpickr";
import SelectableTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";
import { FaKeyboard, FaListUl, FaMars, FaPiggyBank, FaVenus } from "react-icons/fa";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import CustomTable from "../Tables/CustomTable";

interface GroupInsertFormProps {
    groupId: string;
    onSave: () => void
}

const GroupInsertForm: React.FC<GroupInsertFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ success: false, error: false })
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [groupData, setGroupData] = useState<any>({})
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [pigs, setPigs] = useState<any[]>([])
    const [insertMode, setInsertMode] = useState<"tracked" | "untracked" | null>(null);
    const [untrackedPigsInsert, setUntrackedPigsInsert] = useState({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
    });
    const [trackedPigsInsert, setTrackedPigsInsert] = useState<{
        responsible: string;
        femaleCount: number;
        maleCount: number;
        date: Date;
        pigsSelected: any[];
    }>({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
        pigsSelected: [],
    });

    const pigsColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        { header: 'Peso actual', accessor: 'weight', type: 'number', isFilterable: true },
        { header: 'Etapa actual', accessor: 'currentStage', type: 'text', isFilterable: true },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
    ]

    const insertAttributes: Attribute[] = [
        { key: 'date', label: 'Fecha del ingreso', type: 'date' },
        { key: 'maleCount', label: 'Machos', type: 'text' },
        { key: 'femaleCount', label: 'Hembras', type: 'text' },
        {
            key: 'responsible',
            label: 'Responsable',
            type: 'text',
            render: (_, obj) => <span>{userLogged.name} {userLogged.lastname}</span>
        },

    ]

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: any) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 4) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);

            const [groupResponse, pigsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_all_by_farm/${userLogged.farm_assigned}`)
            ]);

            const groupData = groupResponse.data.data;
            const pigData = pigsResponse.data.data;

            const pigsInGroupIds = (groupData.pigsInGroup || []).map((pig: any) => pig._id.toString());

            const availablePigs = pigData.filter((pig: any) => !pigsInGroupIds.includes(pig._id.toString()));
            console.log(availablePigs)

            const pigsWithId = availablePigs.map((b: any) => ({ ...b, id: b._id }));

            setPigs(pigsWithId);
            setGroupData(groupData);

            if (groupData.pigsInGroup.length === 0 && groupData.femaleCount === 0 && groupData.maleCount === 0) {
                setInsertMode(null);
            } else if (groupData.pigsInGroup.length === 0) {
                setInsertMode("untracked");
            } else {
                setInsertMode("tracked");
            }
        } catch (error) {
            console.error("Error fetching data", { error });
            setAlertConfig({ visible: true, color: "danger", message: "Ha ocurrido un error al obtener los datos, inténtelo más tarde", });
        } finally {
            setLoading(false);
        }
    };

    const handleInsertPigs = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true)
            if (insertMode === 'tracked') {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/insert_tracked_pigs/${groupId}`, trackedPigsInsert)
            } else {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/insert_untracked_pigs/${groupId}`, untrackedPigsInsert)
            }

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Ingreso de cerdos de grupo: ${groupData.code}`
            });

            toggleModal('success')
        } catch (error) {
            console.error('Error in insertPigs:', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkInsertData = () => {
        if (insertMode === 'tracked') {
            if (trackedPigsInsert.pigsSelected.length === 0) {
                setAlertConfig({ visible: true, message: 'Por favor, ingrese todos los campos o seleccione al menos 1 cerdo', color: 'danger' })
            } else {
                toggleArrowTab(activeStep + 1)
            }
        } else {
            if ((untrackedPigsInsert.femaleCount === 0 && untrackedPigsInsert.maleCount === 0)) {
                setAlertConfig({ visible: true, message: 'Por favor, ingrese todos los campos o retire al menos un cerdo', color: 'danger' });
            } else {
                toggleArrowTab(activeStep + 1);
            }
        }
    }

    useEffect(() => {
        const femaleCount = trackedPigsInsert.pigsSelected.filter((p) => p.sex === 'female').length
        const maleCount = trackedPigsInsert.pigsSelected.filter((p) => p.sex === 'male').length
        setTrackedPigsInsert({ ...trackedPigsInsert, femaleCount: femaleCount, maleCount: maleCount })
    }, [trackedPigsInsert.pigsSelected])

    useEffect(() => {
        fetchData();
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
                            id="step-pigselect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-pigselect-tab"
                            disabled
                        >
                            Selección de cerdos
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
                            onClick={() => toggleArrowTab(2)}
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
                <TabPane id="step-pigselect-tab" tabId={1}>
                    {groupData.pigsInGroup.length === 0 && groupData.maleCount === 0 && groupData.femaleCount === 0 && insertMode === null ? (
                        <div className="text-center py-5">
                            <h5 className="mb-4 text-muted">El grupo no tiene cerdos registrados. ¿Cómo deseas ingresarlos?</h5>
                            <div className="d-flex justify-content-center gap-4">
                                <Button
                                    color="primary"
                                    size="lg"
                                    className="d-flex flex-column align-items-center p-4"
                                    onClick={() => setInsertMode("tracked")}
                                >
                                    <FaListUl size={32} className="mb-2" />
                                    <span>Ingreso con selección</span>
                                </Button>

                                <Button
                                    color="secondary"
                                    size="lg"
                                    className="d-flex flex-column align-items-center p-4"
                                    onClick={() => setInsertMode("untracked")}
                                >
                                    <FaKeyboard size={32} className="mb-2" />
                                    <span>Ingreso manual</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {insertMode === "tracked" ? (
                                <>
                                    <div className="d-flex gap-2">
                                        <KPI title={"Cerdos machos"} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                        <KPI title={"Cerdos hembras"} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                        <KPI title={"Cerdos totales"} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                                    </div>

                                    <div className="d-flex gap-2">
                                        <div className="w-50">
                                            <Label htmlFor="date" className="form-label">Fecha de ingreso</Label>
                                            <DatePicker
                                                id="date"
                                                className="form-control"
                                                value={trackedPigsInsert.date ?? undefined}
                                                onChange={(date: Date[]) => {
                                                    if (date[0]) {
                                                        setTrackedPigsInsert({
                                                            ...trackedPigsInsert,
                                                            date: date[0],
                                                        });
                                                    }
                                                }}
                                                options={{ dateFormat: "d/m/Y" }}
                                            />
                                        </div>

                                        <div className="w-50">
                                            <Label htmlFor="responsible" className="form-label">Responsable del ingreso</Label>
                                            <Input
                                                type="text"
                                                id="responsible"
                                                name="responsible"
                                                value={`${userLogged.name} ${userLogged.lastname}`}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-3">
                                        <div className="w-50">
                                            <Label htmlFor="femaleCount" className="form-label">Hembras a ingresar</Label>
                                            <Input type="number" id="femaleCount" name="femaleCount" value={trackedPigsInsert.femaleCount} disabled />
                                        </div>
                                        <div className="w-50">
                                            <Label htmlFor="maleCount" className="form-label">Machos a insertar</Label>
                                            <Input type="number" id="maleCount" name="maleCount" value={trackedPigsInsert.maleCount} disabled />
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <Label htmlFor="maleCount" className="form-label">Seleccion de cerdos</Label>
                                        <SelectableTable
                                            columns={pigsColumns}
                                            data={pigs}
                                            selectionMode="multiple"
                                            showSearchAndFilter={false}
                                            rowsPerPage={5}
                                            showPagination={true}
                                            onSelect={(rows) => setTrackedPigsInsert({ ...trackedPigsInsert, pigsSelected: rows })}
                                        />
                                    </div>

                                    <div className="d-flex mt-3 justify-content-end">
                                        <Button type="button" onClick={() => checkInsertData()}>
                                            Siguiente
                                            <i className="ri-arrow-right-line ms-2" />
                                        </Button>
                                    </div>
                                </>
                            ) : insertMode === "untracked" ? (
                                <>
                                    <div className="d-flex gap-2">
                                        <KPI title={"Cerdos machos"} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                        <KPI title={"Cerdos hembras"} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                        <KPI title={"Cerdos totales"} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                                    </div>

                                    <div className="d-flex gap-2 mb-3">
                                        <div className="w-50">
                                            <Label htmlFor="femaleCount" className="form-label">Hembras a ingresar</Label>
                                            <Input
                                                type="number"
                                                id="femaleCount"
                                                name="femaleCount"
                                                value={untrackedPigsInsert.femaleCount === 0 ? "0" : untrackedPigsInsert.femaleCount}
                                                onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ""; }}
                                                onBlur={(e) => {
                                                    if (e.target.value === "") {
                                                        setUntrackedPigsInsert(prev => ({ ...prev, femaleCount: 0 }));
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    setUntrackedPigsInsert(prev => ({
                                                        ...prev,
                                                        femaleCount: Number(e.target.value)
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div className="w-50">
                                            <Label htmlFor="maleCount" className="form-label">Machos a ingresar</Label>
                                            <Input
                                                type="number"
                                                id="maleCount"
                                                name="maleCount"
                                                value={untrackedPigsInsert.maleCount === 0 ? "0" : untrackedPigsInsert.maleCount}
                                                onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ""; }}
                                                onBlur={(e) => {
                                                    if (e.target.value === "") {
                                                        setUntrackedPigsInsert(prev => ({ ...prev, maleCount: 0 }));
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    setUntrackedPigsInsert(prev => ({
                                                        ...prev,
                                                        maleCount: Number(e.target.value)
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <div className="w-50">
                                            <Label htmlFor="date" className="form-label">Fecha de ingreso</Label>
                                            <DatePicker
                                                id="date"
                                                className="form-control"
                                                value={untrackedPigsInsert.date ?? undefined}
                                                onChange={(date: Date[]) => {
                                                    if (date[0]) {
                                                        setUntrackedPigsInsert({
                                                            ...untrackedPigsInsert,
                                                            date: date[0],
                                                        });
                                                    }
                                                }}
                                                options={{ dateFormat: "d/m/Y" }}
                                            />
                                        </div>

                                        <div className="w-50">
                                            <Label htmlFor="responsible" className="form-label">Responsable del retiro</Label>
                                            <Input
                                                type="text"
                                                id="responsible"
                                                name="responsible"
                                                value={`${userLogged.name} ${userLogged.lastname}`}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex mt-3 justify-content-end">
                                        <Button type="button" onClick={() => checkInsertData()}>
                                            Siguiente
                                            <i className="ri-arrow-right-line ms-2" />
                                        </Button>
                                    </div>
                                </>
                            ) : null}
                        </>
                    )}
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    {insertMode === 'tracked' ? (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={"Machos para ingresar"} value={trackedPigsInsert.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={"Hembras para ingresar"} value={trackedPigsInsert.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={"Total para ingresar"} value={trackedPigsInsert.maleCount + trackedPigsInsert.femaleCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>
                            <div className="d-flex gap-3">
                                <Card className="w-25">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Informacion del ingreso</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={insertAttributes} object={trackedPigsInsert} />
                                    </CardBody>
                                </Card>

                                <Card className="w-75">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Cerdos seleccionados</h5>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <CustomTable columns={pigsColumns} data={trackedPigsInsert.pigsSelected} showSearchAndFilter={false} showPagination={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={"Machos para ingresar"} value={untrackedPigsInsert.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={"Hembras para ingresar"} value={untrackedPigsInsert.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={"Total para ingresar"} value={untrackedPigsInsert.maleCount + untrackedPigsInsert.femaleCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>
                            <div>
                                <Card className="">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Informacion del ingreso</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={insertAttributes} object={untrackedPigsInsert} />
                                    </CardBody>
                                </Card>

                            </div>
                        </>
                    )}

                    <div className="d-flex mt-3 justify-content-between">
                        <Button type="button" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atras
                        </Button>

                        <Button className="btn-success d-flex align-items-center" type="button" onClick={() => handleInsertPigs()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    Confirmar
                                    <i className="ri-check-line ms-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Cerdos ingresados con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error al ingresar los cerdos, intentelo mas tarde"} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default GroupInsertForm;