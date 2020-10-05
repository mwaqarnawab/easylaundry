var express = require('express');
var router = express.Router();
var model = require('../models/index');
var trans = require('../plugins/transaction');
trans.setModel(model);
var sequelize = require('sequelize');

router.get('/', function(req, res, next) {
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


router.post('/checkIfUserExist', function(req, res, next) {
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
							sequelize.where(
								sequelize.fn('lower', sequelize.col('mobile_no')),
								sequelize.fn('lower', user.mobile_no)
							)
						]
					}
				})
				.then(data => {
					if (data) {
						res.status(400).send('Email/Mobile no is already Registered');
						return;
					}
					else{
						res.status(200).send('No User Found with this Email/Mobile no');
						return;
					}	
		});
});


router.post('/register', function(req, res, next) {
	let user_detail = req.body.user;
	let address_detail = req.body.address;

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
							sequelize.where(
								sequelize.fn('lower', sequelize.col('mobile_no')),
								sequelize.fn('lower', user_detail.mobile_no)
							)
						]
					}
				})
				.then(data => {
					if (data) {
						res.status(400).send('There is another user with this Email or Mobile No');
						return;
					}
					
					 trans.execTrans(res, t => {
						return Promise.resolve(model.address
							.create(address_detail, {
								transaction: t
								
							}))
							.then(address =>{
								
								user_detail.address = address.address_id
								model.users
							.create(user_detail, {
								transaction: t
							})
							.then(user =>{
								t.commit();
								res.status(200).send(user)
								return
								
								});
							})
							
					});
					});
		});
});


router.post('/changePassword', function(req, res, next) {
	let user = req.body;
	
			// CHECK IF THERE IS ANOTHER USER WITH THE SAME NAME
			model.users
				.findOne({
					where: {
						$and: [
							sequelize.where(
								sequelize.fn('lower', sequelize.col('user_id')),
								sequelize.fn('lower', user.user_id)
							)
						]
					}
				})
				.then(data => {
					if (data) {
						if(data.password == user.password){
							res.status(400).send('Password is same as old password');
							return;
						}
						else{
							
							trans.execTrans(res, t => {
								return Promise.resolve(model.users
									.update(
										{
											password: user.password,
										},
										{
											where: {
												user_id: user.user_id
											},
											transaction: t,
											individualHooks: true
										}
									))
									.then(user =>{
										t.commit();
										res.status(200).send('Pasword Updated Successfully')
										return
										
										});
									})
						}	
					}
					else{
						res.status(400).send('No User Exist with this id');
							return;
					}
					});
	
});


router.post('/login', function(req, res, next) {
	let user = req.body;
	
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
						
							res.status(200).send('You are logged In to app');
							return;
						}
						
					else{
						res.status(400).send('Incorrect Email or Password');
							return;
					}
					
				});

	
});


router.post('/register', function(req, res, next) {
	let user_detail = req.body.user;
	let address_detail = req.body.address;

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
							sequelize.where(
								sequelize.fn('lower', sequelize.col('mobile_no')),
								sequelize.fn('lower', user_detail.mobile_no)
							)
						]
					}
				})
				.then(data => {
					if (data) {
						res.status(400).send('There is another user with this Email or Mobile No');
						return;
					}
					
					 trans.execTrans(res, t => {
						return Promise.resolve(model.address
							.create(address_detail, {
								transaction: t
								
							}))
							.then(address =>{
								
								user_detail.address = address.address_id
								model.users
							.create(user_detail, {
								transaction: t
							})
							.then(user =>{
								t.commit();
								res.status(200).send(user)
								return
								
								});
							})
							
					});
		

				// return trans.execTrans(res, t => {
				// 		// console.log(vm.address)
				// 		return model.users
				// 			.create(user_detail, {
				// 				transaction: t
				// 			})
				// 			.then(user =>{
				// 				res.status(200).send(user)
				// 				return
								
				// 				});
								
							
				// 		});	
					});
		});
});

router.put('/', function(req, res, next) {
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
									sequelize.where(sequelize.col('user_id'), {$not: vm.user_id})
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
router.delete('/', function(req, res, next) {
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
