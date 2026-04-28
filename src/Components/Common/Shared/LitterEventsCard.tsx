import { useTranslation } from "react-i18next";
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

const LitterEventsCard = ({ events }: Props) => {
    const { t } = useTranslation();
    const hasEvents = events && events.length > 0;

    const EVENT_CONFIG: Record<LitterEvent['type'], { label: string; icon: JSX.Element }> = {
        MORTALITY_SUMMARY: {
            label: t("shared.litterEvents.type.MORTALITY_SUMMARY"),
            icon: <FiAlertTriangle />
        },
        AVERAGE_WEIGHT: {
            label: t("shared.litterEvents.type.AVERAGE_WEIGHT"),
            icon: <FiTrendingUp />
        },
        WEANING: {
            label: t("shared.litterEvents.type.WEANING"),
            icon: <FiLogOut />
        },
        LOCATION_CHANGE: {
            label: t("shared.litterEvents.type.LOCATION_CHANGE"),
            icon: <FiMapPin />
        },
        GROUP_TREATMENT: {
            label: t("shared.litterEvents.type.GROUP_TREATMENT"),
            icon: <FiActivity />
        },
        DISCARD: {
            label: t("shared.litterEvents.type.DISCARD"),
            icon: <FiAlertTriangle />
        },
        OBSERVATION: {
            label: t("shared.litterEvents.type.OBSERVATION"),
            icon: <FiMessageSquare />
        },
        '': {
            label: t("shared.litterEvents.type.default"),
            icon: <FiActivity />
        }
    };

    return (
        <div className="d-flex flex-column flex-fill">
            <Card className="flex-fill">
                <CardHeader className="bg-white border-bottom">
                    <h5 className="mb-0 text-dark fw-semibold">{t("shared.litterEvents.title")}</h5>
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
                                {t("shared.litterEvents.empty")}
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
                                const config = EVENT_CONFIG[event.type] ?? {
                                    label: event.type,
                                    icon: <FiActivity />
                                };

                                return (
                                    <div
                                        key={index}
                                        className="d-flex gap-3 py-3 border-bottom"
                                    >
                                        <div className="text-primary fs-4">
                                            {config.icon}
                                        </div>

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
