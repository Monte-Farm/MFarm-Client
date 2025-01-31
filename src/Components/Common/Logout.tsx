import { useState } from "react";
import { useNavigate } from "react-router-dom"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

const Logout = () => {
    const history = useNavigate();
    const [modals, setModals] = useState({ logout: false });

    const toggleModal = (modalName: keyof typeof modals, state?: boolean) => {
        setModals((prev) => ({ ...prev, [modalName]: state ?? !prev[modalName] }));
    };


    const clicLogout = () => {
        history('/login')
        sessionStorage.removeItem('authUser')
    }

    return (
        <>
            <div className="ms-1 header-item d-none d-sm-flex">
                <button
                    onClick={() => toggleModal('logout')}
                    type="button"
                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode">
                    <i className="ri-logout-box-line fs-22"></i>
                </button>
            </div>

            <Modal isOpen={modals.logout} toggle={() => toggleModal('logout')} size="md" keyboard={false} backdrop="static" centered>
                <ModalHeader toggle={() => toggleModal('logout')}>Cerrar Sesión</ModalHeader>
                <ModalBody>
                    {`¿Estás seguro de que desea cerrar sesión?`}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={() => toggleModal('logout', false)}>Cancelar</Button>
                    <Button color="success" onClick={clicLogout}>
                        Cerrar Sesión
                    </Button>
                </ModalFooter>
            </Modal>
        </>

    )
}

export default Logout;