import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectableCustomTable from "../Tables/SelectableTable";
import MissingStockModal from "../Shared/MissingStockModal";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface BulkGroupMedicationAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroups: any[];
    onSuccess: () => void;
}

const BulkGroupMedicationAssignmentModal: React.FC<BulkGroupMedicationAssignmentModalProps> = ({
    isOpen,
    onClose,
    selectedGroups,
    onSuccess
}) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false, missingStock: false, subwarehouseError: false });
    const [medicationPackages, setMedicationPackages] = useState<any[]>([]);
    const [selectedMedicationPackage, setSelectedMedicationPackage] = useState<any>(null);
    const [missingItems, setMissingItems] = useState([]);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const medicationPackagesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Etapa',
            accessor: 'stage',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.stage) {
                    case "general": color = "info"; text = "General"; break;
                    case "piglet": color = "info"; text = "Lechón"; break;
                    case "weaning": color = "warning"; text = "Destete"; break;
                    case "fattening": color = "primary"; text = "Engorda"; break;
                    case "breeder": color = "success"; text = "Reproductor"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
    ];

    const bulkMedicationValidationSchema = Yup.object({
        packageId: Yup.string().required('Debe seleccionar un paquete de medicación'),
        applicationDate: Yup.date().required('La fecha de aplicación es obligatoria'),
    });

    const bulkMedicationFormik = useFormik({
        initialValues: {
            packageId: '',
            name: '',
            applicationDate: null as Date | null,
            observations: '',
            appliedBy: userLogged?._id || '',
        },
        enableReinitialize: true,
        validationSchema: bulkMedicationValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;
            
            const groupIds = selectedGroups.map(group => group._id);

            try {
                setSubmitting(true);
                
                // 1. Asignar paquete de medicación masivo a grupos
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/medication_package/asign_bulk_group_medication_package/${userLogged.farm_assigned}`,
                    {
                        groupIds: groupIds,
                        packageId: values.packageId,
                        name: values.name,
                        applicationDate: values.applicationDate,
                        observations: values.observations,
                        appliedBy: values.appliedBy
                    }
                );

                // 2. Registrar en el historial del usuario
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de medicación ${values.name} asignado a ${groupIds.length} grupos`
                });

                toggleModal('success', true);
            } catch (error: any) {
                console.error('Error bulk assigning medication package to groups:', error);
                
                // Manejo crítico de errores
                if (error.response?.status === 400 && error.response?.data?.missing) {
                    setMissingItems(error.response.data.missing);
                    toggleModal('missingStock', true);
                    return;
                }

                if (error.response?.status === 400 && !error.response?.data?.missing) {
                    toggleModal('subwarehouseError', true);
                    return;
                }

                toggleModal('error', true);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleMedicationPackageSelection = (selected: any[]) => {
        if (selected.length > 0) {
            const pkg = selected[0];
            setSelectedMedicationPackage(pkg);
            bulkMedicationFormik.setFieldValue('packageId', pkg._id);
            bulkMedicationFormik.setFieldValue('name', pkg.name);
        } else {
            setSelectedMedicationPackage(null);
            bulkMedicationFormik.setFieldValue('packageId', '');
            bulkMedicationFormik.setFieldValue('name', '');
        }
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        bulkMedicationFormik.resetForm();
        setSelectedMedicationPackage(null);
    };

    const handleClose = () => {
        onClose();
        bulkMedicationFormik.resetForm();
        setSelectedMedicationPackage(null);
    };

    const fetchMedicationPackages = async () => {
        if (!configContext || !userLogged) return;
        
        try {
            // Obtener el stage más común de los grupos seleccionados
            const stages = selectedGroups.map(g => g.stage);
            const mostCommonStage = stages.sort((a, b) =>
                stages.filter(v => v === a).length - stages.filter(v => v === b).length
            ).pop() || 'general';

            const medicationResponse = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/medication_package/find_by_stage/${userLogged.farm_assigned}/${mostCommonStage}`
            );
            const packagesWithId = medicationResponse.data.data.map((p: any) => ({ ...p, id: p._id }));
            setMedicationPackages(packagesWithId);
        } catch (error) {
            console.error('Error fetching medication packages:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMedicationPackages();
            bulkMedicationFormik.setFieldValue('applicationDate', new Date());
            setSelectedMedicationPackage(null);
        }
    }, [isOpen]);

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    Asignar Medicación a {selectedGroups.length} Grupos
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkMedicationFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                Esta acción asignará el paquete de medicación seleccionado a todos los grupos seleccionados.
                            </small>
                        </div>

                        <div className="mb-4">
                            <Label className="form-label fw-semibold">Seleccionar Paquete de Medicación</Label>
                            {medicationPackages.length > 0 ? (
                                <>
                                    <SelectableCustomTable
                                        columns={medicationPackagesColumns}
                                        data={medicationPackages}
                                        showPagination={false}
                                        onSelect={handleMedicationPackageSelection}
                                        selectionOnlyOnCheckbox={false}
                                    />
                                    {bulkMedicationFormik.touched.packageId && bulkMedicationFormik.errors.packageId && (
                                        <div className="text-danger mt-2">{bulkMedicationFormik.errors.packageId}</div>
                                    )}
                                </>
                            ) : (
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="ri-error-warning-line fs-4 me-2 text-warning"></i>
                                    <div>
                                        <strong>No hay paquetes de medicación disponibles</strong>
                                        <p className="mb-0 mt-1">No se encontraron paquetes de medicación para esta etapa. Por favor, cree un paquete antes de continuar.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedMedicationPackage && (
                            <div className="alert alert-info">
                                <strong>Paquete seleccionado:</strong> {selectedMedicationPackage.name} ({selectedMedicationPackage.code})
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="applicationDate" className="form-label">Fecha de aplicación</Label>
                                <DatePicker
                                    id="applicationDate"
                                    className={`form-control ${bulkMedicationFormik.touched.applicationDate && bulkMedicationFormik.errors.applicationDate ? 'is-invalid' : ''}`}
                                    value={bulkMedicationFormik.values.applicationDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkMedicationFormik.setFieldValue('applicationDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkMedicationFormik.touched.applicationDate && bulkMedicationFormik.errors.applicationDate && (
                                    <FormFeedback className="d-block">{bulkMedicationFormik.errors.applicationDate as string}</FormFeedback>
                                )}
                            </div>

                            <div className="w-50">
                                <Label htmlFor="appliedBy" className="form-label">Responsable</Label>
                                <Input
                                    type="text"
                                    id="appliedBy"
                                    name="appliedBy"
                                    value={`${userLogged?.name} ${userLogged?.lastname}`}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Label htmlFor="observations" className="form-label">Observaciones</Label>
                            <Input
                                type="textarea"
                                id="observations"
                                name="observations"
                                rows={3}
                                value={bulkMedicationFormik.values.observations}
                                onChange={bulkMedicationFormik.handleChange}
                                onBlur={bulkMedicationFormik.handleBlur}
                                placeholder="Observaciones adicionales sobre la aplicación masiva..."
                            />
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={handleClose}>Cancelar</Button>
                    <Button 
                        className="farm-primary-button" 
                        onClick={() => bulkMedicationFormik.handleSubmit()} 
                        disabled={bulkMedicationFormik.isSubmitting || !selectedMedicationPackage || medicationPackages.length === 0}
                    >
                        {bulkMedicationFormik.isSubmitting ? <Spinner size="sm" /> : 'Confirmar Asignación'}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message="El paquete de medicación ha sido asignado exitosamente a los grupos seleccionados."
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message="Ha ocurrido un error al asignar el paquete de medicación. Por favor, inténtelo más tarde."
            />

            <MissingStockModal
                isOpen={modals.missingStock}
                onClose={() => toggleModal('missingStock', false)}
                missingItems={missingItems}
            />

            <Modal isOpen={modals.subwarehouseError} toggle={() => toggleModal('subwarehouseError', false)} centered>
                <ModalHeader toggle={() => toggleModal('subwarehouseError', false)}>
                    Error de Configuración
                </ModalHeader>
                <ModalBody>
                    <div className="text-center">
                        <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#f06548' }}></i>
                        <h5 className="mt-3">No se encontró un subalmacén configurado</h5>
                        <p className="text-muted">
                            Por favor, configure un subalmacén para poder asignar medicación a los grupos.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => toggleModal('subwarehouseError', false)}>
                        Cerrar
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default BulkGroupMedicationAssignmentModal;
