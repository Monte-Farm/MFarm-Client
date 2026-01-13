import { ConfigContext } from "App";
import BreadCrumb from "Components/Common/Shared/BreadCrumb";
import LoadingAnimation from "Components/Common/Shared/LoadingAnimation";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { Container } from "reactstrap";

const InventoryPigs = () => {
    document.title = 'Inventario de cerdos | Management System'
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser;
    const [loading, setLoading] = useState<boolean>(true)
    const [alertConfig, setAlertConfig] = useState({ visible: false, color: '', message: '' });
    const [modals, setModals] = useState({ update: false, viewPDF: false, selectMedicationMode: false, asignSingle: false, medicationPackage: false, });
    const [pigsInventory, setPigsInventory] = useState<any[]>([])

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    const fetchData = async () => {
        if(!configContext) return
        try {
            setLoading(true)

        } catch (error) {
            console.error('Error fetching data')
            setAlertConfig({visible: true, color: 'danger', message: 'Ha ocurrido un error al obtener los datos, intentelo mas tarde'})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation />
        )
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title={'Inventario de cerdos'} pageTitle={'Cerdos'} />

                
            </Container>
        </div>
    )
}

export default InventoryPigs;