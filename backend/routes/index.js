const express = require("express")

const router = express.Router()

const soilRoute = require("./soilRoutes")
const authRoute = require("./auth")
const userRoute = require("./user")
const aiRoute = require("./ai")
const articleRoute = require("./article")
const journalRoute = require("./journal")
const moodRoute = require("./mood")

router.use("/soil",soilRoute)
router.use("/auth",authRoute)
router.use("/user",userRoute)
router.use("/ai",aiRoute)
router.use("/article",articleRoute)
router.use("/journal",journalRoute)
router.use("/mood", moodRoute)

module.exports = router