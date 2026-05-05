import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEEDING_INFO_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { Col, Row } from "reactstrap";
import { RiRestaurantLine, RiScales3Line, RiGroupLine } from "react-icons/ri";
import { FeedAdministrationHistoryEntry } from "common/data_interfaces";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import StatKpiCard from "../Graphics/StatKpiCard";
import BasicLineChartCard from "../Graphics/BasicLineChartCard";
import DonutChartCard from "../Graphics/DonutChartCard";
import FeedAdministrationsCard from "../Shared/FeedAdministrationsCard";
import { useTranslation } from "react-i18next";

interface LitterFeedingDetailsProps {
    litterId: string;
}

const API_CATEGORY_KEY_MAP: Record<string, string> = {
    hygiene_cleaning: 'hygiene',
    equipment_tools: 'equipment',
    spare_parts: 'spare',
    office_supplies: 'office',
    others: 'other',
    pre_starter: 'preStarter',
};

const LitterFeedingDetails: React.FC<LitterFeedingDetailsProps> = ({ litterId }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [administrations, setAdministrations] = useState<FeedAdministrationHistoryEntry[]>([]);
    const [feedingStats, setFeedingStats] = useState<any | null>(null);

    const getCategoryLabel = (key: string) =>
        t(`feeding.productCategory.${API_CATEGORY_KEY_MAP[key] ?? key}`, { defaultValue: key });

    const fetchFeedingInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [infoResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_INFO_URLS.litterFeedingInfo(litterId)}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_INFO_URLS.litterFeedingStats(litterId)}`),
            ]);
            const info = infoResponse.data.data;
            setAdministrations(info?.feedAdministrationHistory ?? []);
            setFeedingStats(statsResponse.data.data);
        } catch (error) {
            logger.error('Error fetching data: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedingInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [litterId]);

    if (loading) return <LoadingAnimation />;

    const translatedDist = (feedingStats?.distributionByType || []).map((d: any) => {
        const label = getCategoryLabel(d.id || d.label);
        return { ...d, id: label, label };
    });

    return (
        <>
            {feedingStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard
                                title={t('feeding.litterFeeding.kpi.consumed')}
                                value={feedingStats.kpis?.totalConsumed || 0}
                                suffix="kg"
                                icon={<RiRestaurantLine size={20} style={{ color: '#f59e0b' }} />}
                                animateValue={true}
                                decimals={1}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title={t('feeding.litterFeeding.kpi.dailyAvg')}
                                value={feedingStats.kpis?.avgPerDay || 0}
                                suffix="kg/día"
                                icon={<RiScales3Line size={20} style={{ color: '#0ea5e9' }} />}
                                animateValue={true}
                                decimals={2}
                            />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard
                                title={t('feeding.litterFeeding.kpi.avgPerPiglet')}
                                value={feedingStats.kpis?.avgPerPiglet || 0}
                                suffix="kg/día"
                                icon={<RiGroupLine size={20} style={{ color: '#8b5cf6' }} />}
                                animateValue={true}
                                decimals={3}
                            />
                        </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <BasicLineChartCard
                                title={t('feeding.litterFeeding.chart.cumulativeTitle')}
                                data={[{
                                    id: t('feeding.litterFeeding.chart.feedLegend'),
                                    color: '#f59e0b',
                                    data: (feedingStats.cumulativeConsumption || []).map((p: any) => ({ x: p.date, y: p.value })),
                                }]}
                                yLabel={t('feeding.litterFeeding.chart.yLabel')}
                                xLabel={t('common.field.date')}
                                height={280}
                                curve="natural"
                                pointSize={5}
                                strokeWidth={2}
                                enableGrid={true}
                                enablePoints={true}
                                enableArea={true}
                                showLegend={false}
                                headerBgColor="#ffffff"
                                className="border-0 shadow-sm h-100"
                            />
                        </Col>
                        <Col lg={4}>
                            <DonutChartCard
                                title={t('feeding.litterFeeding.chart.distributionTitle')}
                                data={translatedDist}
                                legendItems={translatedDist.map((d: any) => ({
                                    label: d.label,
                                    value: `${d.value} kg`,
                                    percentage: feedingStats.kpis?.totalConsumed
                                        ? `${((d.value / feedingStats.kpis.totalConsumed) * 100).toFixed(1)}%`
                                        : '0%',
                                }))}
                                className="h-100 border-0 shadow-sm"
                                headerBgColor="#ffffff"
                            />
                        </Col>
                    </Row>
                </>
            )}

            <div style={{ minHeight: "400px" }}>
                <FeedAdministrationsCard
                    administrations={administrations}
                    targetType="litter"
                    targetId={litterId}
                    onAdministered={fetchFeedingInfo}
                />
            </div>

            <AlertMessage
                color={alertConfig.color}
                message={alertConfig.message}
                visible={alertConfig.visible}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </>
    );
};

export default LitterFeedingDetails;
