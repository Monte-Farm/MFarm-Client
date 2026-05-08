import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Modal,
    ModalBody,
    ModalHeader,
    Nav,
    NavItem,
    NavLink,
    Row,
    TabContent,
    TabPane,
} from "reactstrap";
import classnames from "classnames";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import KPI from "Components/Common/Graphics/Kpi";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import { FaBalanceScale, FaBirthdayCake, FaCalendarDay, FaChartLine, FaMars, FaPiggyBank, FaSkullCrossbones, FaVenus } from "react-icons/fa";
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";
import GroupHistoryTimeline from "Components/Common/Lists/GroupHistoryTimeline";
import GroupMedicalDetails from "Components/Common/Details/GroupMedicalDetails";
import GroupFeedingDetails from "Components/Common/Details/GroupFeedingDetails";
import ChangeStageGroup from "Components/Common/Forms/ChangeStageGroup";
import WeightEvolutionChart from "Components/Common/Graphics/WeightEvolutionChart";
import WeightDistributionChart from "Components/Common/Graphics/WeightDistributionChart";
import GroupTransferForm from "Components/Common/Forms/GroupTransferForm";
import WeighGroupForm from "Components/Common/Forms/WeighGroupForm";
import GroupWithDrawForm from "Components/Common/Forms/GroupWithdrawForm";
import DiscardPigInGroupForm from "Components/Common/Forms/DiscardPigInGroupForm";
import GrowthStatusProgress from "Components/Common/Shared/GrowthStatusProgress";
import ProcessPigReplacementForm from "Components/Common/Forms/ProcessPigReplacementForm";
import SellPigsForm from "Components/Common/Forms/SellPigsForm";
import { useTranslation } from "react-i18next";

const AREA_COLORS: Record<string, string> = {
    gestation: 'info', farrowing: 'primary', maternity: 'primary',
    weaning: 'success', nursery: 'warning', fattening: 'dark',
    replacement: 'secondary', boars: 'info', quarantine: 'danger',
    hospital: 'danger', shipping: 'secondary', exit: 'secondary',
};

const STATUS_COLORS: Record<string, string> = {
    weaning: 'info', ready_to_grow: 'primary', grow_overdue: 'warning',
    growing: 'success', replacement: 'secondary', ready_for_sale: 'success',
    sale: 'success', sold: 'success',
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const GroupDetails = () => {
    const { t } = useTranslation();
    document.title = t('groups.tab.information') + " | Management System";
    const { group_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [groupData, setGroupData] = useState<any>({});
    const [activeTab, setActiveTab] = useState("0");
    const [modals, setModals] = useState({ changeStage: false, registerDeath: false, discard: false, transfer: false, processSale: false, processReplacement: false, sellPigs: false, weighGroup: false });
    const [lastWeighted, setLastWeigthed] = useState<any>({})
    const [growthRate, setGrowthRate] = useState<number>(0);
    const [averageAge, setAverageaAge] = useState<any>()
    const [weightDistribution, setWeightDistribution] = useState<any>();
    const [active, setActive] = useState<any>();
    const [mortality, setMortality] = useState<any>();
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [groupMetrics, setGroupMetrics] = useState<any>({});

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const groupAttibutes: Attribute[] = [
        { key: "code", label: t('groups.column.code'), type: "text" },
        { key: "name", label: t('groups.column.name'), type: "text" },
        {
            key: "area",
            label: t('groups.column.area'),
            type: "text",
            render: (_, row) => {
                const color = AREA_COLORS[row.area] || 'secondary';
                const text = t(`groups.area.${row.area}`, { defaultValue: row.area });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        {
            key: "status",
            label: t('groups.column.status'),
            type: "text",
            render: (_, row) => {
                const color = STATUS_COLORS[row.status] || 'secondary';
                const text = t(`groups.status.${row.status}`, { defaultValue: row.status });
                return <Badge color={color}>{text}</Badge>;
            },
        },
        { key: "creationDate", label: t('groups.column.creationDate'), type: "date" },
        { key: "observations", label: t('groups.column.observations'), type: "text" },
    ];

    const pigColumns: Column<any>[] = [
        { header: t('groups.column.code'), accessor: "code", type: "text" },
        { header: t('groups.column.breed'), accessor: "breed", type: "text" },
        { header: t('groups.column.birthDate'), accessor: "birthdate", type: "date" },
        {
            header: t('common.field.sex'),
            accessor: "sex",
            render: (value: string) => (
                <Badge color={value === "male" ? "info" : "danger"}>
                    {value === "male" ? `♂ ${t('common.sex.male')}` : `♀ ${t('common.sex.female')}`}
                </Badge>
            ),
        },
        { header: t('groups.column.weight'), accessor: "weight", type: "number" },
        {
            header: t('groups.column.status'),
            accessor: "status",
            isFilterable: true,
            render: (value: string) => {
                const statusMap: Record<string, { color: string; key: string }> = {
                    alive: { color: 'success', key: 'pigs.status.alive' },
                    discarded: { color: 'warning', key: 'pigs.status.discarded' },
                    dead: { color: 'dark', key: 'pigs.status.dead' },
                };
                const s = statusMap[value];
                return <Badge color={s?.color || 'secondary'}>{s ? t(s.key) : value}</Badge>;
            },
        },
    ];

    const fetchData = async () => {
        if (!configContext || !userLogged) return;
        try {
            const [groupResponse, lastWeightResponse, growthResponse, averageAgeResponse, weightResponse, activeResponse, mortalityResponse, metricsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/find_by_id/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/group_latest/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/weighing/growth_rate/${group_id}`, { isGroup: true }),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_average_age/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/weight_distribution/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/active_counts/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/mortality/${group_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/group/group_metrics/${group_id}`),
            ])

            setGroupData(groupResponse.data.data);
            setLastWeigthed(lastWeightResponse.data.data)
            setGrowthRate(growthResponse.data.data)
            setAverageaAge(averageAgeResponse.data.data)
            setWeightDistribution(weightResponse.data.data)
            setActive(activeResponse.data.data)
            setMortality(mortalityResponse.data.data)
            setGroupMetrics(metricsResponse.data.data)
        } catch (error) {
            logger.error("Error fetching data: ", { error });
            setAlertConfig({ visible: true, color: "danger", message: t('groups.error.load') });
        } finally {
            setLoading(false);
        }
    };

    const daysSinceLastWeigh = lastWeighted?.weighedAt
        ? Math.floor((Date.now() - new Date(lastWeighted.weighedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('groups.tab.information')} pageTitle={t('groups.pageTitle.groups')} />

                <div className="w-100 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <Button className="btn-danger" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        {t('groups.button.back')}
                    </Button>

                    <div className="d-flex gap-2 flex-wrap">
                        {['weaning', 'ready_to_grow', 'grow_overdue'].includes(groupData.status) && (
                            <Button color="success" disabled={groupData.status === 'sold' || !['ready_to_grow', 'grow_overdue'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                <i className="mdi mdi-chart-line-variant me-2" />
                                {t('groups.button.changeToGrowing')}
                            </Button>
                        )}

                        {['growing', 'ready_for_sale'].includes(groupData.status) && (
                            <>
                                <Button color="info" disabled={groupData.status === 'sold' || !groupData.isReadyForReplacement} onClick={() => toggleModal('processReplacement')}>
                                    <i className="ri-refresh-line me-2" />
                                    {t('groups.button.processReplacement')}
                                </Button>
                                <Button color="warning" disabled={groupData.status === 'sold' || !['ready_for_sale'].includes(groupData.status)} onClick={() => toggleModal('changeStage')}>
                                    <i className="ri-money-dollar-circle-line me-2" />
                                    {t('groups.button.processSale')}
                                </Button>
                            </>
                        )}

                        {groupData.status === 'sale' && groupData.stage === 'sale' && (
                            <Button color="success" onClick={() => toggleModal('sellPigs')}>
                                <i className="ri-shopping-cart-line me-2" />
                                {t('groups.button.sell')}
                            </Button>
                        )}

                        <Button color="primary" onClick={() => toggleModal('weighGroup')} disabled={groupData.status === 'sold'} title={t('groups.button.weighGroup')}>
                            <i className="ri-scales-3-line me-2" />
                            {t('groups.button.weighGroup')}
                        </Button>
                        <Button color="danger" onClick={() => toggleModal('discard')} disabled={groupData.status === 'sold'} title={t('groups.button.withdraw')}>
                            <i className="ri-upload-2-line me-2" />
                            {t('groups.button.withdraw')}
                        </Button>
                        <Button color="warning" onClick={() => toggleModal('transfer')} disabled={groupData.status === 'sold'} title={t('groups.action.transfer')}>
                            <i className="ri-arrow-left-right-line me-2" />
                            {t('groups.button.transfer')}
                        </Button>
                        <Button color="dark" onClick={() => toggleModal('registerDeath')} disabled={groupData.status === 'sold'} title={t('groups.button.registerDeath')}>
                            <FaSkullCrossbones className="me-2" />
                            {t('groups.button.registerDeath')}
                        </Button>
                    </div>
                </div>

                <div className="p-3 bg-white rounded">
                    <Nav tabs className="nav-tabs nav-justified">
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "0" })} onClick={() => toggleTab("0")}>
                                {t('groups.tab.performance')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "1" })} onClick={() => toggleTab("1")}>
                                {t('groups.tab.information')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "2" })} onClick={() => toggleTab("2")}>
                                {t('groups.tab.feeding')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "3" })} onClick={() => toggleTab("3")}>
                                {t('groups.tab.medication')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink style={{ cursor: "pointer" }} className={classnames({ active: activeTab === "4" })} onClick={() => toggleTab("4")}>
                                {t('groups.tab.history')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>

                <TabContent activeTab={activeTab} className="justified-tabs mt-3">
                    <TabPane tabId="0">
                        <Row className="g-3 mb-3">
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title={t('groups.kpi.survivalRate')}
                                    value={groupMetrics?.survivalMetrics?.survivalRate || 0}
                                    suffix="%"
                                    icon={<i className="ri-heart-pulse-line" style={{ fontSize: 20, color: '#10b981' }} />}
                                    animateValue={true}
                                    decimals={1}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title={t('groups.kpi.fcr')}
                                    value={groupMetrics?.feedEfficiency?.fcr || 0}
                                    suffix="kg/kg"
                                    icon={<i className="ri-exchange-line" style={{ fontSize: 20, color: '#ef4444' }} />}
                                    animateValue={true}
                                    decimals={2}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title={t('groups.kpi.uniformity')}
                                    value={groupMetrics?.weightMetrics?.uniformity || 0}
                                    suffix="%"
                                    icon={<i className="ri-scales-3-line" style={{ fontSize: 20, color: '#8b5cf6' }} />}
                                    animateValue={true}
                                    decimals={1}
                                />
                            </Col>
                            <Col md={6} lg={3}>
                                <StatKpiCard
                                    title={t('groups.kpi.daysInProduction')}
                                    value={groupMetrics?.timeMetrics?.daysInProduction || 0}
                                    suffix={t('groups.metric.days')}
                                    icon={<i className="ri-time-line" style={{ fontSize: 20, color: '#f59e0b' }} />}
                                    animateValue={true}
                                    decimals={0}
                                />
                            </Col>
                        </Row>

                        <Card className="border-0 shadow-sm mb-3">
                            <CardHeader className="bg-white border-bottom py-3">
                                <h6 className="mb-0 fw-bold text-dark">
                                    <i className="ri-scales-3-line me-2 text-primary" />
                                    {t('groups.card.weightAnalysis')}
                                </h6>
                            </CardHeader>
                            <CardBody>
                                <Row className="g-3 mb-3">
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.totalWeight?.toFixed(1) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.totalWeight')}</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.averageWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.avgWeight')}</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.minWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.minWeight')}</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                            <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.weightMetrics?.maxWeight?.toFixed(2) || 0} <small className="fs-6 text-muted">kg</small></div>
                                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.maxWeight')}</div>
                                        </div>
                                    </Col>
                                </Row>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">{t('groups.kpi.weightVariance')}</span>
                                            <strong className="text-dark">±{groupMetrics?.weightMetrics?.weightVariance?.toFixed(2) || 0}</strong>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">{t('groups.kpi.uniformityGroup')}</span>
                                            <strong className="text-dark">{groupMetrics?.weightMetrics?.uniformity || 0}%</strong>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>

                        <Row className="g-3 mb-3">
                            <Col lg={7}>
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-bottom py-3">
                                        <h6 className="mb-0 fw-bold text-dark">
                                            <i className="ri-restaurant-line me-2 text-warning" />
                                            {t('groups.card.feedEfficiency')}
                                        </h6>
                                    </CardHeader>
                                    <CardBody>
                                        <Row className="g-3">
                                            <Col xs={6} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.estimatedFeedKg || 0} <small className="fs-6 text-muted">kg</small></div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.estimatedFeed')}</div>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.totalWeightGainKg?.toFixed(1) || 0} <small className="fs-6 text-muted">kg</small></div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.totalGain')}</div>
                                                </div>
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <div className="text-center p-3 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h4 fw-bold text-dark mb-1">{groupMetrics?.feedEfficiency?.fcr?.toFixed(2) || 0}</div>
                                                    <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('groups.kpi.fcr')}</div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={5}>
                                <Card className="border-0 shadow-sm h-100">
                                    <CardHeader className="bg-white border-bottom py-3">
                                        <h6 className="mb-0 fw-bold text-dark">
                                            <i className="ri-heart-pulse-line me-2 text-success" />
                                            {t('groups.card.survival')}
                                        </h6>
                                    </CardHeader>
                                    <CardBody className="d-flex flex-column justify-content-center">
                                        <div className="text-center mb-3">
                                            <div className="display-5 fw-bold text-success">{groupMetrics?.survivalMetrics?.survivalRate || 0}%</div>
                                            <div className="text-muted small">{t('groups.kpi.survivalRate')}</div>
                                        </div>
                                        <Row className="g-2">
                                            <Col xs={6}>
                                                <div className="text-center p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h5 fw-bold text-dark mb-0">{groupMetrics?.survivalMetrics?.initialPigCount || 0}</div>
                                                    <div className="text-muted small">{t('groups.metric.initial')}</div>
                                                </div>
                                            </Col>
                                            <Col xs={6}>
                                                <div className="text-center p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <div className="h5 fw-bold text-dark mb-0">{groupMetrics?.survivalMetrics?.currentPigCount || 0}</div>
                                                    <div className="text-muted small">{t('groups.metric.current')}</div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="border-top mt-3 pt-3 d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">{t('groups.kpi.mortality')}</span>
                                            <Badge color={groupMetrics?.survivalMetrics?.mortality > 0 ? 'danger' : 'success'} className="fw-normal">
                                                {groupMetrics?.survivalMetrics?.mortality || 0} ({groupMetrics?.survivalMetrics?.mortalityRate || 0}%)
                                            </Badge>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        <Card className="border-0 shadow-sm">
                            <CardHeader className="bg-white border-bottom py-3">
                                <h6 className="mb-0 fw-bold text-dark">
                                    <i className="ri-calendar-event-line me-2 text-primary" />
                                    {t('groups.card.chronology')}
                                </h6>
                            </CardHeader>
                            <CardBody>
                                <Row className="g-3">
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">{t('groups.metric.daysInProduction')}</span>
                                            <strong className="text-dark">{groupMetrics?.timeMetrics?.daysInProduction || 0} {t('groups.metric.days')}</strong>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">{t('groups.metric.startDate')}</span>
                                            <strong className="text-dark">
                                                {groupMetrics?.timeMetrics?.startDate
                                                    ? new Date(groupMetrics.timeMetrics.startDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </strong>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                                            <span className="text-muted small">{t('groups.metric.currentStage')}</span>
                                            <Badge color="success" className="fw-normal">
                                                {groupMetrics?.groupInfo?.stage
                                                    ? t(`groups.stage.${groupMetrics.groupInfo.stage}`, { defaultValue: groupMetrics.groupInfo.stage })
                                                    : '—'}
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </TabPane>

                    <TabPane tabId="1">
                        <div className="row g-3 align-items-stretch">
                            <div className="d-flex gap-2">
                                <div className="bg-white p-3 rounded shadow-sm d-flex gap-3">
                                    <KPI title={t('groups.kpi.activeTotal')} value={active?.total} icon={FaPiggyBank} bgColor="#F3F4F6" iconColor="#374151" />
                                    <KPI title={t('groups.kpi.males')} value={active?.male} icon={FaMars} bgColor="#E0F2FF" iconColor="#007BFF" />
                                    <KPI title={t('groups.kpi.females')} value={active?.female} icon={FaVenus} bgColor="#FFE0F0" iconColor="#FF007B" />
                                    <KPI title={t('groups.kpi.mortality')} value={mortality.mortality} icon={FaSkullCrossbones} bgColor="#FDECEC" iconColor="#E74C3C" />
                                    <KPI title={t('groups.kpi.avgAge')} value={averageAge ? `${averageAge.days} ${t('groups.metric.days')}` : "-"} icon={FaBirthdayCake} bgColor="#E8F6F3" iconColor="#1ABC9C" />
                                    <KPI title={t('groups.kpi.avgWeightKpi')} value={`${lastWeighted?.weight?.toFixed(2) ?? groupData.avgWeight.toFixed(2)} kg`} icon={FaBalanceScale} bgColor="#E9F7EF" iconColor="#2ECC71" />
                                    <KPI title={t('groups.kpi.dailyGain')} value={`${growthRate.toFixed(2)} kg/día`} icon={FaChartLine} bgColor="#EEF2FF" iconColor="#4F46E5" />
                                    <KPI title={t('groups.kpi.lastWeigh')} value={`${daysSinceLastWeigh} ${t('groups.metric.days')}`} icon={FaCalendarDay} bgColor="#FFF4E5" iconColor="#F39C12" />
                                </div>

                                <div className="d-flex gap-3 w-100">
                                    <GrowthStatusProgress status={groupData.status} title={t('groups.tab.information')} />
                                </div>
                            </div>

                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <Card className="shadow-sm flex-grow-1 h-100">
                                    <CardHeader className="bg-white">
                                        <h5 className="mb-0 text-uppercase text-muted">{t('groups.card.generalInfo')}</h5>
                                    </CardHeader>
                                    <CardBody>
                                        <ObjectDetails attributes={groupAttibutes} object={groupData} />
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <WeightDistributionChart data={weightDistribution} title={t('groups.card.weightDistribution')} />
                            </div>

                            <div className="col-12 col-xl-4 d-flex flex-column">
                                <WeightEvolutionChart entityId={group_id ?? ""} mode="group" title={t('groups.card.weightEvolution')} />
                            </div>

                            <div className="col-12">
                                <Card className="shadow-sm m-0">
                                    <CardHeader className="bg-white">
                                        <h5 className="mb-0 fw-bold text-uppercase text-muted">{t('groups.card.pigsInGroup')}</h5>
                                    </CardHeader>
                                    <CardBody className="px-0">
                                        <CustomTable
                                            columns={pigColumns}
                                            data={groupData.pigsInGroup}
                                            showSearchAndFilter={false}
                                            rowsPerPage={10}
                                            showPagination
                                        />
                                    </CardBody>
                                </Card>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tabId="2">
                        <GroupFeedingDetails key={`feeding-${refreshKey}`} groupId={group_id ?? ""} onUpdate={fetchData} isGroupSold={groupData.status === 'sold'} />
                    </TabPane>

                    <TabPane tabId="3">
                        <GroupMedicalDetails key={`medical-${refreshKey}`} groupId={group_id ?? ""} onUpdate={fetchData} isGroupSold={groupData.status === 'sold'} />
                    </TabPane>

                    <TabPane tabId="4">
                        <GroupHistoryTimeline data={groupData.groupHistory || []} />
                    </TabPane>
                </TabContent>
            </Container>

            <Modal size="xl" isOpen={modals.changeStage} toggle={() => toggleModal("changeStage")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("changeStage")}>{t('groups.modal.changeStage')}</ModalHeader>
                <ModalBody>
                    <ChangeStageGroup groupId={groupData._id} onSave={() => { toggleModal('changeStage'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.processReplacement} toggle={() => toggleModal("processReplacement")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("processReplacement")}>{t('groups.modal.processReplacement')}</ModalHeader>
                <ModalBody>
                    <ProcessPigReplacementForm groupId={groupData._id} onSave={() => { toggleModal('processReplacement'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.transfer} toggle={() => toggleModal("transfer")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("transfer")}>{t('groups.modal.transferPigs')}</ModalHeader>
                <ModalBody>
                    <GroupTransferForm groupId={group_id ?? ''} onSave={() => { toggleModal('transfer'); fetchData(); setRefreshKey(prev => prev + 1); }} stage={groupData.stage} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.discard} toggle={() => toggleModal("discard")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("discard")}>{t('groups.modal.withdrawPigs')}</ModalHeader>
                <ModalBody>
                    <GroupWithDrawForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('discard'); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.registerDeath} toggle={() => toggleModal("registerDeath")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("registerDeath")}>{t('groups.modal.registerDeath')}</ModalHeader>
                <ModalBody>
                    <DiscardPigInGroupForm groupId={group_id ?? ''} onSave={() => { fetchData(); toggleModal('registerDeath'); setRefreshKey(prev => prev + 1); }} onCancel={() => { }} />
                </ModalBody>
            </Modal>

            <Modal size="xl" isOpen={modals.sellPigs} toggle={() => toggleModal("sellPigs")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("sellPigs")}>{t('groups.modal.sellPigs')}</ModalHeader>
                <ModalBody>
                    <SellPigsForm groupId={groupData._id} onSave={() => { toggleModal('sellPigs'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.weighGroup} toggle={() => toggleModal("weighGroup")} centered backdrop={'static'} keyboard={false} fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("weighGroup")}>{t('groups.modal.weighGroup')}</ModalHeader>
                <ModalBody>
                    <WeighGroupForm groupId={group_id ?? ''} onSave={() => { toggleModal('weighGroup'); fetchData(); setRefreshKey(prev => prev + 1); }} />
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    );
};

export default GroupDetails;
