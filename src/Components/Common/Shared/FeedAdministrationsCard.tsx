import { Card, CardBody, CardHeader, Button, Modal, ModalBody, ModalHeader } from "reactstrap";
import { FiAlertCircle } from "react-icons/fi";
import { useState } from "react";
import { FeedAdministrationHistoryEntry } from "common/data_interfaces";
import { Column } from "common/data/data_types";
import FeedAdministrationForm from "../Forms/FeedAdministrationForm";
import CustomTable from "../Tables/CustomTable";
import { useTranslation } from "react-i18next";

type Stage = 'piglet' | 'sow' | 'nursery' | 'grower' | 'finisher' | 'general';

interface Props {
    administrations: FeedAdministrationHistoryEntry[];
    targetType: 'group' | 'litter' | 'pig';
    targetId: string;
    targetStage?: Stage;
    onAdministered: () => void;
    disabled?: boolean;
}

const FeedAdministrationsCard = ({
    administrations,
    targetType,
    targetId,
    targetStage,
    onAdministered,
    disabled = false,
}: Props) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasData = administrations && administrations.length > 0;

    const sorted = hasData
        ? [...administrations].sort(
            (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
        )
        : [];

    const columns: Column<FeedAdministrationHistoryEntry>[] = [
        {
            header: t('feeding.administration.column.date'),
            accessor: 'applicationDate',
            type: 'text',
            render: (_, row) => (
                <span>{new Date(row.applicationDate).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
            ),
        },
        {
            header: t('feeding.administration.column.preparedFeed'),
            accessor: 'preparedProduct',
            type: 'text',
            render: (_, row) => <span className="fw-semibold">{row.preparedProduct?.name ?? "—"}</span>,
        },
        {
            header: t('feeding.administration.column.sourceRecipe'),
            accessor: 'recipe',
            type: 'text',
            render: (_, row) => (
                <span>
                    {row.recipe
                        ? `${row.recipe.code} — ${row.recipe.name}${row.recipe.stage ? ` (${t(`feeding.stage.${row.recipe.stage}`, { defaultValue: row.recipe.stage })})` : ""}`
                        : "—"}
                </span>
            ),
        },
        {
            header: t('feeding.administration.column.quantity'),
            accessor: 'quantity',
            type: 'currency',
            bgColor: '#e3f2fd',
            render: (_, row) => (
                <span className="fw-semibold">{row.quantity.toFixed(2)} {row.preparedProduct?.unit_measurement || 'kg'}</span>
            ),
        },
        {
            header: t('feeding.administration.column.responsible'),
            accessor: 'appliedBy',
            type: 'text',
            render: (_, row) => <span>{row.appliedBy ? `${row.appliedBy.name} ${row.appliedBy.lastname}` : "—"}</span>,
        },
        {
            header: t('feeding.administration.column.observations'),
            accessor: 'observations',
            type: 'text',
            render: (_, row) => <span>{row.observations?.trim() || "—"}</span>,
        },
    ];

    return (
        <>
            <Card className="w-100 h-100 m-0">
                <CardHeader className="bg-white d-flex justify-content-between align-items-center border-bottom">
                    <h5 className="mb-0 fw-semibold">{t('feeding.administration.card.title')}</h5>
                    <Button size="sm" color="primary" onClick={() => setIsModalOpen(true)} disabled={disabled}>
                        <i className="ri-add-line me-1" />
                        {t('feeding.administration.card.button')}
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
                                {t('feeding.administration.card.noRecords')}
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
                <ModalHeader toggle={() => setIsModalOpen(false)}>{t('feeding.administration.card.registerModal')}</ModalHeader>
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
