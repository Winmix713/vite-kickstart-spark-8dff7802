const LINKS = [
    {
        title: 'Irányítópult',
        icon: 'table',
        pages: [
            { title: 'Dashboard', path: '/' },
            { title: 'Predikciók', path: '/predictions' },
            { title: 'Elemzések', path: '/analytics' }
        ]
    },
    {
        title: 'Bajnokságok',
        icon: 'calendar',
        pages: [
            { title: 'Összes bajnokság', path: '/leagues' },
            { title: 'Mérkőzések', path: '/matches' },
            { title: 'Közelgő meccsek', path: '/upcoming' },
            { title: 'Cross-League', path: '/cross-league' }
        ]
    },
    {
        title: 'AI Rendszer',
        icon: 'gear-solid',
        pages: [
            { title: 'Modellek', path: '/models' },
            { title: 'Feladatok', path: '/jobs' },
            { title: 'Monitoring', path: '/monitoring' }
        ]
    },
    {
        title: 'Fiók',
        icon: 'users',
        pages: [
            { title: 'Bejelentkezés', path: '/login' },
            { title: 'Regisztráció', path: '/sign-up' },
            { title: 'Csapat profil', path: '/team-profile' }
        ]
    }
];

export default LINKS;