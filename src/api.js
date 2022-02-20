const express = require("express");
const serverless = require("serverless-http");
const mysql = require("mysql2");
var nodemailer = require('nodemailer');

const app = express();
const cors = require('cors');
app.use(cors());
app.options('*', cors());
const router = express.Router();

const otpGen = () => {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++ ) {
      OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
var pool = mysql.createConnection({
  host     : 'remotemysql.com',
  port     :  3306,
  user     : 'y39M6kKqGw',
  password : 'rCDaLTRaap',
  database : 'y39M6kKqGw',
});

router.get("/check_db_con", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  pool.connect(function(err,result) {
    if (err) throw err;
    else {
      
      // res.send(result)
      pool.query('SELECT email FROM users', 
      (err, result) => {
        if(err){
          res.json({db_error: err});
        }
        else {
          res.status(200).json(result);
        }
      });
    }
  });
  
});

router.post("/register", (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': "Authorization, Content-Type"
  })
  const { email, password } = req.body;
  const values = JSON.parse(req.body)
  const verified = false;
  const otp = '';
  db.connect(function (err, result) {
    if (err) throw err;
    else {
      db.query(`SELECT EXISTS(SELECT * FROM users WHERE email='${email}')`,
        (err, result) => {
          if (err) {
            throw err;
          }
          else {
            result = JSON.parse(JSON.stringify(result));
            // res.send(result)
            var val;
            for (var key in result) {
              val = result[key];
              result = val;
              for (key in result) {
                val = result[key];
              }
              if (val === 0) {
                db.query("INSERT INTO users (email, password, verified, otp) VALUES (?,?,?,?)",
                  [email, password, verified, otp],
                  (err, result) => {
                    if (err) {
                      console.log(err);
                    } else {
                      res.send({ user: "created" });
                    }
                  })
              }
              else {
                res.send({ userExists: 1 })
              }
            }
          }
        });
    }
    });

});
router.post("/verifyOtp", (req, res) => {
const { email, otp } = req.body;
const verified = false;
// console.log(otp);

db.query(`UPDATE users SET verified=${true}, otp='' WHERE email='${email}' and otp='${otp}'`,
(err, result) => {
  if(err) {
    console.log("wrong otp");
  }
  else{
    db.query(`SELECT verified FROM users WHERE email='${email}'`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        result = JSON.parse(JSON.stringify(result))
        res.json(result);
      }
    })
  }
});
});

router.post(("/mail"),async (req,res)=>{
const tomail=req.body.tomail
let localPart = tomail.split('@');
const newOtp = otpGen(); 
var transporter = nodemailer.createTransport({
  service: 'Gmail',

  auth: {
    user: 'websitefeedback.codestrix@gmail.com',
    pass: 'CodeStrix@123',
  }
});

var mailOptions = {
  from: process.env.FromMail,
  to: tomail,
  subject: 'Verification for Codestrix account',
  text: `your OTP for Verification is ${newOtp}`       
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    res.json({
      error: error,
      msg: 'fail'
    });
  } 
  else{
    db.query(`UPDATE users SET otp=${newOtp} WHERE email='${tomail}'`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("otp stored");
      }
    })
    res.json({
      msg: 'success'
    })
  }
});

})


router.post("/login", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { email, password } = req.body;
  const resResult = "";
  // db.query(`SELECT EXISTS(SELECT * FROM users WHERE email='${email}')`,
  // (err, result)=>{
  //   if(err){
  //     console.log(err);
  //   }
  //   else{
  //     result = JSON.parse(JSON.stringify(result));
  //     // console.log(result)
  //     // res.send(result)
  //     var val;
  //     for (var key in result) {
  //       val = result[key];
  //       result = val;
  //       for(key in result){
  //         val = result[key];
  //       }
  //     if(val === 1){
  //       db.query(`SELECT verified FROM users WHERE email='${email}' and password='${password}'`,
  //       (err, result) => {
  //         if(err){
  //           console.log(err);
  //         }
  //         else{
  //           result = JSON.parse(JSON.stringify(result));
  //           res.setHeader('Access-Control-Allow-Origin', '*');
  //           res.json(result)
  //         }
  //       })
  //     }
  //     else {
  //       res.setHeader('Access-Control-Allow-Origin', '*');
  //       res.json({user: "email does not exists"})
  //     }
  res.send(req.body)
    // }
    // console.log(val)
  //   }
  // })
  
});

router.get("/", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    Responses: "Api connection works properly!"
  });
});

// app.use(cors({origin: 'https://yuvarajamaniraj.netlify.app'}));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
