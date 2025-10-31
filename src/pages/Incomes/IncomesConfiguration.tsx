import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/Shared/BreadCrumb"
import ConfigurationsList from "Components/Common/ConfigurationList"
import { useContext, useState, useEffect } from "react"
import { Container, Spinner } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'

const IncomesConfiguration = () => {
    const configContext = useContext(ConfigContext)
    const [incomeTypes, setIncomeTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true); // Estado de carga

    useEffect(() => {
        if (configContext?.configurationData?.incomeTypes) {
            setIncomeTypes(configContext.configurationData.incomeTypes);
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
                <BreadCrumb title={"Configuración de entradas"} pageTitle={"Entrada"} />
                <div style={{ height: '75vh' }}>
                    <ConfigurationsList items={incomeTypes} groupName="incomeTypes" cardTitle="Tipos de Entrada" isObjectArray={false}/>
                </div>
            </Container>
        </div>
    )
}

export default IncomesConfiguration
