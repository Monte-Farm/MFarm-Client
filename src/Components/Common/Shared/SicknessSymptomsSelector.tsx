import { useTranslation } from "react-i18next";
import { Card, CardBody, CardHeader, Input, Label } from "reactstrap";

interface SicknessSymptomsSelectorProps {
    value: string[];
    onChange: (symptoms: string[]) => void;
}

interface SymptomCategory {
    titleKey: string;
    icon: string;
    color: string;
    options: { key: string }[];
}

const SYMPTOMS_CATALOG: SymptomCategory[] = [
    {
        titleKey: "shared.symptoms.category.respiratory",
        icon: "fa-solid fa-lungs",
        color: "info",
        options: [
            { key: "cough" },
            { key: "sneezing" },
            { key: "nasal_discharge" },
            { key: "difficulty_breathing" },
            { key: "open_mouth_breathing" },
        ],
    },
    {
        titleKey: "shared.symptoms.category.general",
        icon: "fa-solid fa-temperature-high",
        color: "warning",
        options: [
            { key: "fever" },
            { key: "lethargy" },
            { key: "loss_of_appetite" },
            { key: "weight_loss" },
            { key: "isolation" },
        ],
    },
    {
        titleKey: "shared.symptoms.category.digestive",
        icon: "fa-solid fa-notes-medical",
        color: "success",
        options: [
            { key: "diarrhea" },
            { key: "bloody_diarrhea" },
            { key: "vomiting" },
            { key: "abdominal_swelling" },
            { key: "dehydration" },
        ],
    },
    {
        titleKey: "shared.symptoms.category.locomotor",
        icon: "fa-solid fa-person-walking",
        color: "primary",
        options: [
            { key: "lameness" },
            { key: "joint_swelling" },
            { key: "difficulty_standing" },
        ],
    },
    {
        titleKey: "shared.symptoms.category.neurological",
        icon: "fa-solid fa-brain",
        color: "dark",
        options: [
            { key: "tremors" },
            { key: "incoordination" },
            { key: "convulsions" },
            { key: "head_tilt" },
            { key: "circling" },
        ],
    },
    {
        titleKey: "shared.symptoms.category.alarm",
        icon: "fa-solid fa-triangle-exclamation",
        color: "danger",
        options: [
            { key: "cyanosis" },
            { key: "edema" },
            { key: "sudden_death" },
        ],
    },
];

const SicknessSymptomsSelector: React.FC<SicknessSymptomsSelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();

    const toggleSymptom = (key: string) => {
        if (value.includes(key)) {
            onChange(value.filter(s => s !== key));
        } else {
            onChange([...value, key]);
        }
    };

    return (
        <div
            style={{
                maxHeight: "55vh",
                overflowY: "auto",
                overflowX: "hidden",
            }}
        >
            <div className="row g-3 mx-0">
                {SYMPTOMS_CATALOG.map(category => (
                    <div className="col-md-6 px-2" key={category.titleKey}>
                        <Card className="h-100 w-100">
                            <CardHeader
                                className={`d-flex align-items-center gap-2 bg-${category.color} bg-opacity-10 text-${category.color}`}
                            >
                                <i className={`${category.icon} fs-5`} />
                                <strong>{t(category.titleKey)}</strong>
                            </CardHeader>

                            <CardBody>
                                {category.options.map(option => (
                                    <div className="form-check mb-2" key={option.key}>
                                        <Input
                                            type="checkbox"
                                            id={option.key}
                                            checked={value.includes(option.key)}
                                            onChange={() => toggleSymptom(option.key)}
                                        />
                                        <Label
                                            className="form-check-label"
                                            htmlFor={option.key}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {t(`shared.symptoms.${option.key}`)}
                                        </Label>
                                    </div>
                                ))}
                            </CardBody>
                        </Card>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default SicknessSymptomsSelector;
