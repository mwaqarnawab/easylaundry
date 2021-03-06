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





router.post('/getAllCustomerAppointments', async function (req, res, next) {
    let customer_id = req.body.customer_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    appointments = []
    // laundry_ser = []
    await Promise.resolve(model.appointments
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
                result = {"msg": "No appointment Exist for this Customer"}
                return res.status(400).send(result);
            }
            else {
                appointments = data
                resolveCustomerAppointments(req, res, appointments)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveCustomerAppointments(req, res, appointments) {


    for (let i = 0; i < appointments.length; i++) {

        customer_id = appointments[i].customer
        laundry_owner_service_id = appointments[i].los
        appointment_status_id = appointments[i].appointment_status



        try {
            const appointment_status = await model.appointment_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_status_id')),
                                sequelize.fn('lower', appointment_status_id)
                            )
                        ]
                    }
                });
                appointments[i].appointment_status = appointment_status

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
                appointments[i].los = laundry_owner_service

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
                appointments[i].los.service = service

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
                appointments[i].los.service.service_category = category;




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
                appointments[i].los.laundry_owner = laundry_owner

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
                appointments[i].los.laundry_owner.address = laundry_address;



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
                appointments[i].customer = customer

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
                appointments[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    const result = { 'appointments': appointments }
    return res.status(200).send(result);

}


router.post('/placeAppointment',async function (req, res, next) {
    appointment_detail = req.body.appointment
    appointment_detail.appointment_status = 1


    const tax = await model.tax_details.findOne(


		{
			where: {
				$or: [
					sequelize.where(
						sequelize.fn('lower', sequelize.col('user')),
						sequelize.fn('lower', appointment_detail.laundry_owner_id)
					),
				]
			}
		})
    
        if(tax && tax != null){
            tax_percentage = parseInt(tax.tax_percentage)
            appointment_detail.total_price += (parseInt(appointment_detail.total_price) * tax_percentage)/100
        }


   const appointments = await model.appointments
            .create(appointment_detail)
            

                result = { "msg": "Appointment have been placed, Please Wait for Laundry to Accept Your Appointment", "appointment": appointments }
                res.status(200).send(result)
                return
        
});




router.post('/addRatingAndReviews', function (req, res, next) {
    rating_review = req.body.rating_review

    trans.execTrans(res, t => {
        return Promise.resolve(model.appointment_ratings_reviews
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
    await Promise.resolve(model.appointment_ratings_reviews
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

        appointment_id = ratings_reviews[i].appointment
        


        try {

            const appointment = await model.appointments
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_id')),
                                sequelize.fn('lower', appointment_id)
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
                                sequelize.fn('lower', appointment.customer)
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





router.post('/viewAppointmentDetailByAppointmentId', async function (req, res, next) {
    let appointment_id = req.body.appointment_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    appointment_detail = null
    // laundry_ser = []
    await Promise.resolve(model.appointments
        .findOne({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('appointment_id')),
                        sequelize.fn('lower', parseInt(appointment_id))
                    )
                ]
            }
        }))
        .then(data => {
            if (!data) {
                result = {"msg": "No Appointment Exist"}
                return res.status(400).send(result);
            }
            else {
                appointment_detail = data
                getAppointmentDetails(req, res, appointment_detail)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});




async function getAppointmentDetails(req, res, appointments) {

    

        customer_id = appointments.customer
        laundry_owner_service_id = appointments.los
        appointment_status_id = appointments.appointment_status
        var appointment_comments = []
        var appointment_ratings_reviews = []


        try {
            const appointment_status = await model.appointment_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_status_id')),
                                sequelize.fn('lower', appointment_status_id)
                            )
                        ]
                    }
                });
                appointments.appointment_status = appointment_status

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
                appointments.los = laundry_owner_service

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
                appointments.los.service = service

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
                appointments.los.service.service_category = category;




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
                appointments.los.laundry_owner = laundry_owner

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
                appointments.los.laundry_owner.address = laundry_address;



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
                appointments.customer = customer

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
                appointments.customer.address = customer_address;

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

        const appointment_ratings_review = await model.appointment_ratings_reviews
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('appointment')),
                        sequelize.fn('lower', appointments.appointment_id)
                    )
                ]
            }
        })
        appointment_ratings_reviews = appointment_ratings_review;




        } catch (error) {
            res.status(400).send(error);
        }
    

    const result = { 'appointments': appointments, /**'order_comments': order_comments,**/ 'appointment_ratings_reviews': appointment_ratings_reviews }
    return res.status(200).send(result);

}




router.post('/getLaundryAppointmentsByLaundryId', async function (req, res, next) {
    let laundry_owner_id = req.body.laundry_owner_id;

    // CHECK IF THERE IS USER WITH THIS EMAIL
    appointments = []
    // laundry_ser = []
    await Promise.resolve(model.appointments
        .findAll())
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Appointment Exist for this Laundry"}
                return res.status(400).send(result);
            }
            else {
                appointments = data
                resolveLaundryAppointments(req, res, appointments, laundry_owner_id)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



async function resolveLaundryAppointments(req, res, appointments, laundry_owner_id) {


    for (let i = 0; i < appointments.length; i++) {

        customer_id = appointments[i].customer
        laundry_owner_service_id = appointments[i].los
        appointment_status_id = appointments[i].appointment_status



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
                    delete appointments[i]
                    continue;
                }
                appointments[i].los = laundry_owner_service

            const appointment_status = await model.appointment_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_status_id')),
                                sequelize.fn('lower', appointment_status_id)
                            )
                        ]
                    }
                });
                appointments[i].appointment_status = appointment_status

            

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
                appointments[i].los.service = service

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
                appointments[i].los.service.service_category = category;




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
                appointments[i].los.laundry_owner = laundry_owner

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
                appointments[i].los.laundry_owner.address = laundry_address;



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
                appointments[i].customer = customer

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
                appointments[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = appointments.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'appointments': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No Appointment Exist for this Laundry"}
       return res.status(200).send(result);
      }
   
    

}



router.post('/updateAppointmentByAppointmentIdAndStatus', async function (req, res, next) {
    let appointment_status = req.body.appointment.appointment_status;
    let appointment_id = req.body.appointment.appointment_id;
    let laundry_owner_id = req.body.appointment.laundry_owner_id
    // let comment = {
    //     "comment": req.body.order.comment,
    //     "order": order_id,
    //     "order_status": order_status,
    //     "comment_by": laundry_owner_id

    // }
 
    
const appointment = await model.appointments.update(req.body.appointment, 
			
    {
    where: {
        appointment_id: appointment_id
    }
})







if(appointment_status == 4){
    const appointment_detail = await model.appointments.findOne( 
			
        {
        where: {
            appointment_id: appointment_id
        }
    })
    total_price = appointment_detail.total_price
    const customer_financial_details = await model.financial_details.findOne( 
			
        {
        where: {
            user: appointment_detail.customer
        }
    })
    if(customer_financial_details){
        customer_financial_details.total_spending += total_price
        const update_customer_financial = await model.financial_details.update({
            total_spending: customer_financial_details.total_spending
        }, 
            
			
            {
            where: {
                user: appointment_detail.customer
            }
        })
    }
    else{
        const create_customer_financial = await model.financial_details.create( {
            total_spending: total_price,
            user: appointment_detail.customer,
            total_earning: 0
        }
        )
    }
    

    const laundry_financial_details = await model.financial_details.findOne( 
			
        {
        where: {
            user: appointment_detail.laundry_owner_id
        }
    })
    if(laundry_financial_details){
        laundry_financial_details.total_earning += total_price
        const update_laundry_financial = await model.financial_details.update( {
            total_earning: laundry_financial_details.total_earning
        }
            ,
			
            {
            where: {
                user: appointment_detail.laundry_owner_id
            }
        })
    }
    else{
        const create_laundry_financial = await model.financial_details.create( {
            total_spending: 0,
            user: appointment_detail.laundry_owner_id,
            total_earning: total_price
        }
            
        )
    }
    

    
}




// if(req.body.order.comment != "" && req.body.order.comment != null){
//     const order_comment = await model.order_comments.create(comment)
// }

result = {"msg": "Appointment Updated Succesfully"}
return res.status(400).send(result);

});





router.post('/getAllAppointmentStatus', async function (req, res, next) {
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
   
    // laundry_ser = []
    await Promise.resolve(model.appointment_status
        .findAll())
        .then(data => {
            if (!data || data.length <= 0) {
                result = {"msg": "No Status Exist in database"}
                return res.status(400).send(result);
            }
            else {
                result = {"appointment_status": data}
                return res.status(400).send(result);
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        })



});



router.post('/getAppointmentByStatusAndaundryId', async function (req, res, next) {
    let appointment_status = req.body.appointment_status;
    let laundry_owner_id = req.body.laundry_owner_id;
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
    appointments = []
    // laundry_ser = []
    const data = await model.appointments
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('appointment_status')),
                        sequelize.fn('lower', parseInt(appointment_status))
                    )
                ]
            }
        })
        
            if (!data || data == null ||data.length <= 0) {
                result = {"msg": "No Appointment Exist for this Laundry"}
                return res.status(400).send(result);
            }
            else {
                appointments = data
                resolveAppointmentsByStatus(req, res, appointments, laundry_owner_id)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
     



});



async function resolveAppointmentsByStatus(req, res, appointments, laundry_owner_id) {


    for (let i = 0; i < appointments.length; i++) {

        customer_id = appointments[i].customer
        laundry_owner_service_id = appointments[i].los
        appointment_status_id = appointments[i].appointment_status



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
                    delete appointments[i]
                    continue;
                }
                appointments[i].los = laundry_owner_service

            const appointment_status = await model.appointment_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_status_id')),
                                sequelize.fn('lower', appointment_status_id)
                            )
                        ]
                    }
                });
                appointments[i].appointment_status = appointment_status

            

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
                appointments[i].los.service = service

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
                appointments[i].los.service.service_category = category;




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
                appointments[i].los.laundry_owner = laundry_owner

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
                appointments[i].los.laundry_owner.address = laundry_address;



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
                appointments[i].customer = customer

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
                appointments[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = appointments.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'appointments': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No New Appointment Exist for this Laundry"}
       return res.status(200).send(result);
      }
   
    

}







router.post('/getAppointmentsByStatusAndCustomerId', async function (req, res, next) {
    let appointment_status = req.body.appointment_status;
    let customer_id = req.body.customer_id;
 

    // CHECK IF THERE IS USER WITH THIS EMAIL
    appointments = []
    // laundry_ser = []
    const data = await model.appointments
        .findAll({
            where: {
                $and: [
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('appointment_status')),
                        sequelize.fn('lower', parseInt(appointment_status))
                    ),
                    sequelize.where(
                        sequelize.fn('lower', sequelize.col('customer')),
                        sequelize.fn('lower', parseInt(customer_id))
                    )

                ]
            }
        })
        console.log("data is >>>>>>>>" + data)
            if (!data || data == null || data.length <= 0) {
                result = {"msg": "No Appointment Exist for this Customer"}
                return res.status(400).send(result);
            }
            else {
                appointments = data
                resolveAppointmentsByStatusCustomer(req, res, appointments)
                // console.log(laundry_owner_service)
            }
            // laundry_ser = laundry_owner_service
        



});



async function resolveAppointmentsByStatusCustomer(req, res, appointment) {


    for (let i = 0; i < appointments.length; i++) {

        customer_id = appointments[i].customer
        laundry_owner_service_id = appointments[i].los
        appointment_status_id = appointments[i].appointment_status



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
        
                appointments[i].los = laundry_owner_service

                const rating_reviews = await model.appointment_ratings_reviews
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment')),
                                sequelize.fn('lower', parseInt(appointments[i].appointment_id))
                            )
                        ]
                    }
                })
                
                    if (!rating_reviews) {
                        appointments[i].is_rating_done = 0
                    }
                    else{
                        appointments[i].is_rating_done = 1
                    }

            const appointment_status = await model.appointment_status
                .findOne({
                    where: {
                        $and: [
                            sequelize.where(
                                sequelize.fn('lower', sequelize.col('appointment_status_id')),
                                sequelize.fn('lower', appointment_status_id)
                            )
                        ]
                    }
                });
                appointments[i].appointment_status = appointment_status

            

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
                appointments[i].los.service = service

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
                appointments[i].los.service.service_category = category;




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
                appointments[i].los.laundry_owner = laundry_owner

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
                appointments[i].los.laundry_owner.address = laundry_address;



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
                appointments[i].customer = customer

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
                appointments[i].customer.address = customer_address;



        } catch (error) {
            res.status(400).send(error);
        }
    }

    var filtered = appointments.filter(function (el) {
		return el != null;
      });
      
      if(filtered && filtered.length > 0){
        const result = { 'appointments': filtered }
        return res.status(200).send(result);
      }
      else{
       const result = {"msg": "No New Appointment Exist for this Customer"}
       return res.status(200).send(result);
      }
   
}




router.post('/customerAppointmentStatistics', async function (req, res, next) {
    let customer_id = req.body.customer_id;


    let new_appointment = 0
    let appointment_accepted = 0
    let in_progress = 0
    let completed = 0
    let rejected = 0
    
    
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
            in_progress = data
              
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
            completed = data
              
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
            rejected = data
              
       })
      },

  ], 5)
  const result = { "new_appointment": new_appointment , "appointment_accepted": appointment_accepted, 
 "in_progress":in_progress,
"completed": completed, "rejected":rejected}
  return res.status(200).send(result);


});




router.post('/laundryAppointmentStatistics', async function (req, res, next) {
    let laundry_owner_id = req.body.laundry_owner_id;

    let new_appointment = 0
    let appointment_accepted = 0
    let in_progress = 0
    let completed = 0
    let rejected = 0
    
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
            in_progress = data
              
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
            completed = data
              
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
            rejected = data
              
       })
      },

      
  ], 7)
  const result = { "new_appointment": new_appointment , "appointment_accepted": appointment_accepted, 
  "in_progress":in_progress,
 "completed": completed, "rejected":rejected}
  return res.status(200).send(result);


});

module.exports = router;
