import { ConfigContext } from "App";
import { getEffectiveUser } from "helpers/impersonation_helper";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Col, Card, CardBody, CardHeader, Badge, Spinner, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import ObjectDetails from "./ObjectDetails";
import PDFViewer from "../Shared/PDFViewer";
import { Attribute } from "common/data_interfaces";
import { useNavigate } from "react-router-dom";

interface ExtractionDetailsProps {
    extractionId: string;
}

const ExtractionDetails: React.FC<ExtractionDetailsProps> = ({ extractionId }) => {
    const { t } = useTranslation();
    document.title = t('laboratory.extraction.details.pageTitle');
    const configContext = useContext(ConfigContext);
    const userLoggged = getEffectiveUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [extractionDetails, setExtractionDetails] = useState<any>({});
    const [boarDetails, setBoarDetails] = useState<any>({});
    const [modals, setModals] = useState({ viewPDF: false });
    const [fileURL, setFileURL] = useState<string>('');

    const ExtractionAttributes: Attribute[] = [
        { key: "batch", label: t('laboratory.extraction.form.field.batch'), type: "text" },
        { key: "date", label: t('laboratory.extraction.form.field.date'), type: "date" },
        { key: "volume", label: t('laboratory.extraction.form.field.volume'), type: "text" },
        { key: "unit_measurement", label: t('laboratory.extraction.form.field.unitMeasurement'), type: "text" },
        { key: "extraction_location", label: t('laboratory.extraction.form.field.location'), type: "text" },
        { key: "appearance", label: t('laboratory.extraction.form.field.appearance'), type: "text" },
        { key: "notes", label: t('laboratory.extraction.form.field.notes'), type: "text" },
    ];

    const BoarAttributes: Attribute[] = [
        { key: "code", label: t('common.field.code'), type: "text" },
        { key: "birthdate", label: t('common.field.birthDate'), type: "date" },
        { key: "breed", label: t('common.field.breed'), type: "text" },
        {
            key: "origin",
            label: t('pigs.column.origin'),
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = t('pigs.origin.born');
                        break;
                    case 'purchased':
                        color = 'warning';
                        label = t('pigs.origin.purchased');
                        break;
                    case 'donated':
                        color = 'info';
                        label = t('pigs.origin.donated');
                        break;
                    case 'other':
                        color = 'dark';
                        label = t('pigs.origin.other');
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "weight", label: t('common.field.weight'), type: "text" },
        {
            key: "status",
            label: t('common.field.status'),
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;
                switch (value) {
                    case 'alive': color = 'success'; label = t('pigs.status.alive'); break;
                    case 'discarded': color = 'warning'; label = t('pigs.status.discarded'); break;
                    case 'dead': color = 'danger'; label = t('pigs.status.dead'); break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "observations", label: t('common.field.observations'), type: "text" },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handlePrintExtraction = async () => {
        if (!configContext) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/extractions/${extractionId}`);
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            console.error('Error generating report: ', { error });
            setAlertConfig({ visible: true, color: 'danger', message: t('laboratory.extraction.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!configContext || !userLoggged) return;
            try {
                setLoading(true);
                const extractionResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/extraction/find_by_id/${extractionId}`);
                const extraction = extractionResponse.data.data;
                setExtractionDetails(extraction);
                const boarResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${extraction.boar._id}`);
                setBoarDetails(boarResponse.data.data);
            } catch (error) {
                console.error("Error cargando datos", error);
                setAlertConfig({ visible: true, color: "danger", message: t('laboratory.extraction.error.fetchData') });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <LoadingAnimation />;

    return (
        <div className="mt-2">
            <div className="d-flex gap-2 mb-4">
                <Button color="primary" onClick={handlePrintExtraction} disabled={pdfLoading}>
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            {t('common.button.generating')}
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2" />
                            {t('common.button.exportPdf')}
                        </>
                    )}
                </Button>
            </div>

            {extractionDetails?.technician && (
                <Card className="mb-4 shadow-sm bg-light">
                    <CardBody className="d-flex justify-content-between align-items-center">
                        <span className="text-black fs-5">
                            <strong>{t('laboratory.extraction.details.responsible')} </strong>
                            {extractionDetails.technician.name}{" "}
                            {extractionDetails.technician.lastname}
                        </span>
                    </CardBody>
                </Card>
            )}

            <Row>
                <Col lg={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <CardHeader className="bg-light fw-bold fs-5">
                            {t('laboratory.extraction.details.cardExtraction')}
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={ExtractionAttributes} object={extractionDetails} />
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                            {t('laboratory.extraction.details.cardBoar')}
                            <Button className="fs-6 p-0" color="link" onClick={() => navigate(`/pigs/pig_details/${boarDetails._id}`)}>
                                {t('laboratory.extraction.details.allDetails')} ↗
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails attributes={BoarAttributes} object={boarDetails} />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {alertConfig.visible && (
                <AlertMessage
                    color={alertConfig.color}
                    message={alertConfig.message}
                    visible={alertConfig.visible}
                    onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                />
            )}

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('laboratory.extraction.modal.extractionDetails')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default ExtractionDetails;
