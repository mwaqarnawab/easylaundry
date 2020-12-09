var express = require('express');
var router = express.Router();
var model = require('../models/index');
var trans = require('../plugins/transaction');
var ba64 = require("ba64");
const fs = require('fs');
const parallel = require('async-await-parallel')


/* Include token authentication methods */
var auth_file = require('../middleware/authentication')
var createToken = auth_file.createToken
var verifyToken = auth_file.verifyToken

trans.setModel(model);
var sequelize = require('sequelize');
const { request } = require('express');
const order_comments = require('../models/order_comments');
const order_ratings_reviews = require('../models/order_ratings_reviews');





router.post('/getAllCustomerOrders', async function (req, res, next) {
    let customer_id = req.body.customer_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    orders = []
    // laundry_ser = []
    await Promise.resolve(model.orders
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('customer')),
                        sequelize.fn('lower', parseInt(customer_id))
                    )
                ]
            }
        }))
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Order Exist for this Customer"}
                return res.status(400).send(result);
            }
            else {
                orders = data
                resolveCustomerOrders(req, res, orders)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveCustomerOrders(req, res, orders) {


    for (let i = 0; i < orders.length; i++) {

        customer_id = orders[i].customer
        laundry_owner_service_id = orders[i].los
        order_status_id = orders[i].order_status



        try {
            const order_status = await model.order_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_status_id')),
                                sequelize.fn('lower', order_status_id)
                            )
                        ]
                    }
                });
            orders[i].order_status = order_status

            const laundry_owner_service = await model.laundry_owner_services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('los_id')),
                                sequelize.fn('lower', laundry_owner_service_id)
                            )
                        ]
                    }
                });
            orders[i].los = laundry_owner_service

            const service = await model.services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('service_id')),
                                sequelize.fn('lower', laundry_owner_service.service)
                            )
                        ]
                    }
                })
            orders[i].los.service = service

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
            orders[i].los.service.service_category = category;




            const laundry_owner = await model.users
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
            orders[i].los.laundry_owner = laundry_owner

            const laundry_address = await model.address
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
            orders[i].los.laundry_owner.address = laundry_address;



            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', customer_id)
                            )
                        ]
                    }
                })
            orders[i].customer = customer

            const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                })
            orders[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    const result = { 'orders': orders }
    return res.status(200).send(result);

}


router.post('/placeOrder', function (req, res, next) {
    order_detail = req.body.order
    order_detail.order_status = 1

    trans.execTrans(res, t => {
        return Promise.resolve(model.orders
            .create(order_detail, {
                transaction: t

            }))
            .then(order => {

                t.commit();
                result = { "msg": "Order have been placed, Please Wait for Laundry to Accept Your Order", "order": order }
                res.status(200).send(result)
                return
            });
    });
});




router.post('/addRatingAndReviews', function (req, res, next) {
    rating_review = req.body.rating_review

    trans.execTrans(res, t => {
        return Promise.resolve(model.order_ratings_reviews
            .create(rating_review, {
                transaction: t

            }))
            .then(rating_rev => {

                t.commit();
                result = { "msg": "Rating Added Successfully", "rating_reviews": rating_rev }
                res.status(200).send(result)
                return
            });
    });
});





router.post('/viewRatingsReviewsByLaundryOwner', async function (req, res, next) {
    let laundry_owner_id = req.body.laundry_owner_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL

    laundry_ser = []
    await Promise.resolve(model.order_ratings_reviews
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('laundry_owner')),
                        sequelize.fn('lower', parseInt(laundry_owner_id))
                    )
                ]
            }
        }))
        .then(data => {
            if (!data) {
                result = {"msg": "No Rating/Reviews Exist"}
                return res.status(400).send(result);
            }
            else {
                laundry_ser = data
                resolveLaundryRating(req, res, laundry_ser)
                // result = {"rating_reviews": data}
                // return res.status(200).send(result);
                
            }
          
        })



});


async function resolveLaundryRating(req, res, ratings_reviews) {


    for (let i = 0; i < ratings_reviews.length; i++) {

        order_id = ratings_reviews[i].order
        


        try {

            const order = await model.orders
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_id')),
                                sequelize.fn('lower', order_id)
                            )
                        ]
                    }
                });
        

            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', order.customer)
                            )
                        ]
                    }
                });

                const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                });
           
           customer.address = customer_address
           ratings_reviews[i].customer = customer
           


        } catch (error) {
            res.status(400).send(error);
        }
        
    }
   
    result = {"rating_reviews": ratings_reviews}
    return res.status(200).send(result);
    
   
}
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));





router.post('/viewOrderDetailByOrderId', async function (req, res, next) {
    let order_id = req.body.order_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    order_detail = null
    // laundry_ser = []
    await Promise.resolve(model.orders
        .findOne({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order_id')),
                        sequelize.fn('lower', parseInt(order_id))
                    )
                ]
            }
        }))
        .then(data => {
            if (!data) {
                result = {"msg": "No Order Exist"}
                return res.status(400).send(result);
            }
            else {
                order_detail = data
                getOrderDetails(req, res, order_detail)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});




async function getOrderDetails(req, res, orders) {

    

        customer_id = orders.customer
        laundry_owner_service_id = orders.los
        order_status_id = orders.order_status
        var order_comments = []
        var order_ratings_reviews = []


        try {
            const order_status = await model.order_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_status_id')),
                                sequelize.fn('lower', order_status_id)
                            )
                        ]
                    }
                });
            orders.order_status = order_status

            const laundry_owner_service = await model.laundry_owner_services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('los_id')),
                                sequelize.fn('lower', laundry_owner_service_id)
                            )
                        ]
                    }
                });
            orders.los = laundry_owner_service

            const service = await model.services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('service_id')),
                                sequelize.fn('lower', laundry_owner_service.service)
                            )
                        ]
                    }
                })
            orders.los.service = service

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
            orders.los.service.service_category = category;




            const laundry_owner = await model.users
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
            orders.los.laundry_owner = laundry_owner

            const laundry_address = await model.address
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
            orders.los.laundry_owner.address = laundry_address;



            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', customer_id)
                            )
                        ]
                    }
                })
            orders.customer = customer

            const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                })
            orders.customer.address = customer_address;

//             const order_comment = await model.order_comments
//             .findAll({
//                 where: {
//                     $and: [
//                         sequelize.where(
//                             sequelize.fn('lower', sequelize.col('order')),
//                             sequelize.fn('lower', orders.order_id)
//                         )
//                     ]
//                 }
//             })
//         order_comments = order_comment;


//             if(order_comments && order_comments.length >= 1){
//         for(var i=0;  i<order_comments.length; i++){
//                 const commented_by = await model.users
//         .findOne({
//             where: {
//                 $and: [
//                     sequelize.where(
//                         sequelize.fn('lower', sequelize.col('user_id')),
//                         sequelize.fn('lower', order_comments[i].comment_by)
//                     )
//                 ]
//             }
//         })
//     order_comments[i].comment_by = commented_by;

//     const commented_by_address = await model.address
//     .findOne({
//         where: {
//             $and: [
//                 sequelize.where(
//                     sequelize.fn('lower', sequelize.col('address_id')),
//                     sequelize.fn('lower', commented_by.address)
//                 )
//             ]
//         }
//     })
// order_comments[i].comment_by.address = commented_by_address;
//         }
//             }

        const order_ratings_review = await model.order_ratings_reviews
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order')),
                        sequelize.fn('lower', orders.order_id)
                    )
                ]
            }
        })
    order_ratings_reviews = order_ratings_review;




        } catch (error) {
            res.status(400).send(error);
        }
    

    const result = { 'orders': orders, /**'order_comments': order_comments,**/ 'order_ratings_reviews': order_ratings_reviews }
    return res.status(200).send(result);

}




router.post('/getLaundryOrdersByLaundryId', async function (req, res, next) {
    let laundry_owner_id = req.body.laundry_owner_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    orders = []
    // laundry_ser = []
    await Promise.resolve(model.orders
        .findAll())
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Order Exist for this Laundry"}
                return res.status(400).send(result);
            }
            else {
                orders = data
                resolveLaundryOrders(req, res, orders, laundry_owner_id)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveLaundryOrders(req, res, orders, laundry_owner_id) {


    for (let i = 0; i < orders.length; i++) {

        customer_id = orders[i].customer
        laundry_owner_service_id = orders[i].los
        order_status_id = orders[i].order_status



        try {

            const laundry_owner_service = await model.laundry_owner_services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('los_id')),
                                sequelize.fn('lower', laundry_owner_service_id)
                            )
                        ]
                    }
                });
                if(laundry_owner_service.laundry_owner != laundry_owner_id){
                    delete orders[i]
                    continue;
                }
            orders[i].los = laundry_owner_service

            const order_status = await model.order_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_status_id')),
                                sequelize.fn('lower', order_status_id)
                            )
                        ]
                    }
                });
            orders[i].order_status = order_status

            

            const service = await model.services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('service_id')),
                                sequelize.fn('lower', laundry_owner_service.service)
                            )
                        ]
                    }
                })
            orders[i].los.service = service

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
            orders[i].los.service.service_category = category;




            const laundry_owner = await model.users
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
            orders[i].los.laundry_owner = laundry_owner

            const laundry_address = await model.address
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
            orders[i].los.laundry_owner.address = laundry_address;



            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', customer_id)
                            )
                        ]
                    }
                })
            orders[i].customer = customer

            const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                })
            orders[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = orders.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'orders': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No Order Exist for this Laundry"}
       return res.status(200).send(result);
      }
   
    

}



router.post('/updateOrderByOrderIdAndStatus', async function (req, res, next) {
    let order_status = req.body.order.order_status;
    let order_id = req.body.order.order_id;
    let laundry_owner_id = req.body.order.laundry_owner_id
    // let comment = {
    //     "comment": req.body.order.comment,
    //     "order": order_id,
    //     "order_status": order_status,
    //     "comment_by": laundry_owner_id

    // }
 
    
const order = await model.orders.update(req.body.order, 
			
    {
    where: {
        order_id: order_id
    }
})
// if(req.body.order.comment != "" && req.body.order.comment != null){
//     const order_comment = await model.order_comments.create(comment)
// }

result = {"msg": "Order Updated Succesfully"}
return res.status(400).send(result);

});





router.post('/getAllOrderStatus', async function (req, res, next) {
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
   
    // laundry_ser = []
    await Promise.resolve(model.order_status
        .findAll())
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Status Exist in database"}
                return res.status(400).send(result);
            }
            else {
                result = {"order_status": data}
                return res.status(400).send(result);
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



router.post('/getOrdersByStatusAndaundryId', async function (req, res, next) {
    let order_status = req.body.order_status;
    let laundry_owner_id = req.body.laundry_owner_id;
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
    orders = []
    // laundry_ser = []
    await Promise.resolve(model.orders
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order_status')),
                        sequelize.fn('lower', parseInt(order_status))
                    )
                ]
            }
        }))
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Order Exist for this Laundry"}
                return res.status(400).send(result);
            }
            else {
                orders = data
                resolveOrdersByStatus(req, res, orders, laundry_owner_id)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveOrdersByStatus(req, res, orders, laundry_owner_id) {


    for (let i = 0; i < orders.length; i++) {

        customer_id = orders[i].customer
        laundry_owner_service_id = orders[i].los
        order_status_id = orders[i].order_status



        try {

            const laundry_owner_service = await model.laundry_owner_services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('los_id')),
                                sequelize.fn('lower', laundry_owner_service_id)
                            )
                        ]
                    }
                });
                if(laundry_owner_service.laundry_owner != laundry_owner_id){
                    delete orders[i]
                    continue;
                }
            orders[i].los = laundry_owner_service

            const order_status = await model.order_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_status_id')),
                                sequelize.fn('lower', order_status_id)
                            )
                        ]
                    }
                });
            orders[i].order_status = order_status

            

            const service = await model.services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('service_id')),
                                sequelize.fn('lower', laundry_owner_service.service)
                            )
                        ]
                    }
                })
            orders[i].los.service = service

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
            orders[i].los.service.service_category = category;




            const laundry_owner = await model.users
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
            orders[i].los.laundry_owner = laundry_owner

            const laundry_address = await model.address
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
            orders[i].los.laundry_owner.address = laundry_address;



            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', customer_id)
                            )
                        ]
                    }
                })
            orders[i].customer = customer

            const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                })
            orders[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = orders.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'orders': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No New Order Exist for this Laundry"}
       return res.status(200).send(result);
      }
   
    

}







router.post('/getOrdersByStatusAndCustomerId', async function (req, res, next) {
    let order_status = req.body.order_status;
    let customer_id = req.body.customer_id;
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
    orders = []
    // laundry_ser = []
    await Promise.resolve(model.orders
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order_status')),
                        sequelize.fn('lower', parseInt(order_status))
                    ),
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('customer')),
                        sequelize.fn('lower', parseInt(customer_id))
                    )

                ]
            }
        }))
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Order Exist for this Customer"}
                return res.status(400).send(result);
            }
            else {
                orders = data
                resolveOrdersByStatusCustomer(req, res, orders)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveOrdersByStatusCustomer(req, res, orders) {


    for (let i = 0; i < orders.length; i++) {

        customer_id = orders[i].customer
        laundry_owner_service_id = orders[i].los
        order_status_id = orders[i].order_status



        try {

            const laundry_owner_service = await model.laundry_owner_services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('los_id')),
                                sequelize.fn('lower', laundry_owner_service_id)
                            )
                        ]
                    }
                });
        
            orders[i].los = laundry_owner_service

            const order_status = await model.order_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order_status_id')),
                                sequelize.fn('lower', order_status_id)
                            )
                        ]
                    }
                });
            orders[i].order_status = order_status

            

            const service = await model.services
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('service_id')),
                                sequelize.fn('lower', laundry_owner_service.service)
                            )
                        ]
                    }
                })
            orders[i].los.service = service

            const rating_reviews = await model.order_ratings_reviews
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('order')),
                                sequelize.fn('lower', parseInt(orders[i].order_id))
                            )
                        ]
                    }
                })
                
                    if (!rating_reviews) {
                        orders[i].is_rating_done = 0
                    }
                    else{
                        orders[i].is_rating_done = 1
                    }

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
            orders[i].los.service.service_category = category;




            const laundry_owner = await model.users
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
            orders[i].los.laundry_owner = laundry_owner

            const laundry_address = await model.address
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
            orders[i].los.laundry_owner.address = laundry_address;



            const customer = await model.users
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('user_id')),
                                sequelize.fn('lower', customer_id)
                            )
                        ]
                    }
                })
            orders[i].customer = customer

            const customer_address = await model.address
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('address_id')),
                                sequelize.fn('lower', customer.address)
                            )
                        ]
                    }
                })
            orders[i].customer.address = customer_address;


           



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = orders.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'orders': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No New Order Exist for this Customer"}
       return res.status(200).send(result);
      }
   
}




router.post('/customerOrderStatistics', async function (req, res, next) {
    let customer_id = req.body.customer_id;


    let request_for_pickup = 0
    let request_accepted = 0
    let picked = 0
    let in_progress = 0
    let ready_for_delivery = 0
    let delivered = 0
    let rejected = 0
    let new_appointment = 0
    let appointment_accepted = 0
    let appointment_in_progress = 0
    let appointment_completed = 0
    let appointment_rejected = 0
    
    
    let b = 0
await parallel([

    async () => { 
        await Promise.resolve(model.appointments
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('appointment_status')),
                          sequelize.fn('lower', parseInt(1))
                      )
                  ]
              }
          }))
          .then(data => {
              new_appointment = data
              
       })
      },
  
      async () => { 
          await Promise.resolve(model.appointments
            .count({
                where: {
                    $and: [
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('customer')),
                            sequelize.fn('lower', parseInt(customer_id))
                        ),
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('appointment_status')),
                            sequelize.fn('lower', parseInt(2))
                        )
                    ]
                }
            }))
            .then(data => {
              appointment_accepted = data
                
         })
        },
  
        
      async () => { 
          await Promise.resolve(model.appointments
            .count({
                where: {
                    $and: [
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('customer')),
                            sequelize.fn('lower', parseInt(customer_id))
                        ),
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('appointment_status')),
                            sequelize.fn('lower', parseInt(3))
                        )
                    ]
                }
            }))
            .then(data => {
                appointment_in_progress = data
                
         })
        },
  
        
      async () => { 
          await Promise.resolve(model.appointments
            .count({
                where: {
                    $and: [
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('customer')),
                            sequelize.fn('lower', parseInt(customer_id))
                        ),
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('appointment_status')),
                            sequelize.fn('lower', parseInt(4))
                        )
                    ]
                }
            }))
            .then(data => {
                appointment_completed = data
                
         })
        },
  
        
      async () => { 
          await Promise.resolve(model.appointments
            .count({
                where: {
                    $and: [
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('customer')),
                            sequelize.fn('lower', parseInt(customer_id))
                        ),
                        sequelize.where(
                            sequelize.fn('lower', sequelize.col('appointment_status')),
                            sequelize.fn('lower', parseInt(5))
                        )
                    ]
                }
            }))
            .then(data => {
              appointment_rejected = data
                
         })
        },

        
    async () => { 
      await Promise.resolve(model.orders
        .count({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('customer')),
                        sequelize.fn('lower', parseInt(customer_id))
                    ),
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order_status')),
                        sequelize.fn('lower', parseInt(1))
                    )
                ]
            }
        }))
        .then(data => {
            request_for_pickup = data
            
     })
    },

    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(2))
                      )
                  ]
              }
          }))
          .then(data => {
            request_accepted = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(3))
                      )
                  ]
              }
          }))
          .then(data => {
            picked = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(4))
                      )
                  ]
              }
          }))
          .then(data => {
            in_progress = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(5))
                      )
                  ]
              }
          }))
          .then(data => {
            ready_for_delivery = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(6))
                      )
                  ]
              }
          }))
          .then(data => {
            delivered = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('customer')),
                          sequelize.fn('lower', parseInt(customer_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(7))
                      )
                  ]
              }
          }))
          .then(data => {
            rejected = data
              
       })
      },

  ], 12)
  const result = { "request_for_pickup": request_for_pickup , "request_accepted": request_accepted, 
  "picked": picked, "in_progress":in_progress, "ready_for_delivery":ready_for_delivery,
"delivered": delivered, "rejected":rejected, 
"new_appointment": new_appointment , "appointment_accepted": appointment_accepted, 
  "appointment_in_progress":appointment_in_progress,
 "appointment_completed": appointment_completed, "appointment_rejected":appointment_rejected}
  return res.status(200).send(result);


});




router.post('/laundryOrderStatistics', async function (req, res, next) {
    let laundry_owner_id = req.body.laundry_owner_id;


    let request_for_pickup = 0
    let request_accepted = 0
    let picked = 0
    let in_progress = 0
    let ready_for_delivery = 0
    let delivered = 0
    let rejected = 0
    let new_appointment = 0
    let appointment_accepted = 0
    let appointment_in_progress = 0
    let appointment_completed = 0
    let appointment_rejected = 0
    
      
await parallel([
    async () => { 
      await Promise.resolve(model.appointments
        .count({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                        sequelize.fn('lower', parseInt(laundry_owner_id))
                    ),
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('appointment_status')),
                        sequelize.fn('lower', parseInt(1))
                    )
                ]
            }
        }))
        .then(data => {
            new_appointment = data
            
     })
    },

    async () => { 
        await Promise.resolve(model.appointments
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('appointment_status')),
                          sequelize.fn('lower', parseInt(2))
                      )
                  ]
              }
          }))
          .then(data => {
            appointment_accepted = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.appointments
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('appointment_status')),
                          sequelize.fn('lower', parseInt(3))
                      )
                  ]
              }
          }))
          .then(data => {
            appointment_in_progress = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.appointments
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('appointment_status')),
                          sequelize.fn('lower', parseInt(4))
                      )
                  ]
              }
          }))
          .then(data => {
            appointment_completed = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.appointments
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('appointment_status')),
                          sequelize.fn('lower', parseInt(5))
                      )
                  ]
              }
          }))
          .then(data => {
            appointment_rejected = data
              
       })
      },

    async () => { 
      await Promise.resolve(model.orders
        .count({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                        sequelize.fn('lower', parseInt(laundry_owner_id))
                    ),
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('order_status')),
                        sequelize.fn('lower', parseInt(1))
                    )
                ]
            }
        }))
        .then(data => {
            request_for_pickup = data
            
     })
    },

    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(2))
                      )
                  ]
              }
          }))
          .then(data => {
            request_accepted = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(3))
                      )
                  ]
              }
          }))
          .then(data => {
            picked = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(4))
                      )
                  ]
              }
          }))
          .then(data => {
            in_progress = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(5))
                      )
                  ]
              }
          }))
          .then(data => {
            ready_for_delivery = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(6))
                      )
                  ]
              }
          }))
          .then(data => {
            delivered = data
              
       })
      },

      
    async () => { 
        await Promise.resolve(model.orders
          .count({
              where: {
                  $and: [
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('laundry_owner_id')),
                          sequelize.fn('lower', parseInt(laundry_owner_id))
                      ),
                      sequelize.where(
                          sequelize.fn('lower', sequelize.col('order_status')),
                          sequelize.fn('lower', parseInt(7))
                      )
                  ]
              }
          }))
          .then(data => {
            rejected = data
              
       })
      },

  ], 12)
  const result = { "request_for_pickup": request_for_pickup , "request_accepted": request_accepted, 
  "picked": picked, "in_progress":in_progress, "ready_for_delivery":ready_for_delivery,
"delivered": delivered, "rejected":rejected, 
"new_appointment": new_appointment , "appointment_accepted": appointment_accepted, 
  "appointment_in_progress":appointment_in_progress,
 "appointment_completed": appointment_completed, "appointment_rejected":appointment_rejected}
  return res.status(200).send(result);


});

module.exports = router;
