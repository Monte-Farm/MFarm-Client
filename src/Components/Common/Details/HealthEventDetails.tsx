import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Spinner } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import { Attribute } from "common/data_interfaces";
import { FiActivity, FiAlertCircle, FiCalendar, FiUser } from "react-icons/fi";

const SYMPTOMS_CATALOG = [
    {
        title: "Respiratorios",
        options: [
            { key: "cough", label: "Tos" },
            { key: "sneezing", label: "Estornudos" },
            { key: "nasal_discharge", label: "Secreción nasal" },
            { key: "difficulty_breathing", label: "Dificultad respiratoria" },
            { key: "open_mouth_breathing", label: "Respiración con la boca abierta" },
        ],
    },
    {
        title: "Generales",
        options: [
            { key: "fever", label: "Fiebre" },
            { key: "lethargy", label: "Decaimiento" },
            { key: "loss_of_appetite", label: "Pérdida de apetito" },
            { key: "weight_loss", label: "Pérdida de peso" },
            { key: "isolation", label: "Aislamiento del grupo" },
        ],
    },
    {
        title: "Digestivos",
        options: [
            { key: "diarrhea", label: "Diarrea" },
            { key: "bloody_diarrhea", label: "Diarrea con sangre" },
            { key: "vomiting", label: "Vómitos" },
            { key: "abdominal_swelling", label: "Abdomen inflamado" },
            { key: "dehydration", label: "Deshidratación" },
        ],
    },
    {
        title: "Locomotores",
        options: [
            { key: "lameness", label: "Cojera" },
            { key: "joint_swelling", label: "Inflamación articular" },
            { key: "difficulty_standing", label: "Dificultad para levantarse" },
        ],
    },
    {
        title: "Neurológicos",
        options: [
            { key: "tremors", label: "Temblores" },
            { key: "incoordination", label: "Descoordinación" },
            { key: "convulsions", label: "Convulsiones" },
            { key: "head_tilt", label: "Cabeza ladeada" },
            { key: "circling", label: "Camina en círculos" },
        ],
    },
    {
        title: "Signos de alarma",
        options: [
            { key: "cyanosis", label: "Coloración azulada (orejas o patas)" },
            { key: "edema", label: "Edema / hinchazón" },
            { key: "sudden_death", label: "Muerte súbita" },
        ],
    },
];

const SYMPTOM_LABELS: Record<string, string> = SYMPTOMS_CATALOG.reduce((acc, category) => {
    category.options.forEach(option => {
        acc[option.key] = option.label;
    });
    return acc;
}, {} as Record<string, string>);

interface HealthEventDetailsProps {
    eventId: string;
    groupId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: "Activo", color: "danger" },
    controlled: { label: "Controlado", color: "warning" },
    resolved: { label: "Resuelto", color: "success" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: "Baja", color: "success" },
    medium: { label: "Media", color: "warning" },
    high: { label: "Alta", color: "danger" },
};

const ADMINISTRATION_ROUTE_CONFIG: Record<string, string> = {
    oral: "Oral",
    intramuscular: "Intramuscular",
    subcutaneous: "Subcutánea",
    intravenous: "Intravenosa",
    intranasal: "Intranasal",
    topical: "Tópica",
    rectal: "Rectal",
};

const HealthEventDetails: React.FC<HealthEventDetailsProps> = ({ eventId, groupId }) => {
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(true);
    const [eventData, setEventData] = useState<any>(null);

    const eventAttributes: Attribute[] = [
        { label: 'Nombre del evento', key: 'name', type: 'text' },
        {
            label: 'Estado',
            key: 'status',
            type: 'text',
            render: (value: string) => {
                const config = STATUS_CONFIG[value];
                return config ? <Badge color={config.color}>{config.label}</Badge> : value;
            },
        },
        {
            label: 'Severidad',
            key: 'severity',
            type: 'text',
            render: (value: string) => {
                const config = SEVERITY_CONFIG[value];
                return config ? <Badge color={config.color}>{config.label}</Badge> : value;
            },
        },
        {
            label: 'Tipo de evento',
            key: 'scope.type',
            type: 'text',
            render: (value: string, obj: any) => {
                const label = value === 'total' ? 'Total (todo el grupo)' : `Parcial (${obj.scope?.affectedCount} cerdos)`;
                const color = value === 'total' ? 'warning' : 'info';
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { label: 'Fecha de inicio', key: 'startDate', type: 'date' },
        {
            label: 'Fecha de término',
            key: 'endDate',
            type: 'date',
            render: (value: any) => {
                if (!value) return <span className="text-muted fst-italic">En curso</span>;
                return new Date(value).toLocaleDateString('es-MX');
            },
        },
        {
            label: 'Detectado por',
            key: 'detectedBy',
            type: 'text',
            render: (value: any) => {
                if (!value) return 'N/A';
                return `${value.name} ${value.lastname}`;
            },
        },
    ];

    const treatmentColumns: Column<any>[] = [
        {
            header: "Código",
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.medication.id}`,
        },
        {
            header: "Medicamento",
            accessor: "medication.name",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.medication.name}`,

        },
        {
            header: "Dosis por cerdo",
            accessor: "quantityPerPig",
            type: "text",
            render: (_, row) => `${row.quantityPerPig} ${row.medication.unit_measurement}`,
        },
        {
            header: "Dosis total",
            accessor: "totalQuantity",
            type: "text",
            render: (_, row) => `${row.totalQuantity} ${row.medication.unit_measurement}`,
        },
        {
            header: "Vía de administración",
            accessor: "administrationRoute",
            type: "text",
            render: (value: string) => {
                const label = ADMINISTRATION_ROUTE_CONFIG[value] || value;
                return <Badge color="primary">{label}</Badge>;
            },
        },
        {
            header: "Aplicado por",
            accessor: "appliedBy",
            type: "text",
            render: (value: any) => {
                if (!value) return 'N/A';
                return `${value.name} ${value.lastname}`;
            },
        },
    ];

    const fetchEventDetails = async () => {
        if (!configContext) return;
        try {
            setLoading(true);
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/group/health_event_details/${groupId}/${eventId}`
            );
            setEventData(response.data.data);
        } catch (error) {
            console.error('Error fetching event details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventDetails();
    }, [eventId, groupId]);

    if (loading) {
        return <LoadingAnimation absolutePosition={false} />;
    }

    if (!eventData) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center gap-2 text-center p-5">
                <FiAlertCircle size={48} className="text-muted" />
                <span className="fs-5 text-muted">No se encontró información del evento</span>
            </div>
        );
    }

    const { group, healthEvent } = eventData;

    return (
        <div className="d-flex flex-column gap-3">

            <Card className="shadow-sm">
                <CardHeader className="bg-light">
                    <h6 className="mb-0 fw-semibold">
                        <FiAlertCircle className="me-2" />
                        Detalles del evento sanitario
                    </h6>
                </CardHeader>
                <CardBody>
                    <ObjectDetails attributes={eventAttributes} object={healthEvent} />

                    {/* Síntomas */}
                    {healthEvent.symptoms && healthEvent.symptoms.length > 0 && (
                        <div className="mt-3 pt-3 border-top">
                            <h6 className="fw-semibold mb-2">Síntomas observados</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {healthEvent.symptoms.map((symptom: string, index: number) => (
                                    <Badge key={index} color="info" className="fs-6">
                                        {SYMPTOM_LABELS[symptom] || symptom}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Observaciones */}
                    {healthEvent.observations && healthEvent.observations.trim() !== "" && (
                        <div className="mt-3 pt-3 border-top">
                            <h6 className="fw-semibold mb-2">Observaciones</h6>
                            <p className="text-muted mb-0">{healthEvent.observations}</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Tratamientos */}
            {healthEvent.treatments && healthEvent.treatments.length > 0 && (
                <Card className="shadow-sm">
                    <CardHeader className="bg-light">
                        <h6 className="mb-0 fw-semibold">
                            Tratamientos aplicados ({healthEvent.treatments.length})
                        </h6>
                    </CardHeader>
                    <CardBody className="p-0">
                        <CustomTable
                            columns={treatmentColumns}
                            data={healthEvent.treatments}
                            showSearchAndFilter={false}
                            showPagination={healthEvent.treatments.length > 5}
                            rowsPerPage={5}
                        />
                    </CardBody>
                </Card>
            )}

            {/* Sin tratamientos */}
            {(!healthEvent.treatments || healthEvent.treatments.length === 0) && (
                <Card className="shadow-sm">
                    <CardHeader className="bg-light">
                        <h6 className="mb-0 fw-semibold">Tratamientos aplicados</h6>
                    </CardHeader>
                    <CardBody>
                        <div className="text-center text-muted fst-italic py-3">
                            <FiAlertCircle size={24} className="mb-2" />
                            <p className="mb-0">No se registraron tratamientos para este evento</p>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default HealthEventDetails;
