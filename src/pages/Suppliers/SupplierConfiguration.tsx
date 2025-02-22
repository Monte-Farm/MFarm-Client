import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/BreadCrumb"
import ConfigurationsList from "Components/Common/ConfigurationList"
import { useContext, useState, useEffect } from "react"
import { Container, Spinner } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'

const SupplierConfiguration = () => {
    const configContext = useContext(ConfigContext)
    const [items, setItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (configContext?.configurationData?.supplierCategories) {
            setItems(configContext.configurationData.supplierCategories);
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
                <BreadCrumb title={"Configuración de proveedores"} pageTitle={"Proveedores"} />
                <div style={{ height: '75vh' }}>
                    <ConfigurationsList items={items} groupName="supplierCategories" cardTitle="Categorias de Proveedores"/>
                </div>
            </Container>
        </div>
    )
}

export default SupplierConfiguration
