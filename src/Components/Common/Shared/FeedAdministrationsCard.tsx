import { Card, CardBody, CardHeader, Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { FiAlertCircle } from "react-icons/fi";
import { useState } from "react";
import { FeedAdministrationHistoryEntry } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import FeedAdministrationForm from "../Forms/FeedAdministrationForm";
import CustomTable from "../Tables/CustomTable";

type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface Props {
    administrations: FeedAdministrationHistoryEntry[];
    targetType: 'group' | 'litter' | 'pig';
    targetId: string;
    targetStage?: Stage;
    onAdministered: () => void;
    disabled?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
    piglet: "Lechón",
    sow: "Cerda",
    nursery: "Destete",
    grower: "Crecimiento",
    finisher: "Finalización",
};

const FeedAdministrationsCard = ({
    administrations,
    targetType,
    targetId,
    targetStage,
    onAdministered,
    disabled = false,
}: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasData = administrations && administrations.length > 0;

    const sorted = hasData
        ? [...administrations].sort(
            (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        )
        : [];

    const columns: Column<FeedAdministrationHistoryEntry>[] = [
        {
            header: 'Fecha',
            accessor: 'applicationDate',
            type: 'text',
            render: (_, row) => (
                <span>{new Date(row.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
            ),
        },
        {
            header: 'Alimento preparado',
            accessor: 'preparedProduct',
            type: 'text',
            render: (_, row) => <span className="fw-semibold">{row.preparedProduct?.name ?? "—"}</span>,
        },
        {
            header: 'Receta origen',
            accessor: 'recipe',
            type: 'text',
            render: (_, row) => (
                <span>
                    {row.recipe
                        ? `${row.recipe.code} — ${row.recipe.name}${row.recipe.stage ? ` (${STAGE_LABELS[row.recipe.stage] ?? row.recipe.stage})` : ""}`
                        : "—"}
                </span>
            ),
        },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            type: 'currency',
            bgColor: '#e3f2fd',
            render: (_, row) => (
                <span className="fw-semibold">{row.quantity.toFixed(2)} {row.preparedProduct?.unit_measurement || 'kg'}</span>
            ),
        },
        {
            header: 'Responsable',
            accessor: 'appliedBy',
            type: 'text',
            render: (_, row) => <span>{row.appliedBy ? `${row.appliedBy.name} ${row.appliedBy.lastname}` : "—"}</span>,
        },
        {
            header: 'Observaciones',
            accessor: 'observations',
            type: 'text',
            render: (_, row) => <span>{row.observations?.trim() || "—"}</span>,
        },
    ];

    return (
        <>
            <Card className="w-100 h-100 m-0">
                <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                    <h5 className="mb-0 fw-semibold">Administraciones de alimento</h5>
                    <Button size="sm" color="primary" onClick={() => setIsModalOpen(true)} disabled={disabled}>
                        <i className="ri-add-line me-1" />
                        Administrar alimento
                    </Button>
                </CardHeader>
                <CardBody
                    className={!hasData ? "d-flex justify-content-center align-items-center" : ""}
                    style={{ overflowY: "auto" }}
                >
                    {!hasData ? (
                        <div className="text-center">
                            <FiAlertCircle className="text-muted" size={22} />
                            <span className="fs-5 text-muted text-center rounded-5 ms-2">
                                No hay administraciones registradas
                            </span>
                        </div>
                    ) : (
                        <CustomTable
                            columns={columns}
                            data={sorted}
                            showSearchAndFilter={false}
                            showPagination={sorted.length > 10}
                            rowsPerPage={10}
                            fontSize={14}
                        />
                    )}
                </CardBody>
            </Card>

            <Modal
                size="xl"
                isOpen={isModalOpen}
                toggle={() => setIsModalOpen(false)}
                backdrop="static"
                keyboard={false}
                centered
            >
                <ModalHeader toggle={() => setIsModalOpen(false)}>Registrar administración de alimento</ModalHeader>
                <ModalBody>
                    <FeedAdministrationForm
                        targetType={targetType}
                        targetId={targetId}
                        targetStage={targetStage}
                        isBulk={false}
                        onSave={() => {
                            setIsModalOpen(false);
                            onAdministered();
                        }}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </ModalBody>
            </Modal>
        </>
    );
};

export default FeedAdministrationsCard;
