import { useContext, useEffect, useState } from "react";
import { Button, Container, Alert, Card, CardHeader, CardBody, Modal, ModalBody, ModalHeader, Badge } from "reactstrap";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useNavigate } from "react-router-dom";
import { IncomeData, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getLoggedinUser } from "helpers/api_helper";
import IncomeForm from "Components/Common/Forms/IncomeForm";
import CustomTable from "Components/Common/Tables/CustomTable";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const ViewInventory = () => {
  document.title = "Inventario | Almacén General";
  const configContext = useContext(ConfigContext);
  const userLogged = getLoggedinUser();
  const navigate = useNavigate();

  const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modals, setModals] = useState({ viewPDF: false, createIncome: false });
  const [fileURL, setFileURL] = useState<string>('')
  const [mainWarehouseId, setMainWarehouseId] = useState<string>('')

  const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
    setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
  };

  const columnsTable: Column<any>[] = [
    { header: "Código", accessor: "id", isFilterable: true, type: 'text' },
    { header: "Producto", accessor: "name", isFilterable: true, type: 'text' },
    {
      header: 'Existencias',
      accessor: 'quantity',
      isFilterable: true,
      type: 'number',
      render: (_, row) => <span>{row.quantity} {row.unit_measurement}</span>
    },
    { header: 'Precio Promedio', accessor: 'averagePrice', isFilterable: true, type: 'currency' },
    {
      header: 'Categoria',
      accessor: 'category',
      isFilterable: true,
      type: 'text',
      render: (value: string) => {
        let color = "secondary";
        let label = value;

        switch (value) {
          case "nutrition":
            color = "info";
            label = "Nutrición";
            break;
          case "medications":
            color = "warning";
            label = "Medicamentos";
            break;
          case "vaccines":
            color = "primary";
            label = "Vacunas";
            break;
          case "vitamins":
            color = "success";
            label = "Vitaminas";
            break;
          case "minerals":
            color = "success";
            label = "Minerales";
            break;
          case "supplies":
            color = "success";
            label = "Insumos";
            break;
          case "hygiene_cleaning":
            color = "success";
            label = "Higiene y desinfección";
            break;
          case "equipment_tools":
            color = "success";
            label = "Equipamiento y herramientas";
            break;
          case "spare_parts":
            color = "success";
            label = "Refacciones y repuestos";
            break;
          case "office_supplies":
            color = "success";
            label = "Material de oficina";
            break;
          case "others":
            color = "success";
            label = "Otros";
            break;
        }

        return <Badge color={color}>{label}</Badge>;
      },
    },
    {
      header: "Acciones",
      accessor: "action",
      render: (value: any, row: any) => (
        <div className="d-flex gap-1">
          <Button className="farm-primary-button btn-icon" onClick={() => navigate(`/warehouse/inventory/product_details?warehouse=${mainWarehouseId}&product=${row.id}`)}>
            <i className="ri-eye-fill align-middle"></i>
          </Button>
        </div>
      ),
    },
  ];

  const fetchWarehouseId = async () => {
    if (!configContext || !userLogged) return;
    try {
      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/farm/get_main_warehouse/${userLogged.farm_assigned}`);
      setMainWarehouseId(response.data.data)
    } catch (error) {
      console.error('Error fetching main warehouse ID:', error);
    }
  }

  const fetchProductsData = async () => {
    if (!configContext || !mainWarehouseId) return;
    try {
      setLoading(true);
      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/get_inventory/${mainWarehouseId}`);
      setProductsData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products data:', error);
      setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos de los productos.' });
    }
  }


  const handlePrintInventory = async () => {
    if (!configContext) return;

    try {
      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/reports/generate_inventory_report/AG001`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setFileURL(url);
      toggleModal('viewPDF')
    } catch (error) {
      console.error('Error generating inventory report:', error);
      setAlertConfig({ visible: true, color: 'danger', message: 'Error al generar el reporte de inventario.' });
    }
  };

  useEffect(() => {
    fetchWarehouseId();
  }, []);

  useEffect(() => {
    fetchProductsData();
  }, [mainWarehouseId]);

  if (loading) {
    return (
      <LoadingAnimation />
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Inventario" pageTitle="Almacén General" />

        <Card className="rounded" style={{ height: '75vh' }}>
          <CardHeader>
            <div className="d-flex gap-2">
              <h4 className="">Productos</h4>
              <Button className="ms-auto" onClick={(handlePrintInventory)}>
                Imprimir Inventario
              </Button>

              <Button className="" onClick={() => toggleModal('createIncome')}>
                <i className="ri-add-line pe-2" />
                Nueva Entrada
              </Button>
            </div>
          </CardHeader>

          <CardBody className={productsData.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
            {productsData.length === 0 ? (
              <>
                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
              </>
            ) : (
              <CustomTable
                columns={columnsTable}
                data={productsData}
                showSearchAndFilter={true}
                rowClickable={false}
                showPagination={false}
              />
            )}
          </CardBody>

        </Card>
      </Container>

      <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered>
        <ModalHeader toggle={() => toggleModal("viewPDF")}>Reporte de Inventario </ModalHeader>
        <ModalBody>
          {fileURL && <PDFViewer fileUrl={fileURL} />}
        </ModalBody>
      </Modal>

      <Modal size="xl" isOpen={modals.createIncome} toggle={() => toggleModal("createIncome")} backdrop='static' keyboard={false} centered>
        <ModalHeader toggle={() => toggleModal("createIncome")}>Nueva entrada</ModalHeader>
        <ModalBody>
          <IncomeForm onSave={() => { toggleModal('createIncome'); fetchProductsData() }} onCancel={() => { }} />
        </ModalBody>
      </Modal>

      <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
    </div>
  );
};

export default ViewInventory;