import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { Attribute, GroupData, PigData } from "common/data_interfaces";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, FormFeedback, Input, Label, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";
import DatePicker from "react-flatpickr";
import SelectableCustomTable from "../Tables/SelectableTable";
import noImageUrl from '../../../assets/images/no-image.png'
import * as Yup from "yup";
import AlertMessage from "../Shared/AlertMesagge";
import ObjectDetails from "../Details/ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import ErrorModal from "../Shared/ErrorModal";
import MissingStockModal from "../Shared/MissingStockModal";
import SuccessModal from "../Shared/SuccessModal";

interface AsignGroupMedicationFormProps {
    groupId: string
    onSave: () => void;
}

const AsignGroupMedicationForm: React.FC<AsignGroupMedicationFormProps> = ({ groupId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [groupDetails, setGroupDetails] = useState<GroupData>()
    const [medicationsItems, setMedicationsItems] = useState<any[]>([]);
    const [missingItems, setMissingItems] = useState([]);
    const [medicationsSelected, setMedicationsSelected] = useState<any[]>([])
    const [medicationErrors, setMedicationErrors] = useState<Record<string, any>>({});
    const [applicationDate, setApplicationDate] = useState<Date>(new Date())
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const medicationsColumns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: 'Categoria',
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "medications":
                        color = "info";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Dosis por cerdo",
            accessor: "dosePerPig",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.dosePerPig ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.dosePerPig === 0 ? "" : (selected?.dosePerPig ?? "")}
                            invalid={medicationErrors[row._id]?.dosePerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const totalDoseNew = Number(newValue * (groupDetails?.pigCount ?? 0))
                                setMedicationsSelected(prev =>
                                    prev.map(m => m.medication === row._id ? { ...m, dosePerPig: newValue, totalDose: totalDoseNew } : m)
                                );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-describedby="unit-addon"
                        />
                        <span className="input-group-text" id="unit-addon">{row.unit_measurement}</span>
                    </div>

                );
            },
        },
        {
            header: "Vía de administración",
            accessor: "administration_route",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.administrationRoute ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={medicationErrors[row._id]?.administrationRoute}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, administrationRoute: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Seleccione...</option>
                        <option value="oral">Oral</option>
                        <option value="intramuscular">Intramuscular</option>
                        <option value="subcutaneous">Subcutánea</option>
                        <option value="intravenous">Intravenosa</option>
                        <option value="intranasal">Intranasal</option>
                        <option value="topical">Tópica</option>
                        <option value="rectal">Rectal</option>
                    </Input>
                );
            }
        },
        {
            header: "Observaciones",
            accessor: "observations",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = medicationsSelected.find(m => m.medication === row._id);
                const realValue = selected?.observations ?? "";
                return (
                    <Input
                        type="text"
                        disabled={!isSelected}
                        value={realValue}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setMedicationsSelected(prev =>
                                prev.map(m => m.medication === row._id ? { ...m, observations: newValue } : m)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            }
        },
    ];

    const groupAttributes: Attribute[] = [
        { label: 'Codigo', key: 'code', type: 'text' },
        { label: 'Nombre', key: 'name', type: 'text' },
        {
            label: 'Area',
            key: 'area',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (object.area) {
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
            label: 'Etapa',
            key: 'stage',
            type: 'text',
            render: (value, object) => {
                let color = "secondary";
                let label = object.stage;

                switch (object.stage) {
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
        { label: 'Cerdos', key: 'pigCount', type: 'text' },
        { label: 'Fecha de creacion', key: 'creationDate', type: 'date' },
        { label: 'Observaciones', key: 'observations', type: 'text' },
    ]

    const selectedMedicationsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Dosis por cerdo",
            accessor: "dosePerPig",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dosePerPig} {row.unit_measurement}</span>
        },
        {
            header: "Dosis total",
            accessor: "totalDose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalDose} {row.unit_measurement}</span>
        },
        {
            header: 'Categoria',
            accessor: 'category',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "medications":
                        color = "info";
                        label = "Medicamentos";
                        break;
                    case "vaccines":
                        color = "primary";
                        label = "Vacunas";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Administracion",
            accessor: "administrationRoute",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "oral":
                        color = "info";
                        label = "Oral";
                        break;
                    case "intramuscular":
                        color = "primary";
                        label = "Intramuscular";
                        break;
                    case "subcutaneous":
                        color = "primary";
                        label = "Subcutánea";
                        break;
                    case "intravenous":
                        color = "primary";
                        label = "Intravenosa";
                        break;
                    case "intranasal":
                        color = "primary";
                        label = "Intranasal";
                        break;
                    case "topical":
                        color = "primary";
                        label = "Tópica";
                        break;
                    case "rectal":
                        color = "primary";
                        label = "Rectal";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true)
            const groupResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${groupId}`)
            const groupData = groupResponse.data.data;
            setGroupDetails(groupData)

            const medicationsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_medication_products`)
            const medicationsWithId = medicationsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setMedicationsItems(medicationsWithId)
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!configContext || !userLogged) return;
        try {
            setIsSubmitting(true);
            const medicationsData = medicationsSelected.map(prev => ({ ...prev, applicationDate: applicationDate }))

            const medicationResponse = await configContext.axiosHelper.create(`${configContext.apiUrl}/medication_package/asign_group_medications/${userLogged.farm_assigned}/${groupId}`, medicationsData)
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Medicación asignada al grupo ${groupDetails?.code}`
            });

            toggleModal('success', true)
        } catch (error: any) {
            console.error('Error saving the information: ', { error })
            if (error.response?.status === 400 && error.response?.data?.missing) {
                setMissingItems(error.response.data.missing);
                toggleModal('missingStock');
                return;
            }
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const medicationValidation = Yup.object({
        medication: Yup.string().required(),
        dosePerPig: Yup.number()
            .moreThan(0, "Cantidad inválida")
            .required("Cantidad requerida"),
        administrationRoute: Yup.string()
            .required("Vía requerida")
            .notOneOf([""], "Debe seleccionar una vía"),
    });

    const validateSelectedMedications = async () => {
        const errors: Record<string, any> = {};

        if (medicationsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 medicamento' })
            return false;
        }

        for (const med of medicationsSelected) {
            try {
                await medicationValidation.validate(med, { abortEarly: false });
            } catch (err: any) {
                const medErrors: any = {};

                err.inner.forEach((e: any) => {
                    medErrors[e.path] = true;
                });

                errors[med.medication] = medErrors;
            }
        }

        setMedicationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de las medicaciones seleccionadas' })
            return false;
        }

        return true;
    };

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
                            id="step-packageSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            Selección de medicamentos
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
                <TabPane id="step-medicationSelect-tab" tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">Responsable de aplicacion</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>

                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">Fecha de aplicacion</Label>
                            <DatePicker
                                id="applicationDate"
                                className={`form-control`}
                                value={applicationDate}
                                onChange={(date: Date[]) => {
                                    if (date[0]) setApplicationDate(date[0]);
                                }}
                                options={{ dateFormat: 'd/m/Y' }}
                            />
                        </div>
                    </div>

                    <div className="mt-3">
                        <Label htmlFor="user" className="form-label">Seleccion de medicamentos</Label>
                        <SelectableCustomTable
                            columns={medicationsColumns}
                            data={medicationsItems}
                            showPagination={true}
                            rowsPerPage={6}
                            onSelect={(rows) => {
                                setMedicationsSelected(prev => {
                                    const newRows = rows.map(r => {
                                        const existing = prev.find(p => p.medication === r._id);
                                        if (existing) return existing;

                                        return {
                                            medication: r._id,
                                            dosePerPig: 0,
                                            administrationRoute: "",
                                            applicationDate: null,
                                            appliedBy: userLogged?._id,
                                            observations: "",
                                            isActive: true,
                                            totalDose: 0,
                                        };
                                    });
                                    return newRows;
                                });
                            }}
                        />
                    </div>

                    <div className="d-flex justify-content-between mt-4">
                        <Button
                            className="btn btn-primary ms-auto"
                            onClick={async () => {
                                const ok = await validateSelectedMedications();
                                if (!ok) return;
                                toggleArrowTab(2);
                            }}
                        >
                            Siguiente
                            <i className="ri-arrow-right-line ms-1" />
                        </Button>
                    </div>


                </TabPane>

                <TabPane id="step-summary-tab" tabId={2}>
                    <div className="d-flex gap-3 align-items-stretch">
                        <div className="">
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    Información del cerdo
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails
                                        attributes={groupAttributes}
                                        object={groupDetails ?? {}}
                                    />
                                </CardBody>
                            </Card>
                        </div>

                        <div className="w-100">
                            <Card className="shadow-sm">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Medicamentos</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedMedicationsColumns}
                                        data={medicationsSelected.map(ms => ({
                                            ...medicationsItems.find(p => p._id === ms.medication),
                                            ...ms
                                        }))}
                                        showSearchAndFilter={false}
                                    />
                                </CardBody>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-4 d-flex">
                        <Button className="btn-danger" onClick={() => toggleArrowTab(activeStep - 1)}>
                            <i className="ri-arrow-left-line me-2" />
                            Atrás
                        </Button>

                        <Button className="ms-auto btn-success" onClick={() => handleSubmit()} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div>
                                    <Spinner size='sm' />
                                </div>
                            ) : (
                                <div>
                                    <i className="ri-check-line me-2" />
                                    Asignar
                                </div>
                            )}

                        </Button>
                    </div>
                </TabPane>
            </TabContent>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error')} message={"Ha ocurrido un error, intentelo mas tarde"} />
            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Medicacion asignada correctamente"} />
            <MissingStockModal isOpen={modals.missingStock} onClose={() => toggleModal('missingStock', false)} missingItems={missingItems} />
        </>
    )
}

export default AsignGroupMedicationForm;