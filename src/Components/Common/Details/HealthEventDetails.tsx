import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { useContext, useEffect, useState } from "react";
import { Badge, Card, CardBody, CardHeader, Spinner } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import ObjectDetails from "./ObjectDetails";
import CustomTable from "../Tables/CustomTable";
import { Column } from "common/data/data_types";
import { Attribute } from "common/data_interfaces";
import { FiActivity, FiAlertCircle, FiCalendar, FiUser } from "react-icons/fi";
import { useTranslation } from "react-i18next";

interface HealthEventDetailsProps {
    eventId: string;
    groupId: string;
}

const HealthEventDetails: React.FC<HealthEventDetailsProps> = ({ eventId, groupId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const [loading, setLoading] = useState<boolean>(true);
    const [eventData, setEventData] = useState<any>(null);

    const SYMPTOMS_CATALOG = [
        {
            title: t('shared.symptoms.category.respiratory', { defaultValue: 'Respiratorios' }),
            options: [
                { key: "cough", label: t('shared.symptoms.cough', { defaultValue: 'Tos' }) },
                { key: "sneezing", label: t('shared.symptoms.sneezing', { defaultValue: 'Estornudos' }) },
                { key: "nasal_discharge", label: t('shared.symptoms.nasal_discharge', { defaultValue: 'Secreción nasal' }) },
                { key: "difficulty_breathing", label: t('shared.symptoms.difficulty_breathing', { defaultValue: 'Dificultad respiratoria' }) },
                { key: "open_mouth_breathing", label: t('shared.symptoms.open_mouth_breathing', { defaultValue: 'Respiración con la boca abierta' }) },
            ],
        },
        {
            title: t('shared.symptoms.category.general', { defaultValue: 'Generales' }),
            options: [
                { key: "fever", label: t('shared.symptoms.fever', { defaultValue: 'Fiebre' }) },
                { key: "lethargy", label: t('shared.symptoms.lethargy', { defaultValue: 'Decaimiento' }) },
                { key: "loss_of_appetite", label: t('shared.symptoms.loss_of_appetite', { defaultValue: 'Pérdida de apetito' }) },
                { key: "weight_loss", label: t('shared.symptoms.weight_loss', { defaultValue: 'Pérdida de peso' }) },
                { key: "isolation", label: t('shared.symptoms.isolation', { defaultValue: 'Aislamiento del grupo' }) },
            ],
        },
        {
            title: t('shared.symptoms.category.digestive', { defaultValue: 'Digestivos' }),
            options: [
                { key: "diarrhea", label: t('shared.symptoms.diarrhea', { defaultValue: 'Diarrea' }) },
                { key: "bloody_diarrhea", label: t('shared.symptoms.bloody_diarrhea', { defaultValue: 'Diarrea con sangre' }) },
                { key: "vomiting", label: t('shared.symptoms.vomiting', { defaultValue: 'Vómitos' }) },
                { key: "abdominal_swelling", label: t('shared.symptoms.abdominal_swelling', { defaultValue: 'Abdomen inflamado' }) },
                { key: "dehydration", label: t('shared.symptoms.dehydration', { defaultValue: 'Deshidratación' }) },
            ],
        },
        {
            title: t('shared.symptoms.category.locomotor', { defaultValue: 'Locomotores' }),
            options: [
                { key: "lameness", label: t('shared.symptoms.lameness', { defaultValue: 'Cojera' }) },
                { key: "joint_swelling", label: t('shared.symptoms.joint_swelling', { defaultValue: 'Inflamación articular' }) },
                { key: "difficulty_standing", label: t('shared.symptoms.difficulty_standing', { defaultValue: 'Dificultad para levantarse' }) },
            ],
        },
        {
            title: t('shared.symptoms.category.neurological', { defaultValue: 'Neurológicos' }),
            options: [
                { key: "tremors", label: t('shared.symptoms.tremors', { defaultValue: 'Temblores' }) },
                { key: "incoordination", label: t('shared.symptoms.incoordination', { defaultValue: 'Descoordinación' }) },
                { key: "convulsions", label: t('shared.symptoms.convulsions', { defaultValue: 'Convulsiones' }) },
                { key: "head_tilt", label: t('shared.symptoms.head_tilt', { defaultValue: 'Cabeza ladeada' }) },
                { key: "circling", label: t('shared.symptoms.circling', { defaultValue: 'Camina en círculos' }) },
            ],
        },
        {
            title: t('shared.symptoms.category.alarm', { defaultValue: 'Signos de alarma' }),
            options: [
                { key: "cyanosis", label: t('shared.symptoms.cyanosis', { defaultValue: 'Coloración azulada (orejas o patas)' }) },
                { key: "edema", label: t('shared.symptoms.edema', { defaultValue: 'Edema / hinchazón' }) },
                { key: "sudden_death", label: t('shared.symptoms.sudden_death', { defaultValue: 'Muerte súbita' }) },
            ],
        },
    ];

    const SYMPTOM_LABELS: Record<string, string> = SYMPTOMS_CATALOG.reduce((acc, category) => {
        category.options.forEach(option => {
            acc[option.key] = option.label;
        });
        return acc;
    }, {} as Record<string, string>);

    const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
        active: { label: t('shared.healthEvent.status.active', { defaultValue: 'Activo' }), color: "danger" },
        controlled: { label: t('shared.healthEvent.status.controlled', { defaultValue: 'Controlado' }), color: "warning" },
        resolved: { label: t('shared.healthEvent.status.resolved', { defaultValue: 'Resuelto' }), color: "success" },
    };

    const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
        low: { label: t('shared.healthEvent.severity.low', { defaultValue: 'Baja' }), color: "success" },
        medium: { label: t('shared.healthEvent.severity.medium', { defaultValue: 'Media' }), color: "warning" },
        high: { label: t('shared.healthEvent.severity.high', { defaultValue: 'Alta' }), color: "danger" },
    };

    const ADMINISTRATION_ROUTE_CONFIG: Record<string, string> = {
        oral: t('medical.medication.route.oral', { defaultValue: 'Oral' }),
        intramuscular: t('medical.medication.route.intramuscular', { defaultValue: 'Intramuscular' }),
        subcutaneous: t('medical.medication.route.subcutaneous', { defaultValue: 'Subcutánea' }),
        intravenous: t('medical.medication.route.intravenous', { defaultValue: 'Intravenosa' }),
        intranasal: t('medical.medication.route.intranasal', { defaultValue: 'Intranasal' }),
        topical: t('medical.medication.route.topical', { defaultValue: 'Tópica' }),
        rectal: t('medical.medication.route.rectal', { defaultValue: 'Rectal' }),
    };

    const eventAttributes: Attribute[] = [
        { label: t('medical.healthEvent.attribute.name', { defaultValue: 'Nombre del evento' }), key: 'name', type: 'text' },
        {
            label: t('medical.healthEvent.attribute.status', { defaultValue: 'Estado' }),
            key: 'status',
            type: 'text',
            render: (value: string) => {
                const config = STATUS_CONFIG[value];
                return config ? <Badge color={config.color}>{config.label}</Badge> : value;
            },
        },
        {
            label: t('medical.healthEvent.attribute.severity', { defaultValue: 'Severidad' }),
            key: 'severity',
            type: 'text',
            render: (value: string) => {
                const config = SEVERITY_CONFIG[value];
                return config ? <Badge color={config.color}>{config.label}</Badge> : value;
            },
        },
        {
            label: t('medical.healthEvent.attribute.scopeType', { defaultValue: 'Tipo de evento' }),
            key: 'scope.type',
            type: 'text',
            render: (value: string, obj: any) => {
                const label = value === 'total'
                    ? t('medical.healthEvent.details.scopeTotal', { defaultValue: 'Total (todo el grupo)' })
                    : t('medical.healthEvent.details.scopePartial', { defaultValue: 'Parcial ({{count}} cerdos)', count: obj.scope?.affectedCount });
                const color = value === 'total' ? 'warning' : 'info';
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { label: t('medical.healthEvent.attribute.startDate', { defaultValue: 'Fecha de inicio' }), key: 'startDate', type: 'date' },
        {
            label: t('medical.healthEvent.attribute.endDate', { defaultValue: 'Fecha de término' }),
            key: 'endDate',
            type: 'date',
            render: (value: any) => {
                if (!value) return <span className="text-muted fst-italic">{t('medical.healthEvent.details.ongoing', { defaultValue: 'En curso' })}</span>;
                return new Date(value).toLocaleDateString('es-MX');
            },
        },
        {
            label: t('medical.healthEvent.attribute.detectedBy', { defaultValue: 'Detectado por' }),
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
            header: t('medical.healthEvent.column.code', { defaultValue: 'Código' }),
            accessor: "medication.id",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.medication.id}`,
        },
        {
            header: t('medical.healthEvent.column.medication', { defaultValue: 'Medicamento' }),
            accessor: "medication.name",
            type: "text",
            isFilterable: true,
            render: (_, row) => `${row.medication.name}`,

        },
        {
            header: t('medical.healthEvent.column.dosePerPig', { defaultValue: 'Dosis por cerdo' }),
            accessor: "quantityPerPig",
            type: "text",
            render: (_, row) => `${row.quantityPerPig} ${row.medication.unit_measurement}`,
        },
        {
            header: t('medical.healthEvent.column.totalDose', { defaultValue: 'Dosis total' }),
            accessor: "totalQuantity",
            type: "text",
            render: (_, row) => `${row.totalQuantity} ${row.medication.unit_measurement}`,
        },
        {
            header: t('medical.healthEvent.column.adminRoute', { defaultValue: 'Vía de administración' }),
            accessor: "administrationRoute",
            type: "text",
            render: (value: string) => {
                const label = ADMINISTRATION_ROUTE_CONFIG[value] || value;
                return <Badge color="primary">{label}</Badge>;
            },
        },
        {
            header: t('medical.healthEvent.column.appliedBy', { defaultValue: 'Aplicado por' }),
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
            logger.error('Error fetching event details:', error);
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
                <span className="fs-5 text-muted">{t('medical.healthEvent.details.notFound', { defaultValue: 'No se encontró información del evento' })}</span>
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
                        {t('medical.healthEvent.details.title', { defaultValue: 'Detalles del evento sanitario' })}
                    </h6>
                </CardHeader>
                <CardBody>
                    <ObjectDetails attributes={eventAttributes} object={healthEvent} />

                    {/* Síntomas */}
                    {healthEvent.symptoms && healthEvent.symptoms.length > 0 && (
                        <div className="mt-3 pt-3 border-top">
                            <h6 className="fw-semibold mb-2">{t('medical.healthEvent.details.symptoms', { defaultValue: 'Síntomas observados' })}</h6>
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
                            <h6 className="fw-semibold mb-2">{t('medical.healthEvent.details.observations', { defaultValue: 'Observaciones' })}</h6>
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
                            {t('medical.healthEvent.details.treatments', { defaultValue: 'Tratamientos aplicados' })} ({healthEvent.treatments.length})
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
                        <h6 className="mb-0 fw-semibold">{t('medical.healthEvent.details.treatments', { defaultValue: 'Tratamientos aplicados' })}</h6>
                    </CardHeader>
                    <CardBody>
                        <div className="text-center text-muted fst-italic py-3">
                            <FiAlertCircle size={24} className="mb-2" />
                            <p className="mb-0">{t('medical.healthEvent.details.noTreatments', { defaultValue: 'No se registraron tratamientos para este evento' })}</p>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default HealthEventDetails;
