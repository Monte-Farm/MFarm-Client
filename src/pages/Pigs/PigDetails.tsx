import { ConfigContext } from "App";
import { Attribute, PigData, PigHistoryChanges } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { Button, Card, CardBody, CardHeader, Col, Container, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label } from "reactstrap"
import classnames from "classnames";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import PigMedicalDetails from "Components/Common/Details/PigMedicalDetails";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import PigFeedingDetails from "Components/Common/Details/PigFeedingDetails";
import PigReproductionDetails from "Components/Common/Details/PigReproductionDetails";
import WeighSinglePigForm from "Components/Common/Forms/WeighSinglePigForm";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DatePicker from "react-flatpickr";
import { RiCalendarLine, RiScales3Line, RiHome4Line, RiGroupLine, RiInformationLine, RiMapPin2Line, RiErrorWarningLine, RiHistoryLine, RiArrowRightLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";

const PigDetails = () => {
    const { pig_id } = useParams();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const { t } = useTranslation();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [pigInfo, setPigInfo] = useState<PigData | null>(null)
    const [pigHistory, setPigHistory] = useState<PigHistoryChanges[]>([])
    const [generalInfo, setGeneralInfo] = useState<any | null>(null)
    const [activeTab, setActiveTab] = useState<string>('1');
    const [modals, setModals] = useState({ update: false, viewPDF: false, weighPig: false });
    const navigate = useNavigate()
    const [generatingReport, setGeneratingReport] = useState(false);
    const [fileURL, setFileURL] = useState<string>('')
    const [fullHistoryModal, setFullHistoryModal] = useState(false);
    const [fullHistoryLoading, setFullHistoryLoading] = useState(false);
    const [fullHistoryData, setFullHistoryData] = useState<any>(null);
    const [fullHistoryFilters, setFullHistoryFilters] = useState({ page: 1, limit: 20, start_date: '', end_date: '', user_id: '', field: '' });

    const statusConfig: Record<string, { color: string }> = {
        alive: { color: 'success' }, sold: { color: 'info' },
        slaughtered: { color: 'warning' }, dead: { color: 'danger' }, discarded: { color: 'secondary' },
    };
    const stageConfig: Record<string, { color: string }> = {
        piglet: { color: 'info' }, weaning: { color: 'primary' },
        fattening: { color: 'warning' }, breeder: { color: 'success' },
    };
    const sexIcons: Record<string, string> = { male: 'ri-men-line', female: 'ri-women-line' };

    const toggleTab = (tab: any) => { if (activeTab !== tab) setActiveTab(tab) }
    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };
    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color, message })
        setTimeout(() => setAlertConfig(prev => ({ ...prev, visible: false })), 5000);
    }

    const getOriginLabel = (pig: PigData | null) => {
        if (!pig) return '—';
        return t(`pigs.origin.${pig.origin}`, { defaultValue: pig.origin });
    };

    const formatFieldName = (field: string) => {
        const map: Record<string, string> = {
            currentStage: t('pigs.field.stage'),
            weight: t('common.field.weight'),
            group: t('pigs.field.currentGroup'),
            status: t('pigs.field.status'),
        };
        return map[field] || field;
    };

    const formatValue = (field: string, value: any) => {
        if (value === null || value === undefined) return '—';
        if (field === 'currentStage') return t(`pigs.stage.${value}`, { defaultValue: value });
        if (field === 'status') return t(`pigs.status.${value}`, { defaultValue: value });
        if (field === 'weight') return `${value} kg`;
        return String(value);
    };

    const fetchData = async () => {
        if (!pig_id || !configContext) return;
        setLoading(true);
        try {
            const [detailsRes, historyRes, generalInfoRes] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pig_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/history/${pig_id}`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/general_info/${pig_id}`),
            ]);
            setPigInfo(detailsRes.data.data);
            setPigHistory(historyRes.data.data);
            setGeneralInfo(generalInfoRes.data.data)
        } catch (error) {
            showAlert('danger', t('common.status.noData'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReport = async () => {
        if (!configContext || !pig_id) return;
        setGeneratingReport(true);
        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/reports/generate_pig_report/${pig_id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            setFileURL(url);
            toggleModal('viewPDF')
        } catch (error) {
            showAlert('danger', t('common.status.noData'));
        } finally {
            setGeneratingReport(false)
        }
    };

    const fetchFullHistory = async (filters = fullHistoryFilters) => {
        if (!configContext || !pig_id) return;
        setFullHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) params.append(k, String(v)); });
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/full_history/${pig_id}?${params.toString()}`);
            setFullHistoryData(response.data.data);
        } catch (error) {
            showAlert('danger', t('common.status.noData'));
        } finally {
            setFullHistoryLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [])

    if (loading) return <LoadingAnimation />

    const info = generalInfo;
    const status = info ? statusConfig[info.basicInfo.status] || { color: 'secondary' } : null;
    const stage = info ? stageConfig[info.basicInfo.currentStage] || { color: 'secondary' } : null;

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('pigs.page.detailTitle')} pageTitle={t('menu.pigs')} />

                <div className="mb-3 d-flex">
                    <Button className="farm-secondary-button" onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-3"></i>
                        {t('common.button.back')}
                    </Button>
                    <Button color="primary" className="h-50 ms-auto me-2" onClick={() => toggleModal('weighPig')} disabled={pigInfo?.status !== 'alive'}>
                        <i className="ri-scales-3-line me-2" />{t('pigs.action.registerWeight')}
                    </Button>
                    <Button className="h-50 farm-primary-button" onClick={handlePrintReport} disabled={generatingReport}>
                        {generatingReport
                            ? <><Spinner size="sm" /> Generando...</>
                            : <><i className="ri-download-line me-2"></i>{t('pigs.action.downloadInfo')}</>
                        }
                    </Button>
                </div>

                <Card>
                    <Nav pills className="nav-justified p-3">
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')} style={{ cursor: 'pointer' }}>
                                {t('pigs.section.basicInfo')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')} style={{ cursor: 'pointer' }}>
                                {t('pigs.section.feeding')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')} style={{ cursor: 'pointer' }}>
                                {t('pigs.section.medication')}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink className={classnames({ active: activeTab === '4' })} onClick={() => toggleTab('4')} style={{ cursor: 'pointer' }}>
                                {t('pigs.section.reproduction')}
                            </NavLink>
                        </NavItem>
                    </Nav>
                </Card>

                <TabContent activeTab={activeTab}>
                    <TabPane tabId="1" id="general-info-tab">
                        {info && (() => {
                            const sex = info.basicInfo.sex;
                            return (
                                <>
                                    {/* Hero header */}
                                    <Card className="border-0 shadow-sm mb-3 overflow-hidden">
                                        <div style={{ background: 'linear-gradient(135deg, #fff5eb 0%, #ffe8d1 100%)', borderBottom: '1px solid #f0d4b0' }}>
                                            <CardBody className="p-4">
                                                <Row className="align-items-center g-3">
                                                    <Col xs="auto">
                                                        <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 88, height: 88, border: '3px solid #fff' }}>
                                                            <i className="ri-bear-smile-line" style={{ fontSize: '2.5rem', color: '#f59e0b' }}></i>
                                                        </div>
                                                    </Col>
                                                    <Col>
                                                        <div className="text-muted small fw-medium mb-1">{t('menu.pigs')}</div>
                                                        <h3 className="mb-2 fw-bold text-dark">{info.basicInfo.code}</h3>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <Badge color={status?.color} className="px-3 py-2 fw-normal">
                                                                <i className="ri-heart-pulse-line me-1"></i>
                                                                {t(`pigs.status.${info.basicInfo.status}`, { defaultValue: info.basicInfo.status })}
                                                            </Badge>
                                                            <Badge color={stage?.color} className="px-3 py-2 fw-normal">
                                                                {t(`pigs.stage.${info.basicInfo.currentStage}`, { defaultValue: info.basicInfo.currentStage })}
                                                            </Badge>
                                                            {sex && (
                                                                <Badge color="light" className="px-3 py-2 fw-normal text-dark border">
                                                                    <i className={`${sexIcons[sex]} me-1`}></i>
                                                                    {t(`pigs.sex.${sex}Short`, { defaultValue: sex })}
                                                                </Badge>
                                                            )}
                                                            <Badge color="light" className="px-3 py-2 fw-normal text-dark border">{info.basicInfo.breed}</Badge>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </div>
                                    </Card>

                                    {/* KPIs */}
                                    <Row className="g-3 mb-3">
                                        <Col md={6} lg={3}>
                                            <StatKpiCard title={t('pigs.field.age')} value={info.basicInfo.ageLabel as any} icon={<RiCalendarLine size={20} style={{ color: '#8b5cf6' }} />} />
                                        </Col>
                                        <Col md={6} lg={3}>
                                            <StatKpiCard title={t('pigs.field.currentWeight')} value={info.basicInfo.weight} suffix="kg" icon={<RiScales3Line size={20} style={{ color: '#0ea5e9' }} />} animateValue decimals={1} />
                                        </Col>
                                        <Col md={6} lg={3}>
                                            <StatKpiCard title={t('pigs.field.currentFarm')} value={info.origin.daysInFarm} suffix=" días" icon={<RiHome4Line size={20} style={{ color: '#f59e0b' }} />} animateValue decimals={0} />
                                        </Col>
                                        <Col md={6} lg={3}>
                                            <StatKpiCard title={t('pigs.field.currentGroup')} value={info.currentGroup?.name as any || t('pigs.field.noGroup')} icon={<RiGroupLine size={20} style={{ color: '#10b981' }} />} />
                                        </Col>
                                    </Row>

                                    {/* Info cards */}
                                    <Row className="g-3 mb-3">
                                        <Col lg={6}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <CardHeader className="bg-white border-bottom py-3">
                                                    <h6 className="mb-0 fw-bold text-dark">
                                                        <RiInformationLine className="me-2 text-primary" />{t('pigs.section.basicInfoCard')}
                                                    </h6>
                                                </CardHeader>
                                                <CardBody>
                                                    <dl className="row mb-0">
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.code')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.basicInfo.code}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.breed')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.basicInfo.breed}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.sex')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{t(`pigs.sex.${sex}Short`, { defaultValue: sex }) || '—'}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.birthDate')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">
                                                            {new Date(info.basicInfo.birthdate).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.age')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.basicInfo.ageLabel}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('common.field.weight')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.basicInfo.weight} kg</dd>
                                                        <dt className="col-12 text-muted small fw-medium pt-3">{t('pigs.field.observations')}</dt>
                                                        <dd className="col-12 text-dark pt-2 mb-0 small" style={{ lineHeight: 1.6 }}>{info.basicInfo.observations || '—'}</dd>
                                                    </dl>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        <Col lg={6}>
                                            <Card className="border-0 shadow-sm h-100">
                                                <CardHeader className="bg-white border-bottom py-3">
                                                    <h6 className="mb-0 fw-bold text-dark">
                                                        <RiMapPin2Line className="me-2 text-success" />{t('pigs.section.originLocation')}
                                                    </h6>
                                                </CardHeader>
                                                <CardBody>
                                                    <dl className="row mb-0">
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.origin')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0 text-capitalize">{getOriginLabel({ origin: info.origin.origin } as any)}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.originDetail')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.origin.originDetail || '—'}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.originFarm')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">{info.origin.sourceFarm || '—'}</dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.arrivalDate')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">
                                                            {new Date(info.origin.arrivalDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2 border-bottom">{t('pigs.field.currentFarm')}</dt>
                                                        <dd className="col-7 text-dark py-2 border-bottom mb-0">
                                                            <div className="fw-semibold">{info.currentFarm.name}</div>
                                                            <div className="text-muted small">{info.currentFarm.location}</div>
                                                        </dd>
                                                        <dt className="col-5 text-muted small fw-medium py-2">{t('pigs.field.currentGroup')}</dt>
                                                        <dd className="col-7 py-2 mb-0">
                                                            {info.currentGroup ? (
                                                                <>
                                                                    <div className="fw-semibold text-dark">{info.currentGroup.name}</div>
                                                                    <div className="text-muted small">{info.currentGroup.code} · {info.currentGroup.stage}</div>
                                                                </>
                                                            ) : '—'}
                                                        </dd>
                                                    </dl>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {info.discardInfo && (
                                        <Card className="border-0 shadow-sm mb-3" style={{ borderLeft: '4px solid #ef4444' }}>
                                            <CardHeader className="bg-white border-bottom py-3">
                                                <h6 className="mb-0 fw-bold text-danger">
                                                    <RiErrorWarningLine className="me-2" />{t('pigs.section.discardInfo')}
                                                </h6>
                                            </CardHeader>
                                            <CardBody>
                                                <Row className="g-3">
                                                    <Col md={3}>
                                                        <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{t('pigs.section.discardReason')}</div>
                                                        <div className="fw-semibold text-dark">—</div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    )}

                                    {/* Historial reciente */}
                                    <Card className="border-0 shadow-sm">
                                        <CardHeader className="bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                                            <h6 className="mb-0 fw-bold text-dark">
                                                <RiHistoryLine className="me-2 text-primary" />{t('pigs.section.recentHistory')}
                                            </h6>
                                            <Button color="link" size="sm" className="text-decoration-none p-0" onClick={() => { setFullHistoryModal(true); fetchFullHistory(); }}>
                                                {t('pigs.section.viewAll')} <RiArrowRightLine />
                                            </Button>
                                        </CardHeader>
                                        <CardBody>
                                            {info.recentHistory && info.recentHistory.length > 0 ? (
                                                <div className="position-relative ps-4">
                                                    <div className="position-absolute" style={{ left: 10, top: 8, bottom: 8, width: 2, background: '#e9ecef' }} />
                                                    {info.recentHistory.map((entry: any, idx: number) => (
                                                        <div key={idx} className="position-relative mb-3 pb-2" style={{ marginLeft: -6 }}>
                                                            <div className="position-absolute rounded-circle bg-primary" style={{ width: 12, height: 12, left: -4, top: 6, border: '2px solid #fff', boxShadow: '0 0 0 2px #0d6efd' }} />
                                                            <div className="ms-4">
                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                    <span className="fw-semibold text-dark">{entry.action}</span>
                                                                    <span className="text-muted small">·</span>
                                                                    <span className="text-muted small">{new Date(entry.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                </div>
                                                                <div className="text-muted small mb-1">Por <strong className="text-dark">{entry.user.name} {entry.user.lastname}</strong></div>
                                                                {entry.changes.map((change: any, cIdx: number) => (
                                                                    <div key={cIdx} className="small d-flex align-items-center gap-2 flex-wrap">
                                                                        <span className="text-muted">{formatFieldName(change.field)}:</span>
                                                                        <Badge color="light" className="fw-normal text-muted border text-decoration-line-through">{formatValue(change.field, change.oldValue)}</Badge>
                                                                        <RiArrowRightLine className="text-muted" />
                                                                        <Badge color="primary" className="fw-normal">{formatValue(change.field, change.newValue)}</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-4">{t('pigs.section.noHistory')}</div>
                                            )}
                                        </CardBody>
                                    </Card>
                                </>
                            );
                        })()}
                    </TabPane>
                    <TabPane tabId="2"><PigFeedingDetails pigId={pig_id ?? ''} /></TabPane>
                    <TabPane tabId="3"><PigMedicalDetails pigId={pig_id ?? ''} /></TabPane>
                    <TabPane tabId="4"><PigReproductionDetails pigId={pig_id ?? ''} /></TabPane>
                </TabContent>
            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            <Modal size="md" isOpen={modals.weighPig} toggle={() => toggleModal('weighPig')} centered backdrop="static" keyboard={false}>
                <ModalHeader toggle={() => toggleModal('weighPig')}>{t('pigs.action.registerWeight')}</ModalHeader>
                <ModalBody>
                    <WeighSinglePigForm pigId={pig_id ?? ''} currentWeight={generalInfo?.basicInfo?.weight ?? 0} onSave={() => { toggleModal('weighPig'); fetchData(); }} />
                </ModalBody>
            </Modal>

            {/* Historial Completo */}
            <Modal isOpen={fullHistoryModal} toggle={() => setFullHistoryModal(false)} size="xl" scrollable centered>
                <ModalHeader toggle={() => setFullHistoryModal(false)}>
                    <RiHistoryLine className="me-2 text-primary" />{t('pigs.section.fullHistory')}
                </ModalHeader>
                <ModalBody>
                    <Row className="g-2 mb-3 align-items-end">
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('pigs.history.from')}</Label>
                            <DatePicker className="form-control form-control-sm" placeholder={t('pigs.history.from')} value={fullHistoryFilters.start_date || undefined} options={{ dateFormat: 'Y-m-d', allowInput: true }} onChange={(dates: Date[]) => { const val = dates[0] ? dates[0].toISOString().slice(0, 10) : ''; setFullHistoryFilters({ ...fullHistoryFilters, start_date: val, page: 1 }); }} />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('pigs.history.to')}</Label>
                            <DatePicker className="form-control form-control-sm" placeholder={t('pigs.history.to')} value={fullHistoryFilters.end_date || undefined} options={{ dateFormat: 'Y-m-d', allowInput: true }} onChange={(dates: Date[]) => { const val = dates[0] ? dates[0].toISOString().slice(0, 10) : ''; setFullHistoryFilters({ ...fullHistoryFilters, end_date: val, page: 1 }); }} />
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('pigs.history.user')}</Label>
                            <Input type="select" bsSize="sm" value={fullHistoryFilters.user_id} onChange={(e) => setFullHistoryFilters({ ...fullHistoryFilters, user_id: e.target.value, page: 1 })}>
                                <option value="">{t('pigs.history.all')}</option>
                                {fullHistoryData?.filterOptions?.users?.map((u: any) => <option key={u._id} value={u._id}>{u.name} {u.lastname}</option>)}
                            </Input>
                        </Col>
                        <Col md={3}>
                            <Label className="form-label small text-muted mb-1">{t('pigs.history.field')}</Label>
                            <Input type="select" bsSize="sm" value={fullHistoryFilters.field} onChange={(e) => setFullHistoryFilters({ ...fullHistoryFilters, field: e.target.value, page: 1 })}>
                                <option value="">{t('pigs.history.all')}</option>
                                {fullHistoryData?.filterOptions?.fields?.map((f: any) => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </Input>
                        </Col>
                        <Col xs={12}>
                            <Button size="sm" color="primary" onClick={() => fetchFullHistory(fullHistoryFilters)}>{t('pigs.history.applyFilters')}</Button>
                            <Button size="sm" color="light" className="border ms-2" onClick={() => { const reset = { page: 1, limit: 20, start_date: '', end_date: '', user_id: '', field: '' }; setFullHistoryFilters(reset); fetchFullHistory(reset); }}>{t('pigs.history.clear')}</Button>
                        </Col>
                    </Row>

                    {fullHistoryLoading ? (
                        <div className="text-center py-5"><Spinner /></div>
                    ) : fullHistoryData?.items?.length > 0 ? (
                        <div className="position-relative ps-4">
                            <div className="position-absolute" style={{ left: 10, top: 8, bottom: 8, width: 2, background: '#e9ecef' }} />
                            {fullHistoryData.items.map((entry: any, idx: number) => (
                                <div key={entry._id || idx} className="position-relative mb-3 pb-2" style={{ marginLeft: -6 }}>
                                    <div className="position-absolute rounded-circle bg-primary" style={{ width: 12, height: 12, left: -4, top: 6, border: '2px solid #fff', boxShadow: '0 0 0 2px #0d6efd' }} />
                                    <div className="ms-4">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="fw-semibold text-dark">{entry.action}</span>
                                            <span className="text-muted small">·</span>
                                            <span className="text-muted small">{new Date(entry.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="text-muted small mb-1">Por <strong className="text-dark">{entry.user.name} {entry.user.lastname}</strong></div>
                                        {entry.changes?.map((change: any, cIdx: number) => (
                                            <div key={cIdx} className="small d-flex align-items-center gap-2 flex-wrap">
                                                <span className="text-muted">{formatFieldName(change.field)}:</span>
                                                <Badge color="light" className="fw-normal text-muted border text-decoration-line-through">{formatValue(change.field, change.oldValue)}</Badge>
                                                <RiArrowRightLine className="text-muted" />
                                                <Badge color="primary" className="fw-normal">{formatValue(change.field, change.newValue)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted py-5">{t('pigs.history.noResults')}</div>
                    )}
                </ModalBody>
                <ModalFooter className="justify-content-between">
                    <div className="small text-muted">
                        {fullHistoryData?.pagination && <>Página {fullHistoryData.pagination.page} de {fullHistoryData.pagination.totalPages} · {fullHistoryData.pagination.total} registros</>}
                    </div>
                    <div>
                        <Button size="sm" color="light" className="border me-2" disabled={!fullHistoryData || fullHistoryFilters.page <= 1} onClick={() => { const next = { ...fullHistoryFilters, page: fullHistoryFilters.page - 1 }; setFullHistoryFilters(next); fetchFullHistory(next); }}>{t('common.button.back')}</Button>
                        <Button size="sm" color="light" className="border" disabled={!fullHistoryData || fullHistoryFilters.page >= (fullHistoryData?.pagination?.totalPages || 1)} onClick={() => { const next = { ...fullHistoryFilters, page: fullHistoryFilters.page + 1 }; setFullHistoryFilters(next); fetchFullHistory(next); }}>{t('common.button.next')}</Button>
                    </div>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default PigDetails
