import { useTranslation } from "react-i18next";
import { Badge } from "reactstrap";

interface SicknessSymptomsSummaryProps {
    symptoms: string[];
}

interface SymptomCategory {
    titleKey: string;
    icon: string;
    color: string;
    optionKeys: string[];
}

const SYMPTOMS_CATALOG: SymptomCategory[] = [
    {
        titleKey: "shared.symptoms.category.respiratory",
        icon: "fa-solid fa-lungs",
        color: "info",
        optionKeys: ["cough", "sneezing", "nasal_discharge", "difficulty_breathing", "open_mouth_breathing"],
    },
    {
        titleKey: "shared.symptoms.category.general",
        icon: "fa-solid fa-temperature-high",
        color: "warning",
        optionKeys: ["fever", "lethargy", "loss_of_appetite", "weight_loss", "isolation"],
    },
    {
        titleKey: "shared.symptoms.category.digestive",
        icon: "fa-solid fa-notes-medical",
        color: "success",
        optionKeys: ["diarrhea", "bloody_diarrhea", "vomiting", "abdominal_swelling", "dehydration"],
    },
    {
        titleKey: "shared.symptoms.category.locomotor",
        icon: "fa-solid fa-person-walking",
        color: "primary",
        optionKeys: ["lameness", "joint_swelling", "difficulty_standing"],
    },
    {
        titleKey: "shared.symptoms.category.neurological",
        icon: "fa-solid fa-brain",
        color: "dark",
        optionKeys: ["tremors", "incoordination", "convulsions", "head_tilt", "circling"],
    },
    {
        titleKey: "shared.symptoms.category.alarm",
        icon: "fa-solid fa-triangle-exclamation",
        color: "danger",
        optionKeys: ["cyanosis", "edema", "sudden_death"],
    },
];

const SicknessSymptomsSummary: React.FC<SicknessSymptomsSummaryProps> = ({ symptoms }) => {
    const { t } = useTranslation();

    const categoriesWithSymptoms = SYMPTOMS_CATALOG
        .map(category => ({
            ...category,
            matchedKeys: category.optionKeys.filter(key => symptoms.includes(key)),
        }))
        .filter(category => category.matchedKeys.length > 0);

    if (categoriesWithSymptoms.length === 0) {
        return (
            <p className="text-muted fst-italic mb-0">
                {t("shared.symptoms.category.noSymptoms", { defaultValue: "No se registraron síntomas" })}
            </p>
        );
    }

    return (
        <div className="d-flex flex-column gap-3">
            {categoriesWithSymptoms.map(category => (
                <div key={category.titleKey}>
                    <div className={`d-flex align-items-center gap-2 text-${category.color} mb-1`}>
                        <i className={category.icon} />
                        <strong>{t(category.titleKey)}</strong>
                    </div>

                    <div className="d-flex flex-wrap gap-2 fs-5">
                        {category.matchedKeys.map(key => (
                            <Badge
                                key={key}
                                color={category.color}
                                pill
                                className="bg-opacity-75"
                            >
                                {t(`shared.symptoms.${key}`)}
                            </Badge>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SicknessSymptomsSummary;
