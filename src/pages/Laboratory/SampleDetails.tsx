import { logger } from 'utils/logger';
import { ConfigContext } from "App";
import { HttpStatusCode } from "axios";
import { Column } from "common/data/data_types";
import { Attribute } from "common/data_interfaces";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import ExtractionDetails from "Components/Common/Details/ExtractionDetails";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import CustomTable from "Components/Common/Tables/CustomTable";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row, UncontrolledTooltip, Spinner } from "reactstrap";
import SimpleBar from "simplebar-react";
import PDFViewer from "Components/Common/Shared/PDFViewer";
import { useTranslation } from "react-i18next";

const SampleDetails = () => {
    const { t } = useTranslation();
    document.title = t('laboratory.sample.detail.pageTitle')
    const { sample_id } = useParams();
    const navigate = useNavigate();
    const configContext = useContext(ConfigContext);
    const userLoggged = getEffectiveUser();
    const [loading, setLoading] = useState(true);
    const [alerConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [sampleDetails, setSampleDetails] = useState<any>({});
    const [extractionDetails, setExtractionDetails] = useState<any>({});
    const [supplierDetails, setSupplierDetails] = useState<any>(null);
    const [technicianDetails, setTecnicianDetails] = useState<any>({});
    const [dosesDetails, setDosesDetails] = useState<any[]>([]);
    const [discardDetails, setDiscardDetails] = useState<{ userId: string, discardResponsible: string, discardDate: string, discardReason: string }>()
    const [modals, setModals] = useState({ extractionDetails: false, discardDose: false, viewPDF: false });
    const [selectedDose, setSelectedDose] = useState<any>({});
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const getLotStatusBadge = (lotStatus: string) => {
        const statusMap: Record<string, { color: string; key: string }> = {
            available: { color: "success", key: "available" },
            near_expiration: { color: "warning", key: "nearExpiration" },
            expired: { color: "dark", key: "expired" },
            out_of_stock: { color: "dark", key: "outOfStock" },
            discarded: { color: "dark", key: "discarded" },
        };
        const entry = statusMap[lotStatus];
        const text = entry ? t(`laboratory.sample.lotStatus.${entry.key}`) : t('laboratory.sample.lotStatus.unknown');
        const color = entry ? entry.color : "secondary";
        return <Badge color={color}>{text}</Badge>;
    };

    const getDoseStatusBadge = (status: string) => {
        const statusMap: Record<string, { color: string; key: string }> = {
            available: { color: "success", key: "available" },
            used: { color: "warning", key: "used" },
            expired: { color: "danger", key: "expired" },
            discarded: { color: "dark", key: "discarded" },
        };
        const entry = statusMap[status];
        const text = entry ? t(`laboratory.sample.doseStatus.${entry.key}`) : t('laboratory.sample.doseStatus.unknown');
        const color = entry ? entry.color : "secondary";
        return <Badge color={color}>{text}</Badge>;
    };

    const sampleAttributes: Attribute[] = [
        {
            key: 'lot_status',
            label: t('laboratory.sample.detail.attr.status'),
            type: 'text',
            render: (_, obj) => getLotStatusBadge(obj.lot_status),
        },
        { key: 'expiration_date', label: t('laboratory.sample.detail.attr.expirationDate'), type: 'date' },
        { key: 'conservation_method', label: t('laboratory.sample.detail.attr.conservationMethod'), type: 'text' },
        { key: 'concentration_million', label: t('laboratory.sample.detail.attr.concentration'), type: 'text' },
        { key: 'motility_percent', label: t('laboratory.sample.detail.attr.motility'), type: 'text' },
        { key: 'vitality_percent', label: t('laboratory.sample.detail.attr.vitality'), type: 'text' },
        { key: 'abnormal_percent', label: t('laboratory.sample.detail.attr.abnormality'), type: 'text' },
        { key: 'pH', label: t('laboratory.sample.detail.attr.ph'), type: 'text' },
        { key: 'temperature', label: t('laboratory.sample.detail.attr.temperature'), type: 'text' },
        {
            key: 'diluent',
            label: t('laboratory.sample.detail.attr.diluent'),
            type: 'text',
            render: (_, obj) => obj.diluent.type + " - " + obj.diluent.lot + " - " + obj.diluent.volume + " " + obj.diluent.unit_measurement || t('laboratory.sample.detail.attr.noDiluent')
        },
    ]

    const DiscardAttributes: Attribute[] = [
        {
            key: "discardResponsible",
            label: t('laboratory.sample.detail.discardAttr.by'),
            type: "text",
            render: (value: any, obj: any) => (
                <div className="d-flex gap-1">
                    <Button className="p-0 fs-5 text-underline" color="link" onClick={() => navigate(`/users/user_details/${obj.userId}`)}>
                        {obj.discardResponsible} ↗
                    </Button>
                </div>
            ),
        },
        { key: "discardReason", label: t('laboratory.sample.detail.discardAttr.reason'), type: "text" },
        { key: "discardDate", label: t('laboratory.sample.detail.discardAttr.date'), type: "date" },
    ];

    const ExtractionAttributes: Attribute[] = [
        {
            key: "batch",
            label: t('laboratory.sample.detail.extractionAttr.batch'),
            type: "text",
            render: (value: any, obj: any) => (
                <div className="d-flex gap-1">
                    <Button className="p-0 fs-5" color="link" onClick={() => toggleModal('extractionDetails')}>
                        {obj.batch} ↗
                    </Button>
                </div>
            ),
        },
        { key: "date", label: t('laboratory.sample.detail.extractionAttr.date'), type: "date" },
        { key: "volume", label: t('laboratory.sample.detail.extractionAttr.volume'), type: "text" },
        { key: "unit_measurement", label: t('laboratory.sample.detail.extractionAttr.unit'), type: "text" },
        { key: "extraction_location", label: t('laboratory.sample.detail.extractionAttr.location'), type: "text" },
        { key: "appearance", label: t('laboratory.sample.detail.extractionAttr.appearance'), type: "text" },
        { key: "notes", label: t('laboratory.sample.detail.extractionAttr.notes'), type: "text" },
    ];

    const SupplierAttributes: Attribute[] = [
        { key: "name", label: t('laboratory.sample.detail.supplierAttr.name'), type: "text" },
        { key: "lot", label: t('laboratory.sample.detail.supplierAttr.lot'), type: "text" },
        { key: "purchase_date", label: t('laboratory.sample.detail.supplierAttr.purchaseDate'), type: "date" },
    ];

    const dosesColumns: Column<any>[] = [
        { header: t('laboratory.sample.detail.doseColumn.code'), accessor: 'code', type: 'text', isFilterable: true },
        {
            header: t('laboratory.sample.detail.doseColumn.semen'),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.semen_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('laboratory.sample.detail.doseColumn.diluent'),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.diluent_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('laboratory.sample.detail.doseColumn.totalVolume'),
            accessor: 'doses',
            type: 'number',
            isFilterable: true,
            render: (_, row) => `${row.total_volume} ${row.unit_measurement}` || 0
        },
        {
            header: t('laboratory.sample.detail.doseColumn.status'),
            accessor: 'status',
            type: 'text',
            isFilterable: false,
            render: (_, row) => getDoseStatusBadge(row.status),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <Button className="p-0" color="link" onClick={() => { setSelectedDose(row); toggleModal('discardDose') }} disabled={row.status === "available" ? false : true}>
                    {t('laboratory.sample.detail.doseColumn.discard')}
                </Button>
            ),
        },
    ]

    const discardDose = async () => {
        if (!configContext) return;
        try {
            const discardResponse = await configContext.axiosHelper.update(`${configContext.apiUrl}/semen_sample/discard_dose`, {
                sampleId: sampleDetails._id,
                doseId: selectedDose._id
            })

            if (discardResponse.status === HttpStatusCode.Ok) {
                toggleModal('discardDose')
                setAlertConfig({ visible: true, color: 'success', message: t('laboratory.sample.detail.success.discardDose', { code: selectedDose.code }) })
                fetchData();
            }
        } catch (error) {
            logger.error(`Error discarding the dose: ${selectedDose.code}:`, error)
            toggleModal('discardDose')
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.sample.detail.error.discardDose', { code: selectedDose.code }) })
        }
    }

    const handlePrintSample = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/semen_samples/${sample_id}`);
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            logger.error('Error generating PDF: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.sample.detail.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchData = async () => {
        if (!configContext || !userLoggged || !sample_id) return;
        try {
            const axiosResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/semen_sample/find_by_id/${sample_id}`);
            const sampleData = axiosResponse.data.data;
            setSampleDetails(sampleData);
            setDosesDetails(sampleData.doses);

            const isExternal = sampleData.origin === 'external';

            const promises: Promise<any>[] = [
                configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${sampleData.technician}`),
            ];
            if (!isExternal && sampleData.extraction_id) {
                promises.push(configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_id/${sampleData.extraction_id}`));
            }

            const results = await Promise.all(promises);
            setTecnicianDetails(results[0].data.data);

            if (!isExternal && results[1]) {
                setExtractionDetails(results[1].data.data);
            } else if (isExternal && sampleData.supplier) {
                setSupplierDetails(sampleData.supplier);
            }

            if (sampleData.lot_status === 'discarded') {
                const discardResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/user/find_by_mongo_id/${sampleData.discarded_by}`);
                const discardData = discardResponse.data.data;
                setDiscardDetails({
                    userId: discardData._id,
                    discardResponsible: discardData.name + " " + discardData.lastname,
                    discardDate: sampleData.discard_date,
                    discardReason: sampleData.discard_reason
                });
            }
        } catch (error) {
            logger.error('Error fetching data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.sample.detail.error.fetchData') })
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [])


    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('laboratory.sample.detail.breadcrumb.title')} pageTitle={t('laboratory.sample.detail.breadcrumb.parent')} />

                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <Button onClick={() => navigate(-1)}>
                        <i className="ri-arrow-left-line me-3"></i>
                        {t('laboratory.sample.detail.action.back')}
                    </Button>

                    <Button
                        color="primary"
                        onClick={handlePrintSample}
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? (
                            <>
                                <Spinner className="me-2" size='sm' />
                                {t('common.button.generating')}
                            </>
                        ) : (
                            <>
                                <i className="ri-file-pdf-line me-2"></i>
                                {t('laboratory.sample.detail.action.viewPdf')}
                            </>
                        )}
                    </Button>
                </div>

                {technicianDetails && (
                    <Card className="mb-4 shadow-sm">
                        <CardBody className="d-flex justify-content-between align-items-center">
                            <span className="text-black fs-5">
                                <strong>{t('laboratory.sample.detail.responsible')}</strong>
                                <Button className="p-0 fs-5" color="link" onClick={() => navigate(`/users/user_details/${technicianDetails._id}`)}>
                                    {technicianDetails.name} {technicianDetails.lastname} ↗
                                </Button>
                            </span>
                        </CardBody>
                    </Card>
                )}

                <Row className="align-items-stretch">
                    <Col lg={3}>
                        {sampleDetails && (
                            <Card className="shadow-md h-100">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>{t('laboratory.sample.detail.card.lotInfo')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={sampleAttributes} object={sampleDetails} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>

                    <Col lg={3}>
                        {sampleDetails.lot_status === 'discarded' && (
                            <Card className="shadow-md m-0 mb-3">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>{t('laboratory.sample.detail.card.discardInfo')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={DiscardAttributes} object={discardDetails || {}} />
                                </CardBody>
                            </Card>
                        )}

                        {sampleDetails.origin !== 'external' && extractionDetails && Object.keys(extractionDetails).length > 0 && (
                            <Card className={`shadow-md m-0 ${sampleDetails.lot_status === "discarded" ? "" : "h-100"}`}>
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>{t('laboratory.sample.detail.card.extractionInfo')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={ExtractionAttributes} object={extractionDetails} />
                                </CardBody>
                            </Card>
                        )}

                        {sampleDetails.origin === 'external' && supplierDetails && (
                            <Card className={`shadow-md m-0 ${sampleDetails.lot_status === "discarded" ? "" : "h-100"}`}>
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>{t('laboratory.sample.detail.card.supplierInfo')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <ObjectDetails attributes={SupplierAttributes} object={supplierDetails} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>

                    <Col lg={6}>
                        {dosesDetails && (
                            <Card className="shadow-md h-100">
                                <CardHeader className="d-flex justify-content-between align-items-center" style={{ backgroundColor: 'lightsteelblue' }}>
                                    <h5>{t('laboratory.sample.detail.card.dosesInfo')}</h5>
                                </CardHeader>
                                <CardBody>
                                    <CustomTable columns={dosesColumns} data={dosesDetails} showPagination={true} showSearchAndFilter={true} rowsPerPage={8} />
                                </CardBody>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>

            <Modal size="xl" isOpen={modals.extractionDetails} toggle={() => toggleModal("extractionDetails")} centered>
                <ModalHeader toggle={() => toggleModal("extractionDetails")}>{t('laboratory.sample.detail.modal.extractionDetails')}</ModalHeader>
                <ModalBody>
                    <ExtractionDetails extractionId={extractionDetails._id} />
                </ModalBody>
            </Modal>

            <Modal size="md" isOpen={modals.discardDose} toggle={() => toggleModal("discardDose")} centered>
                <ModalHeader toggle={() => toggleModal("discardDose")}>{t('laboratory.sample.detail.modal.discardDose')}</ModalHeader>
                <ModalBody>
                    <div className="d-flex flex-column align-items-center text-center gap-3">
                        <FiAlertCircle size={50} color="#dc3545" />
                        <div>
                            <p className="mb-1 fs-5">
                                {t('laboratory.sample.detail.discardDose.confirm', { code: selectedDose.code })}
                            </p>
                            <p className="text-muted fs-6">
                                {t('laboratory.sample.detail.discardDose.warning')}
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="d-flex gap-2 mt-3">
                        <Button color="secondary" onClick={() => toggleModal("discardDose")}>
                            {t('common.button.cancel')}
                        </Button>
                        <Button color="danger" onClick={() => discardDose()}>
                            {t('common.button.confirm')}
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('laboratory.sample.detail.modal.pdfReport')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            {alerConfig.visible && (
                <AlertMessage color={alerConfig.color} message={alerConfig.message} visible={alerConfig.visible} onClose={() => setAlertConfig({ ...alerConfig, visible: false })} />
            )}
        </div>
    )
}

export default SampleDetails;
