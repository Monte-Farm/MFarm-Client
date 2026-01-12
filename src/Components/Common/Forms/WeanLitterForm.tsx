import { ConfigContext } from "App";
import { getLoggedinUser } from "helpers/api_helper";
import { useContext, useEffect, useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import ErrorModal from "../Shared/ErrorModal";
import SuccessModal from "../Shared/SuccessModal";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner, TabContent, TabPane } from "reactstrap";
import LoadingAnimation from "../Shared/LoadingAnimation";
import classnames from "classnames";

interface WeanLitterFormProps {
    litterId: string;
    onSave: () => void;
}

const WeanLitterForm: React.FC<WeanLitterFormProps> = ({ litterId, onSave }) => {
    const configContext = useContext(ConfigContext);
    const userLogged = getLoggedinUser();
    const [modals, setModals] = useState({ confirm: false, success: false, error: false });
    const [activeStep, setActiveStep] = useState<number>(1);
    const [passedarrowSteps, setPassedarrowSteps] = useState([1]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true)
    const [litter, setLitter] = useState<any>()

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };

    function toggleArrowTab(tab: number) {
        if (activeStep !== tab) {
            var modifiedSteps = [...passedarrowSteps, tab];

            if (tab >= 1 && tab <= 5) {
                setActiveStep(tab);
                setPassedarrowSteps(modifiedSteps);
            }
        }
    }

    const fetchLitter = async () => {
        if (!configContext || !litterId) return;
        try {
            setLoading(true);
            const litterResponse = await configContext.axiosHelper.get(`${configContext.apiUrl}/litter/find_by_id/${litterId}`)
            setLitter(litterResponse.data.data)
        } catch (error) {
            console.error('Error fetching data:', { error });
            toggleModal('error')
        } finally {
            setLoading(false)
        }
    }

    const handleWeanLitter = async () => {
        if (!configContext || !userLogged) return
        try {
            setIsSubmitting(true)
            const weanedLitter = await configContext.axiosHelper.put(`${configContext.apiUrl}/litter/wean_litter/${litterId}`, {})
            // await configContext.axiosHelper.create(`${configContext.apiUrl}/user/add_user_history/${userLogged._id}`, {
            //     event: `Camada destetada`
            // });

            toggleModal('success')
        } catch (error) {
            console.error('Error weaning the litter: ', { error })
            toggleModal('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        fetchLitter();
    }, [])

    if (loading) {
        return (
            <LoadingAnimation absolutePosition={false} />
        )
    }

    return (
        <>
            <div className="step-arrow-nav mb-4">
                <Nav className="nav-pills custom-nav nav-justified">
                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-packageSelect-tab"
                            className={classnames({
                                active: activeStep === 1,
                                done: activeStep > 1,
                            })}
                            aria-selected={activeStep === 1}
                            aria-controls="step-packageSelect-tab"
                            disabled
                        >
                            Peso de lechones
                        </NavLink>
                    </NavItem>

                    <NavItem>
                        <NavLink
                            href='#'
                            id="step-summary-tab"
                            className={classnames({
                                active: activeStep === 2,
                                done: activeStep > 2,
                            })}
                            aria-selected={activeStep === 2}
                            aria-controls="step-summary-tab"
                            disabled
                        >
                            Resumen
                        </NavLink>
                    </NavItem>
                </Nav>
            </div>

            <TabContent activeTab={activeStep}>
                <TabPane tabId={1}>


                </TabPane>

                <TabPane tabId={2}>

                </TabPane>
            </TabContent>




            <Modal size="md" isOpen={modals.confirm} toggle={() => toggleModal("confirm")} backdrop='static' keyboard={false} centered>
                <ModalHeader toggle={() => toggleModal("confirm")}>Destetar camada</ModalHeader>
                <ModalBody>
                    <div className="d-flex justify-content-center mb-3">
                        <FaQuestionCircle size={56} className="text-primary opacity-75"
                        />
                    </div>

                    <div className="text-center mb-2">
                        <h4 className="fw-semibold mb-1">¿Deseas destetar esta camada?</h4>
                    </div>

                    <div className="text-center text-muted fs-5 mb-4">
                        Al confirmar el destete, la camada cambiará su estado y se dará por
                        finalizada la etapa de lactancia.
                        <br />
                    </div>

                    <div className="border rounded p-3 bg-light-subtle text-center mb-4">
                        <strong>Asegúrate de que toda la información esté correcta antes de continuar.</strong>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button class Name="" color="success" onClick={() => handleWeanLitter()}>
                        {isSubmitting ? (
                            <Spinner size='sm' />
                        ) : (
                            <>
                                <i className="ri ri-check-line me-2" />
                                Confirmar
                            </>
                        )}
                    </Button>
                </ModalFooter>
            </Modal>

            <SuccessModal isOpen={modals.success} onClose={() => onSave()} message={"Camada destetada con éxito"} />
            <ErrorModal isOpen={modals.error} onClose={() => toggleModal('error', false)} message={"Ha ocurrido un error al destetar a la camada, intentelo mas tarde"} />
        </>
    );
};

export default WeanLitterForm;
