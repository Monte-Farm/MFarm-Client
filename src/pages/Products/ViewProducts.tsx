import { logger } from 'utils/logger';
import { useTranslation } from "react-i18next";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import noImageUrl from '../../assets/images/no-image.png'
import { Attribute, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import ProductForm from "Components/Common/Forms/ProductForm";
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import { getProductCategoryLabel, getProductTypeLabel, PRODUCT_TYPES } from "common/enums/products.enums";
import { FiInbox } from "react-icons/fi";
import PDFViewer from "Components/Common/Shared/PDFViewer";


const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const ViewProducts = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.products.pageTitle');
    const configContext = useContext(ConfigContext);

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState<ProductData>()
    const [selectedProducts, setSelectedProducts] = useState<ProductData[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false, bulkDelete: false, bulkActivate: false, viewPDF: false });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [productStatistics, setProductStatistics] = useState({
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        activationRate: 0
    });
    const [chartData, setChartData] = useState({
        statusData: [] as DonutDataItem[],
        statusLegendItems: [] as DonutLegendItem[],
        categoryData: [] as DonutDataItem[],
        categoryLegendItems: [] as DonutLegendItem[]
    });

    const productAttributes: Attribute[] = [
        { key: 'id', label: t('common.field.code'), type: 'text' },
        { key: 'name', label: t('common.field.name'), type: 'text' },
        { key: 'category', label: t('warehouse.products.attr.category'), type: 'text' },
        { key: 'type', label: t('warehouse.products.attr.type'), type: 'text' },
        { key: 'unit_measurement', label: t('warehouse.products.attr.unit'), type: 'text' },
        { key: 'description', label: t('common.field.description', { defaultValue: 'Descripción' }), type: 'text' },
    ];

    const columns: Column<any>[] = [
        {
            header: t('common.field.image', { defaultValue: 'Imagen' }), accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="" style={{ height: "70px" }} />
            ),
        },
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('common.field.name'), accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.products.attr.category'),
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";

                switch (value) {
                    case "nutrition":
                        color = "info";
                        break;
                    case "medications":
                        color = "warning";
                        break;
                    case "vaccines":
                        color = "primary";
                        break;
                    case "vitamins":
                        color = "success";
                        break;
                    case "minerals":
                        color = "success";
                        break;
                    case "supplies":
                        color = "success";
                        break;
                    case "hygiene_cleaning":
                        color = "success";
                        break;
                    case "equipment_tools":
                        color = "success";
                        break;
                    case "spare_parts":
                        color = "success";
                        break;
                    case "office_supplies":
                        color = "success";
                        break;
                    case "others":
                        color = "success";
                        break;
                }

                return <Badge color={color}>{t(`warehouse.common.productCategory.${value}`, { defaultValue: value })}</Badge>;
            },
        },
        {
            header: t('warehouse.products.attr.type'),
            accessor: 'type',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                const typeVal = value || PRODUCT_TYPES.RAW;
                const color = typeVal === PRODUCT_TYPES.PREPARED_FEED ? 'warning' : 'secondary';
                return <Badge color={color}>{t(`warehouse.common.productType.${typeVal}`, { defaultValue: typeVal })}</Badge>;
            },
        },
        { header: t('warehouse.products.attr.unit'), accessor: 'unit_measurement', isFilterable: true, type: 'text' },
        {
            header: t('common.field.status'), accessor: 'status', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{t(`common.status.${value ? 'active' : 'inactive'}`)}</Badge>
            ),
        },
        {
            header: t('common.field.actions'),
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    {row.status === true ? (
                        <Button className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); handleClicModal('delete', row); }}>
                            <i className="ri-forbid-line align-middle"></i>
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); handleClicModal('activate', row); }}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}

                    <Button className="farm-primary-button btn-icon" disabled={row.status !== true} onClick={(e) => { e.stopPropagation(); handleClicModal('update', row); }}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>

                    <Button className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); handleClicModal('details', row); }}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const handleSelectionChange = (selected: ProductData[]) => {
        setSelectedProducts(selected);
    };

    // Funciones para determinar si hay productos activos/inactivos seleccionados
    const hasActiveProducts = selectedProducts.some(p => p.status === true);
    const hasInactiveProducts = selectedProducts.some(p => p.status === false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: ProductData) => {
        setSelectedProduct(data);
        toggleModal(modal)
    }

    const handleGeneratePDF = async () => {
        if (!configContext) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/products/all`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

    const fetchAllProductData = async () => {
        if (!configContext) return;
        setLoading(true);

        try {
            const [productsResponse, statisticsResponse, chartsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/product`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/product_statistics`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/product/product_charts`)
            ]);

            setProducts(productsResponse.data.data);

            setProductStatistics(statisticsResponse.data.data);

            const chartDataResponse = chartsResponse.data.data;

            // Filter status data to only include non-zero values
            const statusData: DonutDataItem[] = [];
            const activeCount = chartDataResponse.statusData.active || 0;
            const inactiveCount = chartDataResponse.statusData.inactive || 0;

            if (activeCount > 0) {
                statusData.push({ id: 'active', label: t('common.status.active'), value: activeCount, color: '#10b981' });
            }
            if (inactiveCount > 0) {
                statusData.push({ id: 'inactive', label: t('common.status.inactive'), value: inactiveCount, color: '#ef4444' });
            }

            const totalProducts = activeCount + inactiveCount;

            const statusLegendItems: DonutLegendItem[] = statusData.map(item => ({
                label: item.label,
                value: item.value.toString(),
                percentage: totalProducts > 0 ? `${((item.value / totalProducts) * 100).toFixed(1)}%` : '0%'
            }));

            // Filter category data to only include non-zero values
            const categoryData: DonutDataItem[] = [];
            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7', '#6b7280'];

            if (chartDataResponse.categoryData) {
                Object.entries(chartDataResponse.categoryData).forEach(([category, count], index) => {
                    const numericCount = Number(count);
                    if (numericCount > 0) {
                        categoryData.push({
                            id: category,
                            label: t(`warehouse.common.productCategory.${category}`, { defaultValue: category }),
                            value: numericCount,
                            color: colors[index % colors.length]
                        });
                    }
                });
            }

            const categoryLegendItems: DonutLegendItem[] = categoryData.map(item => ({
                label: item.label,
                value: item.value.toString(),
                percentage: totalProducts > 0 ? `${((item.value / totalProducts) * 100).toFixed(1)}%` : '0%'
            }));

            setChartData({
                statusData,
                statusLegendItems,
                categoryData,
                categoryLegendItems
            });

        } catch (error) {
            logger.error('Error fetching product data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.fetch') });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/product/create_product`, data);
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.create') });
            fetchAllProductData();
        } catch (error) {
            logger.error('Error creating product:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.create') });
        } finally {
            toggleModal('create');
        }
    };

    const handleUpdateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/update_product/${data._id}`, data);
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.update') });

            fetchAllProductData();
        } catch (error) {
            logger.error('Error updating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.update') });
        } finally {
            toggleModal('update');
            setSelectedProduct(undefined);
        }
    };

    const handleDeleteProduct = async (product_id: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/product/delete_product/${product_id}`);
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.deactivate') });

            fetchAllProductData();
        } catch (error) {
            logger.error('Error deactivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.deactivate') });
        } finally {
            toggleModal('delete');
            setSelectedProduct(undefined);
        }
    };

    const handleActivateProduct = async (product_id: string) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/activate_product/${product_id}`, {});
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.activate') });
            fetchAllProductData();
        } catch (error) {
            logger.error('Error ctivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.activate') });
        } finally {
            toggleModal('activate');
            setSelectedProduct(undefined);
        }
    };

    // Funciones para acciones masivas
    const handleBulkDeactivate = async () => {
        if (!configContext) return;

        const activeProductIds = selectedProducts
            .filter(p => p.status === true)
            .map(p => p._id);

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/product/delete_products`, { data: { productIds: activeProductIds } });
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.bulkDeactivate', { count: activeProductIds.length }) });
            fetchAllProductData();
            setSelectedProducts([]);
        } catch (error) {
            logger.error('Error bulk deactivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.bulkDeactivate') });
        } finally {
            toggleModal('bulkDelete');
        }
    };

    const handleBulkActivate = async () => {
        if (!configContext) return;

        const inactiveProductIds = selectedProducts
            .filter(p => p.status === false)
            .map(p => p._id);

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/activate_products`, { productIds: inactiveProductIds });
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.products.success.bulkActivate', { count: inactiveProductIds.length }) });
            fetchAllProductData();
            setSelectedProducts([]);
        } catch (error) {
            logger.error('Error bulk activating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.products.error.bulkActivate') });
        } finally {
            toggleModal('bulkActivate');
        }
    };

    useEffect(() => {
        fetchAllProductData();
        const onResize = () => setTabletMode(isTablet());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={t('warehouse.products.breadcrumb')} pageTitle={t('warehouse.products.pageHeader')}></BreadCrumb>

                {/* KPIs Section */}
                <div className="row g-3 mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.products.kpi.total')}
                            value={productStatistics?.totalProducts}
                            icon={<i className="ri-box-3-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.products.kpi.active')}
                            value={productStatistics?.activeProducts}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.products.kpi.inactive')}
                            value={productStatistics?.inactiveProducts}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.products.kpi.activationRate')}
                            value={productStatistics?.activationRate}
                            suffix="%"
                            decimals={1}
                            icon={<i className="ri-percent-line fs-20 text-info"></i>}
                            iconBgColor="#E3F2FD"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                </div>

                {/* Charts Section */}
                <div className="row g-3 mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.products.chart.status')}
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.products.chart.byCategory')}
                            data={chartData.categoryData}
                            legendItems={chartData.categoryLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            {selectedProducts.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedProducts.length} {selectedProducts.length === 1 ? t('warehouse.products.selection.single') : t('warehouse.products.selection.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasActiveProducts}
                                            title={!hasActiveProducts ? "No hay productos activos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkDelete')}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            {t('warehouse.products.button.deactivate')}
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasInactiveProducts}
                                            title={!hasInactiveProducts ? "No hay productos inactivos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkActivate')}
                                        >
                                            <i className="ri-check-line me-1"></i>
                                            {t('warehouse.products.button.activate')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="d-flex gap-2 ms-auto">
                                <Button color="primary" onClick={handleGeneratePDF} disabled={pdfLoading}>
                                    {pdfLoading ? (
                                        <><Spinner className="me-2" size="sm" />{t('common.button.generating')}</>
                                    ) : (
                                        <><i className="ri-file-pdf-line me-2" />{t('common.button.exportPdf')}</>
                                    )}
                                </Button>
                                <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                    <i className="ri-add-line me-2" />
                                    {t('warehouse.products.button.add')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className={products.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {products.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={40} style={{ marginBottom: 12, opacity: 0.8 }} />
                                <span className="fs-5 text-muted">{t('warehouse.products.empty')}</span>
                            </>
                        ) : (
                            <SelectableCustomTable
                                columns={columns}
                                data={products}
                                showPagination={false}
                                onSelect={handleSelectionChange}
                                selectionOnlyOnCheckbox={true}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Details */}
            <Modal size="lg" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("details")}><h4>{t('warehouse.products.modal.details')}</h4></ModalHeader>
                <ModalBody>
                    {selectedProduct && (
                        <ObjectDetails attributes={productAttributes} object={selectedProduct} showImage={true} imageSrc={selectedProduct.image}></ObjectDetails>
                    )}
                </ModalBody>
            </Modal>

            {/* Modal Create */}
            <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("create")}>{t('warehouse.products.modal.create')}</ModalHeader>
                <ModalBody>
                    <ProductForm onSubmit={handleCreateProduct} onCancel={() => toggleModal("create", false)} />
                </ModalBody>
            </Modal>

            {/* Modal Update */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered fullscreen={tabletMode}>
                <ModalHeader toggle={() => toggleModal("update")}>{t('warehouse.products.modal.update')}</ModalHeader>
                <ModalBody>
                    <ProductForm initialData={selectedProduct} onSubmit={handleUpdateProduct} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                </ModalBody>
            </Modal>

            {/* Modal Delete */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>{t('warehouse.products.modal.deactivate')}</ModalHeader>
                <ModalBody>{t('warehouse.products.modal.confirmDeactivate', { name: selectedProduct?.name })}</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleDeleteProduct(selectedProduct.id)
                        }
                    }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            {/* Modal Activate */}
            <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activate")}>{t('warehouse.products.modal.activate')}</ModalHeader>
                <ModalBody>{t('warehouse.products.modal.confirmActivate', { name: selectedProduct?.name })}</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleActivateProduct(selectedProduct.id)
                        }
                    }}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            {/* Modal Bulk Deactivate */}
            <Modal isOpen={modals.bulkDelete} toggle={() => toggleModal("bulkDelete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkDelete")}>{t('warehouse.products.modal.bulkDeactivate')}</ModalHeader>
                <ModalBody>
                    {t('warehouse.products.modal.confirmBulkDeactivate', { count: selectedProducts.filter(p => p.status === true).length })}
                    <div className="mt-2">
                        <small className="text-muted">
                            {t('warehouse.products.modal.bulkDeactivateNote')}
                        </small>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDelete", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={handleBulkDeactivate}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            {/* Modal Bulk Activate */}
            <Modal isOpen={modals.bulkActivate} toggle={() => toggleModal("bulkActivate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("bulkActivate")}>{t('warehouse.products.modal.bulkActivate')}</ModalHeader>
                <ModalBody>
                    {t('warehouse.products.modal.confirmBulkActivate', { count: selectedProducts.filter(p => p.status === false).length })}
                    <div className="mt-2">
                        <small className="text-muted">
                            {t('warehouse.products.modal.bulkActivateNote')}
                        </small>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("bulkActivate", false)}>{t('common.button.cancel')}</Button>
                    <Button className="farm-primary-button" onClick={handleBulkActivate}>{t('common.button.confirm')}</Button>
                </ModalFooter>
            </Modal>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.products.modal.catalog')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewProducts;
