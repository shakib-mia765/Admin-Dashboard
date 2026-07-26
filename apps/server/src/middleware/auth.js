import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function authenticate(req,res,next){const token=req.cookies?.accessToken??req.headers.authorization?.replace(/^Bearer\s+/,'');if(!token)return res.status(401).json({success:false,message:'Unauthorized'});try{req.user=jwt.verify(token,env.JWT_SECRET);next();}catch{return res.status(401).json({success:false,message:'Invalid token'});}}
export const authorize=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({success:false,message:'Forbidden'});
