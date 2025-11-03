import { ConfigContext } from "App";
import { useContext, useEffect, useImperativeHandle, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import KPI from "../Graphics/Kpi";
import { IconBaseProps } from "react-icons";
import { FaMars, FaPiggyBank, FaVenus } from "react-icons/fa";
import DatePicker from "react-flatpickr";
import { getLoggedinUser } from "helpers/api_helper";
import SelectableCustomTable from "../Tables/SelectableTable";
import SelectableTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";
import ObjectDetails from "../Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import CustomTable from "../Tables/CustomTable";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface GroupWithDrawFormProps {
    groupId: string
    onSave: () => void
}

const GroupWithDrawForm: React.FC<GroupWithDrawFormProps> = ({ groupId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ success: false, error: false })
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [groupData, setGroupData] = useState<any>({})
    const [pigs, setPigs] = useState<any[]>([])
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [untrackedPigsWithdraw, setUntrackedPigsWithdraw] = useState({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
        withdrawReason: "",
    });
    const [trackedPigsWithdraw, setTrackedPigsWithdraw] = useState<{
        responsible: string;
        femaleCount: number;
        maleCount: number;
        date: Date;
        withdrawReason: string;
        pigsSelected: any[];
    }>({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
        withdrawReason: "",
        pigsSelected: [],
    });

    const pigsColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', },
        {
            header: 'Sexo',
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'macho' ? "info" : "danger"}>
                    {value === 'macho' ? "♂ Macho" : "♀ Hembra"}
                </Badge>
            ),
        },
        { header: 'Raza', accessor: 'breed', type: 'text', isFilterable: true },
        { header: 'Peso actual', accessor: 'weight', type: 'number', isFilterable: true },
        { header: 'Etapa actual', accessor: 'currentStage', type: 'text', isFilterable: true },
        { header: 'Fecha de N.', accessor: 'birthdate', type: 'date' },
    ]

    const withDrawAttributes: Attribute[] = [
        { key: 'date', label: 'Fecha de retiro', type: 'date' },
        { key: 'maleCount', label: 'Machos', type: 'text' },
        { key: 'femaleCount', label: 'Hembras', type: 'text' },
        { key: 'withdrawReason', label: 'Razon de retiro', type: 'text' },
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

    const fetchGroupData = async () => {
        if (!configContext) return;
        try {
            setLoading(true)
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            setGroupData(groupResponse.data.data)
            const pigsWithId = groupResponse.data.data.pigsInGroup.map((b: any) => ({ ...b, id: b._id }));
            setPigs(pigsWithId);
        } catch (error) {
            console.error('Error fetching data', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un errro la obtener los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const handleWithdrawPigs = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true)
            if (groupData.pigsInGroup.length > 0) {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_tracked_pigs/${groupId}`, trackedPigsWithdraw)
            } else {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/withdraw_untracked_pigs/${groupId}`, untrackedPigsWithdraw)
            }

            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Retiro de cerdos de grupo: ${groupData.code}`
            });

            toggleModal('success')
        } catch (error) {
            console.error('Error in withdrawPigs:', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkWithdrawData = () => {
        if (groupData.pigsInGroup.length > 0) {
            if (trackedPigsWithdraw.pigsSelected.length === 0 || trackedPigsWithdraw.withdrawReason === '') {
                setAlertConfig({ visible: true, message: 'Por favor, ingrese todos los campos o seleccione al menos 1 cerdo', color: 'danger' })
            } else {
                toggleArrowTab(activeStep + 1)
            }
        } else {
            if ((untrackedPigsWithdraw.femaleCount === 0 && untrackedPigsWithdraw.maleCount === 0) || untrackedPigsWithdraw.withdrawReason === "") {
                setAlertConfig({ visible: true, message: 'Por favor, ingrese todos los campos o retire al menos un cerdo', color: 'danger' });
            } else {
                toggleArrowTab(activeStep + 1);
            }
        }
    }

    useEffect(() => {
        const femaleCount = trackedPigsWithdraw.pigsSelected.filter((p) => p.sex === 'hembra').length
        const maleCount = trackedPigsWithdraw.pigsSelected.filter((p) => p.sex === 'macho').length
        setTrackedPigsWithdraw({ ...trackedPigsWithdraw, femaleCount: femaleCount, maleCount: maleCount })
    }, [trackedPigsWithdraw.pigsSelected])

    useEffect(() => {
        fetchGroupData();
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
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-pigselect-tab" tabId={1}>
                    {groupData.pigsInGroup.length > 0 ? (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={"Cerdos machos"} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={"Cerdos hembras"} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={"Cerdos totales"} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>

                            <div className="d-flex gap-2">
                                <div className="w-50">
                                    <Label htmlFor="date" className="form-label">
                                        Fecha de retiro
                                    </Label>
                                    <DatePicker
                                        id="date"
                                        className="form-control"
                                        value={trackedPigsWithdraw.date ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) {
                                                setUntrackedPigsWithdraw({
                                                    ...trackedPigsWithdraw,
                                                    date: date[0],
                                                });
                                            }
                                        }}
                                        options={{ dateFormat: "d/m/Y" }}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="withdrawReason" className="form-label">Motivo del retiro</Label>
                                    <Input
                                        type="text"
                                        id="withdrawReason"
                                        name="withdrawReason"
                                        value={trackedPigsWithdraw.withdrawReason}
                                        onChange={(e) =>
                                            setTrackedPigsWithdraw({
                                                ...trackedPigsWithdraw,
                                                withdrawReason: e.target.value,
                                            })
                                        }
                                        placeholder="Ej: Muerte"
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

                            <div className="d-flex gap-2 mt-3">
                                <div className="w-50">
                                    <Label htmlFor="femaleCount" className="form-label">Hembras a retirar</Label>
                                    <Input
                                        type="number"
                                        id="femaleCount"
                                        name="femaleCount"
                                        value={trackedPigsWithdraw.femaleCount}
                                        disabled
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="maleCount" className="form-label">Machos a retirar</Label>
                                    <Input
                                        type="number"
                                        id="maleCount"
                                        name="maleCount"
                                        value={trackedPigsWithdraw.maleCount}
                                        disabled
                                    />
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
                                    onSelect={(rows) => setTrackedPigsWithdraw({ ...trackedPigsWithdraw, pigsSelected: rows })}
                                />
                            </div>

                            <div className="d-flex mt-3 justify-content-end">
                                <Button type="button" onClick={() => checkWithdrawData()}>
                                    Siguiente
                                    <i className="ri-arrow-right-line ms-2" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={"Cerdos machos"} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={"Cerdos hembras"} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={"Cerdos totales"} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>

                            <div className="d-flex gap-2 mb-3">
                                <div className="w-50">
                                    <Label htmlFor="femaleCount" className="form-label">Hembras a retirar</Label>
                                    <Input
                                        type="number"
                                        id="femaleCount"
                                        name="femaleCount"
                                        value={untrackedPigsWithdraw.femaleCount === 0 ? "0" : untrackedPigsWithdraw.femaleCount}
                                        onFocus={(e) => {
                                            if (Number(e.target.value) === 0) e.target.value = "";
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === "") {
                                                setUntrackedPigsWithdraw(prev => ({ ...prev, femaleCount: 0 }));
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            const max = groupData?.femaleCount ?? 0;
                                            setUntrackedPigsWithdraw(prev => ({
                                                ...prev,
                                                femaleCount: value > max ? max : value,
                                            }));
                                        }}
                                        max={groupData?.femaleCount ?? 0}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="maleCount" className="form-label">Machos a retirar</Label>
                                    <Input
                                        type="number"
                                        id="maleCount"
                                        name="maleCount"
                                        value={untrackedPigsWithdraw.maleCount === 0 ? "0" : untrackedPigsWithdraw.maleCount}
                                        onFocus={(e) => {
                                            if (Number(e.target.value) === 0) e.target.value = "";
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === "") {
                                                setUntrackedPigsWithdraw(prev => ({ ...prev, maleCount: 0 }));
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            const max = groupData?.maleCount ?? 0;
                                            setUntrackedPigsWithdraw(prev => ({
                                                ...prev,
                                                maleCount: value > max ? max : value,
                                            }));
                                        }}
                                        max={groupData?.maleCount ?? 0}
                                    />
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <div className="w-50">
                                    <Label htmlFor="date" className="form-label">
                                        Fecha de retiro
                                    </Label>
                                    <DatePicker
                                        id="date"
                                        className="form-control"
                                        value={untrackedPigsWithdraw.date ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) {
                                                setUntrackedPigsWithdraw({
                                                    ...untrackedPigsWithdraw,
                                                    date: date[0],
                                                });
                                            }
                                        }}
                                        options={{ dateFormat: "d/m/Y" }}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="withdrawReason" className="form-label">Motivo del retiro</Label>
                                    <Input
                                        type="text"
                                        id="withdrawReason"
                                        name="withdrawReason"
                                        value={untrackedPigsWithdraw.withdrawReason}
                                        onChange={(e) =>
                                            setUntrackedPigsWithdraw({
                                                ...untrackedPigsWithdraw,
                                                withdrawReason: e.target.value,
                                            })
                                        }
                                        placeholder="Ej: Muerte"
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
                                <Button type="button" onClick={() => checkWithdrawData()}>
                                    Siguiente
                                    <i className="ri-arrow-right-line ms-2" />
                                </Button>
                            </div>
                        </>
                    )}
                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    {groupData.pigsInGroup.length > 0 ? (
                        <>
                            <div className="d-flex gap-3">
                                <Card className="w-25">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Informacion del retiro</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={withDrawAttributes} object={trackedPigsWithdraw} />
                                    </CardBody>
                                </Card>

                                <Card className="w-75">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Cerdos seleccionados</h5>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <CustomTable columns={pigsColumns} data={trackedPigsWithdraw.pigsSelected} showSearchAndFilter={false} showPagination={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Card className="">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>Informacion del retiro</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={withDrawAttributes} object={untrackedPigsWithdraw} />
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

                        <Button className="btn-success d-flex align-items-center" type="button" onClick={() => handleWithdrawPigs()} disabled={isSubmitting}>
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

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Cerdos retirados con exito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error al retirar los cerdos, intentelo mas tarde"} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default GroupWithDrawForm;