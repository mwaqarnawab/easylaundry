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


router.post('/updateService',async function (req, res, next) {
	let request = req.body.service;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	   const changes = await model.services_change_requests
		   .findOne({
			   where: {
				   $and: [
					   sequelize.where(
						   sequelize.fn('lower', sequelize.col('los_id')),
						   sequelize.fn('lower', request.los_id)
					   )

				   ]
			   }
		   })
		if(changes && changes!=null){
			const updatedChanges = await model.services_change_requests
		
					.update(
						{
							description: request.description,
							charges: request.charges
						},
						{
							where: {
								los_id: request.los_id
							}
						}
					)
					
				
		
					
			
		}
		else{

			

	const service = await model.services_change_requests

			.create(request)
			
				

		}


		const los_detail = await model.laundry_owner_services
		   .findOne({
			   where: {
				   $and: [
					   sequelize.where(
						   sequelize.fn('lower', sequelize.col('los_id')),
						   sequelize.fn('lower', request.los_id)
					   )

				   ]
			   }
		   })

		   const service_detail = await model.services
		   .findOne({
			   where: {
				   $and: [
					   sequelize.where(
						   sequelize.fn('lower', sequelize.col('service_id')),
						   sequelize.fn('lower', los_detail.service)
					   )

				   ]
			   }
		   })
		   const service_category = await model.service_categories
		   .findOne({
			   where: {
				   $and: [
					   sequelize.where(
						   sequelize.fn('lower', sequelize.col('category_id')),
						   sequelize.fn('lower', service_detail.service_category)
					   )

				   ]
			   }
		   })

		const users = await model.users.findOne( 
			
			{
			where: {
				user_id: los_detail.laundry_owner
			}
		})
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
			to: users.email,
			subject: 'EasyLaundry - Service Change Request ',
			html: '<p> Hi ' + users.first_name + ', </p> <br/> <p> We have Received Change Request in one of your EasyLaundry service. Below is the detail of change request' +
			'</p> <br/> <p> <b> Service Category: </b>  ' + ' ' + service_category.category+ '</p>'+
			'</p>  <p> <b> Service Name: </b>  ' + ' ' + service_detail.service_name+ '</p>'+
			'</p>  <p> <b> Description: </b>  ' + ' ' + request.description+ '</p>'+
			'<p> <b> Charges: </b>  ' + ' ' + request.charges+ '</p>'+
			'<p> EasyLaundry Administration will review your change Requests and Approve/Reject them. </P>'+
			'<br/><p> BR, </p> <p> EasyLaundry</p>',
	
			// text: 'Hi '+ user.first_name+ ', Your Request to Register with EasyLaundry has been received. Our Administration will review your informaion and Approve/Reject your account'
		};
	
		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});
	
	
res.status(200).send('Service Updated Successfully')
				return

		
	//    }

	//    });

});




router.post('/sendEmail',async function (req, res, next) {
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
  to: 'waqarnawab12@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
	

});


router.post('/approveServicesChangeRequest',async function (req, res, next) {
	let request = req.body.service;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	//    model.laundry_owner_services
	// 	   .findOne({
	// 		   where: {
	// 			   $and: [
	// 				   sequelize.where(
	// 					   sequelize.fn('lower', sequelize.col('service')),
	// 					   sequelize.fn('lower', request.service)
	// 				   ),
	// 				   sequelize.where(
	// 					   sequelize.fn('lower', sequelize.col('laundry_owner')),
	// 					   sequelize.fn('lower', request.laundry_owner)
	// 				   ),

	// 			   ]
	// 		   }
	// 	   })
	// 	   .then(data => {
	// 		   if (data) {

	// 				   res.status(400).send('The Service for this Laundry owner already Exist');
	// 				   return;
	// 			   }
	// 			   else {


	const service = await model.laundry_owner_services

			.update(
				{
					description: request.description,
					charges: request.charges
				},
				{
					where: {
						los_id: request.los_id
					}
				}
			)


			const delService = await model.services_change_requests

			.destroy(
				{
					where: {
						los_id: request.los_id
					}
				}
			)


			
		const los_detail = await model.laundry_owner_services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('los_id')),
						sequelize.fn('lower', request.los_id)
					)

				]
			}
		})

		const service_detail = await model.services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('service_id')),
						sequelize.fn('lower', los_detail.service)
					)

				]
			}
		})
		const service_category = await model.service_categories
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('category_id')),
						sequelize.fn('lower', service_detail.service_category)
					)

				]
			}
		})

	 const users = await model.users.findOne( 
		 
		 {
		 where: {
			 user_id: los_detail.laundry_owner
		 }
	 })
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
		 to: users.email,
		 subject: 'EasyLaundry - Service Change Request - Approved ',
		 html: '<p> Hi ' + users.first_name + ', </p> <br/> <p> Your Change Request for one of your EasyLaundry service has been approved. Below is the detail of change request' +
		 '</p> <br/> <p> <b> Service Category: </b>  ' + ' ' + service_category.category+ '</p>'+
		 '</p>  <p> <b> Service Name: </b>  ' + ' ' + service_detail.service_name+ '</p>'+
		 '</p>  <p> <b> Description: </b>  ' + ' ' + request.description+ '</p>'+
		 '<p> <b> Charges: </b>  ' + ' ' + request.charges+ '</p>'+
		 
		 '<br/><p> BR, </p> <p> EasyLaundry</p>',
 
		 // text: 'Hi '+ user.first_name+ ', Your Request to Register with EasyLaundry has been received. Our Administration will review your informaion and Approve/Reject your account'
	 };
 
	 transporter.sendMail(mailOptions, function (error, info) {
		 if (error) {
			 console.log(error);
		 } else {
			 console.log('Email sent: ' + info.response);
		 }
	 });

			result = {'msg':'Service Change Request Approved'}
				res.status(200).send(result)
				return

			
	
	//    }

	//    });

});


router.post('/retrieveAllChangeRequests', async function (req, res, next) {
	// let user = req.body;

	
	
	
	const data = await model.services_change_requests
		.findAll()
		
	if (data && data != null && data.length > 0) {
		for (var i = 0; i < data.length; i++) {
			
			const los = await model.laundry_owner_services.findOne({
				where: {
					$and: [
						sequelize.where(
							sequelize.fn('lower', sequelize.col('los_id')),
							sequelize.fn('lower', data[i].los_id)
						)
					]
				}
			})
			data[i].los_id = los
			
			const laundry_owner = await model.users
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('user_id')),
								sequelize.fn('lower', los.laundry_owner)
							)
						]
					}
				})
			const address = await model.address
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('address_id')),
								sequelize.fn('lower', laundry_owner.address)
							)
						]
					}
				})

				laundry_owner.address = address
				data[i].los_id.laundry_owner = laundry_owner
			const service = await model.services
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('service_id')),
								sequelize.fn('lower', data[i].los_id.service)
							)
						]
					}
				})

			const category =await model.service_categories
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('category_id')),
								sequelize.fn('lower', service.service_category)
							)
						]
					}
				})

				service.service_category = category
				data[i].los_id.service = service
		}

		result = {"data": data}
		return res.status(200).send(result);

	}
	else {
		result = { "msg": "No Change Request Exist" }
		return res.status(400).send(result);
	}

});



router.post('/rejectServicesChangeRequest',async function (req, res, next) {
	let request = req.body.service;

	// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
	//    model.laundry_owner_services
	// 	   .findOne({
	// 		   where: {
	// 			   $and: [
	// 				   sequelize.where(
	// 					   sequelize.fn('lower', sequelize.col('service')),
	// 					   sequelize.fn('lower', request.service)
	// 				   ),
	// 				   sequelize.where(
	// 					   sequelize.fn('lower', sequelize.col('laundry_owner')),
	// 					   sequelize.fn('lower', request.laundry_owner)
	// 				   ),

	// 			   ]
	// 		   }
	// 	   })
	// 	   .then(data => {
	// 		   if (data) {

	// 				   res.status(400).send('The Service for this Laundry owner already Exist');
	// 				   return;
	// 			   }
	// 			   else {



			const delService = await model.services_change_requests

			.destroy(
				{
					where: {
						los_id: request.los_id
					}
				}
			)



				
		const los_detail = await model.laundry_owner_services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('los_id')),
						sequelize.fn('lower', request.los_id)
					)

				]
			}
		})

		const service_detail = await model.services
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('service_id')),
						sequelize.fn('lower', los_detail.service)
					)

				]
			}
		})
		const service_category = await model.service_categories
		.findOne({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('category_id')),
						sequelize.fn('lower', service_detail.service_category)
					)

				]
			}
		})

	 const users = await model.users.findOne( 
		 
		 {
		 where: {
			 user_id: los_detail.laundry_owner
		 }
	 })
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
		 to: users.email,
		 subject: 'EasyLaundry - Service Change Request - Rejected ',
		 html: '<p> Hi ' + users.first_name + ', </p> <br/> <p> Your Change Request for one of your EasyLaundry service has been Rejected. Below is the detail of change request' +
		 '</p> <br/> <p> <b> Service Category: </b>  ' + ' ' + service_category.category+ '</p>'+
		 '</p>  <p> <b> Service Name: </b>  ' + ' ' + service_detail.service_name+ '</p>'+
		 '</p>  <p> <b> Description: </b>  ' + ' ' + request.description+ '</p>'+
		 '<p> <b> Charges: </b>  ' + ' ' + request.charges+ '</p>'+

		 '<br/><p> Please contact easylaundry.pk@gmail.com for further details.</p>'+
		 
		 '<br/><p> BR, </p> <p> EasyLaundry</p>',
 
		 // text: 'Hi '+ user.first_name+ ', Your Request to Register with EasyLaundry has been received. Our Administration will review your informaion and Approve/Reject your account'
	 };
 
	 transporter.sendMail(mailOptions, function (error, info) {
		 if (error) {
			 console.log(error);
		 } else {
			 console.log('Email sent: ' + info.response);
		 }
	 });


				result = {'msg':'Service Change Request Rejected'}
				res.status(200).send(result)
				return

			
	
	//    }

	//    });

});


router.get('/findAllCategories', function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL

	model.service_categories
		.findAll({

		})
		.then(data => {
			if (data) {
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
			if (data) {
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

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

router.post('/findByLaundryOwner', async function (req, res, next) {
	// let user = req.body;

	// CHECK IF THERE IS USER WITH THIS EMAIL
	laundry_owner_service = []
	// laundry_ser = []
	const data = await model.laundry_owner_services
		.findAll({
			where: {
				$and: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('laundry_owner')),
						sequelize.fn('lower', req.body.laundry_owner)
					)
				]
			}
		})
		
			if (!data || data.length <= 0) {
				return res.status(400).send("No Service Exist for this Laundry Owner");
			}
			else {

				const tax = await model.tax_details.findOne(


					{
						where: {
							$or: [
								sequelize.where(
									sequelize.fn('lower', sequelize.col('user')),
									sequelize.fn('lower', req.body.laundry_owner)
								),
							]
						}
					})
				laundry_owner_service = data

				resolveLaundryOwnerServiceData(req, res, laundry_owner_service, tax)
				// console.log(laundry_owner_service)
			}
			// laundry_ser = laundry_owner_service
	

		
	
});



async function resolveLaundryOwnerServiceData(req, res, laundry_owner_service, tax) {


  for (let i = 0; i < laundry_owner_service.length; i++) {
    // asyncForEach(laundry_owner_service, async (los) => {
    // await waitFor(50);
    // laundry_owner_service.forEach(myFunction);
    // async function myFunction(los, i) {

    // await Promise
    // console.log(i)
    lo_id = laundry_owner_service[i].laundry_owner
    service_id = laundry_owner_service[i].service
    console.log(service_id)


    try {
      const user = await model.users
      .findOne({
        where: {
          $and: [
            sequelize.where(
              sequelize.fn('lower', sequelize.col('user_id')),
              sequelize.fn('lower', req.body.laundry_owner)
            )
          ]
        }
      });
      laundry_owner_service[i].laundry_owner = user
      const address = await model.address
      .findOne({
        where: {
          $and: [
            sequelize.where(
              sequelize.fn('lower', sequelize.col('address_id')),
              sequelize.fn('lower', user.address)
            )
          ]
        }
      });
      laundry_owner_service[i].laundry_owner.address = address

      const service = await model.services
              .findOne({
                where: {
                  $and: [
                    sequelize.where(
                      sequelize.fn('lower', sequelize.col('service_id')),
                      sequelize.fn('lower', service_id)
                    )
                  ]
                }
              })
      laundry_owner_service[i].service = service

      const category = await model.service_categories
      .findOne({
        where: {
          $and: [
            sequelize.where(
              sequelize.fn('lower', sequelize.col('category_id')),
              sequelize.fn('lower', service.service_category)
            )
          ]
        }
      })
      laundry_owner_service[i].service.service_category = category;


    } catch (error) {
      res.status(400).send(error);
    }
  }

  const result = { 'services': laundry_owner_service, 'tax':  tax }
  return res.status(200).send(result);

}





// async function resolveLaundryOwnerServiceData(req, res, laundry_owner_service) {


// 	var i;
// 	for (i = 0; i < laundry_owner_service.length; i++) {
// 		// asyncForEach(laundry_owner_service, async (los) => {
// 		// await waitFor(50);
// 		// laundry_owner_service.forEach(myFunction);
// 		// async function myFunction(los, i) {

// 		// await Promise	
// 		// console.log(i)
// 		lo_id = laundry_owner_service[i].laundry_owner
// 		service_id = laundry_owner_service[i].service
// 		console.log(service_id)

// 		// console.log(laundry_ser)
// 		await Promise.resolve(model.users
// 			.findOne({
// 				where: {
// 					$and: [
// 						sequelize.where(
// 							sequelize.fn('lower', sequelize.col('user_id')),
// 							sequelize.fn('lower', req.body.laundry_owner)
// 						)
// 					]
// 				}
// 			})
// 			.then(user => {
// 				// console.log(laundry_ser)
// 				laundry_owner_service[i].laundry_owner = user

// 				Promise.resolve(model.address
// 					.findOne({
// 						where: {
// 							$and: [
// 								sequelize.where(
// 									sequelize.fn('lower', sequelize.col('address_id')),
// 									sequelize.fn('lower', user.address)
// 								)
// 							]
// 						}
// 					})).then(address => {
// 						laundry_owner_service[i].laundry_owner.address = address
// 						Promise.resolve(model.services
// 							.findOne({
// 								where: {
// 									$and: [
// 										sequelize.where(
// 											sequelize.fn('lower', sequelize.col('service_id')),
// 											sequelize.fn('lower', service_id)
// 										)
// 									]
// 								}
// 							})).then(service => {
// 								laundry_owner_service[i].service = service

// 								Promise.resolve(model.service_categories
// 									.findOne({
// 										where: {
// 											$and: [
// 												sequelize.where(
// 													sequelize.fn('lower', sequelize.col('category_id')),
// 													sequelize.fn('lower', service.service_category)
// 												)
// 											]
// 										}
// 									})).then(category => {
// 										laundry_owner_service[i].service.service_category = category

// 										if (i + 1 == laundry_owner_service.length) {
// 											result = { 'services': laundry_owner_service }
// 											return res.status(200).send(result);
// 										}

// 									})
// 							})
// 					})
// 			}))
// 	}

// }


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
			if (!data) {
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
