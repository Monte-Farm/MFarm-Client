import { Card, CardBody, CardHeader } from "reactstrap";
import { RiMedicineBottleLine, RiTimerLine, RiVirusLine } from "react-icons/ri";
import { IconType } from "react-icons";

export interface TimelineEvent {
    date: string;
    type: string;
    label: string;
}

interface TypeConfigEntry {
    color: string;
    icon: IconType;
    label: string;
}

interface Props {
    events: TimelineEvent[];
    title?: string;
    typeConfig?: Record<string, TypeConfigEntry>;
    emptyMessage?: string;
}

const defaultTypeConfig: Record<string, TypeConfigEntry> = {
    medication: { color: '#0ea5e9', icon: RiMedicineBottleLine, label: 'Medicamento' },
    sickness: { color: '#ef4444', icon: RiVirusLine, label: 'Evento sanitario' },
};

const ApplicationsTimeline = ({
    events,
    title = 'Timeline de Aplicaciones',
    typeConfig = defaultTypeConfig,
    emptyMessage = 'Sin aplicaciones registradas',
}: Props) => {
    return (
        <Card className="border-0 shadow-sm h-100">
            <CardHeader className="bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-dark">
                    <RiTimerLine className="me-2 text-primary" />
                    {title}
                </h6>
            </CardHeader>
            <CardBody>
                <div className="d-flex align-items-center gap-3 flex-wrap mb-3">
                    <span className="small text-muted">Leyenda:</span>
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                        <span key={key} className="small d-flex align-items-center gap-1">
                            <span className="rounded-circle" style={{ width: 10, height: 10, background: cfg.color, display: 'inline-block' }} />
                            <span>{cfg.label}</span>
                        </span>
                    ))}
                </div>

                {events && events.length > 0 ? (
                    <div className="position-relative mx-auto" style={{ height: 90, paddingLeft: 60, paddingRight: 60 }}>
                        <div className="position-absolute" style={{ left: 60, right: 60, top: 16, height: 2, background: '#e9ecef' }} />
                        <div className="position-relative" style={{ height: '100%' }}>
                            {events.map((ev, idx) => {
                                const cfg = typeConfig[ev.type] || { color: '#64748b', icon: RiMedicineBottleLine, label: ev.type };
                                const Icon = cfg.icon;
                                const leftPercent = events.length === 1 ? 50 : (idx / (events.length - 1)) * 100;
                                return (
                                    <div
                                        key={idx}
                                        className="position-absolute d-flex flex-column align-items-center"
                                        style={{ left: `${leftPercent}%`, top: 0, transform: 'translateX(-50%)', width: 110 }}
                                    >
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                                            style={{ width: 32, height: 32, background: cfg.color, border: '3px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}33` }}
                                            title={`${ev.label} · ${ev.date}`}
                                        >
                                            <Icon size={14} color="#fff" />
                                        </div>
                                        <div className="small fw-semibold text-dark text-center text-truncate w-100" style={{ fontSize: '0.75rem' }} title={ev.label}>
                                            {ev.label}
                                        </div>
                                        <div className="text-muted text-center" style={{ fontSize: '0.7rem' }}>
                                            {new Date(ev.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted py-4">{emptyMessage}</div>
                )}
            </CardBody>
        </Card>
    );
};

export default ApplicationsTimeline;
