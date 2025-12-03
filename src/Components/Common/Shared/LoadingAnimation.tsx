import React from "react";
import LoadingGif from "../../../assets/images/loading-gif.gif";

interface LoadingAnimationProps {
    absolutePosition?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
    absolutePosition = true,
}) => {
    if (absolutePosition) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 page-content">
                <img
                    src={LoadingGif}
                    alt="Cargando..."
                    style={{ width: "200px" }}
                />
            </div>
        );
    }

    // Vista normal (como antes)
    return (
        <div className="d-flex justify-content-center align-items-center h-100">
            <img
                src={LoadingGif}
                alt="Cargando..."
                style={{ width: "200px" }}
            />
        </div>
    );
};

export default LoadingAnimation;