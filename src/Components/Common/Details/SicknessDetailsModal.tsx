import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Attribute } from "common/data_interfaces";
import { Badge, Card, CardBody, CardHeader } from "reactstrap";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import SicknessSymptomsSummary from "../Shared/SicknessSymptomsSummary";

interface SicknessDetailsProps {
    pigId: string;
    sicknessId: string;
}

const SicknessDetails: React.FC<SicknessDetailsProps> = ({ pigId, sicknessId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({});
    const [sicknessDetails, setSicknessDetails] = useState<any>({});
    const [treatmentItems, setTreatmentItems] = useState<any[]>([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const sicknessAttributes: Attribute[] = [
        { key: 'name', label: 'Enfermedad', type: 'text' },
        {
            key: 'status',
            label: 'Estado',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "suspected":
                        color = "info";
                        label = "Sospecha";
                        break;
                    case "confirmed":
                        color = "success";
                        label = "Confirmada";
                        break;
                    case "recovered":
                        color = "primary";
                        label = "Recuperada";
                        break;
                    case "chronic":
                        color = "warning";
                        label = "Cronica";
                        break;
                    case "dead":
                        color = "black";
                        label = "Muerte";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'severity',
            label: 'Severidad',
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = value;

                switch (value) {
                    case "low":
                        color = "success";
                        label = "Baja";
                        break;
                    case "medium":
                        color = "warning";
                        label = "Media";
                        break;
                    case "high":
                        color = "danger";
                        label = "Alta";
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'startDate', label: 'Fecha de inicio', type: 'date' },
        { key: 'endDate', label: 'Fecha de fin', type: 'date' },
        {
            key: 'is_active',
            label: 'Activa',
            type: 'status',
        },
        {
            key: 'detectedBy',
            label: 'Detectada por',
            type: 'text',
            render: (_, obj) => <span>{obj?.detectedBy?.name} {obj?.detectedBy?.lastname}</span>
        },
        { key: 'observations', label: 'Observaciones', type: 'text' },

    ]

    const treatmentItemsColumns: Column<any>[] = [
        {
            header: "Codigo",
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.medication.id}</span>
        },
        {
            header: "Producto",
            accessor: "medication.name",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.medication.name}</span>
        },
        {
            header: "Dosis",
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: "Administracion",
            accessor: "administration_route",
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
        { header: 'Inicio', accessor: 'startDate', type: 'date', },
        { header: 'Fin', accessor: 'endDate', type: 'date', },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged || !pigId || !sicknessId) return;
        try {
            setLoading(true)
            const sicknessResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/get_sickness/${pigId}/${sicknessId}`)
            const sicknessData = sicknessResponse.data.data;

            setSicknessDetails(sicknessData);
            setTreatmentItems(sicknessData.treatment);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' })
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        );
    }

    return (
        <>
            <div className="d-flex flex-grow-1 gap-3">

                <div className="">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-light fw-bold fs-5">
                            Información de enfermedad
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails
                                attributes={sicknessAttributes}
                                object={sicknessDetails}
                            />
                        </CardBody>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-light fw-bold fs-5">
                            Síntomas
                        </CardHeader>

                        <CardBody className="d-flex flex-column">
                            {sicknessDetails.symptoms && sicknessDetails.symptoms.length > 0 ? (
                                <SicknessSymptomsSummary symptoms={sicknessDetails.symptoms} />
                            ) : (
                                <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                    <i className="fa-solid fa-circle-info" />
                                    No se registraron síntomas
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="d-flex flex-column gap-3 align-items-stretch" style={{ flex: 1 }}>
                    <Card className="shadow-sm w-100 h-100">
                        <CardHeader className="bg-light fw-bold fs-5">
                            Tratamiento
                        </CardHeader>

                        <CardBody className="d-flex flex-column p-0">
                            {treatmentItems.length > 0 ? (
                                <CustomTable
                                    columns={treatmentItemsColumns}
                                    data={treatmentItems}
                                    showSearchAndFilter={false}
                                    rowsPerPage={4}
                                    showPagination={true}
                                />
                            ) : (
                                <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                    <i className="fa-solid fa-pills" />
                                    No se asignó tratamiento
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} absolutePosition={false} autoClose={3000} />
        </>
    )
}

export default SicknessDetails;