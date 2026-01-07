const {
  getPostgresConnection,
  getPostgresConnection2
} = require("../db");

function resolveTenant(req, res, next) {
  // Login nunca exige tenant
  if (req.path === "/login") {
    return next();
  }

  const org = req.headers["x-organization-id"];

  if (!org) {
    return res.status(400).json({
      message: "Organização não informada"
    });
  }

  switch (org) {
    case "malagah":
      req.db = getPostgresConnection();
      break;

    case "itsmy":
      req.db = getPostgresConnection2();
      break;

    default:
      return res.status(400).json({
        message: "Organização inválida"
      });
  }

  req.organization = org;
  next();
}

module.exports = resolveTenant;