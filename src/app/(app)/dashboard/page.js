'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Dumbbell, Flame, Target, Zap, TrendingUp, TrendingDown,
  Clock, ChevronRight, Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ChartCard from '@/components/charts/ChartCard';
import WeeklyActivityChart from '@/components/charts/WeeklyActivityChart';
import WeightTrendChart from '@/components/charts/WeightTrendChart';
import CalorieBurnChart from '@/components/charts/CalorieBurnChart';
import WorkoutTypeChart from '@/components/charts/WorkoutTypeChart';
import GoalProgressChart from '@/components/charts/GoalProgressChart';
import {
  typeIcons,
  typeColors,
} from '@/lib/sampleData';
import styles from './dashboard.module.css';

const statCards = [
  {
    icon: Dumbbell,
    label: 'Total Workouts',
    key: 'totalWorkouts',
    color: 'var(--chart-1)',
    trend: '+12%',
    trendUp: true,
  },
  {
    icon: Flame,
    label: 'Calories This Week',
    key: 'weeklyCalories',
    color: 'var(--chart-6)',
    trend: '+8%',
    trendUp: true,
  },
  {
    icon: Target,
    label: 'Active Goals',
    key: 'activeGoals',
    color: 'var(--chart-3)',
    trend: '2 near deadline',
    trendUp: null,
  },
  {
    icon: Zap,
    label: 'Current Streak',
    key: 'streak',
    color: 'var(--chart-5)',
    trend: 'Best: 14 days',
    trendUp: null,
  },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    weeklyCalories: 0,
    activeGoals: 0,
    streak: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [calorieData, setCalorieData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to load from Supabase, fallback to sample data
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(50);

      if (workouts && workouts.length > 0) {
        setRecentWorkouts(workouts.slice(0, 5));
        setStats(prev => ({ ...prev, totalWorkouts: workouts.length }));
        const weekCals = workouts
          .filter(w => {
            const d = new Date(w.completed_at);
            const now = new Date();
            return (now - d) / (1000 * 60 * 60 * 24) <= 7;
          })
          .reduce((sum, w) => sum + (w.calories_burned || 0), 0);
        setStats(prev => ({ ...prev, weeklyCalories: weekCals }));
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div className="skeleton" style={{ width: 300, height: 32 }} />
          <div className="skeleton" style={{ width: 200, height: 20, marginTop: 8 }} />
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>{greeting()}, {profile?.full_name?.split(' ')[0] || 'Champion'} 💪</h1>
        <p>Here&apos;s how your fitness journey is going</p>
      </motion.div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            className={styles.statCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div className={styles.statCardIcon} style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className={styles.statCardContent}>
              <span className={styles.statCardValue}>
                {typeof stats[card.key] === 'number' ? stats[card.key].toLocaleString() : stats[card.key]}
              </span>
              <span className={styles.statCardLabel}>{card.label}</span>
            </div>
            <div className={styles.statCardTrend}>
              {card.trendUp !== null && (
                card.trendUp ? (
                  <TrendingUp size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
                )
              )}
              <span style={{
                color: card.trendUp === true ? 'var(--success)' : card.trendUp === false ? 'var(--danger)' : 'var(--text-tertiary)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {card.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className={styles.chartsRow}>
        <ChartCard
          title="Weekly Activity"
          subtitle="Workouts per day this week"
          className={styles.chartWide}
        >
          <WeeklyActivityChart data={weeklyData} />
        </ChartCard>

        <ChartCard
          title="Workout Types"
          subtitle="Distribution by category"
          className={styles.chartNarrow}
        >
          <WorkoutTypeChart data={typeData} />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className={styles.chartsRow}>
        <ChartCard
          title="Weight Trend"
          subtitle="Last 12 weeks"
          className={styles.chartWide}
        >
          <WeightTrendChart data={weightData} />
        </ChartCard>

        <ChartCard
          title="Goal Progress"
          subtitle="Active goals tracking"
          className={styles.chartNarrow}
        >
          <GoalProgressChart data={goals} />
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className={styles.chartsRow}>
        <ChartCard
          title="Calorie Burn"
          subtitle="Last 14 days"
          className={styles.chartWide}
        >
          <CalorieBurnChart data={calorieData} />
        </ChartCard>

        {/* Recent Workouts */}
        <div className={`${styles.recentCard} card-static`}>
          <div className={styles.recentHeader}>
            <h4>Recent Workouts</h4>
            <a href="/workouts" className={styles.viewAll}>
              View all <ChevronRight size={14} />
            </a>
          </div>
          <div className={styles.recentList}>
            {recentWorkouts.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6) 0', fontSize: '0.9rem' }}>
                No workouts yet. Start logging!
              </p>
            ) : recentWorkouts.map((workout, i) => (
              <motion.div
                key={workout.id}
                className={styles.recentItem}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className={styles.recentIcon} style={{ background: `${typeColors[workout.type]}15` }}>
                  {typeIcons[workout.type]}
                </div>
                <div className={styles.recentDetails}>
                  <span className={styles.recentName}>{workout.name}</span>
                  <span className={styles.recentMeta}>
                    <Clock size={12} /> {workout.duration_minutes}m · {workout.calories_burned} cal
                  </span>
                </div>
                <span className={styles.recentDate}>
                  {format(new Date(workout.completed_at), 'MMM d')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
