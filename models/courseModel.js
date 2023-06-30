const mongoose = require('mongoose');
const { Schema } = mongoose;
const { ObjectId } = Schema;

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    content: {
      type: {},
      minlength: 200,
    },
    video: {},
    free_preview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const coursesSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    level: {
      type: String,
      default: 'beginner',
      enum: ['beginner', 'intermediate', 'expert', 'all'],
    },

    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: {},
      minlength: 200,
      required: true,
    },
    price: {
      type: Number,
      default: 9.99,
    },
    image: {},
    category: String,
    status: {
      type: String,
      default: 'pending',
      enum: ['denied', 'pending', 'published'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
    instructor: {
      type: ObjectId,
      ref: 'users',
      // ref: mongoose.model('User', schema),
      required: true,
    },
    category: String,
    language: String,
    duration: String,
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

const Course = mongoose.model('courses', coursesSchema);

module.exports = Course;
