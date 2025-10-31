import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import CustomTable from "Components/Common/Tables/CustomTable";

const SubwarehouseIncomes = () => {
    document.title = "Entradas de Subalmacén | Subalmacén"
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [subwarehouseIncomes, setSubwarehouseIncomes] = useState([])
    const [loading, setLoading] = useState<boolean>(true)

    const incomesColumns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de entrada', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Origen', accessor: 'originName', isFilterable: true, type: 'text' },
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
        document.body.style.overflow = 'hidden';
        handleFetchWarehouseIncomes();

        return () => {
            document.body.style.overflow = '';
        };
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


                <div className="">
                    <Card className="rounded" style={{ height: '75vh' }}>
                        <CardHeader>
                            <h4>Entradas</h4>
                        </CardHeader>
                        <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
                            <CustomTable columns={incomesColumns} data={subwarehouseIncomes} rowsPerPage={10} showPagination={false} />
                        </CardBody>
                    </Card>
                </div>

            </Container>
        </div>
    )

}

export default SubwarehouseIncomes;