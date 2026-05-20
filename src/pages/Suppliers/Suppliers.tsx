import { logger } from 'utils/logger';
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, CardBody, CardHeader, Container, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
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
import { getEffectiveUser } from "helpers/impersonation_helper";
import PDFViewer from "Components/Common/Shared/PDFViewer";

const isTablet = () => {
  const w = document.documentElement.clientWidth;
  return w >= 768 && w <= 1024;
};

const Suppliers = () => {
    const { t } = useTranslation();
    document.title = t('warehouse.suppliers.pageTitle')
    const configContext = useContext(ConfigContext)
    const userLogged = getEffectiveUser();

    const [suppliersData, setSuppliersData] = useState([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [fileURL, setFileURL] = useState<string | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<any | undefined>(undefined);
    const [selectedSuppliers, setSelectedSuppliers] = useState<SupplierData[]>([]);
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [tabletMode, setTabletMode] = useState(isTablet);
    const [modals, setModals] = useState({ create: false, update: false, delete: false, activate: false, details: false, bulkDelete: false, bulkActivate: false, viewPDF: false });
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
        { header: t('common.field.code'), accessor: 'id', isFilterable: true, type: 'text' },
        { header: t('warehouse.suppliers.col.supplier'), accessor: 'name', isFilterable: true, type: 'text' },
        {
            header: t('warehouse.suppliers.col.category'),
            accessor: 'supplier_type',
            isFilterable: true,
            type: 'text',
            render: (value, row) => <span>{t(`warehouse.common.supplierType.${row.supplier_type}`, { defaultValue: row.supplier_type })}</span>
        },
        { header: t('warehouse.suppliers.col.phone'), accessor: 'phone_number', type: 'text' },
        { header: t('warehouse.suppliers.col.address'), accessor: 'address', type: 'text' },
        {
            header: t('common.field.status'), accessor: "status",
            render: (value: boolean) => (
                <Badge color={value === true ? "success" : "danger"}>
                    {t(`common.status.${value === true ? 'active' : 'inactive'}`)}
                </Badge>
            ),
            isFilterable: true,
        },
        {
            header: t('common.field.actions'),
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

    const handleGeneratePDF = async () => {
        if (!configContext || !userLogged) return;
        try {
            setPdfLoading(true);
            const response = await configContext.axiosHelper.getBlob(
                `${configContext.apiUrl}/reports/suppliers/all?farm_id=${userLogged.farm_assigned}`
            );
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            setFileURL(window.URL.createObjectURL(pdfBlob));
            toggleModal('viewPDF');
        } catch (error) {
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.generatePdf') });
        } finally {
            setPdfLoading(false);
        }
    };

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
                statusData.push({ id: 'active', label: t('common.status.active'), value: activeCount, color: '#10b981' });
            }
            if (inactiveCount > 0) {
                statusData.push({ id: 'inactive', label: t('common.status.inactive'), value: inactiveCount, color: '#ef4444' });
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
                            label: t(`warehouse.common.supplierType.${category}`, { defaultValue: category }),
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
            logger.error('Error fetching supplier data:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.fetch') });
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
            await configContext.axiosHelper.create(`${configContext.apiUrl}/supplier/create_supplier`, { ...data, farmId: userLogged.farm_assigned });
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.create') })
            fetchAllSupplierData();
        } catch (error) {
            logger.error('Error creating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.create') });
        } finally {
            toggleModal('create', false);
        }
    };

    const handleUpdateSupplier = async (data: SupplierData) => {
        if (!configContext) return;
        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/update_supplier/${data.id}`, data);
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.update') })
        } catch (error) {
            logger.error('Error updating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.update') });
        } finally {
            toggleModal('update', false);
        }
    };

    const handleDeactivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_supplier/${supplierId}`);
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.deactivate') })
        } catch (error) {
            logger.error('Error deactivating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.deactivate') });
        } finally {
            toggleModal('delete', false);
        }
    };

    const handleActivateSupplier = async (supplierId: string) => {
        if (!configContext) return;

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_supplier/${supplierId}`, {});
            fetchAllSupplierData();
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.activate') })
        } catch (error) {
            logger.error('Error activating supplier:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.activate') });
        } finally {
            toggleModal('activate', false);
        }
    };

    const handleBulkDeactivate = async () => {
        if (!configContext) return;

        const activeSupplierIds = selectedSuppliers.filter(s => s.status === true).map(s => s._id);

        try {
            await configContext.axiosHelper.delete(`${configContext.apiUrl}/supplier/delete_suppliers`, { data: { supplierIds: activeSupplierIds } });
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.bulkDeactivate', { count: activeSupplierIds.length }) });
            fetchAllSupplierData();
            setSelectedSuppliers([]);
        } catch (error) {
            logger.error('Error bulk deactivating suppliers:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.bulkDeactivate') });
        } finally {
            toggleModal('bulkDelete');
        }
    };

    const handleBulkActivate = async () => {
        if (!configContext) return;

        const inactiveSupplierIds = selectedSuppliers.filter(s => s.status === false).map(s => s._id);

        try {
            await configContext.axiosHelper.put(`${configContext.apiUrl}/supplier/activate_suppliers`, { supplierIds: inactiveSupplierIds });
            setAlertConfig({ visible: true, color: 'success', message: t('warehouse.suppliers.success.bulkActivate', { count: inactiveSupplierIds.length }) });
            fetchAllSupplierData();
            setSelectedSuppliers([]);
        } catch (error) {
            logger.error('Error bulk activating suppliers:', error);
            setAlertConfig({ visible: true, color: 'danger', message: t('warehouse.suppliers.error.bulkActivate') });
        } finally {
            toggleModal('bulkActivate');
        }
    };

    useEffect(() => {
        fetchAllSupplierData();
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
                <BreadCrumb pageTitle={t('warehouse.suppliers.pageHeader')} title={t('warehouse.suppliers.breadcrumb')} ></BreadCrumb>

                {/* KPIs Section */}
                <div className="row g-3 mb-3">
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.suppliers.kpi.total')}
                            value={supplierStatistics?.totalSuppliers}
                            icon={<i className="ri-truck-line fs-20 text-primary"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.suppliers.kpi.active')}
                            value={supplierStatistics?.activeSuppliers}
                            icon={<i className="ri-checkbox-circle-line fs-20 text-success"></i>}
                            iconBgColor="#E8F5E9"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.suppliers.kpi.inactive')}
                            value={supplierStatistics?.inactiveSuppliers}
                            icon={<i className="ri-close-circle-line fs-20 text-danger"></i>}
                            iconBgColor="#FEE2E2"
                            animateValue={true}
                            durationSeconds={1.5}
                        />
                    </div>
                    <div className="col-xl-3 col-md-6">
                        <StatKpiCard
                            title={t('warehouse.suppliers.kpi.activationRate')}
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
                <div className="row g-3 mb-4">
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.suppliers.chart.status')}
                            data={chartData.statusData}
                            legendItems={chartData.statusLegendItems}
                            height={200}
                        />
                    </div>
                    <div className="col-xl-6">
                        <DonutChartCard
                            title={t('warehouse.suppliers.chart.byCategory')}
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
                                        {selectedSuppliers.length} {selectedSuppliers.length === 1 ? t('warehouse.suppliers.selection.single') : t('warehouse.suppliers.selection.plural')}
                                    </span>
                                    <div className="btn-group" role="group">
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasActiveSuppliers}
                                            onClick={() => toggleModal('bulkDelete')}
                                        >
                                            <i className="ri-forbid-line me-1"></i>
                                            {t('warehouse.products.button.deactivate')}
                                        </Button>
                                        <Button
                                            className="farm-secondary-button btn-sm"
                                            disabled={!hasInactiveSuppliers}
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
                                    {t('warehouse.suppliers.button.add')}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardBody className={suppliersData.length === 0 ? "d-flex flex-column justify-content-center align-items-center text-center" : "d-flex flex-column flex-grow-1"}>
                        {suppliersData.length === 0 ? (
                            <>
                                <i className="ri-truck-line text-muted mb-2" style={{ fontSize: "2rem" }} />
                                <span className="fs-5 text-muted">{t('warehouse.suppliers.empty')}</span>
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
                <Modal isOpen={modals.create} toggle={() => toggleModal('create')} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => toggleModal('create')}>{t('warehouse.suppliers.modal.create')}</ModalHeader>
                    <ModalBody>
                        <SupplierForm onSubmit={handleCreateSupplier} onCancel={() => toggleModal('create', false)} isCodeDisabled={false}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal Update */}
                <Modal isOpen={modals.update} toggle={() => toggleModal('update')} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => toggleModal('update')}>{t('warehouse.suppliers.modal.update')}</ModalHeader>
                    <ModalBody>
                        <SupplierForm initialData={selectedSupplier} onSubmit={handleUpdateSupplier} onCancel={() => toggleModal('update', false)} isCodeDisabled={true}></SupplierForm>
                    </ModalBody>
                </Modal>

                {/* Modal delete */}
                <Modal isOpen={modals.delete} toggle={() => toggleModal('delete')} size="md" keyboard={false} backdrop="static" centered>
                    <ModalHeader toggle={() => toggleModal('delete')}>{t('warehouse.suppliers.modal.deleteConfirmation')}</ModalHeader>
                    <ModalBody>
                        {t('warehouse.suppliers.modal.confirmDeactivate', { name: selectedSupplier?.name })}
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal('delete', false)}>{t('common.button.cancel')}</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleDeactivateSupplier(selectedSupplier.id);
                            }
                        }}
                        >
                            {t('common.button.delete')}
                        </Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Activate */}
                <Modal isOpen={modals.activate} toggle={() => toggleModal("activate")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("activate")}>{t('warehouse.suppliers.modal.activate')}</ModalHeader>
                    <ModalBody>{t('warehouse.suppliers.modal.confirmActivate', { name: selectedSupplier?.name })}</ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("activate", false)}>{t('common.button.cancel')}</Button>
                        <Button className="farm-primary-button" onClick={() => {
                            if (selectedSupplier) {
                                handleActivateSupplier(selectedSupplier.id)
                            }
                        }}>{t('common.button.confirm')}</Button>
                    </ModalFooter>
                </Modal>

                {/* Modal Bulk Deactivate */}
                <Modal isOpen={modals.bulkDelete} toggle={() => toggleModal("bulkDelete")} backdrop='static' keyboard={false} centered>
                    <ModalHeader toggle={() => toggleModal("bulkDelete")}>{t('warehouse.suppliers.modal.bulkDeactivate')}</ModalHeader>
                    <ModalBody>
                        {t('warehouse.suppliers.modal.confirmBulkDeactivate', { count: selectedSuppliers.filter(s => s.status === true).length })}
                        <div className="mt-2">
                            <small className="text-muted">
                                {t('warehouse.suppliers.modal.bulkDeactivateNote')}
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
                    <ModalHeader toggle={() => toggleModal("bulkActivate")}>{t('warehouse.suppliers.modal.bulkActivate')}</ModalHeader>
                    <ModalBody>
                        {t('warehouse.suppliers.modal.confirmBulkActivate', { count: selectedSuppliers.filter(s => s.status === false).length })}
                        <div className="mt-2">
                            <small className="text-muted">
                                {t('warehouse.suppliers.modal.bulkActivateNote')}
                            </small>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button className="farm-secondary-button" onClick={() => toggleModal("bulkActivate", false)}>{t('common.button.cancel')}</Button>
                        <Button className="farm-primary-button" onClick={handleBulkActivate}>{t('common.button.confirm')}</Button>
                    </ModalFooter>
                </Modal>

                <Modal isOpen={modals.details} toggle={() => { toggleModal('details'); fetchAllSupplierData(); }} size="xl" keyboard={false} backdrop='static' centered fullscreen={tabletMode}>
                    <ModalHeader toggle={() => { toggleModal('details'); fetchAllSupplierData(); }}>{t('warehouse.suppliers.modal.details')}</ModalHeader>
                    <ModalBody>
                        <SupplierDetailsModal supplierId={selectedSupplier?._id} />
                    </ModalBody>
                </Modal>

            </Container>

            <Modal size="xl" isOpen={modals.viewPDF} toggle={() => toggleModal("viewPDF")} backdrop="static" keyboard={false} centered fullscreen={true}>
                <ModalHeader toggle={() => toggleModal("viewPDF")}>{t('warehouse.suppliers.modal.report')}</ModalHeader>
                <ModalBody>
                    {fileURL && <PDFViewer fileUrl={fileURL} />}
                </ModalBody>
            </Modal>

            <AlertMessage color={alertConfig.color} message={alertConfig.message} visible={alertConfig.visible} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </div >
    )
}


export default Suppliers;
