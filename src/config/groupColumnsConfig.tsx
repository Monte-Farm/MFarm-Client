import { Column } from "common/data/data_types";
import { Badge, Button, UncontrolledTooltip } from "reactstrap";

type TFunc = (key: string, options?: Record<string, any>) => string;

const AREA_COLORS: Record<string, string> = {
    gestation: 'info',
    farrowing: 'primary',
    maternity: 'primary',
    weaning: 'success',
    nursery: 'warning',
    fattening: 'dark',
    replacement: 'secondary',
    boars: 'info',
    quarantine: 'danger',
    hospital: 'danger',
    shipping: 'secondary',
    exit: 'secondary',
    sale: 'success',
};

const STATUS_COLORS: Record<string, string> = {
    weaning: 'info',
    ready_to_grow: 'primary',
    grow_overdue: 'warning',
    growing: 'success',
    replacement: 'secondary',
    ready_for_sale: 'success',
    sale: 'success',
    sold: 'success',
};

const STAGE_COLORS: Record<string, string> = {
    piglet: 'info',
    weaning: 'warning',
    fattening: 'primary',
    finishing: 'primary',
    breeder: 'success',
    general: 'secondary',
};

export const getAreaColumn = (t: TFunc): Column<any> => ({
    header: t('groups.column.area'),
    accessor: 'area',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        const color = AREA_COLORS[row.area] || 'secondary';
        const text = t(`groups.area.${row.area}`, { defaultValue: row.area });
        return <Badge color={color}>{text}</Badge>;
    },
});

export const getStageColumn = (t: TFunc): Column<any> => ({
    header: t('groups.column.stage'),
    accessor: 'currentStage',
    render: (_, row) => {
        const color = STAGE_COLORS[row.stage] || 'secondary';
        const label = t(`groups.stage.${row.stage}`, { defaultValue: row.stage });
        return <Badge color={color}>{label}</Badge>;
    },
});

export const getWeanedStatusColumn = (t: TFunc): Column<any> => ({
    header: t('groups.column.status'),
    accessor: 'status',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        const WEANED_COLORS: Record<string, string> = {
            weaning: 'info',
            ready_to_grow: 'primary',
            grow_overdue: 'primary',
        };
        const color = WEANED_COLORS[row.status] || 'secondary';
        const text = t(`groups.status.${row.status}`, { defaultValue: row.status });
        return <Badge color={color}>{text}</Badge>;
    },
});

export const getGeneralStatusColumn = (t: TFunc): Column<any> => ({
    header: t('groups.column.status'),
    accessor: 'status',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        const color = STATUS_COLORS[row.status] || 'secondary';
        const text = t(`groups.status.${row.status}`, { defaultValue: t('groups.status.na') });
        return <Badge color={color}>{text}</Badge>;
    },
});

export const getActionsColumn = (
    navigate: (path: string) => void,
    setSelectedGroup: (group: any) => void,
    toggleModal: (modalName: 'create' | 'move' | 'asign' | 'withdraw', state?: boolean) => void,
    t: TFunc
): Column<any> => ({
    header: t('groups.column.actions'),
    accessor: "action",
    render: (_: any, row: any) => (
        <div className="d-flex gap-1">
            <Button id={`move-button-${row._id}`} className="btn-icon btn-warning" onClick={() => { setSelectedGroup(row); toggleModal('move'); }}>
                <i className="ri-arrow-left-right-line align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`move-button-${row._id}`}>
                {t('groups.action.transfer')}
            </UncontrolledTooltip>

            <Button id={`withdraw-button-${row._id}`} className="btn-icon btn-danger" onClick={() => { setSelectedGroup(row); toggleModal('withdraw'); }}>
                <i className="ri-upload-2-line align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`withdraw-button-${row._id}`}>
                {t('groups.action.withdraw')}
            </UncontrolledTooltip>

            <Button id={`details-button-${row._id}`} className="btn-icon btn-success" onClick={() => navigate(`/groups/group_details/${row._id}`)}>
                <i className="ri-eye-fill align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`details-button-${row._id}`}>
                {t('groups.action.viewDetails')}
            </UncontrolledTooltip>
        </div>
    ),
});

export const getBaseColumns = (t: TFunc): Column<any>[] => [
    { header: t('groups.column.code'), accessor: 'code', type: 'text', isFilterable: true },
];

export const getCountColumns = (t: TFunc): Column<any>[] => [
    {
        header: t('groups.column.femaleCount'),
        accessor: 'femaleCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#fce4ec"
    },
    {
        header: t('groups.column.maleCount'),
        accessor: 'maleCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#e3f2fd"
    },
    {
        header: t('groups.column.total'),
        accessor: 'pigCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#e8f5e8"
    },
];
