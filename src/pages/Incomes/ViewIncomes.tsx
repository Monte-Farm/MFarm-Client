import { ConfigContext } from "App"
import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Button, Card, CardBody, CardHeader, Container } from "reactstrap"
import LoadingGif from '../../assets/images/loading-gif.gif'


const ViewIncomes = () => {
    document.title = 'Ver Entradas | Almacén'
    const history = useNavigate()
    const idWarehouse = 'AG001'
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incomes, setIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(false)

    const columns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Proveedor', accessor: 'originName', isFilterable: true },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true },
        { header: 'Tipo de entrada', accessor: 'incomeType', isFilterable: true, },
        { header: 'Precio Total', accessor: 'totalPrice' },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleProductDetails(row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ]

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleFetchIncomes = async () => {
        setLoading(true)
        try {
            if (!configContext) return;


            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${idWarehouse}`);
            const incomesData = response.data.data;
            setIncomes(incomesData);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde');
        } finally {
            setLoading(false)
        }
    };


    const handleProductDetails = (row: any) => {
        const id_income = row.id
        history(`/warehouse/incomes/income_details/${id_income}`);
    }

    const handleAddIncome = () => {
        history('/warehouse/incomes/create_income')
    }

    useEffect(() => {
        handleFetchIncomes();
    }, [])


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
                <BreadCrumb title={"Ver Entradas"} pageTitle={"Entradas"} />

                <Card style={{ height: '90vh' }}>
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Entradas</h4>
                            <Button className="farm-primary-button" onClick={handleAddIncome}>
                                <i className="ri-add-line me-3" />
                                Nueva Entrada
                            </Button>
                        </div>

                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={incomes}></CustomTable>
                    </CardBody>
                </Card>


            </Container>

            {alertConfig.visible && (
                <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
                    {alertConfig.message}
                </Alert>
            )}
        </div>
    )
}

export default ViewIncomes;