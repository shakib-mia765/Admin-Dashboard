import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma=new PrismaClient();
try{await prisma.user.upsert({where:{email:'admin@example.com'},update:{},create:{email:'admin@example.com',name:'System Admin',passwordHash:await bcrypt.hash('ChangeMe123!',12),role:'ADMIN'}});}finally{await prisma.$disconnect();}
