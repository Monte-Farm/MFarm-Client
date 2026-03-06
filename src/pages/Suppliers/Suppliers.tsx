import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import SupplierForm from "Components/Common/Forms/SupplierForm";
import { SupplierData } from "common/data_interfaces";
import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import AlertMessage from "Components/Common/Shared/AlertMesagge";
import CustomTable from "Components/Common/Tables/CustomTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import SupplierDetailsModal from "Components/Common/Details/SupplierDetailsModal";
import { getSupplierTypeLabel } from "common/enums/suppliers.enums";

const Suppliers = () => {
    document.title = 'Ver Proveedores | Almacén'
    const configContext = useContext(ConfigContext)

    const [suppliersData, setSuppliersData] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState<any | undefined>(undefined);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, delete: false, activate: false, details: false });
    const [loading, setLoading] = useState<boolean>(false)
    const [supplierStatistics, setSupplierStatistics] = useState({
        totalSuppliers: 0,
        activeSuppliers: 0,
        inactiveSuppliers: 0,
        activationRate: 0
    });
    const [chartData, setChartData] = useState({
        statusData: [] as DonutDataItem[],
        statusLegendItems: [] as DonutLegendItem[],
        categoryData: [] as DonutDataItem[],
        categoryLegendItems: [] as DonutLegendItem[]
    });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const supplierColumn: Column<any>[] = [
        { header: 'Código', accessor: 'id', isFilterable: true, type: 'text' },
        { header: 'Proveedor', accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: 'Categoría',
            accessor: 'supplier_type',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{getSupplierTypeLabel(row.supplier_type)}</span>
        },
        { header: 'Telefono', accessor: 'phone_number', type: 'text' },
        { header: 'Dirección', accessor: 'address', type: 'text' },
        {
            header: "Estado", accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {value === true ? "Activo" : "Inactivo"}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: 'Acciones',
            accessor: 'action',
            render: (value: any, row: any) => (
                <div className="d-flex gap-1">
                    {row.status === true ? (
                        <Button className="farm-secondary-button btn-icon" disabled={!row.status} onClick={() => handleModalDeactivateSupplier(row)}>
                            <i className="ri-forbid-line align-middle" />
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={() => handleModalActivateSupplier(row)}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={() => handleModalUpdateSupplier(row)}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" onClick={() => { setSelectedSupplier(row); toggleModal('details') }}>
                        <i className="ri-eye-fill align-middle" />
                    </Button>
                </div >
            )
        }
    ]

    const fetchAllSupplierData = async () => {
        if (!configContext) return;
        setLoading(true);

        try {
            const [suppliersResponse, statisticsResponse, chartsResponse] = await Promise.all([
                configContext.axiosHelper.get(`${configContext.apiUrl}/supplier`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/supplier_statistics`),
                configContext.axiosHelper.get(`${configContext.apiUrl}/supplier/supplier_charts`)
            ]);

            // Setear datos de proveedores
            setSuppliersData(suppliersResponse.data.data);

            // Setear estadísticas
            setSupplierStatistics(statisticsResponse.data.data);

            // Procesar y setear datos de gráficas
            const chartDataResponse = chartsResponse.data.data;

            // Transformar datos para gráfica de estado
            const statusData: DonutDataItem[] = [
                { id: 'active', label: 'Activos', value: chartDataResponse.statusData.active || 0, color: '#10b981' },
                { id: 'inactive', label: 'Inactivos', value: chartDataResponse.statusData.inactive || 0, color: '#ef4444' }
            ];

            const totalSuppliers = (chartDataResponse.statusData.active || 0) + (chartDataResponse.statusData.inactive || 0);

            const statusLegendItems: DonutLegendItem[] = [
                {
                    label: 'Activos',
                    value: (chartDataResponse.statusData.active || 0).toString(),
                    percentage: totalSuppliers > 0 ? `${(((chartDataResponse.statusData.active || 0) / totalSuppliers) * 100).toFixed(1)}%` : '0%'
                },
                {
                    label: 'Inactivos',
                    value: (chartDataResponse.statusData.inactive || 0).toString(),
                    percentage: totalSuppliers > 0 ? `${(((chartDataResponse.statusData.inactive || 0) / totalSuppliers) * 100).toFixed(1)}%` : '0%'
                }
            ];

            // Transformar datos para gráfica de categorías
            const categoryData: DonutDataItem[] = [];
            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

            if (chartDataResponse.categoryData) {
                Object.entries(chartDataResponse.categoryData).forEach(([category, count], index) => {
                    categoryData.push({
                        id: category,
                        label: getSupplierTypeLabel(category),
                        value: Number(count),
                        color: colors[index % colors.length]
                    });
                });
            }

            const categoryLegendItems: DonutLegendItem[] = categoryData.map(item => ({
                label: item.label,
                value: item.value.toString(),
                percentage: totalSuppliers > 0 ? `${((item.value / totalSuppliers) * 100).toFixed(1)}%` : '0%'
            }));

            setChartData({
                statusData,
                statusLegendItems,
                categoryData,
                categoryLegendItems
            });

        } catch (error) {
            console.error('Error fetching supplier data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Error al obtener los datos de los proveedores.' });
        } finally {
            setLoading(false);
        }
    };

    const handleModalUpdateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('update')
    }


    const handleModalDeactivateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('delete')
    }

    const handleModalActivateSupplier = (supplier: SupplierData) => {
        setSelectedSupplier(supplier)
        toggleModal('activate')
    }

    const handleCreateSupplier = async (data: SupplierData) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, data);
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor registrado con éxito' })
            fetchAllSupplierData();
        } catch (error) {
            console.error('Error creating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al crear al proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateSupplier = async (data: SupplierData) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${data.id}`, data);
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor actualizado con éxito' })
        } catch (error) {
            console.error('Error updating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al actualizar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('update', false);
        }
    };


    const handleDeactivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierId}`);
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor desactivado con éxito' })
        } catch (error) {
            console.error('Error deactivating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('delete', false);
        }
    };


    const handleActivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_supplier/${supplierId}`, {});
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: 'Proveedor sactivado con éxito' })
        } catch (error) {
            console.error('Error activating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar el proveedor, intentelo mas tarde' });
        } finally {
            toggleModal('activate', false);
        }
    };

    useEffect(() => {
        fetchAllSupplierData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb pageTitle="Ver Proveedores" title="Proveedores" ></BreadCrumb>

                {/* KPIs Section */}
                <div className="row ">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Total de Proveedores"
                            value={supplierStatistics?.totalSuppliers}
                            icon={<i className="ri-truck-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Proveedores Activos"
                            value={supplierStatistics?.activeSuppliers}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Proveedores Inactivos"
                            value={supplierStatistics?.inactiveSuppliers}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title="Tasa de Activación"
                            value={supplierStatistics?.activationRate}
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
                            title="Estado de Proveedores"
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title="Proveedores por Categoría"
                            data={chartData.categoryData}
                            legendItems={chartData.categoryLegendItems}
                            height={200}
                        />
                    </div>
                </div>

                <Card className="rounded">
                    <CardHeader>
                        <div className="d-flex gap-2">
                            <h4 className="me-auto">Proveedores</h4>

                            <Button className="farm-primary-button" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-3" />
                                Agregar Proveedor
                            </Button>
                        </div>
                    </CardHeader>

                    <CardBody className={suppliersData.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {suppliersData.length === 0 ? (
                            <>
                                <i className="ri-truck-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">Aún no hay proveedores registrados</span>
                            </>
                        ) : (
                            <CustomTable
                                columns={supplierColumn}
                                data={suppliersData}
                                showSearchAndFilter={true}
                                showPagination={false}
                            />
                        )}
                    </CardBody>
                </Card>

                {/* Modal Create */}
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('create')}>Nuevo Proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal('create', false)} isCodeDisabled={false}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => toggleModal('update')}>Actualizar Proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierForm initialData={selectedSupplier} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal('update', false)} isCodeDisabled={true}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                    <ModalHeader toggle={() => toggleModal('delete')}>Confirmación de Eliminación</ModalHeader>
                    <ModalBody>
                        {`¿Estás seguro de que deseas desactivar al proveedor "${selectedSupplier?.name}"?`}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleDeactivateSupplier(selectedSupplier.id);
                            }
                        }}
                        >
                            Eliminar
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Activate */}
                <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("activate")}>Activar Producto</ModalHeader>
                    <ModalBody>¿Desea activar el producto {selectedSupplier?.name}?</ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleActivateSupplier(selectedSupplier.id)
                            }
                        }}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={modals.details} toggle={() => { toggleModal('details'); fetchAllSupplierData(); }} size="xxl" keyboard={false} backdrop='static' centered>
                    <ModalHeader toggle={() => { toggleModal('details'); fetchAllSupplierData(); }}>Detalles de proveedor</ModalHeader>
                    <ModalBody>
                        <SupplierDetailsModal supplierId={selectedSupplier?._id} />
                    </ModalBody>
                </Modal>

            </Container>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div >
    )
}


export default Suppliers;