import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/BreadCrumb"
import ConfigurationsList from "Components/Common/ConfigurationList"
import { useContext, useState, useEffect } from "react"
import { Container, Spinner } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'

const ProductConfiguration = () => {
    const configContext = useContext(ConfigContext)
    const [categoriesItems, setCategoriesItems] = useState<string[]>([]);
    const [unitsItems, setUnitsItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (configContext?.configurationData?.supplierCategories) {
            setCategoriesItems(configContext.configurationData.productCategories);
            setUnitsItems(configContext.configurationData.unitMeasurements);
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
                <BreadCrumb title={"Configuración de productos"} pageTitle={"Productos"} />
                <div className="d-flex gap-2" style={{ height: '75vh' }}>
                    <div className="w-50 h-100">
                        <ConfigurationsList items={categoriesItems} groupName="productCategories" cardTitle="Categorias de productos"/>
                    </div>
                    <div className="w-50">
                        <ConfigurationsList items={unitsItems} groupName="unitMeasurements" cardTitle="Unidades de Medida"/>
                    </div>
                </div>
            </Container>    
        </div>
    )
}

export default ProductConfiguration
