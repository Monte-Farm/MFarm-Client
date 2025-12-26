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

interface AsignGroupFeedingFormProps {
    groupId: string
    onSave: () => void;
}

const AsignGroupFeedingForm: React.FC<AsignGroupFeedingFormProps> = ({ groupId, onSave }) => {
    const userLogged = getLoggedinUser();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false });
    const [groupDetails, setGroupDetails] = useState<GroupData>()
    const [feedingItems, setFeedingItems] = useState<any[]>([]);
    const [missingItems, setMissingItems] = useState([]);
    const [feedingsSelected, setFeedingsSelected] = useState<any[]>([])
    const [feedingErrors, setFeedingErrors] = useState<Record<string, any>>({});
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

    const feedingsColumns: Column<any>[] = [
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
                    case "nutrition":
                        color = "info";
                        label = "Nutrición";
                        break;
                    case "vitamins":
                        color = "primary";
                        label = "Vitaminas";
                        break;
                    case "minerals":
                        color = "primary";
                        label = "Minerales";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            header: "Cantidad por cerdo",
            accessor: "quantity",
            type: "number",
            render: (value, row, isSelected) => {
                const selected = feedingsSelected.find(f => f.feeding === row._id);
                const realValue = selected?.quantity ?? "";

                return (
                    <div className="input-group">
                        <Input
                            type="number"
                            disabled={!isSelected}
                            value={selected?.quantityPerPig === 0 ? "" : (selected?.quantityPerPig ?? "")}
                            invalid={feedingErrors[row._id]?.quantityPerPig}
                            onChange={(e) => {
                                const newValue = e.target.value === "" ? 0 : Number(e.target.value);
                                const totalQuantityValue = Number(newValue * (groupDetails?.pigCount ?? 0));
                                const avgPerPigValue = Number(newValue / (groupDetails?.pigCount ?? 0));
                                setFeedingsSelected(prev =>
                                    prev.map(f => f.feeding === row._id ? { ...f, quantityPerPig: newValue, totalQuantity: totalQuantityValue, avgPerPig: avgPerPigValue } : f)
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
            header: "Periodicidad",
            accessor: "periodicity",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = feedingsSelected.find(f => f.feeding === row._id);
                const realValue = selected?.periodicity ?? "";
                return (
                    <Input
                        type="select"
                        disabled={!isSelected}
                        value={realValue}
                        invalid={feedingErrors[row._id]?.periodicity}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setFeedingsSelected(prev =>
                                prev.map(f => f.feeding === row._id ? { ...f, periodicity: newValue } : f)
                            );
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="">Seleccione...</option>
                        <option value="once_day">1 vez al día</option>
                        <option value="twice_day">2 veces al día</option>
                        <option value="three_times_day">3 veces al día</option>
                        <option value="ad_libitum">Ad libitum (libre acceso)</option>
                        <option value="weekly">1 vez a la semana</option>
                        <option value="biweekly">Cada 15 días</option>
                        <option value="monthly">Mensual</option>
                        <option value="specific_days">Días específicos</option>
                        <option value="by_event">Por evento productivo</option>
                    </Input>
                );
            }
        },
        {
            header: "Observaciones",
            accessor: "observations",
            type: "text",
            render: (value, row, isSelected) => {
                const selected = feedingsSelected.find(f => f.feeding === row._id);
                const realValue = selected?.observations ?? "";
                return (
                    <Input
                        type="text"
                        disabled={!isSelected}
                        value={realValue}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setFeedingsSelected(prev =>
                                prev.map(f => f.feeding === row._id ? { ...f, observations: newValue } : f)
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

    const selectedFeedingsColumns: Column<any>[] = [
        { header: "Codigo", accessor: "code", type: "text", isFilterable: true },
        { header: "Producto", accessor: "name", type: "text", isFilterable: true },
        {
            header: "Cantidad",
            accessor: "quantityPerPig",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.quantityPerPig} {row.unit_measurement}</span>
        },
        {
            header: "Total",
            accessor: "totalQuantity",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.totalQuantity} {row.unit_measurement}</span>
        },
        {
            header: "Promedio",
            accessor: "avgPerPig",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.avgPerPig} {row.unit_measurement}</span>
        },
        // {
        //     header: 'Categoria',
        //     accessor: 'category',
        //     render: (value: string) => {
        //         let color = "secondary";
        //         let label = value;

        //         switch (value) {
        //             case "nutrition":
        //                 color = "info";
        //                 label = "Nutrición";
        //                 break;
        //             case "vitamins":
        //                 color = "primary";
        //                 label = "Vitaminas";
        //                 break;
        //             case "minerals":
        //                 color = "primary";
        //                 label = "Minerales";
        //                 break;
        //         }

        //         return <Badge color={color}>{label}</Badge>;
        //     },
        // },
        {
            header: "Periodicidad",
            accessor: "periodicity",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "once_day":
                        color = "info";
                        label = "1 vez al día";
                        break;
                    case "twice_day":
                        color = "primary";
                        label = "2 veces al día";
                        break;
                    case "three_times_day":
                        color = "warning";
                        label = "3 veces al día";
                        break;
                    case "ad_libitum":
                        color = "success";
                        label = "Libre acceso";
                        break;
                    case "weekly":
                        color = "secondary";
                        label = "1 vez a la semana";
                        break;
                    case "biweekly":
                        color = "warning";
                        label = "Cada 15 días";
                        break;
                    case "monthly":
                        color = "dark";
                        label = "Mensual";
                        break;
                    case "specific_days":
                        color = "primary";
                        label = "Días específicos";
                        break;
                    case "by_event":
                        color = "danger";
                        label = "Por evento productivo";
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
            setGroupDetails(groupData);

            const feedingsResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/product/find_feeding_products`)
            const feedingsWithId = feedingsResponse.data.data.map((b: any) => ({ ...b, code: b.id, id: b._id }));
            setFeedingItems(feedingsWithId)
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
            const feedingsData = feedingsSelected.map(prev => ({ ...prev, applicationDate: applicationDate, appliedBy: userLogged._id }))

            const feedingResponse = await configContext.axiosHelper.put(`${configContext.apiUrl}/group/add_feedings/${groupId}`, feedingsData)
            await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                event: `Alimentos asignados al groupo ${groupDetails?.code}`
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

    const feedingValidation = Yup.object({
        quantityPerPig: Yup.number().moreThan(0, "Cantidad inválida").required("Cantidad requerida"),
        periodicity: Yup.string().required('Seleccione la periodicidad')
    });

    const validateSelectedFeedings = async () => {
        const errors: Record<string, any> = {};

        if (feedingsSelected.length === 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, seleccione al menos 1 alimento' })
            return false;
        }

        for (const fed of feedingsSelected) {
            try {
                await feedingValidation.validate(fed, { abortEarly: false });
            } catch (err: any) {
                const fedErrors: any = {};

                err.inner.forEach((e: any) => {
                    fedErrors[e.path] = true;
                });

                errors[fed.feeding] = fedErrors;
            }
        }

        setFeedingErrors(errors);

        if (Object.keys(errors).length > 0) {
            setAlertConfig({ visible: true, color: 'danger', message: 'Por favor, llene todos los datos de los alimentos seleccionadas' })
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
                            id="step-feedingSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-feedingSelect-tab"
                            disabled
                        >
                            Selección de alimentos
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
                <TabPane id="step-feedingSelect-tab" tabId={1}>
                    <div className="d-flex gap-3">
                        <div className="w-50">
                            <Label htmlFor="user" className="form-label">Responsable de asignacion</Label>
                            <Input
                                type="text"
                                id="user"
                                name="user"
                                value={'' + userLogged.name + ' ' + userLogged.lastname}
                                disabled
                            />
                        </div>

                        <div className="w-50">
                            <Label htmlFor="applicationDate" className="form-label">Fecha de asignacion</Label>
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
                        <Label htmlFor="user" className="form-label">Seleccion de alimentos</Label>
                        <SelectableCustomTable
                            columns={feedingsColumns}
                            data={feedingItems}
                            showPagination={true}
                            rowsPerPage={6}
                            onSelect={(rows) => {
                                setFeedingsSelected(prev => {
                                    const newRows = rows.map(r => {
                                        const existing = prev.find(p => p.feeding === r._id);
                                        if (existing) return existing;

                                        return {
                                            feeding: r._id,
                                            quantityPerPig: 0,
                                            totalQuantity: 0,
                                            avgPerPig: 0,
                                            applicationDate: null,
                                            appliedBy: '',
                                            periodicity: "",
                                            observations: "",
                                            isActive: true,
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
                                const ok = await validateSelectedFeedings();
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
                            <Card className="shadow-sm h-100">
                                <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                                    <h5>Alimentos</h5>
                                </CardHeader>
                                <CardBody className="p-0 mb-3">
                                    <CustomTable
                                        columns={selectedFeedingsColumns}
                                        data={feedingsSelected.map(fs => ({
                                            ...feedingItems.find(p => p._id === fs.feeding),
                                            ...fs
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

export default AsignGroupFeedingForm;