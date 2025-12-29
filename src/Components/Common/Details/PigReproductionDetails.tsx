import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import LoadingAnimation from "../Shared/LoadingAnimation";

interface PigReproductionDetailsProps {
    pigId: string
}

const PigReproductionDetails: React.FC<PigReproductionDetailsProps> = ({ pigId }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: "", message: "" });
    const [modals, setModals] = useState({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    useEffect(() => {
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        );
    }

    return (
        <>
            <div className="d-flex gap-3 align-items-stretch" style={{ height: "600px" }}>

            </div>
        </>
    )
}

export default PigReproductionDetails;