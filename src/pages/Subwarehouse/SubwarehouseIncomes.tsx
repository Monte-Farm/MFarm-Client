import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'

const SubwarehouseIncomes = () => {
    document.title = "Entradas de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const incomesColumns = [
        { header: 'Identificador', accessor: 'id', isFilterable: true },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true },
        { header: 'Origen', accessor: 'originName', isFilterable: true },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicIncomeDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleError = (error: any, message: string) => {
        console.error(message, error);
        setAlertConfig({ visible: true, color: "danger", message });
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    };

    const showAlert = (color: string, message: string) => {
        setAlertConfig({ visible: true, color: color, message: message })
        setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
    }

    const handleFetchWarehouseIncomes = async () => {
        if (!configContext || !configContext.userLogged) return;

        try {
            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/incomes/find_warehouse_incomes/${configContext.userLogged.assigment}`);
            setSubwarehouseIncomes(response.data.data);
        } catch (error) {
            handleError(error, 'Ha ocurrido un error al obtener las entradas, intentelo más tarde');
        } finally {
            setLoading(false);
        }
    };

    const handleClicIncomeDetails = (row: any) => {
        history(`/warehouse/incomes/income_details/${row.id}`)
    }

    useEffect(() => {
        if (!configContext || !configContext.userLogged) return;

        handleFetchWarehouseIncomes();
    }, [configContext])


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
                <BreadCrumb title={"Entradas"} pageTitle={"Subalmacén"} />


                <div className=" mt-4">
                    <Card className="h-100">
                        <CardHeader>
                            <h4>Entradas</h4>
                        </CardHeader>
                        <CardBody>
                            <CustomTable columns={incomesColumns} data={subwarehouseIncomes} rowsPerPage={10} />
                        </CardBody>
                    </Card>
                </div>

            </Container>
        </div>
    )

}

export default SubwarehouseIncomes;