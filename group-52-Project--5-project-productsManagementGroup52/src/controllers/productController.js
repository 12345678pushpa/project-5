const productModel = require("../models/productModel")
const validator = require("validator")
const Validation = require("../validator/validation")
const bcrypt = require("bcrypt")
const jwt=require("jsonwebtoken")
//const saltRounds = 10;

const uploadFile= require ("../aws s3/aws")


const createProduct = async function (req, res) 
{
    try 
    {
        let data = req.body;
        let files = req.files;
      
        if (!Validation.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, msg: "please provide some data" })
        }

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data;



       if(!title){
           return res.status(400).send({status:false, msg:"title required..!!"})
        };

      

        if(!Validation.isValid(title)){
             return res.status(400).send({status:false, msg:"title required..!!"})
        };

       let duplicateTitle = await productModel.findOne({title:title});

       if(duplicateTitle) {
            return res.status(400).send({status:false, msg: "title already exist in use..!!"})
       };


       
    if(!description) {
        return res.status(400).send({status:false, msg:"description required..!!"})
    };

    if(!Validation.isValid(description)){
        return res.status(400).send({status:false, msg:"description required..!!"})
    };


    if(!price) {
        return res.status(400).send({status:false, msg: "price required..!!"})
    };
    if(!currencyId){ 
        return res.status(400).send({status:false, msg: "currencyId required..!!"})
    };
        
    if(!currencyFormat) {
        return res.status(400).send({status:false, msg: "currency format required..!!"})
    };

    // if(!Validation.isValidTitle(availableSizes)) {
    //     return res.status(400).send({status:false, msg: "please choose the size from the available sizes.!!"})
    // };
    if(currencyId != "INR"){
         return res.status(400).send({status:false, msg: "only indian currencyId INR accepted..!!"})
        };
    if(currencyFormat != "₹"){
         return res.status(400).send({status:false, msg: "only indian currency ₹ accepted..!!"})
        };
      
      
      
        if(!availableSizes){
            return res.status(400).send({status : false, message : "Available sizes must be provided"})
        }
        else{
            if(!Validation.isValid(availableSizes)){
                return res.status(400).send({status : false, message : "please provide valid input"})
            }

            let sizes = availableSizes.toUpperCase().split(",")
            let arr = ["S", "XS","M","X", "L","XXL", "XL"]

            if (!(arr)) {
                return res.status(400).send({status : false, message : "xyz"})
            }

           
            data['availableSizes'] = sizes
            
        }


    if (files.length > 0) 
    {
      var  profileImages = await uploadFile.uploadFile(files[0]);
    }

        data.productImage = profileImages;

     //  data.availableSizes = JSON.parse(availableSizes);

        if(!data.productImage) {
            return res.status(400).send({status:false, msg: "productImage required..!!"})
        };

        if (!Validation.isValid(availableSizes)) return res.status(400).send({ status: false, msg: "availableSizes feild is requried" })
        let array = availableSizes.split(",").map(x => x.trim()) //this will split the available sizes and give it an array

        for (let i = 0; i < array.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(array[i]))) {
                return res.status(400).send({ status: false, msg: `Available sizes must be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(',')}` })
            }
        }
     

      

        

        const saveData = await productModel.create(data);



       
        return res.status(201).send({ status: true, data: saveData });
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ status: false, msg: err.message }) 
    }
}

const getProductsById = async (req, res) => {
    try{
      let productId = req.params.productId;
  
      //checking is product id is valid or not
      if (!Validation.isValidObjectId(productId)){
        return res.status(400).send({ status: false, message: 'Please provide valid productId' })
      }
    
      const product = await productModel.findOne({ _id: productId, isDeleted:false})
      if(!product) return res.status(404).send({ status: false, message:"No product found"})
  
      return res.status(200).send({ status: true, message: 'success', data: product})
    } catch (err) {
      res.status(500).send({ status: false, error: err.message })
    }
  }


  const getByFilter = async (req,res)=>{
    try{
        let data = req.query 
        let filter = {
            isDeleted : false
        }

        let {name, size, priceSort, priceGreaterThan, priceLessThan} = data

        if(name){
            if(!Validation.isValid(name)){
                return res.status(400).send({status : false, message : "the name is missing in length"})
            }
            
          

            filter['title'] = { $regex: name, $options:"i" }
        }

        if(size){
            if(!Validation.isValid(size)){
                return res.status(400).send({status : false, message : "the size is missing in lenght"})
            }
    
            filter['availableSizes'] = size.toUpperCase()
        }
        
        if(priceGreaterThan){
            if(!Validation.isValid(priceGreaterThan)){
                return res.status(400).send({status : false, messsage : "Price greater than must have some length"})
            }

            if(isNaN(priceGreaterThan)){
                return res.status(400).send({status : false, message : "price greater than must be number"})
            }

            filter['price'] = {
                '$gt' : priceGreaterThan
            }
        }

        if(priceLessThan){
            if(!Validation.isValid(priceLessThan)){
                return res.status(400).send({status : false, messsage : "priceLessThan must have some length"})
            }

            if(isNaN(priceLessThan)){
                return res.status(400).send({status : false, message : "priceLessThan must be number"})
            }

            filter['price'] = {
                '$lt' : priceLessThan
            }
        }

        if(priceLessThan && priceGreaterThan){
            filter['price'] = { '$lt' : priceLessThan, '$gt' : priceGreaterThan}
        }

       if(priceSort){
            if(priceSort != 1 || priceSort != -1){
                return res.status(400).send({status : false, message : "Price sort only takes 1 or -1 as a value" })
            }
    

            let filterProduct = await product.find(filter).sort({price: priceSort})
    
            if(filterProduct.length>0){
                return res.status(200).send({status : false, message : "Success", data : filterProduct})
            }
            else{
                return res.status(404).send({status : false, message : "No products found with this query"})
            }
        } 
        else{
            let findProduct = await productModel.find(filter)
        
            if(findProduct.length>0){
                return res.status(200).send({status : false, message : "Success", data : findProduct})
            }
            else{
                return res.status(404).send({status : false, message : "No products found with this query"})
            }
        }

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })      
    }
}


  const deleteProduct = async function (req, res) {
    try {
      let id = req.params.productId;
  
      if (!Validation.isValidObjectId(id)) {
        return res.status(400).send({ status: false, message: `productId is invalid.` });
      }
  
      let findProduct = await productModel.findOne({ _id: id });
  
      if (!findProduct) {
        return res.status(404).send({ status: false, msg: "No such Product found" });
      }
  
      const alreadyDeleted= await productModel.findOne({_id: id, isDeleted: true})
  
      if(alreadyDeleted) {
        return res.status(404).send({ status: false, msg: `${alreadyDeleted.title} is already been deleted.` })
      }
  
      
      
      let data = await productModel.findOne({ _id: id });
      if (data.isDeleted == false) {
        let Update = await productModel.findOneAndUpdate(
          { _id: id },
          { isDeleted: true, deletedAt: Date() },
          { new: true }
        );
        return res.status(200).send({status: true,message: "successfully deleted the product",data:Update});
      } 
  
    } catch (err) {
        console.log(err)
      res.status(500).send({ status: false, Error: err.message });
    }
  };






  const updateProduct = async (req, res) => {
    try {
      const productId = req.params.productId;
  
      if (!Validation.isValidObjectId(productId))
        return res.status(400).send({ status: false, message: `${productId} is not valid objectId` });
  
      const findProduct = await productModel.findOne({
        _id: productId,
        isDeleted: false,
      });
      if (!findProduct) return res.status(404).send({ status: false, message: "Product not found"});
  
      let body = req.body;
      let { title, description,  price,style, availableSizes,installments,  isFreeShipping } = body;
  
      const newObj ={}
  
      const files = req.files;
      if (files && files.length > 0) {
        let productImage = await uploadFile(files[0]);
        newObj.productImage = productImage;
      }
  
      if (!(body && files))
        return res.status(400).send({ status: false, message: "Invalid Request" });
  
        if (title || title == "") {
            if (!Validation.isValid(title))
              return res.status(400).send({ status: false, message:{ status: false, message: "Please provide the title" }  });
      
               
              newObj.title = title;
          
  
        const findTitle = await productModel.findOne({ title: title });
        if (findTitle) return res.status(409).send({ status: false, message: "This title already exists" });
  
     
  
      }
      if (description || description == "") {
        if (!Validation.isValid(description))
          return res.status(400).send({ status: false, message:{ status: false, message: "Please provide the description" }  });
  
      newObj.description = description;      
      }
      if (price || price == "") {
        if (!Validation.isValid(price))
          return res.status(400).send({ status: false, message: "Please provide the price" });
  
        if (isNaN(Number(price)))
          return res.status(400).send({ status: false, message: "Price should be number" });
  
        if (Number(price) < 0)
          return res.status(400).send({ status: false, message: "Price should be positive" });
      newObj.price = price;      
  
      }
  
      if (style || style == "") {
        if (!Validation.isValid(style))
          return res.status(400).send({ status: false, message: "Please provide style" });
        newObj.style = style;      
  
      }
      if (installments || installments == "") {
        if (!Validation.isValid(installments))
          return res.status(400).send({ status: false, message: "Please provide installments" });
  
        if (isNaN(Number(installments))||!(Number.isInteger(Number(installments))))
          return res.status(400).send({ status: false, message: "Installments should be an integer" });
  
        if (Number(installments) < 0 )
          return res.status(400).send({ status: false, message: "Price should be positive" });
        newObj.installments = installments;      
      }
  
      if (isFreeShipping || isFreeShipping == "") {
        if (!Validation.isValid(isFreeShipping))
          return res.status(400).send({ status: false, message: "Please provide isFreeShipping" });
  
        if (["true", "false"].indexOf(isFreeShipping) == -1)
          return res.status(400).send({ status: false, message: "IsFreeShipping value should be true or false",});
        newObj.isFreeShipping = isFreeShipping;      
  
      }
  
      if(availableSizes||availableSizes==''){
          if (!Validation.isValid(availableSizes))
          return res.status(400).send({ status: false, message: "Please provide availableSizes" });
  
          availableSizes = JSON.parse(availableSizes);
          for (let i = 0; i < availableSizes.length; i++) {
            if (
              ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizes[i]) == -1
            )
              return res.status(400).send({ status: false, message: "invalid availableSizes selection" });
      }
      newObj.availableSizes = availableSizes;      
  
      }
  
      let updatedProduct = await productModel.findByIdAndUpdate(
        productId ,
        { $set: newObj },
        { new: true }
      );
      return res.status(200).send({ status: true, message: "Success", data: updatedProduct });
    } 
    catch (error) {
        console.log(error)
      return res.status(500).send({ status: false,message: error.message });
    }
  };



module.exports.createProduct=createProduct;
module.exports.getProductsById=getProductsById;
module.exports.deleteProduct=deleteProduct;
module.exports.getByFilter=getByFilter;
module.exports.updateProduct=updateProduct;
