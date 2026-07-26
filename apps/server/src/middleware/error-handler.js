export function notFound(req,res){res.status(404).json({success:false,message:'Route not found'});}
export function errorHandler(error,req,res,next){req.log?.error(error);res.status(error.statusCode??500).json({success:false,message:error.statusCode?error.message:'Internal server error'});}
