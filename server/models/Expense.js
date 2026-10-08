import mongoose from 'mongoose';

const expenseParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shareAmount: {
      type: Number,
      required: true,
      min: [0, 'Share amount must be non-negative'],
    },
    // Optional raw input for auditing/re-editing (e.g. 25% or 2 shares or 1000 exact)
    inputValue: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Food',
        'Travel',
        'Hotel',
        'Shopping',
        'Entertainment',
        'Education',
        'Medical',
        'Rent',
        'Utilities',
        'Other',
      ],
      default: 'Food',
    },
    splitType: {
      type: String,
      required: true,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      default: 'equal',
    },
    participants: {
      type: [expenseParticipantSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'An expense must have at least one participant',
      },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    receipt: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ groupId: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'participants.user': 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
