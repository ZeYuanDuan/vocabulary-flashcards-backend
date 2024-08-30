const allowedOrigins = [
  "http://localhost:3000",
  "https://voc-memorize-project.onrender.com",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

module.exports = corsOptions;
