import Counter from '../models/counter.js';
import Worker from '../models/worker.js';

const COUNTER_KEY = 'workerId';
const PREFIX = 'W';
const PADDING = 3;

const format = (num) => `${PREFIX}${String(num).padStart(PADDING, '0')}`;

const getMaxExistingNumber = async () => {
  const workers = await Worker.find({}, { workerId: 1 }).lean();

  return workers.reduce((max, { workerId }) => {
    const num = parseInt(String(workerId).replace(PREFIX, ''), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);
};

const ensureCounter = async () => {
  const counter = await Counter.findById(COUNTER_KEY).lean();
  if (counter) return;

  const seq = await getMaxExistingNumber();

  try {
    await Counter.updateOne(
      { _id: COUNTER_KEY },
      { $setOnInsert: { seq } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

// Next ID to display on the form (does not reserve it)
export const peekNextWorkerId = async () => {
  const counter = await Counter.findById(COUNTER_KEY).lean();
  const current = counter ? counter.seq : await getMaxExistingNumber();
  return format(current + 1);
};

// Atomically reserve and return the next ID
export const generateWorkerId = async () => {
  await ensureCounter();

  const counter = await Counter.findOneAndUpdate(
    { _id: COUNTER_KEY },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  ).lean();

  return format(counter.seq);
};
