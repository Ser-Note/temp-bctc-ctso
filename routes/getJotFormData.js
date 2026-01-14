const express = require('express');
const router = express.Router();
require('dotenv').config();

const JotFormService = require('../services/jotformService');

const API_KEY = process.env.API_KEY;
const FORM_ID = process.env.FORM_ID;
const jotFormService = new JotFormService(API_KEY); 

router.get('/', async (req, res) => 
{

    try
    {
        const submissions = await jotFormService.getFormSubmissions(FORM_ID);
        res.status(200).json(submissions);

    } catch (error)
    {
        res.status(500).json({ message: "Failed to retrieve Jotform submissions", error: error.message });
    }

});

module.exports = router;