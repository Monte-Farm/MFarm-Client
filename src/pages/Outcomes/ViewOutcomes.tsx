import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, Container } from "reactstrap";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";


const ViewOutcomes = () => {
    document.title = 'Ver Salidas | Salidas'
    const history = useNavigate();
    const configContext = useContext(ConfigContext);
    const warehouseId = 'AG001'
    const [outcomes, setOutcomes] = useState([])
    const [loading, setLoading] = useState<boolean>(false)

    const columns: Column<any>[] = [
        { header: 'Identificador', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Fecha de Salida', accessor: 'date', isFilterable: true, type: 'text' },
        { header: 'Tipo de Salida', accessor: 'outcomeType', isFilterable: true, type: 'text' },
        { header: 'Subalmacén de destino', accessor: 'warehouseDestiny', isFilterable: true, type: 'text' },
        {
            header: 'Acciones', accessor: 'actions',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    <Button className="btn-icon farm-primary-button" onClick={() => handleClicOutcomeDetails(row)}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div>
            )
        }
    ]

    const handleFetchOutcomes = async () => {
        setLoading(true)

        try {
            if (!configContext) return;

            const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/outcomes/find_warehouse_outcomes/${warehouseId}`);
            setOutcomes(response.data.data);
        } catch (error) {
            history('/auth-500');
        } finally {
            setLoading(false)
        }
    };


    const handleClicOutcomeDetails = (row: any) => {
        history(`/warehouse/outcomes/outcome_details/${row.id}`)
    }

    const handleClicAddOutcome = () => {
        history('/warehouse/outcomes/create_outcome')
    }

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        handleFetchOutcomes();

        return () => {
            document.body.style.overflow = '';
        };
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
                <BreadCrumb title={"Ver Salidas"} pageTitle={"Salidas"} />

                <Card style={{ height: '75vh' }}>
                    <CardHeader>
                        <div className="d-flex ">
                            <h4>Salidas</h4>

                            <Button className="ms-auto farm-primary-button" onClick={handleClicAddOutcome}>
                                <i className="ri-add-line me-2" />
                                Nueva Salida
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(75vh - 100px)', overflowY: 'auto' }}>
                        <CustomTable columns={columns} data={outcomes} showSearchAndFilter={true} showPagination={false} />
                    </CardBody>
                </Card>
            </Container>
        </div>
    )
}

export default ViewOutcomes;