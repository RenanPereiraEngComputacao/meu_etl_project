const {
  getPostgresConnection,
  getPostgresConnection2
} = require("../db");

function resolveTenant(req, res, next) {
  const org = req.headers["x-organization"];

  if (!org) {
    return res.status(400).json({ message: "Organização não informada" });
  }

  switch (org) {
    case "malagah":
      req.db = getPostgresConnection();
      break;

    case "itsmy":
      req.db = getPostgresConnection2();
      break;

    default:
      return res.status(400).json({ message: "Organização inválida" });
  }

  next();
}

module.exports = resolveTenant;
