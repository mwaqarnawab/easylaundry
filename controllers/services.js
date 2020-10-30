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
const laundry_owner_services = require('../models/laundry_owner_services');


router.post('/add', function (req, res, next) {
	req.body.user.role = parseInt(req.body.user.role)
	let user_detail = req.body.user;
	let address_detail = req.body.address;
	console.log(address_detail.cnic_front)
	cnic_front_image = ""
	cnic_back_image = ""

	cnic_front_image_extension = ""
	cnic_back_image_extension = ""

	if (address_detail.cnic_front && address_detail.cnic_front != "" && address_detail.cnic_front != null) {
		cnic_front_image = address_detail.cnic_front
		image_extension = cnic_front_image.substring("data:image/".length, cnic_front_image.indexOf(";base64"))
		address_detail.cnic_front_image_extension = image_extension
		address_detail.cnic_front = ""
	}

	if (address_detail.cnic_back && address_detail.cnic_back != "" && address_detail.cnic_back != null) {
		cnic_back_image = address_detail.cnic_back
		image_extension = cnic_back_image.substring("data:image/".length, cnic_back_image.indexOf(";base64"))
		address_detail.cnic_back_image_extension = image_extension
		address_detail.cnic_back = ""
	}




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
				.then(data => {
					if (data) {
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
								return Promise.resolve(model.users
									.create(user_detail, {
										transaction: t
									}))
									.then(user => {


										// //Write cnic front image
										// if(cnic_front_image != ""){
										// 	data_url = cnic_front_image;
										// 	ba64.writeImageSync("images/user"+user.user_id+"front", data_url);
										// }

										// //Write cnic back image
										// if(cnic_back_image != ""){
										// 	data_url = cnic_back_image;
										// 	ba64.writeImageSync("images/user"+user.user_id+"back", data_url);
										// }





										// let buff = new Buffer.from(cnic_front_image, 'base64');
										// fs.writeFileSync('images/user'+user.user_id+'front.'+image_extension, buff);

										t.commit();
										res.status(200).send(user)
										return

									});
							})

					});
				});
		});
});


router.post('/addService', function (req, res, next) {
	 let request = req.body.service;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	model.laundry_owner_services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('service')),
						sequelize.fn('lower', request.service)
					),
					sequelize.where(
						sequelize.fn('lower', sequelize.col('laundry_owner')),
						sequelize.fn('lower', request.laundry_owner)
					),

				]
			}
		})
		.then(data => {
			if (data) {
				
					res.status(400).send('The Service for this Laundry owner already Exist');
					return;
				}
				else {

					
					trans.execTrans(res, t => {
						return Promise.resolve(model.laundry_owner_services
							.create(request, {
								transaction: t
							}))
							.then(service => {
								t.commit();
								res.status(200).send('Service Added Successfully')
								return

							});
					})
				}
			
		});

});


router.post('/updateService', function (req, res, next) {
	let request = req.body.service;

   // CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
   model.laundry_owner_services
	   .findOne({
		   where: {
			   $and: [
				   sequelize.where(
					   sequelize.fn('lower', sequelize.col('service')),
					   sequelize.fn('lower', request.service)
				   ),
				   sequelize.where(
					   sequelize.fn('lower', sequelize.col('laundry_owner')),
					   sequelize.fn('lower', request.laundry_owner)
				   ),

			   ]
		   }
	   })
	   .then(data => {
		   if (data) {
			   
				   res.status(400).send('The Service for this Laundry owner already Exist');
				   return;
			   }
			   else {

				   
				   trans.execTrans(res, t => {
					   return Promise.resolve(model.laundry_owner_services

						.update(
							{
								service: request.service,
							},
							{
								where: {
									los_id: request.los_id
								},
								transaction: t,
								individualHooks: true
							}
						))
						   .then(service => {
							   t.commit();
							   res.status(200).send('Service Updated Successfully')
							   return

						   });
				   })
			   }
		   
	   });

});



router.get('/findAllCategories', function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL

	model.service_categories
		.findAll({
			
		})
		.then(data => {
			if(data) {
			result = { 'service_categories': data }
						return res.status(200).send(result);
			}

			else {
				result = { 'err_msg': "No Service Categories exists in database" }
				res.status(400).send(result);
				return;
			}
		});

});


router.post('/deleteService', function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL

	model.laundry_owner_services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('los_id')),
						sequelize.fn('lower', req.body.los_id)
					)
				]
			}
		})
		.then(data => {
			if(data) {
				model.laundry_owner_services
		.destroy({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('los_id')),
						sequelize.fn('lower', req.body.los_id)
					)
				]
			}
		})
		.then(response => {
			
						return res.status(200).send("Service Deleted Successfully");
			})
		}

			else {
				result = { 'err_msg': "No such Service Exist for this Laundry Owner" }
				res.status(400).send(result);
				return;
			}
		});

});

router.post('/findByCategory', function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL

	model.services
		.findAll({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('service_category')),
						sequelize.fn('lower', req.body.category_id)
					)
				]
			}
		})
		.then(data => {

			if (data) {
				model.service_categories
					.findOne({
						where: {
							$and: [
								sequelize.where(
									sequelize.fn('lower', sequelize.col('category_id')),
									sequelize.fn('lower', req.body.category_id)
								)
							]
						}
					}).then(category => {
						
						var i;
for (i = 0; i < data.length; i++) {
  data[i].service_category = category;
}
						// data.service_category = category
						console.log(data)
						result = { 'services': data }
						return res.status(200).send(result);
					})


			}

			else {
				result = { 'err_msg': "No Service(s) exists in this category" }
				res.status(400).send(result);
				return;
			}
		});

});



router.post('/findByLaundryOwner', async function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL
	laundry_owner_service = []
	// laundry_ser = []
	await Promise.resolve(model.laundry_owner_services
		.findAll({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('laundry_owner')),
						sequelize.fn('lower', req.body.laundry_owner)
					)
				]
			}
		}))
		.then(data => { 
			if(!data){
				return res.status(400).send("No Service Exist for this Laundry Owner");
			}
			laundry_owner_service = data
			// laundry_ser = laundry_owner_service
		})
		
		// var i;
		// for(i=0; i<laundry_owner_service.length; i++){
			laundry_owner_service.forEach(myFunction);
			function myFunction(los, i){
			lo_id = los.laundry_owner 
			service_id = los.service
			
			// console.log(laundry_ser)
			 model.users
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('user_id')),
								sequelize.fn('lower', req.body.laundry_owner)
							)
						]
					}
				})
				.then(user => { 
					// console.log(laundry_ser)
					los.laundry_owner = user

					model.address
						.findOne({
							where: {
								$and: [
									sequelize.where(
										sequelize.fn('lower', sequelize.col('address_id')),
										sequelize.fn('lower', user.address)
									)
								]
							}
						}).then(address => {
							los.laundry_owner.address = address
					 model.services
						.findOne({
							where: {
								$and: [
									sequelize.where(
										sequelize.fn('lower', sequelize.col('service_id')),
										sequelize.fn('lower', service_id)
									)
								]
							}
						}).then(service => {
							los.service = service

							model.service_categories
							.findOne({
								where: {
									$and: [
										sequelize.where(
											sequelize.fn('lower', sequelize.col('category_id')),
											sequelize.fn('lower', service.service_category)
										)
									]
								}
							}).then(category => {
								los.service.service_category = category

							if(i+1 == laundry_owner_service.length){
							result = { 'services': laundry_owner_service }
										return res.status(200).send(result);
							}
					
				})
			})
			})
			})
		}

		// console.log(data)
						

// 			if (data) {
// 				model.service_categories
// 					.findOne({
// 						where: {
// 							$and: [
// 								sequelize.where(
// 									sequelize.fn('lower', sequelize.col('category_id')),
// 									sequelize.fn('lower', req.body.category_id)
// 								)
// 							]
// 						}
// 					}).then(category => {
						
// 						var i;
// for (i = 0; i < data.length; i++) {
//   data[i].service_category = category;
// }
// 						data.service_category = category
// 						console.log(data)
// 						result = { 'services': data }
// 						return res.status(200).send(result);
// 					})


// 			}

// 			else {
// 				result = { 'err_msg': "No Service(s) exists in this category" }
// 				res.status(400).send(result);
// 				return;
// 			}
// 		});

});



router.post('/findByServiceId', function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL
	laundry_owner_service = []
	// laundry_ser = []
	Promise.resolve(model.laundry_owner_services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('service')),
						sequelize.fn('lower', req.body.service)
					)
				]
			}
		}))
		.then(data => { 
			if(!data){
				return res.status(400).send("No Service Exist With this Id");
			}
			laundry_owner_service = data

			service_id = laundry_owner_service.service
			
			// console.log(laundry_ser)
			 model.users
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('user_id')),
								sequelize.fn('lower', laundry_owner_service.laundry_owner)
							)
						]
					}
				})
				.then(user => { 
					// console.log(laundry_ser)
					laundry_owner_service.laundry_owner = user

					model.address
						.findOne({
							where: {
								$and: [
									sequelize.where(
										sequelize.fn('lower', sequelize.col('address_id')),
										sequelize.fn('lower', user.address)
									)
								]
							}
						}).then(address => {
							laundry_owner_service.laundry_owner.address = address
					 model.services
						.findOne({
							where: {
								$and: [
									sequelize.where(
										sequelize.fn('lower', sequelize.col('service_id')),
										sequelize.fn('lower', service_id)
									)
								]
							}
						}).then(service => {
							laundry_owner_service.service = service

							model.service_categories
							.findOne({
								where: {
									$and: [
										sequelize.where(
											sequelize.fn('lower', sequelize.col('category_id')),
											sequelize.fn('lower', service.service_category)
										)
									]
								}
							}).then(category => {
								laundry_owner_service.service.service_category = category

							result = { 'service': laundry_owner_service }
										return res.status(200).send(result);
							
					
				})
			})
			})
			})
		})
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
