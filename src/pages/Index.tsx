import React from 'react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
const Index = () => {
  const navigate = useNavigate();
  useDocumentTitle('WinMix TipsterHub');
  return <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="relative">
        <HeroSection />
        <section className="ml-0 md:ml-[84px] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Készen állsz az AI predikciókra?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Válassz 8 mérkőzést és a WinMix advanced pattern recognition
                rendszere azonnal elkészíti a részletes predikciós elemzést.
              </p>
              <Button onClick={() => navigate('/predictions/new')} size="lg" className="group relative overflow-hidden inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-gradient-to-r from-primary to-primary text-primary-foreground ring-1 ring-primary hover:ring-primary/80 transition text-base font-semibold">
                <span className="relative z-10 inline-flex items-center gap-2">
                  Új predikciók készítése
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 bg-gradient-to-r from-white/0 via-white/40 to-white/0"></span>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>;
};
export default Index;