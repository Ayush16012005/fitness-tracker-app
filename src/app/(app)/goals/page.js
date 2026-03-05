'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus, Target, CheckCircle2, Clock, Trophy,
  Dumbbell, HeartPulse, Scale, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

import styles from './goals.module.css';

const categoryIcons = {
  strength: Dumbbell,
  cardio: HeartPulse,
  weight: Scale,
  consistency: Zap,
  flexibility: Target,
};

const categoryColors = {
  strength: 'var(--chart-1)',
  cardio: 'var(--chart-4)',
  weight: 'var(--chart-6)',
  consistency: 'var(--chart-5)',
  flexibility: 'var(--chart-2)',
};

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('active');

  const [form, setForm] = useState({
    title: '',
    description: '',
    target_value: '',
    unit: 'kg',
    category: 'strength',
    deadline: '',
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      setGoals(data || []);
    } catch (err) {
      console.error('Error loading goals:', err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        target_value: parseFloat(form.target_value),
        unit: form.unit,
        category: form.category,
        deadline: form.deadline || null,
      });
      if (error) throw error;
      setShowModal(false);
      setForm({ title: '', description: '', target_value: '', unit: 'kg', category: 'strength', deadline: '' });
      loadGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  const toggleComplete = async (goal) => {
    try {
      await supabase
        .from('goals')
        .update({ completed: !goal.completed, current_value: goal.completed ? goal.current_value : goal.target_value })
        .eq('id', goal.id);
      setGoals(goals.map((g) =>
        g.id === goal.id
          ? { ...g, completed: !g.completed, current_value: g.completed ? g.current_value : g.target_value }
          : g
      ));
    } catch (err) {
      console.error('Error toggling goal:', err);
    }
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
  const displayGoals = filter === 'active' ? activeGoals : completedGoals;

  return (
    <div className={styles.goals}>
      <div className={styles.header}>
        <div>
          <h1>Goals</h1>
          <p>Set targets and track your progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className={styles.goalStats}>
        <div className={styles.goalStatCard}>
          <Target size={20} style={{ color: 'var(--chart-1)' }} />
          <span className={styles.goalStatValue}>{activeGoals.length}</span>
          <span className={styles.goalStatLabel}>Active</span>
        </div>
        <div className={styles.goalStatCard}>
          <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
          <span className={styles.goalStatValue}>{completedGoals.length}</span>
          <span className={styles.goalStatLabel}>Completed</span>
        </div>
        <div className={styles.goalStatCard}>
          <Trophy size={20} style={{ color: 'var(--chart-5)' }} />
          <span className={styles.goalStatValue}>
            {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
          </span>
          <span className={styles.goalStatLabel}>Success Rate</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filter === 'active' ? styles.filterActive : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeGoals.length})
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'completed' ? styles.filterActive : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedGoals.length})
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className={styles.goalsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 20 }} />
          ))}
        </div>
      ) : displayGoals.length === 0 ? (
        <div className={styles.empty}>
          <Target size={48} style={{ color: 'var(--text-tertiary)' }} />
          <h3>{filter === 'active' ? 'No active goals' : 'No completed goals yet'}</h3>
          <p>Set a new goal to start tracking your progress!</p>
          {filter === 'active' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Create Goal
            </button>
          )}
        </div>
      ) : (
        <div className={styles.goalsGrid}>
          {displayGoals.map((goal, i) => {
            const pct = Math.round(Math.min((goal.current_value / goal.target_value) * 100, 100));
            const Icon = categoryIcons[goal.category] || Target;
            const color = categoryColors[goal.category] || 'var(--accent)';

            return (
              <motion.div
                key={goal.id}
                className={`${styles.goalCard} ${goal.completed ? styles.goalCompleted : ''}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className={styles.goalCardHeader}>
                  <div className={styles.goalIcon} style={{ background: `${color}15`, color }}>
                    <Icon size={20} />
                  </div>
                  <span className={`badge ${goal.completed ? 'badge-success' : 'badge-accent'}`}>
                    {goal.category}
                  </span>
                </div>

                <h4 className={styles.goalTitle}>{goal.title}</h4>
                {goal.description && <p className={styles.goalDesc}>{goal.description}</p>}

                {/* Progress Ring */}
                <div className={styles.progressSection}>
                  <div className={styles.progressRing}>
                    <svg viewBox="0 0 120 120" className={styles.ringSvg}>
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke="var(--bg-input)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${pct * 3.27} ${327 - pct * 3.27}`}
                        strokeDashoffset="82"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                    </svg>
                    <span className={styles.ringText}>{pct}%</span>
                  </div>
                  <div className={styles.progressDetails}>
                    <div className={styles.progressRow}>
                      <span>Current</span>
                      <strong>{goal.current_value} {goal.unit}</strong>
                    </div>
                    <div className={styles.progressRow}>
                      <span>Target</span>
                      <strong>{goal.target_value} {goal.unit}</strong>
                    </div>
                    {goal.deadline && (
                      <div className={styles.progressRow}>
                        <span>Deadline</span>
                        <strong>{format(new Date(goal.deadline), 'MMM d, yyyy')}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className={`btn btn-sm ${goal.completed ? 'btn-ghost' : 'btn-secondary'}`}
                  onClick={() => toggleComplete(goal)}
                  style={{ width: '100%', marginTop: 'var(--space-3)' }}
                >
                  <CheckCircle2 size={14} />
                  {goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Goal">
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group">
            <label>Goal Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Bench press 100kg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Description (optional)</label>
            <textarea
              className="input-field"
              placeholder="Describe your goal..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className={styles.formRow}>
            <div className="input-group">
              <label>Target Value</label>
              <input
                type="number"
                className="input-field"
                placeholder="100"
                value={form.target_value}
                onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label>Unit</label>
              <select
                className="select-field"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
                <option value="km">km</option>
                <option value="miles">miles</option>
                <option value="reps">reps</option>
                <option value="minutes">minutes</option>
                <option value="workouts">workouts</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className="input-group">
              <label>Category</label>
              <select
                className="select-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="weight">Weight</option>
                <option value="consistency">Consistency</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
            <div className="input-group">
              <label>Deadline (optional)</label>
              <input
                type="date"
                className="input-field"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Create Goal
          </button>
        </form>
      </Modal>
    </div>
  );
}
