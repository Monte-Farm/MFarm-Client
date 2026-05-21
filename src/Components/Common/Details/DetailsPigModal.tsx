import { logger } from 'utils/logger';
import { ConfigContext } from "App"
import { PigData } from "common/data_interfaces"
import { useContext, useEffect, useState } from "react"
import { FiExternalLink } from "react-icons/fi"
import { Button, Row, Col, Badge } from "reactstrap"
import { useNavigate } from "react-router-dom"
import LoadingAnimation from "../Shared/LoadingAnimation"
import AlertMessage from "../Shared/AlertMesagge"
import { useTranslation } from "react-i18next"

interface PigDetailsModalProps {
    pigId: string
    showAllDetailsButton?: boolean
}

const stageBadgeColors: Record<string, string> = {
    piglet: "info", weaning: "secondary", fattening: "dark", lactancia: "success", breeder: "purple",
};

const PigDetailsModal: React.FC<PigDetailsModalProps> = ({ pigId, showAllDetailsButton }) => {
    const configContext = useContext(ConfigContext)
    const { t } = useTranslation()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" })
    const [loading, setLoading] = useState<boolean>(false)
    const [pigDetails, setPigDetails] = useState<PigData | null>(null)
    const navigate = useNavigate();

    const fetchPigDetails = async () => {
        if (!configContext) return
        try {
            setLoading(true)
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/pig/find_by_id/${pigId}`)
            setPigDetails(response.data.data)
        } catch (error) {
            logger.error(error)
            setAlertConfig({ visible: true, color: "danger", message: t('common.status.noData') })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchPigDetails() }, [])

    const renderValue = (val: any, type?: string) => {
        if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
            return <span className="text-muted">-</span>
        }
        if (type === "date") {
            return new Date(val).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
        }
        return val
    }

    if (loading) return <LoadingAnimation />

    return (
        <div className="p-0">
            {showAllDetailsButton && (
                <div className="d-flex justify-content-end align-items-center mb-3">
                    <Button color="primary" className="d-flex align-items-center gap-2 fs-6" onClick={() => navigate(`/pigs/pig_details/${pigId}`)}>
                        <span>{t('pigs.action.downloadInfo')}</span>
                        <FiExternalLink size={16} />
                    </Button>
                </div>
            )}

            {pigDetails && (
                <div className="bg-light rounded-3 p-3">
                    <Row className="gy-3">
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.code')}</label>
                            <p className="mb-0 fs-5 fw-semibold">{renderValue(pigDetails.code)}</p>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.birthDate')}</label>
                            <p className="mb-0 fs-5">{renderValue(pigDetails.birthdate, "date")}</p>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.breed')}</label>
                            <p className="mb-0 fs-5">{renderValue(pigDetails.breed)}</p>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.sex')}</label>
                            <div>
                                <Badge color={pigDetails.sex === 'male' ? 'primary' : 'pink'} className="fs-5 px-2 py-1 rounded-pill" style={pigDetails.sex === 'female' ? { backgroundColor: '#e83e8c' } : {}}>
                                    {t(`pigs.sex.${pigDetails.sex}Short`, { defaultValue: pigDetails.sex })}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.status')}</label>
                            <div>
                                <Badge color={pigDetails.status === 'alive' ? 'success' : pigDetails.status === 'dead' ? 'danger' : 'secondary'} className="fs-5 px-2 py-1 rounded-pill">
                                    {t(`pigs.status.${pigDetails.status}`, { defaultValue: pigDetails.status })}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.stage')}</label>
                            <div>
                                <Badge color={stageBadgeColors[pigDetails.currentStage] || 'secondary'} className="fs-5 px-2 py-1 rounded-pill" style={pigDetails.currentStage === 'breeder' ? { backgroundColor: '#6f42c1' } : {}}>
                                    {t(`pigs.stage.${pigDetails.currentStage}`, { defaultValue: pigDetails.currentStage })}
                                </Badge>
                            </div>
                        </Col>
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.currentWeight')} (kg)</label>
                            <p className="mb-0 fs-5">{renderValue(pigDetails.weight)}</p>
                        </Col>
                        {pigDetails.currentStage === 'breeder' && (
                            <Col md={6}>
                                <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.earTag')}</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.earTag)}</p>
                            </Col>
                        )}
                        <Col md={6}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.origin')}</label>
                            <p className="mb-0 fs-5">{t(`pigs.origin.${pigDetails.origin}`, { defaultValue: pigDetails.origin })}</p>
                        </Col>

                        {pigDetails.origin === "other" && (
                            <Col md={6}>
                                <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.originDetail')}</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.originDetail)}</p>
                            </Col>
                        )}
                        {pigDetails.origin !== "born" && (
                            <Col md={6}>
                                <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.arrivalDate')}</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.arrivalDate, "date")}</p>
                            </Col>
                        )}
                        {(pigDetails.origin === "purchased" || pigDetails.origin === "donated") && (
                            <Col md={6}>
                                <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.originFarm')}</label>
                                <p className="mb-0 fs-5">{renderValue(pigDetails.sourceFarm)}</p>
                            </Col>
                        )}
                        <Col md={12}>
                            <label className="form-label text-muted mb-1 fs-5">{t('pigs.field.observations')}</label>
                            <p className="mb-0 fs-5">{renderValue(pigDetails.observations)}</p>
                        </Col>

                        {pigDetails.discard?.isDiscarded && (
                            <>
                                <Col md={12}><hr className="my-2" /><h5 className="mb-2 text-danger">{t('pigs.section.discardInfo')}</h5></Col>
                                <Col md={6}>
                                    <label className="form-label text-muted mb-1 fs-5">{t('pigs.section.discardReason')}</label>
                                    <p className="mb-0 fs-5">{renderValue(pigDetails.discard?.reason)}</p>
                                </Col>
                                <Col md={6}>
                                    <label className="form-label text-muted mb-1 fs-5">{t('pigs.page.discardedByDestination')}</label>
                                    <p className="mb-0 fs-5">{renderValue(pigDetails.discard?.destination)}</p>
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
