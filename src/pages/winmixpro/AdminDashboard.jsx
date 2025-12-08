import React from 'react';

// components
import Spring from '@components/Spring';
import SystemStatus from '@widgets/SystemStatus';
import ActivityLog from '@widgets/ActivityLog';

const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">WinMixPro Admin</h1>
                <p className="text-gray-400">Rendszerkezelés és áttekintés</p>
            </div>

            {/* Stats Grid */}
            <Spring className="card card-padded">
                <h3 className="text-lg font-semibold text-white mb-4">Rendszer áttekintés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">1,247</div>
                        <div className="text-sm text-gray-400">Összes Felhasználó</div>
                        <div className="text-sm text-green-400">+12%</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">23</div>
                        <div className="text-sm text-gray-400">Aktív Mérkőzések</div>
                        <div className="text-sm text-green-400">+3</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">45,832</div>
                        <div className="text-sm text-gray-400">API Kérések</div>
                        <div className="text-sm text-red-400">-8%</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">99.9%</div>
                        <div className="text-sm text-gray-400">Rendszer Uptime</div>
                        <div className="text-sm text-gray-400">0% változás</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">2</div>
                        <div className="text-sm text-gray-400">Hibák Száma</div>
                        <div className="text-sm text-green-400">-1</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">2.4 GB</div>
                        <div className="text-sm text-gray-400">Tárolás</div>
                        <div className="text-sm text-yellow-400">+5%</div>
                    </div>
                </div>
            </Spring>

            {/* Activity Log and System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityLog />
                <SystemStatus />
            </div>
        </div>
    );
};

export default AdminDashboard;