import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { APIClient } from "helpers/api_helper";
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Badge, Card, CardBody, CardHeader, Container } from "reactstrap";

const supplierColumn = [
    {header: 'Código', accessor: 'id'},
    {header: 'Proveedor', accessor: 'name'},
    {header: 'Tipo de proveedor', accessor: 'supplier_type'},
    {header: 'Telefono', accessor: 'phone_number'},
    {header: 'Dirección', accessor: 'address'},
    {
        header: "Estado",
        accessor: "status",
        render: (value: boolean) => (
          <Badge color={value === true ? "success" : "danger"}>
            {value === true ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
]

const Suppliers = () => {
    document.title = 'View Suppliers | Warehouse'
    const apiUrl = process.env.REACT_APP_API_URL;
    const axiosHelper = new APIClient();
    const history = useNavigate();


    const [suppliersData, setSuppliersData] = useState([]);
    const [isError, setIsError] = useState<boolean>(false);

    const fetchSuppliersData = async () => {
        await axiosHelper.get(`${apiUrl}/supplier`)
            .then((response) => {
                setSuppliersData(response.data.data);
                setIsError(false);
            })
            .catch((error) => {
                setIsError(true);
                setTimeout(() => setIsError(false), 5000);
                console.error(`Error fetching data: ${error}`)
            })
    }


    const handleRowClick = (row: any) => {
        const id_supplier = row.id
        history(`/warehouse/suppliers/supplier_details/${id_supplier}`);
    }


    useEffect(() => {
        fetchSuppliersData();
    }, [])

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb pageTitle="Suppliers" title="View Suppliers" ></BreadCrumb>

                <Card className="rounded">
                    <CardHeader>
                        <h4>Proveedores</h4>
                    </CardHeader>
                    <CardBody>
                        <CustomTable columns={supplierColumn} data={suppliersData} showSearchAndFilter={true} rowClickable={true} onRowClick={handleRowClick}/>
                    </CardBody>
                </Card>

            </Container>
        </div>
    )
}


export default Suppliers;