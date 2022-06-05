const orderModel= require('../models/orderModel')
const cartModel= require('../models/cartModel')
const Validation= require('../validator/validation')
const userModel= require('../models/userModel')
const productModel= require('../models/productModel')

const createOrder = async (req, res)=>{
  try{
      let userId = req.params.userId
      let tokenId = req.userId

      if(!Validation.isValid(userId)){
          return res.status(400).send({status : false, messsage : "user Id is missing in length"})
      }

      if(!Validation.isValidObjectId(userId)){
          return res.status(400).send({status : false, message : "Please provide a valid user Id"})
      }

      let findUser = await userModel.findById({_id : userId})
      if(findUser){
          if(tokenId != userId){
              return res.status(401).send({status : false, message :"you are unauthorized to do this"})
          }
      }else{
          return res.status(404).send({status : false, message : "No user with this id exists"})
      }

      let data = req.body

      if(!Validation.isValidRequestBody(data)){
          return res.status(400).send({status : false, message : "No input has been provided"})
      }

      let {cartId, status, cancellable} = data
      
      if(!cartId){
          return res.status(400).send({status : false, message : "Cart Id is a required field"})
      }

      if(!Validation.isValid(cartId)){
          return res.status(400).send({status: false, message : "Cart id is missing in length"})
      }

      if(Validation.isValidObjectId(cartId)=== false){
          return res.status(400).send({status : false, message : "please provide a valid cartId"})
      }

      if(status){
          if(!Validation.isValidStatus(status)){
              return res.status(400).send({status : false, message : " status can only be, 'pending', 'completed' or 'canceled"})
          }
      }

      if(cancellable){
          if(["true", "false"].includes(cancellable) === false){
              return res.status(400).send({status : false, message : "cancellable only take a boolean value"})
          }
      }

      let findCart = await cartModel.findById({_id : cartId})

      if(!findCart){
          return res.status(404).send({status : false, message : " No cart with this cart id exists"})
      }

      if(findCart.userId != userId){
          return res.status(401).send({status : false, message : "This cart does not belong to you"})
      }

      let totalQuantity = 0;
      for(let i in findCart.items){
          totalQuantity += findCart.items[i].quantity
       }

      let orderData = {
          userId : userId,
          items : findCart.items,
          totalPrice : findCart.totalPrice,
          totalItems : findCart.totalItems,
          totalQuantity : totalQuantity,
          status : status,
          cancellable : cancellable
      }

      let createOrder = await orderModel.create(orderData)
      
      return res.status(201).send({status : true, message : "order created successfully", data : createOrder})

  } catch (error) {
       return res.status(500).send({ status: "error", message: error.message });
  }
}

const updateOrder= async function (req,res) {
    try{
      const userId= req.params.userId;
      const requestBody= req.body
      const tokenId = req.userId
      if (!Validation.isValidRequestBody(requestBody)){
        return res.status(400).send({ status: false, message:"Please provide some input" })
      }

      const {orderId, status}= requestBody

      if (!orderId){
        return res.status(400).send({ status: false, message:`Please provide order id`})
      }

      if(!Validation.isValidObjectId(orderId)){
        return res.status(400).send({ status: false, message:"Please provide valid order id" })
      }

     


      if(!Validation.isValidObjectId(userId)){
        return res.status(400).send({ status: false, message:"Please provide valid user id" })
      }

      const userExist= await userModel.findOne({_id: userId}) 
      if (!userExist){
        return res.status(404).send({ status: false, message:"User does not exist" })
      }

      if (userExist._id.toString() != tokenId) {
        res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        return
    }



      const userOrder= await orderModel.findOne({_id: orderId}) 
       
          if (!userOrder) {
            return res.status(404).send({ status: false, message:"This Order do not belong to the user." }) 
            console.log(userOrder)   
      }
      if(userOrder.userId != userId){
        return res.status(400).send({status:false,msg:"This order does not belongs to you"})
      }
        

      if (!status) {
        return res.status(400).send({ status: false, message:"please provide a status" }) 
      }

   

      if (!Validation.isValidStatus(status)) {
        return res
            .status(400)
            .send({
                status: false,
                message: "Invalid ,Please Choose either 'pending','completed', or 'cancelled'."
            });
    }

    //if cancellable is true then status can be updated to any of te choices.
    if (userOrder["cancellable"] == true) {
        if ((Validation.isValidStatus(status))) {
            if (userOrder['status'] == 'pending') {
                const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, {
                    $set: { status: status }
                }, { new: true })
                return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updateStatus })
            }

            //if order is in completed status then nothing can be changed/updated.
            if (userOrder['status'] == 'completed') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in completed status.` })
            }

            //if order is already in cancelled status then nothing can be changed/updated.
            if (userOrder['status'] == 'cancelled') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in cancelled status.` })
            }
        }
    }
    //for cancellable : false
    if (userOrder['status'] == "completed") {
        if (status) {
            return res.status(400).send({ status: false, message: `Cannot update or change the status, because it's already in completed status.` })
        }
    }

    if (userOrder['status'] == "cancelled") {
        if (status) {
            return res.status(400).send({ status: false, message: `Cannot update or change the status, because it's already in cancelled status.` })
        }
    }

    if (userOrder['status'] == "pending") {
        if (status) {
            if (status == "cancelled") {
                return res.status(400).send({ status: false, message: `Cannot cancel the order due to Non-cancellable policy.` })
            }
            if (status == "pending") {
                return res.status(400).send({ status: false, message: `Cannot update status from pending to pending.` })
            }

            const updatedOrderDetails = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })

            return res.status(200).send({ status: true, message: `Successfully updated the order details.`, data: updatedOrderDetails })
           
        }
    }

} catch (err) {
    return res.status(500).send({ status: false, message: err.message });
}
}
    
   



module.exports.createOrder=createOrder;
module.exports.updateOrder=updateOrder;
