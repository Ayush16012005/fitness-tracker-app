'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell,
} from 'recharts';
import { Calendar, TrendingUp, Award, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ChartCard from '@/components/charts/ChartCard';
import WeightTrendChart from '@/components/charts/WeightTrendChart';
import CalorieBurnChart from '@/components/charts/CalorieBurnChart';

import styles from './progress.module.css';

const periods = ['1W', '1M', '3M', '6M', '1Y'];

const GlassTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-glass-strong)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: '0.8rem', color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('3M');
  const [weightData, setWeightData] = useState([]);
  const [calorieData, setCalorieData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const days = periodToDays(period);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: true });

      if (workouts && workouts.length > 0) {
        // Build calorie data from real workouts
        setCalorieData(workouts.map(w => ({
          day: new Date(w.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          calories: w.calories_burned || 0,
        })));

        // Monthly breakdown
        const monthly = {};
        workouts.forEach(w => {
          const month = new Date(w.completed_at).toLocaleDateString('en-US', { month: 'short' });
          if (!monthly[month]) monthly[month] = { month, strength: 0, cardio: 0, flexibility: 0 };
          if (w.type === 'strength') monthly[month].strength++;
          else if (w.type === 'cardio') monthly[month].cardio++;
          else if (w.type === 'flexibility') monthly[month].flexibility++;
        });
        setMonthlyData(Object.values(monthly));
      } else {
        setCalorieData([]);
        setMonthlyData([]);
      }

      setWeightData([]);
      setRecords([]);
    } catch (err) {
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const periodToWeeks = (p) => {
    const map = { '1W': 1, '1M': 4, '3M': 12, '6M': 26, '1Y': 52 };
    return map[p] || 12;
  };

  const periodToDays = (p) => {
    const map = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
    return map[p] || 90;
  };

  const PeriodSelector = (
    <div className={styles.periodSelector}>
      {periods.map((p) => (
        <button
          key={p}
          className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`}
          onClick={() => setPeriod(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.progress}>
      <div className={styles.header}>
        <div>
          <h1>Progress & Analytics</h1>
          <p>Deep insights into your fitness journey</p>
        </div>
        {PeriodSelector}
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {[
          { icon: TrendingUp, label: 'Weight Change', value: '-2.3 kg', detail: 'From 82.1 to 79.8 kg', color: 'var(--success)' },
          { icon: Zap, label: 'Avg. Workout/Week', value: '4.2', detail: 'Up from 3.5 last period', color: 'var(--chart-1)' },
          { icon: Calendar, label: 'Total Sessions', value: '47', detail: 'In selected period', color: 'var(--chart-3)' },
          { icon: Award, label: 'Personal Records', value: '4', detail: 'New PRs set', color: 'var(--chart-5)' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className={styles.summaryCard}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className={styles.summaryIcon} style={{ background: `${item.color}15`, color: item.color }}>
              <item.icon size={20} />
            </div>
            <span className={styles.summaryValue} style={{ color: item.color }}>{item.value}</span>
            <span className={styles.summaryLabel}>{item.label}</span>
            <span className={styles.summaryDetail}>{item.detail}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard title="Weight Trend" subtitle="Body weight over time" className={styles.fullWidth}>
          <WeightTrendChart data={weightData} />
        </ChartCard>

        <ChartCard title="Calorie Burn Trend" subtitle="Daily calories burned">
          <CalorieBurnChart data={calorieData} />
        </ChartCard>

        <ChartCard title="Monthly Workout Volume" subtitle="Sessions by category">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="strength" name="Strength" fill="var(--chart-1)" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="cardio" name="Cardio" fill="var(--chart-3)" radius={[0, 0, 0, 0]} stackId="a" />
              <Bar dataKey="flexibility" name="Flexibility" fill="var(--chart-2)" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Personal Records */}
      <div className={styles.recordsSection}>
        <h3>🏆 Personal Records</h3>
        <div className={styles.recordsGrid}>
          {records.map((rec, i) => (
            <motion.div
              key={rec.exercise}
              className={styles.recordCard}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <span className={styles.recordEmoji}>{rec.icon}</span>
              <span className={styles.recordExercise}>{rec.exercise}</span>
              <span className={styles.recordValue}>{rec.value}</span>
              <span className={styles.recordDate}>{rec.date}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
