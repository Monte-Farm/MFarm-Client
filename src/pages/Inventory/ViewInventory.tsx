import { useContext, useEffect, useState } from "react";
import { Button, Container, Alert, Card, CardHeader, CardBody, Modal, ModalBody, ModalHeader } from "reactstrap";
import BreadCrumb from "Components/Common/BreadCrumb";
import CustomTable from "Components/Common/CustomTable";
import { useNavigate } from "react-router-dom";
import { ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'
import PDFViewer from "Components/Common/PDFViewer";
import { Column } from "common/data/data_types";

const ViewInventory = () => {
  document.title = "Inventario | Almacén General";
  const warehouseId = 'AG001';
  const history = useNavigate();

  const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const configContext = useContext(ConfigContext);
  const [modals, setModals] = useState({ viewPDF: false });
  const [fileURL, setFileURL] = useState<string>('')

  const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
    setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
  };

  const columnsTable: Column<any>[] = [
    { header: "Código", accessor: "id", isFilterable: true, type: 'text'},
    { header: "Producto", accessor: "name", isFilterable: true, type: 'text' },
    { header: 'Existencias', accessor: 'quantity', isFilterable: true, type: 'number' },
    { header: 'Precio Promedio', accessor: 'averagePrice', isFilterable: true, type: 'currency' },
    { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
    { header: 'Categoría', accessor: 'category', isFilterable: true, type: "text" },
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
  ];

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    setAlertConfig({ visible: true, color: "danger", message });
    setTimeout(() => setAlertConfig({ ...alertConfig, visible: false }), 5000);
  };

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      if (!configContext) return;

      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${warehouseId}`);

      setProductsData(response.data.data);
    } catch (error) {
      handleError(error, "El servicio no está disponible, inténtelo más tarde");
    } finally {
      setLoading(false);
    }
  };


  const handlePrintInventory = async () => {
    if (!configContext) return;

    try {
      const response = await configContext.axiosHelper.get(
        `${configContext.apiUrl}/reports/generate_inventory_report/AG001`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setFileURL(url); 

      toggleModal('viewPDF');
    } catch (error) {
      handleError(error, 'Ha ocurrido un error al generar el reporte, inténtelo más tarde.');
    }
  };


  const handleAddProduct = () => {
    history('/warehouse/incomes/create_income');
  };

  const handleProductDetails = (product: ProductData) => {
    history(`/warehouse/inventory/product_details?warehouse=${warehouseId}&product=${product.id}`)
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetchProductsData();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
        <BreadCrumb title="Inventario" pageTitle="Almacén General" />

        <Card className="rounded" style={{ height: '75vh' }}>
          <CardHeader>
            <div className="d-flex gap-2">
              <h4 className="m-2">Productos</h4>
              <Button className="h-50 farm-primary-button ms-auto" onClick={(handlePrintInventory)}>
                Imprimir Inventario
              </Button>

              <Button className="h-50 farm-primary-button" onClick={handleAddProduct}>
                <i className="ri-add-line pe-2" />
                Dar Entrada
              </Button>
            </div>
          </CardHeader>
          <CardBody className="d-flex flex-column flex-grow-1" style={{ maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
            <CustomTable columns={columnsTable} data={productsData} showSearchAndFilter={true} rowClickable={false} showPagination={false} />
          </CardBody>

        </Card>
      </Container>

      <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
        <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
        <ModalBody>
          {fileURL && <PDFViewer fileUrl={fileURL} />}
        </ModalBody>
      </Modal>

      {alertConfig.visible && (
        <Alert color={alertConfig.color} className="position-fixed bottom-0 start-50 translate-middle-x p-3">
          {alertConfig.message}
        </Alert>
      )}
    </div>
  );
};

export default ViewInventory;