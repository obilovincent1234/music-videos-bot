var express = require('express');
var router = express.Router();

let messageController = require('../controller/messageController');


/* POST messages income from telegram. */
router.post('/new', messageController.newMessage);

module.exports = router;
