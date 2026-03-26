import { ConfigContext } from "App";
import { Column } from "common/data/data_types";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Badge, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import DatePicker from "react-flatpickr";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectableCustomTable from "../Tables/SelectableTable";
import SuccessModal from "../Shared/SuccessModal";
import ErrorModal from "../Shared/ErrorModal";

interface BulkGroupFeedingAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedGroups: any[];
    onSuccess: () => void;
}

const BulkGroupFeedingAssignmentModal: React.FC<BulkGroupFeedingAssignmentModalProps> = ({
    isOpen,
    onClose,
    selectedGroups,
    onSuccess
}) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ success: false, error: false });
    const [feedingPackages, setFeedingPackages] = useState<any[]>([]);
    const [selectedFeedingPackage, setSelectedFeedingPackage] = useState<any>(null);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const feedingPackagesColumns: Column<any>[] = [
        { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
        { header: 'Nombre', accessor: 'name', type: 'text', isFilterable: true },
        { header: 'Fecha de creacion', accessor: 'creation_date', type: 'date', isFilterable: true },
        {
            header: 'Periodicidad',
            accessor: 'periodicity',
            type: 'text',
            isFilterable: true,
            render: (_, row) => {
                let color = "secondary";
                let text = "Desconocido";

                switch (row.periodicity) {
                    case "daily": color = "info"; text = "Diaria"; break;
                    case "weekly": color = "primary"; text = "Semanal"; break;
                    case "monthly": color = "warning"; text = "Mensual"; break;
                    case "unique": color = "success"; text = "Única"; break;
                }

                return <Badge color={color}>{text}</Badge>;
            },
        },
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

    const bulkFeedingValidationSchema = Yup.object({
        packageId: Yup.string().required('Debe seleccionar un paquete de alimentación'),
        applicationDate: Yup.date().required('La fecha de aplicación es obligatoria'),
    });

    const bulkFeedingFormik = useFormik({
        initialValues: {
            packageId: '',
            name: '',
            applicationDate: null as Date | null,
            observations: '',
            appliedBy: userLogged?._id || '',
            periodicity: '',
            stage: ''
        },
        enableReinitialize: true,
        validationSchema: bulkFeedingValidationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!configContext) return;

            const groupIds = selectedGroups.map(group => group._id);

            try {
                setSubmitting(true);

                // 1. Asignar paquete de alimentación masivo a grupos
                await configContext.axiosHelper.create(
                    `${configContext.apiUrl}/feeding_package/asign_bulk_group_feeding_package/${userLogged.farm_assigned}`,
                    {
                        groupIds: groupIds,
                        packageData: {
                            packageId: values.packageId,
                            name: values.name,
                            applicationDate: values.applicationDate,
                            observations: values.observations,
                            appliedBy: values.appliedBy,
                            periodicity: values.periodicity,
                            stage: values.stage
                        }
                    }
                );

                // 2. Registrar en el historial del usuario
                await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
                    event: `Paquete de alimentación ${values.name} asignado a ${groupIds.length} grupos`
                });

                toggleModal('success', true);
            } catch (error: any) {
                console.error('Error bulk assigning feeding package to groups:', error);
                toggleModal('error', true);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleFeedingPackageSelection = (selected: any[]) => {
        if (selected.length > 0) {
            const pkg = selected[0];
            setSelectedFeedingPackage(pkg);
            bulkFeedingFormik.setFieldValue('packageId', pkg._id);
            bulkFeedingFormik.setFieldValue('name', pkg.name);
            bulkFeedingFormik.setFieldValue('periodicity', pkg.periodicity);
            bulkFeedingFormik.setFieldValue('stage', pkg.stage);
        } else {
            setSelectedFeedingPackage(null);
            bulkFeedingFormik.setFieldValue('packageId', '');
            bulkFeedingFormik.setFieldValue('name', '');
            bulkFeedingFormik.setFieldValue('periodicity', '');
            bulkFeedingFormik.setFieldValue('stage', '');
        }
    };

    const handleSuccessClose = () => {
        toggleModal('success', false);
        onClose();
        onSuccess();
        bulkFeedingFormik.resetForm();
        setSelectedFeedingPackage(null);
    };

    const handleClose = () => {
        onClose();
        bulkFeedingFormik.resetForm();
        setSelectedFeedingPackage(null);
    };

    const fetchFeedingPackages = async () => {
        if (!configContext || !userLogged) return;

        try {
            // Obtener el stage más común de los grupos seleccionados
            const stages = selectedGroups.map(g => g.stage);
            const mostCommonStage = stages.sort((a, b) =>
                stages.filter(v => v === a).length - stages.filter(v => v === b).length
            ).pop() || 'general';

            const feedingResponse = await configContext.axiosHelper.get(
                `${configContext.apiUrl}/feeding_package/find_by_stage/${userLogged.farm_assigned}/${mostCommonStage}`
            );
            const packagesWithId = feedingResponse.data.data.map((p: any) => ({ ...p, id: p._id }));
            setFeedingPackages(packagesWithId);
        } catch (error) {
            console.error('Error fetching feeding packages:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchFeedingPackages();
            bulkFeedingFormik.setFieldValue('applicationDate', new Date());
            setSelectedFeedingPackage(null);
        }
    }, [isOpen]);

    return (
        <>
            <Modal isOpen={isOpen} toggle={handleClose} size="lg" backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={handleClose}>
                    Asignar Alimentación a {selectedGroups.length} Grupos
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={bulkFeedingFormik.handleSubmit}>
                        <div className="mb-3">
                            <small className="text-muted">
                                Esta acción asignará el paquete de alimentación seleccionado a todos los grupos seleccionados.
                            </small>
                        </div>

                        <div className="mb-4">
                            <Label className="form-label fw-semibold">Seleccionar Paquete de Alimentación</Label>
                            {feedingPackages.length > 0 ? (
                                <>
                                    <SelectableCustomTable
                                        columns={feedingPackagesColumns}
                                        data={feedingPackages}
                                        showPagination={false}
                                        onSelect={handleFeedingPackageSelection}
                                        selectionOnlyOnCheckbox={false}
                                    />
                                    {bulkFeedingFormik.touched.packageId && bulkFeedingFormik.errors.packageId && (
                                        <div className="text-danger mt-2">{bulkFeedingFormik.errors.packageId}</div>
                                    )}
                                </>
                            ) : (
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="ri-error-warning-line fs-4 me-2 text-warning"></i>
                                    <div>
                                        <strong>No hay paquetes de alimentación disponibles</strong>
                                        <p className="mb-0 mt-1">No se encontraron paquetes de alimentación para esta etapa. Por favor, cree un paquete antes de continuar.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedFeedingPackage && (
                            <div className="alert alert-info">
                                <strong>Paquete seleccionado:</strong> {selectedFeedingPackage.name} ({selectedFeedingPackage.code})
                            </div>
                        )}

                        <div className="d-flex gap-2 mt-4">
                            <div className="w-50">
                                <Label htmlFor="applicationDate" className="form-label">Fecha de aplicación</Label>
                                <DatePicker
                                    id="applicationDate"
                                    className={`form-control ${bulkFeedingFormik.touched.applicationDate && bulkFeedingFormik.errors.applicationDate ? 'is-invalid' : ''}`}
                                    value={bulkFeedingFormik.values.applicationDate ?? undefined}
                                    onChange={(date: Date[]) => { if (date[0]) bulkFeedingFormik.setFieldValue('applicationDate', date[0]); }}
                                    options={{ dateFormat: 'd/m/Y' }}
                                />
                                {bulkFeedingFormik.touched.applicationDate && bulkFeedingFormik.errors.applicationDate && (
                                    <FormFeedback className="d-block">{bulkFeedingFormik.errors.applicationDate as string}</FormFeedback>
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
                                value={bulkFeedingFormik.values.observations}
                                onChange={bulkFeedingFormik.handleChange}
                                onBlur={bulkFeedingFormik.handleBlur}
                                placeholder="Observaciones adicionales sobre la aplicación masiva..."
                            />
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button className="farm-secondary-button" onClick={handleClose}>Cancelar</Button>
                    <Button
                        className="farm-primary-button"
                        onClick={() => bulkFeedingFormik.handleSubmit()}
                        disabled={bulkFeedingFormik.isSubmitting || !selectedFeedingPackage || feedingPackages.length === 0}
                    >
                        {bulkFeedingFormik.isSubmitting ? <Spinner size="sm" /> : 'Confirmar Asignación'}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal
                isOpen={modals.success}
                onClose={handleSuccessClose}
                message="El paquete de alimentación ha sido asignado exitosamente a los grupos seleccionados."
            />

            <ErrorModal
                isOpen={modals.error}
                onClose={() => toggleModal('error', false)}
                message="Ha ocurrido un error al asignar el paquete de alimentación. Por favor, inténtelo más tarde."
            />
        </>
    );
};

export default BulkGroupFeedingAssignmentModal;
