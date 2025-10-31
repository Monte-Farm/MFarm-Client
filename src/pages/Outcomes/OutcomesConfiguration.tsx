import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import ConfigurationsList from "Components/Common/ConfigurationList"
import { useContext, useState, useEffect } from "react"
import { Container, Spinner } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'

const OutcomesConfiguration = () => {
    const configContext = useContext(ConfigContext)
    const [items, setItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (configContext?.configurationData?.outcomeTypes) {
            setItems(configContext.configurationData.outcomeTypes);
            setLoading(false);
        }
    }, [configContext]);


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Configuración de salidas"} pageTitle={"Salidas"} />
                <div style={{ height: '75vh' }}>
                    <ConfigurationsList items={items} groupName="outcomeTypes" cardTitle="Tipos de Salida" isObjectArray={false}/>
                </div>
            </Container>
        </div>
    )
}

export default OutcomesConfiguration
