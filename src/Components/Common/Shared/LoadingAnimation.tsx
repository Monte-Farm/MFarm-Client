import React from "react";
import LoadingGif from "../../../assets/images/loading-gif.gif";

interface LoadingAnimationProps {
    absolutePosition?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ absolutePosition = true }) => {
    return (
        <div
            className={`d-flex justify-content-center align-items-center ${absolutePosition ? "vh-100 page-content" : "h-100"}`}
            style={absolutePosition ? { position: "absolute", inset: 0, zIndex: 9999, backgroundColor: "white" } : {}}
        >
            <img src={LoadingGif} alt="Cargando..." style={{ width: "200px" }} />
        </div>
    );
};

export default LoadingAnimation;