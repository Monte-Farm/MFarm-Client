import React, { useEffect, useState } from "react";
import { Badge, Button, Container } from "reactstrap";
import { createColumnHelper } from "@tanstack/react-table";
import BreadCrumb from "Components/Common/BreadCrumb";
import TableContainer from "Components/Common/TableContainer";
import { APIClient } from "helpers/api_helper";
import CustomTable from "Components/Common/CustomTable";


// ri-pencil-fill
// ri-delete-bin-fill
// ri-eye-fill

const ViewInventory = () => {
  document.title = "Inventory | Warehouse";
  const apiUrl = process.env.REACT_APP_API_URL;
  const axiosHelper = new APIClient();

  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const columnsTable = [
    { header: "Código", accessor: "id" },
    { header: "Producto", accessor: "productName" },
    { header: "Existencias", accessor: "quantity" },
    { header: "Descripción", accessor: "description" },
    {
      header: "Estado",
      accessor: "status",
      render: (value: string) => (
        <Badge color={value === "Active" ? "success" : "danger"}>
          {value === "Active" ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      accessor: "action",
      render: (value: any, row: any) => (
        <div className="d-flex gap-2">
          <a href="#" className="" title="Ver">
            <i className="ri-eye-fill align-middle"></i>
          </a>

          <a href="#" className="" title="Editar">
            <i className="ri-pencil-fill align-middle"></i>
          </a>

          <a href="#" className="link-danger" title="Eliminar">
            <i className="ri-delete-bin-fill align-middle"></i>
          </a>
        </div>
      ),
    },
  ];


  const fetchProductsData = async () => {
    await axiosHelper.get(`${apiUrl}/product`)
      .then(function (response) {
        setProductsData(response.data.data);
      })
      .catch(function (error) {
        setError(true);
        console.error(`Failed to fetch products: ${error}`)
      })
      .finally(function () {
        setLoading(false)
      })
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Inventory" pageTitle="Warehouse" />

        <div className="bg-white rounded shadow">

          <div className="d-flex justify-content-between">
            <h4 className="m-4">Productos</h4>
            <Button className="m-3 h-50 " color="success">
              <i className="ri-add-line pe-2" />
              Añadir producto
            </Button>
          </div>

          <div className="border w-100 h-0"/>


          <CustomTable className="mt-3" columns={columnsTable} data={productsData} />
        </div>


      </Container>
    </div>
  );
};

export default ViewInventory;
