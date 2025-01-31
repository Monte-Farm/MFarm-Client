import { useEffect, useState } from "react";
import { Badge, Button, Container, Modal, ModalHeader, ModalBody, Alert, ModalFooter, Card, CardHeader, CardBody } from "reactstrap";
import BreadCrumb from "Components/Common/BreadCrumb";
import { APIClient } from "helpers/api_helper";
import CustomTable from "Components/Common/CustomTable";
import ProductForm from "Components/Common/ProductForm";
import { useNavigate } from "react-router-dom";
import { size } from "lodash";
import { ProductData } from "common/data_interfaces";

const ViewInventory = () => {
  document.title = "Inventario | Almacén General";
  const warehouseId = 'AG001'
  const apiUrl = process.env.REACT_APP_API_URL;
  const axiosHelper = new APIClient();
  const history = useNavigate();

  const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
  const [modals, setModals] = useState({ update: false, delete: false });
  const [productsData, setProductsData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | undefined>(undefined);


  const columnsTable = [
    {
      header: "Código",
      accessor: "id",
      isFilterable: true
    },
    {
      header: "Producto",
      accessor: "name",
      isFilterable: true
    },
    {
      header: 'Existencias',
      accessor: 'quantity',
      isFilterable: true
    },
    {
      header: 'Unidad de Medida',
      accessor: 'unit_measurement',
      isFilterable: true,
      options: [
        { label: "Galones", value: 'Galones' },
        { label: "Litros", value: 'Litros' },
        { label: "Frascos", value: 'Frascos' },
        { label: "Piezas", value: 'Piezas' },
        { label: "Kilos", value: 'Kilos' },
        { label: "Dosis", value: 'Dosis' },
        { label: "Paquetes", value: 'Paquetes' },
        { label: "Cajas", value: 'Cajas' },
        { label: "Metros", value: 'Metros' },
      ]
    },
    {
      header: 'Categoría',
      accessor: 'category',
      isFilterable: true,
      options: [
        { label: 'Alimentos', value: 'Alimentos' },
        { label: 'Medicamentos', value: 'Medicamentos' },
        { label: 'Suministros', value: 'Suministros' },
        { label: 'Equipamiento', value: 'Equipamientos' }
      ]
    },
    {
      header: "Descripción",
      accessor: "description",
      isFilterable: true
    },
    {
      header: "Acciones",
      accessor: "action",
      render: (value: any, row: any) => (
        <div className="d-flex gap-1">
          <Button className="btn-secondary btn-icon" onClick={() => handleProductDetails(row)}>
            <i className="ri-eye-fill align-middle"></i>
          </Button>
        </div>
      ),
    },
  ];


  const handleError = (error: any, message: string) => {
    console.error(message, error);
    setAlertConfig({ visible: true, color: "danger", message });
    setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
  };

  const showAlert = (color: string, message: string) => {
    setAlertConfig({ visible: true, color: color, message: message })
    setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
  }

  const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
    setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
  };

  const fetchProductsData = async () => {
    await axiosHelper.get(`${apiUrl}/warehouse/get_inventory/${warehouseId}`)
      .then(function (response) {
        setProductsData(response.data.data);
      })
      .catch(function (error) {
        handleError(error, 'El servicio no esta disponible, intentelo más tarde')
      })
  };


  useEffect(() => {
    fetchProductsData();
  }, []);


  const handleAddProduct = () => {
    history('/warehouse/incomes/create_income');
  };


  const handleModalUpdateProduct = (product: ProductData) => {
    setSelectedProduct(product);
    toggleModal('update')
  };


  const handleSelectDeleteProduct = (product: ProductData) => {
    setSelectedProduct(product)
    toggleModal('delete')
  }

  const handleUpdateProduct = async (data: ProductData) => {
    await axiosHelper.put(`${apiUrl}/product/update_product/${data.id}`, data)
      .then((response) => {
        fetchProductsData();
        toggleModal('update')
        setSelectedProduct(undefined);
        showAlert('success', 'Producto actualizado con éxito')
      })
      .catch((error) => {
        handleError(error, 'Se ha producido un error al actualizar el producto, intentelo más tarde')
      })
  };


  const handleDeleteProduct = async (id: string) => {
    await axiosHelper.delete(`${apiUrl}/product/delete_product/${id}`)
      .then((response) => {
        fetchProductsData();
        setSelectedProduct(undefined);
        toggleModal('delete', false)
        showAlert('success', 'Producto desactivado con éxito')
      })
      .catch((error) => {
        handleError(error, 'Se ha producido un errro al desactivar el producto, intentelo más tarde')
      })
  }


  const handleProductDetails = (product: ProductData) => {
    history(`/warehouse/inventory/product_details?warehouse=${warehouseId}&product=${product.id}`)
  }



  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Inventario" pageTitle="Almacén General" />

        <Card className="rounded" style={{ height: '75vh' }}>
          <CardHeader>
            <div className="d-flex justify-content-between">
              <h4 className="m-2">Productos</h4>
              <Button className="h-50" color="success" onClick={handleAddProduct}>
                <i className="ri-add-line pe-2" />
                Ingresar Productos
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <CustomTable columns={columnsTable} data={productsData} showSearchAndFilter={true} rowClickable={false}/>
          </CardBody>
        </Card>


        <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
          <ModalHeader toggle={() => toggleModal('delete')}>Actualizar Producto</ModalHeader>
          <ModalBody>
            <ProductForm initialData={selectedProduct} onSubmit={handleUpdateProduct} onCancel={() => toggleModal('update', false)} isCodeDisabled={true} />
          </ModalBody>
        </Modal>


        <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
          <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
          <ModalBody>
            {`¿Estás seguro de que deseas eliminar el producto "${selectedProduct?.name}"?`}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
            <Button color="success" onClick={() => {
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

      {alertConfig.visible && (
        <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
          {alertConfig.message}
        </Alert>
      )}
    </div>

  );
};

export default ViewInventory;
