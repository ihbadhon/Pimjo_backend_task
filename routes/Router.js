import express from "express";
import MaxReqCheck from "../middleware/MaxReqCheck.js";

const router = express.Router();

router.post("/action", MaxReqCheck, (req, res) => {
  res.send({ message: "done" });
});

export default router;
