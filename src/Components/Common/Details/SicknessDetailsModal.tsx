import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import { Attribute } from "common/data_interfaces";
import { Badge, Card, CardBody, CardHeader } from "reactstrap";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import SicknessSymptomsSummary from "../Shared/SicknessSymptomsSummary";
import { useTranslation } from "react-i18next";

interface SicknessDetailsProps {
    pigId: string;
    sicknessId: string;
}

const SicknessDetails: React.FC<SicknessDetailsProps> = ({ pigId, sicknessId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({});
    const [sicknessDetails, setSicknessDetails] = useState<any>({});
    const [treatmentItems, setTreatmentItems] = useState<any[]>([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const sicknessAttributes: Attribute[] = [
        { key: 'name', label: t('medical.sickness.detail.attribute.disease', { defaultValue: 'Enfermedad' }), type: 'text' },
        {
            key: 'status',
            label: t('medical.sickness.detail.attribute.status', { defaultValue: 'Estado' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.sickness.detail.status.${value}`, { defaultValue: value });

                switch (value) {
                    case "suspected": color = "info"; break;
                    case "confirmed": color = "success"; break;
                    case "recovered": color = "primary"; break;
                    case "chronic": color = "warning"; break;
                    case "dead": color = "black"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        {
            key: 'severity',
            label: t('medical.sickness.detail.attribute.severity', { defaultValue: 'Severidad' }),
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.sickness.detail.severity.${value}`, { defaultValue: value });

                switch (value) {
                    case "low": color = "success"; break;
                    case "medium": color = "warning"; break;
                    case "high": color = "danger"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: 'startDate', label: t('medical.sickness.detail.attribute.startDate', { defaultValue: 'Fecha de inicio' }), type: 'date' },
        { key: 'endDate', label: t('medical.sickness.detail.attribute.endDate', { defaultValue: 'Fecha de fin' }), type: 'date' },
        {
            key: 'is_active',
            label: t('medical.sickness.detail.attribute.isActive', { defaultValue: 'Activa' }),
            type: 'status',
        },
        {
            key: 'detectedBy',
            label: t('medical.sickness.detail.attribute.detectedBy', { defaultValue: 'Detectada por' }),
            type: 'text',
            render: (_, obj) => <span>{obj?.detectedBy?.name} {obj?.detectedBy?.lastname}</span>
        },
        { key: 'observations', label: t('medical.sickness.detail.attribute.observations', { defaultValue: 'Observaciones' }), type: 'text' },

    ]

    const treatmentItemsColumns: Column<any>[] = [
        {
            header: t('medical.sickness.detail.column.code', { defaultValue: 'Codigo' }),
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.medication.id}</span>
        },
        {
            header: t('medical.sickness.detail.column.product', { defaultValue: 'Producto' }),
            accessor: "medication.name",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.medication.name}</span>
        },
        {
            header: t('medical.sickness.detail.column.dose', { defaultValue: 'Dosis' }),
            accessor: "dose",
            type: "text",
            isFilterable: true,
            render: (_, row) => <span>{row.dose} {row.unit_measurement}</span>
        },
        {
            header: t('medical.sickness.detail.column.adminRoute', { defaultValue: 'Administracion' }),
            accessor: "administration_route",
            type: "text",
            isFilterable: true,
            render: (value: string) => {
                let color = "secondary";
                const label = t(`medical.medication.route.${value}`, { defaultValue: value });

                switch (value) {
                    case "oral": color = "info"; break;
                    case "intramuscular":
                    case "subcutaneous":
                    case "intravenous":
                    case "intranasal":
                    case "topical":
                    case "rectal":
                        color = "primary"; break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: t('medical.sickness.detail.column.startDate', { defaultValue: 'Inicio' }), accessor: 'startDate', type: 'date', },
        { header: t('medical.sickness.detail.column.endDate', { defaultValue: 'Fin' }), accessor: 'endDate', type: 'date', },
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
            setAlertConfig({ visible: true, color: 'danger', message: t('medical.sickness.detail.error.load', { defaultValue: 'Ha ocurrido un error al cargar los datos, intentelo mas tarde' }) })
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
                            {t('medical.sickness.detail.sicknessInfo', { defaultValue: 'Información de enfermedad' })}
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
                            {t('medical.sickness.detail.symptoms', { defaultValue: 'Síntomas' })}
                        </CardHeader>

                        <CardBody className="d-flex flex-column">
                            {sicknessDetails.symptoms && sicknessDetails.symptoms.length > 0 ? (
                                <SicknessSymptomsSummary symptoms={sicknessDetails.symptoms} />
                            ) : (
                                <div className="text-muted fst-italic d-flex align-items-center justify-content-center flex-grow-1 gap-2">
                                    <i className="fa-solid fa-circle-info" />
                                    {t('medical.sickness.detail.noSymptoms', { defaultValue: 'No se registraron síntomas' })}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="d-flex flex-column gap-3 align-items-stretch" style={{ flex: 1 }}>
                    <Card className="shadow-sm w-100 h-100">
                        <CardHeader className="bg-light fw-bold fs-5">
                            {t('medical.sickness.detail.treatment', { defaultValue: 'Tratamiento' })}
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
                                    {t('medical.sickness.detail.noTreatment', { defaultValue: 'No se asignó tratamiento' })}
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
