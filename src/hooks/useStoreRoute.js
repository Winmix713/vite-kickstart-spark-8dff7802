import * as React from 'react';
import {useLocation} from 'react-router-dom';

const useStoreRoute = () => {
    const storeRoutes = ['/football-store', '/brand-store', '/product'];
    const location = useLocation();
    const [isStoreRoute, setIsStoreRoute] = React.useState(false);

    React.useEffect(() => {
        setIsStoreRoute(storeRoutes.includes(location.pathname));

        return () => {
            setIsStoreRoute(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return isStoreRoute;
}

export default useStoreRoute
