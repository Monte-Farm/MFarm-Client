import { logger } from 'utils/logger';
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { ConfigContext } from "App";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalHeader, Row, Spinner } from "reactstrap";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { Attribute } from "common/data_interfaces";
import { FiAlertCircle, FiXCircle } from "react-icons/fi";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import DiagnosisForm from "Components/Common/Forms/DiagnoseForm";
import HeatForm from "Components/Common/Forms/HeatForm";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const STATUS_BG: Record<string, string> = {
    active: 'bg-success', completed: 'bg-primary', failed: 'bg-danger',
};
const RESULT_BG: Record<string, string> = {
    pregnant: 'bg-success', empty: 'bg-danger', doubtful: 'bg-warning',
    resorption: 'bg-danger', abortion: 'bg-black',
};

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const InseminationDetails = () => {
    document.title = 'Detalles de inseminación | System Management'
    const { t } = useTranslation();
    const { insemination_id } = useParams();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLogged = getEffectiveUser();
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [inseminationDetails, setInseminationDetails] = useState<any>({});
    const [sowDetails, setSowDetails] = useState<any>({})
    const [dosesDetails, setDosesDetails] = useState<any[]>([])
    const [modals, setModals] = useState({ heat: false, diagnosis: false, abortionDetails: false, viewPDF: false })
    const [abortionDetails, setAbortionDetails] = useState<any>({})
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    // Attribute arrays defined inside component to allow t() usage
    const sowAttributes: Attribute[] = [
        { key: "code", label: t('insemination.detail.sow.code'), type: "text" },
        { key: "birthdate", label: t('insemination.detail.sow.birthdate'), type: "date" },
        { key: "breed", label: t('insemination.detail.sow.breed'), type: "text" },
        { key: "origin", label: t('insemination.detail.sow.origin'), type: "text" },
        { key: "weight", label: t('insemination.detail.sow.weight'), type: "text" },
        {
            key: "status",
            label: t('insemination.detail.sow.status'),
            type: "text",
            render: (value: string) => {
                const color = value === 'alive' ? 'success' : value === 'discarded' ? 'warning' : value === 'dead' ? 'danger' : 'secondary';
                const label = t(`insemination.detail.sow.status${value.charAt(0).toUpperCase() + value.slice(1)}`, { defaultValue: value });
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "observations", label: t('insemination.detail.sow.observations'), type: "text" },
    ]

    const inseminationAttributes: Attribute[] = [
        {
            key: 'responsible',
            label: t('insemination.detail.attr.responsible'),
            type: 'text',
            render: (_, obj) => (
                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${obj.responsible._id}`)}>
                    {obj.responsible.name} {obj.responsible.lastname} ↗
                </Button>
            )
        },
        { key: 'date', label: t('insemination.detail.attr.date'), type: 'date' },
        { key: 'notes', label: t('insemination.detail.attr.notes'), type: 'text' },
        {
            key: 'estimated_farrowing_date',
            label: t('insemination.detail.attr.estimatedFarrowing'),
            type: 'date',
            render: (_: any, obj: any) => {
                const baseDate = new Date(obj.date);
                const estimated = new Date(baseDate.getTime() + 115 * 24 * 60 * 60 * 1000);
                return estimated.toLocaleDateString();
            }
        },
    ]

    const diagnoseAttributes: Attribute[] = [
        { key: 'diagnosis_date', label: t('insemination.detail.attr.diagnosisDate'), type: 'date' },
        { key: 'diagnose_notes', label: t('insemination.detail.attr.diagnoseNotes'), type: 'text' },
        {
            key: 'diagnose_responsible',
            label: t('insemination.detail.attr.diagnoseResponsible'),
            type: 'text',
            render: (_, obj) =>
                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${obj.diagnose_responsible._id}`)}>
                    {obj.diagnose_responsible.name} {obj.diagnose_responsible.lastname} ↗
                </Button>
        },
    ]

    const abortionAttributes: Attribute[] = [
        { key: 'date', label: t('insemination.detail.attr.abortionDate'), type: 'date' },
        { key: 'probable_cause', label: t('insemination.detail.attr.probableCause'), type: 'text' },
        { key: 'notes', label: t('insemination.detail.attr.notes'), type: 'text' },
    ]

    const fetchData = async () => {
        if (!configContext || !userLogged || !insemination_id) return;
        try {
            const axiosResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/insemination/find_by_id/${insemination_id}`);
            const inseminationData = axiosResponse.data.data;
            setInseminationDetails(inseminationData);

            const [sowResponse, dosesResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${inseminationData.sow}`),
                configContext.axiosHelper.create(`${configContext.apiUrl}/semen_sample/enrich_insemination_doses`, { doses: inseminationData.doses }),
            ]);

            setSowDetails(sowResponse.data.data)
            setDosesDetails(dosesResponse.data.data)
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.load') })
        } finally {
            setLoading(false);
        }
    }

    const handlePrintInsemination = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/inseminations/${insemination_id}`);
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('insemination.error.pdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('insemination.breadcrumb.detailTitle')} pageTitle={t('insemination.breadcrumb.detailParent')} />

                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <Button onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-2" />
                        {t('insemination.detail.button.back')}
                    </Button>

                    <Button
                        color="primary"
                        onClick={handlePrintInsemination}
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? (
                            <>
                                <Spinner className="me-2" size='sm' />
                                {t('insemination.action.generating')}
                            </>
                        ) : (
                            <>
                                <i className="ri-file-pdf-line me-2"></i>
                                {t('insemination.detail.button.pdf')}
                            </>
                        )}
                    </Button>
                </div>

                <div style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                    <Row className="h-100 g-3">
                        <Col lg={3} className="h-100 d-flex flex-column">
                            <div className="d-flex flex-column h-100 gap-3">
                                <Card className="m-0 flex-fill d-flex flex-column min-h-0">
                                    <CardHeader>
                                        <span className="fs-5 text-black">{t('insemination.detail.card.status')}</span>
                                    </CardHeader>
                                    <CardBody className="d-flex justify-content-center align-items-center">
                                        <span className={`${STATUS_BG[inseminationDetails.status] || 'bg-secondary'} text-white rounded-5 fs-5 px-3 py-1`}>
                                            {t(`insemination.status.${inseminationDetails.status}`, { defaultValue: t('insemination.status.unknown') })}
                                        </span>
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0">
                                    <CardHeader>
                                        <span className="text-black fs-5">{t('insemination.detail.card.info')}</span>
                                    </CardHeader>
                                    <CardBody className="flex-fill">
                                        <ObjectDetails attributes={inseminationAttributes} object={inseminationDetails} />
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0">
                                    <CardHeader className="d-flex justify-content-between align-items-center">
                                        <span className="text-black fs-5">{t('insemination.detail.card.sow')}</span>
                                        <Button color='link' onClick={() => navigate(`/pigs/pig_details/${inseminationDetails.sow}`)}>
                                            {t('insemination.detail.card.allInfo')}
                                        </Button>
                                    </CardHeader>
                                    <CardBody className="flex-fill">
                                        <ObjectDetails attributes={sowAttributes} object={sowDetails} />
                                    </CardBody>
                                </Card>
                            </div>
                        </Col>

                        <Col lg={4} className="h-100 d-flex flex-column">
                            <div className="d-flex flex-column h-100 gap-3">
                                <Card className="m-0" style={{ flex: '0 0 auto' }}>
                                    <CardHeader className="d-flex justify-content-between">
                                        <span className="text-black fs-5">{t('insemination.detail.card.result')}</span>

                                        {inseminationDetails && inseminationDetails.result === 'abortion' && (
                                            <Button className="p-0" color="link" onClick={() => toggleModal('abortionDetails')}>
                                                {t('insemination.detail.card.abortionDetails')}
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardBody className="d-flex justify-content-center align-items-center">
                                        {inseminationDetails.result === null ? (
                                            <>
                                                <FiAlertCircle className="text-muted" size={22} />
                                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                    {t('insemination.detail.card.noResult')}
                                                </span>
                                            </>
                                        ) : (
                                            <span className={`${RESULT_BG[inseminationDetails.result] || 'bg-secondary'} text-white rounded-5 fs-5 px-3 py-1`}>
                                                {t(`insemination.result.${inseminationDetails.result}`, { defaultValue: t('insemination.result.unknown') })}
                                            </span>
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="m-0" style={{ flex: '0 0 auto' }}>
                                    <CardHeader className="d-flex justify-content-between">
                                        <span className="text-black fs-5">{t('insemination.detail.card.diagnosis')}</span>

                                        <Button className="" size="sm" onClick={() => toggleModal('diagnosis')} disabled={inseminationDetails.status !== 'active'}>
                                            {t('insemination.detail.button.diagnose')}
                                        </Button>
                                    </CardHeader>
                                    <CardBody className={!inseminationDetails.diagnosis_date ? 'justify-content-center align-items-center d-flex' : ''}>
                                        {!inseminationDetails.diagnosis_date ? (
                                            <div className="">
                                                <FiAlertCircle className="text-muted" size={22} />
                                                <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                    {t('insemination.detail.card.noDiagnosis')}
                                                </span>
                                            </div>
                                        ) : (
                                            <ObjectDetails attributes={diagnoseAttributes} object={inseminationDetails} />
                                        )}
                                    </CardBody>
                                </Card>

                                <Card className="m-0 flex-fill d-flex flex-column min-h-0">
                                    <CardHeader className="d-flex gap-2 justify-content-between">
                                        <span className="text-black fs-5">{t('insemination.detail.card.heat')}</span>

                                        <Button className="" size="sm" onClick={() => toggleModal('heat')} disabled={inseminationDetails.status !== 'active'}>
                                            {t('insemination.detail.button.registerHeat')}
                                        </Button>
                                    </CardHeader>
                                    <CardBody className={`flex-fill p-0`} style={{ minHeight: '200px' }}>
                                        <SimpleBar style={{ height: '100%', maxHeight: 'none' }}>
                                            <div className="p-3">
                                                {inseminationDetails.heats.length === 0 ? (
                                                    <div className="h-100 d-flex justify-content-center align-items-center">
                                                        <FiAlertCircle className="text-muted" size={22} />
                                                        <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                            {t('insemination.detail.card.noHeat')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column gap-3">
                                                        {inseminationDetails.heats
                                                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map((heat: any, idx: number) => (
                                                                <div key={idx} className="d-flex align-items-start gap-3 p-3 border rounded bg-light">
                                                                    <span className={`fs-6 fw-semibold py-2 px-3 rounded text-white ${heat.heat_detected ? "bg-success" : "bg-secondary"}`} style={{ width: "120px", textAlign: "center", flexShrink: 0 }}>
                                                                        {heat.heat_detected ? t('insemination.detail.heat.detected') : t('insemination.detail.heat.notDetected')}
                                                                    </span>

                                                                    <div className="flex-grow-1">
                                                                        <div className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                                                                            {new Date(heat.date).toLocaleDateString("es-ES")}
                                                                        </div>
                                                                        {heat.notes && (
                                                                            <div className="mb-1" style={{ fontSize: "1rem", fontWeight: 500 }}>
                                                                                {heat.notes}
                                                                            </div>
                                                                        )}
                                                                        {heat.responsible && (
                                                                            <Button className="p-0" color="link" style={{ fontSize: "1rem" }}>
                                                                                {heat.responsible.name} {heat.responsible.lastname} ↗
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </SimpleBar>
                                    </CardBody>
                                </Card>
                            </div>
                        </Col>


                        <Col lg={5} className="h-100 d-flex flex-column">
                            <Card className="m-0 h-100 d-flex flex-column min-h-0">
                                <CardHeader>
                                    <span className="text-black fs-5">{t('insemination.detail.card.doses')}</span>
                                </CardHeader>
                                <CardBody className="flex-fill p-0 pb-3" style={{ minHeight: '300px' }}>
                                    <SimpleBar
                                        style={{ height: '100%', maxHeight: '100%' }}
                                        className="h-100"
                                    >
                                        <div className="p-3">
                                            {dosesDetails.length === 0 ? (
                                                <div className="h-100 d-flex justify-content-center align-items-center">
                                                    <FiAlertCircle className="text-muted" size={22} />
                                                    <span className="fs-5 text-black text-muted text-center rounded-5 ms-2">
                                                        {t('insemination.detail.card.noDoses')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-3">
                                                    {dosesDetails
                                                        .sort((a, b) => a.order - b.order)
                                                        .map((dose) => (
                                                            <div key={dose._id} className="d-flex p-3 border rounded bg-light">
                                                                <div className="d-flex align-items-center justify-content-center bg-secondary text-white rounded me-3" style={{ width: "50px", fontWeight: 600 }}>
                                                                    {dose.order}
                                                                </div>

                                                                <div className="flex-grow-1 d-flex flex-column gap-1 fs-5">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">{t('insemination.detail.dose.semenVolume')}</span>
                                                                        <span className="text-black">{dose.dose_info.semen_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">{t('insemination.detail.dose.diluentVolume')}</span>
                                                                        <span className="text-black">{dose.dose_info.diluent_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-semibold text-black">{t('insemination.detail.dose.totalVolume')}</span>
                                                                        <span className="text-black">{dose.dose_info.total_volume} {dose.dose_info.unit_measurement}</span>
                                                                    </div>
                                                                    <div className="d-flex justify-content-between text-muted">
                                                                        <span className="text-black">{t('insemination.detail.dose.applicationDate')}</span>
                                                                        <span className="text-black">{new Date(dose.time).toLocaleString("es-ES")}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </SimpleBar>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('insemination.detail.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />

            <Modal size="lg" isOpen={modals.diagnosis} toggle={() => toggleModal("diagnosis")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("diagnosis")}>{t('insemination.modal.diagnosis')}</ModalHeader>
                <ModalBody>
                    <DiagnosisForm insemination={{ ...inseminationDetails, sow: { _id: inseminationDetails.sow } }} onSave={() => { toggleModal('diagnosis'); fetchData() }} onCancel={() => toggleModal('diagnosis')} />
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.heat} toggle={() => toggleModal("heat")} backdrop="static" keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("heat")}>{t('insemination.modal.heat')}</ModalHeader>
                <ModalBody>
                    {inseminationDetails && <HeatForm insemination={inseminationDetails} onSave={() => { toggleModal('heat'); fetchData() }} onCancel={() => toggleModal('heat')} />}
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={modals.abortionDetails} toggle={() => toggleModal("abortionDetails")} backdrop="static" centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("abortionDetails")}>{t('insemination.detail.modal.abortionDetails')}</ModalHeader>
                <ModalBody className="mt-3">
                    <ObjectDetails attributes={abortionAttributes} object={abortionDetails} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default InseminationDetails;
