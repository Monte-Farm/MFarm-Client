import BreadCrumb from "Components/Common/BreadCrumb"
import CustomTable from "Components/Common/CustomTable"
import { APIClient } from "helpers/api_helper"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Card, CardBody, CardHeader, Container } from "reactstrap"


const columns = [
    { header: 'Identificador', accessor: 'id' },
    { header: 'Fecha de entrada', accessor: 'date' },
    { header: 'Proveedor', accessor: 'supplier' },
    { header: 'Tipo de entrada', accessor: 'incomeType' },
    { header: 'Precio Total', accessor: 'totalPrice' },
]

const ViewIncomes = () => {
    document.title = 'View Incomes | Warehouse'
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate()

    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [incomes, setIncomes] = useState([])

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const handleFetchIncomes = async () => {
        await axiosHelper.get(`${apiUrl}/incomes`)
            .then((response) => {
                const incomesData = response.data.data;
                setIncomes(incomesData)
            })
            .catch((error) => {
                handleError(error, 'Ha ocurrido un error al obtener los datos, intentelo más tarde');
            })
    }

    const handleRowClick = (row: any) => {
        const id_income = row.id
        history(`/warehouse/incomes/income_details/${id_income}`);
    }

    useEffect(() => {
        handleFetchIncomes();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Incomes"} pageTitle={"View Incomes"} />

                <Card>
                    <CardHeader>
                        <h4>Entradas</h4>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={columns} data={incomes} rowClickable={true} onRowClick={handleRowClick}></CustomTable>
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