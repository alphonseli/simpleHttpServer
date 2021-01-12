const http= require('http');
const fs=require('fs');
const url=require('url');
const path=require('path');
const cfg={
	port:3000,
	root:__dirname,
	index:['index.html','index.htm','default.htm','default.html'],
	mime:{
		'.htm':'text/html',
		'.html':'text/html',
		'.jpg':'image/jpeg',
		'.png':'image/png',
		'.js':'application/x-scripts',
		'.css':'text/css',
	}
};
const util={
	
};
const methods={
	GET:(req,res)=>{
		let u=url.parse(req.url,true);
		let f=cfg.root.concat(u.pathname);
		let fstat=null;
		try{
			fstat=fs.statSync(f);
		}catch(e){
			res.writeHead(404,'file not exists');
			res.end();
			return;
		}
		if (fstat&&fstat.isDirectory())
		{
			let foundDoc=false;
			for (let i=0;i<cfg.index.length;i++){
				let f1=f.concat(cfg.index[i]);
				try{
					fstat=fs.statSync(f1);
				}catch(e){
					//
				}
				if (fstat&&fstat.isFile()){
					foundDoc=true;
					f=f1;
					break;
				}
			}
			
			if (!foundDoc)
			{
				res.writeHead(404,'file not exists');
				res.end();
				return;
			}
		}
		fs.open(f,(err,fd)=>{
			if (err){
				res.writeHead(500,'cannot open file '+err);
				res.end();
				fs.close();
				return;
			}
			let ext=path.extname(f);
			mimeType=cfg.mime[ext.toLowerCase()];
			if (!mimeType) mimeType='application/octet-stream';
			res.writeHead(200,{
				'Content-Type':mimeType
			});
			console.log('===> access :['+fd+'] '+f+' ext:'+ext+' mime:'+mimeType);
			let reader=(pos)=>{
				let buff=new Buffer.alloc(10240);
				fs.read(fd,buff,0,buff.length,pos,(err,len,buffer)=>{
					//console.log('read file '+fd+' ==> '+pos+' => '+len);
					if (err){
						//console.log(err);
						res.writeHead(500,'read file error '+err);
						res.end();
						fs && fs.closeSync(fd);
						return;
					}
					if (len>0){
						res.write(buffer.slice(0,len));
						reader(pos+len);
					}else{
						fs && fs.closeSync(fd);
						res.end();
						return;
					}
				})
			};
			reader(0);
		});
	},
	OTHER:(req,res)=>{
		console.log('not supported method '+req.method);
		res.writeHead(500,'not supported method '+req.method);
		res.end();
		return;
	},
};

http.createServer((req,res)=>{
	if(methods[req.method]){
		methods[req.method](req,res);
	}else{
		methods.OTHER(req,res);
	}
}).listen(cfg.port,()=>{
	console.log('server started successful, listen on '+cfg.port);
	var cp  = require('child_process')
	cp.exec('start chrome http://localhost:'+cfg.port);
});