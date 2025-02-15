import { ConfigContext } from "App"
import { OutcomeData, SubwarehouseData } from "common/data_interfaces"
import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import ObjectDetails from "Components/Common/ObjectDetails"
import ObjectDetailsHorizontal from "Components/Common/ObjectDetailsHorizontal"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'


const outcomeAttributes = [
    { key: 'id', label: 'Identificador' },
    { key: 'date', label: 'Fecha' },
    { key: 'warehouseDestiny', label: 'Almacén de destino' },
    { key: 'outcomeType', label: 'Motivo de salida' },
    { key: 'description', label: 'Descripción' },
]

const OutcomeDetails = () => {
    document.title = 'Detalles de salida | Salidas'
    const history = useNavigate();
    const { id_outcome } = useParams();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' })
    const [outcome, setOutcome] = useState<OutcomeData>();
    const [warehouseDestiny, setWarehouseDestiny] = useState<SubwarehouseData>();
    const [productsOutcome, setProductsOutcome] = useState([]);
    const [outcomeDisplay, setOutcomeDisplay] = useState({});
    const [loading, setLoading] = useState<boolean>(true)

    const productColumns = [
        { header: 'Código', accessor: 'id' },
        { header: 'Producto', accessor: 'name' },
        { header: 'Cantidad', accessor: 'quantity' },
        { header: 'Unidad de Medida', accessor: 'unit_measurement' },
        { header: 'Precio Promedio (Unidad)', accessor: 'price' },
        { header: 'Categoría', accessor: 'category' },
    ]


    const handleError = (error: any, message: string) => {
        console.error(message, error)
        setAlertConfig({ visible: true, color: 'danger', message: message })
        setTimeout(() => {
            setAlertConfig({ ...alertConfig, visible: false })
        }, 5000);
    }

    const handleFetchOutcome = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_outcome_id/${id_outcome}`);
            setOutcome(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde');
        }
    };


    const handleFetchWarehouseDestiny = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/find_id/${outcome?.warehouseDestiny}`);
            setWarehouseDestiny(response.data.data);
        } catch (error) {
            console.log(error, 'Ha ocurrido un error al obtener los datos del almacén de destino, intentelo más tarde');
        }
    };


    const handleFetchOutcomeProducts = async () => {
        if (!configContext) return;

        try {
            const response = await configContext.axiosHelper.create(`${configContext.apiUrl}/product/find_products_by_array`, outcome?.products);
            setProductsOutcome(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos de los productos, intentelo más tarde');
        }
    };



    const handleBack = () => {
        if (window.history.length > 1) {
            history(-1)
        } else {
            history('/warehouse/outcomes/view_outcomes')
        }
    }

    useEffect(() => {
        handleFetchOutcome();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (outcome) {
                await Promise.all([
                    handleFetchWarehouseDestiny(),
                    handleFetchOutcomeProducts()
                ])
                setOutcomeDisplay({ ...outcome, warehouseDestiny: warehouseDestiny?.name })
                setLoading(false)
            }
        }

        fetchData();

    }, [outcome])


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
                <BreadCrumb title={"Detalles de Salida"} pageTitle={"Salidas"} />

                <div className="d-flex mt-1">
                    <Button className="me-auto farm-secondary-button" onClick={handleBack}>
                        <i className="ri-arrow-left-line me-3" />
                        Regresar
                    </Button>
                </div>

                <div className="d-flex-column gap-3 mt-4">
                    <Card className="pt-2" style={{backgroundColor: '#A3C293'}}>
                        <CardBody>
                            <ObjectDetailsHorizontal attributes={outcomeAttributes} object={outcomeDisplay || {}} />
                        </CardBody>
                    </Card>

                    <Card className="w-100" style={{height: '55vh'}}>
                        <CardHeader>
                            <h4>Productos</h4>
                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={productColumns} data={productsOutcome} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>

                {alertConfig.visible && (
                    <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                        {alertConfig.message}
                    </Alert>
                )}
            </Container>
        </div>
    )
}

export default OutcomeDetails