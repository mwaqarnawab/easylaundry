var express = require('express');
var router = express.Router();
var model = require('../models/index');
var trans = require('../plugins/transaction');
var ba64 = require("ba64");
const fs = require('fs');

/* Include token authentication methods */
var auth_file = require('../middleware/authentication')
var createToken = auth_file.createToken
var verifyToken = auth_file.verifyToken

trans.setModel(model);
var sequelize = require('sequelize');
const { request } = require('express');
const financial_details = require('../models/financial_details');


router.post('/getFinancialDetailsByUserId', function (req, res, next) {
	
	Promise.resolve(model.financial_details
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('user')),
						sequelize.fn('lower', req.body.user_id)
					)
				]
			}
		}))
		.then(data => {
			if (!data) {
                result = {"err_msg": "No earning details exist"}
				return res.status(400).send(result);
            }
            else{
                result = { 'financial_details': data }
				return res.status(200).send(result);

            }
        })
			
});


module.exports = router;
