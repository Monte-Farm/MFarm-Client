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
import SelectableCustomTable from "Components/Common/Tables/SelectableTable";
import StatKpiCard from "Components/Common/Graphics/StatKpiCard";
import DonutChartCard, { DonutDataItem, DonutLegendItem } from "Components/Common/Graphics/DonutChartCard";
import SupplierDetailsModal from "Components/Common/Details/SupplierDetailsModal";
import { getSupplierTypeLabel } from "common/enums/suppliers.enums";

const Suppliers = () => {
    document.title = 'Ver Proveedores | Almacén'
    const configContext = useContext(ConfigContext)

    const [suppliersData, setSuppliersData] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState<any | undefined>(undefined);
    const [selectedSuppliers, setSelectedSuppliers] = useState<SupplierData[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({ create: false, update: false, delete: false, activate: false, details: false, bulkDelete: false, bulkActivate: false });
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

    const handleSelectionChange = (selected: SupplierData[]) => {
        setSelectedSuppliers(selected);
    };

    // Funciones para determinar si hay proveedores activos/inactivos seleccionados
    const hasActiveSuppliers = selectedSuppliers.some(s => s.status === true);
    const hasInactiveSuppliers = selectedSuppliers.some(s => s.status === false);

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
                        <Button className="farm-secondary-button btn-icon" disabled={!row.status} onClick={(e) => { e.stopPropagation(); handleModalDeactivateSupplier(row); }}>
                            <i className="ri-forbid-line align-middle" />
                        </Button>
                    ) : (
                        <Button className="farm-secondary-button btn-icon" onClick={(e) => { e.stopPropagation(); handleModalActivateSupplier(row); }}>
                            <i className="ri-check-fill align-middle"></i>
                        </Button>
                    )}

                    <Button className="farm-primary-button btn-icon" disabled={!row.status} onClick={(e) => { e.stopPropagation(); handleModalUpdateSupplier(row); }}>
                        <i className="ri-pencil-fill align-middle" />
                    </Button>

                    <Button className="farm-primary-button btn-icon" onClick={(e) => { e.stopPropagation(); setSelectedSupplier(row); toggleModal('details'); }}>
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

            setSuppliersData(suppliersResponse.data.data);

            setSupplierStatistics(statisticsResponse.data.data);

            const chartDataResponse = chartsResponse.data.data;

            // Filter status data to only include non-zero values
            const statusData: DonutDataItem[] = [];
            const activeCount = chartDataResponse.statusData.active || 0;
            const inactiveCount = chartDataResponse.statusData.inactive || 0;

            if (activeCount > 0) {
                statusData.push({ id: 'active', label: 'Activos', value: activeCount, color: '#10b981' });
            }
            if (inactiveCount > 0) {
                statusData.push({ id: 'inactive', label: 'Inactivos', value: inactiveCount, color: '#ef4444' });
            }

            const totalSuppliers = activeCount + inactiveCount;

            const statusLegendItems: DonutLegendItem[] = statusData.map(item => ({
                label: item.label,
                value: item.value.toString(),
                percentage: totalSuppliers > 0 ? `${((item.value / totalSuppliers) * 100).toFixed(1)}%` : '0%'
            }));

            // Filter category data to only include non-zero values
            const categoryData: DonutDataItem[] = [];
            const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

            if (chartDataResponse.categoryData) {
                Object.entries(chartDataResponse.categoryData).forEach(([category, count], index) => {
                    const numericCount = Number(count);
                    if (numericCount > 0) {
                        categoryData.push({
                            id: category,
                            label: getSupplierTypeLabel(category),
                            value: numericCount,
                            color: colors[index % colors.length]
                        });
                    }
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

    const handleBulkDeactivate = async () => {
        if (!configContext) return;

        const activeSupplierIds = selectedSuppliers.filter(s => s.status === true).map(s => s._id);

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_suppliers`, { data: { supplierIds: activeSupplierIds } });
            setAlertConfig({ visible: true, color: 'success', message: `${activeSupplierIds.length} proveedores desactivados con éxito` });
            fetchAllSupplierData();
            setSelectedSuppliers([]);
        } catch (error) {
            console.error('Error bulk deactivating suppliers:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al desactivar los proveedores, intentelo más tarde' });
        } finally {
            toggleModal('bulkDelete');
        }
    };

    const handleBulkActivate = async () => {
        if (!configContext) return;

        const inactiveSupplierIds = selectedSuppliers.filter(s => s.status === false).map(s => s._id);

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_suppliers`, { supplierIds: inactiveSupplierIds });
            setAlertConfig({ visible: true, color: 'success', message: `${inactiveSupplierIds.length} proveedores activados con éxito` });
            fetchAllSupplierData();
            setSelectedSuppliers([]);
        } catch (error) {
            console.error('Error bulk activating suppliers:', error);
            setAlertConfig({ visible: true, color: 'danger', message: 'Ha ocurrido un error al activar los proveedores, intentelo más tarde' });
        } finally {
            toggleModal('bulkActivate');
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
                <div className="row mb-3">
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
                        <div className="d-flex justify-content-between align-items-center">
                            {selectedSuppliers.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-muted">
                                        {selectedSuppliers.length} {selectedSuppliers.length === 1 ? 'proveedor seleccionado' : 'proveedores seleccionados'}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasActiveSuppliers}
                                            title={!hasActiveSuppliers ? "No hay proveedores activos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkDelete')}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            Desactivar
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasInactiveSuppliers}
                                            title={!hasInactiveSuppliers ? "No hay proveedores inactivos seleccionados" : undefined}
                                            onClick={() => toggleModal('bulkActivate')}
                                        >
                                            <i className="ri-check-line me-1"></i>
                                            Activar
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button className="farm-primary-button ms-auto" onClick={() => toggleModal('create')}>
                                <i className="ri-add-line me-2" />
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
                            <SelectableCustomTable
                                columns={supplierColumn}
                                data={suppliersData}
                                showPagination={false}
                                onSelect={handleSelectionChange}
                                selectionOnlyOnCheckbox={true}
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
                    <ModalHeader toggle={() => toggleModal("activate")}>Activar Proveedor</ModalHeader>
                    <ModalBody>¿Desea activar el proveedor {selectedSupplier?.name}?</ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleActivateSupplier(selectedSupplier.id)
                            }
                        }}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Deactivate */}
                <Modal isOpen={modals.bulkDelete} toggle={() => toggleModal("bulkDelete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkDelete")}>Desactivar Proveedores</ModalHeader>
                    <ModalBody>
                        ¿Desea desactivar {selectedSuppliers.filter(s => s.status === true).length} proveedores seleccionados?
                        <div className="mt-2">
                            <small className="text-muted">
                                Esta acción desactivará los proveedores y no podrán ser utilizados en el sistema.
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkDelete", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={handleBulkDeactivate}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Activate */}
                <Modal isOpen={modals.bulkActivate} toggle={() => toggleModal("bulkActivate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkActivate")}>Activar Proveedores</ModalHeader>
                    <ModalBody>
                        ¿Desea activar {selectedSuppliers.filter(s => s.status === false).length} proveedores seleccionados?
                        <div className="mt-2">
                            <small className="text-muted">
                                Esta acción activará los proveedores y podrán ser utilizados en el sistema.
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkActivate", false)}>Cancelar</Button>
                        <Button className="farm-primary-button" onClick={handleBulkActivate}>Confirmar</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={modals.details} toggle={() => { toggleModal('details'); fetchAllSupplierData(); }} size="xl" keyboard={false} backdrop='static' centered>
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