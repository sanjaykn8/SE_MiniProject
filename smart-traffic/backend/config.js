module.exports = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/smart_traffic', // change to Atlas if needed
  JWT_SECRET: 'replace_this_with_a_secure_secret',
  PYTHON_PATH: 'python', // or 'python3' if needed
  PREDICT_SCRIPT: './ml/predict.py'
};
