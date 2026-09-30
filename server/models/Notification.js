const m=require('mongoose');
module.exports=m.model('Notification',new m.Schema({taskId:{type:m.Schema.Types.ObjectId,ref:'Task'},title:String,message:String,type:String,isRead:{type:Boolean,default:false}},{timestamps:{createdAt:true,updatedAt:false}}));
