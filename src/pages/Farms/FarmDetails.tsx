import { ConfigContext } from "App";
import { Attribute, FarmData, UserData } from "common/data_interfaces";
import BreadCrumb from "Components/Common/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, CardHeader, Col, Container, Label, Row } from "reactstrap";
import loadingGif from '../../assets/images/loading-gif.gif'
import { socialLogin } from "slices/thunks";
import ObjectDetails from "Components/Common/ObjectDetails";
import farmDefaultImage from '../../assets/images/establo-cerdo.jpg'
import managerDefaultImage from '../../assets/images/default-profile-mage.jpg'
import { Column } from "common/data/data_types";

const farmAttributes: Attribute[] = [
    { key: 'code', label: 'Codigo', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'location', label: 'Ubicación', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' },
]

const managerAttributes: Attribute[] = [
    { key: 'username', label: 'Usuario', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'lastname', label: 'Apellido', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'status', label: 'Estado', type: 'status' },
]

const FarmDetails = () => {
    const { farm_id } = useParams();
    const configContext = useContext(ConfigContext);
    const [farmData, setFarmData] = useState<FarmData | null>(null);
    const [managerData, setManagerData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" })

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: 'danger', message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
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
            handleError(error, 'Ha ocurrido un error al recuperar los datos')
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
                <BreadCrumb title={"Detalles de granja"} pageTitle={"Granjas"} />

                <Row>
                    <Col lg={3}>
                        <Card>
                            <CardHeader>
                                <h4>Información general</h4>
                            </CardHeader>
                            <CardBody>
                                <ObjectDetails attributes={farmAttributes} object={farmData || {}} showImage={true} imageSrc={farmData?.image || farmDefaultImage} />
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={3}>
                        <Card>
                            <CardHeader>
                                <h4>Información del gerente</h4>
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