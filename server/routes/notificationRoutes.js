const r=require('express').Router();const N=require('../models/Notification');
const w=f=>(q,s)=>f(q,s).catch(e=>s.status(500).json({message:e.message}));
r.get('/',w(async(q,s)=>s.json({notifications:await N.find().sort({createdAt:-1}).limit(50),unreadCount:await N.countDocuments({isRead:false})})));
r.patch('/read-all',w(async(q,s)=>{await N.updateMany({isRead:false},{isRead:true});s.json({ok:true});}));
r.patch('/:id/read',w(async(q,s)=>s.json(await N.findByIdAndUpdate(q.params.id,{isRead:true},{new:true}))));
r.delete('/:id',w(async(q,s)=>{await N.findByIdAndDelete(q.params.id);s.json({ok:true});}));
module.exports=r;
