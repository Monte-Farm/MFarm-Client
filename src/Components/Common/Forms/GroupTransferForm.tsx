import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import { Badge, Button, Card, CardBody, CardHeader, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import AlertMessage from "../Shared/AlertMesagge";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import SelectableCustomTable from "../Tables/SelectableTable";
import { Column } from "common/data/data_types";
import DatePicker from "react-flatpickr";
import { FaMars, FaVenus, FaPiggyBank } from "react-icons/fa";
import KPI from "../Graphics/Kpi";
import SelectableTable from "../Tables/SelectableTable";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import { Attribute } from "common/data_interfaces";
import { useTranslation } from "react-i18next";


interface GroupTransferFormProps {
    groupId: string;
    stage: string;
    onSave: () => void
}

const GroupTransferForm: React.FC<GroupTransferFormProps> = ({ groupId, stage, onSave }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [modals, setModals] = useState({ success: false, error: false })
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [groupData, setGroupData] = useState<any>({})
    const [availableGroups, setAvailableGroups] = useState<any[]>([])
    const [groupPigs, setGroupPigs] = useState<any[]>([])
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [transferMode, setTransferMode] = useState<"tracked" | "untracked" | null>(null);
    const [untrackedPigsTransfer, setUntrackedPigsTransfer] = useState({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
        groupDestiny: ''
    });
    const [trackedPigsTransfer, setTrackedPigsTransfer] = useState<{
        responsible: string;
        femaleCount: number;
        maleCount: number;
        date: Date;
        pigsSelected: any[];
        groupDestiny: string;
    }>({
        responsible: userLogged._id,
        femaleCount: 0,
        maleCount: 0,
        date: new Date(),
        pigsSelected: [],
        groupDestiny: ''
    });

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

    const checkGroupDestinySelected = () => {
        if (transferMode === 'tracked') {
            trackedPigsTransfer.groupDestiny === undefined ? setAlertConfig({ visible: true, color: 'danger', message: t('groups.form.transfer.validationGroup', { defaultValue: 'Por favor seleccione un grupo de destino' }) }) : toggleArrowTab(activeStep + 1)
        } else {
            untrackedPigsTransfer.groupDestiny === undefined ? setAlertConfig({ visible: true, color: 'danger', message: t('groups.form.transfer.validationGroup', { defaultValue: 'Por favor seleccione un grupo de destino' }) }) : toggleArrowTab(activeStep + 1)
        }
    }

    const transferAttributes: Attribute[] = [
        { key: 'date', label: t('groups.form.transfer.transferDateLabel', { defaultValue: 'Fecha de la transferencia' }), type: 'date' },
        { key: 'maleCount', label: t('groups.kpi.males', { defaultValue: 'Machos' }), type: 'text' },
        { key: 'femaleCount', label: t('groups.kpi.females', { defaultValue: 'Hembras' }), type: 'text' },
        {
            key: 'responsible',
            label: t('common.field.responsible', { defaultValue: 'Responsable' }),
            type: 'text',
            render: (_, obj) => <span>{userLogged.name} {userLogged.lastname}</span>
        },
    ];

    const pigsColumns: Column<any>[] = [
        { header: t('groups.column.code', { defaultValue: 'Codigo' }), accessor: 'code', },
        {
            header: t('groups.column.sex', { defaultValue: 'Sexo' }),
            accessor: 'sex',
            render: (value: string) => (
                <Badge color={value === 'male' ? "info" : "danger"}>
                    {value === 'male' ? `♂ ${t('pigs.sex.male', { defaultValue: 'Macho' })}` : `♀ ${t('pigs.sex.female', { defaultValue: 'Hembra' })}`}
                </Badge>
            ),
        },
        { header: t('groups.column.breed', { defaultValue: 'Raza' }), accessor: 'breed', type: 'text', isFilterable: true },
        { header: t('groups.column.weight', { defaultValue: 'Peso actual' }), accessor: 'weight', type: 'number', isFilterable: true },
        { header: t('groups.metric.currentStage', { defaultValue: 'Etapa actual' }), accessor: 'currentStage', type: 'text', isFilterable: true },
        { header: t('groups.column.birthDate', { defaultValue: 'Fecha de N.' }), accessor: 'birthdate', type: 'date' },
    ];

    const groupsColumns: Column<any>[] = [
        { header: t('groups.column.code', { defaultValue: 'Codigo' }), accessor: 'code', type: 'text', isFilterable: true },
        { header: t('groups.column.name', { defaultValue: 'Nombre' }), accessor: 'name', type: 'text', isFilterable: true },
        {
            header: t('groups.column.area', { defaultValue: 'Área' }),
            accessor: 'area',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                switch (row.area) {
                    case "gestation": color = "info"; break;
                    case "farrowing": color = "primary"; break;
                    case "maternity": color = "primary"; break;
                    case "weaning": color = "success"; break;
                    case "nursery": color = "warning"; break;
                    case "fattening": color = "dark"; break;
                    case "replacement": color = "secondary"; break;
                    case "boars": color = "info"; break;
                    case "quarantine": color = "danger"; break;
                    case "hospital": color = "danger"; break;
                    case "shipping": color = "secondary"; break;
                }
                return <Badge color={color}>{t(`groups.area.${row.area}`, { defaultValue: row.area })}</Badge>;
            },
        },
        { header: t('groups.column.creationDate', { defaultValue: 'Fecha de creación' }), accessor: 'creationDate', type: 'date', isFilterable: true },
        { header: t('groups.column.total', { defaultValue: 'No. de cerdos' }), accessor: 'pigCount', type: 'text', isFilterable: true },
        { header: t('groups.column.femaleCount', { defaultValue: 'No. de hembras' }), accessor: 'femaleCount', type: 'text', isFilterable: true },
        { header: t('groups.column.maleCount', { defaultValue: 'No. de machos' }), accessor: 'maleCount', type: 'text', isFilterable: true },
    ];

    const fetchData = async () => {
        if (!configContext) return;
        try {
            setLoading(true);

            const [groupResponse, availableGroupsResponse,] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_stage/${userLogged.farm_assigned}/${stage}`),
            ]);

            const groupData = groupResponse.data.data;
            setGroupData(groupData);

            if (groupData.pigsInGroup.length === 0) {
                setTransferMode("untracked");
                const availableGroups = availableGroupsResponse.data.data.filter((group: any) => group._id !== groupData._id && group.pigsInGroup.length === 0 || (group.femaleCount === 0 && group.maleCount === 0 && group.pigsInGroup.length === 0))
                const groupsWithId = availableGroups.map((b: any) => ({ ...b, id: b._id }));
                setAvailableGroups(groupsWithId)
            } else {
                setTransferMode("tracked");
                const availableGroups = availableGroupsResponse.data.data.filter((group: any) => group._id !== groupData._id && group.pigsInGroup.length > 0 || (group.femaleCount === 0 && group.maleCount === 0 && group.pigsInGroup.length === 0))
                const groupsWithId = availableGroups.map((b: any) => ({ ...b, id: b._id }));
                setAvailableGroups(groupsWithId)

                const pigsWithId = groupResponse.data.data.pigsInGroup.map((b: any) => ({ ...b, id: b._id }));
                const pigsFiltered = pigsWithId.filter((p: any) => p.status === 'alive')
                setGroupPigs(pigsFiltered)
            }
        } catch (error) {
            logger.error("Error fetching data", { error });
            setAlertConfig({ visible: true, color: "danger", message: t('groups.error.load', { defaultValue: 'Ha ocurrido un error al obtener los datos, inténtelo más tarde' }) });
        } finally {
            setLoading(false);
        }
    };

    const handleTransferPigs = async () => {
        if (!configContext) return;
        try {
            setIsSubmitting(true)
            if (transferMode === 'tracked') {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/transfer_tracked_pigs/${groupId}`, trackedPigsTransfer)

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Transferencia de cerdos de grupo: ${groupData.code} a ${trackedPigsTransfer.groupDestiny}`
                });
            } else {
                await configContext.axiosHelper.create(`${configContext.apiUrl}/group/transfer_untracked_pigs/${groupId}`, untrackedPigsTransfer)

                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Transferencia de cerdos de grupo: ${groupData.code} a ${untrackedPigsTransfer.groupDestiny}`
                });
            }

            toggleModal('success')
        } catch (error) {
            logger.error('Error in insertPigs:', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const checkTransferData = () => {
        if (transferMode === 'tracked') {
            if (trackedPigsTransfer.pigsSelected.length === 0) {
                setAlertConfig({ visible: true, message: t('groups.form.transfer.validationSelect', { defaultValue: 'Por favor, ingrese todos los campos o seleccione al menos 1 cerdo' }), color: 'danger' })
            } else {
                toggleArrowTab(activeStep + 1)
            }
        } else {
            if ((untrackedPigsTransfer.femaleCount === 0 && untrackedPigsTransfer.maleCount === 0)) {
                setAlertConfig({ visible: true, message: t('groups.form.transfer.validationCount', { defaultValue: 'Por favor, ingrese todos los campos o retire al menos un cerdo' }), color: 'danger' });
            } else {
                toggleArrowTab(activeStep + 1);
            }
        }
    }


    useEffect(() => {
        const femaleCount = trackedPigsTransfer.pigsSelected.filter((p) => p.sex === 'female').length
        const maleCount = trackedPigsTransfer.pigsSelected.filter((p) => p.sex === 'male').length
        setTrackedPigsTransfer({ ...trackedPigsTransfer, femaleCount: femaleCount, maleCount: maleCount })
    }, [trackedPigsTransfer.pigsSelected])

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
                            id="step-groupselect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            onClick={() => toggleArrowTab(1)}
                            aria-selected={activeStep === 1}
                            aria-controls="step-groupselect-tab"
                            disabled
                        >
                            {t('groups.form.transfer.step.groupSelect', { defaultValue: 'Selección de grupo de destino' })}
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-pigselect-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            onClick={() => toggleArrowTab(2)}
                            aria-selected={activeStep === 2}
                            aria-controls="step-pigselect-tab"
                            disabled
                        >
                            {t('groups.form.transfer.step.pigSelect', { defaultValue: 'Selección de cerdos' })}
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
                            onClick={() => toggleArrowTab(3)}
                            aria-selected={activeStep === 3}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            {t('groups.form.step3', { defaultValue: 'Resumen' })}
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane id="step-groupselect-tab" tabId={1}>
                    {groupData.pigsInGroup.length === 0 && groupData.maleCount === 0 && groupData.femaleCount === 0 ? (
                        <div className="d-flex flex-column justify-content-center align-items-center text-center py-5" style={{ color: "#888" }}>
                            <div>
                                <i className="ri-error-warning-line text-muted mb-3" style={{ fontSize: "3rem" }} />
                                <h5 className="mb-2">{t('groups.form.transfer.noPigs', { defaultValue: 'No hay cerdos disponibles para transferir' })}</h5>
                                <p className="text-muted mb-0">
                                    {t('groups.form.transfer.noPigsDesc', { defaultValue: 'Este grupo actualmente no tiene ningún cerdo registrado, por lo que no es posible realizar una transferencia.' })}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-3">
                                <Label htmlFor="date" className="form-label">{t('groups.form.transfer.groupDestinyLabel', { defaultValue: 'Seleccionar grupo de destino de los cerdos' })}</Label>
                                <SelectableCustomTable
                                    columns={groupsColumns}
                                    data={availableGroups}
                                    selectionMode="single"
                                    rowsPerPage={5}
                                    showPagination={true}
                                    onSelect={(rows) => transferMode === 'tracked' ? setTrackedPigsTransfer({ ...trackedPigsTransfer, groupDestiny: rows[0]?._id }) : setUntrackedPigsTransfer({ ...untrackedPigsTransfer, groupDestiny: rows[0]?._id })}
                                />
                            </div>

                            <div className="d-flex mt-3 justify-content-end">
                                <Button type="button" onClick={() => checkGroupDestinySelected()}>
                                    {t('common.button.next', { defaultValue: 'Siguiente' })}
                                    <i className="ri-arrow-right-line ms-2" />
                                </Button>
                            </div>
                        </>
                    )}

                </TabPane>

                <TabPane id="step-pigselect-tab" tabId={2}>
                    {transferMode === 'tracked' ? (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={t('groups.kpi.males', { defaultValue: 'Cerdos machos' })} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={t('groups.kpi.females', { defaultValue: 'Cerdos hembras' })} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={t('groups.kpi.totalPigs', { defaultValue: 'Cerdos totales' })} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>

                            <div className="d-flex gap-2">
                                <div className="w-50">
                                    <Label htmlFor="date" className="form-label">{t('groups.form.transfer.dateLabel', { defaultValue: 'Fecha de ingreso' })}</Label>
                                    <DatePicker
                                        id="date"
                                        className="form-control"
                                        value={trackedPigsTransfer.date ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) {
                                                setTrackedPigsTransfer({
                                                    ...trackedPigsTransfer,
                                                    date: date[0],
                                                });
                                            }
                                        }}
                                        options={{ dateFormat: "d/m/Y" }}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="responsible" className="form-label">{t('groups.form.transfer.responsibleLabel', { defaultValue: 'Responsable del ingreso' })}</Label>
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
                                    <Label htmlFor="femaleCount" className="form-label">{t('groups.form.transfer.femalesTransfer', { defaultValue: 'Hembras a transferir' })}</Label>
                                    <Input type="number" id="femaleCount" name="femaleCount" value={trackedPigsTransfer.femaleCount} disabled />
                                </div>
                                <div className="w-50">
                                    <Label htmlFor="maleCount" className="form-label">{t('groups.form.transfer.malesTransfer', { defaultValue: 'Machos a transferir' })}</Label>
                                    <Input type="number" id="maleCount" name="maleCount" value={trackedPigsTransfer.maleCount} disabled />
                                </div>
                            </div>

                            <div className="mt-3">
                                <Label htmlFor="maleCount" className="form-label">{t('groups.form.transfer.pigSelection', { defaultValue: 'Seleccion de cerdos' })}</Label>
                                <SelectableTable
                                    columns={pigsColumns}
                                    data={groupPigs}
                                    selectionMode="multiple"
                                    showSearchAndFilter={false}
                                    rowsPerPage={5}
                                    showPagination={true}
                                    onSelect={(rows) => setTrackedPigsTransfer({ ...trackedPigsTransfer, pigsSelected: rows })}
                                />
                            </div>

                            <div className="d-flex mt-3 justify-content-between">
                                <Button type="button" onClick={() => toggleArrowTab(activeStep - 1)}>
                                    <i className="ri-arrow-left-line me-2" />
                                    {t('common.button.back', { defaultValue: 'Atras' })}
                                </Button>
                                <Button type="button" onClick={() => checkTransferData()}>
                                    {t('common.button.next', { defaultValue: 'Siguiente' })}
                                    <i className="ri-arrow-right-line ms-2" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={t('groups.kpi.males', { defaultValue: 'Cerdos machos' })} value={groupData.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={t('groups.kpi.females', { defaultValue: 'Cerdos hembras' })} value={groupData.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={t('groups.kpi.totalPigs', { defaultValue: 'Cerdos totales' })} value={groupData.pigCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>

                            <div className="d-flex gap-2 mb-3">
                                <div className="w-50">
                                    <Label htmlFor="femaleCount" className="form-label">{t('groups.form.transfer.femalesTransfer', { defaultValue: 'Hembras a transferir' })}</Label>
                                    <Input
                                        type="number"
                                        id="femaleCount"
                                        name="femaleCount"
                                        value={untrackedPigsTransfer.femaleCount === 0 ? "0" : untrackedPigsTransfer.femaleCount}
                                        onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ""; }}
                                        onBlur={(e) => {
                                            if (e.target.value === "") {
                                                setUntrackedPigsTransfer(prev => ({ ...prev, femaleCount: 0 }));
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            const max = groupData?.femaleCount ?? 0;
                                            setUntrackedPigsTransfer(prev => ({
                                                ...prev,
                                                femaleCount: value > max ? max : value,
                                            }));
                                        }}
                                        max={groupData?.femaleCount ?? 0}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="maleCount" className="form-label">{t('groups.form.transfer.malesTransfer', { defaultValue: 'Machos a transferir' })}</Label>
                                    <Input
                                        type="number"
                                        id="maleCount"
                                        name="maleCount"
                                        value={untrackedPigsTransfer.maleCount === 0 ? "0" : untrackedPigsTransfer.maleCount}
                                        onFocus={(e) => { if (Number(e.target.value) === 0) e.target.value = ""; }}
                                        onBlur={(e) => {
                                            if (e.target.value === "") {
                                                setUntrackedPigsTransfer(prev => ({ ...prev, maleCount: 0 }));
                                            }
                                        }}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            const max = groupData?.maleCount ?? 0;
                                            setUntrackedPigsTransfer(prev => ({
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
                                    <Label htmlFor="date" className="form-label">{t('groups.form.transfer.dateLabel', { defaultValue: 'Fecha de ingreso' })}</Label>
                                    <DatePicker
                                        id="date"
                                        className="form-control"
                                        value={untrackedPigsTransfer.date ?? undefined}
                                        onChange={(date: Date[]) => {
                                            if (date[0]) {
                                                setUntrackedPigsTransfer({
                                                    ...untrackedPigsTransfer,
                                                    date: date[0],
                                                });
                                            }
                                        }}
                                        options={{ dateFormat: "d/m/Y" }}
                                    />
                                </div>

                                <div className="w-50">
                                    <Label htmlFor="responsible" className="form-label">{t('groups.form.transfer.responsibleWithdraw', { defaultValue: 'Responsable del retiro' })}</Label>
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
                                <Button type="button" onClick={() => checkTransferData()}>
                                    {t('common.button.next', { defaultValue: 'Siguiente' })}
                                    <i className="ri-arrow-right-line ms-2" />
                                </Button>
                            </div>
                        </>
                    )}



                </TabPane>

                <TabPane id="step-summary-tab" tabId={3}>
                    {transferMode === 'tracked' ? (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={t('groups.form.transfer.malesSummary', { defaultValue: 'Machos para transferir' })} value={trackedPigsTransfer.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={t('groups.form.transfer.femalesSummary', { defaultValue: 'Hembras para transferir' })} value={trackedPigsTransfer.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={t('groups.form.transfer.totalSummary', { defaultValue: 'Total para transferir' })} value={trackedPigsTransfer.maleCount + trackedPigsTransfer.femaleCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>
                            <div className="d-flex gap-3">
                                <Card className="w-25">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>{t('groups.form.transfer.transferInfo', { defaultValue: 'Informacion de la transferencia' })}</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={transferAttributes} object={trackedPigsTransfer} />
                                    </CardBody>
                                </Card>

                                <Card className="w-75">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>{t('groups.form.transfer.pigsSelected', { defaultValue: 'Cerdos seleccionados' })}</h5>
                                    </CardHeader>
                                    <CardBody className="p-0">
                                        <CustomTable columns={pigsColumns} data={trackedPigsTransfer.pigsSelected} showSearchAndFilter={false} showPagination={false} />
                                    </CardBody>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="d-flex gap-2">
                                <KPI title={t('groups.form.transfer.malesSummary', { defaultValue: 'Machos para transferir' })} value={untrackedPigsTransfer.maleCount} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                <KPI title={t('groups.form.transfer.femalesSummary', { defaultValue: 'Hembras para transferir' })} value={untrackedPigsTransfer.femaleCount} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                <KPI title={t('groups.form.transfer.totalSummary', { defaultValue: 'Total para transferir' })} value={untrackedPigsTransfer.maleCount + untrackedPigsTransfer.femaleCount} icon={FaPiggyBank} bgColor="#F0F0F0" iconColor="#6C757D" />
                            </div>
                            <div>
                                <Card className="">
                                    <CardHeader className="bg-light text-white fs-5">
                                        <h5>{t('groups.form.transfer.transferInfoAlt', { defaultValue: 'Informacion de transferencia' })}</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={transferAttributes} object={untrackedPigsTransfer} />
                                    </CardBody>
                                </Card>

                            </div>
                        </>
                    )}

                    <div className="d-flex justify-content-between">
                        <Button type="button" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            {t('common.button.back', { defaultValue: 'Atras' })}
                        </Button>

                        <Button className="btn-success d-flex align-items-center" type="button" disabled={isSubmitting} onClick={() => handleTransferPigs()}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('groups.form.saving', { defaultValue: 'Guardando...' })}
                                </>
                            ) : (
                                <>
                                    {t('groups.form.confirm', { defaultValue: 'Confirmar' })}
                                    <i className="ri-check-line ms-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={t('groups.form.transfer.success', { defaultValue: 'Cerdos transferidos con exito' })} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={t('groups.form.transfer.error', { defaultValue: 'Ha ocurrido un error al transferir a los cerdos, intentelo mas tarde' })} />
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} />
        </>
    )
}

export default GroupTransferForm;
