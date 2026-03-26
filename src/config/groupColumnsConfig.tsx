import { Column } from "common/data/data_types";
import { Badge, Button, UncontrolledTooltip } from "reactstrap";

export const getAreaColumn = (): Column<any> => ({
    header: 'Área',
    accessor: 'area',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        let color = "secondary";
        let text = "Desconocido";

        switch (row.area) {
            case "gestation":
                color = "info";
                text = "Gestación";
                break;
            case "farrowing":
                color = "primary";
                text = "Paridera";
                break;
            case "maternity":
                color = "primary";
                text = "Maternidad";
                break;
            case "weaning":
                color = "success";
                text = "Destete";
                break;
            case "nursery":
                color = "warning";
                text = "Preceba / Levante inicial";
                break;
            case "fattening":
                color = "dark";
                text = "Ceba / Engorda";
                break;
            case "replacement":
                color = "secondary";
                text = "Reemplazo / Recría";
                break;
            case "boars":
                color = "info";
                text = "Área de verracos";
                break;
            case "quarantine":
                color = "danger";
                text = "Cuarentena / Aislamiento";
                break;
            case "hospital":
                color = "danger";
                text = "Hospital / Enfermería";
                break;
            case "shipping":
                color = "secondary";
                text = "Corrales de venta / embarque";
                break;
        }

        return <Badge color={color}>{text}</Badge>;
    },
});

export const getStageColumn = (): Column<any> => ({
    header: 'Etapa',
    accessor: 'currentStage',
    render: (value, obj) => {
        let color = "secondary";
        let label = obj.stage;

        switch (obj.stage) {
            case "piglet":
                color = "info";
                label = "Lechón";
                break;
            case "weaning":
                color = "warning";
                label = "Destete";
                break;
            case "fattening":
                color = "primary";
                label = "Engorda";
                break;
            case "breeder":
                color = "success";
                label = "Reproductor";
                break;
        }

        return <Badge color={color}>{label}</Badge>;
    },
});

export const getWeanedStatusColumn = (): Column<any> => ({
    header: 'Estado',
    accessor: 'status',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        let color = "secondary";
        let text = "N/A";

        switch (row.status) {
            case "weaning":
                color = "info";
                text = "En destete";
                break;
            case "ready_to_grow":
                color = "primary";
                text = "Listo para crecimiento";
                break;
            case "grow_overdue":
                color = "primary";
                text = "Retrasado para crecimiento";
                break;
        }

        return <Badge color={color}>{text}</Badge>;
    },
});

export const getGeneralStatusColumn = (): Column<any> => ({
    header: 'Estado',
    accessor: 'status',
    type: 'text',
    isFilterable: true,
    render: (_, row) => {
        let color = "secondary";
        let text = "N/A";

        switch (row.status) {
            case "weaning":
                color = "info";
                text = "En destete";
                break;
            case "ready_to_grow":
                color = "primary";
                text = "Listo para crecimiento";
                break;
            case "grow_overdue":
                color = "warning";
                text = "Retrasado en crecimiento";
                break;
            case "growing":
                color = "success";
                text = "En crecimiento y ceba";
                break;
            case "replacement":
                color = "secondary";
                text = "Reemplazo";
                break;
            case "ready_for_sale":
                color = "success";
                text = "Listo para venta";
                break;
            case "sale":
                color = "success";
                text = "En venta";
                break;
            case "sold":
                color = "success";
                text = "Vendido";
                break;
        }

        return <Badge color={color}>{text}</Badge>;
    },
});

export const getActionsColumn = (
    navigate: (path: string) => void,
    setSelectedGroup: (group: any) => void,
    toggleModal: (modalName: 'create' | 'move' | 'asign' | 'withdraw', state?: boolean) => void
): Column<any> => ({
    header: "Acciones",
    accessor: "action",
    render: (value: any, row: any) => (
        <div className="d-flex gap-1">
            <Button id={`move-button-${row._id}`} className="btn-icon btn-warning" onClick={() => { setSelectedGroup(row); toggleModal('move'); }}>
                <i className="ri-arrow-left-right-line align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`move-button-${row._id}`}>
                Transferir cerdos
            </UncontrolledTooltip>

            <Button id={`withdraw-button-${row._id}`} className="btn-icon btn-danger" onClick={() => { setSelectedGroup(row); toggleModal('withdraw'); }}>
                <i className="ri-upload-2-line align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`withdraw-button-${row._id}`}>
                Retirar cerdo
            </UncontrolledTooltip>

            <Button id={`details-button-${row._id}`} className="btn-icon btn-success" onClick={() => navigate(`/groups/group_details/${row._id}`)}>
                <i className="ri-eye-fill align-middle"></i>
            </Button>
            <UncontrolledTooltip target={`details-button-${row._id}`}>
                Ver detalles
            </UncontrolledTooltip>
        </div >
    ),
});

export const getBaseColumns = (): Column<any>[] => [
    { header: 'Codigo', accessor: 'code', type: 'text', isFilterable: true },
];

export const getCountColumns = (): Column<any>[] => [
    {
        header: 'Hembras',
        accessor: 'femaleCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#fce4ec"
    },
    {
        header: 'Machos',
        accessor: 'maleCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#e3f2fd"
    },
    {
        header: 'Total',
        accessor: 'pigCount',
        type: 'text',
        isFilterable: true,
        bgColor: "#e8f5e8"
    },
];
