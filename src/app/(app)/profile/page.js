'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Ruler, Weight, Calendar, Save,
  LogOut, Trash2, Shield, Moon, Sun,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import styles from './profile.module.css';

const fitnessGoals = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'stay_fit', label: 'Stay Fit' },
  { value: 'improve_endurance', label: 'Improve Endurance' },
  { value: 'flexibility', label: 'Improve Flexibility' },
];

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    height_cm: '',
    weight_kg: '',
    date_of_birth: '',
    gender: '',
    fitness_goal: '',
    units: 'metric',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        fitness_goal: profile.fitness_goal || '',
        units: profile.units || 'metric',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        full_name: form.full_name,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        fitness_goal: form.fitness_goal || null,
        units: form.units,
      });
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err?.message || err?.details || 'Failed to update profile. Have you run the SQL schema in Supabase?';
      setError(msg);
      console.error('Error updating profile:', msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h1>Profile & Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      {success && (
        <motion.div
          className={styles.success}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✅ {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 500,
            marginBottom: 'var(--space-6)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ❌ {error}
        </motion.div>
      )}

      <div className={styles.profileGrid}>
        <motion.div
          className={styles.profileCard}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <h3>{profile?.full_name || 'User'}</h3>
            <p>{user?.email}</p>
            <span className="badge badge-accent" style={{ marginTop: 8 }}>
              {profile?.fitness_goal?.replace('_', ' ') || 'No goal set'}
            </span>
          </div>
        </motion.div>

        <div className={styles.contentColumn}>
          <motion.div
            className={styles.settingsCard}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.cardHeader}>
              <h4><User size={18} /> Personal Information</h4>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className={styles.fieldGrid}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field" value={user?.email || ''} disabled />
              </div>
              <div className="input-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="175"
                  value={form.height_cm}
                  onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="input-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="70"
                  value={form.weight_kg}
                  onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="input-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  disabled={!editing}
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select
                  className="select-field"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  disabled={!editing}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className={styles.fullWidthField}>
                <label>Fitness Goal</label>
                <select
                  className="select-field"
                  value={form.fitness_goal}
                  onChange={(e) => setForm({ ...form, fitness_goal: e.target.value })}
                  disabled={!editing}
                >
                  <option value="">Select a goal</option>
                  {fitnessGoals.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {editing && (
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: 'var(--space-4)' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </motion.div>

          <motion.div
            className={styles.settingsCard}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.cardHeader}>
              <h4><Shield size={18} /> Preferences</h4>
            </div>

            <div className={styles.prefItem}>
              <div>
                <strong>Theme</strong>
                <p>Switch between light and dark mode</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            <div className={styles.prefItem}>
              <div>
                <strong>Units</strong>
                <p>Measurement units for your data</p>
              </div>
              <select
                className="select-field"
                value={form.units}
                onChange={(e) => {
                  setForm({ ...form, units: e.target.value });
                  updateProfile({ units: e.target.value });
                }}
                style={{ width: 'auto', minWidth: 120 }}
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, in)</option>
              </select>
            </div>
          </motion.div>

          <motion.div
            className={styles.settingsCard}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.cardHeader}>
              <h4>Account</h4>
            </div>

            <div className={styles.accountActions}>
              <button className="btn btn-secondary" onClick={signOut}>
                <LogOut size={16} />
                Sign Out
              </button>
              <button className="btn btn-danger btn-sm" style={{ opacity: 0.8 }}>
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
