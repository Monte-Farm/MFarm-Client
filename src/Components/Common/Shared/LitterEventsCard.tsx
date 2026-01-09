import { LitterEvent } from 'common/data_interfaces';
import {
    FiAlertTriangle,
    FiTrendingUp,
    FiLogOut,
    FiMapPin,
    FiActivity,
    FiMessageSquare,
    FiInbox
} from 'react-icons/fi';
import { Card, CardHeader, CardBody } from 'reactstrap';

interface Props {
    events: LitterEvent[] | undefined;
}

const EVENT_CONFIG: Record<
    LitterEvent['type'],
    { label: string; icon: JSX.Element }
> = {
    MORTALITY_SUMMARY: {
        label: 'Mortalidad',
        icon: <FiAlertTriangle />
    },
    AVERAGE_WEIGHT: {
        label: 'Peso promedio',
        icon: <FiTrendingUp />
    },
    WEANING: {
        label: 'Destete',
        icon: <FiLogOut />
    },
    LOCATION_CHANGE: {
        label: 'Cambio de ubicación',
        icon: <FiMapPin />
    },
    GROUP_TREATMENT: {
        label: 'Tratamiento grupal',
        icon: <FiActivity />
    },
    OBSERVATION: {
        label: 'Observación',
        icon: <FiMessageSquare />
    },
    '': {
        label: 'Evento',
        icon: <FiActivity />
    }
};

const LitterEventsCard = ({ events }: Props) => {
    const hasEvents = events && events.length > 0;

    return (
        <div className="d-flex flex-column flex-fill">
            <Card className="flex-fill">
                <CardHeader className="bg-white border-bottom">
                    <h5 className="mb-0 text-dark fw-semibold">Eventos</h5>
                </CardHeader>

                <CardBody
                    className={
                        hasEvents
                            ? 'd-flex flex-column'
                            : 'd-flex flex-column justify-content-center align-items-center text-center'
                    }
                >
                    {!hasEvents ? (
                        <>
                            <FiInbox
                                className="text-muted"
                                size={48}
                                style={{ marginBottom: 10 }}
                            />
                            <span className="fs-5 text-muted">
                                Aún no hay eventos de la camada registrados
                            </span>
                        </>
                    ) : (
                        events!
                            .slice()
                            .sort(
                                (a, b) =>
                                    new Date(b.date ?? 0).getTime() -
                                    new Date(a.date ?? 0).getTime()
                            )
                            .map((event, index) => {
                                const config = EVENT_CONFIG[event.type];

                                return (
                                    <div
                                        key={index}
                                        className="d-flex gap-3 py-3 border-bottom"
                                    >
                                        {/* Icono */}
                                        <div className="text-primary fs-4">
                                            {config.icon}
                                        </div>

                                        {/* Contenido */}
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between">
                                                <strong>{config.label}</strong>
                                                {event.date && (
                                                    <small className="text-muted">
                                                        {new Date(event.date).toLocaleDateString()}
                                                    </small>
                                                )}
                                            </div>

                                            <p className="mb-1 text-muted">
                                                {event.data}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default LitterEventsCard;
