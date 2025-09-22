import React from "react";
import LoadingGif from "../../assets/images/loading-gif.gif";

const LoadingAnimation: React.FC = () => {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100 page-content">
            <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
        </div>
    );
};

export default LoadingAnimation;