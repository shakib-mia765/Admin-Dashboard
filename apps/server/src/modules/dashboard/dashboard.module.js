import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { database } from '../../shared/database.js';
const router=Router();
router.get('/',authenticate,async(req,res,next)=>{try{const users=await database.user.count();res.json({success:true,data:{users,revenue:84200,conversion:6.8}});}catch(error){next(error);}});
export const dashboardModule=router;
