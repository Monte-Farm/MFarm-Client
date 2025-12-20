import { Badge } from "reactstrap";

interface SicknessSymptomsSummaryProps {
    symptoms: string[];
}

interface SymptomCategory {
    title: string;
    icon: string;
    color: string;
    options: {
        key: string;
        label: string;
    }[];
}

const SYMPTOMS_CATALOG: SymptomCategory[] = [
    {
        title: "Respiratorios",
        icon: "fa-solid fa-lungs",
        color: "info",
        options: [
            { key: "cough", label: "Tos" },
            { key: "sneezing", label: "Estornudos" },
            { key: "nasal_discharge", label: "Secreción nasal" },
            { key: "difficulty_breathing", label: "Dificultad respiratoria" },
            { key: "open_mouth_breathing", label: "Respiración con la boca abierta" },
        ],
    },
    {
        title: "Generales",
        icon: "fa-solid fa-temperature-high",
        color: "warning",
        options: [
            { key: "fever", label: "Fiebre" },
            { key: "lethargy", label: "Decaimiento" },
            { key: "loss_of_appetite", label: "Pérdida de apetito" },
            { key: "weight_loss", label: "Pérdida de peso" },
            { key: "isolation", label: "Aislamiento del grupo" },
        ],
    },
    {
        title: "Digestivos",
        icon: "fa-solid fa-notes-medical",
        color: "success",
        options: [
            { key: "diarrhea", label: "Diarrea" },
            { key: "bloody_diarrhea", label: "Diarrea con sangre" },
            { key: "vomiting", label: "Vómitos" },
            { key: "abdominal_swelling", label: "Abdomen inflamado" },
            { key: "dehydration", label: "Deshidratación" },
        ],
    },
    {
        title: "Locomotores",
        icon: "fa-solid fa-person-walking",
        color: "primary",
        options: [
            { key: "lameness", label: "Cojera" },
            { key: "joint_swelling", label: "Inflamación articular" },
            { key: "difficulty_standing", label: "Dificultad para levantarse" },
        ],
    },
    {
        title: "Neurológicos",
        icon: "fa-solid fa-brain",
        color: "dark",
        options: [
            { key: "tremors", label: "Temblores" },
            { key: "incoordination", label: "Descoordinación" },
            { key: "convulsions", label: "Convulsiones" },
            { key: "head_tilt", label: "Cabeza ladeada" },
            { key: "circling", label: "Camina en círculos" },
        ],
    },
    {
        title: "Signos de alarma",
        icon: "fa-solid fa-triangle-exclamation",
        color: "danger",
        options: [
            { key: "cyanosis", label: "Coloración azulada" },
            { key: "edema", label: "Edema / hinchazón" },
            { key: "sudden_death", label: "Muerte súbita" },
        ],
    },
];

const SicknessSymptomsSummary: React.FC<SicknessSymptomsSummaryProps> = ({ symptoms }) => {

    const categoriesWithSymptoms = SYMPTOMS_CATALOG
        .map(category => ({
            ...category,
            options: category.options.filter(opt => symptoms.includes(opt.key)),
        }))
        .filter(category => category.options.length > 0);

    if (categoriesWithSymptoms.length === 0) {
        return (
            <p className="text-muted fst-italic mb-0">
                No se registraron síntomas
            </p>
        );
    }

    return (
        <div className="d-flex flex-column gap-3">
            {categoriesWithSymptoms.map(category => (
                <div key={category.title}>
                    {/* Header de categoría */}
                    <div
                        className={`d-flex align-items-center gap-2 text-${category.color} mb-1`}
                    >
                        <i className={category.icon} />
                        <strong className="">{category.title}</strong>
                    </div>

                    {/* Badges */}
                    <div className="d-flex flex-wrap gap-2 fs-5">
                        {category.options.map(opt => (
                            <Badge
                                key={opt.key}
                                color={category.color}
                                pill
                                className="bg-opacity-75"
                            >
                                {opt.label}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SicknessSymptomsSummary;
