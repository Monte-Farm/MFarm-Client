import { logger } from 'utils/logger';
import { useContext, useEffect, useState } from "react";
import { Button, Container, Alert, Card, CardHeader, CardBody, Modal, ModalBody, ModalHeader, Badge, Spinner } from "reactstrap";
import { useTranslation } from "react-i18next";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useNavigate } from "react-router-dom";
import { IncomeData, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import { getEffectiveUser } from "helpers/impersonation_helper";
import IncomeForm from "Components/Common/Forms/IncomeForm";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const ViewInventory = () => {
  const { t } = useTranslation();
  document.title = t('warehouse.inventory.pageTitle');
  const configContext = useContext(ConfigContext);
  const userLogged = getEffectiveUser();
  const navigate = useNavigate();

  const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
  const [productsData, setProductsData] = useState<any[]>([]);
  const [productsStatistics, setProductsStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [modals, setModals] = useState({ viewPDF: false, createIncome: false });
  const [fileURL, setFileURL] = useState<string>('')
  const [mainWarehouseId, setMainWarehouseId] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState(false);

  const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
    setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
  };

  const columnsTable: Column<any>[] = [
    {
      header: t('common.field.code'),
      accessor: "id",
      isFilterable: true,
      type: 'text',
      render: (value, row) => <span className="text-black">{row.product.id}</span>
    },
    {
      header: t('common.field.name'),
      accessor: "name",
      isFilterable: true,
      type: 'text',
      render: (value, row) => <span className="text-black">{row.product.name}</span>
    },
    {
      header: t('warehouse.inventoryDetails.kpi.stock'),
      accessor: 'quantity',
      isFilterable: true,
      type: 'number',
      render: (_, row) => <span>{row.quantity} {row.product.unit_measurement}</span>,
      bgColor: '#E8F5E9'
    },
    { header: t('warehouse.inventoryDetails.kpi.avgPrice'), accessor: 'averagePrice', isFilterable: true, type: 'currency', bgColor: '#E3F2FD' },
    {
      header: t('warehouse.inventory.kpi.totalValue'),
      accessor: 'totalValue',
      isFilterable: true,
      type: 'currency',
      render: (_, row) => {
        const totalValue = row.quantity * (row.averagePrice || 0);
        return <span>${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      },
      bgColor: '#FFF3E0'
    },
    {
      header: t('warehouse.products.attr.category'),
      accessor: 'category',
      isFilterable: true,
      type: 'text',
      render: (value, row) => {
        let color = "secondary";
        const cat = row.product.category;
        const colorMap: Record<string, string> = {
          nutrition: "info", medications: "warning", vaccines: "primary",
          vitamins: "success", minerals: "success", supplies: "success",
          hygiene_cleaning: "success", equipment_tools: "success",
          spare_parts: "success", office_supplies: "success", others: "success"
        };
        if (colorMap[cat]) color = colorMap[cat];
        return <Badge color={color}>{t(`warehouse.common.productCategory.${cat}`, { defaultValue: cat })}</Badge>;
      },
    },
    {
      header: t('common.field.actions'),
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
      logger.error('Error fetching main warehouse ID:', error);
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
      logger.error('Error fetching products data:', error);
      setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.inventory.error.fetchProducts') });
    }
  }

  const fetchProductsStatistics = async () => {
    if (!configContext || !mainWarehouseId) return;
    try {
      setLoading(true);
      const response = await configContext.axiosHelper.get(`${configContext.apiUrl}/warehouse/warehouse_statistics/${mainWarehouseId}`);
      setProductsStatistics(response.data.data.statistics);
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching products data:', error);
      setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.inventory.error.fetchProducts') });
    }
  }


  const handlePrintInventory = async () => {
    if (!configContext || !mainWarehouseId) return;

    try {
      setPdfLoading(true);
      const response = await configContext.axiosHelper.getBlob(`${configContext.apiUrl}/reports/warehouse_inventory/${mainWarehouseId}`);

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      setFileURL(url);
      toggleModal('viewPDF');
    } catch (error) {
      logger.error('Error generating inventory report:', error);
      setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.inventory.error.generateReport') });
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseId();
  }, []);

  useEffect(() => {
    fetchProductsData();
    fetchProductsStatistics();
  }, [mainWarehouseId]);

  if (loading) {
    return (
      <LoadingAnimation />
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title={t('warehouse.inventory.breadcrumb')} pageTitle={t('warehouse.inventory.pageHeader')} />

        {/* KPIs Section */}
        <div className="row g-3 mb-3">

          <div className="col-xl-3 col-md-6">
            <StatKpiCard
              title={t('warehouse.inventory.kpi.totalValue')}
              value={productsStatistics.totalValue}
              prefix="$"
              decimals={2}
              icon={<i className="ri-money-dollar-circle-line fs-20 text-primary"></i>}
              iconBgColor="#E8F5E9"
              animateValue={true}
              durationSeconds={1.5}
            />
          </div>
          <div className="col-xl-3 col-md-6">
            <StatKpiCard
              title={t('warehouse.inventory.kpi.totalProducts')}
              value={productsStatistics.uniqueProducts}
              icon={<i className="ri-shopping-bag-3-line fs-20 text-info"></i>}
              iconBgColor="#E3F2FD"
              animateValue={true}
              durationSeconds={1.5}
            />
          </div>
          <div className="col-xl-3 col-md-6">
            <StatKpiCard
              title={t('warehouse.inventory.kpi.totalUnits')}
              value={productsStatistics.totalUnits}
              icon={<i className="ri-stack-line fs-20 text-warning"></i>}
              iconBgColor="#FFF3E0"
              animateValue={true}
              durationSeconds={1.5}
            />
          </div>
          <div className="col-xl-3 col-md-6">
            <StatKpiCard
              title={t('warehouse.inventory.kpi.avgValuePerProduct')}
              value={productsStatistics.averageValuePerProduct}
              prefix="$"
              decimals={2}
              icon={<i className="ri-bar-chart-line fs-20 text-success"></i>}
              iconBgColor="#F3E5F5"
              animateValue={true}
              durationSeconds={1.5}
            />
          </div>
        </div >

        <Card className="rounded">
          <CardHeader>
            <div className="d-flex gap-2 justify-content-between">
              <h4 className="">{t('warehouse.inventory.cardHeader')}</h4>

              <div className="d-flex gap-2">
                <Button
                  color="primary"
                  onClick={handlePrintInventory}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <>
                      <Spinner className="me-2" size='sm' />
                      {t('common.button.generating')}
                    </>
                  ) : (
                    <>
                      <i className="ri-file-pdf-line me-2"></i>
                      {t('warehouse.inventory.button.report')}
                    </>
                  )}
                </Button>
                <Button className="farm-primary-button" onClick={() => toggleModal('createIncome')}>
                  <i className="ri-add-line pe-2" />
                  {t('warehouse.inventory.button.newIncome')}
                </Button>
              </div>

            </div>
          </CardHeader>

          <CardBody className={productsData.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
            {productsData.length === 0 ? (
              <>
                <i className="ri-drop-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                <span className="fs-5 text-muted">{t('warehouse.inventory.empty')}</span>
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
      </Container >

      <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop='static' keyboard={false} centered fullscreen={true}>
        <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.inventory.modal.report')}</ModalHeader>
        <ModalBody>
          {fileURL && <PDFViewer fileUrl={fileURL} />}
        </ModalBody>
      </Modal>

      <Modal size="xl" isOpen={modals.createIncome} toggle={() => toggleModal("createIncome")} backdrop='static' keyboard={false} centered>
        <ModalHeader toggle={() => toggleModal("createIncome")}>{t('warehouse.inventory.modal.newIncome')}</ModalHeader>
        <ModalBody>
          <IncomeForm onSave={() => { toggleModal('createIncome'); fetchProductsData() }} onCancel={() => { }} />
        </ModalBody>
      </Modal>

      <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
    </div >
  );
};

export default ViewInventory;