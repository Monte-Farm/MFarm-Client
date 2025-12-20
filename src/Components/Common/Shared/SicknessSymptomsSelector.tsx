import { Card, CardBody, CardHeader, Input, Label } from "reactstrap";

interface SicknessSymptomsSelectorProps {
    value: string[];
    onChange: (symptoms: string[]) => void;
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
            { key: "cyanosis", label: "Coloración azulada (orejas o patas)" },
            { key: "edema", label: "Edema / hinchazón" },
            { key: "sudden_death", label: "Muerte súbita" },
        ],
    },
];

const SicknessSymptomsSelector: React.FC<SicknessSymptomsSelectorProps> = ({ value, onChange }) => {

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
                    <div className="col-md-6 px-2" key={category.title}>
                        <Card className="h-100 w-100">
                            <CardHeader
                                className={`d-flex align-items-center gap-2 bg-${category.color} bg-opacity-10 text-${category.color}`}
                            >
                                <i className={`${category.icon} fs-5`} />
                                <strong>{category.title}</strong>
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
                                            {option.label}
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
