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

router.get('/', function (req, res, next) {
	var vm = req.query;
	let and = [];
	if (vm.user_id)
		and.push(sequelize.where(sequelize.col('user_id'), parseInt(vm.user_id)));
	if (vm.profile_id)
		and.push(
			sequelize.where(sequelize.col('profile_id'), parseInt(vm.profile_id))
		);
	if (vm.name)
		and.push(
			sequelize.where(sequelize.fn('lower', sequelize.col('name')), {
				[sequelize.Op.like]: `%${vm.name.toLowerCase()}%`
			})
		);
	if (vm.is_active != null)
		and.push(
			sequelize.where(
				sequelize.col('is_active'),
				vm.is_active == 'true' ? 1 : 0
			)
		);
	console.log('get => vm', vm);
	model.users
		.findAll({
			attributes: ['user_id', 'profile_id', 'name', 'is_active'],
			where: {
				$and: and
			},
			order: [['name', 'ASC']]
		})
		.then(result => {
			res.send(200, result);
		});
});


router.post('/getUserById', function (req, res, next) {
	let user = req.body;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	Promise.resolve(model.users
		.findOne({
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('user_id')),
						sequelize.fn('lower', user.user_id)
					),
					
				]
			}
		}))
		.then(data => {
			if (data) {
				data.password = ""
				model.address
		.findOne({
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('address_id')),
						sequelize.fn('lower', data.address)
					),
					
				]
			}
		})
		.then(address => {
				data.address = address
				result = { 'user': data }
				res.status(200).send(result);
				return;
			})
		}
			else {
				res.status(400).send('No User Found with this Id');
				return;
			}
		});
});


router.post('/getAllLaundryOwners', async function (req, res, next) {
	let user = req.body;
	laundryOwners = []

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	await Promise.resolve(model.users
		.findAll(
			{
				where: {
					$and: [
						sequelize.where(
							sequelize.fn('lower', sequelize.col('role')),
							sequelize.fn('lower', 2)
						),
						sequelize.where(
							sequelize.fn('lower', sequelize.col('status')),
							sequelize.fn('lower', 1)
						),
						
					]
				}
			}
		))
		.then(data => {
			if (data) {
				laundryOwners = data
			}
		
			else {
				res.status(400).send('No Laundry Owner Exist');
				return;
			}

		})


		for (let i = 0; i < laundryOwners.length; i++) {

			const address = await model.address
		.findOne({
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('address_id')),
						sequelize.fn('lower', laundryOwners[i].address)
					),
					
				]
			}
		})
		
			laundryOwners[i].address = address
			laundryOwners[i].password = ""
			
			
		}
		result = { 'laundryOwners': laundryOwners }
		return res.status(200).send(result);
		
			
		})
		
			
		


		router.post('/getAllLaundryOwnersByName', async function (req, res, next) {
			let laundryName = req.body.laundryName;
			laundryOwners = []
		
			// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
			await Promise.resolve(model.users
				.findAll(
					{
						where: {
							$and: [
								sequelize.where(
									sequelize.fn('lower', sequelize.col('role')),
									sequelize.fn('lower', 2)
								),
								sequelize.where(
									sequelize.fn('lower', sequelize.col('status')),
									sequelize.fn('lower', 1)
								),
								
							]
						}
					}
				))
				.then(data => {
					if (data) {
						laundryOwners = data
					}
				
					else {
						res.status(400).send('No Laundry Owner Exist');
						return;
					}
		
				})
		
				resolveLaundryOwnerData(req, res, laundryOwners, laundryName);
					
		
			})
				

async function resolveLaundryOwnerData(req, res, laundryOwners, laundryName) {


	for (let i = 0; i < laundryOwners.length; i++) {

		const address = await model.address
		.findOne({
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('address_id')),
						sequelize.fn('lower', laundryOwners[i].address)
					),
					
				]
			}
		})

		if(address.laundry_name.toLowerCase().includes(laundryName.toLowerCase())){
			laundryOwners[i].address = address
			laundryOwners[i].password = ""
		}
		else{
			delete laundryOwners[i]
		}

		

	}
	var filtered = laundryOwners.filter(function (el) {
		return el != null;
	  });
	result = { 'laundryOwners': filtered }
	return res.status(200).send(result);
}

router.post('/checkIfUserExist', function (req, res, next) {
	let user = req.body;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	model.users
		.findOne({
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('email')),
						sequelize.fn('lower', user.email)
					),
					// sequelize.where(
					// 	sequelize.fn('lower', sequelize.col('mobile_no')),
					// 	sequelize.fn('lower', user.mobile_no)
					// )
				]
			}
		})
		.then(data => {
			if (data) {
				res.status(400).send('This Email is already Registered');
				return;
			}
			else {
				res.status(200).send('No User Found with this Email');
				return;
			}
		});
});

router.post('/register', function (req, res, next) {
	req.body.user.role = parseInt(req.body.user.role)
	if(parseInt(req.body.user.role) == 3){
		req.body.user.status = 1
	}
	let user_detail = req.body.user;
	let address_detail = req.body.address;
	// console.log(address_detail.cnic_front)
	cnic_front_filename = address_detail.cnic_front_filename
	cnic_back_filename = address_detail.cnic_back_file_name
	cnic_front_filename_ext=""
	cnic_front_filename_ext = ""
	cnic_front_image = ""
	cnic_back_image = ""
	// pntn_certificate = ""

	
	// pntn_certificate_extension = ""

	if(address_detail.cnic_front && address_detail.cnic_front != "" && address_detail.cnic_front != null){
		cnic_front_filename_ext = cnic_front_filename.slice(cnic_front_filename.lastIndexOf('.') + 1);
		cnic_front_image = "data:image/"+cnic_front_filename_ext+ ";base64," + address_detail.cnic_front
		address_detail.cnic_front_image_extension = cnic_front_filename
		address_detail.cnic_front = ""
	}

	if(address_detail.cnic_back && address_detail.cnic_back != "" && address_detail.cnic_back != null){
		cnic_back_filename_ext = cnic_back_filename.slice(cnic_back_filename.lastIndexOf('.') + 1);
		cnic_back_image = "data:image/"+cnic_back_filename_ext+ ";base64," + address_detail.cnic_back
		address_detail.cnic_back_image_extension = cnic_back_filename
		address_detail.cnic_back = ""
	}
	// if(address_detail.pntn_certificate && address_detail.pntn_certificate != "" && address_detail.pntn_certificate != null){
	// 	pntn_certificate = address_detail.pntn_certificate
	// 	image_extension = pntn_certificate.substring("data:image/".length, pntn_certificate.indexOf(";base64"))
	// 	address_detail.pntn_certificate_extension = image_extension
	// 	address_detail.pntn_certificate = ""
	// }
	

	

	// let buff = new Buffer.from(data, 'base64');
	// fs.writeFileSync('stack-abuse-logo-out.png', buff);

	// let buff = fs.readFileSync('images/stack-abuse-logo-out');
	// let base64data = buff.toString('base64');
	// res.status(200).send(base64data);
	// return

		
			
	// CHECK IF THE PROFILE EXISTS
	model.roles
		.findOne({
			where: {
				role_id: user_detail.role
			}
		})
		.then(data => {
			if (!data) {
				res.send(400, 'Role not found');
				return;
			}

			// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
			model.users
				.findOne({
					where: {
						$or: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('email')),
								sequelize.fn('lower', user_detail.email)
							),
							// sequelize.where(
							// 	sequelize.fn('lower', sequelize.col('mobile_no')),
							// 	sequelize.fn('lower', user_detail.mobile_no)
							// )
						]
					}
				})
				.then(userdata => {
					if (userdata) {
						res.status(400).send('There is another user with this Email');
						return;
					}

					trans.execTrans(res, t => {
						 return Promise.resolve(model.address
							.create(address_detail, {
								transaction: t

							}))
							.then(address => {

								user_detail.address = address.address_id
								 Promise.resolve(model.users
									.create(user_detail, {
										transaction: t
									}))
									.then(user => {
										
										
										// //Write cnic front image
										if(cnic_front_image != ""){
											data_url = cnic_front_image;
											ba64.writeImageSync("images/user"+user.user_id+"front", data_url);
										}

										// //Write cnic back image
										if(cnic_back_image != ""){
											data_url = cnic_back_image;
											ba64.writeImageSync("images/user"+user.user_id+"back", data_url);
										}
										
										// //Write pntn certificate image
										// if(pntn_certificate != ""){
										// 	data_url = pntn_certificate;
										// 	ba64.writeImageSync("images/user"+user.user_id+"pntn", data_url);
										// }
										
									


										// let buff = new Buffer.from(cnic_front_image, 'base64');
										// fs.writeFileSync('images/user'+user.user_id+'front.'+image_extension, buff);

										t.commit();

										if(parseInt(req.body.user.role) == 2){
										var nodemailer = require('nodemailer');

										var transporter = nodemailer.createTransport({
											service: 'gmail',
											auth: {
												user: 'easylaundry.pk@gmail.com',
												pass: 'EasyLaundry@12'
											}
										});

										var mailOptions = {
											from: 'easylaundry.pk@gmail.com',
											to: user.email,
											subject: 'EasyLaundry - Registration',
											html: '<p> Hi '+ user.first_name+ ', </p> <br/> <p> Your Request to Register with EasyLaundry has been received. Our Administration will review your informaion and Approve/Reject your account</p> <br/> <br/> <p> BR, </p> <p> EasyLaundry</p>'

											// text: 'Hi '+ user.first_name+ ', Your Request to Register with EasyLaundry has been received. Our Administration will review your informaion and Approve/Reject your account'
										};

										transporter.sendMail(mailOptions, function (error, info) {
											if (error) {
												console.log(error);
											} else {
												console.log('Email sent: ' + info.response);
											}
										});
									}

										res.status(200).send(user)
										return

									});
							})

					});
				});
		});
});



router.post('/addTaxPercentage',async function (req, res, next) {

	let tax_detail = req.body.tax_detail;

	
	pntn_certificate = ""

	
	pntn_certificate_extension = tax_detail.pntn_filename
	extension = tax_detail.pntn_filename.split(".")[1]
	tax_detail.pntn_certificate_extension = extension
	console.log(extension)

	if(tax_detail.pntn_certificate && tax_detail.pntn_certificate != "" && tax_detail.pntn_certificate != null){
		pntn_certificate = tax_detail.pntn_certificate
		pntn_certificate = "data:image/" + extension + ";base64," + pntn_certificate
		// image_extension = pntn_certificate.substring("data:image/".length, pntn_certificate.indexOf(";base64"))
		// tax_detail.pntn_certificate_extension = image_extension
		tax_detail.pntn_certificate = null
	}
		
	// let buff = new Buffer.from(data, 'base64');
	// fs.writeFileSync('stack-abuse-logo-out.png', buff);

	// let buff = fs.readFileSync('images/stack-abuse-logo-out');
	// let base64data = buff.toString('base64');
	// res.status(200).send(base64data);
	// return

		const tax = await model.tax_details
		.create(tax_detail)
		
		if(pntn_certificate != ""){
			const data_url = pntn_certificate;
			const abc = await ba64.writeImageSync("images/user"+tax_detail.user+"pntn", data_url);
		}
				// let buff = new Buffer.from(cnic_front_image, 'base64');
				// fs.writeFileSync('images/user'+user.user_id+'front.'+image_extension, buff);

				// t.commit();
				result = {"tax_detail" : tax, "msg": "Tax Detail Added Successfully"}
				res.status(200).send(result)
				return
		
});


router.post('/updateTaxPercentage',async function (req, res, next) {

	let tax_detail = req.body.tax_detail;



	const tax = await model.tax_details.update(tax_detail, 
			
		{
		where: {
			td_id: tax_detail.td_id
		}
	})

		result = {"msg": "Tax Detail Updated Successfully"}
		res.status(200).send(result)
		return
					
							
		
});



router.post('/getTaxPercentageByUserId',async function (req, res, next) {

	let user_id = req.body.user_id;



	const tax = await model.tax_details.findOne(


		{
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('user')),
						sequelize.fn('lower', user_id)
					),
				]
			}
		})

		result = {"tax_detail": tax}
		res.status(200).send(result)
		return
					
							
		
});


router.post('/deleteTaxPercentage',async function (req, res, next) {

	let td_id = req.body.td_id;



	const tax = await model.tax_details.destroy(

		{
			where: {
				td_id: td_id
			}
		})

		result = {"msg": "Tax Details deleted successfully"}
		res.status(200).send(result)
		return
					
							
		
});



router.post('/update', function (req, res, next) {
	
	let user_detail = req.body.user;
	let address_detail = req.body.address;
			

			// CHECK IF USER EXIST
			model.users
				.findOne({
					where: {
						$or: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('email')),
								sequelize.fn('lower', user_detail.email)
							),
							// sequelize.where(
							// 	sequelize.fn('lower', sequelize.col('mobile_no')),
							// 	sequelize.fn('lower', user_detail.mobile_no)
							// )
						]
					}
				})
				.then(data => {
					if (data && data.user_id != user_detail.user_id) {
						result = {'err_msg': 'There is another user with this Email'}
						res.status(400).send(result);
						return;
					}
					Promise.resolve(model.users
				.findOne({
					where: {
						$or: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('user_id')),
								sequelize.fn('lower', user_detail.user_id)
							),
						]
					}
				})).then(currentUser => {
					if(!currentUser){
						result = {'err_msg': 'There is no user with this Id'}
						res.status(400).send(result);
						return;
					}

					trans.execTrans(res, t => {
						return Promise.resolve(model.address
							.update(address_detail, 
								
								{
									where: {
										address_id: currentUser.address
									},
									transaction: t,
									individualHooks: true
								}))
							.then(address => {

								return Promise.resolve(model.users
									.update(user_detail, {
										where: {
											user_id: user_detail.user_id
										},
										transaction: t,
										individualHooks: true
									}))
									.then(updatedUser => {
										t.commit();
										result = {'msg': 'User Updated Successfully'}
										res.status(200).send(result)
										return

									});
							})

					});
				});
		});
});


router.post('/changePassword', function (req, res, next) {
	let user = req.body;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	model.users
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('email')),
						sequelize.fn('lower', user.email)
					)
				]
			}
		})
		.then(data => {
			if (data) {
				if (data.password == user.password) {
					res.status(400).send('Password is same as old password');
					return;
				}
				else {

					trans.execTrans(res, t => {
						return Promise.resolve(model.users
							.update(
								{
									password: user.password,
								},
								{
									where: {
										user_id: data.user_id
									},
									transaction: t,
									individualHooks: true
								}
							))
							.then(user => {
								t.commit();
								res.status(200).send('Pasword Updated Successfully')
								return

							});
					})
				}
			}
			else {
				res.status(400).send('No User Exist with this Email');
				return;
			}
		});

});


router.post('/findMobileNoByEmail', function (req, res, next) {
	let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL
	model.users
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('email')),
						sequelize.fn('lower', user.email)
					)
				]
			}
		})
		.then(data => {
			if (data) {

					result = {'mobile_no': data.mobile_no}
					return res.status(200).send(result);
					
				}
				
			else {
				result = {'err_msg': "No User Exist with this Email"}
				res.status(400).send(result);
				return;
			}
		});

});


router.post('/login', function (req, res, next) {
	let user = req.body;

		// //Read Image
		// let buff = fs.readFileSync('images/user'+user.user_id+"front."+image_extension);
		// let base64data = buff.toString('base64');

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	model.users
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.col('password'), user.password
					),
					sequelize.where(
						sequelize.fn('lower', sequelize.col('email')),
						sequelize.fn('lower', user.email)

					)
				]
			}
		})
		.then(data => {
			if (data) {
				if(data.status == 0 || data.status == '0'){
					response = {"msg": "Your Account is not Active", "user_status": 0}
					res.status(400).send(response)
				}
				if(data.status == 2 || data.status == '2'){
					response = {"msg": "Your Account is Blacklisted", "user_status": 2}
					res.status(400).send(response)
				}
				
				Promise.resolve(model.address
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('address_id')),
						sequelize.fn('lower', data.address)
					)
				]
			}
		}))
		.then(address => {
			data.address = address
			Promise.resolve(model.roles
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('role_id')),
						sequelize.fn('lower', data.role)
					)
				]
			}
		}))
		.then(role => {
			data.role = role
				var token = createToken().compact();
				res.append('token', [token])
				res.status(200).send(data)
				
				// res.status(200).send('You are logged In to app');
				// return;
		})
	})
			}

			else {
				res.status(400).send('Incorrect Email or Password');
				return;
			}

		});


});


// router.post('/register', function (req, res, next) {
// 	let user_detail = req.body.user;
// 	let address_detail = req.body.address;

// 	// CHECK IF THE PROFILE EXISTS
// 	model.roles
// 		.findOne({
// 			where: {
// 				role_id: user_detail.role
// 			}
// 		})
// 		.then(data => {
// 			if (!data) {
// 				res.send(400, 'Role not found');
// 				return;
// 			}

// 			// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
// 			model.users
// 				.findOne({
// 					where: {
// 						$or: [
// 							sequelize.where(
// 								sequelize.fn('lower', sequelize.col('email')),
// 								sequelize.fn('lower', user_detail.email)
// 							),
// 							sequelize.where(
// 								sequelize.fn('lower', sequelize.col('mobile_no')),
// 								sequelize.fn('lower', user_detail.mobile_no)
// 							)
// 						]
// 					}
// 				})
// 				.then(data => {
// 					if (data) {
// 						res.status(400).send('There is another user with this Email or Mobile No');
// 						return;
// 					}

// 					trans.execTrans(res, t => {
// 						return Promise.resolve(model.address
// 							.create(address_detail, {
// 								transaction: t

// 							}))
// 							.then(address => {

// 								user_detail.address = address.address_id
// 								model.users
// 									.create(user_detail, {
// 										transaction: t
// 									})
// 									.then(user => {
// 										t.commit();
// 										res.status(200).send('User Registered Successfully')
// 										return

// 									});
// 							})

// 					});
// 				});
// 		});
// });


router.get('/createToken', function (req, res, next) {

	var token = createToken().compact();
	res.status(200).send(token)
})

router.get('/verifyToken', function (req, res, next) {

	var token = req.headers.token

	Promise.resolve(verifyToken(req, res, token)).then(result => {
		if (!result) {
			return res.status(404).send("Invalid/Expired Token")
		}
		var token = createToken().compact();
		res.append('token', [token])
		res.status(200).send()
	})
})


router.put('/', function (req, res, next) {
	let vm = req.body;

	// CHECK IF USER EXISTS
	model.users
		.findOne({
			where: {
				user_id: vm.user_id
			}
		})
		.then(data => {
			if (!data) {
				res.send(400, 'User not found');
				return;
			}

			// CHECK IF THE PROFILE EXISTS
			model.profiles
				.findOne({
					where: {
						profile_id: vm.profile_id
					}
				})
				.then(data => {
					if (!data) {
						res.send(400, 'Profile not found');
						return;
					}

					// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
					model.users
						.findOne({
							where: {
								$and: [
									sequelize.where(
										sequelize.fn('lower', sequelize.col('name')),
										sequelize.fn('lower', vm.name)
									),
									sequelize.where(sequelize.col('user_id'), { $not: vm.user_id })
								]
							}
						})
						.then(data => {
							if (data) {
								res.send(400, 'There is another user with this name');
								return;
							}

							return trans.execTrans(res, t => {
								return model.users
									.update(
										{
											name: vm.name,
											is_active: vm.is_active == 'true' ? 1 : 0
										},
										{
											where: {
												user_id: vm.user_id
											},
											transaction: t,
											individualHooks: true
										}
									)
									.then(user => {
										res.send(200);
									});
							});
						});
				});
		});
});
router.delete('/', function (req, res, next) {
	var vm = req.query;

	// CHECK IF USER EXISTS
	model.users
		.findOne({
			where: {
				user_id: vm.user_id
			}
		})
		.then(data => {
			if (!data) {
				res.send(400, 'User not found');
				return;
			}

			return trans.execTrans(res, t => {
				return model.users
					.destroy(
						{
							where: {
								user_id: vm.user_id
							}
						},
						{
							transaction: t
						}
					)
					.then(result => {
						res.send(200);
					});
			});
		});
});


module.exports = router;
