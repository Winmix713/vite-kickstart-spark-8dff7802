// styling
import styles from './styles.module.scss';

// components
import { NavLink } from 'react-router-dom';

const AdminQuickActions = () => {
    const actions = [
        { path: '/models', icon: 'gear-solid', title: 'Models' },
        { path: '/jobs', icon: 'calendar', title: 'Jobs' },
        { path: '/monitoring', icon: 'chart-bar', title: 'Monitoring' },
        { path: '/login', icon: 'user', title: 'Login' },
    ];

    return (
        <div className={styles.quick_actions}>
            {actions.map(action => (
                <NavLink key={action.path} to={action.path} className={`${styles.control} h5`} title={action.title}>
                    <i className={`icon-${action.icon}`} />
                </NavLink>
            ))}
        </div>
    );
};

export default AdminQuickActions;
