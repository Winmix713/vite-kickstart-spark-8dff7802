import React from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import MatchSelection from '@/components/MatchSelection';
import Footer from '@/components/Footer';
const NewPredictions = () => {
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="relative">
        <MatchSelection />
      </main>
      <Footer />
    </div>;
};
export default NewPredictions;