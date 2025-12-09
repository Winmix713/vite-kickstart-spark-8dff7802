import Lottie from 'lottie-react';
import ball from '@assets/ball.json';

const LoadingScreen = () => {
    return (
        <div className="d-flex align-items-center justify-content-center flex-1 w-100 h-100" style={{minHeight: '100vh'}}>
            <Lottie animationData={ball} style={{width: 150, height: 150}} />
        </div>
    )
}

export default LoadingScreen