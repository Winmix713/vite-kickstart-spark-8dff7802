// styling
import styles from './styles.module.scss';

// components
import Submenu from '@ui/Submenu';
import SettingsPopup from '@layout/BottomNav/SettingsPopup';

// hooks
import useSubmenu from '@hooks/useSubmenu';
import {useWindowSize} from 'react-use';
import {useState} from 'react';
import useStoreRoute from '@hooks/useStoreRoute';
import {useShopProvider} from '@contexts/shopContext';

// assets
import user from '@assets/user.webp';

const User = () => {
    const [popupOpen, setPopupOpen] = useState(false);
    const {anchorEl, open, handleClick, handleClose} = useSubmenu();
    const isTablet = useWindowSize().width < 1280;
    const isStoreRoute = useStoreRoute();
    const {setCartOpen} = useShopProvider();

    const settingsPopup = {
        label: 'UI Settings',
        icon: 'gear-solid',
        onClick: () => setPopupOpen(true)
    }

    const submenuActions = [
        {
            label: 'Change user',
            icon: 'users-two',
        },
        {
            label: 'Logout',
            icon: 'exit',
        }
    ];

    return (
        <div className="d-flex align-items-center g-16">
            <div className={styles.avatar}>
                <img className="c-pointer" src={user} alt="user" onClick={handleClick}/>
                {
                    isStoreRoute && isTablet && (
                        <button className={styles.avatar_cart} aria-label="Shopping cart" onClick={() => setCartOpen(true)}>
                            <i className="icon-bag-solid"/>
                        </button>
                    )
                }
            </div>
            <div className="d-flex flex-column">
                <span className="h3" style={{letterSpacing: 0.2}}>
                    Lottie Poole
                </span>
                <span className="text-12">Munich, Germany</span>
            </div>
            <Submenu open={open}
                     onClose={handleClose}
                     anchorEl={anchorEl}
                     actions={isTablet ? [settingsPopup, ...submenuActions] : submenuActions}/>
            <SettingsPopup open={popupOpen} onClose={() => setPopupOpen(false)}/>
        </div>
    )
}

export default User