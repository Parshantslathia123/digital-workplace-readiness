const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    jobTitle: { type: String, default: '' },
    department: { type: String, default: '' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    workMode: { type: String, enum: ['Remote', 'Office', 'Hybrid'], default: 'Hybrid' },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    weeklySchedule: {
      Monday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Office' },
      Tuesday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Office' },
      Wednesday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Remote' },
      Thursday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Office' },
      Friday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Remote' },
      Saturday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Off' },
      Sunday: { type: String, enum: ['Remote', 'Office', 'Hybrid', 'Off'], default: 'Off' }
    },
    readiness: {
      connectivity: { type: Number, min: 0, max: 100, default: 70 },
      equipment: { type: Number, min: 0, max: 100, default: 70 },
      scheduleSync: { type: Number, min: 0, max: 100, default: 70 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('readinessScore').get(function () {
  const r = this.readiness || {};
  const c = r.connectivity || 0;
  const e = r.equipment || 0;
  const s = r.scheduleSync || 0;
  return Math.round((c + e + s) / 3);
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
