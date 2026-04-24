const express = require("express");

const router = express.Router();

router.get("/latest", (req, res) => {
  res.json({
    message: "Latest prices endpoint coming soon"
  });
});

module.exports = router;