import React from 'react';
import { BarChart3, Zap, TrendingUp, Users } from 'lucide-react';
import { AdminLayout, LayoutGrid, GlassCard, MetricPill, SectionTitle, GridCell, StatCard } from './components';

/**
 * WinmixPro Demo Page
 * Showcases all premium design system components in action
 */
export const WinmixProDemoPage: React.FC = () => {
  return <AdminLayout userEmail="demo@example.com">
      <div className="space-y-12">
        {/* Hero Section */}
        <section>
          <SectionTitle title="WinmixPro Design System" subtitle="Premium glass-morphism UI with responsive 12-column grid layout" icon={<BarChart3 className="w-6 h-6" />} />
        </section>

        {/* Metric Pills Section */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Metric Pills</h3>
          <div className="flex flex-wrap gap-4">
            <MetricPill label="Active Users" value="1,234" icon={<Users className="w-4 h-4" />} variant="emerald" />
            <MetricPill label="Running Jobs" value="12" icon={<Zap className="w-4 h-4" />} variant="violet" />
            <MetricPill label="Success Rate" value="98.5%" icon={<TrendingUp className="w-4 h-4" />} variant="neutral" />
          </div>
        </section>

        {/* Glass Cards Grid */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Glass Cards</h3>
          <LayoutGrid variant="3-6-3" className="gap-6">
            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Left Column</h4>
              <p className="text-white/60 text-sm">
                This spans 3 columns on desktop, full width on mobile
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Center Column</h4>
              <p className="text-white/60 text-sm">
                This spans 6 columns on desktop for main content
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Right Column</h4>
              <p className="text-white/60 text-sm">
                This spans 3 columns on desktop for sidebar content
              </p>
            </GlassCard>
          </LayoutGrid>
        </section>

        {/* Stat Cards Grid */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Stat Cards</h3>
          <LayoutGrid variant="full" className="gap-6">
            <GridCell span="half">
              <StatCard title="Total Predictions" value="45,291" icon={<TrendingUp className="w-5 h-5" />} change={{
              value: 12,
              direction: 'up'
            }} />
            </GridCell>
            <GridCell span="half">
              <StatCard title="Accuracy Rate" value="87.3%" icon={<BarChart3 className="w-5 h-5" />} change={{
              value: 5,
              direction: 'down'
            }} />
            </GridCell>
            <GridCell span="half">
              <StatCard title="Active Models" value="8" icon={<Zap className="w-5 h-5" />} change={{
              value: 3,
              direction: 'up'
            }} />
            </GridCell>
            <GridCell span="half">
              <StatCard title="System Uptime" value="99.9%" icon={<Users className="w-5 h-5" />} />
            </GridCell>
          </LayoutGrid>
        </section>

        {/* Interactive Cards */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Interactive Cards</h3>
          <LayoutGrid variant="full" className="gap-6">
            <GridCell span="half">
              <GlassCard interactive glow="emerald" className="p-8 cursor-pointer hover:shadow-glass-lg transition-all duration-300">
                <h4 className="text-lg font-semibold text-emerald-400 mb-2">
                  Emerald Theme
                </h4>
                <p className="text-white/60">
                  Interactive card with emerald glow effect
                </p>
              </GlassCard>
            </GridCell>
            <GridCell span="half">
              <GlassCard interactive glow="violet" className="p-8 cursor-pointer hover:shadow-glass-lg transition-all duration-300">
                <h4 className="text-lg font-semibold text-violet-400 mb-2">
                  Violet Theme
                </h4>
                <p className="text-white/60">
                  Interactive card with violet glow effect
                </p>
              </GlassCard>
            </GridCell>
          </LayoutGrid>
        </section>

        {/* Responsive Grid Demo */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Responsive Grids</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/60 mb-2">
                12-column responsive grid (1 col mobile, 12 col desktop)
              </p>
              <LayoutGrid variant="full" className="gap-4">
                {[1, 2, 3, 4].map(i => <GridCell key={i} span="half">
                    <GlassCard className="p-4 h-24 flex items-center justify-center">
                      <p className="text-center text-white/60">Grid Item {i}</p>
                    </GlassCard>
                  </GridCell>)}
              </LayoutGrid>
            </div>

            <div>
              <p className="text-sm text-white/60 mb-2">
                3-6-3 layout (perfect for dashboards)
              </p>
              <LayoutGrid variant="3-6-3" className="gap-4">
                <GlassCard className="p-4 h-24 flex items-center justify-center">
                  <p className="text-center text-white/60">Sidebar (3 cols)</p>
                </GlassCard>
                <GlassCard className="p-4 h-24 flex items-center justify-center">
                  <p className="text-center text-white/60">Main Content (6 cols)</p>
                </GlassCard>
                <GlassCard className="p-4 h-24 flex items-center justify-center">
                  <p className="text-center text-white/60">Right Panel (3 cols)</p>
                </GlassCard>
              </LayoutGrid>
            </div>
          </div>
        </section>

        {/* Typography & Utilities */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Utilities & Effects</h3>
          <LayoutGrid variant="full" className="gap-6">
            <GridCell span="full">
              <GlassCard className="p-6">
                <p className="text-gradient-emerald text-2xl font-bold mb-4">
                  Emerald Gradient Text
                </p>
                <p className="text-gradient-violet text-2xl font-bold mb-4">
                  Violet Gradient Text
                </p>
                <div className="shimmer p-4 rounded-lg bg-white/10 mt-4">
                  <p className="text-white/60">Shimmer Effect</p>
                </div>
              </GlassCard>
            </GridCell>
          </LayoutGrid>
        </section>
      </div>
    </AdminLayout>;
};
export default WinmixProDemoPage;