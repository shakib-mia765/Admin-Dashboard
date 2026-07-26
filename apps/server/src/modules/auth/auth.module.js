import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@ultrafaang/validation';
import { env } from '../../config/env.js';
import { database } from '../../shared/database.js';
const router=Router();
router.post('/login',async(req,res,next)=>{try{const input=loginSchema.parse(req.body);const user=await database.user.findUnique({where:{email:input.email}});if(!user||!(await bcrypt.compare(input.password,user.passwordHash)))return res.status(401).json({success:false,message:'Invalid credentials'});const token=jwt.sign({sub:user.id,role:user.role},env.JWT_SECRET,{expiresIn:'1h'});res.cookie('accessToken',token,{httpOnly:true,sameSite:'lax',secure:env.NODE_ENV==='production'}).json({success:true,data:{id:user.id,name:user.name,role:user.role}});}catch(error){next(error);}});
export const authModule=router;
