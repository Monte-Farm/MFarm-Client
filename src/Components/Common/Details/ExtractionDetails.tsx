import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Button, Col, Container, Row, Card, CardBody, CardHeader, Badge, Spinner, Modal, ModalBody, ModalHeader } from "reactstrap";
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
    document.title = "Detalles de extracción | System Management";
    const configContext = useContext(ConfigContext);
    const userLoggged = getLoggedinUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "", });
    const [extractionDetails, setExtractionDetails] = useState<any>({});
    const [boarDetails, setBoarDetails] = useState<any>({});
    const [modals, setModals] = useState({ viewPDF: false });
    const [fileURL, setFileURL] = useState<string>('');

    const ExtractionAttributes: Attribute[] = [
        { key: "batch", label: "Lote", type: "text" },
        { key: "date", label: "Fecha de extracción", type: "date" },
        { key: "volume", label: "Volumen", type: "text" },
        { key: "unit_measurement", label: "Unidad de medida", type: "text" },
        { key: "extraction_location", label: "Ubicación", type: "text" },
        { key: "appearance", label: "Apariencia", type: "text" },
        { key: "notes", label: "Notas", type: "text" },
    ];

    const BoarAttributes: Attribute[] = [
        { key: "code", label: "Código", type: "text" },
        { key: "birthdate", label: "Fecha de nacimiento", type: "date" },
        { key: "breed", label: "Raza", type: "text" },
        {
            key: "origin",
            label: "Origen",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;

                switch (value) {
                    case 'born':
                        color = 'success';
                        label = 'Nacido en la granja';
                        break;

                    case 'purchased':
                        color = 'warning';
                        label = 'Comprado';
                        break;

                    case 'donated':
                        color = 'info';
                        label = 'Donado';
                        break;

                    case 'other':
                        color = 'dark';
                        label = 'Otro';
                        break;
                }

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "weight", label: "Peso actual", type: "text" },
        {
            key: "status",
            label: "Estado",
            type: "text",
            render: (value: string) => {
                let color = 'secondary';
                let label = value;
                switch (value) {
                    case 'alive': color = 'success'; label = 'Vivo'; break;
                    case 'discarded': color = 'warning'; label = 'Descartado'; break;
                    case 'dead': color = 'danger'; label = 'Muerto'; break;
                }
                return <Badge color={color}>{label}</Badge>;
            },
        },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handlePrintExtraction = async () => {
        if (!configContext) return;

        try {
            setPdfLoading(true);
            
            // Usar axiosHelper.getBlob para mantener consistencia
            const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/extractions/${extractionId}`);
            
            // Crear blob con tipo MIME explícito para PDF
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(pdfBlob);
            
            setFileURL(url);
            toggleModal('viewPDF');
        } catch (error) {
            console.error('Error generating report: ', { error })
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el PDF, intentelo más tarde' })
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
                setAlertConfig({ visible: true, color: "danger", message: "Ha ocurrido un error al obtener los datos, intentelo más tarde", });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <LoadingAnimation />;
    }

    return (
        <div className="mt-2">
            <div className="d-flex gap-2 mb-4">
                <Button 
                    color="primary" 
                    onClick={handlePrintExtraction}
                    disabled={pdfLoading}
                >
                    {pdfLoading ? (
                        <>
                            <Spinner className="me-2" size='sm' />
                            Generando PDF
                        </>
                    ) : (
                        <>
                            <i className="ri-file-pdf-line me-2"></i>
                            Ver PDF
                        </>
                    )}
                </Button>
            </div>

            {extractionDetails?.technician && (
                <Card className="mb-4 shadow-sm bg-light">
                    <CardBody className="d-flex justify-content-between align-items-center">
                        <span className="text-black fs-5">
                            <strong>Responsable: </strong>
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
                            Información de la extracción
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails
                                attributes={ExtractionAttributes}
                                object={extractionDetails}
                            />
                        </CardBody>
                    </Card>
                </Col>

                <Col lg={6} className="mb-3">
                    <Card className="shadow-sm h-100">
                        <CardHeader className="bg-light fw-bold fs-5 d-flex justify-content-between align-items-center">
                            Información del verraco

                            <Button className="fs-6 p-0" color="link" onClick={() => navigate(`/pigs/pig_details/${boarDetails._id}`)}>
                                Todos los detalles ↗
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <ObjectDetails
                                attributes={BoarAttributes}
                                object={boarDetails}
                            />
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Alerta */}
            {alertConfig.visible && (
                <AlertMessage
                    color={alertConfig.color}
                    message={alertConfig.message}
                    visible={alertConfig.visible}
                    onClose={() =>
                        setAlertConfig({ ...alertConfig, visible: false })
                    }
                />
            )}

            {/* Modal PDF */}
            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de extracción</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default ExtractionDetails;