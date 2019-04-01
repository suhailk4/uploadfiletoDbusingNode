const express=require('express');
const app=express();
const path=require('path');
const crypto=require('crypto');
const mongoose=require('mongoose');
const multer=require('multer');
const GridFsStorage=require('multer-gridfs-storage');
const Grid=require('gridfs-stream');
const methodOverride = require('method-override');


const mongoURI='mongodb://ahsan:ahsan@cluster0-shard-00-00-yezid.mongodb.net:27017,cluster0-shard-00-01-yezid.mongodb.net:27017,cluster0-shard-00-02-yezid.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true'
const conn=mongoose.createConnection(mongoURI,{useNewUrlParser: true});


app.set('view engine','ejs');
//bodyparser
app.use(express.urlencoded({extended:true}));

let gfs;
conn.once('open',  ()=> {
     gfs = Grid(conn.db, mongoose.mongo);
     gfs.collection('uploads');
   
    // all set!
  });

 
const storage = new GridFsStorage({
      url: mongoURI,
      file: (req, file) => {
      return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });


app.get('/',(req,res)=>{

    // res.render('index');

    gfs.files.find().toArray((err,files)=>{


        if(!files || files.length===0)
        {

            res.render('index',{files:false})
        
        }

        else{


            files.map((file)=>{


                if(file.contentType==='image/jpeg' || file.contentType==='image/png')
                {
                    file.isImage=true;
                }
                else{
                    file.isImage=false;
                }


            });

            res.render('index',{files:files})

        }

    })





});


app.post('/upload',upload.single('file'),(req,res)=>{

    // res.render('index');
    console.log(req.file);
  
    res.redirect('/');
});


app.get('/files',(req,res)=>{


  gfs.files.find().toArray((err,files)=>{

    if(!files || files.length===0)
    {
      return   res.status(404).json({
            err:'No files exist'
        })
    }
    return res.json(files)

  });

});


app.get('/files/:filename',(req,res)=>{

    gfs.files.findOne({filename:req.params.filename},(err,file)=>{

        if(!file)
        {
          return  res.status(404).json({
                err:'No files Exist'
            })
        
        }

        // return res.json(file);

        if(file.contentType==='image/jpeg' || file.contentType==='image/png')
        {


            let readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);

        }
        else{
            res.status(404).json({
                err:'Not and Image'
            })
        }


    })



});

app.delete('files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/');
    });
  });








const PORT=process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`Server is up on port ${PORT} `);
})