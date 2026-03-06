import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import ObjectDetails from "Components/Common/Details/ObjectDetails";
import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import noImageUrl from '../../assets/images/no-image.png'
import { Attribute, ProductData } from "common/data_interfaces";
import { ConfigContext } from "App";
import LoadingGif from '../../assets/images/loading-gif.gif'
import { Column } from "common/data/data_types";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import ProductForm from "Components/Common/Forms/ProductForm";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import { getProductCategoryLabel } from "common/enums/products.enums";
import { FiInbox } from "react-icons/fi";


const productAttributes: Attribute[] = [
    { key: 'id', label: 'Código', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'unit_measurement', label: 'Unidad de Medida', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
]


const ViewProducts = () => {
    document.title = "Catálogo de Productos | Almacén"
    const configContext = useContext(ConfigContext);

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState<ProductData>()
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, details: false, update: false, delete: false, activate: false });
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

    const columns: Column<any>[] = [
        {
            header: 'Imagen', accessor: 'image', render: (_, row) => (
                <img src={row.image || noImageUrl} alt="Imagen del Producto" style={{ height: "70px" }} />
            ),
        },
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Nombre', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Categoria',
            accessor: 'category',
            isFilterable: true,
            type: 'text',
            render: (value: string) => {
                let color = "secondary";
                let label = getProductCategoryLabel(value);

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

                return <Badge color={color}>{label}</Badge>;
            },
        },
        { header: 'Unidad de Medida', accessor: 'unit_measurement', isFilterable: true, type: 'text' },
        {
            header: 'Estado', accessor: 'status', isFilterable: true, render: (value: boolean) => (
                <Badge color={value ? "success" : "danger"}>{value ? "Activo" : "Inactivo"}</Badge>
            ),
        },
        {
            header: "Acciones",
            accessor: "action",
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    {row.status === true ? (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleClicModal('delete', row)}>
                            <i className="ri-forbid-line align-middle"></i>
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleClicModal('activate', row)}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}

                    <Button className="farm-primary-button btn-icon" disabled={row.status !== true} onClick={() => handleClicModal('update', row)}>
                        <i className="ri-pencil-fill align-middle"></i>
                    </Button>

                    <Button className="farm-primary-button btn-icon" onClick={() => handleClicModal('details', row)}>
                        <i className="ri-eye-fill align-middle"></i>
                    </Button>
                </div>
            ),
        },
    ];

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const handleClicModal = async (modal: any, data: ProductData) => {
        setSelectedProduct(data);
        toggleModal(modal)
    }

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

            const statusData: DonutDataItem[] = [
                { id: 'active', label: 'Activos', value: chartDataResponse.statusData.active || 0, color: '#10b981' },
                { id: 'inactive', label: 'Inactivos', value: chartDataResponse.statusData.inactive || 0, color: '#ef4444' }
            ];

            const totalProducts = (chartDataResponse.statusData.active || 0) + (chartDataResponse.statusData.inactive || 0);

            const statusLegendItems: DonutLegendItem[] = [
                {
                    label: 'Activos',
                    value: (chartDataResponse.statusData.active || 0).toString(),
                    percentage: totalProducts > 0 ? `${(((chartDataResponse.statusData.active || 0) / totalProducts) * 100).toFixed(1)}%` : '0%'
                },
                {
                    label: 'Inactivos',
                    value: (chartDataResponse.statusData.inactive || 0).toString(),
                    percentage: totalProducts > 0 ? `${(((chartDataResponse.statusData.inactive || 0) / totalProducts) * 100).toFixed(1)}%` : '0%'
                }
            ];

            const categoryData: DonutDataItem[] = [];
            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7', '#6b7280'];

            if (chartDataResponse.categoryData) {
                Object.entries(chartDataResponse.categoryData).forEach(([category, count], index) => {
                    categoryData.push({
                        id: category,
                        label: getProductCategoryLabel(category),
                        value: Number(count),
                        color: colors[index % colors.length]
                    });
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
            console.error('Error fetching product data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los productos, intentelo más tarde' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/product/create_product`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto creado con éxito' });
            fetchAllProductData();
        } catch (error) {
            console.error('Error creating product:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear el producto, intentelo más tarde' });
        } finally {
            toggleModal('create');
        }
    };

    const handleUpdateProduct = async (data: ProductData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/update_product/${data._id}`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto actualizado con éxito' });

            fetchAllProductData();
        } catch (error) {
            console.error('Error updating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('update');
            setSelectedProduct(undefined);
        }
    };

    const handleDeleteProduct = async (product_id: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/product/delete_product/${product_id}`);
            setAlertConfig({ visible: true, color: 'success', message: 'Producto desactivado con éxito' });

            fetchAllProductData();
        } catch (error) {
            console.error('Error deactivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('delete');
            setSelectedProduct(undefined);
        }
    };

    const handleActivateProduct = async (product_id: string) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/product/activate_product/${product_id}`, {});
            setAlertConfig({ visible: true, color: 'success', message: 'Producto activado con éxito' });
            fetchAllProductData();
        } catch (error) {
            console.error('Error ctivating products:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al sactivar el producto, intentelo mas tarde' });
        } finally {
            toggleModal('activate');
            setSelectedProduct(undefined);
        }
    };

    useEffect(() => {
        fetchAllProductData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={"Catálogo de Productos"} pageTitle={"Almacén General"}></BreadCrumb>

                {/* KPIs Section */}
                <div className="row">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Productos"
                            value={productStatistics?.totalProducts}
                            icon={<i className="ri-box-3-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Productos Activos"
                            value={productStatistics?.activeProducts}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Productos Inactivos"
                            value={productStatistics?.inactiveProducts}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Tasa de Activación"
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
                <div className="row mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Estado de Productos"
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Productos por Categoría"
                            data={chartData.categoryData}
                            legendItems={chartData.categoryLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex">
                            <Button className="ms-auto farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2  " />
                                Agregar Producto
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className={products.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {products.length === 0 ? (
                            <>
                                <FiInbox className="text-muted" size={40} style={{ marginBottom: 12, opacity: 0.8 }} />
                                <span className="fs-5 text-muted">Aún no hay productos registrados en el inventario</span>
                            </>
                        ) : (
                            <CustomTable columns={columns} data={products} showPagination={false} />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Modal Details */}
            <Modal size="lg" isOpen={modals.details} toggle={() => toggleModal("details")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("details")}><h4>Detalles de Producto</h4></ModalHeader>
                <ModalBody>
                    {selectedProduct && (
                        <ObjectDetails attributes={productAttributes} object={selectedProduct} showImage={true} imageSrc={selectedProduct.image}></ObjectDetails>
                    )}
                </ModalBody>
            </Modal>

            {/* Modal Create */}
            <Modal size="lg" isOpen={modals.create} toggle={() => toggleModal("create")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("create")}>Nuevo Producto </ModalHeader>
                <ModalBody>
                    <ProductForm onSubmit={handleCreateProduct} onCancel={() => toggleModal("create", false)} />
                </ModalBody>
            </Modal>

            {/* Modal Update */}
            <Modal size="lg" isOpen={modals.update} toggle={() => toggleModal("update")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("update")}>Actualizar Producto</ModalHeader>
                <ModalBody>
                    <ProductForm initialData={selectedProduct} onSubmit={handleUpdateProduct} onCancel={() => toggleModal("update", false)} isCodeDisabled={true} />
                </ModalBody>
            </Modal>

            {/* Modal Delete */}
            <Modal isOpen={modals.delete} toggle={() => toggleModal("delete")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("delete")}>Desactivar Producto</ModalHeader>
                <ModalBody>¿Desea desactivar el producto {selectedProduct?.name}?</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("delete", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleDeleteProduct(selectedProduct.id)
                        }
                    }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            {/* Modal Activate */}
            <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("activate")}>Activar Producto</ModalHeader>
                <ModalBody>¿Desea activar el producto {selectedProduct?.name}?</ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>Cancelar</Button>
                    <Button className="farm-primary-button" onClick={() => {
                        if (selectedProduct) {
                            handleActivateProduct(selectedProduct.id)
                        }
                    }}>Confirmar</Button>
                </ModalFooter>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div>
    )
}

export default ViewProducts;