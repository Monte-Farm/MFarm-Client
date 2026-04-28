import { ConfigContext } from "App";
import { Attribute, FarmData, UserData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import loadingGif from '../../assets/images/loading-gif.gif'
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import farmDefaultImage from '../../assets/images/establo-cerdo.jpg'
import managerDefaultImage from '../../assets/images/default-profile-mage.jpg'
import { useTranslation } from "react-i18next";

const FarmDetails = () => {
    const { t } = useTranslation();
    const { farm_id } = useParams();
    const configContext = useContext(ConfigContext);
    const [farmData, setFarmData] = useState<FarmData | null>(null);
    const [managerData, setManagerData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" })

    const farmAttributes: Attribute[] = [
        { key: 'code', label: t('farms.details.attr.code'), type: 'text' },
        { key: 'name', label: t('farms.details.attr.name'), type: 'text' },
        { key: 'location', label: t('farms.details.attr.location'), type: 'text' },
        { key: 'status', label: t('farms.details.attr.status'), type: 'status' },
    ];

    const managerAttributes: Attribute[] = [
        { key: 'username', label: t('farms.details.attr.username'), type: 'text' },
        { key: 'name', label: t('farms.details.attr.name'), type: 'text' },
        { key: 'lastname', label: t('farms.details.attr.lastname'), type: 'text' },
        { key: 'email', label: t('farms.details.attr.email'), type: 'text' },
        { key: 'status', label: t('farms.details.attr.status'), type: 'status' },
    ];

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: 'danger', message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const fetchFarmData = async () => {
        if (!configContext || !farm_id) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/find_by_id/${farm_id}`)
            const farmResponse = response.data.data
            setFarmData(farmResponse)
            setManagerData(farmResponse.manager)
        } catch (error) {
            handleError(error, t('farms.error.fetchDetails'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFarmData();
    }, [])


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={loadingGif} alt="Cargando..." style={{ width: '200px' }} />
            </div>
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('farms.details.breadcrumb')} pageTitle={t('farms.breadcrumbParent')} />

                <Row>
                    <Col lg={3}>
                        <Card>
                            <CardHeader>
                                <h4>{t('farms.details.generalInfo')}</h4>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={farmAttributes} object={farmData || {}} showImage={true} imageSrc={farmData?.image || farmDefaultImage} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={3}>
                        <Card>
                            <CardHeader>
                                <h4>{t('farms.details.managerInfo')}</h4>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={managerAttributes} object={managerData || {}} showImage={true} imageSrc={managerData?.profile_image || managerDefaultImage} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={6}>
                    </Col>
                </Row>


            </Container>
        </div>
    )
}

export default FarmDetails;
