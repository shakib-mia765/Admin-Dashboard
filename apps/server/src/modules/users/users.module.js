import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { database } from '../../shared/database.js';
const router=Router();
router.get('/',authenticate,authorize('ADMIN','MANAGER'),async(req,res,next)=>{try{const data=await database.user.findMany({select:{id:true,name:true,email:true,role:true,status:true},orderBy:{createdAt:'desc'}});res.json({success:true,data});}catch(error){next(error);}});
export const usersModule=router;
