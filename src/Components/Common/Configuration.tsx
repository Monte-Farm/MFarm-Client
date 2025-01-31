import { useNavigate } from "react-router-dom"

const Configuration = () => {
    const history = useNavigate()

    const clicConfiguration = () => {
        history('/configuration')
    }

    return (
        <div className="ms-1 header-item d-none d-sm-flex">
            <button
                onClick={clicConfiguration}
                type="button"
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle light-dark-mode">
                <i className="bx bx-cog fs-22"></i>
            </button>
        </div>
    )
}

export default Configuration