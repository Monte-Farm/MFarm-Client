import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { FEEDING_INFO_URLS } from "helpers/feeding_urls";
import { useContext, useEffect, useState } from "react";
import { Col, Row } from "reactstrap";
import { RiRestaurantLine, RiScales3Line, RiExchangeLine } from "react-icons/ri";
import { FeedAdministrationHistoryEntry } from "common/data_interfaces";
import LoadingAnimation from "../Shared/LoadingAnimation";
import AlertMessage from "../Shared/AlertMesagge";
import StatKpiCard from "../Graphics/StatKpiCard";
import BasicLineChartCard from "../Graphics/BasicLineChartCard";
import DonutChartCard from "../Graphics/DonutChartCard";
import FeedAdministrationsCard from "../Shared/FeedAdministrationsCard";
import { useTranslation } from "react-i18next";

type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface PigFeedingDetailsProps {
    pigId: string;
    pigStage?: Stage;
}

const PigFeedingDetails: React.FC<PigFeedingDetailsProps> = ({ pigId, pigStage }) => {
    const { t } = useTranslation();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [administrations, setAdministrations] = useState<FeedAdministrationHistoryEntry[]>([]);
    const [feedingStats, setFeedingStats] = useState<any | null>(null);

    const fetchFeedingInfo = async () => {
        if (!configContext || !userLogged) return;
        try {
            setLoading(true);
            const [infoResponse, statsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_INFO_URLS.pigFeedingInfo(pigId)}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/${FEEDING_INFO_URLS.pigFeedingStats(pigId)}`),
            ]);
            setAdministrations(infoResponse.data.data?.feedAdministrationHistory ?? []);
            setFeedingStats(statsResponse.data.data);
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('common.status.noData') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedingInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pigId]);

    if (loading) return <LoadingAnimation />;

    return (
        <>
            {feedingStats && (
                <>
                    <Row className="g-3 mb-3">
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.foodConsumed')} value={feedingStats.kpis?.totalConsumed || 0} suffix="kg" icon={<RiRestaurantLine size={20} style={{ color: '#f59e0b' }} />} animateValue decimals={1} />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.dailyAvg')} value={feedingStats.kpis?.avgPerDay || 0} suffix="kg/día" icon={<RiScales3Line size={20} style={{ color: '#0ea5e9' }} />} animateValue decimals={2} />
                        </Col>
                        <Col md={6} lg>
                            <StatKpiCard title={t('pigs.kpi.feedConversion')} value={feedingStats.kpis?.fcr || feedingStats.kpis?.feedConversionRatio || 0} suffix="kg/kg" icon={<RiExchangeLine size={20} style={{ color: '#ef4444' }} />} animateValue decimals={2} />
                        </Col>
                    </Row>
                    <Row className="g-3 mb-3">
                        <Col lg={8}>
                            <BasicLineChartCard
                                title={t('pigs.kpi.cumulativeConsumption')}
                                data={[{ id: t('pigs.kpi.foodConsumed'), color: '#f59e0b', data: (feedingStats.cumulativeConsumption || []).map((p: any) => ({ x: p.date, y: p.value })) }]}
                                yLabel="Kg acumulados"
                                xLabel={t('common.field.date')}
                                height={280} curve="natural" pointSize={5} strokeWidth={2}
                                enableGrid enablePoints enableArea showLegend={false}
                                headerBgColor="#ffffff" className="border-0 shadow-sm h-100"
                            />
                        </Col>
                        <Col lg={4}>
                            <DonutChartCard
                                title={t('feeding.groupFeeding.chart.distributionTitle')}
                                data={feedingStats.distributionByType || []}
                                legendItems={(feedingStats.distributionByType || []).map((d: any) => ({
                                    label: d.label,
                                    value: `${d.value} kg`,
                                    percentage: feedingStats.kpis?.totalConsumed ? `${((d.value / feedingStats.kpis.totalConsumed) * 100).toFixed(1)}%` : '0%',
                                }))}
                                className="h-100 border-0 shadow-sm" headerBgColor="#ffffff"
                            />
                        </Col>
                    </Row>
                </>
            )}
            <div style={{ minHeight: "400px" }}>
                <FeedAdministrationsCard administrations={administrations} targetType="pig" targetId={pigId} targetStage={pigStage} onAdministered={fetchFeedingInfo} />
            </div>
            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </>
    );
};

export default PigFeedingDetails;
