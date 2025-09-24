import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Button, Col, Container, Row, Card, CardBody, CardHeader } from "reactstrap";
import LoadingAnimation from "Components/Common/LoadingAnimation";
import AlertMessage from "Components/Common/AlertMesagge";
import ObjectDetails from "./ObjectDetails";
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
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "", });
    const [extractionDetails, setExtractionDetails] = useState<any>({});
    const [boarDetails, setBoarDetails] = useState<any>({});

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
        { key: "origin", label: "Origen", type: "text" },
        { key: "weight", label: "Peso actual", type: "text" },
        { key: "status", label: "Estado", type: "text" },
        { key: "observations", label: "Observaciones", type: "text" },
    ];

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
            {/* <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0 fw-bold text-primary">
                    Detalles de la extracción
                </h4>

                <Button color="primary" size="md">
                    Ver muestras
                </Button>
            </div> */}

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
        </div>
    );
};

export default ExtractionDetails;