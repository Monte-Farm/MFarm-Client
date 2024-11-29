import { useEffect, useState } from "react";
import { Badge, Button, Container, Modal, ModalHeader, ModalBody, Alert, ModalFooter } from "reactstrap";
import BreadCrumb from "Components/Common/BreadCrumb";
import { APIClient } from "helpers/api_helper";
import CustomTable from "Components/Common/CustomTable";
import ProductForm from "Components/Common/ProductForm";
import { ProductData } from "Components/Common/ProductForm";
import { useNavigate } from "react-router-dom";

const ViewInventory = () => {
  document.title = "Inventory | Warehouse";
  const apiUrl = process.env.REACT_APP_API_URL;
  const axiosHelper = new APIClient();
  const history = useNavigate();

  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [getError, setGetError] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [postError, setPostError] = useState<boolean>(false);
  const [postSuccess, setPostSuccess] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | undefined>(undefined);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [modalDelete, setModalDelete] = useState<boolean>(false);


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
        <div className="d-flex gap-1">
          <Button className="btn-secondary btn-icon" onClick={() => handleProductDetails(row)}>
            <i className="ri-eye-fill align-middle"></i>
          </Button>

          <Button className="btn-secondary btn-icon" disabled={row.status !== "Active"} onClick={() => handleEditProduct(row)}>
            <i className="ri-pencil-fill align-middle"></i>
          </Button>

          <Button className="btn-danger btn-icon" disabled={row.status !== 'Active'} onClick={() => handleSelectDeleteProduct(row)}>
            <i className="ri-delete-bin-fill align-middle"></i>
          </Button>

        </div>
      ),
    },
  ];


  const fetchProductsData = async () => {
    await axiosHelper.get(`${apiUrl}/product`)
      .then(function (response) {
        setProductsData(response.data.data);
        setGetError(false)
      })
      .catch(function (error) {
        setGetError(true);
        setTimeout(() => setGetError(false), 5000);
        console.error(`Failed to fetch products: ${error}`);
      })
      .finally(function () {
        setLoading(false);
      });
  };


  useEffect(() => {
    fetchProductsData();
  }, []);


  const handleAddProduct = async (data: any) => {
    await axiosHelper.create(`${apiUrl}/product/create_product`, data)
      .then((response) => {
        fetchProductsData()
        setPostSuccess(true)
        setPostError(false);
        setModalOpen(false);
      })
      .catch((error) => {
        console.error(`Error adding product: ${error}`);
        setPostError(true)
        setTimeout(() => setGetError(false), 5000);
      })
      .finally(() => {
        setTimeout(() => setPostSuccess(false), 5000);
      })
  };


  const handleEditProduct = (product: ProductData) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };


  const handleSelectDeleteProduct = (product: ProductData) => {
    setSelectedProduct(product)
    setModalDelete(true);
  }

  const handleUpdateProduct = async (data: ProductData) => {
    await axiosHelper.put(`${apiUrl}/product/update_product/${data.id}`, data)
      .then((response) => {
        fetchProductsData();
        setPostSuccess(true);
        setPostError(false);
        setModalOpen(false);
        setSelectedProduct(undefined); // Limpia el producto seleccionado
      })
      .catch((error) => {
        console.error(`Error updating product: ${error}`);
        setPostError(true);
        setTimeout(() => setPostError(false), 5000);
      })
      .finally(() => {
        setTimeout(() => setPostSuccess(false), 5000);
      });
  };


  const handleDeleteProduct = async (id: string) => {
    await axiosHelper.delete(`${apiUrl}/product/delete_product/${id}`)
      .then((response) => {
        fetchProductsData();
        setDeleteSuccess(true);
        setModalDelete(false);
        setSelectedProduct(undefined);
      })
      .catch((error) => {
        setGetError(true)
      })
      .finally(() => {
        setTimeout(() => setDeleteSuccess(false), 5000)
      })
  }


  const handleProductDetails = (product: ProductData) =>{
    history(`/warehouse/product_details/${product.id}`)
  }



  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Inventory" pageTitle="Warehouse" />

        <div className="bg-white rounded shadow">
          <div className="d-flex justify-content-between">
            <h4 className="m-4">Productos</h4>
            <Button
              className="m-3 h-50"
              color="success"
              onClick={() => setModalOpen(true)} // Abre el modal
            >
              <i className="ri-add-line pe-2" />
              Añadir producto
            </Button>
          </div>

          <div className="border w-100 h-0" />

          <CustomTable className="mt-3" columns={columnsTable} data={productsData} />
        </div>

        <Modal isOpen={modalOpen} size="lg" keyboard={false} backdrop="static" toggle={() => setModalOpen(!modalOpen)} centered>
          <ModalHeader>
            {selectedProduct ? "Editar producto" : "Añadir producto"}
          </ModalHeader>
          <ModalBody>
            <ProductForm
              initialData={selectedProduct}
              onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}
              onCancel={() => {
                setModalOpen(false);
                setSelectedProduct(undefined);
              }}
            />
          </ModalBody>
          <ModalFooter>
            {postError && (
              <Alert color="danger" className="mt-4 w-100">
                Ha ocurrido un error guardando el producto. Inténtelo de nuevo más tarde.
              </Alert>
            )}
          </ModalFooter>
        </Modal>

        <Modal isOpen={modalDelete} size="md" keyboard={false} backdrop="static" centered>
          <ModalHeader>
            Confirmación de Eliminación
          </ModalHeader>
          <ModalBody>
            {`¿Estás seguro de que deseas eliminar el producto "${selectedProduct?.productName}"?`}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={() => setModalDelete(false)}>
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={() => {
                if (selectedProduct) {
                  handleDeleteProduct(selectedProduct.id);
                }
              }}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </Modal>


      </Container>

      {getError && (
        <Alert color="danger" className="position-fixed bottom-0 start-50 translate-middle-x p-3">
          El servicio no está disponible. Inténtelo de nuevo más tarde.
        </Alert>
      )}
      {postSuccess && (
        <Alert color="success" className="position-fixed bottom-0 start-50 translate-middle-x p-3">
          Producto guardado correctamente!
        </Alert>
      )}
      {deleteSuccess && (
        <Alert color="success" className="position-fixed bottom-0 start-50 translate-middle-x p-3">
          Producto eliminado correctamente!
        </Alert>
      )}
    </div>

  );
};

export default ViewInventory;
