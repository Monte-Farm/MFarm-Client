import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import { useContext, useEffect, useState } from "react"
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiExternalLink } from "react-icons/fi"
import { Alert, Button, Row, Col, Badge } from "reactstrap"
import { useNavigate } from "react-router-dom"
import LoadingAnimation from "../Shared/LoadingAnimation"
import AlertMessage from "../Shared/AlertMesagge"

interface PigDetailsModalProps {
    pigId: string
    showAllDetailsButton?: boolean
}

const PigDetailsModal: React.FC<PigDetailsModalProps> = ({ pigId, showAllDetailsButton }) => {
    const configContext = useContext(ConfigContext)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" })
    const [loading, setLoading] = useState<boolean>(false)
    const [pigDetails, setPigDetails] = useState<PigData | null>(null)
    const navigate = useNavigate();

    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: "danger", message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000)
    }

    const fetchPigDetails = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/pig/find_by_id/${pigId}`
            )
            setPigDetails(response.data.data)
        } catch (error) {
            handleError(error, "Ha ocurrido un error al obtener los detalles del cerdo")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPigDetails()
    }, [])

    const renderValue = (val: any, type?: string) => {
        if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
            return <span className="text-muted">-</span>
        }
        if (type === "date") {
            return new Date(val).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            })
        }
        return val
    }

    const renderBadge = (key: string, val: any) => {
        if (!val) return "-"
        switch (key) {
            case "status":
                return val === "alive" ? (
                    <Badge color="success" className="fs-5 px-2 py-1 rounded-pill">Activo</Badge>
                ) : val === "dead" ? (
                    <Badge color="danger" className="fs-5 px-2 py-1 rounded-pill">Inactivo</Badge>
                ) : (
                    <Badge color="secondary" className="fs-5 px-2 py-1 rounded-pill">{val}</Badge>
                )
            case "sex":
                return val === "male" ? (
                    <Badge color="primary" className="fs-5 px-2 py-1 rounded-pill">Macho</Badge>
                ) : val === "female" ? (
                    <Badge color="pink" className="fs-5 px-2 py-1 rounded-pill" style={{ backgroundColor: '#e83e8c' }}>Hembra</Badge>
                ) : (
                    <Badge color="secondary" className="fs-5 px-2 py-1 rounded-pill">{val}</Badge>
                )
            case "stage":
                switch (val) {
                    case "piglet":
                        return <Badge color="info" className="fs-5 px-2 py-1 rounded-pill">Lechón</Badge>
                    case "weaning":
                        return <Badge color="secondary" className="fs-5 px-2 py-1 rounded-pill">Destetado</Badge>
                    case "fattening":
                        return <Badge color="dark" className="fs-5 px-2 py-1 rounded-pill">Engorda</Badge>
                    case "lactancia":
                        return <Badge color="success" className="fs-5 px-2 py-1 rounded-pill">Lactancia</Badge>
                    case "breeder":
                        return <Badge color="purple" className="fs-5 px-2 py-1 rounded-pill" style={{ backgroundColor: '#6f42c1' }}>Reproductor</Badge>
                    default:
                        return <Badge color="secondary" className="fs-5 px-2 py-1 rounded-pill">{val}</Badge>
                }
            default:
                return renderValue(val)
        }
    }

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="p-0">
            {showAllDetailsButton && (
                <div className="d-flex justify-content-end align-items-center mb-3">
                    <Button color="primary" className="d-flex align-items-center gap-2 fs-6" onClick={() => navigate(`/pigs/pig_details/${pigId}`)}>
                        <span>Ver todos los detalles</span>
                        <FiExternalLink size={16} />
                    </Button>
                </div>
            )}

            {pigDetails && (
                <div className="bg-light rounded-3 p-3">
                    <Row className="gy-3">
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Código</label>
                                <p className="mb-0 fs-5 fw-semibold">{renderValue(pigDetails.code)}</p>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Fecha de nacimiento</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.birthdate, "date")}</p>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Raza</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.breed)}</p>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Sexo</label>
                                <div>{renderBadge("sex", pigDetails.sex)}</div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Estado</label>
                                <div>{renderBadge("status", pigDetails.status)}</div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Etapa</label>
                                <div>{renderBadge("stage", pigDetails.currentStage)}</div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Peso (kg)</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.weight)}</p>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Origen</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.origin)}</p>
                            </div>
                        </Col>

                        {pigDetails.origin === "other" && (
                            <Col md={6}>
                                <div className="mb-2">
                                    <label className="form-label text-muted mb-1 fs-5">Detalle origen</label>
                                    <p className="mb-0 fs-5">{renderValue(pigDetails.originDetail)}</p>
                                </div>
                            </Col>
                        )}
                        {pigDetails.origin !== "born" && (
                            <Col md={6}>
                                <div className="mb-2">
                                    <label className="form-label text-muted mb-1 fs-5">Fecha de llegada</label>
                                    <p className="mb-0 fs-5">{renderValue(pigDetails.arrivalDate, "date")}</p>
                                </div>
                            </Col>
                        )}
                        {(pigDetails.origin === "purchased" || pigDetails.origin === "donated") && (
                            <Col md={6}>
                                <div className="mb-2">
                                    <label className="form-label text-muted mb-1 fs-5">Granja de origen</label>
                                    <p className="mb-0 fs-5">{renderValue(pigDetails.sourceFarm)}</p>
                                </div>
                            </Col>
                        )}

                        <Col md={12}>
                            <div className="mb-2">
                                <label className="form-label text-muted mb-1 fs-5">Características físicas</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.observations)}</p>
                            </div>
                        </Col>

                        {pigDetails.discard?.isDiscarded && (
                            <>
                                <Col md={12}>
                                    <hr className="my-2" />
                                    <h5 className="mb-2 text-danger">Información de Descarte</h5>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-2">
                                        <label className="form-label text-muted mb-1 fs-5">Motivo del descarte</label>
                                        <p className="mb-0 fs-5">{renderValue(pigDetails.discard?.reason)}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-2">
                                        <label className="form-label text-muted mb-1 fs-5">Destino del animal</label>
                                        <p className="mb-0 fs-5">{renderValue(pigDetails.discard?.destination)}</p>
                                    </div>
                                </Col>
                            </>
                        )}
                    </Row>
                </div>
            )}

            {alertConfig.visible && (
                <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
            )}
        </div>
    )
}

export default PigDetailsModal